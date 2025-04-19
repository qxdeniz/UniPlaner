from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, or_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import jwt as pyjwt  # Renamed import
import datetime
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all origins; adjust as needed
    allow_credentials=True,
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],
)

# Database setup: подключение устанавливается здесь
DATABASE_URL = "mysql+mysqlconnector://user:password@localhost/uniplaner"  # update with your credentials
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Создание таблицы "users" в базе, если её ещё нет
Base.metadata.create_all(bind=engine)

# JWT & Password Hashing
SECRET_KEY = "your_secret_key"  # use a strong key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ORM Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)  # new field
    hashed_password = Column(String(128), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)  # new field
    name = Column(String(100), nullable=False)  # new field: имя пользователя
    group = Column(String(50), nullable=False)  # new field: группа пользователя

Base.metadata.create_all(bind=engine)

# Schemas
class UserCreate(BaseModel):
    phone: str
    password: str
    email: EmailStr    # Added email field with validation
    name: str
    group: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT generation helper
def create_access_token(email: str):
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "exp": expire}
    token = pyjwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Endpoint for user registration
@app.post("/signup")
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if phone or email already registered
    if db.query(User).filter(User.phone == user.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    gen_username = f"user_{user.phone[-4:]}"
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=gen_username,
        phone=user.phone,
        hashed_password=hashed_password,
        email=user.email,
        name=user.name,
        group=user.group
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid input data")
    
    # Generate access token immediately after registration
    access_token = create_access_token(new_user.email)
    return {
        "msg": "User created successfully",
        "username": new_user.username,
        "access_token": access_token,
        "token_type": "bearer"
    }

# Endpoint for user login
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(db_user.email)  # Changed from username to email
    return {"access_token": token, "token_type": "bearer"}

@app.get("/userinfo")
def userinfo(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,     # new field output
        "group": current_user.group    # new field output
    }

@app.get("/test-connection")
def test_connection(db: Session = Depends(get_db)):
    # Тестовое подключение к таблице "users"
    user_count = db.query(User).count()
    return {"msg": "Connection successful", "users_count": user_count}
