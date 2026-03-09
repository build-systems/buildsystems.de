# BuildSystems Website

Corporate website for [BuildSystems](https://buildsystems.de), a consultancy driving sustainable innovation in the building and real estate sector. Built with Astro and powered by Notion as a headless CMS.

## Tech Stack

- **Framework:** [Astro](https://astro.build) 5
- **Styling:** [Tailwind CSS](https://tailwindcss.com) 4 + custom CSS
- **CMS:** [Notion API](https://developers.notion.com) for blog posts, team, partners, and portfolio content
- **Image processing:** Sharp, with Astro's built-in avif/webp optimization
- **Fonts:** ABC Diatype (self-hosted, preloaded)
- **Deployment:** Cloudflare Pages

## Project Structure

```
src/
├── assets/           # Images, SVGs, logos
├── components/       # Astro components
│   ├── Notion/       # Notion block renderers (30+ block types)
│   ├── OrbitAnimation/  # Orbit animation with spring physics
│   ├── ProjectCarousel/ # Drag-to-scroll project carousel
│   └── BuildCarousel/   # Animated service carousel
├── layouts/          # BaseLayout, NotionLayout, LandingLayout
├── lib/notion/       # Notion API client, types, caching
├── pages/            # Routes
│   ├── portfolio/    # Portfolio listing + dynamic detail pages
│   └── _services/    # Service sub-pages
└── styles/           # Global CSS, fonts, syntax highlighting
```

## Pages

| Route | Description |
|---|---|
| `/` | Homepage with cover animation, carousels, team, and partners |
| `/leistungen` | Services — Strategie, Praxis, Transfer with orbit animation |
| `/portfolio` | Portfolio with project cards and detail pages |
| `/team` | Team members and partners (from Notion) |
| `/foerdertool` | Funding/grant tool |
| `/toolbox` | Toolbox |
| `/workshops` | Workshops |
| `/impressum` | Legal notice |

## Development

```bash
npm install
npm run dev        # Dev server at localhost:4321
npm run build      # Production build
npm run preview    # Preview production build
```

### Notion Cache

Blog and CMS content is fetched from Notion at build time. To manage the local cache:

```bash
npm run cache:fetch   # Fetch and cache Notion content
npm run cache:purge   # Clear cached content
```

### Environment Variables

Required in `.env`:

- `NOTION_API_SECRET` — Notion integration token
- `DATABASE_ID` — Blog posts database
- `PEOPLE_DB_ID` — Team members database
- `ORGANIZATIONS_DB_ID` — Organization logos database
- `PARTNERS_DB_ID` — Partners database

## Technical Notes

### Images

Most images use Astro's `<Picture />` tag, generating both avif and webp formats. The hero background image uses `<Image />` with multiple `srcset` entries optimized for desktop and mobile.

### Animations

**CSS-only:** The cover animation and three-pillars animations are pure CSS `@keyframes`. Notes for future SVG text animations:
- SVG `<text>` lacks text-block layout (no alignment/justification) — position lines manually with `x`/`y`.
- Safari doesn't support CSS `@keyframes` on `<foreignObject>`, and doesn't accept negative `stroke-dashoffset` values.

**OrbitAnimation:** Interactive orbit with 9 rotating service topics, spring physics easing, click-to-snap, hover pause, and JS-driven per-bullet opacity fade. Fully responsive with resize handling.

**Carousels:** Drag-to-scroll with momentum physics, smooth scroll-snap, and pointer event handling.

**WebP animations:** Used for rendered frame sequences. Non-stacking frames must be placed in `public/animations/` with manual `srcset` — Astro's optimizer stacks webp frames, causing ghosting.

### Icons & Logos

Icons use SVG sprites (`public/assets/icons.svg`). Partner logos use SVG sprites where possible, falling back to `<Image />` for raster logos.

### Fonts

Self-hosted ABC Diatype (primary) and ABC Diatype Mono (secondary), preloaded to prevent FOUT.
