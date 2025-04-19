from bs4 import BeautifulSoup
import json

html_file = "/Users/deniz_mlg/Desktop/Универ/frontend/backend/parser/file.html"

def load_schedule():
    try:
        with open(html_file, "r", encoding="windows-1251") as file:
            soup = BeautifulSoup(file, "html.parser")
        return soup
    except FileNotFoundError:
        print(f"Файл {html_file} не найден.")
        return None

def load_json_schedule(json_data):
    try:
        if isinstance(json_data, str):
            return json.loads(json_data)
        return json_data
    except json.JSONDecodeError:
        print("Ошибка при парсинге JSON данных.")
        return None

def get_day_key(day):
    day_mapping = {
        "понедельник": "Пн",
        "вторник": "Вт",
        "среда": "Ср",
        "четверг": "Чт",
        "пятница": "Пт",
        "суббота": "Сб",
        "воскресенье": "Вс"
    }
    return day_mapping.get(day.lower())

def find_classes_for_day(schedule_data, day):
    if not schedule_data:
        return "Расписание не загружено"
    
    day_key = get_day_key(day)
    if not day_key:
        return f"Некорректный день: {day}"
    
    classes = schedule_data.get(day_key, [])
    if not classes:
        return f"На {day} пар не найдено."
    
    answer = ''
    for class_info in classes:
        time_str = class_info['timeStart']
        if 'timeEnd' in class_info:
            time_str += f"-{class_info['timeEnd']}"
            
        answer += f"Время: <b>{time_str}</b>\n"
        answer += f"Пара: {class_info['title']}\n"
        if 'location' in class_info:
            answer += f"Место: {class_info['location']}\n"
        answer += '-' * 28 + '\n\n'
    
    return answer

def parse_class_info(class_info):
    """Parse class information into title and location with room number"""
    parts = class_info.split(',', 1)
    
    title = parts[0].strip()
    location_parts = ', '.join(parts[1:]).strip() if len(parts) > 1 else None
    
    # Extract first number from the entire string as room number
    import re
    room_number = None
    numbers = re.findall(r'\d+', class_info)
    if numbers:
        room_number = numbers[0]
        # Remove room number from title if it exists there
        title = re.sub(r'\s+\d+\s*$', '', title)
    
    location = None
    if room_number:
        location = f"Ауд. {room_number}"
        if location_parts:

            if ' с ' in location_parts:
                location_parts = location_parts.split(' с ')[0].strip()
            location += f", {location_parts}"
    elif location_parts:
        location = location_parts
    
    return title, location

def create_weekly_schedule():
    soup = load_schedule()
    if not soup:
        return None

    schedule = {
        "Пн": [], "Вт": [], "Ср": [], "Чт": [], "Пт": [], "Сб": []
    }
    
    table = soup.find("table", {"border": "0"})
    if not table:
        print("Таблица с расписанием не найдена.")
        return None

    rows = table.find_all("tr")[1:]  
    
    for row in rows:
        cells = row.find_all("td")
        time_slot = cells[0].get_text(strip=True)
        if not time_slot:  
            continue
            
        time_parts = time_slot.split('-')
        timeStart = time_parts[0].strip()
        timeEnd = time_parts[1].strip() if len(time_parts) > 1 else None

        for day_index, day_key in enumerate(['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']):
            try:
                class_info = cells[day_index + 1].get_text(" ", strip=True)
                if class_info:
                    title, location = parse_class_info(class_info)
                    class_data = {
                        "timeStart": timeStart,
                        "title": title
                    }
                    if timeEnd:
                        class_data["timeEnd"] = timeEnd
                    if location:
                        class_data["location"] = location
                    
                    schedule[day_key].append(class_data)
            except IndexError:
                continue

    return schedule

# Example usage:
if __name__ == "__main__":
    example_schedule = {
        "Пн": [
            {
                "timeStart": "9:00",
                "timeEnd": "10:30",
                "title": "Матанализ",
                "location": "Ауд. 305"
            }
        ]
    }
    
    
    weekly_schedule = create_weekly_schedule()
    if weekly_schedule:
        print(json.dumps(weekly_schedule, ensure_ascii=False, indent=2))