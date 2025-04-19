import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './home.css';
import chatIcon from './chat.svg'; 

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт','Сб','Вс'];

function Schedule({ token, onLogout }) {
  const [schedule, setSchedule] = useState({});
  const [activeDay, setActiveDay] = useState('Ср'); 

  useEffect(() => {
    axios.get('/s.json', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        setSchedule(response.data);
      })
      .catch(error => {
        console.error("Ошибка при получении расписания:", error);
      });
  }, [token]);

  return (
    <div className="app">
      <div className="header">
        <h1>УниПланер</h1>
        <button onClick={onLogout} className="logout-button">Выйти</button>
      </div>
      <div className="tabs-and-schedule">
        <div className="tabs">
          {WEEK_DAYS.map(day => (
            <button
              key={day}
              className={activeDay === day ? 'active' : ''}
              onClick={() => setActiveDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="schedule">
          {(schedule[activeDay] || []).map((item, index) => (
            <div className="event" key={index}>
              <div className="time">
                {item.timeStart && <div>{item.timeStart}</div>}
                {item.timeEnd && <div>{item.timeEnd}</div>}
              </div>
              <div className="details">
                <strong>{item.title}</strong>
                {item.location && <div>{item.location}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка чата */}
      <button className="chat-button" onClick={() => alert('Открыть чат')}>
        <img src={chatIcon} alt="Chat" />
      </button>
    </div>
  );
}

export default Schedule;