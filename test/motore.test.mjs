// Test del motore del periodo. Avvio: node --test (dalla radice del repo).
// Il motore vive in index.html nel blocco <script id="motore">: lo si esegue
// in un contesto isolato, senza DOM e senza dipendenze esterne.
// Gli importi attesi sono calcolati a mano dalle tabelle dei CCNL
// (16.07.2024 artt. 57, 58, 60; 23.02.2026 artt. 35, 36, 38).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const src = html.match(/<script id="motore">([\s\S]*?)<\/script>/)[1];
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src, ctx);
const { Motore } = ctx;

/* segretario base: nessuna voce accessoria, maggiorazione 25% su 13 mensilità */
const cfg = (x) => ({
  fascia: "B", classe: "B2", posizione: 7837.59, maggPerc: 0, posEQ: 0, gallCap: false,
  ria: 0, maturato: 0, bRia: true, bMat: true, bPos: true, bMagg: true, bGall: true,
  perc: 25, mensErog: 13, maggAltriTipo: "pct", maggAltri: 0, emolumento2023: 0,
  ...x,
});

test("dovuto di gennaio 2019, fascia B: tabellare del primo incremento, nessuna IVC", () => {
  const v = Motore.dovuto(cfg(), "2019-01");
  assert.equal(v.v50, 3330.22);
  assert.equal(v.v92, 231.38);
  assert.equal(v.ivc, 0);
  assert.equal(v.pos, 602.89);          // 7.837,59 / 13
  assert.equal(v.magg, 1041.12);        // 25% di 3.561,60 + 602,89
  assert.equal(v.lordo, 5205.61);
});

test("percepito di gennaio 2019: per default il regime 2016-2018 con la sua IVC", () => {
  const v = Motore.percepito(cfg(), "2019-01");
  assert.equal(v.tab, 3481.60);
  assert.equal(v.ivc, 24.99);
  assert.equal(v.magg, 1027.37);        // 25% di 3.481,60 + 24,99 + 602,89
  assert.equal(v.lordo, 5136.85);
});

test("percepito con regime scelto: il CCNL 2019-2021 a regime, IVC del mese (2024)", () => {
  const v = Motore.percepito(cfg(), "2024-05", "c2019c");
  assert.equal(v.tab, 3616.60);
  assert.equal(v.ivc, 139.24);
});

test("dal 1.1.2021 la posizione in godimento sotto il nuovo valore è portata al minimo (art. 58)", () => {
  const c = cfg({ fascia: "C", classe: "C1", posizione: 7332.22 });
  assert.equal(Motore.dovuto(c, "2020-12").pos, 564.02);   // 7.332,22 / 13
  assert.equal(Motore.dovuto(c, "2021-01").pos, 626.15);   // 8.140,00 / 13
  const a = cfg({ fascia: "A", classe: "A3", posizione: 21781.93 });
  assert.equal(Motore.dovuto(a, "2021-01").pos, 1809.08);  // 23.518,00 / 13
});

test("dal 1.1.2021 la posizione in godimento sopra il minimo resta invariata", () => {
  const b = cfg({ posizione: 10000 });
  assert.equal(Motore.dovuto(b, "2021-06").pos, 769.23);
});

test("il percepito nel regime 2016-2018 non adegua la posizione al minimo 2021", () => {
  const c = cfg({ fascia: "C", classe: "C1", posizione: 7332.22 });
  assert.equal(Motore.percepito(c, "2021-01").pos, 564.02);
  assert.equal(Motore.percepito(c, "2021-01", "c2019c").pos, 626.15);
});

test("dal 1.1.2024 alla posizione in godimento si aggiunge l'incremento art. 36", () => {
  assert.equal(Motore.dovuto(cfg({ posizione: 10000 }), "2024-01").pos, 825.23);  // (10.000 + 728) / 13
  const a = cfg({ fascia: "A", classe: "A2", posizione: 40000 });
  assert.equal(Motore.dovuto(a, "2024-01").pos, 3307.92);                        // (40.000 + 3.003) / 13
  const c = cfg({ fascia: "C", classe: "C1", posizione: 7332.22 });
  assert.equal(Motore.dovuto(c, "2024-01").pos, 679.15);                         // 8.140 + 689 = 8.829
});

