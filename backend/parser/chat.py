import requests
import json
from parser.get_sheldule import load_shedule
import parser.config as config
import logging
from google import genai


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL = "gemini-2.0-flash-001"
API_KEY = 'AIzaSyCRxaB09p2wEDJPbwc69tEukfrsv0HT5YQ'

client = genai.Client(api_key=API_KEY)

def analyze_sheldule(prompt, user_id):
    try:
        shedule = load_shedule()
        if not shedule:
            logger.error("Failed to load schedule")
            raise Exception("Failed to load schedule")

        data = {
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": """Ты помощник в анализе расписания для студентов. Твоя задача помогать анализировать расписание 
и отвечать на вопросы о нем. Отвечай подробно, предлагай разные варианты времени для проведения мероприятия. Твои ответы должны быть не слишком большими, но подробными. Разделяй пробелами!"""
                },
                {
                    "role": "user",
                    "content": f"Запрос студента: {prompt}. Расписание студента: {shedule}"
                }
            ],
            "stream": False
        }
        
        logger.info(f"Sending request to API with prompt: {prompt}")
        answer = chat_stream(prompt, data)
        if not answer:
            logger.error("Empty response from chat_stream")
            raise Exception("Empty response from AI")
        
        return answer.replace("*", "")
    except Exception as e:
        logger.error(f"Error in analyze_sheldule: {str(e)}")
        raise

def chat_stream(prompt, data):
    try:
        messages = data.get('messages', [])
        
    
        conversation = []
        for msg in messages:
            content = msg.get('content', '')
            if content:
                conversation.append(content)
        
        full_prompt = "\n".join(conversation)
    
        response = client.models.generate_content(
    model='gemini-2.0-flash-001', contents=full_prompt
)
        
        if not response or not response.text:
            logger.error("Empty response from Gemini")
            raise Exception("Empty response from AI")
            
        logger.info(f"Processed response: {response.text}")
        return response.text
        
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        raise



