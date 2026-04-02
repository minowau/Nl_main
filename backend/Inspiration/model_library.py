import pandas as pd
from bs4 import BeautifulSoup
import re
import nltk
from nltk.stem import WordNetLemmatizer, PorterStemmer
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer
import numpy as np
from transformers import BertModel, BertTokenizer, BertForMaskedLM
import torch
from dbModels import db, Resource, Course, Topic, app, Enroll, Learner
import math
from keybert import KeyBERT
from utils import get_cos_sim
from statistics import mean
# from memory_profiler import profile
import gc

nltk.download('stopwords')
nltk.download('wordnet')
stop_words = set(stopwords.words('english'))


def utils_preprocess_text(text: str, flg_stemm: bool = False, flg_lemm: bool = True, lst_stopwords: list = None) -> str:
    """
    Preprocess text by removing HTML tags, punctuations, numbers, stopwords, and applying stemming/lemmatization.

    Parameters:
        text (str): The text to preprocess.
        flg_stemm (bool): Flag to apply stemming. Default is False.
        flg_lemm (bool): Flag to apply lemmatization. Default is True.
        lst_stopwords (list): List of stopwords to remove. Default is None.

    Returns:
        str: The preprocessed text.
    """

    # Remove HTML
    soup = BeautifulSoup(text, 'lxml')
    text = soup.get_text()

    # Remove punctuations and numbers
    text = re.sub('[^a-zA-Z]', ' ', text)

    # Single character removal
    text = re.sub(r"\s+[a-zA-Z]\s+", ' ', text)

    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Tokenize text
    lst_text = text.split()

    # Remove stopwords
    if lst_stopwords is not None:
        lst_text = [word for word in lst_text if word not in lst_stopwords]

    # Apply stemming
    if flg_stemm:
        ps = PorterStemmer()
        lst_text = [ps.stem(word) for word in lst_text]

    # Apply lemmatization
    if flg_lemm:
        lem = WordNetLemmatizer()
        lst_text = [lem.lemmatize(word) for word in lst_text]

    text = " ".join(lst_text)
    return text


def apply_preprocessing(df: pd.DataFrame):
    """
    Apply text preprocessing to the 'description' column of the DataFrame.

    Parameters:
        df (pd.DataFrame): DataFrame containing topics.
    """
    stop_words = set(stopwords.words('english'))  # Define stopwords
    df['clean_text'] = df['description'].apply(lambda x: x.lower())
    df['clean_text'] = df['clean_text'].apply(lambda x: utils_preprocess_text(
        x, flg_stemm=False, flg_lemm=True, lst_stopwords=stop_words))
    df['tokens'] = df['clean_text'].apply(lambda x: x.split())

# @profile
def create_topic_embeddings(topics: pd.DataFrame) -> list:
    """
    Create embeddings for each topic using a pre-trained BERT model.

    Parameters:
        topics (pd.DataFrame): DataFrame containing topics.

    Returns:
        list: List of topic embeddings.
    """
    model = SentenceTransformer('all-MiniLM-L6-v2')
    topic_embeddings = []

    for i in range(len(topics)):
        embedding = model.encode(
            topics.loc[i, "description"], convert_to_tensor=True)
        # Store embeddings as numpy arrays
        topic_embeddings.append(embedding.cpu().numpy())
        # Clear the embedding tensor and force garbage collection after each iteration
        del embedding
        gc.collect()

    return topic_embeddings

