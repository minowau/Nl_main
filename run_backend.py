import os
import sys

# Add the root directory to the path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from backend.nlp_api import app
except ImportError:
    # If already in backend dir
    from nlp_api import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting NLP Learning Grid Backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
