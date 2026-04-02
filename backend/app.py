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
    # Run on port 5000 by default
    app.run(debug=True, port=5000, host='0.0.0.0')

