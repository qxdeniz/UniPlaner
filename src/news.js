import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './news.css';

function News() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('Fetching events...');
        const response = await axios.get('http://localhost:8000/events');
        console.log('Response received:', response);
        
        if (!response.data) {
          throw new Error('Empty response received');
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        
        const eventBlocks = doc.querySelectorAll('.newsItem-text');
        if (eventBlocks.length === 0) {
          console.log('No events found in parsed HTML');
          setError('Не найдены мероприятия в ответе сервера');
          return;
        }

        const extractedEvents = Array.from(eventBlocks).map(item => {
          const parent = item.closest('.newsItem');
          const linkElement = parent?.querySelector('a.boldLink');
          const title = linkElement?.textContent.trim();
          const url = linkElement?.getAttribute('href');
          const paragraphs = item.querySelectorAll('p');
          const description = paragraphs[0]?.textContent.trim();
          const dateInfo = paragraphs[1]?.textContent.trim();

          return {
            title,
            url: `https://media.kpfu.ru${url}`,
            description,
            date: dateInfo,
          };
        });

        setEvents(extractedEvents);
      } catch (err) {
        console.error('Error details:', err);
        setError(`Не удалось загрузить мероприятия: ${err.message}`);
      }
    };

    fetchEvents();
  }, []);

  const handleAddToSchedule = (event) => {
    const message = `Смогу ли я пойти на мероприятие "${event.title}"? Описание: ${event.description}. Дата: ${event.date}`;
    navigate('/chat', { state: { initialMessage: message } });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-nav">
          <button onClick={() => navigate('/')} className="back-button">Назад</button>
        </div>
        {error && <p>{error}</p>}
        <ul>
          {events.map((event, index) => (
            <li key={index} className="event-card">
              <div className="event-content">
                <h3>
                  <a href={event.url} target="_blank" rel="noopener noreferrer">
                    {event.title}
                  </a>
                </h3>
                <p>{event.description}</p>
                <p><em>{event.date}</em></p>
              </div>
              <button className="add-button" onClick={() => handleAddToSchedule(event)}>
                Добавить в расписание
              </button>
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default News;
