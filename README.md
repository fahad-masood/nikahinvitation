# Fahad & Rahnuma — The Nikah Ceremony

A static Astro invitation for Thursday, **12 November 2026, 6:00 PM IST**, at **Aman Park, New Delhi, India**. Content is prerendered HTML, with no browser JavaScript. There is no backend, analytics, map embed, hydration, or third-party font request.

## Development

Use Node **22.12+** (Node 24 recommended) and npm. In this existing checkout:

```sh
npm ci
npm run dev
```

The development server uses port 4321 by default. Each cloud task is already isolated; use the existing checkout without creating a Git worktree unless explicitly requested. The npm cache uses `/tmp/nikah-npm-cache` so installation works in this cloud workspace.

```sh
npm run build
npm test
npm run preview
```

`npm test` validates the actual production HTML, event details, Quran verses, calendar, preview, font files, and static delivery. Build before testing. Calendar downloads work without JavaScript; the event starts at 18:00 Asia/Kolkata (12:30 UTC), with no unspecified end time. The guest controls are Get Directions and Add to Calendar.

## Deploy

Import this repository into **Vercel** or **Netlify**. Configuration is included: build command `npm run build`, publish directory `dist`, Node 24 recommended. No server adapter is required. Alternatively upload `dist/` to any static HTTPS host that serves `.ics` as `text/calendar` and applies the supplied cache headers.

Set **`SITE_URL` to the final HTTPS origin** in the host's environment settings before the production build, especially when using a custom domain. Netlify's `URL` and Vercel's `VERCEL_PROJECT_PRODUCTION_URL` are detected automatically when `SITE_URL` is absent. Local builds deliberately omit an invented canonical domain. The configured origin makes `og:url`, the 1200×630 preview image, and canonical metadata absolute. Rebuild after setting or changing the domain.

Before sending invitations, open the live page on a phone, download the calendar, test Maps, and verify that `/social-preview.png` is publicly fetchable by the preview crawler. WhatsApp may cache previous previews when guests send the website link. The page requests `noindex, nofollow, noarchive` for private distribution; those settings do not provide access authentication. No deployment or public URL is assumed by the source.

## Shared visual identity

The self-contained design kit for a separately implemented companion invitation is:

- `src/styles/theme.css`: the exact six colors, serif/sans/Arabic typography, spacing, and borders.
- `src/styles/invitation.css`: masthead, hero composition, date arch, detail rows, venue, blessing, closing, controls, and responsive/motion rules.
- `src/components/{Arch,Botanical,Ornament,Icon}.astro`: shared decorative and control components.
- `public/fonts/`: optimized, licensed Cormorant Garamond, Inter, and Amiri fonts.
- `scripts/generate-social.mjs`: matching social artwork composition.

Copy these files together to preserve the visual identity and layout; replace only that invitation's content and event data. No companion page or event is included here. The Arabic font is intentionally subset to the Bismillah and both Quran verses, including joined forms and diacritics; regenerate it with `scripts/subset-arabic.py` if adding Arabic text.

## Quran verses

Surah Ar-Rum **30:21** speaks of tranquility, affection, and mercy between spouses. Surah Al-Furqan **25:74** includes a prayer for spouses and offspring. Both are presented with complete Arabic text, Sahih International English translations, and linked Quran references. The family's original prayer and invitation prose remain outside the Quran quotations.

The static text in `src/data/quran-verses.json` was checked against the published `quran-json@3.1.2` data: its Uthmani Arabic is sourced from the Noble Qur'an Encyclopedia, and its English translation is sourced from Tanzil's Sahih International text. Terminal punctuation was restored where the packaged English text omitted it. Source data attribution: [Risan Bagja Pradana / quran-json](https://github.com/risan/quran-json), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). No Quran API is called by the page.

The committed preview is deployable as-is. To regenerate it after a visual change, run `node scripts/generate-social.mjs` with a local Chromium executable (`CHROME_BIN` can specify its path). Chromium is not needed for application installation or builds.

## Verification

The production page was inspected in Chromium at 320, 360, 375, 390, 430, 768, and 1440 pixels, including JavaScript-disabled content, Arabic rendering, and the absence of sharing controls. The original version measured Lighthouse mobile Performance 100, LCP 1.5 seconds, and CLS 0.001; the page now has no client JavaScript. These are local lab measurements; live-host latency and guest devices can differ. Search indexing is intentionally disabled, so the SEO category is not a readiness target.
