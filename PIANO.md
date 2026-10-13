# Piano di revisione — Calcolatore Segretario in Convenzione

Decisioni prese il 13/10/2026 (sessione di verifica V.92 e logiche di calcolo).
Vocabolario: [GLOSSARY.md](GLOSSARY.md). Un unico file applicativo: `index.html`.
Dopo ogni ticket, copiare `index.html` in
`Progetto HR Tools/calcolo convenzione segretario/` (è una copia identica).

## Fonti

- CCNL Area Funzioni Locali 2022‑2024, firmato 23.02.2026 — segretari: art. 35
  (tabellare +230/+230/+184 dal 1.1.2024; A=B=50.005,77, C=40.004,59), art. 36
  (incremento posizione in godimento), art. 38 (minimi/massimi, +15% capoluoghi
  e province, +20% enti metropolitani). Non modifica l'art. 63 (convenzione).
  PDF: https://www.cittametropolitana.mi.it/citta-metropolitana/amministrazione-trasparente/personale/doc_personale/Contrattazioni/ANNO-2026/CCNL-Area-FL-2022-2024-firmato.pdf
- CCNL 16.07.2024 (2019‑2021): art. 56 c.1 lett. a‑d, art. 57, art. 60, art. 62
  (scavalco/reggenza), art. 63 (convenzione: 25% della retribuzione complessiva
  in godimento di cui all'art. 56 c.1 lett. a‑d).
  **Verificato sul testo (T3):** art. 58 — «con decorrenza dal 1° gennaio 2021» i
  valori annui della posizione (art. 107 c.1 CCNL 17.12.2020) sono *rideterminati*
  in 43.054 / 35.590 / 23.518 (A), 16.806 / 8.646 (B), 8.140 (C): nuovi valori,
  non un incremento. L'art. 60 (minimi‑massimi, graduazione) va applicato entro il
  primo giorno del sesto mese dalla firma (1.1.2025); da lì sono disapplicate le
  maggiorazioni CCNI 2003. Art. 57 c.3: tabellare C 37.040,59 (2019) e 37.495,59
  (2020), non ,62. Testo: https://i2.res.24o.it/pdf2010/S24/Documenti/2024/07/17/AllegatiPDF/2024.07.16%20-%20CCNL%20Area%20Funzioni%20Locali%202019-2021.pdf

## Decisioni

1. **V.92** è una quota interna al tabellare di fascia B: V.50 + V.92 = tabellare
   di fascia. Fascia B 2022‑24 = 3.615,22 + 231,38. *(fatto, T1)*
2. **Controllo**: errore se il tabellare inserito ≠ tabellare CCNL della fascia. *(fatto, T1)*
3. **Posizione 2024**: `POS_2024` dall'art. 38, con `incr` dell'art. 36. *(fatto, T1)*
4. **Dovuto**: regime scelto per decorrenza mese per mese (2016‑18 → 2019 → 2020 →
   2021 → 2022‑23 con anticipazione = IVC già pagata → 2024). Posizione = in
   godimento + incremento contrattuale, portata al minimo se resta sotto (anche
   al passaggio 2021, decorrenza da verificare sul testo). Galleggiamento
   ricalcolato rispetto alla posizione EQ più elevata (campo unico). Non modificabile.
5. **Percepito**: regime selezionabile (default: quello precedente al rinnovo) +
   IVC del mese, precalcolato; ogni cella mese × voce modificabile, evidenziata,
   con "propaga ai mesi successivi" e "ripristina calcolato". La maggiorazione
   modificata a mano non si ricalcola.
6. **13ª a ratei** (1/12 per mese di servizio nell'anno), esposta a dicembre o
   nel mese di fine periodo.
7. **Prospetto**: per mese e per voce dovuto / percepito / differenza, subtotali
   per anno (arretrati anni precedenti vs anno corrente); anche nel CSV.
8. **Emolumento dicembre 2023** (DL 145/2023): campo facoltativo, default 0,
   dedotto dalle differenze 2024.
9. **Riparto fra enti**: in percentuale si applica a dovuto e percepito; in
   importo fisso → avviso e richiesta della percentuale.
10. Solo **lordo dipendente**, niente oneri riflessi.
11. **Salva / apri pratica** in JSON (nome pratica libero, nessun codice fiscale)
    + bozza automatica in localStorage (in try/catch).
12. **Pagina pulita**: niente riferimenti normativi né codici voce visibili;
    avvisi in una riga con link "perché?" al paragrafo della guida. Export CSV.
13. **GUIDA.md** riscritta da zero (normativa, voci, controlli; niente Halley),
    scavalco verificato sull'art. 62. PDF e vecchia guida .md in
    `Progetti Immedia/_archivio/2026-10-13/` con `LEGGIMI.md`.
14. Raffronto del galleggiamento **solo con l'EQ** (enti senza dirigenza).

## Ticket

| # | Ticket | Dipende da | Stato |
|---|---|---|---|
| T1 | Dati contrattuali: B 2022, controllo tabellare, POS_2024 | — | fatto |
| T2 | GUIDA.md da zero + archiviazione PDF e vecchia guida | — | rinviato |
| T3 | Motore del periodo: dovuto per decorrenza, posizione, galleggiamento EQ, ratei 13ª, emolumento 12/2023, riparto | T1 | fatto |
| T4 | Prospetto differenze: tabella dovuto/percepito/differenza, celle modificabili, subtotali anno, CSV | T3 | fatto |
| T5 | Salva/apri pratica JSON + bozza | T4 | fatto |
| T6 | Pagina pulita: via norme e codici, avvisi brevi con link alla guida | T2, T5 | da fare |

T3→T6 toccano tutti `index.html`: vanno eseguiti **in sequenza**, non in parallelo.
T2 può girare in parallelo a T3.

## T3 — come funziona il motore (13/10/2026)

Il motore sta in `index.html`, blocco `<script id="motore">`: tabelle e funzioni
pure, senza DOM. Test: `node --test` dalla radice del repo
(`test/motore.test.mjs`, 23 casi, nessuna dipendenza). Interfaccia pubblica
`Motore`: `dovuto(cfg, ym)`, `percepito(cfg, ym, regime)`,
`periodo(cfg, dal, al, {regimePercepito})` → `{mesi, righe, anni, avvisi}`;
ogni riga ha `dovuto`, `percepito`, `diff` per voce.

- **Dovuto**: 2016‑18 fino al 12/2018 → 2019 → 2020 → 2021 a regime (IVC zero:
  assorbita, art. 57 c.2) → dal 04/2022 anticipazione 2022‑24 sul tabellare 2021
  (set IVC `a2022`: 10,85/8,68 da aprile, 18,08/14,47 da luglio 2022, 0,3% e 0,5%)
  → dal 2024 CCNL 2022‑24 con IVC 2025‑27.
- **Percepito**: per default il contratto precedente a ogni rinnovo, fino al mese
  successivo alla firma (2016‑18 fino al 07/2024, 2019‑21 fino al 02/2026, poi
  2022‑24), con l'IVC del suo set; oppure un contratto scelto per tutto il periodo.
- **Posizione**: `cfg.posizione` è quella in godimento prima dei rinnovi. Per
  ogni rinnovo raggiunto dal regime: + `incr` (solo 2024) e poi minimo se sotto.
  Il percepito usa la stessa regola per il regime che applica.
- **Galleggiamento** = EQ − (posizione + maggiorazione di posizione), con
  massimale opzionale; ricalcolato in ogni mese su entrambi i lati.
- **13ª** = 1/12 della somma delle voci dei mesi dell'anno nel periodo, esposta a
  dicembre o nell'ultimo mese; senza maggiorazione se erogata su 12 mensilità.
- **Emolumento 12/2023**: `anni[2024].diffNetta = diff.lordo − emolumento`;
  avviso se il 2024 non è nel periodo.
- **Riparto**: in percentuale riduce la maggiorazione su dovuto e percepito
  (voce `riparto`); in importo fisso non si applica e genera un avviso.
- Importi al centesimo per voce e per mese, come sul cedolino.

La pagina 2 usa già il motore (sviluppo del dovuto con colonne percepito e
differenza, totali dovuto/percepito/differenza, scelta del regime del
percepito, campo emolumento, tabella dei regimi del periodo); la pagina 1 è
invariata (verificata nel browser su 76 configurazioni: unica differenza il
valore citato nell'errore del tabellare C 2019/2020, ora conforme al testo).

**Punti aperti per T5 e oltre**
- *(fatto in T4: celle del percepito modificabili, subtotali per anno a video e nel CSV)*
- Dal 1.1.2025 (art. 60 c.7) la maggiorazione di posizione CCNI 2003 è
  disapplicata, salvo conservazione della posizione in godimento se più alta fino
  a scadenza dell'incarico: il motore oggi la mantiene per tutto il periodo.
- La riga IVC 2016‑18 «fino al 31.03.2019» (24,99) entra nel percepito del 2019‑2020
  ma non nel dovuto 2019‑21: verificare la natura di quella voce.
- Avviso «una tantum 1,5% L. 197/2022» della vecchia pagina 2 rimosso: non
  concorre alla base né alle differenze.

## T4 — come funziona il prospetto (13/10/2026)

Pagina 2 di `index.html`: la vecchia tabella larga («Sviluppo mensile») è sostituita
dal **Prospetto differenze**. Test del motore: `node --test`, ora 33 casi.

- **Righe**: per ogni mese una riga di testata con il lordo (dovuto / percepito /
  differenza) e sotto una riga per ogni voce valorizzata nel periodo (le voci a zero
  ovunque non compaiono). I ratei di 13ª sono righe a parte, in corsivo e non modificabili
  (si ricalcolano dai mesi). Dopo l'ultimo mese di ogni anno: *Subtotale anno* per voce;
  nel 2024, se indicato, anche «Emolumento di dicembre 2023 (a dedurre)» e «Differenza al
  netto». Con più anni nel periodo: *Arretrati anni precedenti* (anni < anno solare in
  corso) e *Anno corrente* (o «e successivi»), poi *Totale periodo*.
- **Motore** (nuove funzioni pure, in `<script id="motore">`):
  `periodo(..., {modifiche})` con `modifiche = {"2019-03": {v50: 3300.02}}`;
  `propaga(modifiche, mesi, ym, voce, valore)`, `ripristina(modifiche, ym, voce)`,
  `ripartisciAnni(anni, annoRif)`. Ogni riga di `periodo()` ha `modificate` (voci
  corrette a mano). Celle modificabili: V.50, V.92, IVC, RIA, maturato, posizione,
  maggiorazione di posizione, galleggiamento, maggiorazione, quota altri enti.
  Tabellare e lordo sono somme. `baseMagg()` estratta da `vociMese` (stessa somma, nessuna
  regola cambiata).
- **Regole sulle modifiche**: la cella modificata sostituisce il calcolato. La
  maggiorazione (e la quota altri enti) modificata a mano resta com'è; se non è toccata
  si ricalcola dalla base con le altre modifiche. Il galleggiamento non toccato **non** si
  ricalcola se si modifica la posizione (lo chiede solo la regola sulla maggiorazione).
  Un valore uguale al calcolato, o il campo vuoto, vale «nessuna modifica».
- **Propaga** copia il *valore assoluto* della cella sul mese e su tutti i successivi del
  periodo (sovrascrive eventuali altre modifiche di quella voce): se in quei mesi il
  calcolato cambia (es. dopo il rinnovo) il valore propagato resta quello.
- **Memoria**: le modifiche vivono in una variabile e si azzerano cambiando fascia,
  classe, «dal», «al» o i pulsanti rapidi del periodo. Cambiando il regime del percepito
  si aggiornano solo le celle non modificate. Nessun salvataggio (è T5).
- **CSV pagina 2**: `Mese;Voce;Dovuto;Percepito;Differenza`, separatore `;`, importi in
  formato italiano come prima, stesse righe del prospetto (anche subtotali, arretrati,
  totale). Il CSV non segna quali celle sono state modificate a mano.
- **Avvisi** di `periodo()` invariati (riparto in importo fisso, emolumento fuori periodo).
- **Verifica nel browser** (periodo 2019-01 → 2025-12, fasce A, B e C): una cella V.50
  di giugno 2020 modificata e propagata a dicembre 2025; dovuto invariato, differenza
  totale = somma dei mesi = somma dei subtotali, «Ripristina tutto» riporta ai valori
  calcolati. Pagina 1 confrontata con la versione precedente su 5 contratti × classi ×
  4 varianti di opzioni (oltre 200 configurazioni): nessuna differenza.
- **Da fare in T6**: le etichette di voce a video («V.50 Stipendio», «V.53 IVC»…) sono
  quelle già presenti, non nuovi riferimenti; la pulizia dei codici resta a T6.

## T5 — come funzionano pratica e bozza (13/10/2026)

Barra «Pratica» sopra le due pagine: nome libero, **Salva pratica**, **Apri pratica**. Test: `node --test`, ora 43 casi
(10 nuovi, scritti prima del codice).

- **Motore** (`<script id="motore">`, funzioni pure): `Motore.serializzaPratica(stato, {nomePratica, data})` e
  `Motore.validaPratica(file)` → `{ok, stato, nomePratica, avvisi}` oppure `{ok:false, errori[]}` (tutti gli errori,
  non solo il primo). Lo stato è letto/riapplicato dalla pagina con `leggiStato()` / `applicaStato()`.
- **File** `{versione:1, nomePratica, salvataIl, stato}`. `stato`: contratto, fascia, classe, ivcScelta (`rN`/`zero`/`man`)
  e ivcValore, tabellare, posizione, ria, maturato, maggPos, posEQ, perc, mensilita, base{ria,mat,pos,magg,gall},
  gallCap, incr15, riparto{tipo,valore}, enti[{nome,ab}], dal, al, regimePercepito, emolumento2023, modifiche.
  Il tabellare è nel file perché il campo è modificabile. **Nessun campo per dati personali**: il serializzatore
  copia solo questi campi; in lettura i campi non previsti sono ignorati e segnalati per nome (mai riportati nello stato).
  Il nome della pratica è testo libero: il segnaposto ricorda di non metterci dati personali.
- **Validazione**: versione, tipi, intervalli (percentuali 0–100, importi ≥ 0 e < 10⁷), contratto/classe/fascia esistenti,
  scelta IVC esistente per il contratto, `dal`/`al` vuoti o AAAA-MM, regime del percepito, modifiche: mese AAAA-MM
  **dentro il periodo**, solo voci di `CELLE_MODIFICABILI`, valori numerici (anche negativi: la quota altri enti lo è).
  File > 1 MB rifiutato. Un file non valido non tocca la pagina; l'applicazione è protetta da try/catch con ripristino
  dello stato precedente.
- **Ordine di applicazione**: prima i campi (contratto, fascia, classe, IVC, tabellare, ecc.), poi `modifiche`, poi `calcola()`;
  i gestori «change» di fascia, classe e periodo (che azzerano le modifiche) non scattano perché i valori si impostano da codice.
- **Bozza**: chiave `localStorage` `convenzione-segretario:bozza`, stesso formato del file, scritta 600 ms dopo ogni
  ricalcolo (hook in `calcolaPeriodo()`, che `calcola()` richiama sempre) e al cambio del nome. Scrive solo se lo stato è valido
  (altrimenti conserva l'ultima bozza buona). Ogni accesso è in try/catch. All'apertura, se c'è una bozza valida, banner
  «Ripristina bozza» / «Scarta»: **finché non si sceglie, la bozza non viene sovrascritta** (le modifiche non vanno in bozza).
  Una bozza corrotta viene eliminata in silenzio. **Azzera** (con conferma) cancella anche la bozza.
- **Verifica nel browser** (fascia B, 2019-01 → 2025-12, V.50 di marzo 2019 modificata e propagata fino a dicembre 2025 = 82 celle,
  RIA 120,50, emolumento 150): salva → ricarica → Ripristina bozza, e Apri pratica da pagina default: pagina 1, prospetto,
  totali, KPI e le 82 celle evidenziate **identici** al testo prima del salvataggio. Secondo giro con stato molto diverso
  (CCNL 2022‑24, fascia A, IVC manuale, riparto, 3 enti, 12 mensilità, regime del percepito scelto, 15 celle modificate):
  identico. File corrotti (non JSON, vuoto, array, versione 9, fascia/classe/mese/voce errati): rifiutati con messaggio,
  pagina invariata. Localstorage bloccato (metodi che lanciano): nessun errore. Azzera: bozza rimossa, nessun banner.
  Pagina 1 confrontata con la versione precedente su 150 configurazioni (5 contratti × fasce × classi × 5 varianti di opzioni):
  hash del testo identico.
- **Limiti noti**: la barra pratica è sopra entrambe le pagine, non nella stampa; il CSV non segna le celle modificate
  (come in T4); aprire una pratica non risolve un banner di bozza ancora in attesa. Nessun riferimento normativo nuovo (T6).