test("dovuto 2024-2025: tabellare 2022-2024 e IVC 2025-2027 dal mese di decorrenza", () => {
  const b = Motore.dovuto(cfg(), "2024-12");
  assert.equal(b.tab, 3846.60);
  assert.equal(b.ivc, 0);
  assert.equal(Motore.dovuto(cfg(), "2025-04").ivc, 23.10);
  const c = Motore.dovuto(cfg({ fascia: "C", classe: "C1", posizione: 7332.22 }), "2025-07");
  assert.equal(c.tab, 3077.28);
  assert.equal(c.ivc, 30.77);
});

test("dovuto 2022-2023: tabellare 2021 più l'anticipazione 2022-2024 (0,3% da aprile, 0,5% da luglio 2022)", () => {
  assert.equal(Motore.dovuto(cfg(), "2022-03").ivc, 0);
  assert.equal(Motore.dovuto(cfg(), "2022-05").ivc, 10.85);   // 0,3% di 3.616,60
  assert.equal(Motore.dovuto(cfg(), "2022-07").ivc, 18.08);   // 0,5% di 3.616,60
  assert.equal(Motore.dovuto(cfg(), "2023-12").ivc, 18.08);
  const c = cfg({ fascia: "C", classe: "C1", posizione: 7332.22 });
  assert.equal(Motore.dovuto(c, "2022-05").ivc, 8.68);        // 0,3% di 2.893,28
  assert.equal(Motore.dovuto(c, "2023-01").ivc, 14.47);
});

test("galleggiamento ricalcolato sulla posizione EQ: cala quando la posizione aumenta", () => {
  const b = cfg({ posEQ: 13499.98 });
  assert.equal(Motore.dovuto(b, "2019-01").gall, 435.57);   // (13.499,98 - 7.837,59) / 13
  assert.equal(Motore.dovuto(b, "2021-01").gall, 373.38);   // (13.499,98 - 8.646,00) / 13
  assert.equal(Motore.dovuto(b, "2024-01").gall, 317.38);   // (13.499,98 - 9.374,00) / 13
  assert.equal(Motore.percepito(b, "2021-01").gall, 435.57);
});

test("galleggiamento con massimale e con maggiorazione della posizione", () => {
  assert.equal(Motore.dovuto(cfg({ posEQ: 13499.98, gallCap: true }), "2019-01").gall, 231.38); // 3.008 / 13
  const m = Motore.dovuto(cfg({ posEQ: 13499.98, maggPerc: 10 }), "2019-01");
  assert.equal(m.maggPos, 60.29);                           // 10% di 7.837,59 / 13
  assert.equal(m.gall, 375.28);                             // (13.499,98 - 8.621,35) / 13
});

test("RIA e maturato economico entrano nella base e nel lordo", () => {
  const v = Motore.dovuto(cfg({ ria: 100, maturato: 50 }), "2019-01");
  assert.equal(v.ria, 100);
  assert.equal(v.mat, 50);
  assert.equal(v.magg, 1078.62);       // 25% di 3.561,60 + 602,89 + 150
  assert.equal(v.lordo, 5393.11);
});

const tredicesime = (p) => p.righe.filter((r) => r.tred);

test("13ª a ratei: anno intero esposta a dicembre, pari a una mensilità", () => {
  const p = Motore.periodo(cfg(), "2019-01", "2019-12");
  assert.equal(p.righe.length, 13);
  const [t] = tredicesime(p);
  assert.equal(t.ym, "2019-12");
  assert.equal(t.dovuto.tab, 3561.60);
  assert.equal(t.dovuto.pos, 602.89);
});

test("13ª a ratei: periodo parziale esposta nel mese di fine, 1/12 per mese", () => {
  const p = Motore.periodo(cfg(), "2024-03", "2024-08");
  const [t] = tredicesime(p);
  assert.equal(t.ym, "2024-08");
  assert.equal(t.dovuto.tab, 1923.30);                     // 6/12 di 3.846,60
  const q = tredicesime(Motore.periodo(cfg(), "2023-11", "2024-02"));
  assert.deepEqual(Array.from(q, (r) => r.ym), ["2023-12", "2024-02"]);  // Array.from: l'array del contesto vm ha un altro prototipo
  assert.equal(q[0].dovuto.tab, 602.77);                   // 2/12 di 3.616,60
  assert.equal(q[1].dovuto.tab, 641.10);                   // 2/12 di 3.846,60
});

