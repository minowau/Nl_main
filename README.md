
# Navigated Learning Platform 🚀

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB.svg?logo=react)
![Python](https://img.shields.io/badge/Backend-Python%20%7C%20Flask-3776AB.svg?logo=python)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?logo=tailwind-css)

Welcome to the **Navigated Learning Platform** — a next-generation, AI-driven educational operating system. This platform transforms linear, boring curriculum into an interactive 2D spatial learning grid ("The Neural Matrix"). By leveraging Reinforcement Learning (DQN) and Semantic Analysis (BERT), the system creates dynamic, deeply personalized learning paths (Polylines) tailored perfectly to each student's evolving comprehension.

---

## 🌟 Core Philosophy: The Spatial Learning Loop

Instead of a traditional list of courses, topics are mapped onto a **2D Coordinate Grid** based on conceptual similarity.
When a student interacts with materials and writes summaries, the system:
1.  **Analyzes** their comprehension using BERT sentence embeddings.
2.  **Maps** their knowledge trajectory as an active, glowing "Polyline".
3.  **Recommends** their next optimal learning node using a Deep Q-Network (DQN) trained on historical student paths.
4.  **Visualizes** their assimilation by plotting an aggregated point (The Center of Gravity) showing exactly where their knowledge sits conceptually.

---

## 🏗️ System Architecture

The architecture relies on a synergy between an interactive React frontend and a heavyweight Python/Flask AI backend.

```mermaid
graph TD
    subgraph Frontend [React / Vite Client]
        UI[User Interface] -->|Login / Auth| ID[Student ID Auth Flow]
        UI -->|Grid Exploration| GV[Grid Visualization]
        UI -->|Node Interation| MM[Media & Modules]
        UI -->|Knowledge Check| SM[Summary Submission]
        GV -->|Rendering| ABS[Absolute Position Engine]
    end

    subgraph API [Flask REST API]
        R[Router]
        R --> EP1[/api/resources]
        R --> EP2[/api/summary/create]
        R --> EP3[/api/agent]
    end

    subgraph Core AI Systems [Python Backend]
        BERT[BERT NLP Pipeline]
        DQN[Deep Q-Network Model]
        RM[Radial Mapper Engine]
    end

    subgraph Data Layer [Persistence]
        CSV[topic_2d_coordinates.csv]
        JSON[nlp_resources.json]
        DB[(JSON File DB)]
    end

    UI <--> R
    EP1 --> JSON
    EP1 --> CSV
    EP2 --> BERT
    EP2 --> DQN
    EP2 --> RM
    BERT --> DB
    RM --> DB
    DQN --> DB
```

---

## 🧠 The Neural Matrix & Polyline Engine

### 1. Spatial Grid Generation (Master-Point System)
Topics are assigned hard coordinates using the master file `topic_2d_coordinates.csv`. The backend scales these 0.0-1.0 floats perfectly onto the frontend's spatial grid. Unlike traditional grids, our **Absolute Position Engine** supports floating-point coordinates, allowing nodes to sit organically between grid lines for a more fluid, conceptually accurate layout.

### 2. The Assimilation Loop
When a user completes a module and submits a summary, the **Assimilation Loop** triggers:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NLP API
    participant BERT
    participant DQN

    User->>Frontend: Watches Video & Submits Summary
    Frontend->>NLP API: POST /api/summary/create (Text + ID)
    NLP API->>BERT: Encode summary text to embeddings
    BERT-->>NLP API: Return semantic vector
    NLP API->>NLP API: Compute Cosine Similarity against all 19 Modules
    NLP API->>DQN: Pass Module Scores & Visited State
    DQN-->>NLP API: Return optimal Next Recommendation
    NLP API->>NLP API: RadialMapper computes Assimilation Point (X,Y)
    NLP API-->>Frontend: Return Polyline & Next Node
    Frontend->>User: Animate grid, render new glowing path!
```

---

## ⚡ Key Modules & Visual Identity

### 🎨 Premium Visual Identity
The platform has been redesigned with a **Vibrant Sky Blue** theme, replacing generic violet tones with a curated palette that feels professional, expansive, and high-tech. 
- **Brand Colors:** `#3B82F6` (Primary Blue), `#60A5FA` (Light Sky), `#1E3A8A` (Deep Navy).
- **Aesthetics:** Glassmorphism, smooth CSS transitions, and SVG-animated polylines.

### The Navigator Dashboard
The launchpad for students. Displays the active "Advances in NLP" map, their accumulated XP, their current level (S1, S2, etc.), and their uniquely calculated **Educational Persona**.

### The Grid Visualization
The interactive 2D map. 
- **Nodes**: Educational content (Videos, Texts, Quizzes) placed according to the CSV.
- **Floating-Point Mapping**: Resources are rendered using absolute CSS positioning (left/top %) based on precise CSV coordinates.
- **The "High Line"**: A visual representation of peak potential — the optimal path a mastery-level student would take.

---

## 🔧 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)

### 1. Start the Backend (Flask / AI Models)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*(Note: The first run will automatically download the required NLTK datasets and HuggingFace `all-MiniLM-L6-v2` BERT models).*

### 2. Start the Frontend (React)
```bash
# In a new terminal
npm install
npm run dev
```

### 3. Enter the Matrix
Open your browser to `http://localhost:5173`. 
Create a new student account using the ID Badge auth flow, click **Enter the Navigator**, and begin traversing the grid!

---

*Engineered for the future of interactive learning.*
