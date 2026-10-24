// --- SAUVEGARDE DES PARTIES (LOCALSTORAGE) ---
// Tableau de { id, name, updatedAt, gameState } sous la clé majhong_parties_v1.
const PARTIES_STORAGE_KEY = 'majhong_parties_v1';

function loadSavesFromStorage() {
    try {
        const raw = localStorage.getItem(PARTIES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveSavesToStorage(saves) {
    localStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(saves));
}

function generatePartyId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
