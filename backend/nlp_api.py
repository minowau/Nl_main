"""
NLP Learning Grid API
Provides endpoints for the frontend grid-based NLP learning system.
"""

import os
import json
import pandas as pd
from flask import jsonify, request
import numpy as np
from datetime import datetime
import nltk

# Ensure requisite NLTK data is available
try:
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    from nltk.corpus import stopwords
    STOPWORDS = set(stopwords.words('english'))
except Exception as e:
    print(f"Warning: Could not load NLTK stopwords: {e}")
    STOPWORDS = set()

# Import backend modules (support both script and package execution)
try:
    from .init import app
    from .database import get_session, update_session, save_summary, save_polyline, get_polylines as get_db_polylines, get_notes, add_note, get_lectures, reset_db
    from .request_logger import log_request
    from .utils import utils_preprocess_text, get_cos_sim
    from . import navigator
except ImportError:
    from init import app
    from database import get_session, update_session, save_summary, save_polyline, get_polylines as get_db_polylines, get_notes, add_note, get_lectures, reset_db
    from request_logger import log_request
    from utils import utils_preprocess_text, get_cos_sim
    import navigator

# Define stopwords
stop_words = set(stopwords.words('english'))

# Polyline logging
POLYLINE_LOG_FILE = os.path.join(os.path.dirname(__file__), 'polyline_generation.log')

