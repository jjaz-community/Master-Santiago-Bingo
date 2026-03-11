const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];

const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD",
  "NICE TRY", "SAGE REZ", "ULT READY", "AFK", "SPY GLASS"
];

// --- 1. ฟังก์ชันสุ่มบอร์ดใหม่ ---
function generateNewBoard() {
    const nameInput = document.getElementById('username');
    const mapInput = document.getElementById('map-code-input');
    
    const name = nameInput ? nameInput.value.trim() : "";
    const mapCode = mapInput ? mapInput.value.trim() : "";

    if (!name || !mapCode) {
        alert("ใส่ชื่อและรหัสแมพจากสตรีมก่อนนะจ๊ะ!");
        return;
    }

    const displayName = document.getElementById('display-name');
    const displayMap = document.getElementById('display-map-code');
    
    if(displayName) displayName.innerText = name;
    if(displayMap) displayMap.innerText = mapCode;

    let shuffled = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 24);
    shuffled.splice(12, 0, "JJAZ"); 
    
    myBoard = shuffled;
    renderBoard();
}

// --- 2. ฟังก์ชันวาดตาราง ---
function renderBoard() {
    const boardDiv = document.getElementById('bingo-board');
    if(!boardDiv) return;
    boardDiv.innerHTML = '';
    
    myBoard.forEach((word) => {
        const isSpecial = (word === "JJAZ");
        const isMarked = markedByHost.includes(word) || isSpecial;
        
        const cell = document.createElement('div');
        cell.className = `cell ${isMarked ? 'marked' : ''} ${isSpecial ? 'special-cell' : ''}`; 
        cell.innerText = word;
        
        cell.onclick = () => {
            const userEl = document.getElementById('username');
            const currentUser = userEl ? userEl.value.trim() : "";
            if (currentUser === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });

    if (myBoard.length > 0) {
        checkBingo();
    }
}

// --- 3. ฟังก์ชันเช็คบิงโก ---
function checkBingo() {
    const cells = document.querySelectorAll('.cell');
    if (cells.length === 0) return;

    let markedIndices = [];
    cells.forEach((cell, index) => {
        if (cell.classList.contains('marked')) markedIndices.push(index);
    });

    const winPatterns = [
        [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
        [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
        [0,6,12,18,24], [4,8,12,16,20]
    ];

    const isWin = winPatterns.some(pattern => pattern.every(index => markedIndices.includes(index)));

    if (isWin) {
        triggerWinEffect();
    }
}

// --- 4. ฟังก์ชันแสดงเอฟเฟกต์ชนะ ---
function triggerWinEffect() {
    const overlay = document.getElementById('win-overlay');
    const video = document.getElementById('win-video');
    const mapCode = document.getElementById('display-map-code').innerText;
    const playerName = document.getElementById('display-name').innerText;

    if (overlay.style.display === 'flex') return;

    document.getElementById('win-details').innerText = `PLAYER: ${playerName} | MATCH: ${mapCode}`;
    overlay.style.display = 'flex';

    if (video) {
        video.volume = 0.15;
        video.currentTime = 0;
        video.play().catch(e => console.log("Autoplay blocked"));
    }

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8c0ced', '#ffffff', '#ffff00']
    });
}

function closeWin() {
    const overlay = document.getElementById('win-overlay');
    const video = document.getElementById('win-video');
    if(overlay) overlay.style.display = 'none';
    if(video) video.pause();
}

// --- 5. ระบบสื่อสารกับ Server ---
async function toggleMark(word) {
    if (word === "JJAZ") return;
    if (markedByHost.includes(word)) {
        markedByHost = markedByHost.filter(w => w !== word);
    } else {
        markedByHost.push(word);
    }
    renderBoard();
    try {
        await fetch(`${API_URL}?action=setMark&word=${encodeURIComponent(word)}&key=${HOST_PASSWORD}`);
    } catch (e) { console.error("Error:", e); }
}

async function syncWithHost() {
    try {
        const response = await fetch(`${API_URL}?action=getMarks`);
        const data = await response.json();
        markedByHost = data.marks || [];
        renderBoard();
    } catch (e) { console.log("Sync failed..."); }
}

setInterval(() => {
    const userEl = document.getElementById('username');
    const user = userEl ? userEl.value.trim() : "";
    if (user && user !== "JJAZ420") {
        setTimeout(syncWithHost, Math.random() * 3000);
    }
}, 20000);

syncWithHost();
