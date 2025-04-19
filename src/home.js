import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './home.css';
import chatIcon from './chat.svg'; 

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт','Сб','Вс'];

function Schedule({ token, onLogout }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({});
  const [activeDay, setActiveDay] = useState('Ср'); 
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    timeStart: '',
    timeEnd: '',
    title: '',
    location: ''
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedSchedule = { ...schedule };
    if (!updatedSchedule[activeDay]) {
      updatedSchedule[activeDay] = [];
    }
    updatedSchedule[activeDay].push(newEvent);
    setSchedule(updatedSchedule);
    setShowForm(false);
    setNewEvent({ timeStart: '', timeEnd: '', title: '', location: '' });


    axios.post('/api/events', {
      day: activeDay,
      event: newEvent
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(error => {
      console.error("Ошибка при сохранении события:", error);
    });
  };

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
          <button className="add-event-button" onClick={() => setShowForm(true)}>
            Добавить мероприятие
          </button>
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

      {showForm && (
        <div className="form-overlay">
          <div className="event-form">
            <button className="close-button" onClick={() => setShowForm(false)}>×</button>
            <h2>Добавить мероприятие</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Название мероприятия"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
              />
              <input
                type="time"
                placeholder="Время начала"
                value={newEvent.timeStart}
                onChange={(e) => setNewEvent({...newEvent, timeStart: e.target.value})}
                required
              />
              <input
                type="time"
                placeholder="Время окончания"
                value={newEvent.timeEnd}
                onChange={(e) => setNewEvent({...newEvent, timeEnd: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Место проведения"
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                required
              />
              <button type="submit">Сохранить</button>
            </form>
          </div>
        </div>
      )}

      {/* Кнопка чата */}
      <button className="chat-button" onClick={() => navigate('/chat')}>
        <img src={chatIcon} alt="Chat" />
      </button>
    </div>
  );
}

export default Schedule;