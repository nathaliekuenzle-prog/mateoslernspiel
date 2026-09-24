document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

// ====== LEVEL & FORTSCHRITT ======
const PRO_LEVEL = 10;
let punkte = parseInt(localStorage.getItem('mateo_punkte') || '0');
function zeigeFortschritt() {
  const level = Math.floor(punkte / PRO_LEVEL) + 1;
  document.getElementById('sterneZaehler').textContent = "LEVEL " + level + " · " + (punkte % PRO_LEVEL) + "/" + PRO_LEVEL;
  const badge = document.getElementById('stufeAnzeige');
  if (badge) badge.textContent = "LEVEL " + level;
}
function richtigGezaehlt(meldungElement) {
  const vorher = Math.floor(punkte / PRO_LEVEL);
  punkte++; localStorage.setItem('mateo_punkte', punkte);
  const nachher = Math.floor(punkte / PRO_LEVEL);
  zeigeFortschritt();
  if (nachher > vorher) {
    konfetti(); tonLevelUp();
    if (meldungElement) meldungElement.textContent = "🎉 LEVEL " + (nachher + 1) + "! 🎉";
  }
  if (meldungElement) { meldungElement.classList.remove('jubel'); void meldungElement.offsetWidth; meldungElement.classList.add('jubel'); }
}
function konfetti() {
  const symbole = ["🪶", "☀️", "🐎", "🏕️", "⭐", "🍂"];
  for (let i = 0; i < 45; i++) {
    const teil = document.createElement('div');
    teil.className = 'konfetti';
    teil.textContent = symbole[Math.floor(Math.random() * symbole.length)];
    teil.style.left = Math.random() * 100 + "vw";
    teil.style.animationDelay = (Math.random() * 0.6) + "s";
    document.body.appendChild(teil);
    setTimeout(() => teil.remove(), 3800);
  }
}

// ====== RESET per LANGEM DRÜCKEN ======
function fortschrittZuruecksetzen() {
  if (confirm("Wirklich Mateos Fortschritt löschen?")) { localStorage.clear(); location.reload(); }
}
function langesDruecken(el) {
  if (!el) return;
  let timer = null;
  const start = () => { timer = setTimeout(fortschrittZuruecksetzen, 1200); };
  const stop = () => clearTimeout(timer);
  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchend', stop); el.addEventListener('touchmove', stop);
  el.addEventListener('mousedown', start); el.addEventListener('mouseup', stop); el.addEventListener('mouseleave', stop);
}
langesDruecken(document.getElementById('sterneZaehler'));
langesDruecken(document.getElementById('stufeAnzeige'));

// ====== TÖNE ======
let audioCtx = null;
function spieleTon(f, s, d, typ = 'sine') {
  const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
  osc.type = typ; osc.frequency.value = f; osc.connect(gain); gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime + s);
  gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + s + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + s + d);
  osc.start(audioCtx.currentTime + s); osc.stop(audioCtx.currentTime + s + d);
}
function tonRichtig() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); spieleTon(523,0,0.15); spieleTon(659,0.15,0.15); spieleTon(784,0.30,0.25); }
function tonLevelUp() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); spieleTon(523,0,0.15); spieleTon(659,0.15,0.15); spieleTon(784,0.30,0.15); spieleTon(1047,0.45,0.40); }
function tonFalsch() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); spieleTon(330,0,0.15,'triangle'); spieleTon(247,0.15,0.25,'triangle'); }

// ====== BUCHSTABEN-GEDÄCHTNIS (Spiel 1) ======
function ladeGewichte(k, el) { const g = localStorage.getItem(k); if (g) return JSON.parse(g); const n = {}; el.forEach(e => n[e] = 1); return n; }
function speichereGewichte(k, g) { localStorage.setItem(k, JSON.stringify(g)); }
function waehleGewichtet(g, el) { let s = 0; el.forEach(e => s += g[e]); let z = Math.random() * s; for (const e of el) { z -= g[e]; if (z <= 0) return e; } return el[0]; }
function waehleOhneWiederholung(g, el, letztes) { if (el.length <= 1) return el[0]; let w, v = 0; do { w = waehleGewichtet(g, el); v++; } while (w === letztes && v < 12); return w; }
function aktualisiereGewicht(g, e, ok) { if (ok) g[e] = Math.max(0.3, g[e] - 0.3); else g[e] = Math.min(6, g[e] + 1.5); }

