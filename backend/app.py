# This Flask backend manages user authentication (signup/login), course enrollment, teacher/TA assignment, 
# and provides course/learner data. It handles requests for course details, module/topic information, learner positions,
# and quiz interactions (submission, fetching questions/logs, recording attempts, creation).
# Data is often fetched from or updated in the database based on user actions and IDs.
import datetime
from utils import is_valid_id
from dbModels import User, db, Course, Question, UserQuiz
from init import app, DBcreated
import pandas as pd
from flask import make_response,jsonify, request
from repository import add_learner_from_user, add_teacher_from_user, create_Course, update_position, login,signup,teacher_course,teacher_course_unassigned,assign_teacher_course,unassign_teacher_course, learner_course_enrolled,generate_data,learner_course_unenrolled,enrolled_learner_data,enrolled_learners_by_course,calculate_all_module_centroids,add_enroll,update_by_quiz,learner_polyline_enrolled,get_suitable_position,change_resource_position,update_position_resource,update_summary_grade, quiz_adder_from_json,ta_course,ta_course_teached,ta_course_unteached, user_enrolled_courses, user_recom_courses
from datetime import datetime, timedelta,timezone
from flask import Flask
import modelsRoutes # to expose routes

# Read data from Excel file
excel_file = 'DM_Resource_Plot.xlsx'
df = pd.read_excel(excel_file)
excel_file = 'DM_learner_plot.xlsx'
df_learner = pd.read_excel(excel_file)

# Assuming your Excel file has columns 'x', 'y', and 'video_url'
scatterplot_data = df[['index', 'name', 'x', 'y', 'video_url', 'module','module_id','submodule_id']].to_dict(orient='records')

# Convert the scatterplot_data into a DataFrame
df_scatter = pd.DataFrame(scatterplot_data)

# Group by 'module_id' and calculate the mean of 'x' and 'y'
module_data_df = df_scatter.groupby('module_id').agg({'x': 'mean', 'y': 'mean','module': 'first' }).reset_index()

# Convert the result to a list of dictionaries with 'module_id', 'x', and 'y'
module_data = module_data_df.to_dict(orient='records')
topic_data_df=pd.read_excel('DM/DM_topics.xlsx')
topic_data=topic_data_df[['name','description']].to_dict(orient='records')


learner_data = df_learner[['index', 'resource_name', 'x', 'y', 'description']].to_dict(orient='records')

if DBcreated:
    # print("creating the course")
    # create_Course("Discreate Mathematics",
    #               "this is the description of DM", None, None)
    print("Generating Data")
    generate_data()


@app.route('/ids/<int:user_id>')
def get_ids(user_id):
    """
    Fetches learner, teacher, and TA IDs for a given user.

    Args:
        user_id (int): ID of the user.

    Returns:
        JSON: Dictionary containing 'learner_id', 'teacher_id', and 'ta_id'.
    """
    with app.app_context():
        user = User.query.get(user_id)
        return ({
            'learner_id': user.learner_id,
            'teacher_id': user.teacher_id,
            'ta_id': user.ta_id,
        })

@app.route('/data')
def get_data():
    """
    Returns resource scatterplot data (x, y, video URLs, module info).

    Returns:
        JSON: List of resource data dictionaries.
    """
    return jsonify(scatterplot_data)

@app.route('/moduleData/<int:id>')
def get_module_data(id):
    """
    Calculates and returns module centroid data for a given course.

    Args:
        id (int): Course ID.

    Returns:
        JSON: List of module data with centroid positions.
    """
    moudle = calculate_all_module_centroids(id)
    return jsonify(moudle)

@app.route('/topicData')
def get_topic_data():
    """
    Fetches topic names and descriptions.

    Returns:
        JSON: List of topic dictionaries with 'name' and 'description'.
    """
    return jsonify(topic_data)

@app.route('/new_positions')
def get_new_data():
    """
    Returns learner plot data including positions and descriptions.

    Returns:
        JSON: List of learner data dictionaries.
    """
    return jsonify(learner_data)

