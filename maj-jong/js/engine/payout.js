// --- TRANSFERTS DE POINTS ---
// Source unique pour l'aperçu du calculateur et l'enregistrement de la manche.
// handValues : { [playerId]: valeur de la main }
// opts : { winnerId, estId, method: 'tsumo'|'ron', discarderId, playerCount }
// Le gagnant encaisse sa main auprès de chaque adversaire (ou du défausseur en Ron),
// doublé si l'Est est concerné ; les perdants règlent entre eux la différence de leurs mains
// (doublée si l'Est est concerné).

function computePayout(players, handValues, opts) {
    const { winnerId: W, estId: E, method, discarderId, playerCount } = opts;
    const deltas = {};
    players.forEach(p => { deltas[p.id] = 0; });

    players.forEach(p => {
        if (p.id === W) return;
        const mult = (W === E || p.id === E) ? 2 : 1;
        const due = handValues[W] * mult;
        deltas[method === 'tsumo' ? p.id : discarderId] -= due;
        deltas[W] += due;
    });

    for (let i = 0; i < playerCount; i++) {
        for (let j = i + 1; j < playerCount; j++) {
            if (i === W || j === W) continue;
            const diff = handValues[i] - handValues[j];
            if (diff === 0) continue;
            const exchange = Math.abs(diff) * ((i === E || j === E) ? 2 : 1);
            const [gain, loss] = diff > 0 ? [i, j] : [j, i];
            deltas[gain] += exchange;
            deltas[loss] -= exchange;
        }
    }
    return deltas;
}
