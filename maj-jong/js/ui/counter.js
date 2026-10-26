// --- COMPTEUR MULTI-JEUX : jeux paramétrables, parties, manches, graphique ---
// Les parties sont sauvegardées automatiquement à chaque modification (voir storage.js).

const COUNTER_PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#14b8a6', '#eab308', '#6366f1'];
const COUNTER_INPUT_CLS = 'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500';

let counterGames = [];
let counterSession = null;
let counterDraftWinner = null;
let counterChartInstance = null;

function counterAttr(str) {
    return escapeHtml(String(str)).replace(/"/g, '&quot;');
}

function signed(n) {
    return n > 0 ? `+${n}` : `${n}`;
}

// --- CHARGEMENT / SAUVEGARDE ---
function initCounter() {
    counterGames = loadJson(COUNTER_GAMES_KEY, []).map(normalizeCounterGame);
    if (counterGames.length === 0) {
        counterGames = [
            makeCounterGame({ id: generatePartyId(), name: 'Jeu libre', minPlayers: 2, maxPlayers: 8, scoring: 'all' }),
            makeCounterGame({ id: generatePartyId(), name: 'Gagnant seul', minPlayers: 2, maxPlayers: 6, scoring: 'winner' })
        ];
        saveJson(COUNTER_GAMES_KEY, counterGames);
    }
    const currentId = loadJson(COUNTER_CURRENT_KEY, null);
    counterSession = loadJson(COUNTER_SESSIONS_KEY, []).find(s => s.id === currentId) || null;
    renderCounter();
}

function counterSessions() {
    return loadJson(COUNTER_SESSIONS_KEY, []);
}

function persistCounterSession() {
    if (!counterSession) return;
    counterSession.updatedAt = Date.now();
    const sessions = counterSessions();
    const idx = sessions.findIndex(s => s.id === counterSession.id);
    if (idx >= 0) sessions[idx] = counterSession; else sessions.push(counterSession);
    saveJson(COUNTER_SESSIONS_KEY, sessions);
    saveJson(COUNTER_CURRENT_KEY, counterSession.id);
}

function openCounterSession(session) {
    counterSession = session;
    counterDraftWinner = null;
    persistCounterSession();
    renderCounter();
}

// --- RENDU GLOBAL ---
function renderCounter() {
    const has = !!counterSession;
    document.getElementById('counter-empty').classList.toggle('hidden', has);
    document.getElementById('counter-play').classList.toggle('hidden', !has);
    document.getElementById('counter-rematch-btn').classList.toggle('hidden', !has);
    document.getElementById('counter-session-label').innerText = has
        ? `${counterSession.name} · ${counterSession.game.name} · sauvegarde automatique`
        : 'Aucune partie ouverte';
    renderCounterSetup();
    renderCounterRoundForm();
    renderCounterResults();
    renderCounterSessionsList();
    renderCounterGamesList();
}

// Tout ce qui dépend des scores (sans toucher aux champs en cours de saisie).
function renderCounterResults() {
    renderCounterLeaderboard();
    renderCounterHistory();
    renderCounterChart();
}

function gameSummary(g) {
    const parts = [
        g.minPlayers === g.maxPlayers ? `${g.minPlayers} joueurs` : `${g.minPlayers} à ${g.maxPlayers} joueurs`,
        COUNTER_SCORING[g.scoring]
    ];
    if (g.lowestWins) parts.push('le plus petit score gagne');
    if (g.startingPoints) parts.push(`départ ${g.startingPoints}`);
    if (g.targetScore !== null) parts.push(`fin à ${g.targetScore}`);
    return parts.join(' · ');
}

// --- JOUEURS ---
function renderCounterSetup() {
    const cont = document.getElementById('counter-setup');
    if (!counterSession) { cont.innerHTML = ''; return; }
    const s = counterSession, g = s.game, n = s.players.length;
    const locked = s.rounds.length > 0;
    const btn = 'w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-lg font-bold text-slate-200 disabled:opacity-30';
    cont.innerHTML = `
        <p class="text-xs text-slate-400 mb-4">${escapeHtml(gameSummary(g))}</p>
        <div class="flex flex-wrap items-center gap-3 mb-4">
            <span class="text-xs text-slate-400">Nombre de joueurs :</span>
            <button class="${btn}" onclick="setCounterPlayerCount(${n - 1})" ${locked || n <= g.minPlayers ? 'disabled' : ''}>−</button>
            <span class="text-emerald-400 font-bold w-6 text-center">${n}</span>
            <button class="${btn}" onclick="setCounterPlayerCount(${n + 1})" ${locked || n >= g.maxPlayers ? 'disabled' : ''}>+</button>
            ${locked ? '<span class="text-[11px] text-slate-500">(fixé une fois la première manche jouée)</span>' : ''}
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            ${s.players.map((p, i) => `
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${COUNTER_PALETTE[i % COUNTER_PALETTE.length]}"></span>
                    <input type="text" value="${counterAttr(p)}" oninput="renameCounterPlayer(${i}, this.value)" class="${COUNTER_INPUT_CLS}">
                </div>`).join('')}
        </div>`;
}

function setCounterPlayerCount(n) {
    if (!counterSession || counterSession.rounds.length) return;
    const count = clampPlayerCount(counterSession.game, n);
    const players = counterSession.players.slice(0, count);
    for (let i = players.length; i < count; i++) players.push(`Joueur ${i + 1}`);
    counterSession.players = players;
    if (counterDraftWinner !== null && counterDraftWinner >= count) counterDraftWinner = null;
    persistCounterSession();
    renderCounter();
}

function renameCounterPlayer(i, value) {
    counterSession.players[i] = value.trim() || `Joueur ${i + 1}`;
    persistCounterSession();
    renderCounterRoundForm();
    renderCounterResults();
    renderCounterSessionsList();
}

// --- SAISIE D'UNE MANCHE ---
function readCounterRoundInputs() {
    return Array.from(document.querySelectorAll('#counter-round-form [data-points]')).map(el => el.value);
}

function renderCounterRoundForm() {
    const cont = document.getElementById('counter-round-form');
    if (!counterSession) { cont.innerHTML = ''; return; }
    const s = counterSession, winnerOnly = s.game.scoring === 'winner';
    const prev = readCounterRoundInputs();
    const chip = (active, label, onclick) =>
        `<button onclick="${onclick}" class="px-3 py-2 rounded-lg text-sm font-medium border transition ${active ? 'bg-emerald-600 border-emerald-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-600'}">${label}</button>`;

    const winners = s.players.map((p, i) => chip(counterDraftWinner === i, `${counterDraftWinner === i ? '👑 ' : ''}${escapeHtml(p)}`, `setCounterWinner(${i})`)).join('')
        + (winnerOnly ? '' : chip(counterDraftWinner === null, 'Aucun', 'setCounterWinner(null)'));

    const input = (i, value) => `
        <div class="flex gap-1.5">
            <button onclick="toggleCounterSign(${i})" title="Changer le signe" class="w-10 shrink-0 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold">±</button>
            <input type="text" inputmode="decimal" autocomplete="off" data-points="${i}" value="${counterAttr(value || '')}" placeholder="0" class="${COUNTER_INPUT_CLS}" onkeydown="if(event.key==='Enter') addCounterRound()">
        </div>`;

    let pointsHtml;
    if (winnerOnly) {
        const label = counterDraftWinner === null ? 'Points du gagnant' : `Points de ${escapeHtml(s.players[counterDraftWinner])}`;
        pointsHtml = `<label class="block text-xs text-slate-400 mb-1.5">${label}</label>${input(0, prev.length === 1 ? prev[0] : '')}`;
    } else {
        pointsHtml = s.players.map((p, i) => `
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-center gap-3">
                <span class="text-sm text-slate-300 truncate">${escapeHtml(p)}</span>
                ${input(i, prev.length === s.players.length ? prev[i] : '')}
            </div>`).join('');
    }

    cont.innerHTML = `
        <div class="space-y-4">
            <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Gagnant de la manche</p>
                <div class="flex flex-wrap gap-2">${winners}</div>
            </div>
            <div class="space-y-2">
                ${winnerOnly ? '' : '<p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Points marqués (vide = 0)</p>'}
                ${pointsHtml}
            </div>
            <p id="counter-round-error" class="hidden text-xs text-rose-400"></p>
            <button onclick="addCounterRound()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition">
                ✅ Ajouter la manche ${s.rounds.length + 1}
            </button>
        </div>`;
}

function setCounterWinner(i) {
    counterDraftWinner = i;
    renderCounterRoundForm();
}

function toggleCounterSign(i) {
    const el = document.querySelector(`#counter-round-form [data-points="${i}"]`);
    if (!el) return;
    const v = el.value.trim();
    el.value = v === '' ? '-' : v.startsWith('-') ? v.slice(1) : `-${v}`;
    el.focus();
}

function addCounterRound() {
    const s = counterSession;
    if (!s) return;
    const raw = readCounterRoundInputs();
    // En mode gagnant seul, l'unique champ correspond au gagnant.
    const perPlayer = s.game.scoring === 'winner'
        ? s.players.map((_, i) => i === counterDraftWinner ? raw[0] : '')
        : raw;
    const { errors, round } = buildCounterRound(s.game, s.players.length, counterDraftWinner, perPlayer);
    if (errors.length) {
        const el = document.getElementById('counter-round-error');
        el.innerText = errors.join(' ');
        el.classList.remove('hidden');
        return;
    }
    s.rounds.push(round);
    counterDraftWinner = null;
    persistCounterSession();
    document.querySelectorAll('#counter-round-form [data-points]').forEach(el => { el.value = ''; });
    renderCounter();
}

function deleteCounterRound(idx) {
    if (!confirm(`Supprimer la manche ${idx + 1} ?`)) return;
    counterSession.rounds.splice(idx, 1);
    persistCounterSession();
    renderCounter();
}

// --- CLASSEMENT ---
function renderCounterLeaderboard() {
    const cont = document.getElementById('counter-leaderboard');
    const banner = document.getElementById('counter-target-banner');
    if (!counterSession) { cont.innerHTML = ''; banner.classList.add('hidden'); return; }
    const s = counterSession;
    const ranking = counterRanking(s);
    cont.innerHTML = ranking.map((p, idx) => {
        const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🔹';
        return `
            <div class="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <span class="flex items-center gap-2 min-w-0 text-sm font-medium text-slate-300">
                    <span>${medal}</span>
                    <span class="w-2 h-2 rounded-full shrink-0" style="background:${COUNTER_PALETTE[p.index % COUNTER_PALETTE.length]}"></span>
                    <span class="truncate">${escapeHtml(p.name)}</span>
                </span>
                <span class="text-right shrink-0">
                    <span class="block font-bold text-emerald-400">${p.total} pts</span>
                    <span class="block text-[10px] text-slate-500">${p.wins} victoire(s)</span>
                </span>
            </div>`;
    }).join('');

    const reached = counterTargetReached(s);
    if (reached.length) {
        banner.innerText = `🏁 Score de fin (${s.game.targetScore}) atteint par ${reached.map(i => s.players[i]).join(', ')} — vainqueur : ${ranking[0].name}`;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

// --- HISTORIQUE ---
function renderCounterHistory() {
    const cont = document.getElementById('counter-history');
    const count = document.getElementById('counter-rounds-count');
    if (!counterSession) { cont.innerHTML = ''; return; }
    const s = counterSession;
    count.innerText = `${s.rounds.length} manche(s)`;
    if (!s.rounds.length) {
        cont.innerHTML = '<div class="text-center py-6 text-slate-500 text-sm">Aucune manche enregistrée.</div>';
        return;
    }
    const totals = counterHistory(s);
    const head = s.players.map(p => `<th class="py-2 px-3 text-right whitespace-nowrap">${escapeHtml(p)}</th>`).join('');
    const rows = s.rounds.map((r, idx) => `
        <tr class="border-b border-slate-800/70 text-slate-300">
            <td class="py-2 px-3 font-bold text-emerald-400">M.${idx + 1}</td>
            <td class="py-2 px-3 text-xs whitespace-nowrap">${r.winner === null ? '—' : '👑 ' + escapeHtml(s.players[r.winner])}</td>
            ${r.points.map((pt, i) => `
                <td class="py-2 px-3 text-right whitespace-nowrap">
                    <span class="${pt > 0 ? 'text-emerald-400 font-semibold' : pt < 0 ? 'text-rose-400 font-semibold' : 'text-slate-500'}">${signed(pt)}</span>
                    <span class="block text-[10px] text-slate-500">${totals[idx + 1][i]}</span>
                </td>`).join('')}
            <td class="py-2 px-3 text-right">
                <button onclick="deleteCounterRound(${idx})" class="text-xs text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md transition">✕</button>
            </td>
        </tr>`).join('');
    cont.innerHTML = `
        <table class="w-full text-left border-collapse text-sm">
            <thead><tr class="border-b border-slate-800 text-slate-400 text-xs">
                <th class="py-2 px-3">Manche</th><th class="py-2 px-3">Gagnant</th>${head}<th></th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>`;
}

// --- GRAPHIQUE ---
function counterChartData() {
    const s = counterSession;
    const history = counterHistory(s);
    return {
        labels: history.map((_, k) => k === 0 ? 'Départ' : `M.${k}`),
        datasets: s.players.map((p, i) => ({
            label: p,
            data: history.map(row => row[i]),
            borderColor: COUNTER_PALETTE[i % COUNTER_PALETTE.length],
            backgroundColor: COUNTER_PALETTE[i % COUNTER_PALETTE.length],
            fill: false
        }))
    };
}

function renderCounterChart() {
    if (!counterSession || typeof Chart === 'undefined') {
        if (counterChartInstance) { counterChartInstance.destroy(); counterChartInstance = null; }
        return;
    }
    const data = counterChartData();
    if (counterChartInstance) {
        counterChartInstance.data = data;
        counterChartInstance.update();
        return;
    }
    counterChartInstance = new Chart(document.getElementById('counterChart').getContext('2d'), {
        type: 'line',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 } } },
            scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            },
            elements: { line: { tension: 0.15, borderWidth: 3 }, point: { radius: 3 } }
        }
    });
}

