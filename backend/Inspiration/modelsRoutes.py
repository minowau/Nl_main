import gc
import json
import math
import os
import re
from datetime import datetime
import numpy as np
import pandas as pd
import pdfplumber
import torch
from flask import jsonify, request, send_from_directory
from utils import is_valid_id
from repository import add_ta_from_user
from dbModels import TAT, Activity, Contribution, Course, Enroll, Learner, Module, Question, Quiz, Resource, Topic, UserQuiz, db, Description,ExitPoint
from init import app
from keybert import KeyBERT
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from sqlalchemy.sql import func
from transformers import BertModel, BertTokenizer
from werkzeug.utils import secure_filename
from youtube_transcript_api import YouTubeTranscriptApi


UPLOAD_FOLDER_NAME = "uploads"
UPLOAD_FOLDER = os.path.join(os.getcwd(), UPLOAD_FOLDER_NAME)  # Save files in a 'uploads' folder in the project directory
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Create the folder if it doesn't exist

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

def get_cos_sim(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculate the cosine similarity between two vectors.

    Parameters:
        a (np.ndarray): First vector.
        b (np.ndarray): Second vector.

    Returns:
        float: Cosine similarity between the two vectors.
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)


# Routes

# Learners


@app.route('/learners', methods=['GET'])
def get_learners():
    learners = Learner.query.all()
    return jsonify([learner.to_dict() for learner in learners])


@app.route('/learners', methods=['POST'])
def create_learner():
    data = request.get_json()
    new_learner = Learner(
        name=data['name'],
        cgpa=data['cgpa'],
        username=data['username'],
        password=data['password']
    )
    db.session.add(new_learner)
    db.session.commit()
    return jsonify(new_learner.to_dict()), 201

# Courses


@app.route('/course/<int:id>', methods=['GET'])
def get_courses(id):
    course = Course.query.filter_by(id=id).first()
    return (course.to_dict())


@app.route('/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    new_course = Course(
        name=data['name'],
        description=data['description'],
        initial_position=[0]*data['topic_count']
    )
    db.session.add(new_course)
    db.session.commit()
    return jsonify(new_course.to_dict()), 201

# Resources

@app.route("/resource-types", methods=['GET'])
def get_resource_types():
    return jsonify([
        { "type" : "0", "name" : "PDF"},
        { "type" : "1", "name" : "Youtube Video"},
        # { "type" : "2", "name" : "Quiz"}, :)
    ])

@app.route('/resources/<int:id>', methods=['GET'])
def get_resources(id):
    resources = Resource.query.filter_by(course_id=id)
    # print("resources are ")
    # print([resource.to_dict() for resource in resources])
    return jsonify([resource.to_dict() for resource in resources])

@app.route('/specific_resource/<int:id>', methods=['GET'])
def get_specifc_resource(id):
    resource = Resource.query.filter_by(id=id).first()
    return jsonify(resource.to_dict())

@app.route('/resources', methods=['POST'])
def create_resource():
    data = request.get_json()
    new_resource = Resource(
        name=data['name'],
        description=data['description'],
        keywords=data['keywords'],
        polyline=data['polyline'],
        x_coordinate=data['x_coordinate'],
        y_coordinate=data['y_coordinate'],
        course_id=data['course_id'],
        type=data['type']
        # ,
        # embedding=data['embedding']
    )
    db.session.add(new_resource)
    db.session.commit()
    return jsonify(new_resource.to_dict()), 201

# Topics


@app.route('/topics/<int:id>', methods=['GET'])
def get_topics(id):
    topics = Topic.query.filter_by(course_id=id)
    return jsonify([topic.to_dict() for topic in topics])


@app.route('/topics', methods=['POST'])
def create_topic():
    data = request.get_json()
    new_topic = Topic(
        name=data['name'],
        description=data['description'],
        keywords=data['keywords'],
        polyline=data['polyline'],
        x_coordinate=data['x_coordinate'],
        y_coordinate=data['y_coordinate'],
        course_id=data['course_id'],
        embedding=data['embedding']
    )
    db.session.add(new_topic)
    db.session.commit()
    return jsonify(new_topic.to_dict()), 201

# Enrolls


@app.route('/enrolls/<int:id>', methods=['GET'])
def get_enroll(id):
    enroll = Enroll.query.get(id)
    return jsonify(enroll.to_dict())

@app.route('/teach/<int:id>',methods=['GET'])
def get_teach(id):
    teach = TAT.query.get(id)
    return jsonify(teach.to_dict())


# Activities


@app.route('/activities/<int:id>', methods=['GET'])
def get_activities(id):
    activities = Activity.query.filter_by(enroll_id=id)
    return jsonify([activity.to_dict() for activity in activities])


@app.route('/activities', methods=['POST'])
def create_activity():
    data = request.get_json()
    if data.get('resource_id') is not None:
        new_activity = Activity(
        time=datetime.strptime(data['time'], '%Y-%m-%d %H:%M:%S'),
        # type_id=data['type_id'],
        type=data['type'],
        name=data['name'],
        link=data['link'],
        enroll_id=data['enroll_id'],
        resource_id=data['resource_id'],
        x_coordinate=data['x_coordinate'],
        y_coordinate=data['y_coordinate'],
    )
    else:
        new_activity = Activity(
            time=datetime.strptime(data['time'], '%Y-%m-%d %H:%M:%S'),
            # type_id=data['type_id'],
            type=data['type'],
            name=data['name'],
            link=data['link'],
            enroll_id=data['enroll_id'],
            contribution_id=data['contribution_id'],
            x_coordinate=data['x_coordinate'],
            y_coordinate=data['y_coordinate'],
        )
    db.session.add(new_activity)
    db.session.commit()
    return jsonify(new_activity.to_dict()), 201

# Contributions


@app.route('/contributions/<int:id>', methods=['GET'])
def get_contributions(id):
    contributions = Contribution.query.filter_by(enroll_id=id)

    return jsonify([contribution.to_dict() for contribution in contributions])