test("13ª su 12 mensilità di erogazione: senza rateo di maggiorazione", () => {
  const [t] = tredicesime(Motore.periodo(cfg({ mensErog: 12 }), "2019-01", "2019-12"));
  assert.equal(t.dovuto.magg, 0);
  assert.equal(t.dovuto.lordo, 4164.49);                   // 3.561,60 + 602,89
});

test("subtotali per anno: dovuto, percepito e differenza, 13ª compresa", () => {
  const a = Motore.periodo(cfg(), "2019-01", "2019-01").anni[2019];
  assert.equal(a.dovuto.lordo, 5639.41);       // 5.205,61 + rateo 433,80
  assert.equal(a.percepito.lordo, 5564.91);    // 5.136,85 + rateo 428,06
  assert.equal(a.diff.lordo, 74.50);
});

test("emolumento di dicembre 2023 dedotto dalle sole differenze 2024", () => {
  const p = Motore.periodo(cfg({ emolumento2023: 500 }), "2023-11", "2024-02");
  assert.equal(p.anni[2023].emolumento, 0);
  assert.equal(p.anni[2023].diffNetta, p.anni[2023].diff.lordo);
  assert.equal(p.anni[2024].emolumento, 500);
  assert.equal(p.anni[2024].diffNetta, Math.round((p.anni[2024].diff.lordo - 500) * 100) / 100);
});

test("emolumento indicato ma 2024 fuori periodo: avviso", () => {
  const p = Motore.periodo(cfg({ emolumento2023: 500 }), "2022-01", "2023-12");
  assert.ok(p.avvisi.some((a) => a.codice === "emolumento-fuori-periodo"));
});

test("riparto in percentuale applicato alla maggiorazione su dovuto e percepito", () => {
  const c = cfg({ maggAltriTipo: "pct", maggAltri: 40 });
  const d = Motore.dovuto(c, "2019-01");
  assert.equal(d.riparto, -416.45);            // 40% di 1.041,12
  assert.equal(d.lordo, 4789.16);
  const p = Motore.percepito(c, "2019-01");
  assert.equal(p.riparto, -410.95);            // 40% di 1.027,37
  assert.equal(p.lordo, 4725.90);
});

test("riparto in importo fisso: nessuna detrazione nel periodo e avviso", () => {
  const p = Motore.periodo(cfg({ maggAltriTipo: "imp", maggAltri: 300 }), "2019-01", "2019-01");
  assert.equal(p.righe[0].dovuto.riparto, 0);
  assert.ok(p.avvisi.some((a) => a.codice === "riparto-importo"));
});

/* casi 2019 → 2025: un segretario per fascia, percepito con il regime di default */
const mese = (p, ym) => p.righe.find((r) => r.ym === ym && !r.tred);

test("fascia A (fino a 250.000 ab.) dal 2019 al 2025", () => {
  const p = Motore.periodo(cfg({ fascia: "A", classe: "A3", posizione: 21781.93 }), "2019-01", "2025-12");
  assert.equal(p.righe.length, 84 + 7);
  assert.deepEqual(Array.from(["2019-06", "2020-06", "2021-06", "2023-06", "2024-06"], (ym) => mese(p, ym).dovuto.tab),
    [3561.60, 3605.60, 3616.60, 3616.60, 3846.60]);
  assert.equal(mese(p, "2020-12").dovuto.pos, 1675.53);
  assert.equal(mese(p, "2021-01").dovuto.pos, 1809.08);
  assert.equal(mese(p, "2024-01").dovuto.pos, 1962.08);
  assert.equal(mese(p, "2024-07").percepito.tab, 3481.60);   // ancora il 2016-2018
  assert.equal(mese(p, "2024-07").percepito.ivc, 158.43);
  assert.equal(mese(p, "2024-08").percepito.tab, 3616.60);   // applicato il 2019-2021
  const lug25 = mese(p, "2025-07");
  assert.equal(lug25.dovuto.lordo, 7308.94);
  assert.equal(lug25.percepito.lordo, 7001.36);
  assert.equal(lug25.diff.lordo, 307.58);
});

