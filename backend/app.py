# NLP Learning Grid Backend
# Provides API for grid-based NLP learning system
from init import app

# Import NLP API routes
try:
    import nlp_api
except Exception as e:
    print(f"Warning: Could not import nlp_api: {e}")

@app.route('/')
def index():
    return "NLP Learning Grid Backend is Running!"

if __name__ == '__main__':
    import os
    use_reloader = os.environ.get('FLASK_USE_RELOADER', 'false').lower() == 'true'
    print("[INFO] Starting Flask server on http://0.0.0.0:5000...")
    app.run(debug=True, port=5000, host='0.0.0.0', use_reloader=use_reloader)

