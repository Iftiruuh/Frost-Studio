# Frost Studio — Final Order Management Version

## Customer website
- Menu with + / − quantities
- One cart/checkout form
- Pickup or delivery
- Reference image upload
- Manual bKash details
- WhatsApp customer support
- Customer order tracking at `/track.html`

## Owner dashboard
Open `/admin.html`.

Features:
- Search/filter orders
- Full order history
- `Yes, I received` confirmation
- Preparing / Ready / Completed / Cancelled statuses
- Manual bKash verification/rejection
- One-click WhatsApp customer update with a pre-written message
- Copy complete order details
- Status history timestamps
- Download JSON backup
- Restore JSON backup

## Data persistence
Railway should keep:
- `STORAGE_ROOT=/app/storage`
- a persistent Railway volume mounted at `/app/storage`

This keeps order data and uploaded reference images across deployments.

## Customer notifications
The dashboard can open a prepared WhatsApp message to the customer's checkout phone number.

Automatic WhatsApp sending requires an official WhatsApp Business API setup.
Automatic Facebook Messenger notifications require a Facebook Page / Messenger API setup and customer messaging permission.

## Backup
Use `Download Backup` regularly from the owner dashboard.
To restore after an issue, use `Restore Backup` and select the JSON backup file.

## Important security
Never request or store customer bKash PINs, OTPs, or passwords.
Keep the Railway `ADMIN_KEY` private.
