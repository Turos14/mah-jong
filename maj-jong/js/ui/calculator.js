// --- CALCULATEUR DE MANCHE ---

function syncCalcSelectors() {
    ['calc-est', 'calc-winner', 'calc-discarder'].forEach(id => {
        const sel = document.getElementById(id);
        const prev = sel.value;
        sel.innerHTML = '';
        gameState.players.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            sel.appendChild(opt);
        });
        if (prev !== '' && parseInt(prev) < gameState.playerCount) sel.value = prev;
    });
    if (currentCalcState.activePlayerId >= gameState.playerCount) currentCalcState.activePlayerId = 0;
}

// Lit les sélecteurs de contexte (Est, gagnant, méthode...) dans l'état.
function readContext() {
    const s = currentCalcState;
    const val = id => document.getElementById(id).value;
    s.estId = parseInt(val('calc-est')) || 0;
    s.winnerId = parseInt(val('calc-winner')) || 0;
    s.victoryMethod = val('calc-method');
    s.prevalentWind = val('calc-prevalent');
    s.discarderId = parseInt(val('calc-discarder')) || 0;
    if (s.victoryMethod === 'ron' && s.discarderId === s.winnerId) {
        s.discarderId = (s.winnerId + 1) % gameState.playerCount;
        document.getElementById('calc-discarder').value = s.discarderId;
    }
    document.getElementById('calc-discarder-container').classList.toggle('hidden', s.victoryMethod !== 'ron');
}

function onContextChange() {
    readContext();
    gameState.players.forEach(p => ensureHandForRole(p.id));
    refreshCalculator();
}

function refreshCalculator() {
    readContext();
    const hand = activeHand();
    if (!cursorIsValid(hand, currentCalcState.cursor)) currentCalcState.cursor = firstEmptyHole(hand);
    renderSubTabs();
    renderHandEditor();
    renderTray();
    updateCalculations();
}

function changeSubTab(id) {
    currentCalcState.activePlayerId = id;
    currentCalcState.cursor = null;
    renderSubTabs();
    refreshCalculator();
}

// Contexte de comptage d'un joueur (vent de place, façon de gagner si c'est le gagnant).
function handContext(playerId) {
    const s = currentCalcState;
    const isW = playerId === s.winnerId;
    const f = s.playerHands[playerId].flags;
    return {
        seatWind: seatWindOf(playerId, s.estId, gameState.playerCount),
        prevalentWind: s.prevalentWind,
        selfDrawn: isW && s.victoryMethod === 'tsumo',
        lastTile: isW ? f.lastTile : 'none',
        replacement: isW && f.replacement,
        robbing: isW && f.robbing,
        lastCopy: isW && f.lastCopy,
        wait: isW ? f.wait : 'none'
    };
}

function evaluateAllHands() {
    const out = {};
    gameState.players.forEach(p => {
        out[p.id] = evaluateHand(currentCalcState.playerHands[p.id].hand, handContext(p.id), p.id === currentCalcState.winnerId);
    });
    return out;
}

function currentDeltas(results) {
    const values = {};
    gameState.players.forEach(p => { values[p.id] = results[p.id].total; });
    return computePayout(gameState.players, values, {
        winnerId: currentCalcState.winnerId,
        estId: currentCalcState.estId,
        method: currentCalcState.victoryMethod,
        discarderId: currentCalcState.discarderId,
        playerCount: gameState.playerCount
    });
}

function renderSubTabs() {
    const cont = document.getElementById('player-subtabs-container');
    const results = evaluateAllHands();
    cont.innerHTML = '';
    gameState.players.forEach(p => {
        const isActive = p.id === currentCalcState.activePlayerId;
        const isW = p.id === currentCalcState.winnerId;
        const btn = document.createElement('button');
        btn.onclick = () => changeSubTab(p.id);
        btn.className = `flex-1 min-w-[120px] px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all border whitespace-nowrap text-center ${isActive ? 'bg-emerald-600 text-slate-950 border-emerald-500 font-bold' : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'}`;
        btn.innerHTML = `<div>${escapeHtml(p.name)} ${isW ? '👑' : ''}</div><div id="subtab-score-${p.id}" class="text-[10px] ${isActive ? 'text-slate-900' : 'text-emerald-400'} font-bold mt-0.5">${results[p.id].total} pts</div>`;
        cont.appendChild(btn);
    });
}

