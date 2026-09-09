import re

with open('agents/fraud_guard/services/fraud_detector.py', 'r') as f:
    content = f.read()

# Add _REGISTERED_BANKS and _REGISTERED_NBFCS
if '_REGISTERED_BANKS' not in content:
    content = content.replace(
        "_REGISTERED_BROKERS = _load_json_list('sebi_entities.json', 'registered_brokers')",
        "_REGISTERED_BROKERS = _load_json_list('sebi_entities.json', 'registered_brokers')\n_REGISTERED_BANKS = _load_json_list('rbi_nbfc_list.json', 'registered_banks')\n_REGISTERED_NBFCS = _load_json_list('rbi_nbfc_list.json', 'registered_nbfcs')"
    )

if '_REGISTERED_BANKS' in content and 'for bank in _REGISTERED_BANKS:' not in content:
    check_logic = """
        # Check registered banks
        for bank in _REGISTERED_BANKS:
            if bank.lower() in entity_lower:
                return RBILenderCheckResult(
                    entity_name=entity_name,
                    is_registered=True,
                    entity_type="Bank",
                    source="RBI Master List of Regulated Entities"
                )
                
        # Check registered NBFCs
        for nbfc in _REGISTERED_NBFCS:
            if nbfc.lower() in entity_lower:
                return RBILenderCheckResult(
                    entity_name=entity_name,
                    is_registered=True,
                    entity_type="NBFC",
                    source="RBI Master List of Regulated Entities"
                )
        
        # Check registered brokers
"""
    content = content.replace("        # Check registered brokers\n", check_logic)

with open('agents/fraud_guard/services/fraud_detector.py', 'w') as f:
    f.write(content)