@app.route('/contributions/view/<int:id>', methods=['GET'])
def get_contribution_view(id):
    contribution = Contribution.query.filter_by(id=id).first()

    return jsonify(contribution.to_dict())


@app.route('/contributions', methods=['POST'])
def create_contribution():
    data = request.get_json()
    new_contribution = Contribution(
        enroll_id=data['enroll_id'],
        submitted_on=datetime.strptime(
            data['submitted_on'], '%Y-%m-%d %H:%M:%S'),
        file_path=data['file_path'],
        description=data['description'],
        prev_polyline=data['prev_polyline'],
        polyline=data['polyline'],
        x_coordinate=data['x_coordinate'],
        y_coordinate=data['y_coordinate'],
        embedding=data['embedding']
    )
    db.session.add(new_contribution)
    db.session.commit()
    return jsonify(new_contribution.to_dict()), 201

# Quizzes


@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([quiz.to_dict() for quiz in quizzes])


# Questions


@app.route('/questions', methods=['GET'])
def get_questions():
    quiz_id = request.args.get('quiz_id')
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    return jsonify([question.to_dict() for question in questions])


@app.route('/questions', methods=['POST'])
def create_question():
    data = request.get_json()
    new_question = Question(
        quiz_id=data['quiz_id'],
        question_text=data['question_text'],
        option_a=data.get('option_a'),
        option_b=data.get('option_b'),
        option_c=data.get('option_c'),
        option_d=data.get('option_d'),
        correct_answer=data['correct_answer']
    )
    db.session.add(new_question)
    db.session.commit()
    return jsonify(new_question.to_dict()), 201

# UserQuiz : log of quizzes attempted by various users


@app.route('/user_quizzes', methods=['GET'])
def get_user_quizzes():
    user_id = request.args.get('user_id')
    user_quizzes = UserQuiz.query.filter_by(user_id=user_id).all()
    return jsonify([user_quiz.to_dict() for user_quiz in user_quizzes])


@app.route('/user_quizzes', methods=['POST'])
def create_user_quiz():
    data = request.get_json()
    new_user_quiz = UserQuiz(
        user_id=data['user_id'],
        quiz_id=data['quiz_id'],
        score=data.get('score'),
        status=data['status'],
        attempt_date=datetime.strptime(
            data['attempt_date'], '%Y-%m-%d %H:%M:%S') if 'attempt_date' in data else None
    )
    db.session.add(new_user_quiz)
    db.session.commit()
    return jsonify(new_user_quiz.to_dict()), 201

# ------------------------------------------------------Teacher APIs

