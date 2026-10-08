# Self-hosted invitation fonts

These WOFF2 files are served locally; the invitation makes no font requests to third parties. All fonts are licensed under the SIL Open Font License 1.1. The original, complete copyright notices and licenses shipped by Fontsource are included alongside these files.

| File | Family / style | Source | Size |
| --- | --- | --- | ---: |
| `cormorant-400-normal.woff2` | Cormorant Garamond, regular 400, Latin | `@fontsource/cormorant-garamond@5.3.0` | 22,876 bytes |
| `cormorant-400-italic.woff2` | Cormorant Garamond, italic 400, Latin | `@fontsource/cormorant-garamond@5.3.0` | 23,660 bytes |
| `inter-400-normal.woff2` | Inter, regular 400, Latin | `@fontsource/inter@5.3.0` | 23,664 bytes |
| `amiri-400-normal-v2.woff2` | Amiri, regular 400, invitation Arabic subset | `@fontsource/amiri@5.3.0` | 33,564 bytes |

Packages were acquired from the npm registry using `npm pack`, retaining normal npm package-integrity and TLS verification. Original files are the package's `files/<family>-<subset>-400-<style>.woff2` files. Fontsource's upstream source is [Google Fonts](https://github.com/google/fonts); family projects are [Cormorant](https://github.com/CatharsisFonts/Cormorant), [Inter](https://github.com/rsms/inter), and [Amiri](https://github.com/aliftype/amiri).

Cormorant and Inter retain their complete supplied Latin subsets. Amiri was reduced from the supplied Arabic subset with FontTools' Subsetter, using `layout_features=['*']` and retaining all name records and the glyph closure required for Arabic joining and mark positioning. It supports the exact opening below and the complete Arabic of Surah Ar-Rum 30:21 and Surah Al-Furqan 25:74 in `src/data/quran-verses.json`:

> بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ

Any additional Arabic text requires extending this subset. Regenerate with `python scripts/subset-arabic.py /path/to/amiri-arabic-400-normal.woff2` from the original Fontsource package, using FontTools with Brotli support. All four files have verified `wOF2` signatures and readable OpenType names. The Amiri character map contains every letter and diacritic in the opening and verses. HarfBuzz verification confirms that the subset produces identical glyph outlines, joined forms, diacritic placement, and advances as the original font for all three texts (38, 188, and 131 shaped glyphs). The three Latin files cover the couple's names, date, ampersand, and punctuation. The v2 filename prevents cached older font subsets from omitting the added verse characters.

Use CSS `@font-face` with `font-display: swap` and the provided weight/style. The CSS family alias may be `Cormorant Garamond`, `Inter`, or `Amiri`; Fontsource's Cormorant internal legacy name table uses `Cormorant Garamond Light` while its weight metadata is 400.
