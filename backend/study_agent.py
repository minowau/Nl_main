"""
Hierarchical Multi-Agent Learning Architecture
==============================================
- OrchestratorAgent: Inspects the active lesson (title, module, difficulty, topic type,
  transcript/description) and learner state (visited modules, level), decides which
  specialized subagent is best suited for the current lesson, allocates custom directives
  to each subagent, and coordinates execution.
- Specialized Subagents:
  1. ConceptCoachSubAgent ('coach'): Builds mental models, prerequisite bridges, and step-by-step intuition.
  2. NotesSubAgent ('notes'): Synthesizes structured executive summaries and lecture takeaways.
  3. FlashcardSubAgent ('flashcards'): Generates active-recall flashcards and terminology decks.
  4. QuizSubAgent ('quiz'): Generates difficulty-calibrated multiple-choice concept checks.
- Powered by Groq LLM (llama-3.3-70b-versatile) via GROQ_API_KEY in .env, with automatic
  deterministic local corpus fallback so it never fails offline.
"""

import os
import re
import json
import random

_RAW_CORPUS = None


def _load_corpus():
    global _RAW_CORPUS
    if _RAW_CORPUS is not None:
        return _RAW_CORPUS
    corpus_path = os.path.join(os.path.dirname(__file__), 'nlp', 'nlp_resources.json')
    try:
        if os.path.exists(corpus_path):
            with open(corpus_path, 'r', encoding='utf-8') as f:
                _RAW_CORPUS = json.load(f)
        else:
            _RAW_CORPUS = []
    except Exception as e:
        print(f"[MULTI_AGENT] Could not load nlp_resources.json: {e}")
        _RAW_CORPUS = []
    return _RAW_CORPUS


def _clean_md(text: str) -> str:
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'\[(\d{2}:\d{2}(?::\d{2})?[^\]]*)\]', '', text)
    return re.sub(r'\s+', ' ', text).strip(' -•:\n\t')


def _extract_module_sections(description: str):
    """Parse markdown description from nlp_resources.json into structured blocks."""
    insights = []
    highlights = []
    glossary = []
    faqs = []
    summary_sentences = []

    if not description:
        return {
            'insights': insights,
            'highlights': highlights,
            'glossary': glossary,
            'faqs': faqs,
            'summary_sentences': summary_sentences,
        }

    for match in re.finditer(r'-\s*(?:\[[0-9:→\s-]+\]\s*)?\*\*([^*\n:]+?)(?::\*\*|\*\*:?)\s*([^\n]+)', description):
        concept = _clean_md(match.group(1))
        detail = _clean_md(match.group(2))
        if len(concept) > 3 and len(detail) > 25:
            insights.append({'concept': concept, 'detail': detail})

    for match in re.finditer(r'^\|\s*([^|\n-]+?)\s*\|\s*([^|\n-]+?)\s*\|$', description, re.MULTILINE):
        term = _clean_md(match.group(1))
        defn = _clean_md(match.group(2))
        if term.lower() in ('term', 'model', 'year', 'timestamp', 'model/concept', 'model/tokenizer', 'prompt variation'):
            continue
        if len(term) >= 2 and len(defn) >= 20 and not re.match(r'^\d{4}$', term):
            glossary.append({'term': term, 'definition': defn})

    for match in re.finditer(r'\*\*Q\d*:\s*([^*\n]+)\*\*\s*\n+\s*(?:A\d*:\s*)?([^\n]+)', description):
        q_text = _clean_md(match.group(1))
        a_text = _clean_md(match.group(2))
        if len(q_text) > 10 and len(a_text) > 20:
            faqs.append({'question': q_text, 'answer': a_text})

    for line in description.splitlines():
        line_str = line.strip()
        if line_str.startswith('- ') and len(line_str) > 35:
            cleaned = _clean_md(line_str[2:])
            if 35 <= len(cleaned) <= 220 and not cleaned.startswith('['):
                highlights.append(cleaned)

    for line in description.splitlines():
        line_str = line.strip()
        if not line_str or line_str.startswith('#') or line_str.startswith('-') or line_str.startswith('|'):
            continue
        for sent in re.split(r'(?<=[.!?])\s+', line_str):
            cleaned = _clean_md(sent)
            if 45 <= len(cleaned) <= 220:
                summary_sentences.append(cleaned)

    return {
        'insights': insights,
        'highlights': highlights,
        'glossary': glossary,
        'faqs': faqs,
        'summary_sentences': summary_sentences,
    }


