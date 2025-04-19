import requests
import json
from parser.get_sheldule import load_shedule
import parser.config as config
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL = "deepseek/deepseek-v3-base:free"
API_KEY = config.LLM_KEY

def process_content(content):
    return content.replace('<think>', '').replace('</think>', '')

def analyze_sheldule(prompt):
    try:
        logger.info("Starting schedule analysis")
        shedule = load_shedule()
        if not shedule:
            logger.error("Failed to load schedule")
            raise Exception("Failed to load schedule")

        data = {
            "model": MODEL,
            "messages": [{"role": "user", "content": f"""Ты помощник в составлении расписания для студентов. Твоя задача найти идеальное место для меропрятия в расписании студента. 
Для этого проанализируй расписание и выполни просьбу студента. Если тебя попросили найти время, то ты должен подсказать день и конкретное время для этого мероприятия
Входные данные:
Задача/Запрос студента: {prompt}
Расписание студента: {shedule}"""}],
            "stream": False
        }
        
        logger.info(f"Sending request to API with prompt: {prompt}")
        answer = chat_stream(prompt, data)
        if not answer:
            logger.error("Empty response from chat_stream")
            raise Exception("Empty response from AI")
        return answer
    except Exception as e:
        logger.error(f"Error in analyze_sheldule: {str(e)}")
        raise

def chat_stream(prompt, data):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        logger.info(f"API Response status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API Error: {response.status_code} - {response.text}")
            raise Exception(f"API Error: {response.status_code}")

        response_json = response.json()
        logger.info(f"API Response: {response_json}")
        
        if not response_json.get("choices"):
            logger.error("No choices in response")
            raise Exception("Invalid API response format")
            
        content = response_json["choices"][0]["message"]["content"]
        cleaned = process_content(content)
        
        if not cleaned:
            logger.error("Empty content after processing")
            raise Exception("Empty response content")
            
        logger.info(f"Processed response: {cleaned}")
        return cleaned
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error processing response: {str(e)}")
        raise

