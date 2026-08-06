# Email / SMTP setup (CultScribe)

When you switch from the **demo payment gateway** to a real gateway (Razorpay / Stripe), paid orders should automatically email:

1. **Customer** — order + delivery details confirmation  
2. **Delivery agency** — dispatch / shipping details  
3. **Customer** — shipped notice (admin marks shipped)  
4. **Customer** — delivered confirmation (admin marks delivered)

## Where to configure

Edit project root **`.env`** (same folder as `package.json`):

```env
# SMTP (required for real email sends)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="CultScribe <your-email@gmail.com>"

# Default delivery partner (used on every paid order)
DELIVERY_AGENCY_NAME=Your Courier Partner
DELIVERY_AGENCY_EMAIL=dispatch@your-courier.com
```

Code that reads this:

| File | Role |
|------|------|
| `lib/email/config.ts` | Loads SMTP + agency env vars |
| `lib/email/mailer.ts` | Sends mail with nodemailer (skips if SMTP missing) |
| `lib/email/templates.ts` | Email HTML/text templates |
| `lib/email/order-notifications.ts` | Triggers mails on paid / shipped / delivered |
| `app/api/payments/demo/route.ts` | Calls customer + agency emails after demo pay |
| `app/api/admin/orders/[id]/route.ts` | Admin fulfillment updates + emails |

Admin UI: **Purchases** shows customer data, delivery fields, fulfillment status, and **email log** from MongoDB.

## Behaviour without SMTP

If `SMTP_*` is not set, emails are **skipped** (logged in the order `emailLog` in MongoDB). Checkout still works in demo mode.

## Gmail tip

Use an [App Password](https://support.google.com/accounts/answer/185833), not your normal Gmail password.