@app.route("/signup", methods=['POST'])
def signup_user():
    """
    Registers a new user.

    Request JSON:
        - name (str): Full name of the user.
        - username (str): Username for login.
        - password (str): Password for the account.

    Returns:
        JSON: Created user details if successful, else error message.
    """
    data = request.get_json()
    name = data["name"]
    username = data["username"]
    password = data["password"]
    print("user signup: ", name, password, username)

    user = signup(name, username, password)
    if user:
        return jsonify(user), 201
    else:
        return jsonify({"msg":"Error Creating user"}), 400

@app.route("/login", methods=['POST'])
def login_user():
    """
    Logs in an existing user.

    Request JSON:
        - username (str): Username of the user.
        - password (str): Password of the user.

    Returns:
        JSON: User details if login is successful, else 401 status.
    """
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    print("user login request:", username, password)

    user = login(username, password)
    response = make_response(jsonify(user)) 
    if user:
        response.status_code = 200
    else:
        response.status_code = 401
    
    return response

@app.route("/teacher/courses/<int:id>", methods=['GET'])
def get_teacher_course(id):
    """
    Fetches all courses assigned to a teacher.

    Args:
        id (int): Teacher ID.

    Returns:
        JSON: List of courses assigned to the teacher.
    """
    return teacher_course(id)

@app.route("/teacher/courses/unassigned/<int:id>", methods=['GET'])
def get_teacher_course_unassigned(id):
    """
    Fetches all unassigned courses for a teacher.

    Args:
        id (int): Teacher ID.

    Returns:
        JSON: List of unassigned courses available for assignment.
    """
    return teacher_course_unassigned(id)

@app.route("/teacher/courses/assign", methods=['POST'])
def assign_teacher():
    """
    Assigns a teacher to a course. If teacher doesn't exist, creates one.

    Request JSON:
        - user_id (int): User ID.
        - teacher_id (int): Teacher ID (may be invalid if new teacher).
        - course_id (int): Course ID.

    Returns:
        JSON: Assignment result (success or failure).
    """
    data = request.get_json()
    user_id = data["user_id"]
    teacher_id = data["teacher_id"]
    course_id = data["course_id"]
    print(f"user_id: {user_id}, teacher_id: {teacher_id}, course_id: {course_id}")
    if not is_valid_id(teacher_id):
        print("adding new teacher...")
        teacher_id = add_teacher_from_user(user_id)["id"]
    if teacher_id and course_id:
        result = assign_teacher_course(teacher_id, course_id)
        response = make_response(jsonify(result))
        if result:
            response.status_code = 200
        else :
            response.status_code = 500
    else:
        response = make_response(None)
        response.status_code = 400
    return response

@app.route("/teacher/courses/unassign", methods=['POST'])
def unassign_teacher():
    """
    Unassigns a teacher from a course.

    Request JSON:
        - teacher_id (int): Teacher ID.
        - course_id (int): Course ID.

    Returns:
        JSON: Result of unassignment (success/failure).
    """
    data = request.get_json()
    teacher_id = data["teacher_id"]
    course_id = data["course_id"]
    print(teacher_id,course_id)
    if teacher_id and course_id :
        result = unassign_teacher_course(teacher_id, course_id)
    return jsonify(result), 200 if result else jsonify(result), 400

@app.route("/enrolledCourses/<int:id>", methods=['GET'])
def get_enrolled_course(id):
    """
    Fetches list of courses a user is enrolled in, including role.

    Args:
        id (int): User ID.

    Returns:
        JSON: List of enrolled courses with role info.
    """
    return user_enrolled_courses(id)

@app.route("/taTeachedCourses/<int:id>",methods=['GET'])
def get_teached_course(id):
    """
    Fetches courses taught by a TA.

    Args:
        id (int): TA ID.

    Returns:
        JSON: List of courses taught by the TA.
    """
    return ta_course_teached(id)

@app.route("/enrolledLearner/<int:id>/<int:id2>", methods=['GET'])
def get_enrolled_learner(id,id2):
    """
    Fetches enrollment data for a learner in a specific course.

    Args:
        id (int): Learner ID.
        id2 (int): Course ID.

    Returns:
        JSON: Learner enrollment details.
    """
    return enrolled_learner_data(id,id2)

@app.route("/enrolledLearnersByCourse/<int:id>", methods=['GET'])
def get_enrolled_learners(id):
    """
    Fetches all learners enrolled in a given course.

    Args:
        id (int): Course ID.

    Returns:
        JSON: List of enrolled learners.
    """
    return enrolled_learners_by_course(id)

