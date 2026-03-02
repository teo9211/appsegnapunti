// Stato dell'applicazione
let appState = {
    loggedInArcher: JSON.parse(localStorage.getItem('currentArcher')) || null,
    sessions: JSON.parse(localStorage.getItem('archerySessions')) || [],
    currentView: 'login'
};

// --- LOGICA DI NAVIGAZIONE ---
window.setView = function(view, params = {}) {
    appState.currentView = view;
    render();
};

function render() {
    const view = appState.currentView;
    if (view === 'login') renderLogin();
    else if (view === 'mainMenu') renderMainMenu();
    else if (view === 'charts') renderChartsView();
    // Aggiungi qui le altre rotte (registrationForm, ecc.) riprendendole dal vecchio file
}

// --- MENU PRINCIPALE (CORRETTO SENZA DUPLICATI) ---
function renderMainMenu() {
    const html = `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-center text-white">Ciao, ${appState.loggedInArcher.nome}!</h2>
            
            <div class="grid gap-4">
                <button class="btn-primary" onclick="window.setView('registrationForm')">🎯 Nuova Sessione</button>
                <button class="btn-primary" onclick="window.setView('charts')">📈 Analisi Unificata (Grafici)</button>
                <button class="btn-primary" onclick="window.setView('dataSummary')">🧾 Riepilogo Dati</button>
            </div>

            <div class="pt-6 border-t border-gray-700">
                <h3 class="text-primary-orange mb-3">Gestione Dati</h3>
                <button class="btn-primary w-full bg-gray-700" onclick="window.setView('exportData')">📥 Esporta & Backup</button>
            </div>
        </div>
    `;
    document.getElementById('content-view').innerHTML = html;
}

// --- VISTA GRAFICI ACCORPATA (UNICA PAGINA) ---
function renderChartsView() {
    const html = `
        <h2 class="text-2xl font-bold mb-6">Analisi Prestazioni</h2>
        
        <div class="space-y-8">
            <div class="bg-secondary-dark p-4 rounded-xl border border-orange-500">
                <h3 class="mb-4 text-orange-400">Andamento Punteggi</h3>
                <canvas id="sessionsChart"></canvas>
            </div>

            <div class="bg-secondary-dark p-4 rounded-xl border border-orange-500">
                <h3 class="mb-4 text-orange-400">Distribuzione Frecce (X/10/9)</h3>
                <canvas id="accuracyChart"></canvas>
            </div>
        </div>

        <button class="btn-primary w-full mt-8 bg-gray-800" onclick="window.setView('mainMenu')">Indietro</button>
    `;
    document.getElementById('content-view').innerHTML = html;
    
    // Inizializza i grafici dopo il render
    setTimeout(() => {
        initUnifiedCharts();
    }, 100);
}

function initUnifiedCharts() {
    // Qui inserisci la logica Chart.js che avevi prima per sessionsChart e accuracyChart
    // Ho rimosso i riferimenti a trainingTrendChart e durationChart come richiesto
}

// Inizializzazione al caricamento
document.addEventListener('DOMContentLoaded', () => {
    window.setView(appState.loggedInArcher ? 'mainMenu' : 'login');
});

// Salvataggio dati
function saveSessions() {
    localStorage.setItem(storageKey, JSON.stringify(appState.sessions));
}

// Formattazione data
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Esportazione JSON
window.exportJSON = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.sessions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "archery_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

