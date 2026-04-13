import os
import joblib
import numpy as np
from typing import Dict, Any

# Persona Definitions from User Analysis
PERSONA_DATA = {
    0: {
        "name": "Algorithmic Learner",
        "description": "Focuses on the mechanics of training, specifically 'instructions training', 'sentence prediction', and the 'training process'. Assimilation is centered on the procedural steps required to build a model.",
        "color": "#6366f1" # Indigo
    },
    1: {
        "name": "Pre-training Purist",
        "description": "Heavily focused on 'pretrained models', 'learning pretrained', and 'generative pre'. Prioritizes understanding the initial state of a model and how it is explicitly trained from scratch.",
        "color": "#ec4899" # Pink
    },
    2: {
        "name": "Contextual Linguist",
        "description": "Emphasizes 'linguistic pretraining' and 'language models' across a 'large nlp' corpus. Focuses on how models understand language structure and tokens at scale.",
        "color": "#10b981" # Emerald
    },
    3: {
        "name": "BERT Architecture Specialist",
        "description": "Highly focused on BERT architecture—'bidirectional modeling', 'transformers', and 'encoders'. Deeply assimilated the specific transformer encoder logic.",
        "color": "#3b82f6" # Blue
    },
    4: {
        "name": "Attention Mechanic",
        "description": "Focuses on the mathematical heart of the transformer: 'attention decoder', 'attention layer', and 'multihead attention'. Understanding is rooted in the scoring and weighting of tokens.",
        "color": "#f59e0b" # Amber
    },
    5: {
        "name": "Lecture-Centric Learner",
        "description": "Assimilation is tied to the narrative provided in class, focusing on specific lecture terminology and insights shared during the sessions.",
        "color": "#8b5cf6" # Violet
    },
    6: {
        "name": "Workflow Generalist",
        "description": "Focuses on the 'pretraining phase' and 'pretrained word' embeddings. Understands the overall pipeline of NLP model development from embeddings to the final phase.",
        "color": "#64748b" # Slate
    }
}

_gmm_model = None

def get_gmm_model():
    global _gmm_model
    if _gmm_model is None:
        try:
            model_path = os.path.join(os.path.dirname(__file__), '..', 'navigators', 'new_gmm_model.joblib')
            if os.path.exists(model_path):
                _gmm_model = joblib.load(model_path)
                print("Persona GMM Model loaded successfully")
            else:
                print(f"GMM Model not found at {model_path}")
        except Exception as e:
            print(f"Error loading GMM Model: {e}")
    return _gmm_model

def classify_persona(module_scores: list) -> Dict[str, Any]:
    """
    Classify a student into a persona based on their module knowledge vector.
    
    Args:
        module_scores: 18 or 19-dim vector of knowledge scores per module
        
    Returns:
        A dictionary containing the persona ID, name, description, and color.
    """
    model = get_gmm_model()
    
    # Default to Workflow Generalist if model or data is missing
    default_persona = {
        "id": 6,
        "name": PERSONA_DATA[6]["name"],
        "description": PERSONA_DATA[6]["description"],
        "color": PERSONA_DATA[6]["color"]
    }
    
    if not model or not module_scores:
        return default_persona
        
    try:
        # Ensure it's a 2D array for sklearn
        X = np.array(module_scores).reshape(1, -1)
        
        # If the input is less than 18 dims (e.g. new topics added), pad with zeros
        if X.shape[1] < 18:
            padding = np.zeros((1, 18 - X.shape[1]))
            X = np.hstack((X, padding))
        elif X.shape[1] > 18:
            X = X[:, :18]
            
        cluster_id = int(model.predict(X)[0])
        
        persona = PERSONA_DATA.get(cluster_id, PERSONA_DATA[6])
        return {
            "id": cluster_id,
            "name": persona["name"],
            "description": persona["description"],
            "color": persona["color"]
        }
    except Exception as e:
        print(f"Classification error: {e}")
        return default_persona
