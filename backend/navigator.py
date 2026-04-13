"""
Navigator — DQN-based Next Resource Recommender
================================================
Loads the pre-trained DQN model from Navigators/dqn_model.pth and uses it
to recommend the next best resource for a student to visit.

Model architecture (inferred from .pth weights):
    fc1: Linear(18, 128)   — input is a 18-dim state vector
    fc2: Linear(128, 128)  — hidden layer
    fc3: Linear(128, 18)   — output is Q-values over 18 topic modules
    (ReLU activations between layers)

State vector (18-dim): one value per topic module, representing the student's
    assimilation score (from the polyline) for that module.

Output: index of the module (0-17) with the highest Q-value among unvisited.
    The unvisited resource from that module with the highest reward is returned.
"""

import os
import numpy as np

# ──────────────────────────────────────────────
# Model Definition — must match training architecture
# ──────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'navigators', 'dqn_model.pth')

_dqn_net = None
_dqn_mode = "unavailable"

try:
    import torch
    import torch.nn as nn

    class DQNNet(nn.Module):
        def __init__(self, input_dim=18, hidden_dim=128, output_dim=18):
            super().__init__()
            self.fc1 = nn.Linear(input_dim, hidden_dim)
            self.fc2 = nn.Linear(hidden_dim, hidden_dim)
            self.fc3 = nn.Linear(hidden_dim, output_dim)

        def forward(self, x):
            x = torch.relu(self.fc1(x))
            x = torch.relu(self.fc2(x))
            return self.fc3(x)

    _net = DQNNet(input_dim=18, hidden_dim=128, output_dim=18)
    state_dict = torch.load(_MODEL_PATH, map_location='cpu', weights_only=False)
    _net.load_state_dict(state_dict)
    _net.eval()
    _dqn_net = _net
    _dqn_mode = "dqn"
    print("DQN Navigator loaded successfully")

except Exception as e:
    print(f"DQN Navigator fallback mode (could not load model): {e}")
    _dqn_mode = "fallback"


# ──────────────────────────────────────────────
# Topic-to-module index mapping (matches nlp_api.py order)
# ──────────────────────────────────────────────
ORDERED_MODULES = [
    "Pre training objectives",
    "Pre trained models",
    "Tutorial: Introduction to huggingface",
    "Fine tuning LLM",
    "Instruction tuning",
    "Prompt based learning",
    "Parameter efficient fine tuning",
    "Incontext Learning",
    "Prompting methods",
    "Multiprompt Learning",
    "Prompt aware training methods",
    "Retrieval Methods",
    "Retrieval Augmented Generation",
    "Model Distillation",
    "Model Quantization",
    "Model Pruning",
    "Mixture of Experts Model",
    "Agentic AI",
    "Multimodal LLMs",
]