test("fascia B (3.000-10.000 ab.) con galleggiamento EQ dal 2019 al 2025", () => {
  const p = Motore.periodo(cfg({ posEQ: 13499.98 }), "2019-01", "2025-12");
  const lug25 = mese(p, "2025-07");
  assert.equal(lug25.dovuto.v50, 3615.22);
  assert.equal(lug25.dovuto.v92, 231.38);
  assert.equal(lug25.dovuto.lordo, 6154.41);
  assert.equal(lug25.percepito.lordo, 6038.09);
  assert.equal(lug25.diff.lordo, 116.32);
  assert.equal(lug25.diff.pos, 56.00);       // la posizione cresce (9.374 contro 8.646) ...
  assert.equal(lug25.diff.gall, -56.00);     // ... e il galleggiamento cala di altrettanto
});

test("fascia C (fino a 3.000 ab.) dal 2019 al 2025", () => {
  const p = Motore.periodo(cfg({ fascia: "C", classe: "C1", posizione: 7332.22 }), "2019-01", "2025-12");
  assert.equal(mese(p, "2019-01").dovuto.tab, 2849.28);
  assert.equal(mese(p, "2020-01").dovuto.tab, 2884.28);
  const lug25 = mese(p, "2025-07");
  assert.equal(lug25.dovuto.lordo, 4734.00);
  assert.equal(lug25.percepito.lordo, 4574.69);
  assert.equal(lug25.diff.lordo, 159.31);
});

/* ---- T4: percepito modificabile ---- */
const unMese = (c, modifiche) => Motore.periodo(cfg(c), "2019-01", "2019-01", { modifiche }).righe[0];

test("cella del percepito modificata: tabellare, base, maggiorazione e lordo si ricalcolano", () => {
  const r = unMese({}, { "2019-01": { v50: 3300.02 } });
  assert.equal(r.percepito.v50, 3300.02);
  assert.equal(r.percepito.tab, 3531.40);       // 3.300,02 + 231,38
  assert.equal(r.percepito.magg, 1039.82);      // 25% di 3.531,40 + 24,99 + 602,89 = 4.159,28
  assert.equal(r.percepito.lordo, 5199.10);
  assert.equal(r.dovuto.lordo, 5205.61);        // il dovuto non cambia
  assert.equal(r.diff.v50, 30.20);
  assert.equal(r.diff.magg, 1.30);
  assert.equal(r.diff.lordo, 6.51);
  assert.deepEqual(Array.from(r.modificate), ["v50"]);
});

test("maggiorazione modificata a mano non si ricalcola dalla base, anche se la base cambia", () => {
  const r = unMese({}, { "2019-01": { pos: 700, magg: 1000 } });
  assert.equal(r.percepito.magg, 1000);
  assert.equal(r.percepito.lordo, 5206.59);     // 3.481,60 + 24,99 + 700 + 1.000
  assert.deepEqual(Array.from(r.modificate), ["pos", "magg"]);
});

test("maggiorazione non toccata si ricalcola quando cambia la base", () => {
  const r = unMese({}, { "2019-01": { pos: 700 } });
  assert.equal(r.percepito.magg, 1051.65);      // 25% di 3.481,60 + 24,99 + 700 = 4.206,59
  assert.equal(r.percepito.lordo, 5258.24);
});

test("la quota degli altri enti segue la maggiorazione modificata", () => {
  const r = unMese({ maggAltriTipo: "pct", maggAltri: 40 }, { "2019-01": { magg: 1000 } });
  assert.equal(r.percepito.riparto, -400);
  assert.equal(r.percepito.lordo, 4709.48);     // 3.481,60 + 24,99 + 602,89 + 1.000 - 400
});

test("la 13ª a ratei del percepito parte dalle celle modificate; il dovuto non cambia", () => {
  const p = Motore.periodo(cfg(), "2019-01", "2019-01", { modifiche: { "2019-01": { v50: 3300.02 } } });
  const t = p.righe[1];
  assert.equal(t.tred, true);
  assert.equal(t.percepito.tab, 294.28);        // 3.531,40 / 12
  assert.equal(t.percepito.lordo, 433.25);      // 294,28 + 2,08 + 50,24 + 86,65
  assert.equal(t.dovuto.lordo, 433.80);
  assert.deepEqual(Array.from(t.modificate), []);
});

