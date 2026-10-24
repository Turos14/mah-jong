// --- MODÈLE DE MAIN ---
// Une main = { type, groups: [{ kind, open, tiles: [id|null, ...] }], flowers: [id|null × 8] }.
// Les groupes dépendent du type de mah-jong (voir createHand).

const GROUP_SIZE = { chow: 3, pung: 3, kong: 4, knit: 3, pair: 2, free: 14 };
const GROUP_LABELS = { chow: 'Suite', pung: 'Brelan', kong: 'Carré', knit: 'Tressé', pair: 'Paire', free: 'Tuiles' };
const FLOWER_SLOTS = 8;

function makeGroup(kind, open) {
    return { kind, open: !!open, tiles: new Array(GROUP_SIZE[kind]).fill(null) };
}

function createHand(type) {
    let groups;
    switch (type) {
        case 'knittedStraight':
            groups = [makeGroup('knit'), makeGroup('knit'), makeGroup('knit'), makeGroup('chow'), makeGroup('pair')];
            break;
        case 'sevenPairs':
            groups = Array.from({ length: 7 }, () => makeGroup('pair'));
            break;
        case 'orphans':
        case 'knittedHonors':
            groups = [makeGroup('free')];
            break;
        default:
            type = 'standard';
            groups = [makeGroup('chow'), makeGroup('chow'), makeGroup('chow'), makeGroup('chow'), makeGroup('pair')];
    }
    return { type, groups, flowers: new Array(FLOWER_SLOTS).fill(null) };
}

// Change le type d'un groupe (suite/brelan/carré) en conservant les tuiles déjà posées.
function setGroupKind(group, kind) {
    const old = group.tiles;
    group.kind = kind;
    group.tiles = new Array(GROUP_SIZE[kind]).fill(null).map((_, i) => old[i] || null);
}

// Construit une main à partir d'une description compacte, ex.
// { t: 'standard', g: ['c:m1 m2 m3', 'po:we we we', ...], pr: 'p5 p5', fl: 'f1 a2' }
// Lettres de groupe : c suite, p brelan, k carré, n tressé, x paire, f tuiles libres ; 'o' final = exposé.
function handFromSpec(spec) {
    const letters = { c: 'chow', p: 'pung', k: 'kong', n: 'knit', x: 'pair', f: 'free' };
    const hand = { type: spec.t || 'standard', groups: [], flowers: new Array(FLOWER_SLOTS).fill(null) };
    const add = (kindKey, open, tilesStr) => {
        const g = makeGroup(letters[kindKey], open);
        tilesStr.trim().split(/\s+/).forEach((t, i) => { g.tiles[i] = t; });
        hand.groups.push(g);
    };
    (spec.g || []).forEach(s => {
        const [head, tilesStr] = s.split(':');
        add(head[0], head.endsWith('o'), tilesStr);
    });
    if (spec.pr) add('x', false, spec.pr);
    if (spec.fl) spec.fl.trim().split(/\s+/).forEach((t, i) => { hand.flowers[i] = t; });
    return hand;
}

// Tous les identifiants posés dans la main (hors fleurs).
function handTiles(hand) {
    const out = [];
    hand.groups.forEach(g => g.tiles.forEach(t => { if (t) out.push(t); }));
    return out;
}

// Nombre d'exemplaires déjà utilisés d'une tuile (fleurs comprises).
function countUsed(hand, id) {
    let n = 0;
    hand.groups.forEach(g => g.tiles.forEach(t => { if (t === id) n++; }));
    hand.flowers.forEach(t => { if (t === id) n++; });
    return n;
}

function maxCopies(id) { return isBonus(id) ? 1 : MAX_COPIES; }

// Vent de la place d'un joueur selon l'Est de la manche.
function seatWindOf(playerId, estId, playerCount) {
    return WIND_IDS[((playerId - estId) % playerCount + playerCount) % playerCount];
}
