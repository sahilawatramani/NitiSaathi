import os
path = "agents/budget_agent/backend/app/orchestration/graph.py"
with open(path, "r") as f:
    content = f.read()

import re
old = """            # SqliteSaver needs the plain file path
            return SqliteSaver.from_conn_string(db_path)"""
new = """            # SqliteSaver needs the plain file path
            import sqlite3
            conn = sqlite3.connect(db_path, check_same_thread=False)
            return SqliteSaver(conn)"""

content = content.replace(old, new)

with open(path, "w") as f:
    f.write(content)
