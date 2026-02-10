"""
Flask Application Initialization
Sets up the Flask app with necessary configurations
"""

from flask import Flask
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for frontend communication
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Flag to indicate if database was just created
DBcreated = False
