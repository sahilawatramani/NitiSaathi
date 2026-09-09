with open('agents/fraud_guard/services/fraud_detector.py', 'r') as f:
    content = f.read()

content = content.replace("self.task_scam_keywords = _load_json_list('rbi_nbfc_list.json', 'known_scam_keywords')", "_SCAM_KEYWORDS = _load_json_list('rbi_nbfc_list.json', 'known_scam_keywords')")

with open('agents/fraud_guard/services/fraud_detector.py', 'w') as f:
    f.write(content)
