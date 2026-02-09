const unoApp = {
    state: {
        players: [], // {name: 'Ali', score: 0}
        history: [], // [{round: 1, scores: [10, 0, 5, 20]}]
        round: 1,
        dealerIdx: 0,
        active: false
    },
    tempIdx: null,

    init() {
        const saved = localStorage.getItem('uno_master_v1');
        if(saved) {
            this.state = JSON.parse(saved);
            if(this.state.active) this.renderGame();
        }
    },

    // --- SETUP ---
    generateInputs() {
        const count = document.getElementById('player-count');
        const val = parseInt(count.value);
        
        if(!val || val < 2 || val > 10) {
            count.classList.add('error');
            setTimeout(() => count.classList.remove('error'), 300);
            return;
        }

        const container = document.getElementById('name-inputs');
        container.innerHTML = '';
        for(let i=0; i<val; i++) {
            container.innerHTML += `<input type="text" class="name-in" placeholder="${i+1}. Oyuncu İsmi">`;
        }
        
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    },

    startGame() {
        const inputs = document.querySelectorAll('.name-in');
        const players = [];
        let isValid = true;

        inputs.forEach(inp => {
            if(!inp.value.trim()) {
                inp.classList.add('error');
                setTimeout(() => inp.classList.remove('error'), 300);
                isValid = false;
            } else {
                players.push({ name: inp.value.trim(), score: 0 });
            }
        });

        if(!isValid) return;

        this.state.players = players;
        this.state.history = []; // Geçmişi sıfırla
        this.state.round = 1;
        this.state.dealerIdx = 0;
        this.state.active = true;
        
        this.save();
        this.renderGame();
    },

    // --- OYUN GÖRÜNÜMÜ ---
    renderGame() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('history-btn').classList.remove('hidden');

        const board = document.getElementById('dashboard');
        board.innerHTML = '';

        this.state.players.forEach((p, idx) => {
            // Renk sınıfı için index mantığı CSS'de nth-child ile halledildi
            const dealer = (idx === this.state.dealerIdx) ? '<div class="dealer-badge">D</div>' : '';
            
            board.innerHTML += `
                <div class="uno-card">
                    <div class="card-top">
                        <span class="p-name">${p.name}</span>
                        <i class="fa-solid fa-pen edit-btn" onclick="unoApp.openEdit(${idx})"></i>
                    </div>
                    <div class="p-score">${p.score}</div>
                    ${dealer}
                </div>
            `;
        });
    },

    // --- TUR PUANLARI ---
    openRoundModal() {
        document.getElementById('current-round-display').innerText = this.state.round;
        const list = document.getElementById('round-inputs');
        list.innerHTML = '';

        this.state.players.forEach((p, idx) => {
            list.innerHTML += `
                <div class="input-row">
                    <label>${p.name}</label>
                    <input type="number" id="r-in-${idx}" placeholder="0">
                </div>
            `;
        });
        document.getElementById('round-modal').classList.add('active');
        
        // İlk inputa odaklan
        setTimeout(() => document.getElementById('r-in-0').focus(), 100);
    },

    saveRound() {
        const roundScores = [];
        
        // 1. Puanları topla ve geçmişe eklemek için hazırla
        this.state.players.forEach((p, idx) => {
            const input = document.getElementById(`r-in-${idx}`);
            const val = parseInt(input.value) || 0;
            p.score += val;
            roundScores.push(val);
        });

        // 2. Geçmişe kaydet
        this.state.history.push({
            round: this.state.round,
            scores: roundScores
        });

        // 3. Oyun durumunu ilerlet
        this.state.round++;
        this.state.dealerIdx = (this.state.dealerIdx + 1) % this.state.players.length;

        this.save();
        this.renderGame();
        this.closeModals();
    },

    // --- GEÇMİŞ TABLOSU (HISTORY) ---
    showHistory() {
        const thead = document.getElementById('history-head');
        const tbody = document.getElementById('history-body');
        
        // Başlıklar
        thead.innerHTML = '<th class="history-round-col">#</th>';
        this.state.players.forEach(p => {
            thead.innerHTML += `<th>${p.name}</th>`;
        });

        // Satırlar
        tbody.innerHTML = '';
        if(this.state.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="padding:20px; color:#666;">Henüz tur oynanmadı.</td></tr>';
        } else {
            // Geçmişi tersten sırala (En son tur en üstte)
            [...this.state.history].reverse().forEach(h => {
                let row = `<tr><td class="history-round-col">${h.round}</td>`;
                h.scores.forEach(s => {
                    // 0 puan ise gri, yüksekse beyaz
                    const style = s === 0 ? 'color:#444;' : 'color:white; font-weight:bold;';
                    row += `<td style="${style}">+${s}</td>`;
                });
                row += '</tr>';
                tbody.innerHTML += row;
            });
        }

        document.getElementById('history-modal').classList.add('active');
    },

    // --- EDİT ---
    openEdit(idx) {
        this.tempIdx = idx;
        document.getElementById('edit-val').value = this.state.players[idx].score;
        document.getElementById('edit-modal').classList.add('active');
    },

    saveEdit() {
        const val = parseInt(document.getElementById('edit-val').value);
        if(!isNaN(val)) {
            this.state.players[this.tempIdx].score = val;
            this.save();
            this.renderGame();
        }
        this.closeModals();
    },

    // --- BİTİŞ ---
    finishGame() {
        const sorted = [...this.state.players].sort((a,b) => a.score - b.score);
        const list = document.getElementById('rank-list');
        list.innerHTML = '';

        sorted.forEach((p, idx) => {
            const color = idx === 0 ? 'var(--uno-yellow)' : 'white';
            const icon = idx === 0 ? '<i class="fa-solid fa-crown"></i>' : `${idx+1}.`;
            
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333; color:${color}; font-weight:${idx===0?'bold':'normal'}">
                    <span>${icon} ${p.name}</span>
                    <span>${p.score}</span>
                </div>
            `;
        });
        document.getElementById('summary-modal').classList.add('active');
    },

    resetGame() {
        localStorage.removeItem('uno_master_v1');
        location.reload();
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    },

    save() { localStorage.setItem('uno_master_v1', JSON.stringify(this.state)); }
};

window.onload = () => unoApp.init();