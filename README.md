# SonrisaConnect: Dental Tourism Marketplace Prototype

A static, clickable prototype that connects US patients with Colombian dental practices. It uses plain HTML, CSS and vanilla JS, with no backend and no build step. All mock data lives in `app.js`. All images are local files in the `images/` folder (AI-generated, no text in them), so the site works offline. Only the Google Fonts stylesheet needs a connection; it falls back to system fonts.

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
index.html          Landing: full-bleed hero + search, trust strip, how it works, cost comparison, featured practices, cities, testimonials, FAQ
directory.html      Practice cards with live filters
practice.html       Profile (?id=1..8): credentials, gallery, price list, reviews
upload.html         Record upload (?id=): photos with previews, docs, message, validation
quote.html          Mock quote (?id=): plan, itemized prices, JS total, booking/message modals
for-practices.html  Hero, benefits, how listing works and mock application form for clinics
help.html           FAQ
signin.html         Mock sign in
styles.css          Teal/navy responsive styles (breakpoints 980px, 820px, 560px)
app.js              ALL mock data (8 practices, cities) and page logic
images/             27 optimized .jpg photos (heroes, practices, cities, patients)
favicon.svg         Site icon
DESIGN_NOTES.md     Layout reference notes
```

## Demo walkthrough
1. **Landing:** pick "Implants" + "Medellín", then click Search.
2. **Directory:** filters come pre-applied. Toggle checkboxes, drag the price slider, change the city, or reset. Set a low price to see the empty state.
3. **Profile:** click View Profile to see credentials, the gallery, the USD price table and reviews.
4. **Upload:** click Upload Records and submit empty to see validation. Add photos to see thumbnails, fill in the form and submit to reach the success screen, then click View my quote.
5. **Quote:** see the itemized plan and the computed total with US savings. Accept & Book opens a confirmation, and Ask a Question opens a message modal.
6. The hamburger menu appears below 820px wide. For Practices, Help and Sign In are simple mock pages.

## What changed in v2 (redesign)
- New layout inspired by the owner's Transformational Resonance site (see `DESIGN_NOTES.md`): full-bleed hero with overlay, serif headlines, alternating light/dark sections, trust strip, quote band, richer footer.
- 27 generated photos in `images/` replace every picsum.photos URL. Each of the 8 practices has its own photo, and profile galleries mix in shared clinic photos. All images have alt text.
- Home page: How it works (4 image steps), US vs Colombia cost comparison (computed from the mock data), featured practices, featured cities with photos (link to the filtered directory), technology section, patient testimonials with photos, FAQ and a closing call to action.
- Directory, profile, upload, quote, help and sign-in pages got page banners, image-rich practice cards and a profile gallery with patient avatars on reviews. For Practices has a hero, benefit cards, a how-listing-works section and the apply form.
- Subtle hover effects and scroll fade-in animations (CSS and IntersectionObserver, disabled for reduced-motion users). Fully responsive down to 375px.
- All existing behaviour is unchanged: search to filters, filters and reset, upload validation and success screen, quote total, Accept & Book and Ask modals, mock sign-in. All links are relative.
- Headline claim changed from "up to 70%" to "70%+" because the mock prices work out to roughly 75-80% below the US figures.

## Update the live site (upload by hand)
1. Unzip `sonrisaconnect_v2.zip`.
2. In the GitHub repo, **replace all files** with the unzipped ones, **including the whole `images/` folder** (27 files). Use Add file > Upload files, drag everything in, then commit. Delete old files only if you want a clean repo; none of the old filenames changed.
3. Wait about a minute, then hard-refresh the live URL (Ctrl/Cmd+Shift+R) to clear cached CSS and JS.