@app.route('/course_module_mappings/<int:course_id>', methods=['GET'])
def course_module_mappings(course_id):
    try:
        # Query for ModName_ModID mapping
        mod_name_mod_id_query = (
            db.session.query(Resource.module, Resource.module_id)
            .filter(Resource.course_id == course_id)
            .distinct()
            .all()
        )
        ModName_ModID = {row.module: row.module_id for row in mod_name_mod_id_query}

        # Query for ModID_SubModCount mapping
        mod_id_submod_count_query = (
            db.session.query(Resource.module_id, func.count(Resource.submodule_id))
            .filter(Resource.course_id == course_id)
            .group_by(Resource.module_id)
            .all()
        )
        ModID_SubModCount = {row.module_id: row[1] for row in mod_id_submod_count_query}

        # Return the mappings as JSON
        return jsonify({
            "ModName_ModID": ModName_ModID,
            "ModID_SubModCount": ModID_SubModCount
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to create topic embeddings
def create_topic_embeddings(topics: pd.DataFrame) -> list:
    model = SentenceTransformer('bert-base-nli-mean-tokens')
    topic_embeddings = []

    for i in range(len(topics)):
        embedding = model.encode(topics.loc[i, "description"], convert_to_tensor=True)
        topic_embeddings.append(embedding.cpu().numpy().tolist())  # Ensure list for JSON compatibility
        del embedding
        gc.collect()

    return topic_embeddings

# Function to create polylines from embeddings
def create_topic_polylines(topics: pd.DataFrame, topic_embeddings: list) -> pd.DataFrame:
    topic_names = topics["name"].tolist()
    length = len(topics)
    topic_modules = [1] * 12 + [2] * 8 + [3] * (length - 20)

    top_poly = []
    top_module = []
    topic = []

    for i in range(len(topic_names)):
        polyline = [0] * len(topic_names)
        for j in range(len(topic_names)):
            cos_sim = 0
            if topic_names[i] == topic_names[j]:
                cos_sim = 1
            else:
                topic1_vector = topic_embeddings[i]
                topic2_vector = topic_embeddings[j]
                cos_sim = (get_cos_sim(topic1_vector, topic2_vector) + 1) / 2
            polyline[j] = cos_sim

        topic.append(topic_names[i])
        top_module.append(topic_modules[i])
        top_poly.append(polyline)

    polyline_dict = {"topic": topic, "module": top_module, "polyline": top_poly}
    topic_polylines = pd.DataFrame(polyline_dict)
    return topic_polylines

# Function to create a list of keywords from the topic descriptions
def create_keywords_list(content_list, num_keywords=10):
    kw_model = KeyBERT(model='all-mpnet-base-v2')
    all_keywords_list = []
    all_weight_list = []

    for i in range(len(content_list)):
        keywords = kw_model.extract_keywords(content_list[i], keyphrase_ngram_range=(1, 2), stop_words='english', highlight=False, top_n=num_keywords)
        keywords_list = list(dict(keywords).keys())
        cs_list = list(dict(keywords).values())



        # Ensure safe handling of cs_list
        if isinstance(cs_list, (list, np.ndarray)) and len(cs_list) > 0:
            weight = np.mean(cs_list)  # Use NumPy's mean for safer handling
        else:
            weight = 0  # Default weight if cs_list is empty or invalid

        all_keywords_list.append(keywords_list)
        all_weight_list.append(weight)

    return all_keywords_list, all_weight_list


def rad_plot_axes(num: int, x_max: float, y_max: float):
    """
    Generate radial plot axes.

    Parameters:
        num (int): Number of axes.
        x_max (float): Maximum x-coordinate.
        y_max (float): Maximum y-coordinate.

    Returns:
        tuple: A tuple containing the lengths of the axes and the angle theta.
    """
    empt_arr = []  # Temporary container for y-coordinate calculations
    xstop = []  # List to store x-coordinate of the axes endpoints
    ystop = []  # List to store y-coordinate of the axes endpoints
    tlen = []  # List to store the length of axes
    ttempl = []  # Temporary container for reversed lengths
    theta = ((np.pi) / (num - 1)) / 2  # Calculate theta
    b = 0

    while (b * theta) <= (np.arctan(y_max / x_max)):
        y_val = x_max * math.tan(b * theta)
        empt_arr.append(y_val)
        ystop.append(y_val)
        ttemp = math.sqrt((x_max ** 2) + (y_val ** 2))
        tlen.append(ttemp)
        if (b * theta) != np.arctan(y_max / x_max):
            ttempl.append(ttemp)
        b += 1

    while b < num:
        ystop.append(y_max)
        b += 1

    tlen.extend(list(reversed(ttempl)))
    xstop = list(reversed(ystop))

    # Plotting is commented out for modularity; can be enabled as needed
    # for d in range(num):
    #     x_values = [0, xstop[d]]
    #     y_values = [0, ystop[d]]
    #     plt.plot(x_values, y_values, label=f'Axis {d+1}', alpha=1, linewidth=0.2)

    return tlen, theta


def rad_plot_poly(num: int, hd_point: list, tlen: list, theta: float) -> list:
    """
    Plot the polyline and calculate their centroids.

    Parameters:
        num (int): Number of points.
        hd_point (list): List of polyline points.
        tlen (list): Length of the axes.
        theta (float): Angle theta.

    Returns:
        list: List of centroid coordinates.
    """
    coordinates = []

    for pnt in hd_point:
        x_values = []
        y_values = []
        for p in range(num):
            rlen = pnt[p] * tlen[p]
            x_values.append(rlen * math.cos(p * theta))
            y_values.append(rlen * math.sin(p * theta))

        # Plotting is commented out for modularity; can be enabled as needed
        # plt.plot(x_values, y_values, label='Polyline', alpha=0.6, linewidth=0.5)

        average_x = sum(x_values) / num
        average_y = sum(y_values) / num
        coordinates.append([average_x, average_y])

    # Print statement for debugging
    print("Red    - Resources ")

    return coordinates



@app.route('/add-module', methods=['POST'])
def add_modules():
    try:
        data = request.get_json()
        course_id = data.get('course_id')
        name = data.get('name')

        if not course_id or not name:
            return jsonify({"error": "course_id and name are required"}), 400

        new_module = Module(
            name=name,
            course_id=course_id,
        )
        
        db.session.add(new_module)
        db.session.commit()
        return jsonify(new_module.to_dict()), 201

    except Exception as e:
        app.logger.error(f"Error in add_modules: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "details": str(e)}), 500


# Route for creating topics related to a newly created course
@app.route('/new-course-topics', methods=['POST'])
def create_new_topics_for_new_course():
    try:
        data = request.get_json()

        # Validate input
        course_id = data.get('course_id')
        topics_data = data.get('topics')

        if not course_id or not topics_data or not isinstance(topics_data, list):
            return jsonify({"error": "Invalid or missing 'course_id' or 'topics'"}), 400

        topics = pd.DataFrame(topics_data)

        # Generate embeddings, polylines, and keywords
        topic_embeddings = create_topic_embeddings(topics)
        topic_polylines = create_topic_polylines(topics, topic_embeddings)
        keywords, weights = create_keywords_list(topics["description"].tolist())

        # Ensure polylines exist before calculating centroids
        if not topic_polylines.empty and "polyline" in topic_polylines:
            feature_length = len(topic_polylines["polyline"][0])
            tlen, theta = rad_plot_axes(feature_length, 1, 1)
            centroid_list = rad_plot_poly(feature_length, topic_polylines["polyline"], tlen, theta)
        else:
            return jsonify({"error": "Failed to generate topic polylines"}), 500

        # Check if generated lists match topic count
        if len(topic_embeddings) != len(topics) or len(topic_polylines) != len(topics) or len(centroid_list) != len(topics):
            return jsonify({"error": "Mismatch in topic processing results"}), 500

        # Insert topics into the database
        for i in range(len(topics)):
            new_topic = Topic(
                name=topics.loc[i, 'name'],
                description=topics.loc[i, 'description'],
                module_id=topics.loc[i, 'module_id'],
                keywords=keywords[i] if i < len(keywords) else None,
                polyline=topic_polylines.loc[i, 'polyline'] if i < len(topic_polylines) else None,
                course_id=course_id,
                x_coordinate=centroid_list[i][0] if i < len(centroid_list) else None,
                y_coordinate=centroid_list[i][1] if i < len(centroid_list) else None,
                embedding=topic_embeddings[i] if i < len(topic_embeddings) else None
            )
            db.session.add(new_topic)

        db.session.commit()

        return jsonify({"message": "Topics created successfully"}), 201

    except Exception as e:
        app.logger.error(f"Error in create_new_topics_for_new_course: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "details": str(e)}), 500

def extract_transcript(video_id):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = ""
        for i in transcript:
            transcript_text += i['text'] + " "
        return transcript_text.strip()
    except Exception as e:
        return f"Error: {str(e)}"


def get_youtube_video_id(url):
    # Regular expression pattern to match video ID
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    else:
        return "Invalid YouTube URL"


def create_resource_embeddings(keywords):

    if not keywords:
        print("ERROR: Received empty keywords list!")
        return []

    model_name = 'bert-base-uncased'
    try:
        tokenizer = BertTokenizer.from_pretrained(model_name)
        model = BertModel.from_pretrained(model_name)
    except Exception as e:
        print(f"ERROR: Failed to load BERT model -> {e}")
        return []

    model.eval()
    keybert_embeddings_list = []

    for keyword in keywords:
        if not isinstance(keyword, str) or not keyword.strip():
            print(f"WARNING: Skipping invalid keyword -> {keyword}")
            continue

        try:
            tokenized_inputs = tokenizer(keyword, padding=True, truncation=True, return_tensors="pt")
            with torch.no_grad():
                outputs = model(**tokenized_inputs)

            embeddings = outputs.last_hidden_state[:, 0, :].detach().cpu().numpy()

            # Ensure embeddings are always lists of lists
            if isinstance(embeddings, np.ndarray):
                embeddings = embeddings.tolist()

            if isinstance(embeddings, list) and isinstance(embeddings[0], list):
                keybert_embeddings_list.append(embeddings[0])
            else:
                print(f"ERROR: Unexpected embedding format for '{keyword}', skipping.")
                continue

        except Exception as e:
            print(f"ERROR: Failed to generate embedding for '{keyword}' -> {e}")
            continue

    return keybert_embeddings_list

def get_topic_embedding(topic_id):
    topic = Topic.query.filter_by(id=topic_id).first()

    if topic and topic.embedding is not None:

        if isinstance(topic.embedding, np.ndarray):
            topic_embeddings = topic.embedding.tolist()  # Convert NumPy array to list
        elif isinstance(topic.embedding, list):
            topic_embeddings = topic.embedding  # Already a list
        else:
            print("ERROR: Unexpected topic embedding format!")
            return None  # Handle unexpected data formats

        # 🔹 Ensure `topic_embeddings` is a list of vectors
        if isinstance(topic_embeddings, list):
            if all(isinstance(vec, (list, np.ndarray)) for vec in topic_embeddings):
                return topic_embeddings  # ✅ Correct format
            elif isinstance(topic_embeddings[0], (float, int)):
                # 🔹 If it's a single vector (not wrapped in a list), wrap it
                print("WARNING: Detected single topic embedding, wrapping it in a list.")
                return [topic_embeddings]


        return None


    return None  # If topic is not found or embedding is None



def create_resource_polylines(topic_embeddings, keybert_embeddings_list, beta):
    if not keybert_embeddings_list or not topic_embeddings:
        print("ERROR: Empty embeddings provided")
        return []

    all_polylines = []

    for i, docVector in enumerate(keybert_embeddings_list):
        if not isinstance(docVector, list):
            print(f"ERROR: Skipping invalid embedding at index {i} -> Expected list, got {type(docVector)}")
            continue

        polyline = []
        for idx, wordVector in enumerate(topic_embeddings):
            if not isinstance(wordVector, list):
                print(f"ERROR: Invalid topic embedding at [{idx}] -> Expected list, got {type(wordVector)}")
                continue

            cos_sim = get_cos_sim(wordVector, docVector)
            cos_sim = (cos_sim + 1) / 2 if cos_sim is not None else 0  # Normalize and handle None
            polyline.append({'x': idx, 'y': cos_sim})

        all_polylines.append(polyline)

    if not all_polylines:
        print("WARNING: No polylines were generated")
        return []

    # Averaging polylines across multiple keywords
    new_polylines = []
    for polyline in all_polylines:
        averaged_polyline = [sum(p['y'] for p in polyline) / len(polyline) for _ in range(len(topic_embeddings))]
        new_polylines.append(averaged_polyline)

    beta = float(beta)
    beta_polylines = [[max(0, min(val + beta * (val - np.mean(polyline)), 1)) for val in polyline] for polyline in new_polylines]


    return beta_polylines


@app.route('/new-resources-topics', methods=['POST'])
def create_new_resources_for_new_course():
    try:
        data = request.get_json()

        name = data.get('name')
        course_id = data.get('course_id')
        module_id = data.get('module_id')
        res_type = data.get('type')
        link = data.get('link')
        module = data.get('module')

        if not all([course_id, module_id, res_type, link]):
            return jsonify({"error": "Missing required fields"}), 400

        video_id = get_youtube_video_id(link)
        if video_id == "Invalid YouTube URL":
            return jsonify({"error": "Invalid YouTube URL"}), 400

        transcript = extract_transcript(video_id)
        if transcript.startswith("Error:"):
            return jsonify({"error": f"Failed to fetch transcript: {transcript}"}), 400

        try:
            keywords, weights = create_keywords_list([transcript])
            if keywords and isinstance(keywords[0], list):
                keywords = [word for sublist in keywords for word in sublist]

        except Exception as e:
            return jsonify({"error": f"Failed to extract keywords: {str(e)}"}), 400

        if not keywords:
            return jsonify({"error": "No keywords extracted"}), 400

        resource_embeddings = create_resource_embeddings(keywords)
        if not resource_embeddings:
            return jsonify({"error": "Failed to generate resource embeddings"}), 400

        topic_embeddings = get_topic_embedding(module_id)

        # Debugging
        if topic_embeddings is None:
            return jsonify({"error": "Topic embeddings not found"}), 400

        if isinstance(topic_embeddings, np.ndarray) and topic_embeddings.ndim == 1:
            topic_embeddings = [topic_embeddings]

        # If only one topic embedding is available, duplicate it
        if len(topic_embeddings) == 1:
            print("WARNING: Only one topic embedding found, duplicating it.")
            topic_embeddings.append(topic_embeddings[0])

        if len(topic_embeddings) < 2:
            return jsonify({"error": "Insufficient topic embeddings"}), 400

        resource_polylines = create_resource_polylines(topic_embeddings, resource_embeddings, 8)
        if not resource_polylines:
            return jsonify({"error": "Generated polylines are empty"}), 400

        # Ensure num_axes is valid
        num_axes = len(topic_embeddings)
        x_max, y_max = 1.0, 1.0

        # Compute axes lengths and angle safely
        tlen, theta = rad_plot_axes(num_axes, x_max, y_max)

        # Compute x, y coordinates
        centroids = rad_plot_poly(num_axes, resource_polylines, tlen, theta)

        max_id = db.session.query(db.func.max(Resource.id)).scalar() or 0
        new_resources = []

        if centroids:
            x_coordinate, y_coordinate = centroids[0]  # Use only the first centroid
            new_resource = Resource(
                id=max_id + 1,
                name=name,
                description=None,
                keywords=keywords,
                polyline=resource_polylines,
                x_coordinate=x_coordinate,
                y_coordinate=y_coordinate,
                course_id=course_id,
                module_id=module_id,
                submodule_id=None,
                type=res_type,
                link=link,
                index=max_id + 1,
                module=module,
                beta=8
            )

            db.session.add(new_resource)
            db.session.commit()

            return jsonify({"message": "Resource created successfully"}), 201
        else:
            return jsonify({"error": "No valid centroid found"}), 400

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error occurred: {e}")
        return jsonify({"error": "Server error", "details": str(e)}), 500


def allowed_file(filename):
    ALLOWED_EXTENSIONS = {"pdf"}
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/uploads/<string:filename>')
def send_file(filename: str):
    filename = secure_filename(filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    if allowed_file(filename):
        if os.path.exists(filepath):
            return send_from_directory(UPLOAD_FOLDER_NAME, filename)
        else:
            return jsonify({'error': 'file not found'}), 404
    return jsonify({'error': 'invalid filename'}), 400

@app.route("/upload-pdf-resource", methods=["POST"])
def upload_pdf_resource():
    try:
        if "pdf_file" not in request.files:
            return jsonify({"error": "No PDF file provided"}), 400

        pdf_file = request.files["pdf_file"]
        if pdf_file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(pdf_file.filename):
            return jsonify({"error": "Invalid file type"}), 400

        # Secure filename and save file
        filename = secure_filename(pdf_file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        pdf_file.save(filepath)

        # Extract metadata
        name = request.form.get("name")
        course_id = request.form.get("course_id")
        module_id = request.form.get("module_id")
        res_type = request.form.get("type")
        module = request.form.get("module")

        if not all([name, course_id, module_id, res_type]):
            return jsonify({"error": "Missing required fields"}), 400

        # Extract text from PDF
        extracted_text = ""
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                extracted_text += page.extract_text() or ""

        if not extracted_text.strip():
            return jsonify({"error": "Failed to extract text from PDF"}), 400

        # Generate keywords
        try:
            keywords, _ = create_keywords_list([extracted_text])
            if keywords and isinstance(keywords[0], list):
                keywords = [word for sublist in keywords for word in sublist]
        except Exception as e:
            return jsonify({"error": f"Failed to extract keywords: {str(e)}"}), 400

        if not keywords:
            return jsonify({"error": "No keywords extracted"}), 400

        # Generate embeddings
        resource_embeddings = create_resource_embeddings(keywords)
        if not resource_embeddings:
            return jsonify({"error": "Failed to generate resource embeddings"}), 400

        topic_embeddings = get_topic_embedding(module_id)
        if topic_embeddings is None:
            return jsonify({"error": "Topic embeddings not found"}), 400

        if isinstance(topic_embeddings, np.ndarray) and topic_embeddings.ndim == 1:
            topic_embeddings = [topic_embeddings]

        if len(topic_embeddings) == 1:
            topic_embeddings.append(topic_embeddings[0])

        if len(topic_embeddings) < 2:
            return jsonify({"error": "Insufficient topic embeddings"}), 400

        # Generate resource polylines
        resource_polylines = create_resource_polylines(topic_embeddings, resource_embeddings, 8)
        if not resource_polylines:
            return jsonify({"error": "Generated polylines are empty"}), 400

        num_axes = len(topic_embeddings)
        x_max, y_max = 1.0, 1.0
        tlen, theta = rad_plot_axes(num_axes, x_max, y_max)
        centroids = rad_plot_poly(num_axes, resource_polylines, tlen, theta)

        max_id = db.session.query(db.func.max(Resource.id)).scalar() or 0
        if centroids:
            x_coordinate, y_coordinate = centroids[0]

            new_resource = Resource(
                id=max_id + 1,
                name=name,
                description=None,
                keywords=keywords,
                polyline=resource_polylines,
                x_coordinate=x_coordinate,
                y_coordinate=y_coordinate,
                course_id=course_id,
                module_id=module_id,
                submodule_id=None,
                type=res_type,
                link='/' + UPLOAD_FOLDER_NAME + '/' + filename,
                index=max_id + 1,
                module=module,
                beta=8
            )

            db.session.add(new_resource)
            db.session.commit()

            return jsonify({"message": "PDF Resource uploaded successfully"}), 201
        else:
            return jsonify({"error": "No valid centroid found"}), 400

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error occurred: {e}")
        return jsonify({"error": "Server error", "details": str(e)}), 500


def convert_to_lists(data):
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, list):
        return [convert_to_lists(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_to_lists(value) for key, value in data.items()}
    else:
        return data

@app.route('/ta-gi-summary',methods=['POST'])
def changed_by_summary():
    try:
        print("[REQUEST RECEIVED] Processing new TA description request...")

        # Parse request data
        data = request.get_json()
        #user_id = data.get('user_id')
        ta_id = data.get('ta_id')
        course_id = data.get('course_id')
        description = data.get('description')

        # if not isinstance(ta_id, int):
        #     print("adding new ta...")
        #     ta_id = add_ta_from_user(user_id)["id"]

        # Validate inputs
        if not all([ta_id, course_id, description]):
            print("p1")
            print(ta_id)
            print(description)
            print(course_id)
            return jsonify({"error": "Missing required fields"}), 400

        # Generate keywords
        all_keywords_list, _ = create_keywords_list([description])
        if not all_keywords_list:
            print("p2")
            return jsonify({"error": "Keyword extraction failed"}), 400
        if isinstance(all_keywords_list[0], list):
            all_keywords_list = [word for sublist in all_keywords_list for word in sublist]

        # Generate embeddings
        learner_embeddings = create_resource_embeddings(all_keywords_list)
        if not learner_embeddings:
            print("p3")
            return jsonify({"error": "Embedding generation failed"}), 400

        # Fetch topic embeddings for the given course_id
        raw_embeddings = db.session.query(Topic.embedding).filter_by(course_id=course_id).all()

        # Convert embeddings safely
        topic_embeddings = []
        for embed in raw_embeddings:
            try:
                emb_value = json.loads(embed[0]) if isinstance(embed[0], str) else embed[0]
                if isinstance(emb_value, list):
                    topic_embeddings.append(emb_value)
                else:
                    print(f"ERROR: Invalid topic embedding -> Expected list, got {type(emb_value)}")
            except json.JSONDecodeError:
                print("ERROR: Failed to parse embedding JSON")

        # Validate topic embeddings
        if not topic_embeddings:
            print("p4")
            return jsonify({"error": "No valid topic embeddings found for this course"}), 400

        # Generate polylines
        learner_polylines = create_resource_polylines(topic_embeddings, learner_embeddings, 8)
        if not learner_polylines:
            print("p5")
            return jsonify({"error": "Polyline generation failed"}), 400

        # Convert to description polyline
        description_polyline_list = [item for sublist in convert_to_lists(learner_polylines[0]) for item in (
            sublist if isinstance(sublist, list) else [sublist])]

        # Compute axes and centroid
        feature_length = len(learner_polylines[0])
        tlen, theta = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(feature_length, [description_polyline_list], tlen, theta)

        # Extract centroid coordinates
        x_coordinate, y_coordinate = centroid_list[0]

        #  Insert description into description table
        insert_description_query = text("""
            INSERT INTO description (ta_id, description,course_id)
            VALUES (:ta_id, :description, :course_id)
        """)

        db.session.execute(insert_description_query, {
            "ta_id": ta_id,
            "description": json.dumps(description),
            "course_id": course_id
        })

        print(f"Saving to tat: x={x_coordinate}, y={y_coordinate}")

        # 🔹 Save TA position in tat table
        # update_query = text("""
        #     INSERT INTO tat (ta_id, course_id, x_coordinate, y_coordinate, polyline)
        #     VALUES (:ta_id, :course_id, :x_coordinate, :y_coordinate, :polyline)
        # """)

        # db.session.execute(update_query, {
        #     "ta_id": ta_id,
        #     "course_id": course_id,
        #     "x_coordinate": float(x_coordinate),
        #     "y_coordinate": float(y_coordinate),
        #     "polyline": json.dumps(learner_polylines)
        # })
        
        max_learner_id = db.session.query(db.func.max(Learner.id)).scalar()
        new_learner_id = (max_learner_id ) if max_learner_id else 1  # Start from 1 if table is empty

        # 🔹 Fetch all resource indexes for this course_id
        resource_indexes = db.session.query(Resource.index).filter_by(course_id=course_id).all()
        resource_index_list = [idx[0] for idx in resource_indexes if idx[0] is not None]  # Extract values from tuples

        # 🔹 Insert into enroll table with learner_id as max+1 and ta_id as given
        enroll_insert_query = text("""
            INSERT INTO enroll (learner_id, course_id, x_coordinate, y_coordinate, polyline, ta_id, accessible_resources)
            VALUES (:learner_id, :course_id, :x_coordinate, :y_coordinate, :polyline, :ta_id, :accessible_resources)
        """)

        db.session.execute(enroll_insert_query, {
            "learner_id": new_learner_id,
            "course_id": course_id,
            "x_coordinate": float(x_coordinate),
            "y_coordinate": float(y_coordinate),
            "polyline": json.dumps(learner_polylines),
            "ta_id": ta_id,
            "accessible_resources": json.dumps(resource_index_list)  # Store indexes as JSON array
        })

        db.session.commit()
        print("[SUCCESS] TA position stored successfully!")
        return jsonify({"message": "TA position stored successfully"}), 201

    except ValueError as ve:
        print(f"[ERROR] Validation error: {str(ve)}")
        return jsonify({"error": "Validation Error", "details": str(ve)}), 400

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Server error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/ta-ch-description', methods=['POST'])
def changed_ta_position():
    try:
        print("[REQUEST RECEIVED] Processing new TA description request...")

        # Parse request data
        data = request.get_json()
        user_id = data.get('user_id')
        ta_id = data.get('ta_id')
        course_id = data.get('course_id')
        description = data.get('description')

        if not is_valid_id(ta_id):
            print("adding new ta...")
            ta_id = add_ta_from_user(user_id)["id"]

        # Validate inputs
        if not all([ta_id, course_id, description]):
            return jsonify({"error": "Missing required fields"}), 400

        # Generate keywords
        all_keywords_list, _ = create_keywords_list([description])
        if not all_keywords_list:
            return jsonify({"error": "Keyword extraction failed"}), 400
        if isinstance(all_keywords_list[0], list):
            all_keywords_list = [word for sublist in all_keywords_list for word in sublist]

        # Generate embeddings
        learner_embeddings = create_resource_embeddings(all_keywords_list)
        if not learner_embeddings:
            return jsonify({"error": "Embedding generation failed"}), 400

        # Fetch topic embeddings for the given course_id
        raw_embeddings = db.session.query(Topic.embedding).filter_by(course_id=course_id).all()

        # Convert embeddings safely
        topic_embeddings = []
        for embed in raw_embeddings:
            try:
                emb_value = json.loads(embed[0]) if isinstance(embed[0], str) else embed[0]
                if isinstance(emb_value, list):
                    topic_embeddings.append(emb_value)
                else:
                    print(f"ERROR: Invalid topic embedding -> Expected list, got {type(emb_value)}")
            except json.JSONDecodeError:
                print("ERROR: Failed to parse embedding JSON")

        if not topic_embeddings:
            return jsonify({"error": "No valid topic embeddings found for this course"}), 400

        # Generate polylines
        learner_polylines = create_resource_polylines(topic_embeddings, learner_embeddings, 8)
        if not learner_polylines:
            return jsonify({"error": "Polyline generation failed"}), 400

        description_polyline_list = [item for sublist in convert_to_lists(learner_polylines[0]) for item in (
            sublist if isinstance(sublist, list) else [sublist])]

        feature_length = len(learner_polylines[0])
        tlen, theta = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(feature_length, [description_polyline_list], tlen, theta)

        x_coordinate, y_coordinate = centroid_list[0]

        # 🔹 Insert into description table
        insert_description_query = text("""
            INSERT INTO description (ta_id, description)
            VALUES (:ta_id, :description)
        """)
        db.session.execute(insert_description_query, {
            "ta_id": ta_id,
            "description": json.dumps(description)
        })

        print(f"Saving to tat: x={x_coordinate}, y={y_coordinate}")

        # 🔹 Insert into tat table
        update_query = text("""
            INSERT INTO tat (ta_id, course_id, x_coordinate, y_coordinate, polyline)
            VALUES (:ta_id, :course_id, :x_coordinate, :y_coordinate, :polyline)
        """)
        db.session.execute(update_query, {
            "ta_id": ta_id,
            "course_id": course_id,
            "x_coordinate": float(x_coordinate),
            "y_coordinate": float(y_coordinate),
            "polyline": json.dumps(learner_polylines)
        })

        # 🔹 Fetch user info to add to learner table
        user_data_query = text("""
            SELECT registered_date, name, username, password FROM user WHERE id = :user_id
        """)
        user_data_result = db.session.execute(user_data_query, {"user_id": user_id}).fetchone()
        if not user_data_result:
            return jsonify({"error": "User not found"}), 404

        registered_date, name, username, password = user_data_result

        # 🔹 Insert into learner table
        insert_learner_query = text("""
            INSERT INTO learner (registered_date, name, cgpa, username, password, ta_id)
            VALUES (:registered_date, :name, 4, :username, :password, :ta_id)
        """)
        db.session.execute(insert_learner_query, {
            "registered_date": registered_date,
            "name": name,
            "cgpa": 4,
            "username": username,
            "password": password,
            "ta_id": ta_id
        })

        # 🔹 Get newly inserted learner_id
        new_learner_id = db.session.query(db.func.max(Learner.id)).scalar()

        # 🔹 Fetch accessible resources for course
        resource_indexes = db.session.query(Resource.index).filter_by(course_id=course_id).all()
        resource_index_list = [idx[0] for idx in resource_indexes if idx[0] is not None]

        # 🔹 Insert into enroll table
        enroll_insert_query = text("""
            INSERT INTO enroll (learner_id, course_id, x_coordinate, y_coordinate, polyline, ta_id, accessible_resources)
            VALUES (:learner_id, :course_id, :x_coordinate, :y_coordinate, :polyline, :ta_id, :accessible_resources)
        """)
        db.session.execute(enroll_insert_query, {
            "learner_id": new_learner_id,
            "course_id": course_id,
            "x_coordinate": float(x_coordinate),
            "y_coordinate": float(y_coordinate),
            "polyline": json.dumps(learner_polylines),
            "ta_id": ta_id,
            "accessible_resources": json.dumps(resource_index_list)
        })

        db.session.commit()
        print("[SUCCESS] TA and Learner information stored successfully!")
        return jsonify({"message": "TA and Learner data stored successfully"}), 201

    except ValueError as ve:
        print(f"[ERROR] Validation error: {str(ve)}")
        return jsonify({"error": "Validation Error", "details": str(ve)}), 400

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Server error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


@app.route('/teacher-exit-points', methods=['POST'])
def teacher_exit_points():
    try:
        print("[REQUEST RECEIVED] Processing teacher exit point...")

        # Parse request data
        data = request.get_json()
        course_id = data.get('course_id')
        description = data.get('description')

        if not all([course_id, description]):
            return jsonify({"error": "Missing required fields"}), 400

        # 🔹 Step 1: Generate keywords
        all_keywords_list, _ = create_keywords_list([description])
        if not all_keywords_list:
            return jsonify({"error": "Keyword extraction failed"}), 400
        if isinstance(all_keywords_list[0], list):
            all_keywords_list = [word for sublist in all_keywords_list for word in sublist]

        # 🔹 Step 2: Generate learner embeddings
        learner_embeddings = create_resource_embeddings(all_keywords_list)
        if not learner_embeddings:
            return jsonify({"error": "Embedding generation failed"}), 400

        # 🔹 Step 3: Fetch topic embeddings for the given course_id
        raw_embeddings = db.session.query(Topic.embedding).filter_by(course_id=course_id).all()

        topic_embeddings = []
        for embed in raw_embeddings:
            try:
                emb_value = json.loads(embed[0]) if isinstance(embed[0], str) else embed[0]
                if isinstance(emb_value, list):
                    topic_embeddings.append(emb_value)
                else:
                    print(f"ERROR: Invalid topic embedding -> Expected list, got {type(emb_value)}")
            except json.JSONDecodeError:
                print("ERROR: Failed to parse embedding JSON")

        if not topic_embeddings:
            return jsonify({"error": "No valid topic embeddings found for this course"}), 400

        # 🔹 Step 4: Generate polylines
        learner_polylines = create_resource_polylines(topic_embeddings, learner_embeddings, 8)
        if not learner_polylines:
            return jsonify({"error": "Polyline generation failed"}), 400

        description_polyline_list = [item for sublist in convert_to_lists(learner_polylines[0]) for item in (
            sublist if isinstance(sublist, list) else [sublist])]

        # 🔹 Step 5: Get (x, y) coordinates
        feature_length = len(learner_polylines[0])
        tlen, theta = rad_plot_axes(feature_length, 1, 1)
        centroid_list = rad_plot_poly(feature_length, [description_polyline_list], tlen, theta)
        x_coordinate, y_coordinate = centroid_list[0]

        print(f"[EXIT POINT] x: {x_coordinate}, y: {y_coordinate}")

        # 🔹 Step 6: Insert into exit_point table
        insert_exit_point_query = text("""
            INSERT INTO exit_point (id, course_id, description, polyline, x, y)
            VALUES (:id, :course_id, :description, :polyline, :x, :y)
        """)

        # You may want to dynamically generate `id`, e.g., as max(id)+1
        new_id_query = text("SELECT COALESCE(MAX(id), 0) + 1 FROM exit_point")
        new_id = db.session.execute(new_id_query).scalar()


        db.session.execute(insert_exit_point_query, {
            "id": new_id,
            "course_id": course_id,
            "description": json.dumps(description),
            "polyline": json.dumps(learner_polylines),
            "x": float(x_coordinate),
            "y": float(y_coordinate)
        })

        db.session.commit()
        print("[SUCCESS] Exit point saved successfully.")
        return jsonify({"message": "Exit point stored successfully."}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Server error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


@app.route('/summaries/<int:ta_id>/<int:course_id>', methods=['GET'])
def get_summaries(ta_id, course_id):
    try:
        # Fetch summaries for the given TA and course
        summaries = db.session.query(Description).filter_by(ta_id=ta_id, course_id=course_id).all()
        if not summaries:
            return jsonify({"message": "No summaries found"}), 404

        # Convert to list of dictionaries
        summaries_list = [{"description": summary.description} for summary in summaries]
        return jsonify(summaries_list), 200

    except Exception as e:
        app.logger.error(f"Error fetching summaries: {str(e)}", exc_info=True)
        return jsonify({"error": "Server error", "details": str(e)}), 500

@app.route('/contributions/insert-summary-coordinates/<int:enroll_id>/<int:course_id>', methods=['POST'])
def insert_summary_coordinates_per_contribution(enroll_id, course_id):
    try:
        print(f"[REQUEST RECEIVED] Inserting summary coordinates for enroll_id: {enroll_id}, course_id: {course_id}")

        # Fetch summary contributions for enroll_id
        contributions = Contribution.query.filter(
            Contribution.enroll_id == enroll_id,
            Contribution.description['summary'].as_boolean() == True
        ).order_by(Contribution.submitted_on.asc()).all()

        if not contributions:
            return jsonify({"error": "No summary contributions found for the given enroll_id"}), 404

        # Fetch topic embeddings for course
        raw_embeddings = db.session.query(Topic.embedding).filter_by(course_id=course_id).all()
        topic_embeddings = []
        for embed in raw_embeddings:
            try:
                emb_value = json.loads(embed[0]) if isinstance(embed[0], str) else embed[0]
                if isinstance(emb_value, list):
                    topic_embeddings.append(emb_value)
            except json.JSONDecodeError:
                print("ERROR: Failed to parse embedding JSON")

        if not topic_embeddings:
            return jsonify({"error": "No valid topic embeddings found for this course"}), 400

        inserted_count = 0

        for contrib in contributions:
            content = contrib.contribution_content
            if not content or content.strip() == "":
                continue

            # Extract keywords
            all_keywords_list, _ = create_keywords_list([content])
            if not all_keywords_list:
                print(f"Keyword extraction failed for contribution id: {contrib.id}")
                continue

            if isinstance(all_keywords_list[0], list):
                all_keywords_list = [word for sublist in all_keywords_list for word in sublist]

            # Generate embeddings
            learner_embeddings = create_resource_embeddings(all_keywords_list)
            if not learner_embeddings:
                print(f"Embedding generation failed for contribution id: {contrib.id}")
                continue

            # Generate polyline
            learner_polylines = create_resource_polylines(topic_embeddings, learner_embeddings, 8)
            if not learner_polylines:
                print(f"Polyline generation failed for contribution id: {contrib.id}")
                continue

            # Prepare polyline list for centroid calculation
            description_polyline_list = [
                item for sublist in convert_to_lists(learner_polylines[0]) 
                for item in (sublist if isinstance(sublist, list) else [sublist])
            ]

            # Compute (x,y)
            feature_length = len(learner_polylines[0])
            tlen, theta = rad_plot_axes(feature_length, 1, 1)
            centroid_list = rad_plot_poly(feature_length, [description_polyline_list], tlen, theta)
            x_coordinate, y_coordinate = centroid_list[0]

            # Get new id for summary_coordinates
            new_id_query = text("SELECT COALESCE(MAX(id), 0) + 1 FROM summary_coordinates")
            new_id = db.session.execute(new_id_query).scalar()

            # Insert into summary_coordinates table
            insert_query = text("""
                INSERT INTO summary_coordinates (id, enroll_id, course_id, summary, polyline, x_coordinate, y_coordinate)
                VALUES (:id, :enroll_id, :course_id, :summary, :polyline, :x, :y)
            """)

            db.session.execute(insert_query, {
                "id": new_id,
                "enroll_id": enroll_id,
                "course_id": course_id,
                "summary": json.dumps(content),
                "polyline": json.dumps(learner_polylines),
                "x": float(x_coordinate),
                "y": float(y_coordinate)
            })

            inserted_count += 1

        db.session.commit()
        print(f"[SUCCESS] Inserted {inserted_count} summary coordinate entries.")
        return jsonify({"message": f"Inserted {inserted_count} summary coordinate entries."}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Server error: {str(e)}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/exit-points/<int:course_id>', methods=['GET'])
def get_exit_coordinates(course_id):
    exit_points = ExitPoint.query.filter_by(course_id=course_id).all()

    if not exit_points:
        return jsonify([]), 200  # Return empty list if no data found

    coordinates = [
        [float(point.x), float(point.y)]
        for point in exit_points
        if point.x is not None and point.y is not None
    ]

    return jsonify(coordinates), 200


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)
