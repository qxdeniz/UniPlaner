import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './ChatStyles.css';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      const res = await axios.post('http://localhost:8000/gpt', {
        prompt: input
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
  };

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
