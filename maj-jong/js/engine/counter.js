// --- COMPTEUR MULTI-JEUX : logique pure (pas de DOM) ---
// Un jeu = des paramètres ; une partie (session) = un jeu figé + des joueurs + des manches.
// session.rounds[].points (un nombre par joueur) est la source de vérité des scores.

const COUNTER_MAX_PLAYERS = 12;
const COUNTER_SCORING = {
    all: 'Tous les joueurs marquent',
    winner: 'Seul le gagnant marque'
};

function makeCounterGame(fields) {
    return normalizeCounterGame(Object.assign({
        id: null,
        name: 'Jeu libre',
        minPlayers: 2,
        maxPlayers: 8,
        scoring: 'all',
        lowestWins: false,
        startingPoints: 0,
        targetScore: null
    }, fields || {}));
}

function toInt(v, fallback) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeCounterGame(g) {
    const min = Math.min(Math.max(toInt(g.minPlayers, 2), 1), COUNTER_MAX_PLAYERS);
    const max = Math.min(Math.max(toInt(g.maxPlayers, min), min), COUNTER_MAX_PLAYERS);
    const target = g.targetScore === null || g.targetScore === '' || g.targetScore === undefined ? null : toInt(g.targetScore, null);
    return {
        id: g.id || null,
        name: String(g.name || '').trim() || 'Jeu sans nom',
        minPlayers: min,
        maxPlayers: max,
        scoring: g.scoring === 'winner' ? 'winner' : 'all',
        lowestWins: !!g.lowestWins,
        startingPoints: toInt(g.startingPoints, 0),
        targetScore: target
    };
}

function clampPlayerCount(game, n) {
    return Math.min(Math.max(toInt(n, game.minPlayers), game.minPlayers), game.maxPlayers);
}

function makeCounterSession(game, name, playerCount) {
    const n = clampPlayerCount(game, playerCount);
    return {
        id: null,
        name: String(name || '').trim() || game.name,
        game: Object.assign({}, game),
        players: Array.from({ length: n }, (_, i) => `Joueur ${i + 1}`),
        rounds: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

// Construit la manche à enregistrer à partir de la saisie. Les champs vides comptent 0.
// winner : index du joueur ou null ; rawPoints : tableau (chaînes ou nombres), un par joueur.
// Mode « winner » : seul rawPoints[winner] est retenu, les autres joueurs marquent 0.
function buildCounterRound(game, playerCount, winner, rawPoints) {
    const errors = [];
    const w = winner === null || winner === undefined || winner === '' ? null : toInt(winner, null);
    if (w !== null && (w < 0 || w >= playerCount)) errors.push('Gagnant invalide.');
    if (game.scoring === 'winner' && w === null) errors.push('Choisissez le gagnant.');

    const parse = v => {
        const str = v === null || v === undefined ? '' : String(v).trim().replace(',', '.');
        return str === '' ? 0 : Number(str);
    };
    let points = Array.from({ length: playerCount }, (_, i) => parse(rawPoints[i]));
    if (game.scoring === 'winner') points = points.map((p, i) => i === w ? p : 0);
    if (points.some(p => !Number.isFinite(p))) errors.push('Les points doivent être des nombres.');
    if (game.scoring === 'winner' && w !== null && points[w] === 0) errors.push('Indiquez les points du gagnant.');
    if (game.scoring === 'all' && w === null && points.every(p => p === 0)) errors.push('Saisissez au moins un score ou un gagnant.');

    return { errors, round: errors.length ? null : { winner: w, points } };
}

// Scores cumulés : history[k][i] = score du joueur i après k manches (k = 0 : départ).
function counterHistory(session) {
    const start = session.game.startingPoints || 0;
    const history = [session.players.map(() => start)];
    session.rounds.forEach(r => {
        const prev = history[history.length - 1];
        history.push(prev.map((s, i) => s + (r.points[i] || 0)));
    });
    return history;
}

function counterTotals(session) {
    const h = counterHistory(session);
    return h[h.length - 1];
}

// Classement : meilleur en premier (plus petit score si lowestWins), à égalité le plus de manches gagnées.
function counterRanking(session) {
    const totals = counterTotals(session);
    const dir = session.game.lowestWins ? 1 : -1;
    return session.players
        .map((name, index) => ({
            index,
            name,
            total: totals[index],
            wins: session.rounds.filter(r => r.winner === index).length
        }))
        .sort((a, b) => dir * (a.total - b.total) || b.wins - a.wins || a.index - b.index);
}

// Joueurs ayant atteint le score de fin de partie (score >= objectif). Avec lowestWins
// (ex. Skyjo), atteindre l'objectif termine la partie et c'est le plus petit score qui gagne.
function counterTargetReached(session) {
    const t = session.game.targetScore;
    if (t === null || t === undefined) return [];
    return counterTotals(session).map((s, i) => s >= t ? i : -1).filter(i => i >= 0);
}