@app.route("/recomCourses/<int:id>", methods=['GET'])
def get_recom_course(id):
    """
    Fetches list of courses recommended for a user.

    Args:
        id (int): User ID.

    Returns:
        JSON: List of recommended courses for enrollment.
    """
    return user_recom_courses(id)

@app.route("/ta/recomCourses/<int:id>",methods=['GET'])
def get_ta_recom_course(id):
    """
    Fetches list of courses recommended for a TA to teach.

    Args:
        id (int): TA ID.

    Returns:
        JSON: List of teachable recommended courses.
    """
    return ta_course_unteached(id)

@app.route("/enrolledPolylines/<int:id>", methods=['GET'])
def get_enrolled_polyline(id):
    """
    Fetches polyline data for resources a learner is enrolled in.

    Args:
        id (int): Learner ID.

    Returns:
        JSON: Polyline positions of enrolled resources.
    """
    return learner_polyline_enrolled(id)

@app.route("/submitsummary", methods=['POST'])
def get_new_postion():
    """
    Updates learner's position after submitting a summary.

    Request JSON:
        - summary (str): Learner's summary.
        - enroll_id (int): Enrollment ID.

    Returns:
        JSON: Updated position and contribution ID.
    """
    data = request.get_json()
    summary = data["summary"]
    enrollId = data["enroll_id"]
    pos,contribution_id = update_position(summary, enrollId)
    return jsonify({"position": pos, "contribution_id": contribution_id}), 200

@app.route("/changeSummaryGrade", methods=['POST'])
def get_new_learner_postion():
    """
    Updates the grade of a learner's summary.

    Request JSON:
        - contribution_id (int): Contribution ID.
        - grade (float): Grade to assign.

    Returns:
        JSON: Updated learner position.
    """
    data = request.get_json()
    contributionId = data["contribution_id"]
    grade = data["grade"]
    pos = update_summary_grade(contributionId,grade)
    return jsonify(pos), 200

@app.route("/watchResource", methods=['POST'])
def get_updated_postion():
    """
    Updates learner's position after watching a resource.

    Request JSON:
        - enroll_id (int): Enrollment ID.
        - resource_id (int): Resource ID.

    Returns:
        JSON: Updated learner position.
    """
    data = request.get_json()
    enrollId = data["enroll_id"]
    resourceId = data["resource_id"]
    pos = update_position_resource(enrollId,resourceId)
    return jsonify(pos), 200

@app.route("/suitableResourcePosition", methods=['POST'])
def suitable_postion():
    """
    Suggests a suitable position for a learner based on resource.

    Request JSON:
        - pos (float): Initial position.
        - resource_id (int): Resource ID.

    Returns:
        JSON: Adjusted suitable position.
    """
    data = request.get_json()
    initial_pos = data["pos"]
    resourceId = data["resource_id"]
    pos = get_suitable_position(initial_pos,resourceId)
    return jsonify(pos), 200

@app.route("/changeResourcePosition", methods=['POST'])
def change_postion():
    """
    Changes position of a resource.

    Request JSON:
        - pos (float): New position.
        - resource_id (int): Resource ID.

    Returns:
        JSON: Empty success response.
    """
    data = request.get_json()
    pos = data["pos"]
    resourceId = data["resource_id"]
    change_resource_position(pos,resourceId)
    return jsonify({}), 200

@app.route("/submitquiz", methods=['POST'])
def update_by_quiz_route():
    """
    Updates learner's position based on quiz performance.

    Request JSON:
        - enroll_id (int): Enrollment ID.
        - course_id (int): Course ID.
        - to_consider (list): Boolean array of questions to consider.
        - question_polyline (list): Polyline array for each question.

    Returns:
        JSON: Updated learner position.
    """
    data = request.get_json()
    enrollId = data["enroll_id"]
    courseId = data["course_id"]
    to_consider = data["to_consider"]
    question_polyline = data["question_polyline"]

    pos = update_by_quiz(enrollId, courseId, to_consider, question_polyline, position_scaler = 1)

    return jsonify(pos), 200

