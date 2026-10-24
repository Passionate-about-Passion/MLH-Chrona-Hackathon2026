import assert from "node:assert/strict";
import { parseLibrary, parseMensa } from "./campusLive.ts";

const html = `<div>Geringe Auslastung: 15 % von 44 Arbeits&shy;plätzen sind belegt <span>15&nbsp;%</span> Ausleihzentrum Schloss Westflügel Öffnungszeiten
<div>Hohe Auslastung: 90 % von 380 Arbeits­plätzen sind belegt</div> Bibliotheks­bereich A3 Fachbibliothek
<div>Mittlere Auslastung: 61 % von 675 Arbeitsplätzen sind belegt</div> Bibliotheksbereich Schloss Schneckenhof</div>`;
const r = parseLibrary(html);
assert.deepEqual(r.map((x) => [x.building, x.percent, x.seats, x.level]), [["W", 15, 44, "gering"], ["A3", 90, 380, "hoch"], ["S", 61, 675, "mittel"]]);
assert.deepEqual(parseLibrary("kaputt"), []);

const m = parseMensa(`<table><tr data-menuid="1"><td class="speiseplan-table-menu-headline"><strong> Menü 1 </strong></td>
<td class="speiseplan-table-menu-content">Frikadelle <sup>(8,S)</sup>, Salzkartoffeln <sup>(Vga)</sup></td>
<td class="speiseplan-table-col-last"><i class="price">4,00 &euro;</i></td></tr></table>`);
assert.deepEqual(m, [{ line: "Menü 1", title: "Frikadelle, Salzkartoffeln", price: "4,00 €" }]);
