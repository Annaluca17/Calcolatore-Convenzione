// T6 — pagina pulita. Avvio: node --test (dalla radice del repo).
// Seam: tutto ciò che l'utente può vedere o scaricare (testi della pagina, etichette,
// intestazioni del prospetto e del CSV, avvisi). Sono esclusi solo i commenti del
// sorgente (HTML, CSS, JS), che non arrivano mai a video.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const visibile = html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

const trova = (re) => [...visibile.matchAll(re)].map((m) => m[0]);

test("nessun codice voce visibile (V.50, V.92, V.53, V.60, V.79, V.107, voce 79…)", () => {
  assert.deepEqual(trova(/\bV\.\d{2,3}\b/g), []);
  assert.deepEqual(trova(/\b[Vv]oce \d{2,3}\b/g), []);
  assert.deepEqual(trova(/\bvoci? (50|53|60|79|92|107|119)\b/gi), []);
});

test("nessun riferimento normativo (articoli, pareri, circolari, leggi)", () => {
  const vietati = [
    /\bart\.|\bartt\.|\bArt\./g,
    /\bARAN\b/g, /\bSEG_\d+/g, /\bAFL\d+/g,
    /\bCCNI\b/g, /\bDPR\b/g, /\bD\.?lgs\b/gi, /\bDL \d/g, /\bL\. ?\d+\/\d{4}/g,
    /\bMsg\.? INPS/g, /\bparere\b/gi, /\borientamento\b/gi,
  ];
  for (const re of vietati) assert.deepEqual(trova(re), [], String(re));
});

test("nessun link e nessuna sezione normativa nella pagina", () => {
  assert.deepEqual(trova(/<a\s/gi), []);
  assert.deepEqual(trova(/\bhttps?:\/\//g), []);
  assert.deepEqual(trova(/class="legal"|riferimenti normativi|\bguida\b/gi), []);
});

test("i nomi contrattuali non portano la data di firma tra parentesi", () => {
  assert.deepEqual(trova(/\(\d{1,2}\.\d{1,2}\.\d{4}\)/g), []);
});

test("le etichette del prospetto usano i nomi del glossario", () => {
  for (const nome of [
    "Stipendio tabellare", "Posizione conglobata", "Retribuzione di posizione",
    "Galleggiamento", "Maggiorazione di convenzione",
  ]) assert.ok(visibile.includes(nome), nome);
});
