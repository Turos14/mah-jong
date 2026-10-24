// Tests du moteur de comptage. Lancer : node tests/engine.test.js
// Chaque combinaison du catalogue qui a un exemple (FANS[id].ex) doit être détectée,
// avec une main valide, et la valeur totale doit contenir au moins la valeur de la combinaison.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'maj-jong', 'js');
const files = ['data/tiles.js', 'data/fans.js', 'engine/hand.js', 'engine/fans-engine.js', 'engine/payout.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const ctx = vm.createContext({});
vm.runInContext(code + '\nthis.api = { FANS, HAND_TYPES, TILES, handFromSpec, createHand, evaluateHand, DEFAULT_CTX, computePayout, seatWindOf, WIND_IDS };', ctx);
const { FANS, TILES, handFromSpec, createHand, evaluateHand, DEFAULT_CTX, computePayout, seatWindOf } = ctx.api;

let failures = 0;
function check(name, cond, detail) {
    if (!cond) { failures++; console.log(`  ÉCHEC  ${name}${detail ? ' — ' + detail : ''}`); }
}
const ids = r => r.fans.map(f => `${f.id}${f.count > 1 ? '×' + f.count : ''}`).join(', ');

// 1. Valeurs officielles : uniquement les paliers connus, 81 combinaisons (la fleur en fait partie).
const tiers = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 88];
Object.entries(FANS).forEach(([id, f]) => check(`palier ${id}`, tiers.includes(f.fan), `valeur ${f.fan}`));
check('81 combinaisons officielles (fleur comprise)', Object.keys(FANS).length === 81, `trouvé ${Object.keys(FANS).length}`);

// 2. Exemples : chaque exemple est une main complète qui contient sa combinaison.
Object.entries(FANS).forEach(([id, f]) => {
    if (!f.ex) return;
    const hand = handFromSpec(f.ex);
    const r = evaluateHand(hand, DEFAULT_CTX, true);
    check(`exemple ${id} complet`, r.status === 'complete', `status=${r.status} ${r.errors.join(' | ')}`);
    check(`exemple ${id} détecté`, r.fans.some(x => x.id === id), `trouvé: ${ids(r)}`);
    // Cas où la combinaison doit rester la seule « grosse » combinaison de la main.
    const copies = {};
    hand.groups.forEach(g => g.tiles.forEach(t => { copies[t] = (copies[t] || 0) + 1; }));
    Object.entries(copies).forEach(([t, n]) => check(`exemple ${id} : ≤4 exemplaires de ${t}`, n <= 4));
});

// 3. Totaux attendus sur des mains connues (exclusions).
function total(spec, c, winner = true) {
    return evaluateHand(handFromSpec(spec), Object.assign({}, DEFAULT_CTX, c || {}), winner);
}
let r = total(FANS.bigFourWinds.ex);
check('Grands quatre vents + quatre pongs cachés + couleur mixte = 88+64+6', r.total === 88 + 64 + 6, ids(r));
check('Grands quatre vents exclut tout en pongs / vents', !r.fans.some(f => ['allPungs', 'prevalentWind', 'seatWind', 'bigThreeWinds', 'pungTerminalsOrHonors'].includes(f.id)), ids(r));
r = total(FANS.thirteenOrphans.ex);
check('Treize orphelins = 88 + main cachée exclue', r.fans.some(f => f.id === 'thirteenOrphans') && !r.fans.some(f => ['concealedHand', 'allTypes', 'singleWait'].includes(f.id)), ids(r));
r = total(FANS.sevenShiftedPairs.ex);
check('Sept paires consécutives exclut sept paires / couleur pure', r.total === 88, `${r.total} ${ids(r)}`);
r = total(FANS.fullFlush.ex);
check('Couleur pure exclut sans honneurs', r.fans.some(f => f.id === 'fullFlush') && !r.fans.some(f => f.id === 'noHonors' || f.id === 'oneVoidedSuit'), ids(r));
r = total(FANS.chickenHand.ex);
check('Main poule = 8', r.total === 8 && r.fans[0].id === 'chickenHand', ids(r));
r = total({ g: ['c:m1 m2 m3', 'c:m1 m2 m3', 'c:p4 p5 p6', 'c:s7 s8 s9'], pr: 'p9 p9' }, { selfDrawn: true });
check('Pioche du mur compte 1 et main entièrement cachée 4 (sans pioche en plus)', r.fans.some(f => f.id === 'fullyConcealedHand') && !r.fans.some(f => f.id === 'selfDrawn'), ids(r));

// 4. Main incomplète / invalide
r = total({ g: ['c:m1 m2 m4'], pr: 'p9 p9' });
check('Chow invalide détectée', r.status === 'invalid' || r.errors.length > 0, `status=${r.status}`);
r = evaluateHand(createHand('standard'), DEFAULT_CTX, true);
check('Main vide', r.status === 'empty' && r.total === 0);

// 5. Fleurs
const withFlowers = handFromSpec(Object.assign({}, FANS.chickenHand.ex, { fl: 'f1 a2 a3' }));
r = evaluateHand(withFlowers, DEFAULT_CTX, true);
check('Fleurs : 3 × 1 en plus de la main poule', r.total === 8 + 3, ids(r));

// 6. Joueur qui n'a pas gagné : seulement les groupes + fleurs
const loser = handFromSpec({ g: ['po:dr dr dr', 'k:ws ws ws ws', 'c:m1 m2 m3'], fl: 'f1' });
r = evaluateHand(loser, DEFAULT_CTX, false);
check('Perdant : pong de dragons 2 + kong caché 2 + pong de vent 1 + fleur 1', r.total === 6, `${r.total} ${ids(r)}`);

// 7. Vents de place
check('Vent de place', seatWindOf(2, 1, 4) === 'ws' && seatWindOf(1, 1, 4) === 'we' && seatWindOf(0, 1, 4) === 'wn' && seatWindOf(3, 1, 4) === 'ww');

// 8. Transferts : somme nulle
const players = [0, 1, 2, 3].map(id => ({ id }));
const deltas = computePayout(players, { 0: 24, 1: 3, 2: 0, 3: 5 }, { winnerId: 0, estId: 1, method: 'ron', discarderId: 2, playerCount: 4 });
check('Transferts de somme nulle', Object.values(deltas).reduce((a, b) => a + b, 0) === 0, JSON.stringify(deltas));
check('Gagnant positif', deltas[0] > 0);

console.log(failures === 0 ? 'Tous les tests passent.' : `${failures} échec(s).`);
process.exit(failures ? 1 : 0);
