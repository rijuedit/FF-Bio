const tokenEl     = document.getElementById("token");
const editor      = document.getElementById("editor");
const previewBox  = document.getElementById("previewBox");
const countEl     = document.getElementById("count");

const boldBtn     = document.getElementById("bold");
const italicBtn   = document.getElementById("italic");
const underlineBtn= document.getElementById("underline");
const picker      = document.getElementById("picker");
const borderStyle = document.getElementById("borderStyle");

const submitBtn   = document.getElementById("submit");
const clearBtn    = document.getElementById("clear");

const STORAGE_KEY = "cmb_v2_messages";

function uid(){
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(16).slice(2) + Date.now();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wrapSelection(textarea, left, right){
  const start = textarea.selectionStart ?? 0;
  const end   = textarea.selectionEnd ?? 0;

  const before   = textarea.value.slice(0, start);
  const selected = textarea.value.slice(start, end);
  const after    = textarea.value.slice(end);

  if (!selected){
    textarea.value = before + left + "text" + right + after;
    textarea.focus();
    textarea.setSelectionRange(start + left.length, start + left.length + 4);
  } else {
    textarea.value = before + left + selected + right + after;
    textarea.focus();
    const pos = start + left.length + selected.length + right.length;
    textarea.setSelectionRange(pos, pos);
  }
}

function insertAtCursor(textarea, text){
  const start = textarea.selectionStart ?? textarea.value.length;
  const end   = textarea.selectionEnd ?? textarea.value.length;

  const before = textarea.value.slice(0, start);
  const after  = textarea.value.slice(end);

  textarea.value = before + text + after;
  const pos = start + text.length;
  textarea.focus();
  textarea.setSelectionRange(pos, pos);
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

function refresh(){
  countEl.textContent = editor.value.length + "/280";

  previewBox.classList.remove("border-none", "border-soft", "border-neon");
  previewBox.classList.add("border-" + (borderStyle.value || "soft"));

  const raw = editor.value.trim();
  previewBox.innerHTML = raw ? parseToHtml(raw) : "";
}

boldBtn.onclick      = function(){ wrapSelection(editor, "[b]", "[/b]"); refresh(); };
italicBtn.onclick    = function(){ wrapSelection(editor, "[i]", "[/i]"); refresh(); };
underlineBtn.onclick = function(){ wrapSelection(editor, "[u]", "[/u]"); refresh(); };

document.querySelectorAll(".colorBtn").forEach(function(btn){
  btn.onclick = function(){
    insertAtCursor(editor, btn.dataset.code);
    refresh();
  };
});

picker.oninput = function(){
  const code = "[c/" + picker.value.replace("#", "").toUpperCase() + "]";
  insertAtCursor(editor, code);
  refresh();
};

borderStyle.onchange = refresh;
editor.addEventListener("input", refresh);

clearBtn.onclick = function(){
  editor.value = "";
  refresh();
};

// ===== Submit with Loader + Toast =====
submitBtn.onclick = function(){
  const token   = tokenEl.value.trim();
  const textRaw = editor.value.trim();

  if (!token)   { showToast("Token / Address দিন!", "error"); return; }
  if (!textRaw) { showToast("Message লিখুন!", "error"); return; }

  showLoader();

  setTimeout(function(){
    const payload = {
      id: uid(),
      token: token,
      textRaw: textRaw,
      borderStyle: borderStyle.value || "soft",
      createdAt: new Date().toISOString()
    };

    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    arr.unshift(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 500)));

    hideLoader();
    showToast("✅ Submit Successful", "success");
  }, 1200);
};

// ===== Loader Show/Hide =====
function showLoader(){
  let loader = document.getElementById("customLoader");
  if (!loader){
    loader = document.createElement("div");
    loader.id = "customLoader";
    loader.innerHTML = '<div class="loaderBox"><div class="spinner"></div><p>Submitting...</p></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = "flex";
}

function hideLoader(){
  const loader = document.getElementById("customLoader");
  if (loader) loader.style.display = "none";
}

// ===== Toast (success/error) =====
function showToast(msg, type){
  let toast = document.getElementById("customToast");
  if (!toast){
    toast = document.createElement("div");
    toast.id = "customToast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "toast " + (type || "success") + " show";

  setTimeout(function(){
    toast.className = "toast " + (type || "success");
  }, 2500);
}

refresh();