// ====== AUFBAUENDES BUCHSTABEN-SYSTEM ======
const buchstabenStufen = [
  ["M","A","T","E","O","I","L","K","P","H","N"], // Stufe 1
  ["S","U","B","D"],                             // Stufe 2
  ["R","F","G","W","Z"],                         // Stufe 3
  ["C","J","Q","V","X","Y"]                      // Stufe 4
];
let aktuelleStufe = parseInt(localStorage.getItem('mateo_stufe') || '0');
function aktiveBuchstaben() { let l = []; for (let i = 0; i <= aktuelleStufe && i < buchstabenStufen.length; i++) l = l.concat(buchstabenStufen[i]); return l; }
function hatSchwierigeKombi(w) { return ["SCH","CH","CK","ST","PF"].some(k => w.includes(k)); }
function pruefeStufenAufstieg() {
  if (aktuelleStufe >= buchstabenStufen.length - 1) return;
  if (buchstabenStufen[aktuelleStufe].every(b => gewichteBuchstaben[b] <= 0.5)) {
    aktuelleStufe++; localStorage.setItem('mateo_stufe', aktuelleStufe);
  }
}

// ====== BILDSCHIRME ======
function zeigeMenue() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('aktiv'));
  document.getElementById('menue').classList.add('aktiv');
  document.getElementById('sterneZaehler').style.display = 'none';
  zeigeFortschritt();
}
function spielStart(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('aktiv'));
  document.getElementById(id).classList.add('aktiv');
  document.getElementById('sterneZaehler').style.display = 'block';
}
function zeigeSpiel1() { spielStart('spiel1'); neueAufgabe1(); }
function zeigeSpiel2() { spielStart('spiel2'); neueAufgabe2(); }
function zeigeSpiel3() { spielStart('spiel3'); neueAufgabe3(); }
function mischen(l) { return l.slice().sort(() => Math.random() - 0.5); }
let letztes1 = "", letztes2 = "", letztes3 = "";

// ====== SPIEL 1 ======
const alleBuchstaben = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
let gewichteBuchstaben = ladeGewichte('mateo_buchstaben', alleBuchstaben);
function neueAufgabe1() {
  document.getElementById('meldung1').textContent = "";
  const aktive = aktiveBuchstaben();
  const richtiger = waehleOhneWiederholung(gewichteBuchstaben, aktive, letztes1);
  letztes1 = richtiger;
  document.getElementById('grosserBuchstabe').textContent = richtiger;
  const falsche = mischen(aktive.filter(b => b !== richtiger)).slice(0, 2);
  const optionen = mischen([richtiger, ...falsche]);
  const auswahl = document.getElementById('auswahl'); auswahl.innerHTML = "";
  optionen.forEach(b => {
    const k = document.createElement('button');
    k.className = 'buchstaben-knopf'; k.textContent = b.toLowerCase();
    k.onclick = () => pruefe1(k, b, richtiger); auswahl.appendChild(k);
  });
}
function pruefe1(knopf, gewaehlt, richtiger) {
  if (gewaehlt === richtiger) {
    knopf.classList.add('richtig');
    document.getElementById('meldung1').textContent = "🎉 SUPER! 🎉";
    tonRichtig(); richtigGezaehlt(document.getElementById('meldung1'));
    aktualisiereGewicht(gewichteBuchstaben, richtiger, true);
    speichereGewichte('mateo_buchstaben', gewichteBuchstaben);
    pruefeStufenAufstieg(); setTimeout(neueAufgabe1, 1500);
  } else {
    knopf.classList.add('falsch');
    document.getElementById('meldung1').textContent = "🤔 PROBIER NOCHMAL!";
    tonFalsch();
    aktualisiereGewicht(gewichteBuchstaben, richtiger, false);
    speichereGewichte('mateo_buchstaben', gewichteBuchstaben);
  }
}

