import os
path = "agents/budget_agent/backend/app/orchestration/graph.py"
with open(path, "r") as f:
    content = f.read()

import re
old = """            import sqlite3
            conn = sqlite3.connect(db_path, check_same_thread=False)
            return SqliteSaver(conn)"""
new = """            from langgraph.checkpoint.memory import MemorySaver
            return MemorySaver()"""

content = content.replace(old, new)

with open(path, "w") as f:
    f.write(content)
