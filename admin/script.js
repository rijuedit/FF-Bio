// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9V19skkEDk-MQnbbfUNvu2aInmqi41rY",
  authDomain: "ff-bio-9d3fb.firebaseapp.com",
  projectId: "ff-bio-9d3fb",
  storageBucket: "ff-bio-9d3fb.firebasestorage.app",
  messagingSenderId: "9648954233",
  appId: "1:9648954233:web:2ff2faa5c0702f4019eda8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== Login =====
const ADMIN_PASSWORD = "admin123";
const AUTH_KEY = "cmb_admin_auth";

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");

let allMessages = [];
let unsubscribe = null;

function showAdmin(){
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
  startListening();
}

function showLogin(){
  adminPanel.style.display = "none";
  loginScreen.style.display = "block";
  if (unsubscribe) unsubscribe();
}

loginBtn.onclick = function(){
  if (passwordInput.value === ADMIN_PASSWORD){
    sessionStorage.setItem(AUTH_KEY, "1");
    showAdmin();
  } else {
    loginError.style.display = "block";
  }
};

passwordInput.addEventListener("keydown", function(e){
  if (e.key === "Enter") loginBtn.click();
});

logoutBtn.onclick = function(){
  sessionStorage.removeItem(AUTH_KEY);
  showLogin();
};

if (sessionStorage.getItem(AUTH_KEY) === "1") showAdmin();

// ===== Firebase Listener =====
function startListening(){
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(q, function(snapshot){
    allMessages = [];
    snapshot.forEach(function(docSnap){
      allMessages.push({ id: docSnap.id, ...docSnap.data() });
    });
    render();
  });
}

// ===== Helpers =====
function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseToHtml(raw){
  let s = escapeHtml(raw).replace(/\n/g, "<br>");
  s = s.replace(
    /\[(?:c\/|#)?([0-9A-Fa-f]{6})\]([\s\S]*?)(?=\[(?:c\/|#)?[0-9A-Fa-f]{6}\]|$)/g,
    function(_m, color, content){
      return '<span style="color:#' + color.toUpperCase() + '">' + content + '</span>';
    }
  );
  for (let i = 0; i < 4; i++){
    s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
    s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
    s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  }
  return s;
}

function fmtTime(ts){
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  } catch { return ""; }
}

function render(){
  const q = document.getElementById("searchToken").value.trim().toLowerCase();
  const filtered = q ? allMessages.filter(function(x){ return (x.token || "").toLowerCase().includes(q); }) : allMessages;

  document.getElementById("metaInfo").textContent = "Total: " + allMessages.length + " | Showing: " + filtered.length;

  const listEl = document.getElementById("list");
  listEl.innerHTML = "";

  if (filtered.length === 0){
    listEl.innerHTML = '<div class="item">No messages found.</div>';
    return;
  }

  filtered.forEach(function(item){
    const wrap = document.createElement("div");
    wrap.className = "item";
    const border = item.borderStyle || "soft";

    wrap.innerHTML =
      '<div class="itemTop">' +
        '<div class="badge">Token: ' + escapeHtml(item.token || "") + '</div>' +
        '<div class="time">' + escapeHtml(fmtTime(item.createdAt)) + '</div>' +
      '</div>' +
      '<div class="previewBox border-' + border + '">' + parseToHtml(item.textRaw || "") + '</div>' +
      '<div class="rawRow">' +
        '<div class="raw">' + escapeHtml(item.textRaw || "") + '</div>' +
        '<button class="actionBtn" data-copy="1">Copy Raw</button>' +
        '<button class="actionBtn danger" data-del="1">Delete</button>' +
      '</div>';

    wrap.querySelector('[data-copy="1"]').onclick = function(){
      navigator.clipboard.writeText(item.textRaw || "").then(
        function(){ alert("Copied!"); }
      );
    };

    wrap.querySelector('[data-del="1"]').onclick = async function(){
      if (!confirm("Delete this message?")) return;
      try {
        await deleteDoc(doc(db, "messages", item.id));
      } catch (err) {
        alert("Delete failed: " + err.message);
      }
    };

    listEl.appendChild(wrap);
  });
}

document.getElementById("searchToken").addEventListener("input", render);
document.getElementById("refresh").onclick = render;
document.getElementById("clearSearch").onclick = function(){
  document.getElementById("searchToken").value = "";
  render();
};

document.getElementById("deleteAll").onclick = async function(){
  if (!confirm("Delete ALL messages? এই কাজটা undo করা যাবে না।")) return;
  try {
    for (const item of allMessages){
      await deleteDoc(doc(db, "messages", item.id));
    }
  } catch (err) {
    alert("Delete All failed: " + err.message);
  }
};