// ====== WÖRTER (Tiere · Gegenstände · Fahrzeuge) ======
const woerter = [
  { emoji: "👵", wort: "OMA" }, { emoji: "👴", wort: "OPA" }, { emoji: "👩", wort: "MAMA" },
  { emoji: "🏕️", wort: "TIPI" }, { emoji: "🦙", wort: "LAMA" }, { emoji: "🦈", wort: "HAI" },
  { emoji: "🐫", wort: "KAMEL" }, { emoji: "💡", wort: "LAMPE" }, { emoji: "📦", wort: "PAKET" },
  { emoji: "⛑️", wort: "HELM" }, { emoji: "🎹", wort: "PIANO" }, { emoji: "🎵", wort: "NOTE" },
  { emoji: "🧥", wort: "MANTEL" }, { emoji: "🌴", wort: "PALME" }, { emoji: "🍅", wort: "TOMATE" },
  { emoji: "🍈", wort: "MELONE" }, { emoji: "🎬", wort: "KINO" }, { emoji: "🏨", wort: "HOTEL" },
  { emoji: "🪐", wort: "PLANET" },
  { emoji: "🐭", wort: "MAUS" }, { emoji: "🐰", wort: "HASE" }, { emoji: "🐶", wort: "HUND" },
  { emoji: "🫏", wort: "ESEL" }, { emoji: "🦉", wort: "EULE" }, { emoji: "🐝", wort: "BIENE" },
  { emoji: "🐼", wort: "PANDA" }, { emoji: "🚗", wort: "AUTO" }, { emoji: "🚌", wort: "BUS" },
  { emoji: "🌳", wort: "BAUM" }, { emoji: "🌙", wort: "MOND" }, { emoji: "👃", wort: "NASE" },
  { emoji: "🍌", wort: "BANANE" }, { emoji: "🪡", wort: "NADEL" }, { emoji: "🧹", wort: "BESEN" },
  { emoji: "🌷", wort: "BLUME" },
  { emoji: "🐱", wort: "KATZE" }, { emoji: "🦔", wort: "IGEL" }, { emoji: "🐋", wort: "WAL" },
  { emoji: "🐯", wort: "TIGER" }, { emoji: "🐬", wort: "DELFIN" }, { emoji: "🦓", wort: "ZEBRA" },
  { emoji: "🐛", wort: "WURM" }, { emoji: "🍴", wort: "GABEL" }, { emoji: "🌹", wort: "ROSE" },
  { emoji: "🛋️", wort: "SOFA" }, { emoji: "🕯️", wort: "KERZE" }, { emoji: "🪣", wort: "EIMER" },
  { emoji: "🏗️", wort: "KRAN" }, { emoji: "🚂", wort: "ZUG" }, { emoji: "🚀", wort: "RAKETE" },
  { emoji: "🐦", wort: "VOGEL" }, { emoji: "🏺", wort: "VASE" }, { emoji: "🚕", wort: "TAXI" },
  { emoji: "🚲", wort: "VELO" }
];
function findeEmoji(w) { return woerter.find(x => x.wort === w).emoji; }

// ====== MEISTERN: korrekt gelöste Wörter kommen nicht wieder ======
let gemeistert2 = JSON.parse(localStorage.getItem('mateo_gemeistert2') || '[]');
let gemeistert3 = JSON.parse(localStorage.getItem('mateo_gemeistert3') || '[]');
function speichereGemeistert() {
  localStorage.setItem('mateo_gemeistert2', JSON.stringify(gemeistert2));
  localStorage.setItem('mateo_gemeistert3', JSON.stringify(gemeistert3));
}
function verfuegbareWoerter(gemeistert) {
  const aktive = aktiveBuchstaben();
  const passt = w => !hatSchwierigeKombi(w.wort) && w.wort.split("").every(b => aktive.includes(b));
  let liste = woerter.filter(w => passt(w) && !gemeistert.includes(w.wort));
  if (liste.length === 0) { gemeistert.length = 0; speichereGemeistert(); liste = woerter.filter(passt); }
  return liste;
}
function zufallOhneWiederholung(liste, letztes) {
  if (liste.length <= 1) return liste[0];
  let w, v = 0;
  do { w = liste[Math.floor(Math.random() * liste.length)]; v++; } while (w === letztes && v < 12);
  return w;
}