function renderHandResult(res, isWinner) {
    const box = document.getElementById('hand-result');
    let html = '';
    if (isWinner) {
        if (res.status === 'incomplete') {
            const hand = activeHand();
            const missing = hand.groups.reduce((n, g) => n + g.tiles.filter(t => !t).length, 0);
            html += `<p class="text-xs text-amber-400">Main incomplète : ${missing} trou(s) à remplir pour calculer le Mah-jong.</p>`;
        } else if (res.status === 'empty') {
            html += `<p class="text-xs text-slate-500">Remplissez la main du gagnant avec le bandeau de tuiles.</p>`;
        }
    }
    res.errors.forEach(e => { html += `<p class="text-xs text-rose-400">⚠️ ${escapeHtml(e)}</p>`; });
    res.warnings.forEach(w => { html += `<p class="text-xs text-amber-400">⚠️ ${escapeHtml(w)}</p>`; });
    if (res.fans.length) {
        html += res.fans.map(f => `
            <div class="flex justify-between gap-3 bg-slate-800/30 rounded-lg px-3 py-2">
                <span class="text-slate-200">${escapeHtml(f.name)} <span class="text-slate-500 text-xs">${f.zh}</span></span>
                <span class="text-emerald-400 font-semibold whitespace-nowrap">${f.count > 1 ? f.count + ' × ' : ''}${f.fan} = ${f.total}</span>
            </div>`).join('');
        html += `<div class="flex justify-between font-bold text-slate-100 px-3 pt-1"><span>Valeur de la main</span><span class="text-emerald-400">${res.total}</span></div>`;
    } else if (res.status !== 'incomplete' && res.status !== 'empty') {
        html += `<p class="text-xs text-slate-500">Aucune combinaison.</p>`;
    }
    if (isWinner && res.status === 'complete') {
        const flowers = res.fans.filter(f => f.id === 'flower').reduce((s, f) => s + f.total, 0);
        if (res.total - flowers < 8) {
            html += `<p class="text-xs text-amber-400">Moins de 8 points hors fleurs : le minimum des règles officielles n'est pas atteint (à vous de juger selon vos règles).</p>`;
        }
    }
    box.innerHTML = html;
}

function updateCalculations() {
    readContext();
    const results = evaluateAllHands();
    const deltas = currentDeltas(results);
    const E = currentCalcState.estId;

    const panel = document.getElementById('side-summary-balances');
    panel.innerHTML = '';
    gameState.players.forEach(p => {
        const res = results[p.id];
        const net = deltas[p.id];
        const netColor = net > 0 ? 'text-emerald-400 font-bold' : net < 0 ? 'text-rose-400 font-bold' : 'text-slate-400';
        const div = document.createElement('div');
        div.className = 'py-2.5 space-y-1';
        div.innerHTML = `
            <div class="flex justify-between font-medium">
                <span class="text-slate-200">${escapeHtml(p.name)} ${p.id === E ? '<span class="text-[10px] bg-amber-500/10 text-amber-400 px-1 rounded border border-amber-500/20">EST</span>' : ''}</span>
                <span class="${netColor}">${net > 0 ? '+' : ''}${net} pts</span>
            </div>
            <div class="flex justify-between text-xs text-slate-400">
                <span>Valeur main : ${res.total}</span>
                <span>${res.fans.length} combinaison(s)</span>
            </div>`;
        panel.appendChild(div);
        const tab = document.getElementById(`subtab-score-${p.id}`);
        if (tab) tab.innerText = `${res.total} pts`;
    });

    const active = currentCalcState.activePlayerId;
    renderHandResult(results[active], active === currentCalcState.winnerId);
}

// --- ENREGISTREMENT DE LA MANCHE ---
function saveCalculatedRound() {
    readContext();
    const results = evaluateAllHands();
    const W = currentCalcState.winnerId;
    const winnerRes = results[W];
    const winner = gameState.players.find(p => p.id === W);

    if (winnerRes.status !== 'complete') {
        alert(`La main de ${winner.name} n'est pas un Mah-jong complet et valide. Complétez-la (ou corrigez les erreurs) avant d'enregistrer la manche.`);
        changeSubTab(W);
        return;
    }
    const flowers = winnerRes.fans.filter(f => f.id === 'flower').reduce((s, f) => s + f.total, 0);
    if (winnerRes.total - flowers < 8 && !confirm('Cette main fait moins de 8 points hors fleurs (minimum des règles officielles). Enregistrer quand même ?')) return;

    const impacts = currentDeltas(results);
    const top = winnerRes.fans.filter(f => f.id !== 'flower').slice(0, 3).map(f => f.name).join(', ');
    gameState.rounds.push({
        roundNum: gameState.rounds.length + 1,
        estName: gameState.players.find(p => p.id === currentCalcState.estId).name,
        winnerName: winner.name,
        typeText: currentCalcState.victoryMethod === 'tsumo' ? 'Tsumo (Pioche)' : 'Ron (Défausse)',
        winnerHand: `${top || 'Main poule'} — ${winnerRes.total} pts`,
        impacts
    });

    recalculateScores();
    resetCurrentCalcState();
    initGame();
    switchTab('dashboard');
}
