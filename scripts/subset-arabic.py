"""Regenerate the local Arabic font after editing the displayed Quran text.

Requires fonttools[woff] and an original, verified Amiri Arabic WOFF2 file.
Usage: python scripts/subset-arabic.py /path/to/amiri-arabic-400-normal.woff2
"""
import argparse
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('original', type=Path)
args = parser.parse_args()
verses = json.loads((root / 'src/data/quran-verses.json').read_text())
opening = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
text = ' '.join([opening, *(verse['arabic'] for verse in verses)])
font = TTFont(args.original, checkChecksums=2)
missing = set(map(ord, text)) - set(font.getBestCmap())
if missing:
    raise ValueError(f'Original font lacks required characters: {sorted(missing)}')
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
options.name_IDs = ['*']
options.name_legacy = True
options.name_languages = ['*']
options.glyph_names = True
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = 'woff2'
output = root / 'public/fonts/amiri-400-normal-v2.woff2'
font.save(output)
assert not (set(map(ord, text)) - set(font.getBestCmap()))
print(f'Generated {output.name}: {output.stat().st_size:,} bytes; all displayed Arabic characters covered.')