def _find_module_entry(module_or_title: str, nlp_resources: list):
    corpus = _load_corpus()
    target = str(module_or_title or '').strip().lower()

    matched_res = None
    for r in nlp_resources:
        if (
            str(r.get('id', '')).lower() == target
            or r.get('title', '').lower() == target
            or r.get('module', '').lower() == target
        ):
            matched_res = r
            break

    if not matched_res and target:
        for r in nlp_resources:
            if target in r.get('title', '').lower() or target in r.get('module', '').lower():
                matched_res = r
                break

    if not matched_res and nlp_resources:
        matched_res = nlp_resources[0]

    module_name = matched_res.get('module', matched_res.get('title', '')) if matched_res else ''
    title_name = matched_res.get('title', module_name) if matched_res else ''
    description = matched_res.get('description', '') if matched_res else ''
    difficulty = int(matched_res.get('difficulty', 2)) if matched_res else 2

    for idx, row in enumerate(corpus):
        row_mod = str(row.get('module', '')).strip()
        row_name = str(row.get('name', '')).strip()
        if not module_name and target and (target in row_mod.lower() or target in row_name.lower()):
            module_name = row_mod or row_name
            title_name = row_name or row_mod
            description = str(row.get('description', ''))
            difficulty = 2 if idx < 5 else (4 if idx < 10 else (6 if idx < 15 else 7))
            break
        elif module_name and (row_mod.lower() == module_name.lower() or row_name.lower() == title_name.lower()):
            if len(str(row.get('description', ''))) > len(description):
                description = row.get('description', '')
            break

    if not module_name:
        module_name = module_or_title or 'Pre training objectives'
        title_name = module_name

    return {
        'id': str(matched_res.get('id', '1')) if matched_res else '1',
        'title': title_name,
        'module': module_name,
        'difficulty': difficulty,
        'description': description,
    }


def _classify_lesson_nature(title: str, module: str, difficulty: int) -> str:
    combined = f"{title} {module}".lower()
    if 'tutorial' in combined or 'huggingface' in combined or 'implementation' in combined:
        return 'Hands-On Coding & Applied Tutorial'
    if any(k in combined for k in ('math', 'attention', 'qlora', 'lora', 'peft', 'quantization', 'Pruning', 'pruning', 'distillation')):
        return 'Architecture & Mathematical Optimization'
    if any(k in combined for k in ('rlhf', 'ppo', 'dpo', 'alignment', 'rag', 'agent', 'deployment')):
        return 'Advanced Post-Training & Systems'
    if difficulty <= 2:
        return 'Foundational NLP Theory'
    return 'Core Transformer & LLM Mechanics'


def _collect_distractor_pool(exclude_module: str, nlp_resources: list):
    distractors = []
    for r in nlp_resources:
        if r.get('module', '').lower() == exclude_module.lower():
            continue
        parsed = _extract_module_sections(r.get('description', ''))
        for g in parsed['glossary'][:3]:
            distractors.append(g['definition'])
        for ins in parsed['insights'][:2]:
            distractors.append(ins['detail'])
        for hl in parsed['highlights'][:2]:
            distractors.append(hl)

    fallback_pool = [
        "It replaces all self-attention layers with static non-contextual K-means word clusters.",
        "It discards the encoder stack entirely and relies exclusively on character-level Markov chains.",
        "It updates only the input tokenizer vocabulary while keeping all projection matrices at zero.",
        "It requires labeled reinforcement rewards for every token prior to initial pre-training.",
        "It compresses token sequences using lossless Huffman coding rather than dense vector projections.",
        "It restricts context windows to a single bigram and prevents gradient flow across layers.",
    ]
    distractors.extend(fallback_pool)
    seen = set()
    filtered = []
    for d in distractors:
        d_clean = d[:155].rstrip() + ('...' if len(d) > 155 else '')
        if d_clean.lower() not in seen and len(d_clean) > 25:
            seen.add(d_clean.lower())
            filtered.append(d_clean)
    return filtered


_CACHED_GROQ_MODEL = None


