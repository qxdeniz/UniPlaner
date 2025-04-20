import json
import os
from typing import Dict, Optional

class ScheduleManager:
    def __init__(self):
        self.base_path = "/backend/parser"
        self.default_schedule = "file.html"
        self.custom_schedule = "s.json"

    def load_custom_schedule(self) -> Optional[Dict]:
        try:
            custom_path = os.path.join(self.base_path, self.custom_schedule)
            if os.path.exists(custom_path):
                with open(custom_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Error loading custom schedule: {e}")
            return None

    def has_custom_schedule(self) -> bool:
        custom_path = os.path.join(self.base_path, self.custom_schedule)
        return os.path.exists(custom_path)
