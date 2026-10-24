// --- ÉDITEUR DE MAIN : trous à remplir + bandeau de tuiles ---
// Pose : toucher une tuile du bandeau la place dans le trou sélectionné (ou le premier trou vide) ;
// on peut aussi la glisser sur un trou précis. Toucher une tuile posée la retire.

function tileImg(id, cls = '') {
    return `<img src="${tileSrc(id)}" alt="${TILES[id].label}" title="${TILES[id].label}" draggable="false" class="tile-img ${cls}">`;
}

function activeEntry() { return currentCalcState.playerHands[currentCalcState.activePlayerId]; }
function activeHand() { return activeEntry().hand; }

// Un joueur qui n'a pas gagné n'a que des groupes classiques (jamais de type spécial).
function ensureHandForRole(playerId) {
    const entry = currentCalcState.playerHands[playerId];
    if (playerId !== currentCalcState.winnerId && entry.hand.type !== 'standard') {
        const fresh = createHand('standard');
        fresh.flowers = entry.hand.flowers;
        entry.hand = fresh;
    }
}

// Les tuiles sont partagées entre tous les joueurs de la manche : 4 exemplaires de chaque
// tuile (1 par fleur/saison) pour toute la table, pas par joueur.
function countUsedAll(id) {
    return gameState.players.reduce((n, p) => n + countUsed(currentCalcState.playerHands[p.id].hand, id), 0);
}

function firstEmptyHole(hand) {
    for (let g = 0; g < hand.groups.length; g++) {
        const i = hand.groups[g].tiles.indexOf(null);
        if (i >= 0) return { g, i };
    }
    return null;
}

function cursorIsValid(hand, c) {
    return c && hand.groups[c.g] && hand.groups[c.g].tiles[c.i] === null;
}

// ---------- Bandeau ----------

