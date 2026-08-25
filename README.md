# Victory Wrestling static website

This is a static HTML/CSS site that can be uploaded to GoDaddy/cPanel hosting or any free static host.

Files to upload:
- index.html
- style.css
- api/subscribe.js
- assets/victory-v-logo.png

Email list form:
- The signup form posts to `/api/subscribe`.
- On Vercel, add environment variable `HUBSPOT_ACCESS_TOKEN` with the Victory Wrestling HubSpot private app token.
- Optional: set `HUBSPOT_LIST_ID`; default is `14` for `Victory Wrestling - General Mailing List`.
