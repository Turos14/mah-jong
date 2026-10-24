// --- MOTEUR DE COMPTAGE DES COMBINAISONS ---
// evaluateHand(hand, ctx, isWinner) -> { status, errors, warnings, fans[], total }
// ctx : { seatWind, prevalentWind, selfDrawn, lastTile: 'none'|'draw'|'claim',
//         replacement, robbing, lastCopy, wait: 'none'|'edge'|'closed'|'single' }
// Fonction pure (aucun accès au DOM) : testable depuis tests/engine.test.js.

const ORPHAN_TILES = ['p1', 'p9', 's1', 's9', 'm1', 'm9', 'we', 'ws', 'ww', 'wn', 'dr', 'dg', 'dw'];

function groupIsFull(g) { return g.tiles.every(Boolean); }

function groupIsValid(g) {
    const t = g.tiles;
    switch (g.kind) {
        case 'chow': {
            if (!t.every(isSuited) || new Set(t.map(tileSuit)).size !== 1) return false;
            const r = t.map(tileRank).sort((a, b) => a - b);
            return r[1] === r[0] + 1 && r[2] === r[1] + 1;
        }
        case 'pung': case 'kong': case 'pair':
            return t.every(x => x === t[0]) && !isBonus(t[0]);
        case 'knit': {
            if (!t.every(isSuited) || new Set(t.map(tileSuit)).size !== 1) return false;
            const r = t.map(tileRank).sort((a, b) => a - b);
            return r[1] === r[0] + 3 && r[2] === r[0] + 6;
        }
        default: return true;
    }
}

function meldFromGroup(g) {
    const first = g.tiles[0];
    const m = { kind: g.kind, open: g.kind === 'knit' ? false : g.open, tiles: g.tiles.slice(), id: first };
    if (g.kind === 'chow' || g.kind === 'knit') {
        m.suit = tileSuit(first);
        m.rank = Math.min(...g.tiles.map(tileRank));
    } else if (isSuited(first)) {
        m.suit = tileSuit(first);
        m.rank = tileRank(first);
    }
    return m;
}

function isPungLike(m) { return m.kind === 'pung' || m.kind === 'kong'; }

// Y a-t-il une combinaison de `size` éléments de `list` qui vérifie `pred` ?
function anyCombo(list, size, pred, start = 0, chosen = []) {
    if (chosen.length === size) return pred(chosen);
    for (let i = start; i < list.length; i++) {
        chosen.push(list[i]);
        const ok = anyCombo(list, size, pred, i + 1, chosen);
        chosen.pop();
        if (ok) return true;
    }
    return false;
}

function isArithmetic(ranks, steps) {
    const r = ranks.slice().sort((a, b) => a - b);
    const d = r[1] - r[0];
    return steps.includes(d) && r.every((v, i) => i === 0 || v - r[i - 1] === d);
}

// ---------- Analyse structurelle ----------

function analyzeHand(hand) {
    const errors = [];
    let complete = true;
    const melds = [];
    let pair = null;
    const free = [];

    // Doublons de tuiles
    const counts = {};
    handTiles(hand).concat(hand.flowers.filter(Boolean)).forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    Object.keys(counts).forEach(t => {
        if (counts[t] > maxCopies(t)) errors.push(`Trop d'exemplaires de « ${TILES[t].label} ».`);
    });

    hand.groups.forEach(g => {
        const filled = g.tiles.filter(Boolean).length;
        if (filled < g.tiles.length) { complete = false; }
        if (filled === 0 || filled < g.tiles.length) return;
        if (g.kind === 'free') { g.tiles.forEach(t => free.push(t)); return; }
        if (!groupIsValid(g)) {
            errors.push(`${GROUP_LABELS[g.kind]} invalide : ${g.tiles.map(t => TILES[t].label).join(', ')}.`);
            complete = false;
            return;
        }
        if (g.kind === 'pair') pair = g.tiles[0];
        if (g.kind === 'pair' && hand.type === 'sevenPairs') melds.push(meldFromGroup(g));
        else if (g.kind !== 'pair') melds.push(meldFromGroup(g));
    });

    if (hand.type === 'orphans' && free.length === 14) {
        const ok = ORPHAN_TILES.every(t => free.includes(t)) && free.every(t => ORPHAN_TILES.includes(t));
        if (!ok) { errors.push('Les treize orphelins demandent les 13 tuiles orphelines + une en double.'); complete = false; }
    }
    if (hand.type === 'knittedHonors' && free.length === 14) {
        if (!isKnittedHonors(free)) { errors.push('Combinaison irrégulière invalide : 14 tuiles différentes, tressées (147/258/369 par famille, familles différentes) + honneurs.'); complete = false; }
    }
    if (hand.type === 'knittedStraight') {
        const knits = melds.filter(m => m.kind === 'knit');
        if (knits.length === 3) {
            const suits = new Set(knits.map(m => m.suit));
            const offsets = new Set(knits.map(m => m.rank));
            if (suits.size !== 3 || offsets.size !== 3) {
                errors.push('Le dragon tressé demande 147, 258 et 369 dans trois familles différentes.');
                complete = false;
            }
        }
    }
    if (hand.type === 'sevenPairs' && melds.length === 7) { /* paires déjà validées */ }

    return { errors, complete: complete && errors.length === 0, melds, pair, free };
}

