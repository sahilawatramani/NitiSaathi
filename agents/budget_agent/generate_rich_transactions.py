import csv
from datetime import datetime, timedelta
import random

def generate_rich_data():
    merchants = {
        'Amazon India': (500, 3000),
        'Starbucks': (200, 600),
        'Uber India': (300, 800),
        'Zomato': (400, 1000),
        'BigBazaar': (2000, 5000),
        'Apollo Pharmacy': (500, 1500),
        'LIC Premium': (5000, 5000), # Constant
        'Netflix': (649, 649)
    }

    start_date = datetime(2023, 1, 1)
    transactions = []

    # Generate 12 months of data with a slight upward trend in spending
    for month in range(12):
        trend_multiplier = 1 + (month * 0.05) # Spend increases by 5% each month
        
        # Monthly fixed expenses
        transactions.append([
            (start_date + timedelta(days=month*30 + 1)).strftime("%Y-%m-%d"),
            "LIC Premium",
            5000.00,
            "Life Insurance"
        ])
        transactions.append([
            (start_date + timedelta(days=month*30 + 2)).strftime("%Y-%m-%d"),
            "Netflix",
            649.00,
            "Entertainment"
        ])

        # Variable expenses (approx 8-12 per month)
        num_txn = random.randint(8, 12)
        for _ in range(num_txn):
            merch = random.choice(list(merchants.keys())[:-2]) # Exclude the fixed ones
            min_val, max_val = merchants[merch]
            
            amount = round(random.uniform(min_val, max_val) * trend_multiplier, 2)
            day_offset = random.randint(3, 28)
            txn_date = (start_date + timedelta(days=month*30 + day_offset)).strftime("%Y-%m-%d")
            
            transactions.append([txn_date, merch, amount, f"{merch} Purchase"])

    # Sort sequentially
    transactions.sort(key=lambda x: x[0])

    with open('test_transactions_rich.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Merchant', 'Amount', 'Description'])
        writer.writerows(transactions)
        
    print(f"Generated {len(transactions)} rich transactions across 12 months in 'test_transactions_rich.csv'.")

if __name__ == "__main__":
    generate_rich_data()