function renderTray() {
    const strip = document.getElementById('tile-dock-strip');
    const hand = activeHand();
    strip.innerHTML = '';
    TILE_ORDER.forEach(id => {
        const left = maxCopies(id) - countUsedAll(id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tray-tile${left <= 0 ? ' empty' : ''}`;
        btn.title = TILES[id].label;
        btn.draggable = left > 0;
        btn.innerHTML = tileImg(id) + (isBonus(id) ? '' : `<span class="tray-count">${left}</span>`);
        btn.onclick = () => placeTile(id);
        btn.ondragstart = (ev) => {
            ev.dataTransfer.setData('text/plain', id);
            ev.dataTransfer.effectAllowed = 'copy';
            btn.classList.add('dragging');
        };
        btn.ondragend = () => btn.classList.remove('dragging');
        strip.appendChild(btn);
    });
}

// ---------- Pose / retrait ----------

function placeTile(id) {
    const hand = activeHand();
    if (countUsedAll(id) >= maxCopies(id)) return;
    if (isBonus(id)) {
        const i = hand.flowers.indexOf(null);
        if (i < 0) return;
        hand.flowers[i] = id;
    } else {
        let c = currentCalcState.cursor;
        if (!cursorIsValid(hand, c)) c = firstEmptyHole(hand);
        if (!c) return;
        hand.groups[c.g].tiles[c.i] = id;
    }
    currentCalcState.cursor = firstEmptyHole(hand);
    onHandChanged();
}

function onHoleClick(g, i) {
    const hand = activeHand();
    if (hand.groups[g].tiles[i]) hand.groups[g].tiles[i] = null;
    currentCalcState.cursor = { g, i };
    onHandChanged();
}

function onFlowerClick(i) {
    activeHand().flowers[i] = null;
    onHandChanged();
}

function allowDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function dragLeave(ev) { ev.currentTarget.classList.remove('drag-over'); }

function dropOnHole(ev, g, i) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    if (!TILES[id] || isBonus(id)) { onHandChanged(); return; }
    const hand = activeHand();
    const slot = hand.groups[g].tiles;
    const replaced = slot[i];
    if (replaced !== id && countUsedAll(id) >= maxCopies(id)) { onHandChanged(); return; }
    slot[i] = id;
    currentCalcState.cursor = firstEmptyHole(hand);
    onHandChanged();
}

function dropOnFlower(ev, i) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData('text/plain');
    const hand = activeHand();
    if (!TILES[id] || !isBonus(id) || countUsedAll(id) >= maxCopies(id)) { onHandChanged(); return; }
    hand.flowers[i] = id;
    onHandChanged();
}

function onHandChanged() {
    renderHandEditor();
    renderTray();
    updateCalculations();
}

// ---------- Réglages de la main ----------

function setHandType(type) {
    const entry = activeEntry();
    const fresh = createHand(type);
    fresh.flowers = entry.hand.flowers;
    entry.hand = fresh;
    currentCalcState.cursor = firstEmptyHole(fresh);
    onHandChanged();
}

function setGroupKindUI(g, kind) {
    const hand = activeHand();
    setGroupKind(hand.groups[g], kind);
    currentCalcState.cursor = firstEmptyHole(hand);
    onHandChanged();
}

function toggleGroupOpen(g, checked) {
    activeHand().groups[g].open = checked;
    updateCalculations();
}

function setFlag(name, value) {
    activeEntry().flags[name] = value;
    updateCalculations();
}

function clearActiveHand() {
    const entry = activeEntry();
    entry.hand = createHand(entry.hand.type);
    entry.flags = makeDefaultFlags();
    currentCalcState.cursor = firstEmptyHole(entry.hand);
    onHandChanged();
}

// ---------- Rendu de l'éditeur ----------

function holeHtml(g, i, tile) {
    const c = currentCalcState.cursor;
    const isCursor = c && c.g === g && c.i === i && !tile;
    return `<button type="button" class="tile-hole${tile ? ' filled' : ''}${isCursor ? ' cursor' : ''}"
        onclick="onHoleClick(${g}, ${i})" ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="dropOnHole(event, ${g}, ${i})"
        aria-label="${tile ? 'Retirer ' + TILES[tile].label : 'Trou vide'}">${tile ? tileImg(tile) : ''}</button>`;
}

function groupTitle(hand, g) {
    const grp = hand.groups[g];
    if (hand.type === 'sevenPairs') return `Paire ${g + 1}`;
    if (grp.kind === 'free') return hand.type === 'orphans' ? 'Treize orphelins (14 tuiles)' : 'Combinaison irrégulière (14 tuiles)';
    return GROUP_LABELS[grp.kind];
}

function renderHandEditor() {
    const state = currentCalcState;
    const pId = state.activePlayerId;
    ensureHandForRole(pId);
    const entry = state.playerHands[pId];
    const hand = entry.hand;
    const isWinner = pId === state.winnerId;
    const player = gameState.players.find(p => p.id === pId);

    document.getElementById('calc-current-player-title').innerText = `Main de : ${player.name}`;
    const badge = document.getElementById('calc-player-status-badge');
    if (isWinner) {
        badge.innerText = 'Gagnant';
        badge.className = 'text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-semibold border border-emerald-500/20 whitespace-nowrap';
    } else {
        badge.innerText = 'Non-gagnant';
        badge.className = 'text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md whitespace-nowrap';
    }

    // Type de mah-jong
    const typeBox = document.getElementById('hand-type-container');
    if (isWinner) {
        typeBox.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div class="flex-1">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Mah-jong réalisé</label>
                    <select onchange="setHandType(this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500">
                        ${Object.entries(HAND_TYPES).map(([k, t]) => `<option value="${k}" ${k === hand.type ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                    <p class="text-xs text-slate-500 mt-1">${HAND_TYPES[hand.type].hint}</p>
                </div>
                <button onclick="clearActiveHand()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-3 rounded-xl text-sm font-medium transition">🗑️ Vider</button>
            </div>`;
    } else {
        typeBox.innerHTML = `
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <p class="text-xs text-slate-400">Joueur qui n'a pas gagné : posez ses pongs, kongs et fleurs. Seuls ces éléments rapportent des points (pongs de dragons, de vents, de 1 et 9, kongs, fleurs).</p>
                <button onclick="clearActiveHand()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap">🗑️ Vider</button>
            </div>`;
    }

    // Groupes
    const groupsBox = document.getElementById('hand-groups');
    groupsBox.innerHTML = '';
    hand.groups.forEach((grp, g) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-800/30 border border-slate-800 rounded-xl p-3 space-y-2';
        const changeable = grp.kind === 'chow' || grp.kind === 'pung' || grp.kind === 'kong';
        const kindSel = changeable
            ? `<select onchange="setGroupKindUI(${g}, this.value)" class="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500">
                ${['chow', 'pung', 'kong'].map(k => `<option value="${k}" ${k === grp.kind ? 'selected' : ''}>${GROUP_LABELS[k]}</option>`).join('')}
               </select>`
            : `<span class="text-xs font-semibold text-slate-300">${groupTitle(hand, g)}</span>`;
        const openBox = changeable
            ? `<label class="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                <input type="checkbox" ${grp.open ? 'checked' : ''} onchange="toggleGroupOpen(${g}, this.checked)" class="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"> Exposé
               </label>`
            : '';
        card.innerHTML = `
            <div class="flex items-center justify-between gap-3">${kindSel}${openBox}</div>
            <div class="flex flex-wrap gap-1.5">${grp.tiles.map((t, i) => holeHtml(g, i, t)).join('')}</div>`;
        groupsBox.appendChild(card);
    });

    // Fleurs et saisons
    document.getElementById('hand-flowers').innerHTML = hand.flowers.map((t, i) =>
        `<button type="button" class="tile-hole bonus${t ? ' filled' : ''}" onclick="onFlowerClick(${i})"
            ondragover="allowDrop(event)" ondragleave="dragLeave(event)" ondrop="dropOnFlower(event, ${i})"
            aria-label="${t ? 'Retirer ' + TILES[t].label : 'Fleur ou saison'}">${t ? tileImg(t) : ''}</button>`).join('');

    renderPhotoBar(entry);

    // Façon de gagner (gagnant seulement)
    const flagsBox = document.getElementById('hand-flags');
    if (!isWinner) { flagsBox.innerHTML = ''; return; }
    const f = entry.flags;
    const sel = (name, options) => `<select onchange="setFlag('${name}', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500">
        ${options.map(([v, l]) => `<option value="${v}" ${f[name] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const chk = (name, label) => `<label class="flex items-center gap-2 bg-slate-800/20 p-2 rounded-xl border border-slate-800/40 text-xs text-slate-300 cursor-pointer select-none">
        <input type="checkbox" ${f[name] ? 'checked' : ''} onchange="setFlag('${name}', this.checked)" class="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"> ${label}</label>`;
    const structured = hand.type === 'standard' || hand.type === 'knittedStraight';
    flagsBox.innerHTML = `
        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1.5 mb-3">Façon de gagner</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${structured ? `<div><span class="block text-[11px] text-slate-500 mb-1">Attente</span>${sel('wait', [['none', 'Autre / non précisée'], ['edge', 'Attente de bord (3 ou 7)'], ['closed', 'Attente au milieu d\'un chow'], ['single', 'Attente sur la paire']])}</div>` : ''}
            <div><span class="block text-[11px] text-slate-500 mb-1">Moment de la partie</span>${sel('lastTile', [['none', 'Normal'], ['draw', 'Dernière tuile du mur (Tsumo)'], ['claim', 'Dernière défausse (Ron)']])}</div>
            ${chk('replacement', 'Tuile de remplacement après un kong (Tsumo)')}
            ${chk('robbing', 'Vol de kong (Ron)')}
            ${chk('lastCopy', 'Dernière tuile restante de sa sorte')}
        </div>`;
}

// ---------- Photo des tuiles (simple aide visuelle, aucune reconnaissance) ----------
// La photo est affichée en fond de l'éditeur de main du joueur ; elle reste en mémoire
// pendant la manche et disparaît à l'enregistrement.

function renderPhotoBar(entry) {
    const card = document.getElementById('hand-editor-card');
    const bar = document.getElementById('hand-photo-bar');
    const photo = entry.photo;
    applyPhotoBackground(card, photo);
    const btn = 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer';
    if (!photo) {
        bar.innerHTML = `
            <div class="flex flex-wrap gap-2">
                <label class="${btn}">📷 Prendre une photo de mes tuiles<input type="file" accept="image/*" capture="environment" class="hidden" onchange="onPhotoPicked(this)"></label>
                <label class="${btn}">🖼️ Choisir une image<input type="file" accept="image/*" class="hidden" onchange="onPhotoPicked(this)"></label>
            </div>`;
        return;
    }
    bar.innerHTML = `
        <div class="flex flex-wrap items-center gap-3">
            <button onclick="openPhotoModal()" class="${btn}">🔍 Voir la photo en grand</button>
            <label class="flex items-center gap-2 text-xs text-slate-400">Assombrir le fond
                <input type="range" min="0" max="95" value="${Math.round(photo.dim * 100)}" oninput="setPhotoDim(this.value)" class="accent-emerald-500 w-28">
            </label>
            <button onclick="removePhoto()" class="${btn}">✖ Retirer</button>
        </div>`;
}

function applyPhotoBackground(card, photo) {
    if (photo) {
        const a = photo.dim;
        card.style.backgroundImage = `linear-gradient(rgba(15,23,42,${a}), rgba(15,23,42,${a})), url("${photo.src}")`;
    } else {
        card.style.backgroundImage = '';
    }
}

function onPhotoPicked(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const entry = activeEntry();
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        entry.photo = { src: canvas.toDataURL('image/jpeg', 0.8), dim: 0.75 };
        renderHandEditor();
    };
    img.onerror = () => { URL.revokeObjectURL(url); alert("Impossible de lire cette image."); };
    img.src = url;
}

function setPhotoDim(value) {
    const entry = activeEntry();
    if (!entry.photo) return;
    entry.photo.dim = parseInt(value) / 100;
    applyPhotoBackground(document.getElementById('hand-editor-card'), entry.photo);
}

function removePhoto() {
    delete activeEntry().photo;
    renderHandEditor();
}

function openPhotoModal() {
    const entry = activeEntry();
    if (!entry.photo) return;
    document.getElementById('photo-modal-img').src = entry.photo.src;
    document.getElementById('photo-modal').classList.remove('hidden');
}

function closePhotoModal() {
    document.getElementById('photo-modal').classList.add('hidden');
}