# @profile
def create_topic_polylines(topics: pd.DataFrame, topic_embeddings: list) -> pd.DataFrame:
    """
    Create a DataFrame containing topic names, module numbers, and cosine similarity polylines.

    Parameters:
        topics (pd.DataFrame): DataFrame containing topics.
        topic_embeddings (list): List of topic embeddings.

    Returns:
        pd.DataFrame: DataFrame with topic polylines.
    """
    topic_names = topics["name"].tolist()  # Topic keyphrases
    length = len(topics)
    topic_modules = []  # Topic module number
    for i in range(12):
        topic_modules.append(1)
    for i in range(8):
        topic_modules.append(2)
    nowl = len(topic_modules)
    for i in range(length-nowl):
        topic_modules.append(3)
    # Topic embedding - mean of topic embeddings of individual words of a keyphrase

    top_poly = []
    top_module = []
    topic = []

    # Going through each topic and computing the cosine similarity between it's embedding and all other topic's embeddings
    for i in range(len(topic_names)):
        polyline = [0]*len(topic_names)
        for j in range(len(topic_names)):
            cos_sim = 0
            if topic_names[i] == topic_names[j]:
                cos_sim = 1
            else:
                topic1_vector = topic_embeddings[i]
                topic2_vector = topic_embeddings[j]

                # scaling cosine similarity value from [-1,1] to [0,1]
                cos_sim = (get_cos_sim(
                    (topic1_vector), (topic2_vector)) + 1) / 2

            polyline[j] = cos_sim  # format 1
            # polyline.append((j, cos_sim)) #format 2

        topic.append(topic_names[i])
        top_module.append(topic_modules[i])
        top_poly.append(polyline)

    polyline_dict = {"topic": topic,
                     "module": top_module, "polyline": top_poly}
    # converting the topic polyline to a dataframe
    topic_polylines = pd.DataFrame(polyline_dict)
    return topic_polylines


#
#
# Resources functions start
#
#
# @profile

def create_summary_embeddings(summary) -> list:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    summary_embeddings_list = []

    # Encode the summary and convert to numpy array, then wrap in an additional list to match the format
    embedding = model.encode(summary, convert_to_tensor=True).cpu().numpy()
    summary_embeddings_list.append([embedding.tolist()])  # Add extra list wrapping to match format

    # Clear the embedding tensor and force garbage collection after each iteration
    del embedding
    gc.collect()
    
    return summary_embeddings_list

def create_resource_embeddings(keywords):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    keybert_embeddings_list = []
    for i in keywords:
        # Encode the keyword
        embedding = model.encode(i)
        
        # Convert to list and wrap to match expected structure [[float, ...]]
        embeddings = [embedding.tolist()]
        keybert_embeddings_list.append(embeddings)
        
    return keybert_embeddings_list

# @profile
def create_resource_polylines(topicembedding, keybert_embeddings_list, beta):
    all_polylines = []
    topic_embeddings = topicembedding
    for embeddings in keybert_embeddings_list:
        single_file_polyline = []
        for i in range(len(embeddings)):
            docVector = embeddings[i]
            polyline = []
            for j in range(len(topic_embeddings)):
                wordVector = topic_embeddings[j]
                # find the cosine similarity between resource embeddings and the topic embeddings
                cos_sim = (get_cos_sim(wordVector, docVector) + 1) / 2
                polyline.append({'x': j, 'y': cos_sim})
            single_file_polyline.append(polyline)
        all_polylines.append(single_file_polyline)
    new_polylines = []

    for single_file_polyline in all_polylines:
        templ = [0]*len(topicembedding)
        for i in range(len(topicembedding)):
            temp = 0
            # between the multiple polylines for each doc find the average and set that as the final polyline
            for j in range(len(single_file_polyline)):
                temp += single_file_polyline[j][i]['y']
            templ[i] = temp / len(single_file_polyline)
        new_polylines.append(templ)

    polylines = []
    temporary_list = []
    learning_objects = []
    for i in range(len(new_polylines)):
        polyline = new_polylines[i]
        pol = {}
        temporary_dict = {}
        for j in range(len(polyline)):
            pol[j] = polyline[j]
        hd1 = np.array([v for v in pol.values()])
        hd1.tolist()
        temporary_dict["polyline"] = hd1
        temporary_dict["ID"] = "r"
        learning_objects.append(temporary_dict)
        temporary_list.append(hd1)
    polylines.extend(temporary_list)

    beta = beta  # beta funtion to get more variance when plotting the polyline
    polyline2 = polylines.copy()
    beta_polylines = []
    for line in polyline2:
        v2 = []
        mean_val = np.average(line)
        len_arr = len(line)
        for j in line:
            j = j + beta*(j - mean_val)
            if j > 1:
                j = 1
            if j < 0:
                j = 0
            v2.append(j)
        beta_polylines.append(v2)

    return beta_polylines

