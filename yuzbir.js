const okeyApp = {
    state: {
        players: [], // {name: 'Ali', total: 0, currentRoundPenalty: 0}
        history: [], // [{round: 1, scores: [101, 20, 0, 50]}]
        active: false,
        roundCount: 1
    },
    tempTargetIndex: null,

    init() {
        const saved = localStorage.getItem('okey_blue_v3');
        if (saved) {
            this.state = JSON.parse(saved);
            if (this.state.active) this.renderGame();
        }
    },

    startGame() {
        const inputs = [
            document.getElementById('p1'), document.getElementById('p2'),
            document.getElementById('p3'), document.getElementById('p4')
        ];
        
        let isValid = true;
        const newPlayers = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('error');
                isValid = false;
                setTimeout(() => input.classList.remove('error'), 500);
            } else {
                newPlayers.push({ name: input.value.trim(), total: 0, currentRoundPenalty: 0 });
            }
        });

        if (!isValid) return;

        this.state.players = newPlayers;
        this.state.history = [];
        this.state.roundCount = 1;
        this.state.active = true;
        this.save();
        this.renderGame();
    },

renderGame() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('history-btn').classList.remove('hidden');

        const board = document.getElementById('board');
        board.innerHTML = '';

        this.state.players.forEach((p, idx) => {
            // Ceza Rozeti: Kartın sağ üst köşesine küçük kırmızı kutu
            const penaltyBadge = p.currentRoundPenalty > 0 
                ? `<div class="penalty-badge">+${p.currentRoundPenalty}</div>` 
                : '';

            board.innerHTML += `
                <div class="player-card">
                    ${penaltyBadge} <div class="card-header">
                        <span class="p-name">${p.name}</span>
                        <i class="fa-solid fa-pen edit-icon" onclick="okeyApp.openEditScoreModal(${idx})"></i>
                    </div>
                    
                    <div class="score-box">
                        <div class="p-total">${p.total}</div>
                    </div>
                    
                    <button class="penalty-btn" onclick="okeyApp.openPenaltyModal(${idx})">
                        Ceza Ekle
                    </button>
                </div>
            `;
        });
    },

    // --- GEÇMİŞ (LOG) ---
    showHistory() {
        const thead = document.getElementById('history-head');
        const tbody = document.getElementById('history-body');

        // Başlıklar
        thead.innerHTML = '<th class="h-round-col">#</th>';
        this.state.players.forEach(p => {
            thead.innerHTML += `<th>${p.name}</th>`;
        });

        // Satırlar
        tbody.innerHTML = '';
        if(this.state.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:20px; color:#666;">Henüz tur oynanmadı.</td></tr>';
        } else {
            [...this.state.history].reverse().forEach(h => {
                let row = `<tr><td class="h-round-col">${h.round}</td>`;
                h.scores.forEach(s => {
                    // Puanı renklendir (0 ise sönük, yüksekse parlak)
                    const style = s > 0 ? 'color:#fff; font-weight:bold;' : 'color:#64748b;';
                    row += `<td style="${style}">+${s}</td>`;
                });
                row += '</tr>';
                tbody.innerHTML += row;
            });
        }
        document.getElementById('history-modal').classList.add('active');
    },

    // --- CEZA ---
    openPenaltyModal(idx) {
        this.tempTargetIndex = idx;
        const p = this.state.players[idx];
        document.getElementById('penalty-target-name').innerText = `${p.name} için Ceza`;
        document.getElementById('manual-penalty-input').value = '';
        document.getElementById('penalty-modal').classList.add('active');
        setTimeout(() => document.getElementById('manual-penalty-input').focus(), 100);
    },

    addPenalty(amount) {
        this.state.players[this.tempTargetIndex].currentRoundPenalty += amount;
        this.save();
        this.renderGame();
        this.closeModals();
    },

    addManualPenalty() {
        const val = parseInt(document.getElementById('manual-penalty-input').value);
        if (isNaN(val) || val <= 0) return;
        this.addPenalty(val);
    },

    // --- DÜZENLEME ---
    openEditScoreModal(idx) {
        this.tempTargetIndex = idx;
        document.getElementById('edit-score-input').value = this.state.players[idx].total;
        document.getElementById('edit-score-modal').classList.add('active');
    },

    saveEditedScore() {
        const val = parseInt(document.getElementById('edit-score-input').value);
        if (!isNaN(val)) {
            this.state.players[this.tempTargetIndex].total = val;
            this.save();
            this.renderGame();
        }
        this.closeModals();
    },

    // --- TUR SONU ---
    openEndRoundModal() {
        const container = document.getElementById('round-inputs-container');
        container.innerHTML = '';
        this.state.players.forEach((p, idx) => {
            const hasPenalty = p.currentRoundPenalty > 0 ? ` (+${p.currentRoundPenalty} Ceza)` : '';
            container.innerHTML += `
                <div style="margin-bottom:12px;">
                    <label style="color:#94a3b8; font-size:13px; display:block; margin-bottom:4px;">${p.name}${hasPenalty}</label>
                    <input type="number" id="round-in-${idx}" placeholder="Elde kalan" style="width:100%; padding:12px;">
                </div>
            `;
        });
        document.getElementById('round-modal').classList.add('active');
    },

    finalizeRound() {
        const roundScores = [];

        this.state.players.forEach((p, idx) => {
            const left = parseInt(document.getElementById(`round-in-${idx}`).value) || 0;
            // O tur için toplam puan (Elde Kalan + Anlık Cezalar)
            const totalRoundScore = left + p.currentRoundPenalty;
            
            p.total += totalRoundScore;
            p.currentRoundPenalty = 0; // Cezaları sıfırla
            
            roundScores.push(totalRoundScore);
        });

        // Geçmişe ekle
        this.state.history.push({
            round: this.state.roundCount,
            scores: roundScores
        });
        this.state.roundCount++;

        this.save();
        this.renderGame();
        this.closeModals();
    },

    // --- BİTİŞ ---
    showEndGameSummary() {
        const sorted = [...this.state.players].sort((a, b) => a.total - b.total);
        const list = document.getElementById('rank-list');
        list.innerHTML = '';

        sorted.forEach((p, index) => {
            const isWinner = index === 0 ? 'winner' : '';
            const icon = index === 0 ? '<i class="fa-solid fa-crown"></i>' : `${index + 1}.`;
            list.innerHTML += `
                <div class="rank-item ${isWinner}">
                    <div>${icon} ${p.name}</div>
                    <div>${p.total}</div>
                </div>
            `;
        });
        document.getElementById('summary-modal').classList.add('active');
    },

    resetGameFull() {
        localStorage.removeItem('okey_blue_v3');
        location.reload();
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    },

    save() { localStorage.setItem('okey_blue_v3', JSON.stringify(this.state)); }
};

window.onload = () => okeyApp.init();