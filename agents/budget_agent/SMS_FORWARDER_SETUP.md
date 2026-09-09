# SMS Forwarder Setup Guide

This guide connects your Android phone's bank SMS to NitiSaathi automatically.
Every transaction SMS gets parsed and classified in real time — no manual entry needed.

---

## How It Works

```
Bank sends SMS → Android Forwarder App → POST /api/realtime/sms/forward → NitiSaathi classifies → Dashboard updates
```

Debits trigger the classification modal. Credits (Swiggy/Ola payouts, transfers received) also create pending events so you can confirm the income source.

---

## Step 1 — Get the Forwarder App

Install **SMS Forwarder** (open source, no ads):
- Play Store: search "SMS to Webhook" or use [SMS Forwarder by Bogdan](https://play.google.com/store/apps/details?id=com.bogkonstantin.smswebhook)
- Or sideload the APK from: https://github.com/bogkonstantin/android_income_sms_gateway_webhook

> Any app that can POST raw SMS text to a webhook URL will work.

---

## Step 2 — Configure the App

Set the following in the forwarder app:

| Field | Value |
|-------|-------|
| Webhook URL | `https://YOUR_SERVER/api/realtime/sms/forward` |
| Method | `POST` |
| Content-Type | `application/json` |
| Custom Header | `X-SMS-Forward-Secret: YOUR_SECRET` |

**Body template** (JSON):
```json
{
  "sms_text": "%body%",
  "sender": "%from%",
  "provider": "bank_sms",
  "user_email": "your@email.com",
  "received_at": "%date%"
}
```

Replace `%body%`, `%from%`, `%date%` with your app's variable placeholders (they vary by app).

---

## Step 3 — Set Your Secret

In your backend `.env` file:
```
SMS_FORWARD_SECRET=choose-a-strong-random-secret
SMS_FORWARD_DEFAULT_USER_EMAIL=your@email.com
```

Restart the backend after updating `.env`.

---

## Step 4 — Filter to Bank SMS Only (Recommended)

In the forwarder app, add a sender filter so only bank/UPI SMS are forwarded:

**Sender ID patterns to include:**
```
HDFCBK, SBIINB, ICICIB, AXISBK, KOTAKB, PNBSMS,
PAYTM, PHONEPE, GPAY, AMAZONPAY, BHIMUPI,
SWIGGY, ZOMATO, OLAMONY, UBERIND
```

This prevents OTPs or promo SMS from being sent unnecessarily.

---

## Step 5 — Test It

Send a test request manually to confirm the connection:

```bash
curl -X POST https://YOUR_SERVER/api/realtime/sms/forward \
  -H "Content-Type: application/json" \
  -H "X-SMS-Forward-Secret: YOUR_SECRET" \
  -d '{
    "sms_text": "Rs.500.00 debited from HDFC Bank A/C X1234 to swiggy@icici on 15-Jan-2024. Avl Bal:Rs.4,500.00",
    "sender": "HDFCBK",
    "provider": "bank_sms",
    "user_email": "your@email.com"
  }'
```

Expected response:
```json
{
  "status": "pending_classification",
  "event_id": 1,
  "suggested_categories": ["food", "discretionary", ...],
  "predicted_category": "food",
  "parsed": {
    "amount": 500.0,
    "merchant": "Swiggy",
    "direction": "debit",
    "bank": "HDFC Bank",
    "balance": 4500.0
  }
}
```

---

## What Gets Parsed Automatically

| Field | Example |
|-------|---------|
| Amount | ₹500, Rs.1,200.00, INR 750 |
| Direction | debit / credit |
| Merchant | Swiggy, Reliance Petrol, ZOMATO |
| Balance | Avl Bal: ₹4,500 |
| Bank | HDFC Bank, SBI, PhonePe |
| UPI Ref | UPI ref no: 123456789012 |
| Account last 4 | A/c XXXX1234 |
| Date | 15 Jan 2024, 15-01-2024, 2024-01-15 |

## Supported Banks & Apps

Debits and credits from: HDFC, SBI, ICICI, Axis, Kotak, PNB, Bank of Baroda,
Canara, IndusInd, Yes Bank, Union Bank, PhonePe, Google Pay, Paytm, Amazon Pay, BHIM.

Gig platform credits from: Swiggy, Zomato, Ola, Uber, Rapido, Dunzo, Blinkit.

---

## Security Notes

- Keep `SMS_FORWARD_SECRET` private — anyone with it can post transactions to your account
- Use HTTPS in production — never send SMS over plain HTTP
- The forwarder app only needs SMS read permission, not internet of your banking apps
