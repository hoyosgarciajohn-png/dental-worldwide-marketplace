# Design notes (SonrisaConnect v2)

Layout reference: https://transformationalresonance.com/ (the owner's own project). Only layout patterns were borrowed. No text, imagery or branding was copied.

## What was taken from the reference
- **Section rhythm.** The reference alternates light, white and deep-navy sections and ends with FAQ and footer. v2 follows the same flow: hero, trust strip, white "How it works", light cost comparison, image quote band, white featured practices, light cities, white technology split, dark patient stories, light FAQ, image CTA, dark footer.
- **Hero.** A full-bleed, cinematic image with text on the quiet left side, an uppercase letter-spaced eyebrow, a large serif headline with one highlighted word, a short lead paragraph and a clear action row. v2 uses a left-to-right navy overlay on desktop and a top-to-bottom overlay on mobile, with the image on top and the text below it, as the reference stacks its art above the copy on small screens.
- **Typography.** Georgia serif for H1/H2 with tight tracking, paired with a clean sans-serif for body text and UI. Small uppercase "eyebrow" labels above every section title.
- **Cards.** Large 18-24px radii, soft low-contrast shadows, generous padding, and a small lift on hover.
- **Thesis band.** The reference's full-width image band with one large centered serif quote becomes a statement band over the team photo.
- **Numbered method.** The reference's "Notice. Choose. Act. Refine." steps become the four-step "How it works" cards with number badges.
- **Image treatment.** Rounded corners, darkened overlays whenever text sits on a photo, quiet areas of the image kept free for text.
- **Nav and footer.** A slim top bar above a sticky, translucent header, then a multi-column footer with a disclosure note. Sections use generous 96px vertical padding (64px on mobile) and a 1160px content width.

## Palette decision
The reference is built on deep navy (#071832) with cyan and gold accents. SonrisaConnect keeps its **teal (#0fa3a3) and navy (#0b2545)** palette. The only refinements are a darker "night" navy (#061a33) for the top bar, bands and footer, a light teal (#8be3e0) for text on dark backgrounds, and a restrained **gold (#f4c66a)** for stars and key savings numbers, borrowed from the reference's gold accents.

## Motion
Scroll fade-in uses IntersectionObserver with a CSS transition. The cost bars animate to their width when they scroll into view. Hover effects are card lift and image zoom. Everything is disabled under `prefers-reduced-motion`, and content stays visible if JavaScript is off.
