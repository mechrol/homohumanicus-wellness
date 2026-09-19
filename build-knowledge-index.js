/* ============================================================
   build-knowledge-index.js
   Generates baza-index.json from the markdown files in /baza.
   Chunks each file on heading boundaries and builds a
   keyword-searchable index for the client-side chatbot.

   Run:  node build-knowledge-index.js
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const BAZA_DIR = path.join(__dirname, 'baza');
const OUT_FILE = path.join(__dirname, 'baza-index.json');

// Normalize Polish diacritics so search matches "zoladek" -> "żołądek".
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Split a markdown document into chunks on heading boundaries.
function chunkMarkdown(text, source) {
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let current = [];
  let heading = '';

  function flush() {
    const body = current.join('\n').trim();
    if (body) {
      chunks.push({ source, heading, text: body });
    }
    current = [];
  }

  for (const line of lines) {
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      heading = h[2].trim();
      current.push(line);
    } else {
      current.push(line);
    }
  }
  flush();
  return chunks;
}

function main() {
  const files = fs.readdirSync(BAZA_DIR).filter((f) => f.toLowerCase().endsWith('.md'));
  const chunks = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(BAZA_DIR, file), 'utf8');
    const docChunks = chunkMarkdown(raw, file);
    for (const c of docChunks) {
      chunks.push({
        source: c.source,
        heading: c.heading,
        text: c.text,
        norm: normalize(c.heading + ' ' + c.text),
      });
    }
  }

  const index = {
    generatedAt: new Date().toISOString(),
    count: chunks.length,
    chunks,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(index), 'utf8');
  console.log(`Indexed ${chunks.length} chunks from ${files.length} files -> ${OUT_FILE}`);
}

main();