def _get_llm_model_name(ai_client) -> str:
    global _CACHED_GROQ_MODEL
    if not ai_client:
        return "local-corpus-agent"
    base_url = str(getattr(ai_client, 'base_url', '') or '').lower()
    if "groq" not in base_url:
        return "gpt-3.5-turbo"

    if _CACHED_GROQ_MODEL:
        return _CACHED_GROQ_MODEL

    preferred_order = [
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "qwen/qwen3.8-27b",
        "llama-3.1-8b-instant",
        "openai/gpt-oss-20b",
    ]
    try:
        models_resp = ai_client.models.list()
        available = {m.id for m in getattr(models_resp, 'data', [])}
        for candidate in preferred_order:
            if candidate in available:
                _CACHED_GROQ_MODEL = candidate
                print(f"[MULTI_AGENT] Selected available Groq model: {_CACHED_GROQ_MODEL}")
                return _CACHED_GROQ_MODEL
        # Fallback to any non-audio/non-guard chat model available
        for m_id in sorted(available):
            low = m_id.lower()
            if not any(skip in low for skip in ("whisper", "guard", "orpheus", "safeguard")):
                _CACHED_GROQ_MODEL = m_id
                print(f"[MULTI_AGENT] Selected fallback Groq model: {_CACHED_GROQ_MODEL}")
                return _CACHED_GROQ_MODEL
    except Exception as e:
        print(f"[MULTI_AGENT] Could not list Groq models, defaulting to openai/gpt-oss-120b: {e}")

    _CACHED_GROQ_MODEL = "openai/gpt-oss-120b"
    return _CACHED_GROQ_MODEL


def _extract_json_block(raw_text: str):
    if not raw_text:
        return None
    cleaned = re.sub(r'```(?:json)?', '', raw_text).strip()
    match = re.search(r'\{[\s\S]*\}', cleaned)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except Exception:
        return None


# ============================================================================
# SUBAGENTS
# ============================================================================

class ConceptCoachSubAgent:
    """Subagent specializing in conceptual intuition, prerequisite bridges, and step-by-step mental models."""
    agent_id = "coach"
    name = "Concept Coach Subagent"
    role = "Intuition & Prerequisite Bridge"

    @classmethod
    def run(cls, entry: dict, directive: str, visited_modules: list, ai_client=None):
        title_name = entry['title']
        module_name = entry['module']
        description = entry['description']
        prev_context = ", ".join(visited_modules[-3:]) if visited_modules else "Foundational Neural Networks"

        if ai_client:
            try:
                model = _get_llm_model_name(ai_client)
                prompt = f"""You are the Concept Coach Subagent overseen by the Main Orchestrator.
Orchestrator Directive for you: "{directive}"
Current Lesson: "{title_name}" (Module: "{module_name}", Difficulty: {entry['difficulty']}/7)
Student's Recently Visited Modules: {prev_context}

Lecture Material Context:
{description[:3000]}

Return ONLY valid JSON with this exact schema:
{{
  "intuition": "2-3 sentences explaining the core mental model of this lesson in plain, intuitive terms.",
  "prerequisiteBridge": "1-2 sentences connecting {prev_context} to {title_name}.",
  "realWorldAnalogy": "A concrete analogy or practical engineering example illustrating how this works.",
  "stepByStepBreakdown": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ]
}}"""
                completion = ai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a specialized NLP Concept Coach Subagent that outputs strict JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=1500,
                )
                parsed = _extract_json_block(completion.choices[0].message.content)
                if parsed and parsed.get("intuition"):
                    return {
                        "agentId": cls.agent_id,
                        "agentName": cls.name,
                        "directive": directive,
                        "intuition": parsed.get("intuition", ""),
                        "prerequisiteBridge": parsed.get("prerequisiteBridge", ""),
                        "realWorldAnalogy": parsed.get("realWorldAnalogy", ""),
                        "stepByStepBreakdown": (parsed.get("stepByStepBreakdown") or [])[:4],
                        "source": f"groq-{model}",
                    }
            except Exception as e:
                print(f"[COACH_SUBAGENT] LLM fallback: {e}")

        sections = _extract_module_sections(description)
        intuition = " ".join(sections['summary_sentences'][:2]) or f"{title_name} establishes key mechanisms for modern language modeling and representation learning."
        bridge = (
            f"Building on your progress in {prev_context}, this lesson extends those representations into {module_name}."
            if visited_modules else
            f"As a foundational starting point in the curriculum, {title_name} sets up the core abstractions required by downstream Transformer modules."
        )
        analogy = (
            sections['faqs'][0]['answer']
            if sections['faqs'] else
            (sections['insights'][0]['detail'] if sections['insights'] else f"Think of {module_name} as structuring raw token streams into reusable semantic building blocks.")
        )
        steps = [f"{ins['concept']}: {ins['detail']}" for ins in sections['insights'][:4]]
        if not steps:
            steps = sections['highlights'][:4] or [f"Understand the motivation and architecture of {title_name}."]

        return {
            "agentId": cls.agent_id,
            "agentName": cls.name,
            "directive": directive,
            "intuition": intuition,
            "prerequisiteBridge": bridge,
            "realWorldAnalogy": analogy,
            "stepByStepBreakdown": steps,
            "source": "local-corpus-agent",
        }


