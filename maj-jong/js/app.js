// --- INITIALISATION, MODES, ONGLETS, PWA ---
// Accueil (choix du mode) → mode Mah-jong (onglets TAB_IDS) ou mode Compteur (view-counter).
// Le mode est dans l'URL (#mahjong, #compteur) pour que le bouton retour du téléphone ramène à l'accueil.

const TAB_IDS = ['dashboard', 'calculator', 'rules', 'parties'];
const VIEW_IDS = ['home', ...TAB_IDS, 'counter'];
const MODE_HASH = { mahjong: '#mahjong', counter: '#compteur' };
let currentMahjongTab = 'dashboard';

window.addEventListener('DOMContentLoaded', () => {
    resetCurrentCalcState();
    renderRules();
    initGame();
    initCounter();
    routeFromHash();
});

window.addEventListener('popstate', routeFromHash);
window.addEventListener('hashchange', routeFromHash);

function initGame() {
    renderPlayerInputs();
    syncCalcSelectors();
    refreshCalculator();
    renderLeaderboard();
    renderHistoryTable();
    initChart();
    updateCurrentPartyLabel();
    renderPartiesList();
}

function routeFromHash() {
    if (location.hash === MODE_HASH.counter) showCounter();
    else if (location.hash === MODE_HASH.mahjong) switchTab(currentMahjongTab);
    else showHome();
}

function openMode(mode) {
    if (location.hash !== MODE_HASH[mode]) history.pushState({ fromHome: true }, '', MODE_HASH[mode]);
    routeFromHash();
}

function goHome() {
    if (history.state && history.state.fromHome) {
        history.back();
    } else {
        history.replaceState(null, '', location.pathname + location.search);
        routeFromHash();
    }
}

function showView(viewId) {
    VIEW_IDS.forEach(id => document.getElementById(`view-${id}`).classList.toggle('hidden', id !== viewId));
    const inMahjong = TAB_IDS.includes(viewId);
    document.getElementById('mahjong-tabs').classList.toggle('hidden', !inMahjong);
    document.getElementById('home-button').classList.toggle('hidden', viewId === 'home');
    document.getElementById('header-subtitle').innerText = inMahjong
        ? 'Mah-jong chinois officiel — comptage par tuiles'
        : viewId === 'counter' ? 'Compteur de points pour tous les jeux' : 'Choisissez un mode';

    const showDock = viewId === 'calculator';
    document.getElementById('tile-dock').classList.toggle('hidden', !showDock);
    document.body.classList.toggle('dock-open', showDock);
}

function showHome() {
    showView('home');
    const rounds = gameState.rounds.length;
    document.getElementById('home-mahjong-status').innerText = currentPartyName
        ? `Partie active : ${currentPartyName} · ${rounds} manche(s)`
        : rounds ? `Partie en cours · ${rounds} manche(s)` : '';
    document.getElementById('home-counter-status').innerText = counterSession
        ? `Partie ouverte : ${counterSession.name} · ${counterSession.rounds.length} manche(s)`
        : '';
}

function showCounter() {
    showView('counter');
    setTimeout(() => { if (counterChartInstance) counterChartInstance.resize(); }, 40);
}

function switchTab(tabId) {
    currentMahjongTab = tabId;
    showView(tabId);
    TAB_IDS.forEach(id => {
        document.getElementById(`tab-${id}`).className = id === tabId
            ? "flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-emerald-600 text-slate-950"
            : "flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-slate-200";
    });

    if (tabId === 'dashboard') {
        setTimeout(() => { if (chartInstance) { chartInstance.resize(); chartInstance.update(); } }, 40);
    } else if (tabId === 'calculator') {
        refreshCalculator();
    } else if (tabId === 'parties') {
        renderPartiesList();
    }
}

// --- INSTALLATION DE L'APPLICATION (PWA) ---
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('install-button');
    if (btn) btn.classList.remove('hidden');
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const btn = document.getElementById('install-button');
    if (btn) btn.classList.add('hidden');
});

async function installApp() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    const btn = document.getElementById('install-button');
    if (btn) btn.classList.add('hidden');
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { });
    });
}
