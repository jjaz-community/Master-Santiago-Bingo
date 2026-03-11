const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];

// ลิสต์คำศัพท์เดิมของคุณ
const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD",
  "NICE TRY", "SAGE REZ", "ULT READY", "AFK", "SPY GLASS"
];

// --- 1. ฟังก์ชันสุ่มบอร์ดใหม่ (เวอร์ชันอัปเกรด: เช็ครหัสและล็อคชื่อ) ---
function generateNewBoard() {
    const name = document.getElementById('username').value.trim();
    const mapCode = document.getElementById('map-code-input').value.trim();

    // เช็คว่ากรอกครบไหม
    if (!name || !mapCode) {
        alert("ใส่ชื่อและรหัสแมพจากสตรีมก่อนนะจ๊ะ!");
        return;
    }

    // ล็อคข้อมูลแสดงผลบนหัวบอร์ด (สำหรับตอนคนดูแคปจอส่ง)
    const displayName = document.getElementById('display-name');
    const displayMap = document.getElementById('display-map-code');
    
    if(displayName) displayName.innerText = name;
    if(displayMap) displayMap.innerText = mapCode;

    // --- ส่วนสุ่มตารางเดิมของคุณ ---
    // สุ่มคำศัพท์มา 24 คำ
    let shuffled = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 24);
    
    // แทรกคำว่า JJAZ ไว้ตรงกลาง (ตำแหน่งที่ 13 หรือ Index ที่ 12)
    shuffled.splice(12, 0, "JJAZ"); 
    
    myBoard = shuffled;
    renderBoard();
}

// 2. ฟังก์ชันวาดตาราง (เหมือนเดิม)
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
            // เฉพาะ JJAZ420 เท่านั้นที่กดมาร์คเพื่อเปลี่ยนสีให้ทุกคนได้
            if (currentUser === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });
}

// 3. ฟังก์ชันส่งข้อมูลมาร์คไปยัง Server (เหมือนเดิม)
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
    } catch (e) {
        console.error("Error toggling mark:", e);
    }
}

// 4. ฟังก์ชันดึงข้อมูลจาก Server (เหมือนเดิม)
async function syncWithHost() {
    try {
        const response = await fetch(`${API_URL}?action=getMarks`);
        const data = await response.json();
        markedByHost = data.marks || [];
        renderBoard();
    } catch (e) {
        console.log("Sync failed, retrying...");
    }
}

// 5. ระบบ Auto-Sync ทุก 20 วินาที (เฉพาะคนดู)
setInterval(() => {
    const user = document.getElementById('username').value.trim();
    if (user && user !== "JJAZ420") {
        const jitter = Math.random() * 3000; 
        setTimeout(syncWithHost, jitter);
    }
}, 20000);

// เรียกใช้ครั้งแรก
syncWithHost();
