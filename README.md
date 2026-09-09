# Frost Studio — Final Website

This is the clean final Frost Studio website package.

## Final GitHub structure

Frost-Studio/
├── package.json
├── server.js
├── README.md
├── public/
│   ├── index.html
│   ├── admin.html
│   └── frost-studio-logo.jpeg
└── data/
    └── orders.json

Total: 7 files.

## Customer flow

Menu → + / − quantity → View Cart → one Checkout form → customer details →
pickup/delivery → cake instructions/reference image → bKash details → Submit Order

There is only ONE submission form.

## bKash

Temporary manual bKash number shown on the website:

01712 108397

The customer submits:
- paying bKash number
- amount paid
- TrxID

The payment is stored as Awaiting verification until Frost Studio checks it manually.

The website never asks for a bKash PIN, OTP, or password.

## Pickup

148 No. Distillery Road, Katherpul, Dhaka 1100

## Owner dashboard

Open:

/admin.html

Use the ADMIN_KEY already configured in Railway.

## Railway

Keep these Railway variables:

ADMIN_KEY = your private owner key
STORAGE_ROOT = /app/storage

Keep the Railway volume mounted at:

/app/storage

## Updating GitHub

For the cleanest repository, remove old duplicate/root copies and old update-guide files,
then upload the seven files in this package in the exact folder structure shown above.

Railway should redeploy automatically after the GitHub commit.


## Customer support

The website includes:
- WhatsApp support button using 01975 108397
- pre-filled WhatsApp support message
- dedicated Customer Support section
- floating WhatsApp chat button on every page position
- Facebook support placeholder ready for the future Frost Studio Facebook page

When the Facebook page is created, replace the placeholder Facebook URL with the real page/Messenger link.
