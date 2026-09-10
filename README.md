# Frost Studio — FINAL ROOT-LAYOUT FIX

This version matches the CURRENT GitHub repository layout.

Keep these 8 files directly on the main GitHub page:

- package.json
- server.js
- README.md
- index.html
- admin.html
- track.html
- frost-studio-logo.jpeg
- orders.json

No `public` folder is required for this version.

## Railway settings

Keep:
- `ADMIN_KEY` = your private owner key
- `STORAGE_ROOT` = `/app/storage`

Keep the Railway persistent volume mounted at:
- `/app/storage`

## Website addresses

Customer site:
`https://frost-studio-production.up.railway.app/`

Owner dashboard:
`https://frost-studio-production.up.railway.app/admin.html`

Customer tracking:
`https://frost-studio-production.up.railway.app/track.html`

## Important

Live order data is stored in the Railway persistent volume, not in the root
`orders.json` file. Do not remove the Railway volume.

The server intentionally serves only the website HTML files and logo. It does
not expose server.js, package.json, README.md, or orders.json publicly.
