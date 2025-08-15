# Proximity Deals (Frontend MVP)

Referral-only, coupon-driven social commerce app with a proximity-based discovery model.

## Tech
- HTML + Tailwind (CDN: `@tailwindcss/browser@4`)
- Vanilla JS modules
- Responsive, light/dark mode
- Logos: `assets/logos/logoipsum-395.svg` (with name) and `logoipsum-396.svg` (mark)

## Pages
- `index.html` — Feed (proximity + distance sorted), flagging, quick redeem
- `create.html` — Create/Edit Coupon (Offer/Service)
- `scan.html` — Scan QR via `BarcodeDetector` (fallback: paste JSON payload)
- `profile.html` — Proximity breakdown (creator-centric)
- `preferences.html` — Backup/export/import JSON, auto-save (local), dark mode
- `help.html` — How it works + FAQs
- `auth.html` — Demo sign-in stub

## Data
Local-only via `localStorage` (see `js/store.js`). Structure mirrors backend entities:
- users, me, coupons, redemptions, flags, charges, referrals

## Proximity
Client-side mirror of approved weights:
- +1.0 × lifetime unique redeemers
- +0.5 × redemptions in rolling 7 days
- +2.0 × successful referrals

Idle-day decay is a backend concern; not simulated beyond UI hints.

## Run
Open `index.html` in a browser (or serve via any static server).

## Backup
Preferences → Export JSON to save all app data. Import to restore. Auto-save stores a snapshot into localStorage every 15s.

## Visual Checklist
- **Core visuals & branding**: light background, blue/sly accents, SVG logos tinted via `currentColor` (class `logo-color`)
- **Layout & structure**: grid cards, rounded-2xl, soft shadows, spacing with Tailwind; mobile-first; dark mode supported
