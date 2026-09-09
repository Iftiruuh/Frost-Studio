# Frost Studio — Customer Order System

This is the working customer-order version of the Frost Studio website.

## Customer flow

1. Browse the menu.
2. Click **Add to Order** on any cake, brownie, or donut.
3. Increase/decrease quantity.
4. Enter name, mobile number, required date/time.
5. Choose pickup or delivery.
6. Add a cake message and custom instructions.
7. Optionally upload one reference image (maximum 5 MB).
8. Submit the order request.
9. Receive a Frost Studio order number such as `FS-260910-1234`.

Menu prices are re-checked by the server so customers cannot change prices in the browser.

## Pickup address

148 No. Distillery Road, Katherpul, Dhaka 1100

## Delivery

Delivery charge is not invented or automatically added. Frost Studio confirms the delivery charge separately based on the customer's location.

## Owner dashboard

Open:

`/admin.html`

The dashboard asks for the `ADMIN_KEY` configured in `.env`.

It displays:
- order number
- customer name and phone
- requested date/time
- pickup/delivery
- ordered products and quantities
- menu subtotal
- cake message
- custom instructions
- uploaded reference image

## Run locally

1. Install Node.js 18 or later.
2. Open this project folder in Terminal.
3. Run:

   npm install

4. Copy `.env.example` to `.env`.
5. Change `ADMIN_KEY` to a private value.
6. Run:

   npm start

7. Customer website:
   http://localhost:3000

8. Owner dashboard:
   http://localhost:3000/admin.html

## Important before public launch

This version saves orders to `data/orders.json` and reference images to `uploads/`.

For a small first launch on a normal persistent Node server this can work. For a larger or serverless deployment, move orders and uploads to a managed database/storage service.

## Facebook

Facebook buttons remain placeholders until Frost Studio's Facebook page is created. Once the page URL exists, replace the placeholder links with the real Facebook/Messenger URL.

## bKash

bKash remains intentionally inactive until Frost Studio has an official bKash Merchant setup/API credentials.

The website must never ask customers for their bKash PIN or OTP.


## Railway-ready deployment

This package is configured to use a single persistent storage root.

Set these Railway variables:

- `ADMIN_KEY` = your private owner-dashboard key
- `STORAGE_ROOT` = `/app/storage`

Then attach one Railway volume at:

`/app/storage`

Both orders and customer reference-image uploads will be stored underneath that volume.
See `DEPLOYMENT_GUIDE.txt` for beginner step-by-step instructions.


## Temporary manual bKash payment

Receiving number shown to customers: `01712108397`

The customer pays only after the order is confirmed, then submits:
- Frost Studio order number
- paying bKash number
- amount
- TrxID

The owner dashboard displays the submission as `Awaiting verification`.

This is a manual workflow, not an automated bKash gateway.
Never ask customers for their bKash PIN, OTP, or password.