test("senza modifiche il risultato è identico a prima", () => {
  const a = Motore.periodo(cfg(), "2019-01", "2020-06");
  const b = Motore.periodo(cfg(), "2019-01", "2020-06", { modifiche: {} });
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

/* propaga / ripristina: funzioni pure sulla mappa delle modifiche */
const mesi5 = ["2019-01", "2019-02", "2019-03", "2019-04", "2019-05"];

test("propaga: il valore della cella va a tutti i mesi successivi, senza toccare l'originale", () => {
  const prima = { "2019-04": { ria: 5 } };
  const dopo = Motore.propaga(prima, mesi5, "2019-03", "v50", 3300.02);
  assert.deepEqual(JSON.parse(JSON.stringify(dopo)), {
    "2019-03": { v50: 3300.02 }, "2019-04": { ria: 5, v50: 3300.02 }, "2019-05": { v50: 3300.02 } });
  assert.deepEqual(JSON.parse(JSON.stringify(prima)), { "2019-04": { ria: 5 } });
});

test("ripristina: toglie una cella; il mese senza più modifiche sparisce", () => {
  const m = { "2019-03": { v50: 1 }, "2019-04": { v50: 2, ria: 5 } };
  const dopo = Motore.ripristina(m, "2019-03", "v50");
  assert.deepEqual(JSON.parse(JSON.stringify(dopo)), { "2019-04": { v50: 2, ria: 5 } });
  assert.deepEqual(JSON.parse(JSON.stringify(Motore.ripristina(dopo, "2019-04", "ria"))), { "2019-04": { v50: 2 } });
  assert.deepEqual(JSON.parse(JSON.stringify(m)), { "2019-03": { v50: 1 }, "2019-04": { v50: 2, ria: 5 } });
});

/* arretrati degli anni precedenti vs anno corrente */
const voci0 = (lordo) => Object.fromEntries(
  ["tab", "v50", "v92", "ivc", "ria", "mat", "pos", "maggPos", "gall", "magg", "riparto", "lordo"].map((k) => [k, k === "lordo" ? lordo : 0]));
const anno = (d, p, emolumento) => ({ dovuto: voci0(d), percepito: voci0(p), diff: voci0(d - p), emolumento, diffNetta: d - p - emolumento });
const anniFinti = { 2023: anno(100, 90, 0), 2024: anno(220, 200, 5), 2025: anno(57, 50, 0) };

test("anni precedenti all'anno corrente = arretrati; l'anno corrente è a parte", () => {
  const g = Motore.ripartisciAnni(anniFinti, 2025);
  assert.deepEqual(Array.from(g.arretrati.anni), [2023, 2024]);
  assert.equal(g.arretrati.dovuto.lordo, 320);
  assert.equal(g.arretrati.percepito.lordo, 290);
  assert.equal(g.arretrati.diff.lordo, 30);
  assert.equal(g.arretrati.emolumento, 5);
  assert.equal(g.arretrati.diffNetta, 25);
  assert.deepEqual(Array.from(g.corrente.anni), [2025]);
  assert.equal(g.corrente.diff.lordo, 7);
  assert.equal(g.corrente.diffNetta, 7);
});

test("periodo tutto nel passato: nessun anno corrente; tutto nel corrente: nessun arretrato", () => {
  assert.equal(Motore.ripartisciAnni(anniFinti, 2026).corrente, null);
  assert.equal(Motore.ripartisciAnni(anniFinti, 2023).arretrati, null);
  assert.equal(Motore.ripartisciAnni(anniFinti, 2023).corrente.diff.lordo, 37);
});

/* ===================== T5 — salva / apri pratica ===================== */
/* stato completo di entrambe le pagine, come lo legge la pagina dai campi */
const stato = (x) => ({
  contratto: "c2019c", fascia: "B", classe: "B1", ivcScelta: "r2", ivcValore: 49.36, tabellare: 44017.86,
  posizione: 16806, ria: 120.5, maturato: 35, maggPos: 10, posEQ: 21000, perc: 25, mensilita: 13,
  base: { ria: true, mat: true, pos: true, magg: true, gall: false }, gallCap: true, incr15: false,
  riparto: { tipo: "pct", valore: 40 },
  enti: [{ nome: "Comune capofila", ab: 4200 }, { nome: "Comune convenzionato", ab: 2800 }],
  dal: "2019-01", al: "2025-12", regimePercepito: "auto", emolumento2023: 150,
  modifiche: { "2019-03": { v50: 3300.02 }, "2019-04": { v50: 3300.02, ria: 10 } },
  ...x,
});
const json = (o) => JSON.parse(JSON.stringify(o));
const salva = (s, nome = "Pratica prova") => json(Motore.serializzaPratica(s, { nomePratica: nome, data: "2026-10-13T10:00:00.000Z" }));

test("pratica salvata e riaperta: stato identico e calcoli del periodo identici", () => {
  const s = stato();
  const file = salva(s);
  assert.equal(file.versione, 1);
  assert.equal(file.nomePratica, "Pratica prova");
  assert.equal(file.salvataIl, "2026-10-13T10:00:00.000Z");
  const r = Motore.validaPratica(JSON.parse(JSON.stringify(file)));
  assert.equal(r.ok, true, JSON.stringify(r.errori));
  assert.deepEqual(json(r.stato), json(s));
  assert.equal(r.nomePratica, "Pratica prova");
  // gli stessi calcoli di pagina 2, comprese le celle modificate
  const cfgDa = (st) => cfg({ fascia: st.fascia, classe: st.classe, posizione: st.posizione, ria: st.ria, maturato: st.maturato,
    maggPerc: st.maggPos, posEQ: st.posEQ, perc: st.perc, mensErog: st.mensilita, emolumento2023: st.emolumento2023 });
  const prima = Motore.periodo(cfgDa(s), s.dal, s.al, { modifiche: s.modifiche });
  const dopo = Motore.periodo(cfgDa(r.stato), r.stato.dal, r.stato.al, { modifiche: r.stato.modifiche });
  assert.deepEqual(json(dopo), json(prima));
  assert.ok(prima.righe.some((m) => m.modificate.length), "il test deve contenere celle modificate");
});

test("nel file non entra nessun dato personale: solo i campi previsti", () => {
  const s = stato({ codiceFiscale: "RSSMRA80A01H501U", cognome: "Rossi", enti: [{ nome: "Comune X", ab: 100, cf: "RSSMRA80A01H501U" }] });
  const file = salva(s);
  const testo = JSON.stringify(file);
  assert.ok(!/RSSMRA80A01H501U|Rossi|codiceFiscale|cognome/.test(testo));
  assert.deepEqual(Object.keys(file).sort(), ["nomePratica", "salvataIl", "stato", "versione"]);
  assert.deepEqual(Object.keys(file.stato).sort(), [
    "al", "base", "classe", "contratto", "dal", "emolumento2023", "enti", "fascia", "gallCap", "incr15", "ivcScelta", "ivcValore",
    "maggPos", "maturato", "mensilita", "modifiche", "perc", "posEQ", "posizione", "regimePercepito", "ria", "riparto", "tabellare"]);
  assert.deepEqual(Object.keys(file.stato.enti[0]).sort(), ["ab", "nome"]);
});

const apri = (mut) => { const f = salva(stato()); mut(f); return Motore.validaPratica(f); };
const rifiuta = (r, rx) => { assert.equal(r.ok, false); assert.ok(r.errori.length > 0); assert.match(r.errori.join(" | "), rx); assert.equal(r.stato, undefined); };

test("file che non è una pratica, o con versione sconosciuta: rifiutato con un messaggio chiaro", () => {
  for (const x of [null, 42, "testo", [], {}]) assert.equal(Motore.validaPratica(x).ok, false);
  rifiuta(apri((f) => { f.versione = 2; }), /versione/i);
  rifiuta(apri((f) => { delete f.versione; }), /versione|pratica/i);
  rifiuta(apri((f) => { f.stato = null; }), /stato/i);
  rifiuta(apri((f) => { f.nomePratica = 7; }), /nome/i);
});

test("valori fuori dominio: fascia, classe, contratto, IVC, tipi, intervalli", () => {
  rifiuta(apri((f) => { f.stato.fascia = "D"; }), /fascia/i);
  rifiuta(apri((f) => { f.stato.classe = "A1"; }), /classe/i);          // A1 non esiste in fascia B
  rifiuta(apri((f) => { f.stato.contratto = "c1999"; }), /contratto/i);
  rifiuta(apri((f) => { f.stato.ivcScelta = "r99"; }), /IVC/i);
  rifiuta(apri((f) => { f.stato.ivcScelta = "boh"; }), /IVC/i);
  rifiuta(apri((f) => { f.stato.mensilita = 14; }), /mensilit/i);
  rifiuta(apri((f) => { f.stato.perc = "25"; }), /percentuale|perc/i);
  rifiuta(apri((f) => { f.stato.perc = 101; }), /percentuale|perc/i);
  rifiuta(apri((f) => { f.stato.ria = -1; }), /RIA/i);
  rifiuta(apri((f) => { f.stato.posizione = null; }), /posizione/i);
  rifiuta(apri((f) => { f.stato.base.gall = "si"; }), /base|galleggiamento/i);
  rifiuta(apri((f) => { f.stato.gallCap = 1; }), /massimale/i);
  rifiuta(apri((f) => { f.stato.riparto.tipo = "xx"; }), /riparto/i);
  rifiuta(apri((f) => { f.stato.regimePercepito = "c1999"; }), /regime/i);
  rifiuta(apri((f) => { f.stato.emolumento2023 = -5; }), /emolumento/i);
  rifiuta(apri((f) => { f.stato.enti = []; }), /enti/i);
  rifiuta(apri((f) => { f.stato.enti[0].ab = "molti"; }), /abitanti/i);
  rifiuta(apri((f) => { f.stato.enti[0].nome = 5; }), /nome dell'ente|ente/i);
});

test("mesi del periodo: formato AAAA-MM obbligatorio (vuoto ammesso come campo non compilato)", () => {
  rifiuta(apri((f) => { f.stato.dal = "01/2019"; }), /dal/i);
  rifiuta(apri((f) => { f.stato.al = "2019-13"; }), /al/i);
  rifiuta(apri((f) => { f.stato.al = "2019-1"; }), /al/i);
  const ok = apri((f) => { f.stato.dal = ""; f.stato.al = ""; f.stato.modifiche = {}; });
  assert.equal(ok.ok, true);
});

test("più errori nello stesso file vengono elencati tutti", () => {
  const r = apri((f) => { f.stato.fascia = "D"; f.stato.mensilita = 14; });
  assert.ok(r.errori.length >= 2);
});

test("modifiche: mese malformato, fuori dal periodo, voce inesistente o valore non numerico = file rifiutato", () => {
  rifiuta(apri((f) => { f.stato.modifiche = { "03/2019": { v50: 1 } }; }), /AAAA-MM|mese/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-13": { v50: 1 } }; }), /AAAA-MM|mese/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2018-12": { v50: 1 } }; }), /periodo/i);   // periodo 2019-01 → 2025-12
  rifiuta(apri((f) => { f.stato.modifiche = { "2026-01": { v50: 1 } }; }), /periodo/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-03": { stipendioSegreto: 1 } }; }), /voce/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-03": { lordo: 1 } }; }), /voce/i);        // il lordo è una somma
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-03": { v50: "3300" } }; }), /valore/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-03": { v50: null } }; }), /valore/i);
  rifiuta(apri((f) => { f.stato.modifiche = { "2019-03": 5 }; }), /modifiche/i);
});

