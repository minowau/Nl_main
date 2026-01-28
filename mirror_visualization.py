import re

file_path = 'src/data/mockData.ts'
GRID_SIZE = 20

with open(file_path, 'r') as f:
    content = f.read()

def flip_y(match):
    x = match.group(1)
    y = int(match.group(2))
    new_y = (GRID_SIZE - 1) - y
    return f"position: {{ x: {x}, y: {new_y} }}"

# Regex to match "position: { x: 5, y: 7 }" with flexible spacing
pattern = r"position:\s*\{\s*x:\s*(\d+),\s*y:\s*(\d+)\s*\}"

new_content = re.sub(pattern, flip_y, content)

with open(file_path, 'w') as f:
    f.write(new_content)

print(f"Updated {file_path} with mirrored Y coordinates.")