def log_polyline_step(step, details):
    """Log detailed steps of polyline generation"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(POLYLINE_LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] [{step}]\n{details}\n{'-'*50}\n")

_bert_model = None

def get_bert_model():
    global _bert_model
    if _bert_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("Loading BERT model (lazy)...")
            _bert_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("BERT model loaded successfully")
        except Exception as e:
            print(f"Error loading BERT model: {e}")
            _bert_model = None
    return _bert_model

# Load NLP data from JSON (Excel was rejected by HF)
nlp_json_path = os.path.join(os.path.dirname(__file__), 'nlp', 'nlp_resources.json')

def load_nlp_resources():
    """Load NLP resources from JSON file"""
    try:
        # Check if the JSON file exists
        if not os.path.exists(nlp_json_path):
            print(f"File not found: {nlp_json_path}")
            return []
            
        with open(nlp_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not isinstance(data, list):
            print(f"Unexpected data format in {nlp_json_path}")
            return []
            
        # First-quadrant arc projection (bottom-left origin)
        # Resources fan from 5° to 85° like Q1 of a polar chart
        # Origin: bottom-LEFT of 20×20 grid
        cx, cy = 0.0, 19.5

        # Sequential split: 7 / 5 / 4 / 2 = 18
        ordered_data = data[:18] if len(data) >= 18 else data

        tier_configs = [
            {'label': 'Fundamentals', 'count': 4, 'radius':  3, 'difficulty': 2},
            {'label': 'Intermediate', 'count': 5, 'radius':  7, 'difficulty': 4},
            {'label': 'Advance',      'count': 5, 'radius': 11, 'difficulty': 6},
            {'label': 'Mastery',      'count': 4, 'radius': 15, 'difficulty': 8},
        ]

        used_positions = set()
        resources = []
        resource_idx = 0

        # Fan: 8° to 82° (keeps resources comfortably inside axes)
        angle_start_deg = 8.0
        angle_end_deg   = 82.0

        for t_idx, tier in enumerate(tier_configs):
            count  = tier['count']
            r_val  = tier['radius']
            tier_data = ordered_data[resource_idx : resource_idx + count]
            resource_idx += count

            n = len(tier_data)
            if n == 0:
                continue

            angle_step = (angle_end_deg - angle_start_deg) / (n - 1) if n > 1 else 0.0

            for i, row in enumerate(tier_data):
                angle_deg  = angle_start_deg + i * angle_step
                angle_rad  = np.radians(angle_deg)

                x_raw = cx + r_val * np.cos(angle_rad)
                y_raw = cy - r_val * np.sin(angle_rad)

                x = int(round(np.clip(x_raw, 0, 18)))
                y = int(round(np.clip(y_raw, 0, 18)))

                # Resolve collisions by nudging along the arc (y direction)
                attempts = 0
                while (x, y) in used_positions and attempts < 20:
                    y = max(0, min(18, y - 1 if attempts % 2 == 0 else y + 1))
                    attempts += 1

                used_positions.add((x, y))

                # Tier-based points: Fundamentals=50, Intermediate=100, Advance=150, Mastery=200
                tier_points = {2: 50, 4: 100, 6: 150, 8: 200}
                base_pts = tier_points.get(tier['difficulty'], 50)

                # Per-resource high_line: seeded random 0.70-0.85
                import random as _rnd
                _rnd.seed(len(resources) + 42)  # deterministic per resource index
                high_line = round(_rnd.uniform(0.70, 0.85), 2)

                resources.append({
                    'id':         str(len(resources) + 1),
                    'position':   {'x': int(x), 'y': int(y)},
                    'type':       'video' if 'youtube' in str(row.get('links', '')).lower() else 'book',
                    'title':      str(row.get('name', f'Resource {len(resources) + 1}')).strip(),
                    'visited':    False,
                    'difficulty': tier['difficulty'],
                    'reward':     base_pts,
                    'base_points': base_pts,
                    'high_line':  high_line,
                    'url':        str(row.get('links', '')).strip(),
                    'description':str(row.get('description', '')).strip(),
                    'module':     str(row.get('module', 'NLP Concept')).strip()
                })

        print(f"Successfully projected {len(resources)} resources into 4-tier Radar arcs")
        return resources
    except Exception as e:
        print(f"Error loading NLP resources: {e}")
        return []

# Cache resources
nlp_resources = load_nlp_resources()

# Load YouTube links mapping
_youtube_links_path = os.path.join(os.path.dirname(__file__), 'data', 'youtube_links.json')
try:
    if os.path.exists(_youtube_links_path):
        with open(_youtube_links_path, 'r', encoding='utf-8') as f:
            raw_links = json.load(f)
        
        # Create a normalized mapping for easier lookup
        _youtube_links = {str(k).strip().lower(): v for k, v in raw_links.items()}
        print(f"Loaded {len(_youtube_links)} YouTube links from mapping file")
        
        # Inject youtube_url into each resource
        for r in nlp_resources:
            module_lower = r['module'].lower()
            title_lower = r['title'].lower()
            
            # 1. Exact module match
            url = _youtube_links.get(module_lower, '')
            
            # 2. Fuzzy match on title or module
            if not url:
                for key, val in _youtube_links.items():
                    if key in title_lower or key in module_lower or title_lower in key or module_lower in key:
                        url = val
                        break
            
            r['youtube_url'] = url
            
        yt_count = sum(1 for r in nlp_resources if r.get('youtube_url'))
        print(f"Matched YouTube URLs for {yt_count}/{len(nlp_resources)} resources")
    else:
        print(f"YouTube links file not found: {_youtube_links_path}")
        for r in nlp_resources: r['youtube_url'] = ''
except Exception as e:
    print(f"Could not load YouTube links: {e}")
    for r in nlp_resources: r['youtube_url'] = ''

# Pre-compute module embeddings
module_embeddings = {}

def compute_module_embeddings():
    bert_model = get_bert_model()
    if not bert_model:
        return
        
    print("Computing module embeddings...")
    # Group resources by module to form a "document" for each module
    module_docs = {}
    for r in nlp_resources:
        m = r['module']
        # Combine title and description for a rich representation
        text = f"{r['title']} {r.get('description', '')}"
        if m in module_docs:
            module_docs[m] += " " + text
        else:
            module_docs[m] = text
            
    # Compute embeddings
    for m, doc in module_docs.items():
        # Apply preprocessing
        clean_doc = utils_preprocess_text(doc, flg_stemm=False, flg_lemm=True, lst_stopwords=stop_words)
        module_embeddings[m] = bert_model.encode(clean_doc)
    print(f"Computed embeddings for {len(module_embeddings)} modules")

# Compute embeddings on startup (REMOVED: Too slow on startup, will compute lazily or skip if needed)
# compute_module_embeddings()

# =============================================
# RESOURCES ENDPOINTS
# =============================================

@app.before_request
def before_request_logging():
    if request.path.startswith('/api'):
        log_request()

@app.route('/api/reset', methods=['POST'])
def reset_database():
    """Wipes the database memory completely"""
    try:
        reset_db()
        return jsonify({'status': 'success', 'message': 'Database memory wiped completely'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get all NLP learning resources with their grid positions and correct visited state"""
    session_id = request.args.get('session_id', 'default')
    from database import get_session
    session = get_session(session_id)
    visited_ids = set(str(v).strip() for v in session.get('visitedResources', []))
    
    # Return a copy of resources with updated visited flags
    updated_resources = []
    for r in nlp_resources:
        r_copy = r.copy()
        r_copy['visited'] = str(r['id']).strip() in visited_ids
        updated_resources.append(r_copy)
    
    return jsonify(updated_resources)


@app.route('/api/resources/<resource_id>', methods=['GET'])
def get_resource(resource_id):
    """Get a single resource by ID"""
    resource = next((r for r in nlp_resources if r['id'] == resource_id), None)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    return jsonify(resource)


# =============================================
# AGENT STATE ENDPOINTS
# =============================================

@app.route('/api/agent', methods=['GET'])
def get_agent_state():
    """Get current agent state (position, level, reward)"""
    session_id = request.args.get('session_id', 'default')
    return jsonify(get_session(session_id))


@app.route('/api/agent/move', methods=['POST'])
def move_agent():
    """Move agent to a new position"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    position = data.get('position', {})
    
    session = get_session(session_id)
    session['position'] = position
    update_session(session_id, session)
    
    return jsonify(session)


# =============================================
# NOTIFICATION ENDPOINTS
# =============================================

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications for a session"""
    session_id = request.args.get('session_id', 'default')
    from database import get_session
    session = get_session(session_id)
    return jsonify(session.get('notifications', []))