class NotesSubAgent:
    """Subagent specializing in structured study notes, executive summaries, and high-yield takeaways."""
    agent_id = "notes"
    name = "Smart Notes Subagent"
    role = "Structured Lecture Synthesis"

    @classmethod
    def run(cls, entry: dict, directive: str, ai_client=None):
        title_name = entry['title']
        module_name = entry['module']
        description = entry['description']

        if ai_client:
            try:
                model = _get_llm_model_name(ai_client)
                prompt = f"""You are the Smart Notes Subagent overseen by the Main Orchestrator.
Orchestrator Directive for you: "{directive}"
Current Lesson: "{title_name}" (Module: "{module_name}")

Lecture Material Context:
{description[:3200]}

Return ONLY valid JSON with this exact schema:
{{
  "overview": "Concise 2-3 sentence executive summary of the lecture.",
  "takeaways": [
    "High-yield takeaway 1 with concrete technical detail",
    "High-yield takeaway 2 with concrete technical detail",
    "High-yield takeaway 3 with concrete technical detail",
    "High-yield takeaway 4 with concrete technical detail",
    "High-yield takeaway 5 with concrete technical detail"
  ],
  "examTip": "1 sentence highlighting the most important distinction or pitfall to remember."
}}"""
                completion = ai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a specialized NLP Study Notes Subagent that outputs strict JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.35,
                    max_tokens=1500,
                )
                parsed = _extract_json_block(completion.choices[0].message.content)
                if parsed and parsed.get("overview") and isinstance(parsed.get("takeaways"), list):
                    takeaways = parsed["takeaways"][:5]
                    exam_tip = parsed.get("examTip", "")
                    note_lines = [f"Overview: {parsed['overview']}", "", "Key Takeaways:"]
                    for t in takeaways:
                        note_lines.append(f"• {t}")
                    if exam_tip:
                        note_lines.extend(["", f"Key Focus: {exam_tip}"])
                    return {
                        "agentId": cls.agent_id,
                        "agentName": cls.name,
                        "directive": directive,
                        "module": module_name,
                        "title": f"AI Study Brief: {title_name}",
                        "lessonTitle": title_name,
                        "overview": parsed["overview"],
                        "takeaways": takeaways,
                        "examTip": exam_tip,
                        "formattedNote": "\n".join(note_lines),
                        "source": f"groq-{model}",
                    }
            except Exception as e:
                print(f"[NOTES_SUBAGENT] LLM fallback: {e}")

        sections = _extract_module_sections(description)
        takeaways = [f"{ins['concept']}: {ins['detail']}" for ins in sections['insights'][:4]]
        if len(takeaways) < 4:
            for hl in sections['highlights']:
                if hl not in takeaways:
                    takeaways.append(hl)
                if len(takeaways) >= 5:
                    break
        if not takeaways and sections['summary_sentences']:
            takeaways = sections['summary_sentences'][:4]

        overview = " ".join(sections['summary_sentences'][:3]) if sections['summary_sentences'] else (
            takeaways[0] if takeaways else f"Core concepts and technical foundations of {title_name}."
        )
        exam_tip = (
            f"Pay special attention to how {module_name} balances computational efficiency with representation quality."
        )

        note_lines = [f"Overview: {overview}", "", "Key Takeaways:"]
        for t in takeaways[:5]:
            note_lines.append(f"• {t}")
        note_lines.extend(["", f"Key Focus: {exam_tip}"])

        return {
            "agentId": cls.agent_id,
            "agentName": cls.name,
            "directive": directive,
            "module": module_name,
            "title": f"AI Study Brief: {title_name}",
            "lessonTitle": title_name,
            "overview": overview,
            "takeaways": takeaways[:5],
            "examTip": exam_tip,
            "formattedNote": "\n".join(note_lines),
            "source": "local-corpus-agent",
        }