function isKnittedHonors(tiles) {
    if (new Set(tiles).size !== 14) return false;
    const bySuit = { p: [], s: [], m: [] };
    for (const t of tiles) if (isSuited(t)) bySuit[tileSuit(t)].push(tileRank(t));
    const groupsUsed = [];
    for (const suit of ['p', 's', 'm']) {
        const ranks = bySuit[suit];
        if (ranks.length === 0) continue;
        const group = ranks[0] % 3;
        if (!ranks.every(r => r % 3 === group)) return false;
        groupsUsed.push(group);
    }
    return new Set(groupsUsed).size === groupsUsed.length;
}

// ---------- Détection ----------

function detectFans(hand, an, ctx) {
    const entries = {};
    const add = (id, n = 1) => { if (n > 0) entries[id] = (entries[id] || 0) + n; };
    const melds = an.melds;
    const type = hand.type;
    const structured = type === 'standard' || type === 'knittedStraight';
    const tiles = type === 'orphans' || type === 'knittedHonors' ? an.free.slice() : handTiles(hand);

    // --- Types spéciaux ---
    if (type === 'orphans') add('thirteenOrphans');
    if (type === 'knittedHonors') add(tiles.filter(isHonor).length === 7 ? 'greaterHonorsKnitted' : 'lesserHonorsKnitted');
    if (type === 'knittedStraight') add('knittedStraight');
    if (type === 'sevenPairs') {
        const pairTiles = melds.map(m => m.id);
        const suit = isSuited(pairTiles[0]) ? tileSuit(pairTiles[0]) : null;
        const shifted = suit && pairTiles.every(t => isSuited(t) && tileSuit(t) === suit)
            && new Set(pairTiles).size === 7
            && (Math.max(...pairTiles.map(tileRank)) - Math.min(...pairTiles.map(tileRank))) === 6;
        add('sevenPairs');
        if (shifted) add('sevenShiftedPairs');
    }

    // --- Propriétés de l'ensemble des tuiles (tous types) ---
    const suitedSet = new Set(tiles.filter(isSuited).map(tileSuit));
    const honors = tiles.filter(isHonor);
    const allSuited = honors.length === 0;
    const ranksOK = pred => tiles.every(t => isSuited(t) && pred(tileRank(t)));
    if (allSuited) add('noHonors');
    if (tiles.every(isHonor)) add('allHonors');
    if (tiles.every(isTerminal)) add('allTerminals');
    if (tiles.every(t => isHonor(t) || isTerminal(t))) add('allTerminalsAndHonors');
    if (tiles.every(t => GREEN_TILES.includes(t))) add('allGreen');
    if (allSuited && suitedSet.size === 1) add('fullFlush');
    if (!allSuited && suitedSet.size === 1) add('halfFlush');
    if (suitedSet.size === 2) add('oneVoidedSuit');
    if (suitedSet.size === 3 && tiles.some(t => TILES[t].kind === 'wind') && tiles.some(t => TILES[t].kind === 'dragon')) add('allTypes');
    if (ranksOK(r => r >= 7)) add('upperTiles');
    if (ranksOK(r => r >= 4 && r <= 6)) add('middleTiles');
    if (ranksOK(r => r <= 3)) add('lowerTiles');
    if (ranksOK(r => r >= 6)) add('upperFour');
    if (ranksOK(r => r <= 4)) add('lowerFour');
    if (ranksOK(r => r >= 2 && r <= 8)) add('allSimples');
    if (tiles.every(t => REVERSIBLE_TILES.includes(t))) add('reversibleTiles');

    // --- Neuf portes (sur l'ensemble des tuiles) ---
    if (type === 'standard' && allSuited && suitedSet.size === 1 && melds.every(m => !m.open && m.kind !== 'kong') && tiles.length === 14) {
        const c = {};
        tiles.forEach(t => { c[tileRank(t)] = (c[tileRank(t)] || 0) + 1; });
        const need = [3, 1, 1, 1, 1, 1, 1, 1, 3];
        if (need.every((n, i) => (c[i + 1] || 0) >= n)) add('nineGates');
    }

    // --- Fans de structure (4 groupes + paire) ---
    if (structured && melds.length === 4 && an.pair) {
        const chows = melds.filter(m => m.kind === 'chow');
        const pungs = melds.filter(isPungLike);
        const suitedPungs = pungs.filter(m => isSuited(m.id));
        const kongs = melds.filter(m => m.kind === 'kong');
        const pair = an.pair;

        // Vents et dragons
        const windPungs = pungs.filter(m => TILES[m.id].kind === 'wind');
        const dragonPungs = pungs.filter(m => TILES[m.id].kind === 'dragon');
        if (windPungs.length === 4) add('bigFourWinds');
        else if (windPungs.length === 3) add(TILES[pair].kind === 'wind' ? 'littleFourWinds' : 'bigThreeWinds');
        if (dragonPungs.length === 3) add('bigThreeDragons');
        else if (dragonPungs.length === 2) add(TILES[pair].kind === 'dragon' ? 'littleThreeDragons' : 'twoDragonPungs');
        add('dragonPung', dragonPungs.length);
        pungs.forEach(m => {
            if (m.id === ctx.prevalentWind) add('prevalentWind');
            if (m.id === ctx.seatWind) add('seatWind');
        });
        // Brelans de bouts / vents (hors dragons, vents de place/dominant, et hors 3 vents ou plus)
        pungs.forEach(m => {
            if (isTerminal(m.id)) add('pungTerminalsOrHonors');
            else if (TILES[m.id].kind === 'wind' && m.id !== ctx.prevalentWind && m.id !== ctx.seatWind && windPungs.length < 3) add('pungTerminalsOrHonors');
        });

        // Structure globale
        if (pungs.length === 4) add('allPungs');
        if (pungs.length === 4 && suitedPungs.length === 4 && tiles.every(t => isSuited(t) && tileRank(t) % 2 === 0)) add('allEvenPungs');
        if (chows.length === 4 && !isHonor(pair)) add('allChows');
        const hasKnit = melds.some(m => m.kind === 'knit');
        if (!hasKnit && melds.every(meldHasFive) && tileRank(pair) === 5 && isSuited(pair)) add('allFives');
        if (!hasKnit && melds.every(meldIsOutside) && (isHonor(pair) || isTerminal(pair))) add('outsideHand');

        // Brelans cachés / carrés
        const concealedPungs = pungs.filter(m => !m.open).length;
        if (concealedPungs === 4) add('fourConcealedPungs');
        else if (concealedPungs === 3) add('threeConcealedPungs');
        else if (concealedPungs === 2) add('twoConcealedPungs');
        const closedKongs = kongs.filter(m => !m.open).length;
        const openKongs = kongs.length - closedKongs;
        if (kongs.length === 4) add('fourKongs');
        else if (kongs.length === 3) add('threeKongs');
        add('concealedKong', closedKongs);
        add('meldedKong', openKongs);
        if (closedKongs === 2) add('twoConcealedKongs');
        if (openKongs === 2) add('twoMeldedKongs');

        // Quatre en un (4 exemplaires sans carré)
        const tc = {};
        tiles.forEach(t => { tc[t] = (tc[t] || 0) + 1; });
        const kongIds = kongs.map(m => m.id);
        add('tileHog', Object.keys(tc).filter(t => tc[t] === 4 && !kongIds.includes(t)).length);

        // Brelans : décalés, triple, double
        if (suitedPungs.length >= 3) {
            if (anyCombo(suitedPungs, 3, c => c.every(m => m.suit === c[0].suit) && isArithmetic(c.map(m => m.rank), [1]))) add('pureShiftedPungs');
            if (anyCombo(suitedPungs, 3, c => new Set(c.map(m => m.suit)).size === 3 && isArithmetic(c.map(m => m.rank), [1]))) add('mixedShiftedPungs');
            if (anyCombo(suitedPungs, 3, c => new Set(c.map(m => m.suit)).size === 3 && c.every(m => m.rank === c[0].rank))) add('triplePung');
        }
        if (suitedPungs.length === 4 && suitedPungs.every(m => m.suit === suitedPungs[0].suit) && isArithmetic(suitedPungs.map(m => m.rank), [1])) add('fourPureShiftedPungs');
        const pungRanks = {};
        suitedPungs.forEach(m => { pungRanks[m.rank] = (pungRanks[m.rank] || 0) + 1; });
        Object.values(pungRanks).forEach(n => { if (n === 2) add('doublePung'); });

        // Suites
        const key = m => m.suit + m.rank;
        const chowCount = {};
        chows.forEach(m => { chowCount[key(m)] = (chowCount[key(m)] || 0) + 1; });
        Object.values(chowCount).forEach(n => { add('pureDoubleChow', Math.floor(n / 2)); });
        if (Object.values(chowCount).some(n => n === 4)) add('quadrupleChow');
        else if (Object.values(chowCount).some(n => n === 3)) add('pureTripleChow');

        const byRank = {};
        chows.forEach(m => { (byRank[m.rank] = byRank[m.rank] || {})[m.suit] = (byRank[m.rank][m.suit] || 0) + 1; });
        Object.values(byRank).forEach(perSuit => {
            const vals = Object.values(perSuit);
            const total = vals.reduce((a, b) => a + b, 0);
            add('mixedDoubleChow', Math.min(Math.floor(total / 2), total - Math.max(...vals)));
        });
        ['p', 's', 'm'].forEach(suit => {
            const cnt = {};
            chows.filter(m => m.suit === suit).forEach(m => { cnt[m.rank] = (cnt[m.rank] || 0) + 1; });
            const shortCnt = Object.assign({}, cnt);
            for (let r = 1; r <= 4; r++) {
                while ((shortCnt[r] || 0) > 0 && (shortCnt[r + 3] || 0) > 0) { shortCnt[r]--; shortCnt[r + 3]--; add('shortStraight'); }
            }
            add('twoTerminalChows', Math.min(cnt[1] || 0, cnt[7] || 0));
        });

        if (chows.length >= 3) {
            if (anyCombo(chows, 3, c => c.every(m => m.suit === c[0].suit) && isArithmetic(c.map(m => m.rank), [3]) && Math.min(...c.map(m => m.rank)) === 1)) add('pureStraight');
            if (anyCombo(chows, 3, c => new Set(c.map(m => m.suit)).size === 3 && c.map(m => m.rank).sort().join() === '1,4,7')) add('mixedStraight');
            if (anyCombo(chows, 3, c => c.every(m => m.suit === c[0].suit) && isArithmetic(c.map(m => m.rank), [1, 2]))) add('pureShiftedChows');
            if (anyCombo(chows, 3, c => new Set(c.map(m => m.suit)).size === 3 && isArithmetic(c.map(m => m.rank), [1]))) add('mixedShiftedChows');
            if (anyCombo(chows, 3, c => new Set(c.map(m => m.suit)).size === 3 && c.every(m => m.rank === c[0].rank))) add('mixedTripleChow');
        }
        if (chows.length === 4 && chows.every(m => m.suit === chows[0].suit) && isArithmetic(chows.map(m => m.rank), [1, 2])) add('fourPureShiftedChows');
        if (chows.length === 4 && chows.every(m => m.suit === chows[0].suit) && isSuited(pair) && tileSuit(pair) === chows[0].suit && tileRank(pair) === 5) {
            const ranks = chows.map(m => m.rank).sort().join();
            if (ranks === '1,1,7,7') add('pureTerminalChows');
        }
        if (chows.length === 4 && isSuited(pair) && tileRank(pair) === 5) {
            const suitRanks = {};
            chows.forEach(m => { (suitRanks[m.suit] = suitRanks[m.suit] || []).push(m.rank); });
            const suits = Object.keys(suitRanks);
            if (suits.length === 2 && !suits.includes(tileSuit(pair)) && suits.every(s => suitRanks[s].slice().sort().join() === '1,7')) add('threeSuitedTerminalChows');
        }
    }

    // --- Mode de victoire ---
    const allClosed = melds.every(m => !m.open);
    if (allClosed && ctx.selfDrawn) add('fullyConcealedHand');
    else if (allClosed) add('concealedHand');
    else if (structured && melds.length === 4 && melds.every(m => m.open) && !ctx.selfDrawn) add('meldedHand');
    if (ctx.selfDrawn) add('selfDrawn');
    if (ctx.lastTile === 'draw' && ctx.selfDrawn) add('lastTileDraw');
    if (ctx.lastTile === 'claim' && !ctx.selfDrawn) add('lastTileClaim');
    if (ctx.replacement && ctx.selfDrawn) add('outWithReplacement');
    if (ctx.robbing && !ctx.selfDrawn) add('robbingTheKong');
    if (ctx.lastCopy) add('lastTile');
    if (structured) {
        if (ctx.wait === 'edge') add('edgeWait');
        if (ctx.wait === 'closed') add('closedWait');
        if (ctx.wait === 'single') add('singleWait');
    }

    // --- Exclusions (combinaisons déjà incluses dans une plus haute) ---
    const detected = Object.keys(entries);
    detected.forEach(id => (FANS[id].excl || []).forEach(ex => { delete entries[ex]; }));

    // Main poule : aucune autre combinaison que les fleurs
    if (structured && Object.keys(entries).length === 0) add('chickenHand');
    return entries;
}

