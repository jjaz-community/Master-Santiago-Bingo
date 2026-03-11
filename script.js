const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; // รหัสสำหรับเข้าชื่อ JJAZ420 และใช้ส่งข้อมูลไป Google Sheet
let myBoard = [];
let markedByHost = [];

const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD",
  "NICE TRY", "SAGE REZ", "ULT READY", "AFK", "SPY GLASS"
];

// --- ฟังก์ชันสร้าง Seed เพื่อล็อคตาราง (คงที่ตาม ชื่อ+แมพ) ---
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a, b, c, d) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
        var t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

// --- ฟังก์ชันหลักเมื่อกดปุ่ม Generate ---
function generateNewBoard() {
    const name = document.getElementById('username').value.trim();
    const mapCode = document.getElementById('map-code-input').value.trim();

    if (!name || !mapCode) {
        alert("ใส่ชื่อและรหัสแมพก่อนนะจ๊ะ!");
        return;
    }

    // --- ระบบเช็ครหัสผ่านสำหรับสตรีมเมอร์ (JJAZ420) ---
    if (name === "JJAZ420") {
        const pass = prompt("กรุณาใส่รหัสผ่านสำหรับสตรีมเมอร์:");
        if (pass !== HOST_PASSWORD) {
            alert("รหัสผ่านไม่ถูกต้อง! คุณไม่สามารถใช้ชื่อนี้ได้");
            return;
        }
    }

    // ล็อคชื่อและรหัสแมพโชว์บนบอร์ด
    document.getElementById('display-name').innerText = name;
    document.getElementById('display-map-code').innerText = mapCode;

    // 1. สร้าง Seed จาก ชื่อ+แมพ (ทำให้ตารางคงเดิมทุกครั้งที่กรอกข้อมูลเดิม)
    const seed = cyrb128(name.toLowerCase() + mapCode.toLowerCase());
    const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

    // 2. สับคำศัพท์แบบคงที่ตาม Seed
    let tempWords = [...BINGO_WORDS];
    for (let i = tempWords.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [tempWords[i], tempWords[j]] = [tempWords[j], tempWords[i]];
    }

    // 3. เลือก 24 คำและใส่ตรงกลาง
    let shuffled = tempWords.slice(0, 24);
    shuffled.splice(12, 0, "JJAZ"); 
    
    myBoard = shuffled;
    renderBoard();
}

// --- ฟังก์ชันวาดตาราง ---
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
            const currentUser = document.getElementById('username').value.trim();
            // เฉพาะ JJAZ420 ที่ใส่รหัสผ่านถูกเท่านั้นที่จะคลิกมาร์คคำได้
            if (currentUser === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });

    if (myBoard.length > 0) checkBingo();
}

// --- ฟังก์ชันอื่นๆ (checkBingo, triggerWinEffect, toggleMark, syncWithHost) ---
// (ใช้โค้ดเดิมที่คุณมีได้เลยครับ หรือใส่ต่อท้ายให้ครบปีกกา)

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
    if (isWin) triggerWinEffect();
}

function triggerWinEffect() {
    const overlay = document.getElementById('win-overlay');
    const video = document.getElementById('win-video');
    if (overlay.style.display === 'flex') return;
    overlay.style.display = 'flex';
    if (video) {
        video.volume = 0.15;
        video.currentTime = 0;
        video.play().catch(e => console.log("Autoplay blocked"));
    }
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8c0ced', '#ffffff', '#ffff00'] });
}

function closeWin() {
    const overlay = document.getElementById('win-overlay');
    const video = document.getElementById('win-video');
    if (overlay) overlay.style.display = 'none';
    if (video) video.pause();
}

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
    const user = document.getElementById('username').value.trim();
    if (user && user !== "JJAZ420") {
        setTimeout(syncWithHost, Math.random() * 3000);
    }
}, 20000);

syncWithHost();
