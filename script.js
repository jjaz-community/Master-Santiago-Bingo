const API_URL = "https://script.google.com/macros/s/AKfycbyP6x4HFkkg_Nu1A8TA2moD_q3MWSKeN7SmhIchW96wPFisjKhBixVXfTKIAkc5nutZkw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];

// ใช้ localStorage เพื่อจำรหัสแมพล่าสุด แม้จะกด Refresh หน้าเว็บ
let lastMapCode = localStorage.getItem('jjaz_last_map') || ""; 

const BINGO_WORDS = [
  "NS WIN", "PRX WIN", "ACE", "OP NO SCOPE", "KNIFE", "SHORTY KILLED", "1V3", "THRIFTY", "BLINDED KILLED", 
  "FLAWLESS", "TEAM ACE", "THROUGH SMOKE", "EWW WHIFFED", "TECH PAUSE", "MOLLY KILLED",
  "BATTLEPASS SKIN", "DEFUSE < 1 SEC", "LINE UP KILLED", "6-7 DETECT", "เสี่ยโดเนท 500", "30 KILLS",
  "BUFF", "OVERTIME", "USELESS TIMEOUT"
];

// --- 1. ฟังก์ชันสร้าง Seed และสุ่มตาราง (คงเดิม) ---
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

// --- 2. ฟังก์ชันหลัก (แก้ไขจุดบกพร่อง) ---
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

        // เช็คว่าถ้าเป็นแมพใหม่ หรือกด Generate ซ้ำในขณะที่มีค่าค้างอยู่
        if (lastMapCode !== mapCode) {
            if (confirm(`ตรวจพบการเปลี่ยนแมพจาก ${lastMapCode || 'ว่างเปล่า'} เป็น ${mapCode}\nต้องการล้างกระดานเก่าใช่หรือไม่?`)) {
                try {
                    // 1. เคลียร์ในเครื่องตัวเองก่อนทันที
                    markedByHost = []; 
                    renderBoard(); 
                    
                    // 2. ส่งไปเคลียร์ที่ Server และรอ (await) จนกว่าจะเสร็จ
                    const clearRes = await fetch(`${API_URL}?action=clear&key=${HOST_PASSWORD}`);
                    const clearData = await clearRes.json();
                    console.log("Server response:", clearData);
                    
                    // 3. บันทึกรหัสแมพใหม่ลง localStorage
                    lastMapCode = mapCode;
                    localStorage.setItem('jjaz_last_map', mapCode);
                } catch (e) { console.error("Clear failed", e); }
            }
        }
    }

    document.getElementById('display-name').innerText = name;
    document.getElementById('display-map-code').innerText = mapCode;

    // --- ระบบสุ่มตาราง (คงเดิม) ---
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

// --- ส่วนที่เหลือ (renderBoard, toggleMark, syncWithHost, checkBingo) ใช้ของเดิมของคุณได้เลย ---
// (ผมตัดออกเพื่อความกระชับ แต่ในไฟล์จริงต้องมีให้ครบนะครับ)
