"""
=========================================================
    Radial-Axis Polyline → 2D Mapping
=========================================================

Implements the dimensionality reduction algorithm described in the
Navigated Learning research paper (Equations 6–12).

The algorithm maps an N-dimensional polyline (one score per topic)
onto a 2D point in the first quadrant (0°—90°) by:
  1. Partitioning the 90° space into radial axes (one per topic).
  2. Computing axis lengths based on x_len / y_len.
  3. Projecting each topic's score onto its radial axis.
  4. Averaging all projected (x, y) pairs to get the final 2D point.

Key property preserved: **Covering** — if polyline A ≥ B in every
dimension, then A's 2D point will have x_A ≥ x_B and y_A ≥ y_B.
=========================================================
"""

import math
from typing import Optional


def _axis_length(b: int, theta: float, x_len: float, y_len: float) -> float:
    """
    Compute the length of the radial axis for topic index `b`.

    For angles ≤ 45° we anchor on x_len (Eq. 7):
        length = sqrt(x_len² + (x_len · tan(b·θ))²)

    For angles > 45° we anchor on y_len (Eq. 8):
        length = sqrt(y_len² + (y_len / tan(b·θ))²)

    Parameters
    ----------
    b     : int   – Topic order index (0 … num-1)
    theta : float – Angular spacing (radians)
    x_len : float – Maximum projected length on the X-axis
    y_len : float – Maximum projected length on the Y-axis

    Returns
    -------
    float – Length of the radial axis for topic b
    """
    angle = b * theta

    # Edge case: axis lies exactly on X-axis (angle == 0)
    if angle < 1e-12:
        return x_len

    # Edge case: axis lies exactly on Y-axis (angle ≈ π/2)
    if abs(angle - math.pi / 2) < 1e-12:
        return y_len

    # Eq. 7 — angle ≤ 45°
    if angle <= math.pi / 4:
        return math.sqrt(x_len ** 2 + (x_len * math.tan(angle)) ** 2)

    # Eq. 8 — angle > 45°
    return math.sqrt(y_len ** 2 + (y_len / math.tan(angle)) ** 2)


def polyline_to_2d(
    module_scores: list,
    num_topics: Optional[int] = None,
    x_len: float = 19.0,
    y_len: float = 19.0,
) -> tuple:
    """
    Map an N-dimensional polyline to a 2D (x, y) point using
    the radial-axis projection described in the paper.

    Parameters
    ----------
    module_scores : list[float]
        Assimilation scores for each topic (values 0.0 – 1.0).
    num_topics : int, optional
        Number of topics.  Defaults to len(module_scores).
    x_len : float
        Maximum arc length in X direction (default 19.0 — full grid width).
    y_len : float
        Maximum arc length in Y direction (default 19.0 — full grid height).

    Returns
    -------
    (x_l, y_l) : tuple[float, float]
        The 2D position of the learner on the map.
    """
    if not module_scores:
        return (0.0, 0.0)

    if num_topics is None:
        num_topics = len(module_scores)

    if num_topics <= 1:
        # Only one topic — project directly onto X axis
        r = max(0.0, min(1.0, module_scores[0]))
        return (r * x_len, 0.0)

    # Eq. 6 — angular spacing
    theta = (math.pi / 2) / (num_topics - 1)

    sum_x = 0.0
    sum_y = 0.0

    for b in range(num_topics):
        if b < len(module_scores):
            r = max(0.0, min(1.0, module_scores[b]))
        else:
            r = 0.0

        length = _axis_length(b, theta, x_len, y_len)
        angle = b * theta

        # Eq. 9, 10
        x_pb = r * length * math.cos(angle)
        y_pb = r * length * math.sin(angle)

        sum_x += x_pb
        sum_y += y_pb

    # Eq. 11, 12 — average
    x_l = sum_x / num_topics
    y_l = sum_y / num_topics

    return (x_l, y_l)


def map_to_grid(
    x_2d: float,
    y_2d: float,
    grid_size: int = 20,
) -> dict:
    """
    Convert the raw 2D coordinates from polyline_to_2d() into grid
    coordinates matching the Learning Map (origin at bottom-left).

    The grid uses a bottom-left origin: (0, grid_size-1) is the
    visual origin; increasing Y goes upward, so we flip for grid
    row indices.

    Parameters
    ----------
    x_2d : float – Raw X from polyline_to_2d()
    y_2d : float – Raw Y from polyline_to_2d()
    grid_size : int – Grid dimension (default 20 for a 20×20 grid)

    Returns
    -------
    dict  – {"x": int, "y": int} grid coordinates
    """
    max_coord = grid_size - 1  # 0–19 for a 20×20 grid

    # Clamp to valid range
    gx = max(0, min(max_coord, round(x_2d)))
    # Flip Y: in the grid, row 0 is top, row 19 is bottom.
    # The raw y_2d increases upward, so grid_y = max_coord - y_2d
    gy = max(0, min(max_coord, round(max_coord - y_2d)))

    return {"x": int(gx), "y": int(gy)}


def polyline_to_grid(
    module_scores: list,
    num_topics: Optional[int] = None,
    x_len: float = 19.0,
    y_len: float = 19.0,
    grid_size: int = 20,
) -> dict:
    """
    Convenience function: map polyline → 2D → grid coordinates.

    Returns
    -------
    dict – {"x": int, "y": int}
    """
    x_2d, y_2d = polyline_to_2d(module_scores, num_topics, x_len, y_len)
    return map_to_grid(x_2d, y_2d, grid_size)
