import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChatStyles.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const sendMessage = useCallback(async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage = { from: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post('http://localhost:8000/gpt', {
        prompt: textToSend
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const botMessage = { from: 'bot', text: res.data.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Ошибка при получении ответа' }]);
    }
  }, []); // Убираем input из зависимостей

  useEffect(() => {
    if (location.state?.initialMessage) {
      const message = location.state.initialMessage;
      setInput(message);
      setTimeout(() => {
        sendMessage(message);
      }, 0);
    }
  }, []); // Эффект выполнится только при монтировании

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="chat-page">
      <button className="back-button" onClick={handleBack}>
        <FiArrowLeft /> Назад
      </button>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.from}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Введите сообщение..."
          />
          <button onClick={sendMessage}>
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
