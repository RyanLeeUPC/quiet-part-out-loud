# The Quiet Part Out Loud

A running archive of the tone-deaf things tech CEOs and executives say on the record. An Unpopular Culture project, hosted at **https://quietpart.upcpodcast.com**.

Plain static site: HTML, CSS, and vanilla JS. No build step. GitHub Pages serves the repo root as-is.

```
index.html              page shell
assets/css/style.css    styles, built on the Unpopular Culture design system tokens (Bone + Blackout)
assets/img/             brand assets copied from the design system (splatter texture, UPC avatar)
assets/js/app.js        loads quotes, search, topic filters, sorting, permalinks
data/quotes.json        the archive itself — the only file you edit to add quotes
CNAME                   custom domain for GitHub Pages
.nojekyll               tells Pages to skip Jekyll processing
.github/ISSUE_TEMPLATE  "Submit a quote" form for readers
```

## Adding a quote

Append an object to `data/quotes.json`:

```json
{
  "id": "speaker-topic-year",
  "quote": "Exact words as reported. Use … for cuts.",
  "speaker": "Full Name",
  "role": "Title, Company (at the time)",
  "company": "Company",
  "date": "2024-06-08",
  "venue": "Where it was said",
  "context": "One or two neutral sentences on what prompted it.",
  "aftermath": "Any apology, clarification, or consequence. Empty string if none.",
  "tags": ["ai", "labor"],
  "sources": [
    { "label": "Video", "url": "https://..." },
    { "label": "The Verge", "url": "https://..." }
  ]
}
```

- `id` must be unique; it's the permalink (`/#speaker-topic-year`).
- `date` can be `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`.
- Tags with a friendly label: `labor`, `hustle`, `privacy`, `ai`, `wealth`, `diversity`, `customers`, `layoffs`, `free-speech`, `ethics`. New tags work too and show up raw; add a label for them in `TAG_LABELS` in `assets/js/app.js`.

### Editorial rules

These are real people, so the site holds up only if every entry does.

1. **Exact wording, checked against the source.** Not a paraphrase, not a viral screenshot.
2. **At least one source link**, preferably a primary source (video, transcript, memo) plus a reputable outlet.
3. **Neutral context.** Let the quote do the work. Snark goes on the podcast.
4. **Include the aftermath.** If they apologized or clarified, say so.

## Local preview

`fetch()` doesn't work from `file://`, so serve the folder:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Deploying

1. Push to a GitHub repo, then **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root**.
2. In your DNS for `upcpodcast.com`, add a **CNAME** record: `quietpart` → `ryanleeupc.github.io`.
3. Back in **Settings → Pages**, confirm the custom domain reads `quietpart.upcpodcast.com`. Tick **Enforce HTTPS** once the certificate is issued (can take up to an hour).
4. `REPO_URL` at the top of `assets/js/app.js` points the "Submit a quote" link at `RyanLeeUPC/quiet-part-out-loud`. Update it if the repo is named differently.
