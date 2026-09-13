import json

with open('agents/fraud_guard/data/rbi_nbfc_list.json', 'r') as f:
    data = json.load(f)

data['registered_banks'] = ["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Bank of Baroda", "Punjab National Bank", "Canara Bank", "Union Bank of India", "IndusInd Bank", "Yes Bank"]
data['registered_nbfcs'] = ["Bajaj Finance Ltd", "Muthoot Finance", "Cholamandalam Investment and Finance Company", "Mahindra & Mahindra Financial Services", "Shriram Finance", "Tata Capital Financial Services", "Aditya Birla Finance", "L&T Finance"]

with open('agents/fraud_guard/data/rbi_nbfc_list.json', 'w') as f:
    json.dump(data, f, indent=2)
