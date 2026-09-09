# Gmail SMTP Setup for PDF Report Delivery

NitiSaathi uses your Gmail account to send monthly PDF reports and on-demand
report emails. Takes about 5 minutes to set up.

---

## Step 1 — Enable 2-Factor Authentication on your Google Account

Gmail App Passwords require 2FA to be active.

1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google", click **2-Step Verification**
3. Follow the steps to enable it if not already on

---

## Step 2 — Generate a Gmail App Password

App Passwords let NitiSaathi send email without using your real Google password.

1. Go to https://myaccount.google.com/apppasswords
2. At the bottom, under "App name", type `NitiSaathi` (or anything)
3. Click **Create**
4. Google shows a 16-character password like `abcd efgh ijkl mnop`
5. **Copy it now** — Google won't show it again

> If you don't see the App Passwords option, 2FA is not enabled yet. Go back to Step 1.

---

## Step 3 — Update your `.env` file

Open `agents/budget_agent/backend/.env` and add these lines:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.gmail@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=NitiSaathi <your.gmail@gmail.com>
```

Replace:
- `your.gmail@gmail.com` with your actual Gmail address
- `abcdefghijklmnop` with the 16-character App Password (no spaces)

---

## Step 4 — Restart the Backend

```bash
# From agents/budget_agent/backend/
uvicorn app.main:app --reload
```

---

## Step 5 — Test It

Hit the API directly to confirm email works:

```bash
curl -X POST http://localhost:8000/api/reports/weekly/email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "status": "queued",
  "message": "Report will be sent to your.gmail@gmail.com. Check your inbox in a moment."
}
```

Check your inbox — you should get the PDF within 30 seconds.

---

## Troubleshooting

**"Username and Password not accepted"**
- Make sure you're using the App Password, not your Gmail login password
- Confirm 2FA is enabled on the account
- Check there are no spaces in the password value in `.env`

**"Less secure app access" error**
- This means you're trying to use your real password — use an App Password instead

**Email goes to spam**
- Add `your.gmail@gmail.com` to your contacts
- For production, switch to SendGrid or Brevo (see `.env.example` for config)

**SMTP not configured warning in logs**
- Means one of the 5 SMTP variables is empty — check all 5 are set in `.env`

---

## When Emails Are Sent Automatically

| Trigger | What gets sent |
|---------|---------------|
| 1st of every month, 2am UTC | Monthly PDF report to all users with transactions |
| `POST /api/reports/weekly/email` | On-demand PDF to the requesting user |

## Download Without Email

If you just want to download the PDF without email:

```
GET /api/reports/weekly/download
Authorization: Bearer YOUR_JWT_TOKEN
```

The PDF downloads directly in the browser. No SMTP config needed for this.