// ====== SPIEL 2 ======
let aktuellesWort = "", naechsterIndex = 0, fehler2 = false;
function neueAufgabe2() {
  document.getElementById('meldung2').textContent = "";
  naechsterIndex = 0; fehler2 = false;
  const namen = verfuegbareWoerter(gemeistert2).map(w => w.wort);
  aktuellesWort = zufallOhneWiederholung(namen, letztes2);
  letztes2 = aktuellesWort;
  document.getElementById('bild2').textContent = findeEmoji(aktuellesWort);
  const zeile = document.getElementById('wortZeile'); zeile.innerHTML = "";
  for (let i = 0; i < aktuellesWort.length; i++) {
    const s = document.createElement('div'); s.className = 'slot'; s.id = 'slot' + i; zeile.appendChild(s);
  }
  const vorrat = document.getElementById('vorrat'); vorrat.innerHTML = "";
  mischen(aktuellesWort.split("")).forEach(b => {
    const k = document.createElement('button'); k.className = 'vorrat-knopf'; k.textContent = b;
    k.onclick = () => pruefe2(k, b); vorrat.appendChild(k);
  });
}
function pruefe2(knopf, gewaehlt) {
  if (gewaehlt === aktuellesWort[naechsterIndex]) {
    const s = document.getElementById('slot' + naechsterIndex);
    s.textContent = gewaehlt; s.classList.add('gefuellt'); knopf.classList.add('benutzt');
    naechsterIndex++; tonRichtig();
    if (naechsterIndex === aktuellesWort.length) {
      document.getElementById('meldung2').textContent = "🎉 SUPER! 🎉";
      richtigGezaehlt(document.getElementById('meldung2'));
      if (!fehler2 && !gemeistert2.includes(aktuellesWort)) { gemeistert2.push(aktuellesWort); speichereGemeistert(); }
      setTimeout(neueAufgabe2, 2000);
    }
  } else {
    fehler2 = true; knopf.classList.add('falsch');
    document.getElementById('meldung2').textContent = "🤔 WELCHER KOMMT ZUERST?";
    tonFalsch();
    setTimeout(() => { knopf.classList.remove('falsch'); document.getElementById('meldung2').textContent = ""; }, 800);
  }
}

// ====== SPIEL 3 ======
const tastaturReihen = ["QWERTZUIOP".split(""), "ASDFGHJKL".split(""), "YXCVBNM".split("")];
let wort3 = "", index3 = 0, fehler3 = false;
function neueAufgabe3() {
  document.getElementById('meldung3').textContent = "";
  index3 = 0; fehler3 = false;
  const namen = verfuegbareWoerter(gemeistert3).map(w => w.wort);
  wort3 = zufallOhneWiederholung(namen, letztes3);
  letztes3 = wort3;
  document.getElementById('bild3').textContent = findeEmoji(wort3);
  const zeile = document.getElementById('wortZeile3'); zeile.innerHTML = "";
  for (let i = 0; i < wort3.length; i++) {
    const s = document.createElement('div'); s.className = 'slot gruen'; s.id = 'slot3_' + i; zeile.appendChild(s);
  }
  const tastatur = document.getElementById('tastatur'); tastatur.innerHTML = "";
  tastaturReihen.forEach(reihe => {
    const r = document.createElement('div'); r.className = 'tasten-reihe';
    reihe.forEach(b => {
      const t = document.createElement('button'); t.className = 'taste'; t.textContent = b;
      t.onclick = () => pruefe3(t, b); r.appendChild(t);
    });
    tastatur.appendChild(r);
  });
}
function pruefe3(taste, gewaehlt) {
  if (gewaehlt === wort3[index3]) {
    const s = document.getElementById('slot3_' + index3);
    s.textContent = gewaehlt; s.classList.add('gefuellt'); index3++; tonRichtig();
    if (index3 === wort3.length) {
      document.getElementById('meldung3').textContent = "🎉 SUPER! 🎉";
      richtigGezaehlt(document.getElementById('meldung3'));
      if (!fehler3 && !gemeistert3.includes(wort3)) { gemeistert3.push(wort3); speichereGemeistert(); }
      setTimeout(neueAufgabe3, 2000);
    }
  } else {
    fehler3 = true; taste.classList.add('falsch');
    document.getElementById('meldung3').textContent = "🤔 PROBIER NOCHMAL!";
    tonFalsch();
    setTimeout(() => { taste.classList.remove('falsch'); document.getElementById('meldung3').textContent = ""; }, 800);
  }
}

zeigeFortschritt();
document.getElementById('sterneZaehler').style.display = 'none';
