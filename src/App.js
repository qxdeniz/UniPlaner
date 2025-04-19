import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

// Utility functions for cookies
function setCookie(name, value, days) {
  const expires = days
    ? "; expires=" + new Date(Date.now() + days * 864e5).toUTCString()
    : "";
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}

export default function App() {
  const [token, setToken] = useState("");
  
  useEffect(() => {
    const savedToken = getCookie("token");
    if (savedToken) setToken(savedToken);
  }, []);

  return (
    <Router>
      <div className="app">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {!token && <li><Link to="/login">Login</Link></li>}
            {!token && <li><Link to="/signup">Signup</Link></li>}
            {token && <li><Link to="/dashboard">Dashboard</Link></li>}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home token={token} />} />
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup setToken={setToken} />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth token={token}>
                <Dashboard token={token} setToken={setToken} />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function Home({ token }) {
  return (
    <div>
      <h2>Home</h2>
      {token && (
        <p>
          Your token is: <code>{token}</code>
        </p>
      )}
      {!token && <p>Please login or signup.</p>}
    </div>
  );
}

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://0.0.0.0:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      const data = await res.json();
      setCookie("token", data.access_token, 7);
      setToken(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function Signup({ setToken }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://0.0.0.0:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, name, group, email }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Signup failed");
      }
      // After successful signup, log in automatically
      const loginRes = await fetch("http://0.0.0.0:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) throw new Error("Auto-login failed");
      const loginData = await loginRes.json();
      setCookie("token", loginData.access_token, 7);
      setToken(loginData.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Signup error, please try again");
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Phone:</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label>Name:</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Group:</label>
          <input value={group} onChange={(e) => setGroup(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Signup</button>
      </form>
    </div>
  );
}

// Updated Dashboard component to fetch and display user info using the token
function Dashboard({ token, setToken }) {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("http://0.0.0.0:8000/userinfo", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setUserInfo(data);
      } catch (err) {
        console.error(err);
      }
    }
    if (token) fetchUserInfo();
  }, [token]);

  const handleLogout = () => {
    setCookie("token", "", -1);
    setToken("");
    navigate("/");
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {userInfo ? (
        <pre>{JSON.stringify(userInfo, null, 2)}</pre>
      ) : (
        <p>Loading user information...</p>
      )}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

function RequireAuth({ token, children }) {
  let location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}