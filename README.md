# SonrisaConnect: Dental Tourism Marketplace Prototype

A static, clickable prototype that connects US patients with Colombian dental practices. It uses plain HTML, CSS and vanilla JS, with no backend and no build step. All mock data lives in `app.js`. Images load from picsum.photos (online only) and fonts from Google Fonts. Everything else works offline.

## Run locally
- Open `index.html` in a browser, **or**
- Run `python3 -m http.server 8000` in this folder and visit http://localhost:8000

## Deploy to GitHub Pages
1. Create a new public repo on GitHub (e.g. `dental-marketplace`).
2. `git remote add origin https://github.com/<you>/dental-marketplace.git`
3. `git push -u origin main`
4. On the repo, go to **Settings > Pages > Build and deployment > Source: Deploy from a branch**, pick **main** and **/ (root)**, then click Save.
5. After about a minute the site is live at `https://<you>.github.io/dental-marketplace/`. All links are relative, so it works under that subpath.

## Files
```
index.html          Landing: hero, treatment+city search, stat cards
directory.html      Practice cards with live filters
practice.html       Profile (?id=1..8): credentials, gallery, price list, reviews
upload.html         Record upload (?id=): photos with previews, docs, message, validation
quote.html          Mock quote (?id=): plan, itemized prices, JS total, booking/message modals
for-practices.html  Pitch and mock application form for clinics
help.html           FAQ
signin.html         Mock sign in
styles.css          Teal/navy responsive styles (mobile breakpoint 820px)
app.js              ALL mock data (8 practices) and page logic
```

## Demo walkthrough
1. **Landing:** pick "Implants" + "Medellín", then click Search.
2. **Directory:** filters come pre-applied. Toggle checkboxes, drag the price slider, change the city, or reset. Set a low price to see the empty state.
3. **Profile:** click View Profile to see credentials, the gallery, the USD price table and reviews.
4. **Upload:** click Upload Records and submit empty to see validation. Add photos to see thumbnails, fill in the form and submit to reach the success screen, then click View my quote.
5. **Quote:** see the itemized plan and the computed total with US savings. Accept & Book opens a confirmation, and Ask a Question opens a message modal.
6. The hamburger menu appears below 820px wide. For Practices, Help and Sign In are simple mock pages.