def recommend_next(visited_ids: list, module_scores: list, nlp_resources: list) -> dict:
    """
    Recommend the next best resource using combined DQN + sequential progression.
    
    The DQN Q-values alone have minimal differentiation, so we combine them
    with sequential module ordering for sensible recommendations:
      - 70% weight on sequential progression (next module by S.No)
      - 30% weight on DQN Q-value ranking
    """
    visited_set = set(str(v).strip() for v in visited_ids)
    unvisited = [r for r in nlp_resources if str(r['id']).strip() not in visited_set]

    print(f"\n[NAV DEBUG] --- recommend_next called ---")
    print(f"[NAV DEBUG] Total resources: {len(nlp_resources)}, Visited: {len(visited_ids)}, Unvisited: {len(unvisited)}")

    if not unvisited:
        print("[NAV DEBUG] No unvisited resources remaining!")
        return {"resource": None, "module": None, "reason": _dqn_mode, "q_values": []}

    # ── Build state vector ──────────────────────────────────────
    state = list(module_scores) if module_scores else []
    if len(state) < 18:
        state.extend([0.5] * (18 - len(state)))
    state = state[:18]
    state_arr = np.array(state, dtype=np.float32)

    # ── Group unvisited resources by module ──────────────────
    module_to_resources = {}
    for r in unvisited:
        m = r.get('module', '')
        if m not in module_to_resources:
            module_to_resources[m] = []
        module_to_resources[m].append(r)

    print(f"[NAV DEBUG] Unvisited modules ({len(module_to_resources)}): {list(module_to_resources.keys())}")

    q_values = []
    reason = _dqn_mode

    # ── Compute sequential scores (which module should come next by S.No) ──
    # Find the highest visited module index to determine progression
    visited_module_indices = set()
    for r in nlp_resources:
        if str(r['id']).strip() in visited_set:
            m = r.get('module', '')
            if m in ORDERED_MODULES:
                visited_module_indices.add(ORDERED_MODULES.index(m))

    max_visited_idx = max(visited_module_indices) if visited_module_indices else -1
    print(f"[NAV DEBUG] Highest visited module index: {max_visited_idx} ({ORDERED_MODULES[max_visited_idx] if max_visited_idx >= 0 else 'none'})")

    # Sequential score: modules right after the last visited get highest score
    sequential_scores = {}
    for module_name in module_to_resources:
        if module_name in ORDERED_MODULES:
            idx = ORDERED_MODULES.index(module_name)
            # Distance from next expected module (max_visited_idx + 1)
            distance = abs(idx - (max_visited_idx + 1))
            # Score: closer to next = higher score (normalize to 0-1)
            # Use asinh to soften the penalty for distance so DQN can override more easily
            sequential_scores[module_name] = 1.0 / (1.0 + distance * 0.5)

    # ── DQN scores (normalized to 0-1 range) ──
    dqn_scores = {}
    if _dqn_net is not None:
        try:
            import torch
            with torch.no_grad():
                t = torch.tensor(state_arr).unsqueeze(0)
                qs = _dqn_net(t).squeeze(0).tolist()
            q_values = qs

            # Normalize Q-values to 0-1 for the modules that have unvisited resources
            relevant_qs = []
            for module_name in module_to_resources:
                if module_name in ORDERED_MODULES:
                    idx = ORDERED_MODULES.index(module_name)
                    relevant_qs.append(qs[idx])

            if relevant_qs:
                q_min = min(relevant_qs)
                q_range = max(relevant_qs) - q_min
                if q_range > 0.01:  # Meaningful differentiation
                    for module_name in module_to_resources:
                        if module_name in ORDERED_MODULES:
                            idx = ORDERED_MODULES.index(module_name)
                            dqn_scores[module_name] = (qs[idx] - q_min) / q_range
                else:
                    # Q-values are too clustered, DQN can't differentiate
                    print(f"[NAV DEBUG] Q-values too clustered (range={q_range:.4f}), ignoring DQN scores")
                    for module_name in module_to_resources:
                        dqn_scores[module_name] = 0.5  # neutral

            reason = "dqn"
        except Exception as e:
            print(f"[NAV DEBUG] DQN inference error: {e}")
            reason = "fallback"

    # ── Combined scoring (DQN-forward approach) ──
    WEIGHT_SEQUENTIAL = 0.05
    WEIGHT_DQN = 0.95

    best_module = None
    best_score = float('-inf')

    print(f"[NAV DEBUG] Module scores (seq={WEIGHT_SEQUENTIAL}, dqn={WEIGHT_DQN}):")
    for module_name in module_to_resources:
        seq = sequential_scores.get(module_name, 0.0)
        dqn = dqn_scores.get(module_name, 0.5)
        combined = WEIGHT_SEQUENTIAL * seq + WEIGHT_DQN * dqn
        
        idx_str = ""
        if module_name in ORDERED_MODULES:
            idx_str = f" (idx={ORDERED_MODULES.index(module_name)})"
        
        print(f"[NAV DEBUG]   '{module_name}'{idx_str}: seq={seq:.3f}, dqn={dqn:.3f}, combined={combined:.3f}")
        
        if combined > best_score:
            best_score = combined
            best_module = module_name

    if best_module and best_module in module_to_resources:
        candidates = module_to_resources[best_module]
        candidates.sort(key=lambda r: -r['reward'])
        chosen = candidates[0]
        print(f"[NAV DEBUG] ✓ Chose '{best_module}' → '{chosen['title']}' (id={chosen['id']}, score={best_score:.3f})")
        return {
            "resource": chosen,
            "module": best_module,
            "reason": reason,
            "q_values": q_values
        }

    # ── Fallback: next sequential unvisited resource ──
    unvisited_sorted = sorted(unvisited, key=lambda r: int(r['id']))
    best = unvisited_sorted[0]
    print(f"[NAV DEBUG] Fallback: '{best['title']}' (id={best['id']})")
    return {
        "resource": best,
        "module": best.get('module', ''),
        "reason": "fallback",
        "q_values": q_values
    }