class FlashcardSubAgent:
    """Subagent specializing in active-recall flashcards and technical terminology."""
    agent_id = "flashcards"
    name = "Flashcard Deck Subagent"
    role = "Active Recall & Terminology"

    @classmethod
    def run(cls, entry: dict, directive: str, ai_client=None):
        title_name = entry['title']
        module_name = entry['module']
        description = entry['description']

        if ai_client:
            try:
                model = _get_llm_model_name(ai_client)
                prompt = f"""You are the Flashcard Subagent overseen by the Main Orchestrator.
Orchestrator Directive for you: "{directive}"
Current Lesson: "{title_name}" (Module: "{module_name}")

Lecture Material Context:
{description[:3000]}

Generate 6 high-yield active-recall flashcards for this lesson.
Return ONLY valid JSON with this exact schema:
{{
  "flashcards": [
    {{
      "front": "Term, architecture component, or active-recall prompt",
      "back": "Clear, precise 1-2 sentence definition or answer",
      "tag": "Concept | Architecture | Mechanism | Practice"
    }}
  ]
}}"""
                completion = ai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are a specialized NLP Flashcard Subagent that outputs strict JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.35,
                    max_tokens=1500,
                )
                parsed = _extract_json_block(completion.choices[0].message.content)
                if parsed and isinstance(parsed.get("flashcards"), list) and len(parsed["flashcards"]) > 0:
                    cards = []
                    for c in parsed["flashcards"][:6]:
                        cards.append({
                            "front": str(c.get("front", "")),
                            "back": str(c.get("back", "")),
                            "tag": str(c.get("tag", "Concept")),
                        })
                    return {
                        "agentId": cls.agent_id,
                        "agentName": cls.name,
                        "directive": directive,
                        "flashcards": cards,
                        "source": f"groq-{model}",
                    }
            except Exception as e:
                print(f"[FLASHCARD_SUBAGENT] LLM fallback: {e}")

        sections = _extract_module_sections(description)
        flashcards = []
        for g in sections['glossary'][:5]:
            flashcards.append({'front': g['term'], 'back': g['definition'], 'tag': 'Terminology'})
        for ins in sections['insights'][:4]:
            if len(flashcards) < 6:
                flashcards.append({'front': ins['concept'], 'back': ins['detail'], 'tag': 'Core Concept'})
        for faq in sections['faqs'][:2]:
            if len(flashcards) < 6:
                flashcards.append({'front': faq['question'], 'back': faq['answer'], 'tag': 'Key Q&A'})

        return {
            "agentId": cls.agent_id,
            "agentName": cls.name,
            "directive": directive,
            "flashcards": flashcards[:6],
            "source": "local-corpus-agent",
        }


