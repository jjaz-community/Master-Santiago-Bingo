const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];

// ลิสต์คำศัพท์ (คุณสามารถเพิ่ม/ลดคำได้ตามใจชอบ)
const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD",
  "NICE TRY", "SAGE REZ", "ULT READY", "AFK", "SPY GLASS"
];

// 1. ฟังก์ชันสุ่มบอร์ดใหม่
function generateNewBoard() {
    // สุ่มคำศัพท์มา 24 คำ
    let shuffled = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 24);
    
    // แทรกคำว่า JJAZ ไว้ตรงกลาง (ตำแหน่งที่ 13 หรือ Index ที่ 12)
    shuffled.splice(12, 0, "JJAZ"); 
    
    myBoard = shuffled;
    renderBoard();
}

// 2. ฟังก์ชันวาดตาราง
function renderBoard() {
    const boardDiv = document.getElementById('bingo-board');
    if(!boardDiv) return;
    boardDiv.innerHTML = '';
    
    myBoard.forEach((word) => {
        // เงื่อนไข: ถ้าเป็นช่อง JJAZ 👑 หรือ Host กดมาร์คคำนั้น ให้ขึ้นสีชมพู (marked)
        const isSpecial = (word === "JJAZ");
        const isMarked = markedByHost.includes(word) || isSpecial;
        
        const cell = document.createElement('div');
        
        // ใส่ Class: cell เป็นพื้นฐาน, marked ถ้าถูกเลือก, และ special-cell สำหรับช่อง JJAZ
        cell.className = `cell ${isMarked ? 'marked' : ''} ${isSpecial ? 'special-cell' : ''}`; 
        cell.innerText = word;
        
        // ระบบคลิกสำหรับ Host (JJAZ420)
        cell.onclick = () => {
            const currentUser = document.getElementById('username').value;
            if (currentUser === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });
}

// 3. ฟังก์ชันส่งข้อมูลมาร์คไปยัง Server
async function toggleMark(word) {
    if (word === "JJAZ 👑") return; // ช่อง JJAZ มาร์คค้างไว้ตลอดอยู่แล้ว ไม่ต้องส่งข้อมูล
    
    try {
        await fetch(`${API_URL}?action=setMark&word=${encodeURIComponent(word)}&key=${HOST_PASSWORD}`);
        syncWithHost(); // อัปเดตหน้าจอตัวเองทันที
    } catch (e) {
        console.error("Error toggling mark:", e);
    }
}

// 4. ฟังก์ชันดึงข้อมูลจาก Server
async function syncWithHost() {
    try {
        const response = await fetch(`${API_URL}?action=getMarks`);
        const data = await response.json();
        markedByHost = data.marks;
        renderBoard();
    } catch (e) {
        console.log("Sync failed, retrying in next cycle...");
    }
}

// 5. ระบบ Auto-Sync ทุก 20 วินาที (เฉพาะคนดู)
setInterval(() => {
    const user = document.getElementById('username').value;
    if (user && user !== "JJAZ420") {
        // สุ่มเวลาดีเลย์ 0-3 วินาที เพื่อไม่ให้ยิง Request พร้อมกัน 200 คน
        const jitter = Math.random() * 3000; 
        setTimeout(syncWithHost, jitter);
    }
}, 20000);

// เรียกใช้ครั้งแรกเมื่อโหลดหน้าเว็บ (เผื่อมีบอร์ดเก่าค้างใน RAM)
syncWithHost();

