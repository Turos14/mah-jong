// --- INTERFACE DES PARTIES (sauvegarde, chargement, suppression) ---
function updateCurrentPartyLabel() {
    const label = document.getElementById('current-party-label');
    if (!label) return;
    label.innerText = currentPartyName ? `Partie active : ${currentPartyName}` : 'Partie non sauvegardée';
}

// --- MODALE DE NOMMAGE (Sauvegarde / Nouvelle Partie) ---
function openSaveModal() {
    document.getElementById('name-modal-title').innerText = 'Sauvegarder la partie';
    document.getElementById('name-modal-input').value = currentPartyName || `Partie du ${new Date().toLocaleDateString('fr-FR')}`;
    document.getElementById('name-modal').dataset.mode = 'save';
    document.getElementById('name-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('name-modal-input').select(), 50);
}

function openCreatePartyModal() {
    document.getElementById('name-modal-title').innerText = 'Nouvelle partie';
    document.getElementById('name-modal-input').value = `Partie du ${new Date().toLocaleDateString('fr-FR')}`;
    document.getElementById('name-modal').dataset.mode = 'create';
    document.getElementById('name-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('name-modal-input').select(), 50);
}

function closeNameModal() {
    document.getElementById('name-modal').classList.add('hidden');
}

function confirmNameModal() {
    const input = document.getElementById('name-modal-input');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const mode = document.getElementById('name-modal').dataset.mode;
    if (mode === 'save') {
        doSaveParty(name);
    } else if (mode === 'create') {
        doCreateParty(name);
    }
    closeNameModal();
}

// --- CRUD DES PARTIES ---
function doSaveParty(name) {
    const saves = loadSavesFromStorage();
    const snapshot = JSON.parse(JSON.stringify(gameState));
    if (currentPartyId) {
        const idx = saves.findIndex(s => s.id === currentPartyId);
        if (idx >= 0) {
            saves[idx].name = name;
            saves[idx].updatedAt = Date.now();
            saves[idx].gameState = snapshot;
        } else {
            saves.push({ id: currentPartyId, name, updatedAt: Date.now(), gameState: snapshot });
        }
    } else {
        currentPartyId = generatePartyId();
        saves.push({ id: currentPartyId, name, updatedAt: Date.now(), gameState: snapshot });
    }
    currentPartyName = name;
    saveSavesToStorage(saves);
    updateCurrentPartyLabel();
    renderPartiesList();
}

function doCreateParty(name) {
    const saves = loadSavesFromStorage();
    const id = generatePartyId();
    saves.push({ id, name, updatedAt: Date.now(), gameState: makeDefaultGameState() });
    saveSavesToStorage(saves);
    loadPartyById(id);
}

function loadPartyById(id) {
    const saves = loadSavesFromStorage();
    const entry = saves.find(s => s.id === id);
    if (!entry) return;
    gameState = JSON.parse(JSON.stringify(entry.gameState));
    currentPartyId = entry.id;
    currentPartyName = entry.name;
    resetCurrentCalcState();
    initGame();
    const menu = document.getElementById('load-menu');
    if (menu) menu.classList.add('hidden');
    switchTab('dashboard');
}

function deletePartyById(id) {
    const saves = loadSavesFromStorage();
    const entry = saves.find(s => s.id === id);
    if (!entry) return;
    if (!confirm(`Supprimer définitivement la partie "${entry.name}" ? Cette action est irréversible.`)) return;
    saveSavesToStorage(saves.filter(s => s.id !== id));
    if (currentPartyId === id) {
        currentPartyId = null;
        currentPartyName = null;
        updateCurrentPartyLabel();
    }
    renderPartiesList();
    renderLoadMenu();
}

function renderPartiesList() {
    const cont = document.getElementById('parties-list-container');
    const msg = document.getElementById('no-parties-message');
    if (!cont) return;
    const saves = loadSavesFromStorage().sort((a, b) => b.updatedAt - a.updatedAt);
    cont.innerHTML = '';
    if (saves.length === 0) {
        msg.classList.remove('hidden');
        return;
    }
    msg.classList.add('hidden');
    saves.forEach(s => {
        const isActive = s.id === currentPartyId;
        const playersNames = (s.gameState.players || []).map(p => p.name).join(', ');
        const roundsCount = (s.gameState.rounds || []).length;
        const dateStr = new Date(s.updatedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const div = document.createElement('div');
        div.className = `flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${isActive ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-800'}`;
        div.innerHTML = `
            <div class="min-w-0">
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-slate-100 truncate">${escapeHtml(s.name)}</span>
                    ${isActive ? '<span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Active</span>' : ''}
                </div>
                <p class="text-xs text-slate-400 mt-1 truncate">${escapeHtml(playersNames)} · ${roundsCount} manche(s) · ${dateStr}</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="loadPartyById('${s.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-semibold px-3 py-2 rounded-lg transition">Charger</button>
                <button onclick="deletePartyById('${s.id}')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium px-3 py-2 rounded-lg transition">Supprimer</button>
            </div>
        `;
        cont.appendChild(div);
    });
}

// --- MENU DÉROULANT DE CHARGEMENT RAPIDE ---
function renderLoadMenu() {
    const menu = document.getElementById('load-menu');
    if (!menu) return;
    const saves = loadSavesFromStorage().sort((a, b) => b.updatedAt - a.updatedAt);
    if (saves.length === 0) {
        menu.innerHTML = '<div class="text-xs text-slate-500 text-center py-4 px-2">Aucune partie sauvegardée.</div>';
        return;
    }
    menu.innerHTML = '';
    saves.forEach(s => {
        const isActive = s.id === currentPartyId;
        const dateStr = new Date(s.updatedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const btn = document.createElement('button');
        btn.onclick = () => loadPartyById(s.id);
        btn.className = `w-full text-left px-3 py-2 rounded-lg text-sm transition ${isActive ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-200'}`;
        btn.innerHTML = `<div class="font-medium truncate">${escapeHtml(s.name)}</div><div class="text-[10px] text-slate-500">${dateStr}</div>`;
        menu.appendChild(btn);
    });
}

function toggleLoadMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('load-menu');
    if (menu.classList.contains('hidden')) {
        renderLoadMenu();
        menu.classList.remove('hidden');
    } else {
        menu.classList.add('hidden');
    }
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('load-menu');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('button[onclick^="toggleLoadMenu"]')) {
        menu.classList.add('hidden');
    }
});
