import json

db_path = r'e:\Nl_main\backend\data\db.json'

with open(db_path, 'r', encoding='utf-8') as f:
    s = f.read().strip()

# The file ends with '}}' but should end with '}'
# Try stripping from the end until valid
for i in range(1, 20):
    try:
        data = json.loads(s[:-i] if i > 0 else s)
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        print(f"DB repaired by removing {i} trailing characters!")
        break
    except json.JSONDecodeError:
        continue
else:
    print("Could not repair automatically. Resetting to clean state.")
    data = {
        "users": [],
        "learning_sessions": {},
        "polylines": {},
        "summaries": [],
        "bookmarks": {},
        "notes": {},
        "lectures": []
    }
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    print("DB reset to clean state.")
