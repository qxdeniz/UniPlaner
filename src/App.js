import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Schedule from './home';
import './forms.css';

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

function removeCookie(name) {
  setCookie(name, "", -1);
}

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <img src="/logo.svg" alt="УниПланер" className="logo" />
      <h1 className="auth-title">УниПланер</h1>
      <h2 className="auth-subtitle">Управляй своим расписанием</h2>
      <div className="welcome-buttons">
        <button onClick={() => navigate('/login')}>Войти</button>
        <button onClick={() => navigate('/signup')}>Зарегистрироваться</button>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState("");
  
  useEffect(() => {
    const savedToken = getCookie("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleLogout = () => {
    removeCookie("token");
    setToken("");
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!token ? <Welcome /> : <Navigate to="/home" />} />
        <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/home" />} />
        <Route path="/signup" element={!token ? <Signup setToken={setToken} /> : <Navigate to="/home" />} />
        <Route 
          path="/home" 
          element={token ? <Schedule token={token} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
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
      navigate("/", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-container">
      <img src="/logo.svg" alt="УниПланер" className="logo" />
      <div className="auth-toggle">
        <button className="active">Вход</button>
        <button onClick={() => navigate('/signup')}>Регистрация</button>
      </div>
      <h1 className="auth-title">войти в аккаунт</h1>
      <h2 className="auth-subtitle">введи email и пароль для входа</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Пароль"
        />
        <button type="submit">Продолжить</button>
      </form>
      <button 
        className="auth-link"
        onClick={() => navigate('/signup')}
      >
        Ещё нет аккаунта? Зарегистрируйтесь
      </button>
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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Signup error, please try again");
    }
  };

  return (
    <div className="auth-container">
      <img src="/logo.svg" alt="УниПланер" className="logo" />
      <div className="auth-toggle">
        <button onClick={() => navigate('/login')}>Вход</button>
        <button className="active">Регистрация</button>
      </div>
      <h1 className="auth-title">создать аккаунт</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          placeholder="Имя"
        />
        <input 
          value={group} 
          onChange={(e) => setGroup(e.target.value)} 
          required 
          placeholder="Номер группы"
        />
        <input 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
          placeholder="Номер телефона"
        />
        <input 
          type="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Пароль"
        />
        <button type="submit">Продолжить</button>
      </form>
      <button 
        className="auth-link"
        onClick={() => navigate('/login')}
      >
        Уже есть аккаунт? Войдите
      </button>
    </div>
  );
}