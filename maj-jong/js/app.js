// --- INITIALISATION, ONGLETS, PWA ---

const TAB_IDS = ['dashboard', 'calculator', 'rules', 'parties'];

window.addEventListener('DOMContentLoaded', () => {
    resetCurrentCalcState();
    renderRules();
    initGame();
});

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

function switchTab(tabId) {
    TAB_IDS.forEach(id => {
        const tabBtn = document.getElementById(`tab-${id}`);
        const view = document.getElementById(`view-${id}`);
        if (id === tabId) {
            tabBtn.className = "flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-emerald-600 text-slate-950";
            view.classList.remove('hidden');
        } else {
            tabBtn.className = "flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-slate-400 hover:text-slate-200";
            view.classList.add('hidden');
        }
    });

    const showDock = tabId === 'calculator';
    document.getElementById('tile-dock').classList.toggle('hidden', !showDock);
    document.body.classList.toggle('dock-open', showDock);

    if (tabId === 'dashboard') {
        setTimeout(() => { if (chartInstance) chartInstance.update(); }, 40);
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
