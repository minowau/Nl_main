import os
import json
import numpy as np

def load_nlp_resources():
    nlp_json_path = os.path.join(os.getcwd(), 'backend', 'nlp', 'nlp_resources.json')
    print(f"Loading from: {nlp_json_path}")
    
    try:
        if not os.path.exists(nlp_json_path):
            print(f"File not found: {nlp_json_path}")
            return []
            
        with open(nlp_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        print(f"Data count: {len(data)}")
        
        # Group by difficulty for tiered journey
        intro_resources = [r for r in data if int(r.get('difficulty', 2)) <= 3]
        medium_resources = [r for r in data if 4 <= int(r.get('difficulty', 2)) <= 7]
        advanced_resources = [r for r in data if int(r.get('difficulty', 2)) >= 8]
        
        print(f"Intro: {len(intro_resources)}, Medium: {len(medium_resources)}, Advanced: {len(advanced_resources)}")
        
        # Limit introductory count as requested (top 6 by reward)
        intro_resources.sort(key=lambda x: int(x.get('reward', 0)), reverse=True)
        intro_resources = intro_resources[:6]
        
        journey_data = intro_resources + medium_resources + advanced_resources
        print(f"Journey data count: {len(journey_data)}")
        
        resources = []
        for idx, row in enumerate(journey_data):
            title = str(row.get('name', f'Resource {idx + 1}')).strip()
            module = str(row.get('module', title)).strip()
            difficulty = int(row.get('difficulty', 2))
            
            if difficulty <= 3:
                y_min, y_max = 16, 19
            elif difficulty <= 7:
                y_min, y_max = 8, 15
            else:
                y_min, y_max = 1, 7
            
            x = int(row.get('x', np.random.randint(2, 18)))
            y = int(row.get('y', np.random.randint(y_min, y_max + 1)))
            
            resource = {
                'id': str(row.get('id', idx + 1)),
                'title': title,
                'module': module,
                'type': str(row.get('type', 'video')),
                'difficulty': difficulty,
                'reward': int(row.get('reward', 10 * difficulty)),
                'position': {'x': x, 'y': y},
                'visited': row.get('visited', False)
            }
            resources.append(resource)
            
        return resources
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    res = load_nlp_resources()
    print(f"Final Count: {len(res)}")