function meldHasFive(m) {
    if (!isSuited(m.id)) return false;
    if (m.kind === 'chow') return m.rank <= 5 && m.rank + 2 >= 5;
    return tileRank(m.id) === 5;
}

function meldIsOutside(m) {
    if (m.kind === 'chow') return m.rank === 1 || m.rank === 7;
    return isHonor(m.id) || isTerminal(m.id);
}

// Combinaisons par groupe seulement (mains incomplètes ou joueurs qui n'ont pas gagné).
function partialFans(hand, an, ctx) {
    const entries = {};
    const add = (id, n = 1) => { if (n > 0) entries[id] = (entries[id] || 0) + n; };
    const pungs = an.melds.filter(m => isPungLike(m) && hand.type !== 'sevenPairs');
    const windPungs = pungs.filter(m => TILES[m.id].kind === 'wind');
    pungs.forEach(m => {
        if (TILES[m.id].kind === 'dragon') add('dragonPung');
        if (m.id === ctx.prevalentWind) add('prevalentWind');
        if (m.id === ctx.seatWind) add('seatWind');
        if (isTerminal(m.id)) add('pungTerminalsOrHonors');
        else if (TILES[m.id].kind === 'wind' && m.id !== ctx.prevalentWind && m.id !== ctx.seatWind && windPungs.length < 3) add('pungTerminalsOrHonors');
        if (m.kind === 'kong') add(m.open ? 'meldedKong' : 'concealedKong');
    });
    return entries;
}

