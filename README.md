# ClearCue · GitHub Pages only

Static ClearCue web app. No Python, no Render, no backend.

- Live transcript via browser tab/mic capture
- Gemini cloud speech-to-text + streaming answers from the browser
- API key, résumé, and sessions stay in `localStorage`

## Live URL

https://naveenmalapati379-design.github.io/only-github-host/

## Enable GitHub Pages (one-time)

1. Open the repo **Settings → Pages**
2. Under **Build and deployment → Source**, choose **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save, then wait 1–2 minutes for the site to publish

## Local preview

Open `index.html` from a local static server (required for AudioWorklet), e.g.:

```bash
npx --yes serve .
```

## Connect Gemini

1. Create a key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Open the live site → **AI & settings**
3. Paste the key → **Connect & load models** → **Save settings**

For browser use, do not restrict the key to server IPs only. Prefer HTTP referrer restrictions for your Pages URL if you add restrictions.

## Privacy

Audio, résumé text, and prompts are sent from your browser to Google Gemini. GitHub Pages only serves the static files.