def create_beta_polylines(resource_polylines,beta):
    beta = beta  # beta funtion to get more variance when plotting the polyline
    polyline2 = resource_polylines.copy()
    beta_polylines = []
    for line in polyline2:
        v2 = []
        mean_val = np.average(line)
        len_arr = len(line)
        for j in line:
            j = j + beta*(j - mean_val)
            if j > 1:
                j = 1
            if j < 0:
                j = 0
            v2.append(j)
        beta_polylines.append(v2)

    return beta_polylines

def create_beta_polyline(polyline, beta):
    # Apply beta transformation to a single polyline
    beta_polyline = []
    mean_val = np.average(polyline)
    
    for j in polyline:
        j = j + beta * (j - mean_val)
        # Clamping the values between 0 and 1
        if j > 1:
            j = 1
        if j < 0:
            j = 0
        beta_polyline.append(j)
    
    return beta_polyline

#
#
#
# learners functions
#
#
#


def create_embeddings_centroid_list(l):
    new_keybert_embeddings_list = []
    for i in l:
        # find the centroid of the embeddings for a doc
        index_averages = [sum(x) / len(x) for x in zip(*i)]
        new_keybert_embeddings_list.append(index_averages)
    return new_keybert_embeddings_list


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

# @profile
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


def push_topics_to_db(topics: pd.DataFrame, topic_embeddings: list, topic_polylines: pd.DataFrame, course_id: str):
    """
    Push topics, their embeddings, and polylines to the database.

    Parameters:
        topics (pd.DataFrame): DataFrame containing topics.
        topic_embeddings (list): List of topic embeddings.
        topic_polylines (pd.DataFrame): DataFrame with topic polylines.
        course_id (str): Unique identifier for the course.
    """
    # Print the lengths of topics, polylines, and embeddings for debugging
    print(len(topics), len(topic_polylines), len(topic_embeddings))

    # Determine the feature length from the polyline data
    feature_length = len(topic_polylines["polyline"][0])

    # Generate radial plot axes and plot polylines to get centroid coordinates
    tlen, theta = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(
        feature_length, topic_polylines["polyline"], tlen, theta)

    # List to hold all topic objects
    all_topics = []

    with app.app_context():
        for i in range(len(topics)):
            topic = Topic(
                name=topics["name"][i],
                description=topics["description"][i],
                keywords=topics["tokens"][i],
                polyline=topic_polylines["polyline"][i],
                x_coordinate=centroid_list[i][0],
                y_coordinate=centroid_list[i][1],
                course_id=course_id,
                embedding=topic_embeddings[i].tolist()
            )
            all_topics.append(topic)

        # Add all topics to the session and commit to the database
        db.session.add_all(all_topics)
        db.session.commit()

    print("Added topics to DB")


def get_cord_from_polyline(polylines):
    x_max = y_max = 1
    tlen, ttempl = [], []
    b = 0
    theta = ((np.pi) / (len(polylines[0]) - 1)) / 2
    while (b * theta) <= (np.arctan(y_max / x_max)):
        y_val = x_max * math.tan(b * theta)
        ttemp = math.sqrt((x_max ** 2) + (y_val ** 2))
        tlen.append(ttemp)
        if (b * theta) != np.arctan(y_max / x_max):
            ttempl.append(ttemp)
        b += 1

    while b < len(polylines[0]):
        b += 1

    tlen.extend(list(reversed(ttempl)))
    print(tlen)
    coordinates = []

    for polyline in polylines:
        x_values = []
        y_values = []
        for p in range(len(polyline)):
            rlen = polyline[p] * tlen[p]
            x_values.append(rlen * math.cos(p * theta))
            y_values.append(rlen * math.sin(p * theta))
        coordinates.append([mean(x_values), mean(y_values)])
    return coordinates


