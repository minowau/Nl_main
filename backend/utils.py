"""
=========================================================
        Polyline & Vector Utility Functions
=========================================================

This file contains utility (i.e. globally used) functions in accordance with DRY principle :
- Handling polylines (multi-dimensional paths) used in courses/resources.
- Computing geometric and vector operations (centroids, distances, cosine similarity).
- Finding nearest resources for a learner based on polyline similarity.
- Converting NumPy arrays to standard Python lists for JSON serialization.
(more to be added with time...)
=========================================================
"""

import numpy as np
import math
import heapq

# ===========================
# convert_to_lists
# ===========================
def convert_to_lists(data):
    """
    Recursively convert NumPy arrays to standard Python lists.

    Parameters:
        data (np.ndarray | list | dict | other): Input data structure.

    Returns:
        list | dict | original type: Data converted to lists recursively.
    """
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, list):
        return [convert_to_lists(item) for item in data]
    elif isinstance(data, dict):
        return {key: convert_to_lists(value) for key, value in data.items()}
    else:
        return data


# ===========================
# get_lowline_of_polylines
# ===========================
def get_lowline_of_polylines(polylines):
    """
    Get the minimum value along each dimension across all polylines.

    Parameters:
        polylines (list of lists): Each inner list is a polyline vector.

    Returns:
        list: Minimum values for each dimension (lowline).
    """
    if not polylines:
        return [0] * 12  # Default 12-dimension zero vector

    lowline = [min([polylines[i][j] for i in range(len(polylines))])
               for j in range(len(polylines[0]))]
    return lowline


# ===========================
# get_highline_of_polylines
# ===========================
def get_highline_of_polylines(polylines):
    """
    Get the maximum value along each dimension across all polylines.

    Parameters:
        polylines (list of lists): Each inner list is a polyline vector.

    Returns:
        list: Maximum values for each dimension (highline).
    """
    return [max([polylines[i][j] for i in range(len(polylines))])
            for j in range(len(polylines[0]))]


# ===========================
# get_cos_sim
# ===========================
def get_cos_sim(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculate the cosine similarity between two vectors.

    Cosine similarity measures how similar two vectors are in direction
    regardless of their magnitude.

    Parameters:
        a (np.ndarray): First vector.
        b (np.ndarray): Second vector.

    Returns:
        float: Cosine similarity (1 = identical direction, -1 = opposite).
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)


# ===========================
# calculate_centroid
# ===========================
def calculate_centroid(polylines):
    """
    Calculate the centroid (mean point) of a list of polylines.

    Parameters:
        polylines (list of lists): List of N-dimension polyline vectors.

    Returns:
        list: Centroid coordinates (mean along each dimension).
    """
    polyline_array = np.array(polylines)
    centroid = np.mean(polyline_array, axis=0)
    return centroid.tolist()


# ===========================
# two_polyline_distance
# ===========================
def two_polyline_distance(point1, point2):
    """
    Calculate Euclidean distance between two polylines (points in N-dimensional space).

    Parameters:
        point1 (list | np.ndarray): First polyline coordinates.
        point2 (list | np.ndarray): Second polyline coordinates.

    Returns:
        float: Euclidean distance between the two polylines.
    """
    if len(point1) != len(point2):
        raise ValueError("Points must have the same dimensions")

    return math.sqrt(sum((p2 - p1) ** 2 for p1, p2 in zip(point1, point2)))


# ===========================
# nearest_seven
# ===========================
def nearest_seven(learner_polyline, resources_id_polylines):
    """
    Find the 7 nearest resources to the learner based on polyline distance.

    Parameters:
        learner_polyline (list): Learner's current polyline coordinates.
        resources_id_polylines (list of tuples): Each tuple is (resource_id, polyline).

    Returns:
        list: IDs of the 7 nearest resources.
    """
    top7 = []
    for id_polyline in resources_id_polylines:
        distance = two_polyline_distance(learner_polyline, id_polyline[1])
        heapq.heappush(top7, (-distance, id_polyline[0]))  # Use negative distance for max-heap
        if len(top7) > 7:
            heapq.heappop(top7)
    return [id[1] for id in top7]


# ===========================
# calculate_distance
# ===========================
def calculate_distance(pos1, pos2):
    """
    Compute Euclidean distance between two 2D points.

    Parameters:
        pos1 (list | tuple): [x, y] of first point.
        pos2 (list | tuple): [x, y] of second point.

    Returns:
        float: Euclidean distance between pos1 and pos2.
    """
    return np.sqrt((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2)


# ===========================
# is_valid_id
# ===========================
def is_valid_id(id):
    """
    Check if a given ID is valid (convertible to integer).

    Parameters:
        id (any): ID to validate.

    Returns:
        bool: True if valid integer, False otherwise.
    """
    try:
        _ = int(id)
        return True
    except:
        return False