class QuizSubAgent:
    """Subagent specializing in adaptive multiple-choice concept verification."""
    agent_id = "quiz"
    name = "Adaptive Quiz Subagent"
    role = "Diagnostic Concept Assessment"

    @classmethod
    def run(cls, entry: dict, directive: str, nlp_resources: list, ai_client=None, num_questions: int = 3):
        title_name = entry['title']
        module_name = entry['module']
        description = entry['description']

        if ai_client:
            try:
                model = _get_llm_model_name(ai_client)
                prompt = f"""You are the Adaptive Quiz Subagent overseen by the Main Orchestrator.
Orchestrator Directive for you: "{directive}"
Generate {num_questions} multiple-choice quiz questions for the NLP lecture "{title_name}" (Module: "{module_name}", Difficulty: {entry['difficulty']}/7).
Use the following lecture material:
{description[:3200]}

Return ONLY valid JSON with this exact structure:
{{
  "questions": [
    {{
      "id": "q1",
      "question": "Clear conceptual or applied question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Concise 1-2 sentence explanation of why this option is correct."
    }}
  ]
}}"""
                completion = ai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are an expert NLP Quiz Subagent generating strict JSON quizzes."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=1500,
                )
                parsed = _extract_json_block(completion.choices[0].message.content)
                if parsed and isinstance(parsed.get("questions"), list) and len(parsed["questions"]) > 0:
                    return {
                        "agentId": cls.agent_id,
                        "agentName": cls.name,
                        "directive": directive,
                        "module": module_name,
                        "title": title_name,
                        "source": f"groq-{model}",
                        "questions": parsed["questions"][:num_questions],
                    }
            except Exception as e:
                print(f"[QUIZ_SUBAGENT] LLM fallback: {e}")

        # Local corpus fallback
        sections = _extract_module_sections(description)
        distractor_pool = _collect_distractor_pool(module_name, nlp_resources)
        rng = random.Random(f"{module_name}_{len(description)}")
        candidate_qas = []

        for faq in sections['faqs']:
            ans = faq['answer'][:155].rstrip() + ('...' if len(faq['answer']) > 155 else '')
            candidate_qas.append({
                'question': faq['question'],
                'correct': ans,
                'explanation': f"In {title_name}: {faq['answer']}",
            })
        for g in sections['glossary']:
            ans = g['definition'][:155].rstrip() + ('...' if len(g['definition']) > 155 else '')
            candidate_qas.append({
                'question': f"In the context of {title_name}, how is '{g['term']}' best defined?",
                'correct': ans,
                'explanation': f"'{g['term']}' is defined in this module as: {g['definition']}",
            })
        for ins in sections['insights']:
            ans = ins['detail'][:155].rstrip() + ('...' if len(ins['detail']) > 155 else '')
            candidate_qas.append({
                'question': f"What is a core takeaway regarding '{ins['concept']}' in {title_name}?",
                'correct': ans,
                'explanation': f"Key insight from {title_name} ({ins['concept']}): {ins['detail']}",
            })
        for hl in (sections['highlights'] + sections['summary_sentences'])[:5]:
            ans = hl[:155].rstrip() + ('...' if len(hl) > 155 else '')
            candidate_qas.append({
                'question': f"Which of the following statements accurately describes a core concept covered in '{title_name}'?",
                'correct': ans,
                'explanation': f"Directly covered in the lecture '{title_name}': {hl}",
            })

        if not candidate_qas:
            candidate_qas.append({
                'question': f"What is the primary focus of the module '{title_name}' in the NLP curriculum?",
                'correct': f"Mastering {module_name} architectures, training objectives, and practical implementation patterns.",
                'explanation': f"This module focuses on {module_name} within the NLP learning path.",
            })

        selected_qas = candidate_qas[:num_questions]
        questions = []
        for idx, item in enumerate(selected_qas):
            correct_opt = item['correct']
            available_distractors = [d for d in distractor_pool if d.lower() != correct_opt.lower()]
            chosen_distractors = rng.sample(available_distractors, min(3, len(available_distractors)))
            options = [correct_opt] + chosen_distractors
            rng.shuffle(options)
            correct_index = options.index(correct_opt)
            questions.append({
                'id': f"q_{entry['id']}_{idx + 1}",
                'question': item['question'],
                'options': options,
                'correctIndex': correct_index,
                'explanation': item['explanation'],
            })

        return {
            "agentId": cls.agent_id,
            "agentName": cls.name,
            "directive": directive,
            "module": module_name,
            "title": title_name,
            "source": "local-corpus-agent",
            "questions": questions,
        }


# ============================================================================
# MAIN ORCHESTRATOR AGENT
# ============================================================================