// --- PARTIES SAUVEGARDÉES ---
function renderCounterSessionsList() {
    const cont = document.getElementById('counter-sessions-list');
    const sessions = counterSessions().sort((a, b) => b.updatedAt - a.updatedAt);
    if (!sessions.length) {
        cont.innerHTML = '<div class="text-center py-6 text-slate-500 text-sm">Aucune partie pour le moment.</div>';
        return;
    }
    cont.innerHTML = sessions.map(s => {
        const active = counterSession && s.id === counterSession.id;
        const leader = s.rounds.length ? counterRanking(s)[0] : null;
        const dateStr = new Date(s.updatedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${active ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-800'}">
                <div class="min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-slate-100 truncate">${escapeHtml(s.name)}</span>
                        ${active ? '<span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Ouverte</span>' : ''}
                    </div>
                    <p class="text-xs text-slate-400 mt-1 truncate">${escapeHtml(s.game.name)} · ${escapeHtml(s.players.join(', '))}</p>
                    <p class="text-[11px] text-slate-500">${s.rounds.length} manche(s)${leader ? ` · en tête : ${escapeHtml(leader.name)} (${leader.total})` : ''} · ${dateStr}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                    ${active ? '' : `<button onclick="loadCounterSession('${s.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold px-3 py-2 rounded-lg transition">Ouvrir</button>`}
                    <button onclick="deleteCounterSession('${s.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium px-3 py-2 rounded-lg transition">Supprimer</button>
                </div>
            </div>`;
    }).join('');
}

function loadCounterSession(id) {
    const s = counterSessions().find(x => x.id === id);
    if (!s) return;
    openCounterSession(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCounterSession(id) {
    const sessions = counterSessions();
    const s = sessions.find(x => x.id === id);
    if (!s || !confirm(`Supprimer définitivement la partie « ${s.name} » ?`)) return;
    saveJson(COUNTER_SESSIONS_KEY, sessions.filter(x => x.id !== id));
    if (counterSession && counterSession.id === id) {
        counterSession = null;
        saveJson(COUNTER_CURRENT_KEY, null);
    }
    renderCounter();
}

// Nouvelle partie avec le même jeu et les mêmes joueurs.
function counterRematch() {
    if (!counterSession) return;
    const prev = counterSession;
    const base = prev.name.replace(/^Revanche – /, '');
    const s = makeCounterSession(prev.game, `Revanche – ${base}`, prev.players.length);
    s.id = generatePartyId();
    s.players = prev.players.slice();
    openCounterSession(s);
}

// --- MODALE : NOUVELLE PARTIE ---
function openCounterNewSession(gameId) {
    const select = document.getElementById('cs-game');
    select.innerHTML = counterGames.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');
    select.value = gameId || (counterSession && counterGames.some(g => g.id === counterSession.game.id) ? counterSession.game.id : counterGames[0].id);
    document.getElementById('cs-name').value = `Partie du ${new Date().toLocaleDateString('fr-FR')}`;
    document.getElementById('cs-players').value = '';
    onCounterSessionGameChange();
    document.getElementById('counter-session-modal').classList.remove('hidden');
}

function onCounterSessionGameChange() {
    const g = counterGames.find(x => x.id === document.getElementById('cs-game').value);
    const input = document.getElementById('cs-players');
    input.min = g.minPlayers;
    input.max = g.maxPlayers;
    input.value = clampPlayerCount(g, input.value || 4);
    document.getElementById('cs-game-summary').innerText = gameSummary(g);
}

function closeCounterSessionModal() {
    document.getElementById('counter-session-modal').classList.add('hidden');
}

function confirmCounterSessionModal() {
    const g = counterGames.find(x => x.id === document.getElementById('cs-game').value);
    const s = makeCounterSession(g, document.getElementById('cs-name').value, document.getElementById('cs-players').value);
    s.id = generatePartyId();
    closeCounterSessionModal();
    openCounterSession(s);
}

// --- MES JEUX (PARAMÈTRES) ---
function renderCounterGamesList() {
    const cont = document.getElementById('counter-games-list');
    cont.innerHTML = counterGames.map(g => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-slate-800/40 border-slate-800">
            <div class="min-w-0">
                <p class="font-semibold text-slate-100 truncate">${escapeHtml(g.name)}</p>
                <p class="text-xs text-slate-400 mt-1">${escapeHtml(gameSummary(g))}</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="openCounterNewSession('${g.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold px-3 py-2 rounded-lg transition">▶ Jouer</button>
                <button onclick="openCounterGameModal('${g.id}')" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition">Modifier</button>
                <button onclick="deleteCounterGame('${g.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium px-3 py-2 rounded-lg transition">✕</button>
            </div>
        </div>`).join('');
}

function openCounterGameModal(id) {
    const g = counterGames.find(x => x.id === id) || makeCounterGame({ name: '' });
    const modal = document.getElementById('counter-game-modal');
    modal.dataset.gameId = id || '';
    document.getElementById('cg-title').innerText = id ? 'Modifier le jeu' : 'Nouveau jeu';
    document.getElementById('cg-name').value = g.name;
    document.getElementById('cg-min').value = g.minPlayers;
    document.getElementById('cg-max').value = g.maxPlayers;
    document.getElementById('cg-scoring').value = g.scoring;
    document.getElementById('cg-lowest').checked = g.lowestWins;
    document.getElementById('cg-start').value = g.startingPoints;
    document.getElementById('cg-target').value = g.targetScore === null ? '' : g.targetScore;
    document.getElementById('cg-error').classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => document.getElementById('cg-name').focus(), 50);
}

function closeCounterGameModal() {
    document.getElementById('counter-game-modal').classList.add('hidden');
}

function confirmCounterGameModal() {
    const id = document.getElementById('counter-game-modal').dataset.gameId;
    const name = document.getElementById('cg-name').value.trim();
    const min = parseInt(document.getElementById('cg-min').value, 10);
    const max = parseInt(document.getElementById('cg-max').value, 10);
    const error = document.getElementById('cg-error');
    const fail = msg => { error.innerText = msg; error.classList.remove('hidden'); };
    if (!name) return fail('Donnez un nom au jeu.');
    if (!(min >= 1 && max >= min && max <= COUNTER_MAX_PLAYERS)) return fail(`Joueurs : minimum ≥ 1, maximum ≥ minimum et ≤ ${COUNTER_MAX_PLAYERS}.`);

    const game = makeCounterGame({
        id: id || generatePartyId(),
        name,
        minPlayers: min,
        maxPlayers: max,
        scoring: document.getElementById('cg-scoring').value,
        lowestWins: document.getElementById('cg-lowest').checked,
        startingPoints: document.getElementById('cg-start').value,
        targetScore: document.getElementById('cg-target').value
    });
    const idx = counterGames.findIndex(x => x.id === game.id);
    if (idx >= 0) counterGames[idx] = game; else counterGames.push(game);
    saveJson(COUNTER_GAMES_KEY, counterGames);

    // Les parties de ce jeu suivent ses nouveaux paramètres (les points déjà saisis ne changent pas).
    const sessions = counterSessions();
    sessions.forEach(s => { if (s.game.id === game.id) s.game = Object.assign({}, game); });
    saveJson(COUNTER_SESSIONS_KEY, sessions);
    if (counterSession && counterSession.game.id === game.id) counterSession.game = Object.assign({}, game);

    closeCounterGameModal();
    renderCounter();
}

function deleteCounterGame(id) {
    const g = counterGames.find(x => x.id === id);
    if (!g) return;
    if (counterGames.length === 1) { alert('Gardez au moins un jeu.'); return; }
    if (!confirm(`Supprimer le jeu « ${g.name} » ? Les parties déjà jouées sont conservées.`)) return;
    counterGames = counterGames.filter(x => x.id !== id);
    saveJson(COUNTER_GAMES_KEY, counterGames);
    renderCounterGamesList();
}