function evaluateHand(hand, ctx, isWinner) {
    const an = analyzeHand(hand);
    const result = { status: 'empty', errors: an.errors.slice(), warnings: [], fans: [], total: 0 };
    let entries;
    const hasTiles = handTiles(hand).length > 0;
    if (isWinner && an.complete) {
        result.status = 'complete';
        entries = detectFans(hand, an, ctx);
        if (ctx.lastTile === 'draw' && !ctx.selfDrawn) result.warnings.push('« Dernière tuile du mur » demande une victoire par pioche (Tsumo).');
        if (ctx.lastTile === 'claim' && ctx.selfDrawn) result.warnings.push('« Dernière défausse » demande une victoire sur défausse (Ron).');
        if (ctx.replacement && !ctx.selfDrawn) result.warnings.push('« Tuile de remplacement » demande une victoire par pioche (Tsumo).');
        if (ctx.robbing && ctx.selfDrawn) result.warnings.push('« Vol de carré » demande une victoire sur défausse (Ron).');
    } else {
        entries = partialFans(hand, an, ctx);
        if (isWinner) result.status = an.errors.length ? 'invalid' : (hasTiles ? 'incomplete' : 'empty');
        else result.status = hasTiles ? 'partial' : 'empty';
    }
    const flowers = hand.flowers.filter(Boolean).length;
    if (flowers) entries.flower = flowers;

    result.fans = Object.keys(entries).map(id => ({
        id, name: FANS[id].fr, zh: FANS[id].zh, fan: FANS[id].fan, count: entries[id], total: FANS[id].fan * entries[id]
    })).sort((a, b) => b.fan - a.fan || a.name.localeCompare(b.name));
    result.total = result.fans.reduce((s, f) => s + f.total, 0);
    return result;
}

const DEFAULT_CTX = { seatWind: 'we', prevalentWind: 'we', selfDrawn: false, lastTile: 'none', replacement: false, robbing: false, lastCopy: false, wait: 'none' };
