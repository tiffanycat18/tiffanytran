# Tiffany Tran — Portfolio

Static site (HTML + CSS + a little JS). There's no build step. Open `index.html` in a browser, or run:

```bash
python3 -m http.server
```

and visit http://localhost:8000.

## Files

| File | What it is |
|---|---|
| `index.html` | The page: 10 project screens, then the About section at the end |
| `styles.css` | All styles and breakpoints |
| `main.js` | INDEX menu toggle, the ABOUT highlight, and the project slideshows |
| `assets/` | Put your images and videos here |
| `assets/placeholders/video.mp4` | Stand-in video used in the empty video slots |

## Swapping in real content

- **Signature:** save the handwritten signature as `assets/signature.png`, ideally a transparent PNG. Until that file exists, a cursive font shows "Tiffany Tran" in its place.
- **Project slideshows:** each project's `<div class="carousel__stage">` holds its slides, in order. Every project starts with 10 slots: the cover image (where there is one), grey `Photo 02`… placeholders, and the stand-in video in slots 03 and 07. Replace each one with your own:

  ```html
  <img src="assets/project-01/02.jpg" alt="Short description" loading="lazy">
  <video src="assets/project-01/03.mp4" muted playsinline preload="metadata"></video>
  ```

  Add or delete lines freely; the `1/10` counter counts them for you. Photos and videos keep their own shape and are never cropped (export photos with the long side around 2000px). Save video as `.mp4` (H.264); `.mov` doesn't play in every browser. Keep the `muted` attribute: browsers only autoplay muted video, and visitors can turn sound on from the controls.
- **Portrait:** inside `<figure class="about__portrait placeholder">`, replace the `<img>` `src`.
- **Text:** edit "Project Name", "2047" and the description in each `<section class="project">`.
- **Instagram:** change `href="https://www.instagram.com/"` in the About section to your profile URL.
- **INDEX links:** the Design / Film / Photography / Gallery links are `href="#"` for now. Point them at the real pages, e.g. `href="film.html"`, once those pages exist.
- **Add or remove projects:** copy or delete a whole `<section class="project">…</section>` block.

## Responsive behaviour

| Width | Layout |
|---|---|
| ≥ 1280px | Desktop, as in the Figma frame |
| 768–1279px (tablets, iPads) | Same desktop layout, scaled down |
| < 768px (phones) | Mobile layout: the signature, ABOUT / INDEX and footer stay fixed |
| ≥ 430px | Large phones: slightly larger type |
| < 380px | Small phones: tighter spacing, and the project text stacks into one column |

On every size, each project fills one screen. ABOUT, INDEX and the © line stay fixed in place. Clicking ABOUT scrolls to the About section at the end of the page.

## How the slideshows behave

- Each project plays as a slow, looping slideshow, but only while it's on screen. After slide 10 it goes back to 1, until the visitor scrolls to the next project.
- **Click or tap the picture** for the next one. On phones, swipe left or right. With a keyboard, use the arrow keys.
- **Crossfade:** the old picture fades out and the new one fades in a beat later (1.2s in all), so they never sit on top of each other as a muddy double image. After a click it's faster (about 0.5s) so it feels responsive.
- **Timing** (set at the top of the slideshow code in `main.js`, `TIMING`):
  - Each photo stays fully visible for **5.5s** (about 6.7s per slide including the fade). Five seconds is the length people already know from Instagram Stories and most slideshow defaults; the extra half-second gives time for the caption.
  - The picture showing when a project scrolls into view stays **8s**, so there's time to read the title and description first.
  - A **video** plays to its end before moving on. Clips shorter than 5.5s play again first, so they're never skipped past.
- **Video controls:** play/pause, a timeline you can click or drag, the time, and a sound button. They appear when the mouse is over the video, and stay visible on phones and whenever the video is paused. Pausing a video holds the slideshow on it; pressing play again lets it carry on.
- **Pausing the slideshow:** clicking the `1/10` counter pauses or resumes it ("Paused" shows next to the counter). It also pauses while someone moves through it with the keyboard, and stops when the browser tab is hidden.
- **Reduced motion:** if a visitor's device is set to reduce motion, nothing moves until they click the counter to play. They can still click or tap through the pictures.
