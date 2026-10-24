// --- CATALOGUE DES TUILES ---
// Identifiants : p1-p9 cercles, s1-s9 bambous, m1-m9 caractères,
// we/ws/ww/wn vents (Est, Sud, Ouest, Nord), dr/dg/dw dragons (rouge, vert, blanc),
// f1-f4 fleurs, a1-a4 saisons. Les images sont dans assets/tiles/<id>.png.

const SUIT_NAMES = { p: 'Cercles', s: 'Bambous', m: 'Caractères' };
const WIND_IDS = ['we', 'ws', 'ww', 'wn'];
const WIND_NAMES = { we: 'Est', ws: 'Sud', ww: 'Ouest', wn: 'Nord' };
const DRAGON_IDS = ['dr', 'dg', 'dw'];
const BONUS_IDS = ['f1', 'f2', 'f3', 'f4', 'a1', 'a2', 'a3', 'a4'];

const TILES = {};
const TILE_ORDER = [];

(function buildTiles() {
    const add = (id, props) => { TILES[id] = Object.assign({ id }, props); TILE_ORDER.push(id); };
    ['p', 's', 'm'].forEach(suit => {
        for (let rank = 1; rank <= 9; rank++) {
            add(suit + rank, { kind: 'suit', suit, rank, label: `${rank} de ${SUIT_NAMES[suit]}` });
        }
    });
    const windLabels = { we: "Vent d'Est", ws: 'Vent du Sud', ww: "Vent d'Ouest", wn: 'Vent du Nord' };
    WIND_IDS.forEach(id => add(id, { kind: 'wind', label: windLabels[id] }));
    add('dr', { kind: 'dragon', label: 'Dragon rouge' });
    add('dg', { kind: 'dragon', label: 'Dragon vert' });
    add('dw', { kind: 'dragon', label: 'Dragon blanc' });
    [['f1', 'Prunier'], ['f2', 'Orchidée'], ['f3', 'Chrysanthème'], ['f4', 'Bambou (fleur)'],
    ['a1', 'Printemps'], ['a2', 'Été'], ['a3', 'Automne'], ['a4', 'Hiver']]
        .forEach(([id, label]) => add(id, { kind: 'bonus', label }));
})();

const GREEN_TILES = ['s2', 's3', 's4', 's6', 's8', 'dg'];
const REVERSIBLE_TILES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p8', 'p9', 's2', 's4', 's5', 's6', 's8', 's9', 'dw'];
const MAX_COPIES = 4;

function tileSrc(id) { return `assets/tiles/${id}.png`; }
function isSuited(id) { return TILES[id].kind === 'suit'; }
function isHonor(id) { return TILES[id].kind === 'wind' || TILES[id].kind === 'dragon'; }
function isBonus(id) { return TILES[id].kind === 'bonus'; }
function isTerminal(id) { return isSuited(id) && (TILES[id].rank === 1 || TILES[id].rank === 9); }
function tileRank(id) { return TILES[id].rank; }
function tileSuit(id) { return TILES[id].suit; }
