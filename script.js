const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; 
let myBoard = [];
let markedByHost = [];

// ลิสต์คำศัพท์ (ใส่ให้เยอะกว่า 24 คำเพื่อให้แต่ละคนได้บอร์ดไม่เหมือนกัน)
const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD",
  "NICE TRY", "SAGE REZ", "ULT READY", "AFK", "SPY GLASS"
];

function generateNewBoard() {
    // 1. สุ่มคำศัพท์มา 24 คำ (เว้นไว้ 1 ช่องสำหรับ FREE)
    let shuffled = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 24);
    
    // 2. แทรกคำว่า "FREE" ไว้ตรงกลาง (ตำแหน่งที่ 13)
    shuffled.splice(12, 0, "FREE ✅");
    
    myBoard = shuffled;
    renderBoard();
}

function renderBoard() {
    const boardDiv = document.getElementById('bingo-board');
    if(!boardDiv) return;
    boardDiv.innerHTML = '';
    
    myBoard.forEach((word) => {
        // ช่อง FREE จะถูกมาร์คโดยอัตโนมัติเสมอ
        const isMarked = markedByHost.includes(word) || word === "FREE ✅";
        const cell = document.createElement('div');
        cell.className = `cell ${isMarked ? 'marked' : ''}`; 
        cell.innerText = word;
        
        cell.onclick = () => {
            if (document.getElementById('username').value === "JJAZ420") {
                toggleMark(word);
            }
        };
        boardDiv.appendChild(cell);
    });
}

async function toggleMark(word) {
    if (word === "FREE ✅") return; // กดมาร์คช่องฟรีไม่ได้
    await fetch(`${API_URL}?action=setMark&word=${encodeURIComponent(word)}&key=${HOST_PASSWORD}`);
    syncWithHost(); 
}

async function syncWithHost() {
    try {
        const response = await fetch(`${API_URL}?action=getMarks`);
        const data = await response.json();
        markedByHost = data.marks;
        renderBoard();
    } catch (e) { console.log("Sync error"); }
}

setInterval(() => {
    const user = document.getElementById('username').value;
    if (user && user !== "JJAZ420") {
        setTimeout(syncWithHost, Math.random() * 3000);
    }
}, 20000);