@app.route('/api/notifications/add', methods=['POST'])
def add_notification():
    """Add a new notification to the database"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    message = data.get('message')
    notif_type = data.get('type', 'info')
    
    if not message:
        return jsonify({'error': 'Message required'}), 400
        
    from database import get_session, update_session
    session = get_session(session_id)
    if 'notifications' not in session:
        session['notifications'] = []
        
    new_notif = {
        'id': f"notif_{int(datetime.now().timestamp())}",
        'type': notif_type,
        'message': message,
        'timestamp': int(datetime.now().timestamp() * 1000),
        'read': False
    }
    
    session['notifications'].insert(0, new_notif)
    update_session(session_id, session)
    return jsonify(new_notif)


@app.route('/api/notifications/read', methods=['POST'])
def mark_notifications_read():
    """Mark all notifications as read in the database"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    
    from database import get_session, update_session
    session = get_session(session_id)
    if 'notifications' in session:
        for n in session['notifications']:
            n['read'] = True
        update_session(session_id, session)
        
    return jsonify({'status': 'success'})


def sync_agent_progression(session):
    """Utility to ensure level and totalReward are consistent"""
    # Level = totalReward // 100 (Stage 1 starts at 0 pts, Stage 2 at 100 pts, etc.)
    # Floor level is 1
    session['level'] = max(1, (session.get('totalReward', 0) // 100) + 1)
    return session

# =============================================
# RESOURCE INTERACTION ENDPOINTS
# =============================================

@app.route('/api/resource/visit', methods=['POST'])
def visit_resource():
    """Mark a resource as visited and update agent"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    resource_id = data.get('resource_id')
    
    session = get_session(session_id)
    
    # Find resource
    resource = next((r for r in nlp_resources if r['id'] == resource_id), None)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    # Update session
    if resource_id not in session['visitedResources']:
        session['visitedResources'].append(resource_id)
        # Add reward
        session['totalReward'] = session.get('totalReward', 0) + resource.get('reward', 0)
    
    # Sync progression
    session = sync_agent_progression(session)
    
    update_session(session_id, session)
    return jsonify(session)


# =============================================
# LEARNING SUMMARY ENDPOINTS
# =============================================

@app.route('/api/summary/create', methods=['POST'])
def create_learning_summary():
    """
    Create a learning summary from visited resources
    """
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    session = get_session(session_id)
    title = data.get('title', '')
    summary = data.get('summary', '')
    visited_ids = data.get('visited_resources', [])
    
    if not title or not summary:
        return jsonify({'error': 'Title and summary required'}), 400
    
    # Get visited resources using robust ID matching
    visited_set = set(str(v).strip() for v in visited_ids)
    visited_resources = [r for r in nlp_resources if str(r['id']).strip() in visited_set]
    
    print(f"[DEBUG] create_learning_summary: incoming visited_ids={visited_ids}, matched count={len(visited_resources)}")
    
    # Calculate learning metrics
    total_difficulty = sum(r['difficulty'] for r in visited_resources)
    total_reward = sum(r['reward'] for r in visited_resources)
    avg_difficulty = total_difficulty / len(visited_resources) if visited_resources else 0
    
    # Extract unique modules from resources (preserving order)
    seen_modules = set()
    ordered_modules = []
    for r in nlp_resources:
        m = r['module']
        if m not in seen_modules:
            ordered_modules.append(m)
            seen_modules.add(m)
    
    # Module Aliases for better keyword matching
    module_aliases = {
        'Pre training objectives': ['pre-training', 'pre training', 'objectives'],
        'Pre trained models': ['pre-trained', 'pre trained'],
        'Tutorial: Introduction to huggingface': ['huggingface', 'hugging face'],
        'Fine tuning LLM': ['fine-tuning', 'fine tuning', 'ft'],
        'Instruction tuning': ['instruction tuning', 'instruction-tuning'],
        'Prompt based learning': ['prompt based', 'prompt-based'],
        'Parameter efficient fine tuning': ['peft', 'parameter efficient'],
        'Incontext Learning': ['in-context', 'incontext', 'icl'],
        'Prompting methods': ['prompting'],
        'Retrieval Methods': ['retrieval'],
        'Retrieval Augmented Generation': ['rag', 'retrieval augmented'],
        'Quantization': ['quantization', 'quantized'],
        'Mixture of Experts Model': ['moe', 'mixture of experts'],
        'Agentic AI': ['agentic', 'agents'],
        'Multimodal LLMs': ['multimodal', 'multi-modal'],
        'Vision Language Models': ['vlm', 'vision-language', 'vision language'],
        'Policy learning using DQN': ['dqn', 'deep q', 'policy gradient'],
        'RLHF': ['rlhf', 'reinforcement learning from human feedback']
    }

    # Check for keywords in summary text
    summary_lower = summary.lower()
    keywords_found = []
    
    for module in ordered_modules:
        if module.lower() in summary_lower:
            keywords_found.append(module)
            continue
        aliases = module_aliases.get(module, [])
        for alias in aliases:
            if alias.lower() in summary_lower:
                keywords_found.append(module)
                break
    for r in visited_resources:
        if r['title'].lower() in summary_lower and r['title'] not in keywords_found:
            keywords_found.append(r['title'])

    # Calculate module scores for polyline
    module_scores = []
    log_polyline_step("START_GENERATION", f"Generating polyline for summary: '{summary[:100]}...'")

    bert_model = get_bert_model()
    if bert_model:
        if not module_embeddings:
            compute_module_embeddings()
            
        try:
            clean_summary = utils_preprocess_text(summary, flg_stemm=False, flg_lemm=True, lst_stopwords=stop_words)
            summary_embedding = bert_model.encode(clean_summary)
            for module in ordered_modules:
                score = 0.0
                if module in module_embeddings:
                    sim = get_cos_sim(summary_embedding, module_embeddings[module])
                    score = max(0.0, sim)
                if module in keywords_found: score += 0.3
                module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
                if module_visited_count > 0: score += 0.1 * module_visited_count
                module_scores.append(float(max(0.0, min(1.0, score))))
        except Exception as e:
            print(f"Error computing BERT scores: {e}")
            for module in ordered_modules:
                score = 0.5 + (np.random.random() - 0.5) * 0.1
                if module in keywords_found: score += 0.2
                module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
                if module_visited_count > 0: score += 0.1 * module_visited_count
                module_scores.append(float(max(0.0, min(1.0, score))))
    else:
        for module in ordered_modules:
            score = 0.5 + (np.random.random() - 0.5) * 0.1
            if module in keywords_found: score += 0.2
            module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
            if module_visited_count > 0: score += 0.1 * module_visited_count
            module_scores.append(float(max(0.0, min(1.0, score))))

    # ── DQN Recommendation ──
    rec_result = navigator.recommend_next(visited_ids, module_scores, nlp_resources)
    next_recommendation_obj = rec_result.get('resource')
    
    recommendations = []
    if next_recommendation_obj:
        recommendations.append(next_recommendation_obj['title'])
    
    unvisited_remaining = [r for r in nlp_resources if r['id'] not in visited_ids and r['title'] not in recommendations]
    unvisited_remaining.sort(key=lambda r: (-r.get('reward', 0), r.get('difficulty', 0)))
    for r in unvisited_remaining:
        if len(recommendations) < 3: recommendations.append(r['title'])
        else: break
        
    strengths = keywords_found if keywords_found else [r['title'] for r in visited_resources if r.get('difficulty', 0) <= 2]

    # Analysis results
    polylines = get_db_polylines()
    from collections import Counter
    all_keywords = []
    for p in polylines.values():
        if 'keywords_found' in p: all_keywords.extend(p['keywords_found'])
    all_keywords.extend(keywords_found)
    keyword_counts = Counter(all_keywords)
    most_common_keywords = [k for k, v in keyword_counts.most_common(3)]
    dominant_topics = most_common_keywords
    
    # Define scored_modules for recommendation logic
    scored_modules = list(zip(ordered_modules, module_scores))

    # Calculate XP based on high lines
    current_polyline_sum = sum(module_scores)
    total_earned_base_pts = 0
    high_line_sum = 0
    for module, score in scored_modules:
        resource = next((r for r in nlp_resources if r['module'] == module), None)
        if resource:
            hl = float(resource.get('high_line', 0.8))
            high_line_sum += hl
            if score >= hl:
                total_earned_base_pts += resource.get('base_points', 50)
    
    high_line_sum = max(0.1, high_line_sum)
    xp_earned = int(total_earned_base_pts * (current_polyline_sum / high_line_sum))
    
    # Update session with new XP
    session['totalReward'] = session.get('totalReward', 0) + xp_earned
    session = sync_agent_progression(session)
    update_session(session_id, session)
    
    # Generate generic AI analysis
    ai_analysis = f"Learning profile enriched by modules like {', '.join(keywords_found[:3]) if keywords_found else 'Basics'}. Stage {session['level']} achieved with {session['totalReward']} points."

    # Recommendations: Unvisited modules with high rewards or logical next steps
    visited_module_names = set(r['module'] for r in visited_resources)
    all_module_names = set(r['module'] for r in nlp_resources)
    unvisited_modules = list(all_module_names - visited_module_names)
    
    # Sort unvisited modules by order in ORDERED_MODULES
    unvisited_modules.sort(key=lambda m: ordered_modules.index(m) if m in ordered_modules else 99)
    
    # Combine BERT scores with sequential progression for recommendations
    recommendations = unvisited_modules[:3] if unvisited_modules else [m for m, s in scored_modules if s <= 0.3][:3]

    timestamp_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_result = {
        'id': f"summary_{session_id}_{timestamp_id}",
        'title': title, 'summary': summary, 'keywords_found': keywords_found,
        'totalResources': len(nlp_resources), 'visitedResources': len(visited_resources),
        'currentLevel': session['level'],
        'strengths': strengths, 'recommendations': recommendations,
        'ai_analysis': ai_analysis,
        'avgDifficulty': round(avg_difficulty, 2), 'totalReward': session['totalReward'],
        'xp_earned': xp_earned
    }
    save_summary(summary_result)

    # Final result construction
    agent_pos = session.get('position', {'x': 10, 'y': 10})
    assimilation_position = {'x': agent_pos.get('x', 10), 'y': agent_pos.get('y', 10)}
    
    polyline_id = f"polyline_{timestamp_id}"
    new_polyline = {
        'id': polyline_id, 'name': title, 'path': [r['position'] for r in visited_resources],
        'color': f'rgba({np.random.randint(100,200)}, {np.random.randint(100,200)}, 255, 0.4)',
        'isActive': True, 'summary': summary, 'keywords_found': keywords_found,
        'module_scores': module_scores, 'strengths': strengths, 'dominant_topics': dominant_topics,
        'ai_analysis': ai_analysis, 'assimilation_position': assimilation_position,
        'next_recommendation': {
            'id': next_recommendation_obj['id'], 'title': next_recommendation_obj['title'],
            'position': next_recommendation_obj['position'], 'module': rec_result['module'], 'reason': rec_result['reason']
        } if next_recommendation_obj else None
    }
    save_polyline(polyline_id, new_polyline)
    
    return jsonify({
        'summary': summary_result,
        'polyline': new_polyline,
        'assimilation_position': assimilation_position,
        'next_recommendation': new_polyline['next_recommendation']
    })


# =============================================
# POLYLINE ENDPOINTS
# =============================================

@app.route('/api/polylines', methods=['GET'])
@app.route('/api/polylines', methods=['GET'])
def get_polylines_route():
    """Get all polylines including dynamically generated High Line and Current Average polylines"""
    polylines = get_db_polylines()
    
    # Generate ordered_modules to ensure consistent mapping
    seen_modules = set()
    ordered_modules = []
    for r in nlp_resources:
        m = r['module']
        if m not in seen_modules:
            ordered_modules.append(m)
            seen_modules.add(m)
            
    # Compute average module scores across all historical polylines
    import math
    history_scores = [p.get('module_scores', []) for p in polylines.values() if p.get('module_scores')]
    num_histories = len(history_scores)
    
    avg_module_scores = [0.0] * len(ordered_modules)
    if num_histories > 0:
        for scores in history_scores:
            for i, s in enumerate(scores):
                if i < len(avg_module_scores):
                    avg_module_scores[i] += s
        avg_module_scores = [s / num_histories for s in avg_module_scores]
        
    # Sort resources by angle (origin is 0, 19)
    def compute_angle(r):
        return math.atan2(19 - r['position']['y'], r['position']['x'])
        
    resources_sorted = sorted(nlp_resources, key=compute_angle)
    
    high_line_path = []
    current_path = []
    
    for r in resources_sorted:
        dx = r['position']['x']
        dy = 19 - r['position']['y']
        radius = math.hypot(dx, dy)
        theta = math.atan2(dy, dx)
        
        # High Line
        hl = float(r.get('high_line', 0.8))
        hl_rad = radius * hl
        hl_x = hl_rad * math.cos(theta)
        hl_y = 19 - hl_rad * math.sin(theta)
        high_line_path.append({'x': hl_x, 'y': hl_y})
        
        # Current Average
        try:
            m_idx = ordered_modules.index(r['module'])
            avg_s = avg_module_scores[m_idx] if num_histories > 0 else 0.0
        except ValueError:
            avg_s = 0.0
            
        cur_rad = radius * avg_s
        cur_x = cur_rad * math.cos(theta)
        cur_y = 19 - cur_rad * math.sin(theta)
        current_path.append({'x': cur_x, 'y': cur_y})
        
    # Create the virtual polylines. Close the loops by adding the first point to the end.
    if high_line_path:
        high_line_path.append(high_line_path[0])
    if current_path:
        current_path.append(current_path[0])

    hl_polyline = {
        'id': 'high_line',
        'name': 'High Line Target',
        'path': high_line_path,
        'color': 'rgba(239, 68, 68, 0.8)', # Red
        'isActive': True,
        'confidence': 1.0,
        'summary': 'Target threshold for each module'
    }
    
    cur_polyline = {
        'id': 'current_average',
        'name': 'Current Knowledge Base',
        'path': current_path,
        'color': 'rgba(59, 130, 246, 0.8)', # Blue
        'isActive': True,
        'confidence': 1.0,
        'summary': 'Your overall average knowledge across all summaries'
    }

    # Format result: Return ONLY the virtual polylines, or include histories?
    # User said "everywhere it should be shown like a high polyline... and current should be average of all histories"
    # We will return the historical ones but set them to inactive, and these two to strictly active.
    
    result = list(polylines.values())
    for p in result:
        p['isActive'] = False # Disable historical polylines by default
        
    result.append(hl_polyline)
    result.append(cur_polyline)
    
    return jsonify(result)


@app.route('/api/polylines/<polyline_id>', methods=['GET'])
def get_polyline(polyline_id):
    """Get a specific polyline"""
    polylines = get_db_polylines()
    polyline = polylines.get(polyline_id)
    if not polyline:
        return jsonify({'error': 'Polyline not found'}), 404
    return jsonify(polyline)


@app.route('/api/polylines/<polyline_id>/toggle', methods=['POST'])
def toggle_polyline(polyline_id):
    """Toggle polyline visibility"""
    data = request.get_json()
    is_active = data.get('isActive', False)
    
    polylines = get_db_polylines()
    polyline = polylines.get(polyline_id)
    if not polyline:
        return jsonify({'error': 'Polyline not found'}), 404
    
    polyline['isActive'] = is_active
    save_polyline(polyline_id, polyline)
    return jsonify(polyline)



# =============================================
# DQN PATH ENDPOINTS
# =============================================

@app.route('/api/dqn-path', methods=['POST'])
def generate_dqn_path():
    """
    Generate DQN optimal path using the Navigator module.
    
    Request JSON:
    {
        "session_id": "str",
        "agent_position": {"x": int, "y": int},
        "visited_resource_ids": ["id1", "id2", ...]
    }
    """
    data = request.get_json()
    agent_pos = data.get('agent_position', {'x': 10, 'y': 10})
    visited_ids = list(data.get('visited_resource_ids', []))

    # Get latest module scores from most recent polyline (if any)
    polylines = get_db_polylines()
    latest_scores = []
    if polylines:
        last_polyline = list(polylines.values())[-1]
        latest_scores = last_polyline.get('module_scores', [])

    # Use DQN navigator to get top recommendation
    rec = navigator.recommend_next(
        visited_ids=visited_ids,
        module_scores=latest_scores,
        nlp_resources=nlp_resources
    )

    # Build a path: agent → recommended resource, plus up to 4 more close unvisited
    path = [agent_pos]
    visited_set = set(str(v).strip() for v in visited_ids)
    
    if rec['resource']:
        path.append(rec['resource']['position'])
        # Add up to 4 more nearest unvisited resources
        remaining = [r for r in nlp_resources 
                     if str(r['id']).strip() not in visited_set and r['id'] != rec['resource']['id']]
        remaining.sort(key=lambda r: (
            (r['position']['x'] - rec['resource']['position']['x'])**2 +
            (r['position']['y'] - rec['resource']['position']['y'])**2
        ))
        for r in remaining[:4]:
            path.append(r['position'])

    final_resource = rec['resource']
    total_reward = sum(r['reward'] for r in nlp_resources
                       if r['position'] in path[1:]) if path else 0

    return jsonify({
        'path': path,
        'finalResource': final_resource,
        'totalReward': total_reward,
        'pathLength': len(path),
        'navigatorReason': rec['reason']
    })


@app.route('/api/next-recommendation', methods=['GET'])
def get_next_recommendation():
    """
    Get the DQN navigator's next resource recommendation for a session.
    Returns: { resource, module, reason, q_values }
    """
    session_id = request.args.get('session_id', 'default')
    session = get_session(session_id)
    visited_ids = [str(v).strip() for v in session.get('visitedResources', [])]

    # Get latest module scores from most recent polyline
    polylines = get_db_polylines()
    latest_scores = []
    if polylines:
        last_polyline = list(polylines.values())[-1]
        latest_scores = last_polyline.get('module_scores', [])

    rec = navigator.recommend_next(
        visited_ids=visited_ids,
        module_scores=latest_scores,
        nlp_resources=nlp_resources
    )

    return jsonify(rec)


# =============================================
# LEARNING DATA ENDPOINTS
# =============================================

@app.route('/api/learning-data', methods=['GET'])
def get_learning_data():
    """Get comprehensive learning data based on session history and latest summary"""
    session_id = request.args.get('session_id', 'default')
    session = get_session(session_id)
    
    visited_ids = set(str(v).strip() for v in session.get('visitedResources', []))
    visited_resources = [r for r in nlp_resources if str(r['id']).strip() in visited_ids]
    
    # Defaults
    strengths = [r['title'] for r in visited_resources if r.get('difficulty', 0) <= 2]
    # Recommendations using rewarding modules that are unvisited
    unvisited = [r for r in nlp_resources if str(r['id']).strip() not in visited_ids]
    unvisited.sort(key=lambda r: (-r.get('reward', 0), r.get('difficulty', 0)))
    recommendations = [r['title'] for r in unvisited[:3]]
    
    # Try to augment with results from the latest summary analysis
    ai_analysis = ""
    xp_earned = 0
    try:
        from database import load_db
        db = load_db()
        # Find latest summary for this session (they contain session_id in their ID or we match title)
        matching_summaries = [s for s in db.get('summaries', []) if f"summary_{session_id}" in s.get('id', '')]
        if matching_summaries:
            latest = matching_summaries[-1]
            if latest.get('strengths'):
                strengths = latest['strengths']
            if latest.get('recommendations'):
                recommendations = latest['recommendations']
            if latest.get('ai_analysis'):
                ai_analysis = latest['ai_analysis']
            xp_earned = latest.get('xp_earned', 0)
    except Exception as e:
        print(f"Error augmenting learning data from summaries: {e}")

    # Calculate activity log and heatmap from all summaries for this session
    activity_heatmap = {}
    activity_log = []
    try:
        from database import load_db
        db = load_db()
        all_summaries = db.get('summaries', [])
        
        # 1. Add Summary Activity
        for s in all_summaries:
            s_id = s.get('id', '')
            # Robust parsing for summary_{session_id}_{YYYYMMDD}_{HHMMSS}
            # We look for the YYYYMMDD part after the first two underscores
            if f"summary_" in s_id:
                parts = s_id.split('_')
                # For summary_default_20260403_032235, parts are: ['summary', 'default', '20260403', '032235']
                # Search for the part that is exactly 8 digits (YYYYMMDD) and >= 2024
                date_str = None
                for p in parts[2:]:
                    if len(p) == 8 and p.isdigit() and p.startswith('20'):
                        date_str = p
                        break
                
                if date_str:
                    formatted_date = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"
                    # Weighted count: Summaries (deep learning) count as 2, visits/notifs as 1
                    activity_heatmap[formatted_date] = activity_heatmap.get(formatted_date, 0) + 2
                
                # Add to activity log (list of recent events)
                activity_log.append({
                    'id': s_id,
                    'type': 'summary',
                    'title': s.get('title', 'Summary Written'),
                    'timestamp': s.get('timestamp', int(datetime.now().timestamp() * 1000))
                })

        # 2. Add Notification/Visit Activity
        notifs = session.get('notifications', [])
        for n in notifs:
            ts = n.get('timestamp')
            if ts:
                # Convert ms timestamp to YYYY-MM-DD
                dt = datetime.fromtimestamp(ts / 1000.0)
                formatted_date = dt.strftime('%Y-%m-%d')
                activity_heatmap[formatted_date] = activity_heatmap.get(formatted_date, 0) + 1
        
        # Sort log by timestamp descending to show most recent at the top
        activity_log.sort(key=lambda x: str(x.get('timestamp', '')), reverse=True)
        activity_log = activity_log[:50] # Limit window

    except Exception as e:
        print(f"Error calculating activity log: {e}")

    # Find most visited module
    from collections import Counter
    module_counts = Counter(r['module'] for r in visited_resources)
    most_visited_module = module_counts.most_common(1)[0][0] if module_counts else "None"

    return jsonify({
        'totalResources': len(nlp_resources),
        'visitedResources': len(visited_resources),
        'currentLevel': session.get('level', 1),
        'strengths': strengths[:3],
        'recommendations': recommendations[:3],
        'ai_analysis': ai_analysis,
        'activityHeatmap': activity_heatmap,
        'activityLog': activity_log,
        'nextOptimalResource': unvisited[0]['position'] if unvisited else None,
        'totalReward': session.get('totalReward', 0),
        'mostVisitedModule': most_visited_module,
        'xp_earned': xp_earned
    })


# =============================================
# BOOKMARK ENDPOINTS
# =============================================

@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    """Get all bookmarked resources for a session"""
    session_id = request.args.get('session_id', 'default')
    from database import get_bookmarks as get_db_bookmarks
    return jsonify(get_db_bookmarks(session_id))


@app.route('/api/bookmarks/add', methods=['POST'])
def add_bookmark():
    """Add a resource to bookmarks"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    resource_id = data.get('resource_id')
    
    if not resource_id:
        return jsonify({'error': 'Resource ID required'}), 400
        
    from database import add_bookmark as add_db_bookmark
    add_db_bookmark(session_id, resource_id)
    return jsonify({'status': 'success', 'resource_id': resource_id})


@app.route('/api/bookmarks/remove', methods=['POST'])
def remove_bookmark():
    """Remove a resource from bookmarks"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    resource_id = data.get('resource_id')
    
    if not resource_id:
        return jsonify({'error': 'Resource ID required'}), 400
        
    from database import remove_bookmark as remove_db_bookmark
    remove_db_bookmark(session_id, resource_id)
    return jsonify({'status': 'success', 'resource_id': resource_id})


# =============================================
# NOTES ENDPOINTS
# =============================================

@app.route('/api/notes', methods=['GET'])
def get_notes_route():
    """Get all notes for a session"""
    session_id = request.args.get('session_id', 'default')
    return jsonify(get_notes(session_id))


@app.route('/api/notes', methods=['POST'])
def add_note_route():
    """Add a new note"""
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    note_data = data.get('note')
    
    if not note_data:
        return jsonify({'error': 'Note data required'}), 400
        
    new_note = add_note(session_id, note_data)
    return jsonify(new_note)


# =============================================
# LECTURES ENDPOINTS
# =============================================

@app.route('/api/lectures', methods=['GET'])
def get_lectures_route():
    """Get all available lectures"""
    return jsonify(get_lectures())



# =============================================
# AI SIDER CHAT ENDPOINT
# =============================================

# Load YouTube transcripts
_transcripts_path = os.path.join(os.path.dirname(__file__), 'data', 'youtube_transcripts.json')
try:
    if os.path.exists(_transcripts_path):
        with open(_transcripts_path, 'r', encoding='utf-8') as f:
            raw_transcripts = json.load(f)
        # Normalize keys to lowercase for robust matching
        _youtube_transcripts = {str(k).strip().lower(): v for k, v in raw_transcripts.items()}
        print(f"Loaded and normalized transcripts for {len(_youtube_transcripts)} modules")
    else:
        print(f"Transcripts file not found: {_transcripts_path}")
        _youtube_transcripts = {}
except Exception as e:
    print(f"Could not load transcripts: {e}")
    _youtube_transcripts = {}


from openai import OpenAI

# AI Client configuration
# Using Groq (OpenAI-compatible) for free high-quality inference
_ai_client = None
try:
    _api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY") or "FIXME_YOUR_API_KEY"
    _base_url = "https://api.groq.com/openai/v1" if "GROQ" in _api_key or _api_key == "FIXME_YOUR_API_KEY" else None
    _ai_client = OpenAI(api_key=_api_key, base_url=_base_url)
except Exception as e:
    print(f"AI Client initialization warning: {e}")

@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    """
    AI Sider chat endpoint - upgraded to use the openai package.
    Uses YouTube transcript context and a premium model for better answers.
    """
    data = request.get_json()
    module = data.get('module', '')
    question = data.get('question', '')
    history = data.get('history', [])
    
    if not question.strip():
        return jsonify({'answer': 'Please ask a question about this lesson.', 'source': 'none'})
    
    # 1. Find transcript/context with better matching
    # Normalize input module for lookup
    module_norm = str(module).strip().lower()
    transcript = _youtube_transcripts.get(module_norm, '')
    
    if not transcript:
        # Try finding the resource first to get its formal title
        resource_match = None
        for r in nlp_resources:
            if r['id'] == module or r['title'].lower() == module_norm or r.get('module', '').lower() == module_norm:
                resource_match = r
                break
        
        target_name = resource_match['title'] if resource_match else module_norm
        target_name_lower = target_name.lower()
        
        # Fuzzy match on transcripts keys
        for key, val in _youtube_transcripts.items():
            if key in target_name_lower or target_name_lower in key:
                transcript = val
                break
                
    resource_desc = ''
    for r in nlp_resources:
        if r.get('module', '').lower() == module_norm or r.get('title', '').lower() == module_norm:
            resource_desc = r.get('description', '')[:1000]
            break
            
    context = transcript[:4500] if transcript else resource_desc[:1500]
    
    # 2. Try Premium Inference via OpenAI Package
    # Check for actual keys, not just the placeholder
    _key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
    if _ai_client and _key and _key != "FIXME_YOUR_API_KEY":
        try:
            # Determine model based on provider
            if "groq" in (_ai_client.base_url or "").lower():
                model = "llama-3.3-70b-versatile"
            else:
                model = "gpt-3.5-turbo"
            
            system_prompt = f"""You are 'Sider AI', a premium learning assistant for an Advanced NLP course.
Your goal is to help students understand the current lesson module: '{module}'.

Use the following context from the lesson's YouTube transcript/description to answer the student's question accurately:
---
{context}
---

INSTRUCTIONS:
- Be concise, professional, and encouraging.
- If the answer is in the context, prioritize that information.
- If the answer isn't in the context, use your general LLM knowledge to explain the concept.
- Format your response using clean Markdown."""

            messages = [{"role": "system", "content": system_prompt}]
            # Add limited history for continuity
            for msg in history[-4:]:
                role = "user" if msg.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("content", "")})
            
            messages.append({"role": "user", "content": question})
            
            completion = _ai_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=800
            )
            answer = completion.choices[0].message.content
            return jsonify({'answer': answer, 'source': f'openai-{model}'})
            
        except Exception as e:
            print(f"[CHAT] Premium AI error: {e}")
            # Fall through to lookup if premium fails
            
    # 3. Fallback to Search/Lookup (Avoiding T5 to prevent worker timeouts on HF)
    relevant_context = ""
    if context:
        sentences = context.split('.')
        # Find sentences containing keywords from the question
        keywords = [w.lower() for w in question.split() if len(w) > 3]
        matching = []
        for s in sentences:
            if any(k in s.lower() for k in keywords):
                matching.append(s.strip())
        relevant_context = ". ".join(matching[:3])
    
    if relevant_context:
        answer = f"I found some relevant information in the lesson material: {relevant_context}. For a deeper explanation, please ensure an API key is configured in the environment."
    else:
        answer = f"I'm here to help with the lesson on '{module}'. I couldn't find a specific answer in the local material, but you should review the module description for more details. (Tip: Configure an AI API key for better responses)."

    return jsonify({'answer': answer, 'source': 'transcript-lookup'})


if __name__ == '__main__':
    print(f"Loaded {len(nlp_resources)} NLP resources")