def pushResourcesToDB(resources, resourceembedding, resource_polylines, course_id):
    print(len(resources), len(resource_polylines), len(resourceembedding))
    beta_polylines=create_beta_polylines(resource_polylines,8)
    feature_length = len(resource_polylines[0])
    (tlen, theta) = rad_plot_axes(feature_length, 1, 1)
    centroid_list = rad_plot_poly(
        feature_length, beta_polylines, tlen, theta)
    allresources = []
    with app.app_context():
        for i in range(len(resources)):
            new_resource = Resource(
                name=resources["name"][i],
                description=resources["description"][i],
                keywords=resources['tokens'][i],
                polyline=resource_polylines[i],
                x_coordinate=centroid_list[i][0],
                y_coordinate=centroid_list[i][1],
                course_id=course_id,
                type=1,
                module_id=resources["module_id"][i],
                submodule_id=resources["submodule_id"][i],
                module=resources["module"][i],
                index=resources["index"][i],
                # embedding=resourceembedding[i],
                link=resources['links'][i],
                beta=8
            )
            # print(new_resource.to_dict())
            allresources.append(new_resource)
            # db.session.add(new_resource)
            # db.session.commit()
        db.session.add_all(allresources)
        db.session.commit()
    print("added resources to the DB")
    # breakpoint()


# find the keywords for all the documents and store it in a list
def create_keywords_list(content_list,num_keywords=10):
    kw_model = KeyBERT(model='all-mpnet-base-v2')
    all_keywords_list = []
    all_weight_list = []
    for i in range(len(content_list)):
        keywords = kw_model.extract_keywords(content_list[i], keyphrase_ngram_range=(
            1, 2), stop_words='english', highlight=False, top_n=num_keywords)
        keywords_list = list(dict(keywords).keys())
        cs_list = list(dict(keywords).values())
        weight = sum(cs_list)/len(cs_list)
        all_keywords_list.append(keywords_list)
        all_weight_list.append(weight)
    return all_keywords_list, all_weight_list


# Load pre-trained BERT model and tokenizer
def create_embeddings_list(l):
    model_name = 'bert-base-uncased'
    tokenizer = BertTokenizer.from_pretrained(model_name)
    new_model = BertModel.from_pretrained(model_name)

    keybert_embeddings_list = []
    for i in l:

        # Tokenize the keywords and convert them into token IDs
        tokenized_inputs = tokenizer(
            i, padding=True, truncation=True, return_tensors="pt")

        # Obtain the embeddings from the BERT model
        with torch.no_grad():
            outputs = new_model(**tokenized_inputs)

        # Extract the embeddings corresponding to the [CLS] token
        embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        embeddings = embeddings.tolist()
        keybert_embeddings_list.append(embeddings)
    return keybert_embeddings_list


def create_polyline(l, course_id):
    all_polylines = []
    embeddings = db.session.query(
        Topic.embedding).filter_by(course_id=course_id).all()
    topic_embeddings = embeddings
    for keybert_embeddings in l:
        docVector = keybert_embeddings
        polyline = []
        for j in range(len(topic_embeddings)):
            wordVector = topic_embeddings[j]
            # find cosine similarity between the learner embeddings and the topic embeddings
            cos_sim = (get_cos_sim(wordVector, docVector) + 1) / 2
            polyline.append(cos_sim)
        all_polylines.append(polyline)
    return all_polylines



def pushQuizToResourceInDB(
    name, description, keywords, polyline, 
    x_coordinate, y_coordinate, course_id, 
    module_id, submodule_id, module, index, 
    link,beta, type=1):
    
    new_resource = Resource(
        name=name,
        description=description,
        keywords=keywords,
        polyline=polyline,
        x_coordinate=x_coordinate,
        y_coordinate=y_coordinate,
        course_id=course_id,
        type=type,
        module_id=module_id,
        submodule_id=submodule_id,
        module=module,
        index=index,
        link=link,
        beta=beta
    )

    with app.app_context():
        db.session.add(new_resource)
        db.session.commit()
    
    print("Quiz resource added to the DB")
