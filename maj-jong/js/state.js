// --- ÉTAT GLOBAL ---
// gameState : la partie sauvegardée. players[].scores a une entrée de plus que rounds (index 0 = départ).
// rounds[].impacts est la source de vérité : recalculateScores() reconstruit les scores.
function makeDefaultGameState() {
    return {
        playerCount: 4,
        startingPoints: 0,
        players: [0, 1, 2, 3].map(i => ({ id: i, name: `Joueur ${i + 1}`, scores: [0] })),
        rounds: []
    };
}

let gameState = makeDefaultGameState();

// currentCalcState : état transitoire du calculateur de manche.
// playerHands[id] = { hand (voir engine/hand.js), flags } ; cursor = prochain trou à remplir.
let currentCalcState = {
    activePlayerId: 0,
    estId: 0,
    winnerId: 0,
    victoryMethod: 'tsumo',
    discarderId: 1,
    prevalentWind: 'we',
    playerHands: {},
    cursor: null
};

let chartInstance = null;
let currentPartyId = null;
let currentPartyName = null;

function makeDefaultFlags() {
    return { wait: 'none', lastTile: 'none', replacement: false, robbing: false, lastCopy: false };
}

function resetCurrentCalcState() {
    currentCalcState.playerHands = {};
    for (let i = 0; i < 4; i++) {
        currentCalcState.playerHands[i] = { hand: createHand('standard'), flags: makeDefaultFlags() };
    }
    currentCalcState.cursor = null;
}

function recalculateScores() {
    gameState.players.forEach(p => p.scores = [gameState.startingPoints]);
    gameState.rounds.forEach(r => {
        gameState.players.forEach(p => {
            const current = p.scores[p.scores.length - 1];
            p.scores.push(current + (r.impacts[p.id] || 0));
        });
    });
}
