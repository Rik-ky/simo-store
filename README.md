# SIMO® — art store

A static storefront for SIMO, laid out like kal-store.com. Orders are sent to WhatsApp (+234 703 850 0490).

## Run locally
```
python3 -m http.server 8765   # open http://localhost:8765
```

## Deploy
This is plain HTML, CSS and JS, so it runs on any static host: drag the folder into Netlify Drop, or use Vercel, GitHub Pages or Cloudflare Pages.

## Edit
- `data.js`: artwork names and blurbs, products, prices (₦), sizes, WhatsApp number.
- `assets/art/`: the original artworks.
- `assets/products/<product>-<artwork>.jpg`: one mockup per product/artwork pair (66 total).
- `assets/hero.mp4`: the homepage video.

## Mockups
15 mockups were made with AI image generation (all August Meeting items, plus some calendars and totes).
The other 51 were built by `tools/composite.py`, which puts each artwork into those AI mockups.
To replace any mockup, save an image to `assets/products/<product>-<artwork>.jpg`.

## How ordering works
Cart → checkout form (name, email, address, optional phone and note) → WhatsApp opens with the order already written,
addressed to +234 703 850 0490 → the customer taps **Send**. No card payment happens on the site.

## Hosting on Cloudflare Workers (free)
`wrangler.jsonc` serves this folder as static assets (`.assetsignore` keeps tools and README out).
- CLI: `npx wrangler login` then `npx wrangler deploy` → https://simo-store.<your-subdomain>.workers.dev
- Git: Cloudflare dashboard → Workers & Pages → Create → Import a repository → pick this repo. Leave the build command empty, set the deploy command to `npx wrangler deploy`.
