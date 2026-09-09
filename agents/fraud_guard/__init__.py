"""
Fraud Guard - UPI Fraud Detection Engine for Gig Workers

Owns:
- Real-time and async fraud pattern detection on UPI transactions
- Cross-references RBI registered lender whitelist / SEBI whitelist
- Never asks for UPI PIN or OTP - warns user explicitly if anyone else does
- Runs anomaly detection on transaction patterns using ground-truth labels
- Labels suspicious transactions for user review

HARD RULE (non-negotiable):
NEVER ask the user for their UPI PIN or OTP.
If a message from any source (including this system) contains "enter your PIN" or 
"share your OTP", surface an immediate fraud alert regardless of source.
"""

__version__ = "1.0.0"
__author__ = "Amit - nitisaathi Team"

# Critical security constant
NEVER_ASK_FOR_PIN_OR_OTP = True
