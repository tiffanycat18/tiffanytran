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

  Add or delete lines freely; the `1/10` counter counts them for you. Photos and videos keep their own shape and are never cropped (export photos with the long side around 2000px). Save video as `.mp4` (H.264); `.mov` doesn't play in every browser. Keep the `muted` attribute: browsers only autoplay video without sound.
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

- Each project plays as a slow, looping slideshow, but only while it's on screen. After the last slide it goes back to the first, until the visitor scrolls to the next project.
- **Desktop:** over the picture the cursor becomes a small hairline arrow, ← on the left half and → on the right half. Click to go back or forward. The arrow keys work too.
- **Phones:** tap the left half of the picture to go back, the right half for the next one. A tap anywhere else on that project's screen also shows the next one. Swiping left and right works too.
- **Videos** play silently with no controls, and fade into the next slide when they finish. Clicking or tapping a video changes the slide like a photo.
- **Fade:** a simple crossfade of about 1 second. The next picture fades in while the current one fades out a quarter-second behind it, so the white page doesn't flash through and the two pictures are never seen layered for long. After a click or tap it takes about 0.7s. A video only starts fading in once its first frame is ready, so it never appears as an empty box.
- **Timing** (set at the top of the slideshow code in `main.js`, `TIMING`):
  - Each photo stays fully visible for **4s**, about **5s per slide** including the fade. That's the rhythm people already know from Instagram Stories and most slideshows, quick enough that visitors notice it moves on by itself.
  - The picture showing when a project scrolls into view stays **5s**, a moment longer to start reading the title and description.
  - A video stays for as long as it runs.
- It stops when the browser tab is hidden.
- **Reduced motion:** if a visitor's device is set to reduce motion, the slideshow doesn't advance on its own; they click or tap through it instead.