test("modifiche valide: anche negative (il percepito può avere voci a segno negativo) e ai bordi del periodo", () => {
  const r = apri((f) => { f.stato.modifiche = { "2019-01": { riparto: -12.5 }, "2025-12": { magg: 900 } }; });
  assert.equal(r.ok, true, JSON.stringify(r.errori));
  assert.deepEqual(json(r.stato.modifiche), { "2019-01": { riparto: -12.5 }, "2025-12": { magg: 900 } });
});

test("campi non previsti nel file (anche personali) sono ignorati e segnalati, mai riportati nello stato", () => {
  const r = apri((f) => { f.codiceFiscale = "RSSMRA80A01H501U"; f.stato.cognome = "Rossi"; f.stato.enti[0].cf = "RSSMRA80A01H501U"; });
  assert.equal(r.ok, true);
  assert.ok(!/RSSMRA80A01H501U|Rossi/.test(JSON.stringify(r.stato)));
  assert.ok(r.avvisi.length >= 1);
  assert.match(r.avvisi.join(" "), /ignorat/i);
});

test("nomePratica assente = vuoto; nome lungo rifiutato", () => {
  const r = apri((f) => { delete f.nomePratica; });
  assert.equal(r.ok, true); assert.equal(r.nomePratica, "");
  rifiuta(apri((f) => { f.nomePratica = "x".repeat(201); }), /nome/i);
});