@app.route('/quiz_questions/<int:quiz_id>', methods=['GET'])
def get_quiz_questions(quiz_id):
    """
    Fetches all questions for a given quiz.

    Args:
        quiz_id (int): Quiz ID.

    Returns:
        JSON: List of question dictionaries with options and correct answer.
    """
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    questions_data = []
    for question in questions:
        questions_data.append({
            'id': question.id,
            'quiz_id': question.quiz_id,
            'question_text': question.question_text,
            'option_a': question.option_a,
            'option_b': question.option_b,
            'option_c': question.option_c,
            'option_d': question.option_d,
            'correct_answer': question.correct_answer,
            'polyline': question.polyline
        })

    return jsonify(questions_data), 200

@app.route('/fetch_quiz_log/<int:user_id>', methods=['GET'])
def fetch_quiz_log(user_id):
    """
    Fetches all quiz attempts made by a user.

    Args:
        user_id (int): User ID.

    Returns:
        JSON: List of quiz attempt logs with score and attempt date.
    """
    user_quizzes = UserQuiz.query.filter_by(user_id=user_id).all()
    user_quiz_data = []

    for user_quiz in user_quizzes:
        user_quiz_data.append({
            'id': user_quiz.id,
            'quiz_id': user_quiz.quiz_id,
            'user_id': user_quiz.user_id,
            'score': user_quiz.score,
            'completion_date': user_quiz.attempt_date,
        })

    return jsonify(user_quiz_data), 200

@app.route('/record_quiz_attempt', methods=['POST'])
def record_quiz_attempt():
    """
    Records a quiz attempt for a user.

    Request JSON:
        - user_id (int): User ID.
        - quiz_id (int): Quiz ID.
        - score (float): Score obtained.
        - status (str): Status (e.g., completed, pending).
        - attempt_date (str, optional): ISO timestamp of attempt.

    Returns:
        JSON: Created quiz attempt record if successful.
    """
    try:
        data = request.get_json()
        attempt_date = None
        if 'attempt_date' in data:
            attempt_date_utc = datetime.fromisoformat(data['attempt_date'].replace("Z", "+00:00"))
            ist_timezone = timezone(timedelta(hours=5, minutes=30))
            attempt_date = attempt_date_utc.astimezone(ist_timezone)

        new_user_quiz = UserQuiz(
            user_id=data['user_id'],
            quiz_id=data['quiz_id'],
            score=data.get('score'),
            status=data['status'],
            attempt_date=attempt_date
        )

        db.session.add(new_user_quiz)
        db.session.commit()
        return jsonify(new_user_quiz.to_dict()), 201
    except Exception as e:
        print("Error in record_quiz_attempt:", e)
        return jsonify({"error": "Failed to record quiz attempt"}), 500

@app.route('/createquiz', methods=['POST'])
def create_quiz():
    """
    Creates a new quiz and its associated questions.

    Request JSON:
        - quiz details and questions in structured format.

    Returns:
        JSON: Success message with x, y coordinates from quiz creation.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        x, y = quiz_adder_from_json(data)
        return jsonify({"message": "Quiz and questions added successfully!", "x": x, "y": y}), 201

    except Exception as e:
        print("Unexpected error in create_quiz:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/enrolls', methods=['POST'])
def create_enroll():
    """
    Enrolls a learner into a course. Creates learner profile if missing.

    Request JSON:
        - user_id (int): User ID.
        - learner_id (int): Learner ID (optional if new).
        - course_id (int): Course ID.

    Returns:
        JSON: Enrollment confirmation.
    """
    data = request.get_json()
    user_id=data['user_id']
    learner_id=data['learner_id']
    course_id=data['course_id']
    if not is_valid_id(learner_id):
        learner_id = add_learner_from_user(user_id)['id']
    return add_enroll(learner_id, course_id)

@app.route('/coursename/<int:course_id>', methods=['GET'])
def get_course_name(course_id):
    """
    Fetches the name of a course by its ID.

    Args:
        course_id (int): ID of the course.

    Returns:
        JSON: A dictionary containing the course name or an error message.
    """
    course = Course.query.get(course_id)
    if course:
        return jsonify({'course_id': course.id, 'name': course.name})
    else:
        return jsonify({'error': 'Course not found'}), 404


if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)