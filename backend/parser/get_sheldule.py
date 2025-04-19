import parser.parser_r as parser_r

def load_shedule():
    schedule = parser_r.create_weekly_schedule()
    result = ""
    for day, classes in schedule.items():
        if classes:  
            result += f"\n{day}:\n"
            result += "=" * 28 + "\n"
            
            for class_info in classes:
                time_str = class_info['timeStart']
                if 'timeEnd' in class_info:
                    time_str += f"-{class_info['timeEnd']}"
                    
                result += f"Время: {time_str}\n"
                result += f"Пара: {class_info['title']}\n"
                if 'location' in class_info:
                    result += f"Место: {class_info['location']}\n"
                result += '-' * 28 + '\n'
    
    return result



