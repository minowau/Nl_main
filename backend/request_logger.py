import os
from datetime import datetime
from flask import request

LOG_FILE = os.path.join(os.path.dirname(__file__), 'backend_logs.txt')

def log_request(info=None):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    method = request.method
    url = request.url
    
    log_entry = f"[{timestamp}] {method} {url}\n"
    
    if info:
        log_entry += f"Info: {info}\n"
    
    if method in ['POST', 'PUT']:
        try:
            json_data = request.get_json(silent=True)
            if json_data:
                log_entry += f"Payload: {json_data}\n"
        except Exception:
            pass
            
    log_entry += "-" * 50 + "\n"
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry)
