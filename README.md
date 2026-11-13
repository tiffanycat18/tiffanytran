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
| `main.js` | INDEX menu toggle and the ABOUT highlight |
| `assets/` | Put your images here |

## Swapping in real content

- **Signature:** save the handwritten signature as `assets/signature.png`, ideally a transparent PNG. Until that file exists, a cursive font shows "Tiffany Tran" in its place.
- **Project images:** in each `<figure class="project__media placeholder">`, replace the `<span>` with
  `<img src="assets/project-01.jpg" alt="…">`. Images keep their original shape and are never cropped; export them with the long side around 2000px.
- **Portrait:** do the same inside `<figure class="about__portrait placeholder">`.
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
