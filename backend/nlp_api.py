"""
NLP Learning Grid API
Provides endpoints for the frontend grid-based NLP learning system.
"""

import os
import json
import pandas as pd
from flask import jsonify, request
from init import app
import numpy as np
from datetime import datetime
from database import get_session, update_session, save_summary, save_polyline, get_polylines as get_db_polylines
from request_logger import log_request
from nltk.corpus import stopwords
from utils import utils_preprocess_text, get_cos_sim

# Define stopwords
stop_words = set(stopwords.words('english'))

# Polyline logging
POLYLINE_LOG_FILE = os.path.join(os.path.dirname(__file__), 'polyline_generation.log')

def log_polyline_step(step, details):
    """Log detailed steps of polyline generation"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(POLYLINE_LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"[{timestamp}] [{step}]\n{details}\n{'-'*50}\n")

try:
    from sentence_transformers import SentenceTransformer
    bert_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("BERT model loaded successfully")
except Exception as e:
    print(f"Error loading BERT model: {e}")
    bert_model = None

# Load NLP data from Excel
nlp_excel_path = os.path.join(os.path.dirname(__file__), 'nlp', 'NLP_Resource_Keywords_from_Embeddings.xlsx')

def load_nlp_resources():
    """Load NLP resources from Excel file"""
    try:
        df = pd.read_excel(nlp_excel_path)
        resources = []
        
        used_positions = set()
        
        for idx, row in df.iterrows():
            # Force specific position for certain key resources to be central and visible
            name_lower = str(row.get('name', '')).lower()
            if 'vision language models' in name_lower:
                x, y = 10, 10
            else:
                # Get preferred position or random (with extra padding: 2-17 to avoid edges)
                x = int(row.get('x', np.random.randint(2, 18)))
                y = int(row.get('y', np.random.randint(2, 18)))
            
            # Resolve collisions
            while (x, y) in used_positions:
                # Simple random re-roll (with extra padding)
                x = np.random.randint(2, 18)
                y = np.random.randint(2, 18)
                
            used_positions.add((x, y))
            
            resource = {
                'id': str(idx + 1),
                'position': {'x': x, 'y': y},
                'type': 'book',  # Default type since not in keyword file
                'title': row.get('name', f'Resource {idx + 1}'),
                'visited': False,
                'difficulty': 2, # Default difficulty
                'reward': 50,    # Default reward
                'url': row.get('links', ''), # Using 'links' column
                'description': str(row.get('description', '')),
                'module': row.get('module', 'General') # Add module/topic
            }
            resources.append(resource)
        
        return resources
    except Exception as e:
        print(f"Error loading NLP resources: {e}")
        return []

# Cache resources
nlp_resources = load_nlp_resources()

# Pre-compute module embeddings
module_embeddings = {}

def compute_module_embeddings():
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

# Compute embeddings on startup
compute_module_embeddings()

# =============================================
# RESOURCES ENDPOINTS
# =============================================

@app.before_request
def before_request_logging():
    if request.path.startswith('/api'):
        log_request()

@app.route('/api/resources', methods=['GET'])
def get_resources():
    """Get all NLP learning resources with their grid positions"""
    return jsonify(nlp_resources)


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
        session['totalReward'] += resource['reward']
        session['level'] = min(5, 1 + len(session['visitedResources']) // 4)
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
    title = data.get('title', '')
    summary = data.get('summary', '')
    visited_ids = data.get('visited_resources', [])
    
    if not title or not summary:
        return jsonify({'error': 'Title and summary required'}), 400
    
    # Get visited resources
    visited_resources = [r for r in nlp_resources if r['id'] in visited_ids]
    
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
        # Check exact module name
        if module.lower() in summary_lower:
            keywords_found.append(module)
            continue
            
        # Check aliases
        aliases = module_aliases.get(module, [])
        for alias in aliases:
            if alias.lower() in summary_lower:
                keywords_found.append(module)
                break
            
    # Also check against visited resources titles
    for r in visited_resources:
        if r['title'].lower() in summary_lower and r['title'] not in keywords_found:
            keywords_found.append(r['title'])

    # Calculate module scores for polyline
    module_scores = []
    
    # Log start of polyline generation
    log_polyline_step("START_GENERATION", 
                     f"Generating polyline for summary: '{summary[:100]}...'\n"
                     f"Models available: BERT={bert_model is not None}, Preprocessing=NLTK/WordNet")

    if bert_model and module_embeddings:
        try:
            # Preprocess summary
            clean_summary = utils_preprocess_text(summary, flg_stemm=False, flg_lemm=True, lst_stopwords=stop_words)
            
            log_polyline_step("PREPROCESSING", 
                            f"Original: {summary[:100]}...\n"
                            f"Cleaned: {clean_summary[:100]}...\n"
                            f"Method: utils_preprocess_text (HTML strip, punct removal, lemmatization)")

            # Encode summary
            summary_embedding = bert_model.encode(clean_summary)
            
            log_polyline_step("EMBEDDING_GENERATION",
                            f"Model: all-MiniLM-L6-v2 (SentenceTransformer)\n"
                            f"Input: Cleaned summary text\n"
                            f"Output shape: {summary_embedding.shape}")
            
            step_details = []
            for module in ordered_modules:
                score = 0.0
                sim = 0.0
                match_type = "None"
                
                if module in module_embeddings:
                    # Calculate cosine similarity
                    sim = get_cos_sim(summary_embedding, module_embeddings[module])
                    # Use similarity as base score (clamped to 0+)
                    score = max(0.0, sim)
                    match_type = "Cosine Similarity"
                
                # Hybrid approach: Boost if explicit keywords found
                keyword_boost = 0.0
                if module in keywords_found:
                    keyword_boost = 0.3
                    score += keyword_boost
                    match_type += " + Keyword Match"
                    
                # Boost if any resource from this module was visited
                visit_boost = 0.0
                module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
                if module_visited_count > 0:
                    visit_boost = 0.1 * module_visited_count
                    score += visit_boost
                    match_type += f" + Visits({module_visited_count})"
                    
                # Clamp between 0 and 1
                final_score = float(max(0.0, min(1.0, score)))
                module_scores.append(final_score)
                
                step_details.append(
                    f"Module: {module}\n"
                    f"  - Base Sim: {sim:.4f}\n"
                    f"  - Keyword Boost: {keyword_boost}\n"
                    f"  - Visit Boost: {visit_boost}\n"
                    f"  - Final Score: {final_score:.4f}"
                )
            
            log_polyline_step("SCORING_DETAILS", "\n".join(step_details))
                
        except Exception as e:
            error_msg = f"Error computing BERT scores: {e}"
            print(error_msg)
            log_polyline_step("ERROR", error_msg)
            
            # Fallback to simple logic
            for module in ordered_modules:
                score = 0.5 + (np.random.random() - 0.5) * 0.1
                if module in keywords_found: score += 0.2
                module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
                if module_visited_count > 0: score += 0.1 * module_visited_count
                module_scores.append(float(max(0.0, min(1.0, score))))
    else:
        # Fallback if no model
        for module in ordered_modules:
            # Base score
            score = 0.5 
            
            # Add random noise for variation (simulating "organic" learning curve)
            noise = (np.random.random() - 0.5) * 0.1
            score += noise
            
            # Boost if module keyword found in summary
            if module in keywords_found:
                score += 0.2
                
            # Boost if any resource from this module was visited
            module_visited_count = sum(1 for r in visited_resources if r['module'] == module)
            if module_visited_count > 0:
                score += 0.1 * module_visited_count
                
            # Clamp between 0 and 1
            module_scores.append(float(max(0.0, min(1.0, score))))

    # Log final result
    log_polyline_step("FINAL_POLYLINE", 
                     f"Generated {len(module_scores)} scores for {len(ordered_modules)} modules.\n"
                     f"Polyline Vector: {module_scores}")

    # Find strengths (topics with lower difficulty learned)
    strengths = [r['title'] for r in visited_resources if r['difficulty'] <= 2]
    
    # Find recommendations (higher difficulty topics not yet visited)
    unvisited_harder = [r for r in nlp_resources if r['id'] not in visited_ids and r['difficulty'] >= 3]
    recommendations = [r['title'] for r in unvisited_harder[:3]]
    
    polylines = get_db_polylines()
    
    # Aggregate keywords from all polylines to find most frequent topics
    from collections import Counter
    all_keywords = []
    for p in polylines.values():
        if 'keywords_found' in p:
            all_keywords.extend(p['keywords_found'])
    all_keywords.extend(keywords_found)
    
    keyword_counts = Counter(all_keywords)
    most_common_keywords = [k for k, v in keyword_counts.most_common(3)]
    
    summary_result = {
        'id': f"summary_{session_id}_{len(polylines)}",
        'title': title,
        'summary': summary,
        'keywords_found': keywords_found,
        'totalResources': len(nlp_resources),
        'visitedResources': len(visited_resources),
        'currentLevel': min(5, 1 + len(visited_resources) // 4),
        'strengths': strengths,
        'recommendations': recommendations,
        'avgDifficulty': round(avg_difficulty, 2),
        'totalReward': total_reward
    }
    
    save_summary(summary_result)
    
    # Identify dominant topics from module scores
    dominant_topics = []
    if module_scores:
        # Pair scores with module names
        scored_modules = list(zip(ordered_modules, module_scores))
        # Sort by score descending
        scored_modules.sort(key=lambda x: x[1], reverse=True)
        # Take top 3 with score > 0.3
        dominant_topics = [m for m, s in scored_modules[:3] if s > 0.3]

    # Generate AI Analysis using Gemini Flash (if key) or Local Fallback
    ai_analysis = ""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            prompt = (
                f"Analyze this learning student.\n"
                f"Current Summary: '{summary}'\n"
                f"History of Focus: {', '.join(most_common_keywords)}\n"
                f"Current Dominant Topics: {', '.join(dominant_topics)}\n"
                f"Instruction: Provide VERY SHORT feedback (max 2 sentences).\n"
                f"1. If the summary is poor/short, CRITICIZE their expression and tell them to improve.\n"
                f"2. If good, praise briefly.\n"
                f"3. Suggest a next topic based on their history of focus."
            )
            
            response = model.generate_content(prompt)
            ai_analysis = response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            ai_analysis = f"Gemini Error: {e}" # Fallthrough to local
            
    # Fallback to Local Model if no Gemini key or if execution failed (and analysis is empty/error)
    if not ai_analysis or "Error" in ai_analysis:
        try:
            print("Using local model fallback...")
            from transformers import pipeline
            # Load small efficient model for CPU inference
            # We lazy load this to avoid startup impact if not needed
            generator = pipeline('text2text-generation', model='google/flan-t5-small')
            
            # Adaptive prompt for local model
            focus_area = most_common_keywords[0] if most_common_keywords else "NLP"
            
            # Heuristic for summary quality to guide the simple T5 model
            summary_quality = "bad" if len(summary.split()) < 10 else "good"
            
            prompt = ""
            if summary_quality == "bad":
                prompt = f"tell student to improve summary about {focus_area}. be critical."
            else:
                prompt = f"praise student for good summary about {focus_area} and suggest advanced topic."
            
            output = generator(prompt, max_length=60, do_sample=True, temperature=0.7)
            generated_text = output[0]['generated_text']
            
            # Capitalize
            generated_text = generated_text[0].upper() + generated_text[1:] if generated_text else "Keep learning!"
            
            ai_analysis = f"AI Insight: {generated_text}"
                           
        except Exception as e:
            print(f"Local Model Error: {e}")
            ai_analysis = (f"Based on your path, you have shown strong engagement with {', '.join(dominant_topics[:2])}. "
                           f"You successfully reinforced concepts in {', '.join(strengths[:2])}. "
                           f"Consider exploring advanced topics in {recommendations[0] if recommendations else 'new areas'} next.")

    # Store polyline
    polyline_id = f"polyline_{len(polylines)}"
    new_polyline = {
        'id': polyline_id,
        'name': title,
        'path': [r['position'] for r in visited_resources],
        'color': f'rgba({np.random.randint(50, 255)}, {np.random.randint(50, 255)}, {np.random.randint(50, 255)}, 0.4)',
        'isActive': True,
        'confidence': round(0.7 + (len(visited_resources) / len(nlp_resources)) * 0.25, 2),
        'summary': summary,
        'keywords_found': keywords_found,
        'module_scores': module_scores,
        'strengths': strengths,
        'dominant_topics': dominant_topics,
        'ai_analysis': ai_analysis
    }
    
    save_polyline(polyline_id, new_polyline)
    
    return jsonify({
        'summary': summary_result,
        'polyline': new_polyline
    })


# =============================================
# POLYLINE ENDPOINTS
# =============================================

@app.route('/api/polylines', methods=['GET'])
def get_polylines_route():
    """Get all polylines"""
    polylines = get_db_polylines()
    return jsonify(list(polylines.values()))


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
    Generate DQN optimal path
    
    Request JSON:
    {
        "session_id": "str",
        "agent_position": {"x": int, "y": int},
        "visited_resource_ids": ["id1", "id2", ...]
    }
    """
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    agent_pos = data.get('agent_position', {'x': 10, 'y': 10})
    visited_ids = set(data.get('visited_resource_ids', []))
    
    # Get unvisited resources (preferring higher reward, lower difficulty)
    unvisited = [r for r in nlp_resources if r['id'] not in visited_ids]
    unvisited.sort(key=lambda r: (-r['reward'], r['difficulty']))
    
    # Select best resources for DQN path (up to 5)
    selected = unvisited[:5]
    
    # Simple DQN path: current position -> closest unvisited -> farthest from start
    path = [agent_pos]
    
    if selected:
        # Calculate distances
        distances = [
            {
                'resource': r,
                'dist': ((r['position']['x'] - agent_pos['x'])**2 + 
                        (r['position']['y'] - agent_pos['y'])**2)**0.5
            }
            for r in selected
        ]
        distances.sort(key=lambda x: x['dist'])
        
        # Build path
        path.extend([r['resource']['position'] for r in distances])
    
    # Calculate total reward
    total_reward = sum(r['reward'] for r in selected)
    final_resource = selected[-1] if selected else None
    
    result = {
        'path': path,
        'finalResource': final_resource,
        'totalReward': total_reward,
        'pathLength': len(path)
    }
    
    return jsonify(result)


# =============================================
# LEARNING DATA ENDPOINTS
# =============================================

@app.route('/api/learning-data', methods=['GET'])
def get_learning_data():
    """Get comprehensive learning data"""
    session_id = request.args.get('session_id', 'default')
    
    session = get_session(session_id)
    
    visited_ids = session['visitedResources']
    visited_resources = [r for r in nlp_resources if r['id'] in visited_ids]
    
    # Calculate recommendations
    unvisited = [r for r in nlp_resources if r['id'] not in visited_ids]
    unvisited.sort(key=lambda r: (-r['reward'], r['difficulty']))
    
    return jsonify({
        'totalResources': len(nlp_resources),
        'visitedResources': len(visited_resources),
        'currentLevel': session.get('level', 1),
        'strengths': [r['title'] for r in visited_resources if r['difficulty'] <= 2],
        'recommendations': [r['title'] for r in unvisited[:3]],
        'nextOptimalResource': unvisited[0]['position'] if unvisited else None,
        'totalReward': session.get('totalReward', 0)
    })


if __name__ == '__main__':
    print(f"Loaded {len(nlp_resources)} NLP resources")