class OrchestratorAgent:
    """
    Main Hierarchical Orchestrator Agent.
    Analyses the current lesson (difficulty, topic category, transcript structure)
    and learner progress (visited modules, level), decides which subagent should lead,
    allocates customized instructions to each subagent, and oversees their execution.
    """

    @classmethod
    def plan_allocation(cls, entry: dict, visited_modules: list, student_level: int = 1, ai_client=None):
        title = entry['title']
        module = entry['module']
        difficulty = entry['difficulty']
        nature = _classify_lesson_nature(title, module, difficulty)
        is_visited = any(
            str(m).lower() in (title.lower(), module.lower(), str(entry['id']).lower())
            for m in (visited_modules or [])
        )

        # Deterministic baseline allocation based on lesson nature & learner state
        if is_visited:
            default_primary = "quiz"
            default_sequence = ["quiz", "flashcards", "notes", "coach"]
            default_reason = (
                f"You have already explored '{title}'. The Orchestrator assigned the Adaptive Quiz Subagent "
                f"as Primary to verify retention before you summarize or advance, backed by Flashcards for rapid recall."
            )
        elif "Hands-On" in nature:
            default_primary = "notes"
            default_sequence = ["notes", "coach", "flashcards", "quiz"]
            default_reason = (
                f"'{title}' is a hands-on implementation module ({nature}). The Orchestrator selected the Smart Notes Subagent "
                f"as Primary to structure workflow steps and API patterns, paired with the Concept Coach for practical intuition."
            )
        elif difficulty >= 5 or "Mathematical" in nature or "Advanced" in nature:
            default_primary = "coach"
            default_sequence = ["coach", "notes", "flashcards", "quiz"]
            default_reason = (
                f"'{title}' is a high-complexity module (Difficulty {difficulty}/7 • {nature}). The Orchestrator deployed "
                f"the Concept Coach Subagent first to build prerequisite bridges and intuition before structured note-taking and quizzing."
            )
        else:
            default_primary = "notes"
            default_sequence = ["notes", "flashcards", "coach", "quiz"]
            default_reason = (
                f"'{title}' introduces core concepts in {nature} (Difficulty {difficulty}/7). The Orchestrator prioritized "
                f"the Smart Notes Subagent to capture key takeaways, followed by Flashcards and Quiz verification."
            )

        default_directives = {
            "coach": f"Build a clear mental model for '{title}' ({nature}) and connect it to prior modules ({len(visited_modules)} completed).",
            "notes": f"Synthesize high-yield executive notes and {nature.lower()} takeaways for '{title}'.",
            "flashcards": f"Extract core terminology, architectures, and contrasting definitions from '{title}'.",
            "quiz": f"Assess conceptual mastery of '{title}' at difficulty tier {difficulty}/7 with realistic distractors.",
        }

        if ai_client:
            try:
                model = _get_llm_model_name(ai_client)
                prompt = f"""You are the Main Orchestrator Agent of an AI NLP Learning Platform.
You oversee 4 specialized subagents:
1. "coach" (Concept Coach Subagent): Explains mental models, analogies, and prerequisite bridges.
2. "notes" (Smart Notes Subagent): Synthesizes executive summaries and structured lecture takeaways.
3. "flashcards" (Flashcard Deck Subagent): Builds active-recall terminology and concept flashcards.
4. "quiz" (Adaptive Quiz Subagent): Tests comprehension with multiple-choice questions and explanations.

Current Lesson Context:
- Lesson Title: "{title}"
- Module: "{module}"
- Difficulty: {difficulty}/7
- Lesson Nature: "{nature}"
- Already Visited by Student: {is_visited}
- Student Completed Modules Count: {len(visited_modules)} (Level {student_level})

Decide which subagent should be the PRIMARY agent right now to help the student learn this specific lesson best, rank all 4 subagents in recommended order, explain your reasoning in 2 concise sentences, and assign a tailored 1-sentence task directive to each subagent.

Return ONLY valid JSON with this exact schema:
{{
  "primaryAgent": "coach | notes | flashcards | quiz",
  "recommendedSequence": ["primary_id", "second_id", "third_id", "fourth_id"],
  "reasoning": "2 concise sentences explaining why this subagent and sequence best fit '{title}' and the student's current progress.",
  "directives": {{
    "coach": "Specific task instruction allocated to Concept Coach Subagent...",
    "notes": "Specific task instruction allocated to Smart Notes Subagent...",
    "flashcards": "Specific task instruction allocated to Flashcard Deck Subagent...",
    "quiz": "Specific task instruction allocated to Adaptive Quiz Subagent..."
  }}
}}"""
                completion = ai_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": "You are the Main Hierarchical Orchestrator Agent. Output strict JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1200,
                )
                parsed = _extract_json_block(completion.choices[0].message.content)
                valid_ids = {"coach", "notes", "flashcards", "quiz"}
                if parsed and parsed.get("primaryAgent") in valid_ids:
                    primary = parsed["primaryAgent"]
                    seq = [a for a in (parsed.get("recommendedSequence") or []) if a in valid_ids]
                    for v in default_sequence:
                        if v not in seq:
                            seq.append(v)
                    directives = {
                        k: (parsed.get("directives") or {}).get(k) or default_directives[k]
                        for k in ("coach", "notes", "flashcards", "quiz")
                    }
                    return {
                        "lessonProfile": {
                            "id": entry["id"],
                            "title": title,
                            "module": module,
                            "difficulty": difficulty,
                            "nature": nature,
                            "isVisited": is_visited,
                        },
                        "primaryAgent": primary,
                        "recommendedSequence": seq,
                        "reasoning": parsed.get("reasoning") or default_reason,
                        "directives": directives,
                        "source": f"groq-{model}",
                    }
            except Exception as e:
                print(f"[ORCHESTRATOR] LLM routing fallback: {e}")

        return {
            "lessonProfile": {
                "id": entry["id"],
                "title": title,
                "module": module,
                "difficulty": difficulty,
                "nature": nature,
                "isVisited": is_visited,
            },
            "primaryAgent": default_primary,
            "recommendedSequence": default_sequence,
            "reasoning": default_reason,
            "directives": default_directives,
            "source": "local-orchestrator",
        }

    @classmethod
    def orchestrate(cls, module_or_title: str, nlp_resources: list, visited_modules: list = None, student_level: int = 1, ai_client=None, active_subagent: str = None):
        """
        Run the Main Orchestrator Agent:
        1. Build the lesson-aware allocation plan and choose the primary subagent.
        2. Execute the primary (or requested) subagent immediately via Groq LLM, and prepare
           all subagent metadata so switching subagents is seamless.
        """
        visited_modules = visited_modules or []
        entry = _find_module_entry(module_or_title, nlp_resources)
        plan = cls.plan_allocation(entry, visited_modules, student_level, ai_client=ai_client)

        target_agent = active_subagent if active_subagent in ("coach", "notes", "flashcards", "quiz") else plan["primaryAgent"]
        directives = plan["directives"]

        # Execute the subagents overseen by the Orchestrator
        coach_res = ConceptCoachSubAgent.run(entry, directives["coach"], visited_modules, ai_client=ai_client)
        notes_res = NotesSubAgent.run(entry, directives["notes"], ai_client=ai_client)
        flashcards_res = FlashcardSubAgent.run(entry, directives["flashcards"], ai_client=ai_client)
        quiz_res = QuizSubAgent.run(entry, directives["quiz"], nlp_resources, ai_client=ai_client, num_questions=3)

        subagents_summary = [
            {
                "id": "coach",
                "name": ConceptCoachSubAgent.name,
                "role": ConceptCoachSubAgent.role,
                "directive": directives["coach"],
                "status": "primary" if plan["primaryAgent"] == "coach" else "allocated",
                "source": coach_res["source"],
            },
            {
                "id": "notes",
                "name": NotesSubAgent.name,
                "role": NotesSubAgent.role,
                "directive": directives["notes"],
                "status": "primary" if plan["primaryAgent"] == "notes" else "allocated",
                "source": notes_res["source"],
            },
            {
                "id": "flashcards",
                "name": FlashcardSubAgent.name,
                "role": FlashcardSubAgent.role,
                "directive": directives["flashcards"],
                "status": "primary" if plan["primaryAgent"] == "flashcards" else "allocated",
                "source": flashcards_res["source"],
            },
            {
                "id": "quiz",
                "name": QuizSubAgent.name,
                "role": QuizSubAgent.role,
                "directive": directives["quiz"],
                "status": "primary" if plan["primaryAgent"] == "quiz" else "allocated",
                "source": quiz_res["source"],
            },
        ]

        return {
            "orchestrator": {
                "lessonProfile": plan["lessonProfile"],
                "primaryAgent": plan["primaryAgent"],
                "activeAgent": target_agent,
                "recommendedSequence": plan["recommendedSequence"],
                "reasoning": plan["reasoning"],
                "source": plan["source"],
                "subagents": subagents_summary,
            },
            "outputs": {
                "coach": coach_res,
                "notes": notes_res,
                "flashcards": flashcards_res,
                "quiz": quiz_res,
            }
        }


