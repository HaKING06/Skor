const app = {
    state: {
        gameType: null, // 'uno' veya '101'
        uno: {
            players: [], // {name: 'Ali', scores: []}
            round: 1,
            isActive: false
        },
        okey: {
            players: [], // {name: 'Ali', scores: [], penalties: []}
            round: 1,
            isActive: false
        }
    },

    init: function() {
        this.loadData();
        this.render();
    },

    // --- NAVIGASYON ---
    selectGame: function(type) {
        this.state.gameType = type;
        document.getElementById('home-screen').style.display = 'none'; // Fade out
        
        if (type === 'uno') {
            document.getElementById('uno-screen').classList.add('active');
            this.checkUnoState();
        } else {
            document.getElementById('okey-screen').classList.add('active');
            this.checkOkeyState();
        }
    },

    goHome: function() {
        document.querySelectorAll('.game-screen').forEach(el => el.classList.remove('active'));
        setTimeout(() => {
            document.getElementById('home-screen').style.display = 'flex';
        }, 300);
        this.state.gameType = null;
    },

    // --- UNO MANTIĞI ---
    checkUnoState: function() {
        if (this.state.uno.isActive) {
            document.getElementById('uno-setup').classList.add('hidden');
            document.getElementById('uno-names').classList.add('hidden');
            document.getElementById('uno-gameboard').classList.remove('hidden');
            this.renderUnoBoard();
        } else {
            document.getElementById('uno-setup').classList.remove('hidden');
            document.getElementById('uno-gameboard').classList.add('hidden');
        }
    },

    setupUnoPlayers: function() {
        const count = document.getElementById('uno-player-count').value;
        if (count < 2) return alert("En az 2 kişi gerekli!");
        
        const container = document.getElementById('uno-name-inputs');
        container.innerHTML = '';
        for(let i=0; i<count; i++) {
            container.innerHTML += `<input type="text" class="uno-name-input" placeholder="${i+1}. Oyuncu İsmi">`;
        }
        
        document.getElementById('uno-setup').classList.add('hidden');
        document.getElementById('uno-names').classList.remove('hidden');
    },

    startUnoGame: function() {
        const inputs = document.querySelectorAll('.uno-name-input');
        const players = [];
        let valid = true;
        inputs.forEach(input => {
            if(!input.value) valid = false;
            players.push({ name: input.value, scores: [] });
        });

        if(!valid) return alert("Lütfen tüm isimleri girin.");

        this.state.uno.players = players;
        this.state.uno.isActive = true;
        this.state.uno.round = 1;
        this.saveData();
        this.checkUnoState();
    },

    renderUnoBoard: function() {
        const list = document.getElementById('uno-score-list');
        document.getElementById('uno-round-counter').innerText = this.state.uno.round;
        list.innerHTML = '';

        this.state.uno.players.forEach(p => {
            const total = p.scores.reduce((a, b) => a + b, 0);
            list.innerHTML += `
                <div class="player-card">
                    <h3>${p.name}</h3>
                    <div class="total-score">${total}</div>
                </div>
            `;
        });
    },

    openUnoModal: function() {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').innerText = "UNO: Tur Sonu Puanları";
        modalBody.innerHTML = '';

        this.state.uno.players.forEach((p, index) => {
            modalBody.innerHTML += `
                <div class="score-input-row">
                    <label>${p.name}</label>
                    <div class="score-inputs">
                        <input type="number" id="uno-score-${index}" placeholder="Elindeki Sayı (0 ise bitti)">
                    </div>
                </div>
            `;
        });
        document.getElementById('score-modal').classList.add('show');
    },

    // --- 101 OKEY MANTIĞI ---
    checkOkeyState: function() {
        if (this.state.okey.isActive) {
            document.getElementById('okey-setup').classList.add('hidden');
            document.getElementById('okey-gameboard').classList.remove('hidden');
            this.renderOkeyBoard();
        } else {
            document.getElementById('okey-setup').classList.remove('hidden');
            document.getElementById('okey-gameboard').classList.add('hidden');
        }
    },

    startOkeyGame: function() {
        const p1 = document.getElementById('okey-p1').value;
        const p2 = document.getElementById('okey-p2').value;
        const p3 = document.getElementById('okey-p3').value;
        const p4 = document.getElementById('okey-p4').value;

        if(!p1 || !p2 || !p3 || !p4) return alert("4 oyuncu ismini de giriniz.");

        this.state.okey.players = [
            { name: p1, scores: [] },
            { name: p2, scores: [] },
            { name: p3, scores: [] },
            { name: p4, scores: [] }
        ];
        this.state.okey.isActive = true;
        this.saveData();
        this.checkOkeyState();
    },

    renderOkeyBoard: function() {
        document.getElementById('okey-round-counter').innerText = this.state.okey.round;
        
        // Tablo Başlığı
        const thead = document.getElementById('okey-table-head');
        thead.innerHTML = '';
        this.state.okey.players.forEach(p => thead.innerHTML += `<th>${p.name.substring(0,6)}..</th>`);

        // Tablo Gövdesi (Turlar)
        const tbody = document.getElementById('okey-table-body');
        tbody.innerHTML = '';
        const roundCount = this.state.okey.players[0].scores.length;

        for(let i=0; i<roundCount; i++) {
            let rowHtml = '<tr>';
            this.state.okey.players.forEach(p => {
                rowHtml += `<td>${p.scores[i]}</td>`;
            });
            rowHtml += '</tr>';
            tbody.innerHTML += rowHtml;
        }

        // Tablo Altı (Toplam)
        const tfoot = document.getElementById('okey-table-foot');
        tfoot.innerHTML = '<tr>';
        this.state.okey.players.forEach(p => {
            const total = p.scores.reduce((a,b)=>a+b, 0);
            tfoot.innerHTML += `<td>${total}</td>`;
        });
        tfoot.innerHTML += '</tr>';
    },

    openOkeyModal: function() {
        const modalBody = document.getElementById('modal-body');
        document.getElementById('modal-title').innerText = "101: Ceza ve El Sonu";
        modalBody.innerHTML = '';

        this.state.okey.players.forEach((p, index) => {
            modalBody.innerHTML += `
                <div class="score-input-row">
                    <label>${p.name}</label>
                    <div class="score-inputs">
                        <input type="number" id="okey-penalty-${index}" placeholder="Ceza (+)">
                        <input type="number" id="okey-extra-${index}" placeholder="El Sonu (+)">
                    </div>
                </div>
            `;
        });
        document.getElementById('score-modal').classList.add('show');
    },

    // --- ORTAK FONKSİYONLAR ---
    saveRoundScores: function() {
        if(this.state.gameType === 'uno') {
            this.state.uno.players.forEach((p, index) => {
                const val = parseInt(document.getElementById(`uno-score-${index}`).value) || 0;
                p.scores.push(val);
            });
            this.state.uno.round++;
            this.saveData();
            this.renderUnoBoard();
        } else {
            // 101 Logic
            this.state.okey.players.forEach((p, index) => {
                const penalty = parseInt(document.getElementById(`okey-penalty-${index}`).value) || 0;
                const extra = parseInt(document.getElementById(`okey-extra-${index}`).value) || 0;
                // 101'de toplam puan o tura eklenir
                p.scores.push(penalty + extra); 
            });
            this.state.okey.round++;
            this.saveData();
            this.renderOkeyBoard();
        }
        this.closeModal();
    },

    closeModal: function() {
        document.getElementById('score-modal').classList.remove('show');
    },

    resetGame: function(type) {
        if(!confirm("Tüm skorlar silinecek. Emin misin?")) return;
        
        if(type === 'uno') {
            this.state.uno = { players: [], round: 1, isActive: false };
            this.checkUnoState();
            // Setup ekranını resetle
            document.getElementById('uno-names').innerHTML = '';
            document.getElementById('uno-player-count').value = '';
        } else {
            this.state.okey = { players: [], round: 1, isActive: false };
            this.checkOkeyState();
            // Inputları temizle
            document.getElementById('okey-p1').value = '';
            document.getElementById('okey-p2').value = '';
            document.getElementById('okey-p3').value = '';
            document.getElementById('okey-p4').value = '';
        }
        this.saveData();
    },

    // --- LOCAL STORAGE ---
    saveData: function() {
        localStorage.setItem('gameScoreApp', JSON.stringify(this.state));
    },

    loadData: function() {
        const saved = localStorage.getItem('gameScoreApp');
        if(saved) {
            this.state = JSON.parse(saved);
            // Sayfa yenilendiğinde hangi oyun aktifse o ekranı aç
            if(this.state.uno.isActive) { 
                // Eğer son bırakılan Uno ise, kullanıcı seçimi ile oraya gidecek
            }
        }
    }
};

// Uygulamayı Başlat
window.onload = function() {
    app.init();
};