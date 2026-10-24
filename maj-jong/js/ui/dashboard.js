// --- TABLEAU DE BORD : joueurs, classement, historique, graphique ---

function updatePlayerCount(count) {
    gameState.playerCount = parseInt(count);
    if (gameState.players.length < gameState.playerCount) {
        for (let i = gameState.players.length; i < gameState.playerCount; i++) {
            gameState.players.push({ id: i, name: `Joueur ${i + 1}`, scores: Array(gameState.rounds.length + 1).fill(gameState.startingPoints) });
        }
    } else {
        gameState.players = gameState.players.slice(0, gameState.playerCount);
    }
    resetCurrentCalcState();
    initGame();
}

function handleNameChange(index, value) {
    gameState.players[index].name = value.trim() || `Joueur ${index + 1}`;
    syncCalcSelectors();
    renderSubTabs();
    updateCalculations();
    renderLeaderboard();
    if (chartInstance) updateChart();
}

function renderPlayerInputs() {
    const cont = document.getElementById('player-inputs-container');
    document.getElementById('player-count').value = gameState.playerCount;
    cont.innerHTML = '';
    gameState.players.forEach((p, i) => {
        const div = document.createElement('div');
        div.className = "bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-1";
        div.innerHTML = `
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nom Joueur ${i + 1}</label>
            <input type="text" value="${escapeHtml(p.name).replace(/"/g, '&quot;')}" oninput="handleNameChange(${i}, this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none text-slate-100">
        `;
        cont.appendChild(div);
    });
}

function deleteRound(idx) {
    if (confirm("Confirmer la suppression de cette manche ?")) {
        gameState.rounds.splice(idx, 1);
        recalculateScores();
        initGame();
    }
}

function resetGame() {
    if (confirm("Réinitialiser toute la partie ? Données non récupérables.")) {
        gameState.rounds = [];
        resetCurrentCalcState();
        recalculateScores();
        initGame();
    }
}

function renderLeaderboard() {
    const cont = document.getElementById('leaderboard-container');
    cont.innerHTML = '';
    const sorted = gameState.players.map(p => ({ name: p.name, score: p.scores[p.scores.length - 1] }))
        .sort((a, b) => b.score - a.score);

    sorted.forEach((p, idx) => {
        const medal = idx === 0 ? '👑 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : '🔹 ';
        const sign = p.score > 0 ? '+' : '';
        const scoreColor = p.score > 0 ? 'text-emerald-400' : p.score < 0 ? 'text-rose-400' : 'text-slate-400';

        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-slate-800/40 p-3.5 rounded-xl border border-slate-800";
        div.innerHTML = `<span class="text-sm font-medium text-slate-300">${medal}${escapeHtml(p.name)}</span><span class="font-bold ${scoreColor}">${sign}${p.score} pts</span>`;
        cont.appendChild(div);
    });
}

function renderHistoryTable() {
    const body = document.getElementById('rounds-history-body');
    const msg = document.getElementById('no-rounds-message');
    body.innerHTML = '';

    document.getElementById('rounds-count').innerText = `${gameState.rounds.length} manche(s) enregistrée(s)`;
    if (gameState.rounds.length === 0) { msg.classList.remove('hidden'); return; }
    msg.classList.add('hidden');

    gameState.rounds.forEach((r, idx) => {
        let impactsHTML = '<div class="space-y-1 text-[11px] min-w-[150px]">';
        gameState.players.forEach(p => {
            const imp = r.impacts[p.id] || 0;
            const cls = imp > 0 ? 'text-emerald-400 font-bold' : imp < 0 ? 'text-rose-400 font-bold' : 'text-slate-500';
            impactsHTML += `<div class="flex justify-between"><span>${escapeHtml(p.name)} :</span><span class="${cls}">${imp > 0 ? '+' : ''}${imp}</span></div>`;
        });
        impactsHTML += '</div>';
        const handLine = r.winnerHand
            ? `<div class="text-[10px] text-slate-500 mt-0.5">${escapeHtml(r.winnerHand)}</div>` : '';

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-800/70 hover:bg-slate-900/40 transition text-slate-300";
        tr.innerHTML = `
            <td class="py-4 px-4 font-bold text-emerald-400">M.${r.roundNum}</td>
            <td class="py-4 px-4 text-xs text-slate-400">${escapeHtml(r.estName)}</td>
            <td class="py-4 px-4 font-semibold text-slate-200">${escapeHtml(r.winnerName)}${handLine}</td>
            <td class="py-4 px-4 text-xs">${r.typeText}</td>
            <td class="py-4 px-4 flex justify-center">${impactsHTML}</td>
            <td class="py-4 px-4 text-right">
                <button onclick="deleteRound(${idx})" class="text-xs text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md transition">Supprimer</button>
            </td>
        `;
        body.appendChild(tr);
    });
}

// --- GRAPHIQUE (adapté aux zéros et aux négatifs) ---
function chartLabels() {
    return Array.from({ length: gameState.rounds.length + 1 }, (_, i) => i === 0 ? "Départ" : `M.${i}`);
}

function initChart() {
    const ctx = document.getElementById('progressionChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: chartLabels(), datasets: generateChartDatasets() },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            },
            elements: { line: { tension: 0.15, borderWidth: 3 }, point: { radius: 3 } }
        }
    });
}

function updateChart() {
    if (!chartInstance) return;
    chartInstance.data.labels = chartLabels();
    chartInstance.data.datasets = generateChartDatasets();
    chartInstance.update();
}

function generateChartDatasets() {
    const pal = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];
    return gameState.players.map((p, idx) => ({
        label: p.name,
        data: [...p.scores],
        borderColor: pal[idx % pal.length],
        backgroundColor: pal[idx % pal.length] + '0d',
        fill: false
    }));
}