# ============================================================================
# BACKWARD-COMPATIBLE WRAPPERS FOR EXISTING ROUTES
# ============================================================================

def generate_module_quiz(module_or_title: str, nlp_resources: list, ai_client=None, num_questions: int = 3):
    entry = _find_module_entry(module_or_title, nlp_resources)
    directive = f"Assess conceptual mastery of '{entry['title']}' at difficulty {entry['difficulty']}/7."
    return QuizSubAgent.run(entry, directive, nlp_resources, ai_client=ai_client, num_questions=num_questions)


def generate_study_notes(module_or_title: str, nlp_resources: list, ai_client=None):
    entry = _find_module_entry(module_or_title, nlp_resources)
    notes_res = NotesSubAgent.run(entry, f"Synthesize structured study notes for '{entry['title']}'.", ai_client=ai_client)
    cards_res = FlashcardSubAgent.run(entry, f"Extract key flashcards for '{entry['title']}'.", ai_client=ai_client)
    return {
        "module": notes_res["module"],
        "title": notes_res["title"],
        "lessonTitle": notes_res["lessonTitle"],
        "overview": notes_res["overview"],
        "takeaways": notes_res["takeaways"],
        "examTip": notes_res.get("examTip", ""),
        "flashcards": cards_res["flashcards"],
        "formattedNote": notes_res["formattedNote"],
        "source": notes_res["source"],
    }
