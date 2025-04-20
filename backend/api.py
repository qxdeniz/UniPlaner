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
from parser.chat import analyze_sheldule
import aiohttp  # Добавьте в начало файла

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        
    allow_credentials=True,
    allow_methods=["*"],       
    allow_headers=["*"],
)


DATABASE_URL = "mysql+mysqlconnector://user:password@localhost/uniplaner"  
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


Base.metadata.create_all(bind=engine)


SECRET_KEY = "key" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ORM Model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)  
    hashed_password = Column(String(128), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)  
    group = Column(String(50), nullable=False)  

Base.metadata.create_all(bind=engine)


class UserCreate(BaseModel):
    phone: str
    password: str
    email: EmailStr   
    name: str
    group: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ScheduleRequest(BaseModel):
    prompt: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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


@app.post("/signup")
def register(user: UserCreate, db: Session = Depends(get_db)):

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
    

    access_token = create_access_token(new_user.email)
    return {
        "msg": "User created successfully",
        "username": new_user.username,
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(db_user.email)  
    return {"access_token": token, "token_type": "bearer"}

@app.get("/userinfo")
def userinfo(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "name": current_user.name,    
        "group": current_user.group    
    }

@app.post("/gpt")
def analyze_schedule(request: ScheduleRequest):
    try:
        result = analyze_sheldule(request.prompt, 2)
        return {"answer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/test-connection")
def test_connection(db: Session = Depends(get_db)):

    user_count = db.query(User).count()
    return {"msg": "Connection successful", "users_count": user_count}

@app.get("/events")
async def get_events():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('https://media.kpfu.ru/anons') as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"KFU API returned status code {response.status}"
                    )
                return await response.text()
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
