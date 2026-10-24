# Kopi Lokal — UMKM Mini Store

A React + Vite portfolio project for a fictional Indonesian specialty coffee brand. Includes a responsive catalog, search and filters, product details, a persistent cart, and WhatsApp checkout.

## Requirements
- Node.js 18+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite.

## Production build
```bash
npm run build
npm run preview
```

## Configure WhatsApp
Open `src/config.js` and replace `WHATSAPP_NUMBER` with the merchant's WhatsApp number in international digits-only format (for Indonesia, start with `62`, omit `+`, spaces, and punctuation). The current placeholder is intentionally not a real business number.

## Features
- Home, shop, product detail, cart, about, and not-found routes
- Search, category and roast filters, sorting
- Grind options and stock-aware quantity controls
- Cart context with localStorage persistence
- Customer name/address validation and encoded WhatsApp order message
- Responsive layouts, accessible labels, empty states, and basic metadata

## Important limitations
This is a frontend demo using fictional products and sample stock. It does not process payments, reserve stock, calculate shipping, authenticate users, or store orders in a backend. The customer sends the prefilled WhatsApp message manually; the merchant must confirm availability, delivery, and payment. Replace all sample copy, imagery, prices, and business details before use by a real client.

## Portfolio case study
When presenting this project, explain the customer problem, design decisions, cart state model, validation, responsive behavior, and limitations. Add your own screenshots and deployed URL after publishing.


## QRIS payments + live store order queue (Midtrans sandbox)

This project now includes a Node/Express backend, dynamic QRIS checkout, a verified Midtrans notification endpoint, a PostgreSQL-backed order store (with JSON demo fallback), sales analytics, store location/map, WhatsApp contact links, and a staff dashboard at `/admin/orders` that refreshes every 4 seconds. This is a portfolio/demo implementation, not a production-certified POS system.

### Setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and fill in your **Midtrans Sandbox** Server Key and Client Key from your merchant dashboard. Keep the Server Key private and never place it in React/client code.
3. Change `ADMIN_TOKEN` to a long, random secret.
4. Create a PostgreSQL database named `kopi_lokal`, then set `DATABASE_URL` in `.env`. The server creates the `store_orders` table on startup. If `DATABASE_URL` is omitted, the app uses local JSON demo storage instead (not recommended for deployment).
5. Run `npm install`.
6. Run `npm run dev:full` to start Vite and the API server.
6. Open the Vite URL printed in the terminal. The API runs on `http://localhost:4242`.
7. Configure Midtrans Payment Notification URL to `https://YOUR-PUBLIC-HTTPS-HOST/api/midtrans/notification`. For local testing, expose port 4242 through a trusted tunnel such as ngrok. Keep the account in Sandbox mode.
7. Open `/admin/orders` in the same Vite origin and enter your `ADMIN_TOKEN`. The dashboard shows paid revenue, this month's revenue, paid/pending order counts, seven-day sales, best-selling products, and customer orders.

### Test flow

- Place a test order and scan the QRIS code using the sandbox/test flow documented by Midtrans. Do not use real funds while in Sandbox.
- The backend only marks an order paid after validating the Midtrans `signature_key`, matching the amount, and receiving a successful transaction status (`settlement`, or accepted `capture`).
- The staff dashboard polls for new orders every four seconds. Paid orders appear with status `new`; staff can move them to `preparing`, `ready`, or `completed`.

### Important limitations before going live

- The default mode is Sandbox. Live payments require merchant onboarding, QRIS activation, production credentials, and a public HTTPS deployment configured in the Midtrans dashboard. Availability/approval is determined by the provider.
- PostgreSQL mode persists orders in the `store_orders` table. JSON fallback is for local demos only. Before production, add stronger transactional order operations, idempotent webhook handling, inventory reservation, audit logs, backups, and role-based admin authentication.
- Add server-side rate limiting, CSRF/origin protections where applicable, HTTPS, proper customer-data retention rules, and robust logging before production.
- Shipping fees are not included in the total yet. Current product data is fictional sample content; verify actual prices, stock, tax, and delivery rules before accepting real orders.
- Never mark an order paid from a browser action or screenshot. Payment status must come from a verified provider notification or server-side status verification.
- The admin token is a minimal demo gate, not a substitute for proper staff accounts and sessions.

### Store location and WhatsApp

- Update `STORE_ADDRESS`, `STORE_HOURS`, and `WHATSAPP_NUMBER` in `src/config.js`. The footer includes an embedded Google Map, a Google Maps directions link, and a WhatsApp contact link. Replace the demo address before deployment.
- In the order dashboard, each order has a WhatsApp link to contact the buyer using the phone number entered at checkout. Confirm that buyers enter a WhatsApp-capable number.
- Sales reports only count orders whose verified Midtrans payment status is `paid`; pending payments are not counted as revenue.
