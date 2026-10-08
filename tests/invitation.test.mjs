import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
const text = html.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const icsBytes = readFileSync(join(root, 'dist/nikah.ics'));
const ics = icsBytes.toString('utf8').replace(/\r\n[ \t]/g, '');

test('production HTML contains the supplied invitation and family details', () => {
  for (const value of ['Fahad Masood', 'Rahnuma Zarrin', 'Mr. & Mrs. Masood Alam', 'Mrs. Shamshad Begum', 'Aman Park', 'New Delhi', '6:00 PM', 'IST', '12 November 2026', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'Surah Ar-Rum (30:21)', 'Your gracious presence and sincere duas', 'endless barakah. Ameen.']) {
    assert.ok(text.includes(value), `Missing supplied content: ${value}`);
  }
  assert.match(html, /lang="ar" dir="rtl"/);
  assert.match(html, /<title>.*The Nikah Ceremony<\/title>/);
});

test('published files contain exclusively this ceremony', () => {
  function scan(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scan(path);
      else if (/\.(html|css|js|svg|ics|json|txt)$/.test(entry.name)) {
        assert.doesNotMatch(readFileSync(path, 'utf8'), /walima|mehndi|reception|dummy RSVP/i, path);
      }
    }
  }
  scan(join(root, 'dist'));
  assert.doesNotMatch(html, /<iframe|astro-island|https?:\/\/[^"' ]+\.mp[34]/i);
});

test('directions and calendar controls use real destinations', () => {
  assert.match(html, /href="https:\/\/maps\.app\.goo\.gl\/4JDyNdM4EDK4V9nc8"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/);
  assert.equal((html.match(/href="\/nikah\.ics"/g) || []).length, 2);
  assert.match(html, /id="whatsapp-share"/);
  assert.match(html, /aria-live="polite" aria-atomic="true" role="status"/);
});

test('calendar is interoperable and has the exact start in Asia/Kolkata', () => {
  assert.match(ics, /DTSTART;TZID=Asia\/Kolkata:20261112T180000\r\n/);
  assert.match(ics, /BEGIN:VTIMEZONE\r\nTZID:Asia\/Kolkata/);
  assert.match(ics, /TZOFFSETTO:\+0530/);
  assert.match(ics, /SUMMARY:Nikah of Fahad Masood & Rahnuma Zarrin/);
  assert.match(ics, /LOCATION:Aman Park\\, New Delhi\\, India/);
  assert.match(ics, /https:\/\/maps\.app\.goo\.gl\/4JDyNdM4EDK4V9nc8/);
  assert.doesNotMatch(ics, /DTEND|DURATION|ATTENDEE|ORGANIZER/);
  assert.equal(new Date('2026-11-12T18:00:00+05:30').toISOString(), '2026-11-12T12:30:00.000Z');
  assert.equal(new Date('2026-11-12T12:30:00Z').getUTCDay(), 4);
  const raw = icsBytes.toString('utf8');
  assert.ok(raw.endsWith('END:VCALENDAR\r\n'));
  assert.doesNotMatch(raw.replace(/\r\n/g, ''), /[\r\n]/);
  for (const line of raw.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
});

test('social image is a complete 1200×630 PNG and metadata is correct', () => {
  const png = readFileSync(join(root, 'dist/social-preview.png'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.match(html, /property="og:image:width" content="1200"/);
  assert.match(html, /property="og:image:height" content="630"/);
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
});

test('invitation downloads no remote fonts, scripts, or styles', () => {
  assert.doesNotMatch(html, /<script[^>]*src="https?:\/\/|<link[^>]*rel="(?:stylesheet|preload|preconnect|dns-prefetch)"[^>]*href="https?:\/\//);
  let fontBytes = 0;
  for (const name of readdirSync(join(root, 'dist/fonts')).filter(n => n.endsWith('.woff2'))) {
    const font = readFileSync(join(root, 'dist/fonts', name));
    assert.equal(font.subarray(0, 4).toString(), 'wOF2');
    fontBytes += font.length;
  }
  assert.ok(fontBytes < 100_000, `Font budget exceeded: ${fontBytes}`);
  assert.ok(gzipSync(html).length < 25_000, 'Compressed HTML exceeds the invitation budget');
});

test('essential invitation and controls exist without client rendering', () => {
  const noScript = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  assert.match(noScript, /<h1[^>]*id="couple"/);
  assert.match(noScript, /id="share-fallback"[^>]*href="https:\/\/wa\.me\/\?text=/);
  assert.match(noScript, /<time[^>]*datetime="2026-11-12"/);
  assert.match(noScript, /id="venue"/);
});
