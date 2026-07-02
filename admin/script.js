// ===================== LOGIN SYSTEM =====================
const ADMIN_PASSWORD = "adminriju2578";     // ← এখানে আপনার পাসওয়ার্ড দিন
const AUTH_KEY = "cmb_admin_auth";

const loginScreen   = document.getElementById("loginScreen");
const adminPanel    = document.getElementById("adminPanel");
const passwordInput = document.getElementById("passwordInput");
const loginBtn      = document.getElementById("loginBtn");
const loginError    = document.getElementById("loginError");
const logoutBtn     = document.getElementById("logoutBtn");

function showAdmin(){
  loginScreen.style.display = "none";
  adminPanel.style.display  = "block";
  render();
}

function showLogin(){
  adminPanel.style.display  = "none";
  loginScreen.style.display = "block";
  passwordInput.value = "";
  loginError.style.display = "none";
  passwordInput.focus();
}

function doLogin(){
  const pass = passwordInput.value.trim();
  if (pass === ADMIN_PASSWORD){
    sessionStorage.setItem(AUTH_KEY, "1");
    showAdmin();
  } else {
    loginError.style.display = "block";
    passwordInput.value = "";
    passwordInput.focus();
  }
}

loginBtn.onclick = doLogin;
passwordInput.addEventListener("keydown", function(e){
  if (e.key === "Enter") doLogin();
});

logoutBtn.onclick = function(){
  sessionStorage.removeItem(AUTH_KEY);
  showLogin();
};

// Auto-login (browser বন্ধ করা পর্যন্ত logged in থাকবে)
if (sessionStorage.getItem(AUTH_KEY) === "1"){
  showAdmin();
} else {
  showLogin();
}

// ===================== ADMIN PANEL =====================
const STORAGE_KEY = "cmb_v2_messages";

const listEl        = document.getElementById("list");
const searchEl      = document.getElementById("searchToken");
const refreshBtn    = document.getElementById("refresh");
const clearSearchBtn= document.getElementById("clearSearch");
const deleteAllBtn  = document.getElementById("deleteAll");
const metaInfo      = document.getElementById("metaInfo");

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

function loadAll(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveAll(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function fmtTime(iso){
  try { return new Date(iso).toLocaleString(); }
  catch { return iso; }
}

function copyText(text){
  if (navigator.clipboard){
    navigator.clipboard.writeText(text).then(
      function(){ alert("Copied!"); },
      function(){ fallbackCopy(text); }
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text){
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); alert("Copied!"); }
  catch { alert("Copy failed!"); }
  document.body.removeChild(ta);
}

function render(){
  const all = loadAll();
  const q = (searchEl.value || "").trim().toLowerCase();

  const filtered = q
    ? all.filter(function(x){ return (x.token || "").toLowerCase().includes(q); })
    : all;

  metaInfo.textContent = "Total: " + all.length + " | Showing: " + filtered.length;

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
        '<div class="time">' + escapeHtml(fmtTime(item.createdAt || "")) + '</div>' +
      '</div>' +
      '<div class="previewBox border-' + border + '">' +
        parseToHtml(item.textRaw || "") +
      '</div>' +
      '<div class="rawRow">' +
        '<div class="raw">' + escapeHtml(item.textRaw || "") + '</div>' +
        '<button class="actionBtn" data-copy="1">Copy Raw</button>' +
        '<button class="actionBtn danger" data-del="1">Delete</button>' +
      '</div>';

    wrap.querySelector('[data-copy="1"]').onclick = function(){
      copyText(item.textRaw || "");
    };

    wrap.querySelector('[data-del="1"]').onclick = function(){
      if (!confirm("Delete this message?")) return;
      const arr = loadAll().filter(function(x){ return x.id !== item.id; });
      saveAll(arr);
      render();
    };

    listEl.appendChild(wrap);
  });
}

searchEl.addEventListener("input", render);
refreshBtn.onclick = render;
clearSearchBtn.onclick = function(){ searchEl.value = ""; render(); };

deleteAllBtn.onclick = function(){
  if (!confirm("Delete ALL messages? এই কাজটা undo করা যাবে না।")) return;
  saveAll([]);
  render();
};