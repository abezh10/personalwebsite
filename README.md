# Abraham Zhong · personal site

My personal website, built as a pixel-art desktop. Projects open as windows, a Photo Viewer plays clips of my builds, there's a screensaver, and a raccoon lives in the Recycle Bin. I study Electrical Engineering and Computer Science at Stanford and build robots that see and work in the real world.

**Stack:** [Astro](https://astro.build) (static output) · plain JavaScript, no UI framework · self-hosted fonts via [Fontsource](https://fontsource.org) · hosted on [Vercel](https://vercel.com)

## Run it locally

Needs Node 22.23 or newer.

```bash
npm install
npm run dev       # http://localhost:4321, reloads as you edit
npm run build     # production build into dist/
npm run preview   # serve dist/ to check the build
```

## Where things live

```
src/
  pages/index.astro          home page (the desktop)
  pages/projects/*.astro     one page per project: photos, then write-up
  pages/404.astro            blue-screen "page not found"
  layouts/ProjectLayout.astro  window frame, back links and meta tags for project pages
  components/SiteHead.astro  tags, fonts and styles every page shares
  scripts/home.js            desktop behavior: scene, windows, Photo Viewer, bunnies, raccoon, screensaver
  scripts/project.js         project pages: Esc / back returns to where you were on the desktop
  styles/global.css          all styles
public/
  media/                     web-sized photos and videos, served at /media/...
  sprites/                   pixel-art sprite sheets
scripts/optimize-media.sh    turns raw photos and videos into the files in public/media
```

## Adding photos or videos

Raw phone files go in `images/`. That folder is never committed: the files are huge and carry GPS location data.

1. Put the original in `images/<project>/`.
2. Add a line to the `MEDIA` list in `scripts/optimize-media.sh`, for example `gallery tars/full-tars  tars/fullTars.jpeg`.
3. Run `npm run media`. It needs `brew install webp ffmpeg`. It writes resized, metadata-free copies to `public/media/`.
4. On the project page, copy an existing `<figure>` line and point it at the new file.

## Adding a project

1. Copy a page in `src/pages/projects/` and rename it. The filename becomes the URL (`voron.astro` → `/projects/voron`).
2. Set `slug`, `windowTitle`, `title` and `description` at the top, then fill in the photos.
3. Add a tile for it in the `#projects` section of `src/pages/index.astro`.

## Deploying

Vercel detects Astro automatically and redeploys on every push to `main`. `vercel.json` adds:
- clean URLs (`/projects/tars`, no `.html`)
- security headers
- one-year caching for the fingerprinted files in `/_astro/`

## Speed: static HTML → Astro

Median of 5 headless Chrome loads per case. Phone = 4G (150 ms latency, 1.6 Mbps) with a 4× slower CPU.

| | Before | Astro | Faster |
|---|---|---|---|
| Phone, first visit: text in its final fonts | 1.48 s | 0.97 s | 1.5× |
| Phone, repeat visit: first paint | 0.45 s | 0.28 s | 1.6× |
| Phone, opening a project page | 0.53 s | 0.24 s | 2.2× |
| Desktop, first visit: first paint | 0.28 s | 0.14 s | 2.0× |
| Desktop, opening a project page | 0.20 s | 0.09 s | 2.1× |

Where the gains came from:
- **Self-hosted fonts:** no extra connections to Google Fonts.
- **Smaller HTML:** 3.9 KB instead of 19.9 KB, because the JavaScript moved to a separate file.
- **Long caching:** CSS and JS are cached for a year.
- **Prefetching:** project pages load in the background while their tiles are on screen.
