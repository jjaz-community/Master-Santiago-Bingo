const API_URL = "https://script.google.com/macros/s/AKfycbxdG-VbpjhtO8Q1UPhl1Z0vN0YQNBWhL774f3iABODXnKqQ0-t5S1I7fKl1hcBiHfQzaw/exec"; 
const HOST_PASSWORD = "1234"; // ต้องตรงกับใน Code.gs
let myBoard = [];
let markedByHost = [];

// ลิสต์คำศัพท์เดิมของคุณ (ใส่ให้ครบ 25 คำขึ้นไป)
const BINGO_WORDS = [
  "ACE", "OP KILL", "KNIFE", "FLANK", "CLUTCH", "PLANT", "DEFUSE", 
  "HEADSHOT", "TEAM ACE", "TRIPLE", "QUADRA", "NINJA", "UTILITY USE",
  "STUNNED", "BLINDED", "THRIFTY", "ECO WIN", "RETAKE", "BOMB EXPLODE",
  "PERFECT", "OVERTIME", "SAVE", "JUMP SHOT", "WALLBANG", "FIRST BLOOD"
];

function generateNewBoard() {
    myBoard = [...BINGO_WORDS].sort(() => Math.random() - 0.5).slice(0, 25);
    renderBoard();
}

function renderBoard() {
    const boardDiv = document.getElementById('bingo-board');
    if(!boardDiv) return;
    boardDiv.innerHTML = '';
    myBoard.forEach((word) => {
        const isMarked = markedByHost.includes(word);
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

// เช็คสถานะจาก Host ทุก 20 วินาที + สุ่มเวลากระจายคิว (Jitter)
setInterval(() => {
    const user = document.getElementById('username').value;
    if (user && user !== "JJAZ420") {
        const jitter = Math.random() * 3000; 
        setTimeout(syncWithHost, jitter);
    }
}, 20000);
