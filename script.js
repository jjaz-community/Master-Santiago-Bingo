const API_URL = "https://script.google.com/macros/s/AKfycbyP6x4HFkkg_Nu1A8TA2moD_q3MWSKeN7SmhIchW96wPFisjKhBixVXfTKIAkc5nutZkw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];
let lastMapCode = ""; 

const BINGO_WORDS = [
  "NS WIN", "PRX WIN", "ACE", "OP NO SCOPE", "KNIFE", "SHORTY KILLED", "1V3", "THRIFTY", "BLINDED KILLED", 
  "FLAWLESS", "TEAM ACE", "THROUGH SMOKE", "EWW WHIFFED", "TECH PAUSE", "MOLLY KILLED",
  "BATTLEPASS SKIN", "DEFUSE < 1 SEC", "LINE UP KILLED", "6-7 DETECT", "เสี่ยโดเนท 500", "30 KILLS",
  "BUFF", "OVERTIME", "USELESS TIMEOUT"
];

// --- 1. ฟังก์ชันสร้าง Seed และสุ่มตาราง ---
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

// --- 2. ฟังก์ชันหลัก ---
async function generateNewBoard() {
    const name = document.getElementById('username').value.trim();
    const mapCode = document.getElementById('map-code-input').value.trim();

    if (!name || !mapCode) {
        alert("ใส่ชื่อและรหัสแมพก่อนน้าา!");
        return;
    }

    if (name === "JJAZ420") {
        const pass = prompt("กรุณาใส่รหัสผ่านสำหรับสตรีมเมอร์:");
        if (pass !== HOST_PASSWORD) {
            alert("รหัสผ่านไม่ถูกต้อง!");
            return;
        }

        if (lastMapCode !== "" && lastMapCode !== mapCode) {
            try {
                await fetch(`${API_URL}?action=clear&key=${HOST_PASSWORD}`);
                markedByHost = []; 
                console.log("New map: Marks cleared.");
            } catch (e) { console.error("Clear failed", e); }
        }
        lastMapCode = mapCode;
    }

    document.getElementById('display-name').innerText = name;
    document.getElementById('display-map-code').innerText = mapCode;

    const seed = cyrb128(name.toLowerCase() + mapCode.toLowerCase());
    const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

    const teamA = "NS WIN";
    const teamB = "PRX WIN";
    const centerIndex = 12;

    let otherWords = BINGO_WORDS.filter(w => w !== teamA && w !== teamB);
    for (let i = otherWords.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [otherWords[i], otherWords[j]] = [otherWords[j], otherWords[i]];
    }

    let posA, posB;
    while (true) {
        posA = Math.floor(rand() * 25);
        if (posA !== centerIndex) break;
    }
    while (true) {
        posB = Math.floor(rand() * 25);
        let rowA = Math.floor(posA / 5), colA = posA % 5;
        let rowB = Math.floor(posB / 5), colB = posB % 5;
        if (posB !== centerIndex && posB !== posA && rowA !== rowB && colA !== colB) break;
    }

    let shuffled = new Array(25);
    shuffled[centerIndex] = "JJAZ";
    shuffled[posA] = teamA;
    shuffled[posB] = teamB;

    let otherIdx = 0;
    for (let i = 0; i < 25; i++) {
        if (shuffled[i] === undefined) {
            shuffled[i] = otherWords[otherIdx] || "WALLBANG"; 
            otherIdx++;
        }
    }

    myBoard = shuffled;
    await syncWithHost(); 
    renderBoard();
}

// --- 3. ฟังก์ชันวาดตาราง ---
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
            if (currentUser === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });

    if (myBoard.length > 0) checkBingo();
}

// --- 4. ฟังก์ชันส่งข้อมูลและดึงข้อมูล ---
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
    } catch (e) { console.error("Error toggle:", e); }
}

async function syncWithHost() {
    try {
        const response = await fetch(`${API_URL}?action=getMarks`);
        const data = await response.json();
        markedByHost = data.marks || [];
        renderBoard();
    } catch (e) { console.log("Sync failed..."); }
}

// --- 5. ระบบเช็คบิงโกและเอฟเฟกต์ ---
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
    const mapCode = document.getElementById('map-code-input').value.trim();

    if (!overlay || overlay.style.display === 'flex') return;

    let mapDisplay = document.getElementById('win-map-display');
    if (!mapDisplay) {
        mapDisplay = document.createElement('div');
        mapDisplay.id = 'win-map-display';
        mapDisplay.style.cssText = "position: absolute; bottom: 15%; color: #fff; font-size: 28px; font-weight: bold; text-shadow: 0 0 10px #8c0ced; background: rgba(0,0,0,0.7); padding: 15px 30px; border: 2px solid #8c0ced; border-radius: 50px; z-index: 1005; letter-spacing: 2px;";
        overlay.appendChild(mapDisplay);
    }
    mapDisplay.innerText = "VERIFIED MAP: " + mapCode;

    overlay.style.display = 'flex';
    if (video) {
        video.style.zIndex = "1000"; // ให้วิดีโออยู่ด้านหลังข้อความนิดนึง
        video.setAttribute('playsinline', ''); // สำหรับเล่นบนมือถือ
        video.loop = true;
        video.volume = 0.1; // 10% ตามที่ต้องการ
        video.currentTime = 0;
        video.play().catch(e => {
            console.log("Autoplay blocked, attempting unmuted play...");
            video.muted = true; // ถ้าบล็อค ให้ลองเล่นแบบไม่มีเสียงก่อน (แต่ในสตรีมควรทำงานได้ปกติ)
            video.play();
        });
    }
    if (typeof confetti === 'function') {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8c0ced', '#ffffff', '#ffff00'] });
    }
}

function closeWin() {
    const overlay = document.getElementById('win-overlay');
    const video = document.getElementById('win-video');
    if (overlay) overlay.style.display = 'none';
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}

// --- 6. ระบบ Sync ---
setInterval(() => {
    const userEl = document.getElementById('username');
    const currentUserName = userEl ? userEl.value.trim() : "";
    if (currentUserName !== "" && currentUserName !== "JJAZ420") {
        setTimeout(syncWithHost, Math.random() * 5000); 
    }
}, 20000);

syncWithHost();