// --- REGISTRAZIONE SESSIONE ---
function renderRegistrationForm(params) {
    const type = params.type || 'Allenamento';
    const html = `
        <div class="space-y-4">
            <h2 class="text-2xl font-bold text-primary-orange">Nuova Sessione: ${type}</h2>
            <div class="grid grid-cols-2 gap-3">
                <input type="date" id="session-date" class="input-style" value="${new Date().toISOString().split('T')[0]}">
                <select id="session-dist" class="input-style">${DISTANZA_OPTIONS.map(o => `<option>${o}</option>`).join('')}</select>
            </div>
            
            <div id="shooting-interface" class="bg-secondary-dark p-4 rounded-xl border border-gray-700">
                <div class="flex justify-between items-center mb-4">
                    <span class="text-lg">Volée: <span id="current-volee" class="font-bold text-orange-500">1</span></span>
                    <span class="text-lg">Totale: <span id="running-total" class="font-bold">0</span></span>
                </div>
                
                <div id="arrows-container" class="grid grid-cols-3 gap-2 mb-6 text-center">
                    </div>

                <div class="grid grid-cols-3 gap-2">
                    ${['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(val => 
                        `<button onclick="addArrow('${val}')" class="bg-gray-700 p-4 rounded-lg font-bold hover:bg-orange-600 active:bg-orange-700 transition-colors">${val}</button>`
                    ).join('')}
                </div>
            </div>

            <button onclick="saveCurrentSession('${type}')" class="btn-primary w-full bg-green-600 mt-4">SALVA SESSIONE</button>
            <button onclick="window.setView('mainMenu')" class="w-full text-gray-500 py-2">Annulla</button>
        </div>
    `;
    document.getElementById('content-view').innerHTML = html;
    resetShootingState();
}

let currentSessionData = { arrows: [], total: 0 };

window.addArrow = function(val) {
    if (currentSessionData.arrows.length >= 60) return alert("Sessione completata!");
    currentSessionData.arrows.push(val);
    updateShootingUI();
};

function updateShootingUI() {
    const container = document.getElementById('arrows-container');
    container.innerHTML = currentSessionData.arrows.map(a => `<div class="bg-orange-500/20 p-2 rounded border border-orange-500">${a}</div>`).join('');
    document.getElementById('running-total').innerText = calculateTotal(currentSessionData.arrows);
    document.getElementById('current-volee').innerText = Math.floor(currentSessionData.arrows.length / 3) + 1;
}

function calculateTotal(arrows) {
    return arrows.reduce((sum, a) => {
        if (a === 'X' || a === '10') return sum + 10;
        if (a === 'M') return sum + 0;
        return sum + parseInt(a);
    }, 0);
}

function renderDataSummary() {
    const html = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Storico Sessioni</h2>
            <button onclick="window.setView('mainMenu')" class="bg-gray-700 px-3 py-1 rounded">X</button>
        </div>
        <div class="space-y-3">
            ${appState.sessions.length === 0 ? '<p class="text-center text-gray-500">Nessun dato salvato</p>' : 
              appState.sessions.sort((a,b) => new Date(b.data) - new Date(a.data)).map((s, idx) => `
                <div class="bg-secondary-dark p-4 rounded-lg border-l-4 border-orange-500 flex justify-between items-center">
                    <div>
                        <div class="font-bold">${new Date(s.data).toLocaleDateString()} - ${s.tipo}</div>
                        <div class="text-sm text-gray-400">${s.distanza} | ${s.punteggioTotale} pt</div>
                    </div>
                    <button onclick="deleteSession(${idx})" class="text-red-500">🗑️</button>
                </div>
            `).join('')}
        </div>
    `;
    document.getElementById('content-view').innerHTML = html;
}

function renderCalendar() {
    const html = `
        <h2 class="text-2xl font-bold mb-4 text-white text-center">Calendario Attività</h2>
        <div id="calendar-grid" class="grid grid-cols-7 gap-1 bg-secondary-dark p-2 rounded-xl">
            </div>
        <div id="month-stats" class="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-700">
            </div>
        <button onclick="window.setView('mainMenu')" class="btn-primary w-full mt-6 bg-slate-700">Torna Home</button>
    `;
    document.getElementById('content-view').innerHTML = html;
    generateCalendarGrid();
}

function generateCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    const days = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    grid.innerHTML = days.map(d => `<div class="text-center text-xs text-orange-500 font-bold">${d}</div>`).join('');
    // Aggiungi qui il ciclo per i 31 giorni...
}

function render(params) {
    const container = document.getElementById('content-view');
    if (!container) return;

    switch(appState.currentView) {
        case 'login': renderLogin(); break;
        case 'mainMenu': renderMainMenu(); break;
        case 'registrationForm': renderRegistrationForm(params); break; // AGGIUNTO
        case 'dataSummary': renderDataSummary(); break;               // AGGIUNTO
        case 'calendar': renderCalendar(); break;                     // AGGIUNTO
        case 'charts': renderChartsView(); break;
        case 'exportData': renderExportData(); break;
        default: renderMainMenu();
    }
}