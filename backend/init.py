"""
Flask Application Initialization
Sets up the Flask app with necessary configurations
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
import os

# Initialize Flask app
# Serves static files from the build directory (../dist)
app = Flask(__name__, static_folder='../dist', static_url_path='')

# Enable CORS
CORS(app)

# Serve React App (Catch-all route)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Don't interfere with API routes
    if path.startswith('api'):
        return {"error": "Not found"}, 404
        
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    
    # Return index.html for SPA routing
    return send_from_directory(app.static_folder, 'index.html')

# Flag to indicate if database was just created
DBcreated = False
