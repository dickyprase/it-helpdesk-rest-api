const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const router = Router();
marked.setOptions({ gfm: true, breaks: true });

const DOCS_DIR = path.join(__dirname, '..', '..', 'docs');

const PAGES = [
  { slug: 'overview',  file: '01-overview.md',  title: 'Overview',       icon: '📋' },
  { slug: 'flow',      file: '02-flow.md',      title: 'Alur Aplikasi',  icon: '🔄' },
  { slug: 'database',  file: '03-database.md',  title: 'Database & ERD', icon: '🗄️' },
  { slug: 'endpoints', file: '04-endpoints.md', title: 'API Endpoints',  icon: '⚡' },
  { slug: 'php-guide', file: '05-php-guide.md', title: 'Integrasi PHP',  icon: '🐘' },
];

function renderPage(activePage) {
  const page = PAGES.find(p => p.slug === activePage) || PAGES[0];
  const mdPath = path.join(DOCS_DIR, page.file);
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const htmlContent = marked(markdown);

  const sidebarItems = PAGES.map(p => {
    const active = p.slug === page.slug;
    return `<a href="/docs/${p.slug}" class="nav-item ${active ? 'active' : ''}">${p.icon} ${p.title}</a>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.title} — IT Helpdesk API</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#fff;--bg2:#f8fafc;--bg3:#f1f5f9;
  --bg-tbl-h:#f1f5f9;--bg-tbl-s:#f8fafc;--bg-bq:#eff6ff;
  --c:#0f172a;--c2:#475569;--c3:#94a3b8;
  --b:#e2e8f0;--b-bq:#3b82f6;--accent:#3b82f6;
  --sb-bg:#f8fafc;--sb-thumb:#cbd5e1;
  --sidebar-bg:#fff;--sidebar-w:260px;
  /* Code: light — soft cream background */
  --code-bg:#fafafa;--code-border:#e5e7eb;--code-text:#383a42;--code-shadow:0 1px 3px rgba(0,0,0,.06);
  --code-inline-bg:#f3f4f6;--code-inline-c:#be185d;
  --ln-c:#9ca3af;--ln-border:#e5e7eb;
  --lang-bg:#f3f4f6;--lang-c:#9ca3af;
  /* Syntax: One Light */
  --hl-keyword:#a626a4;--hl-string:#50a14f;--hl-number:#986801;--hl-func:#4078f2;
  --hl-var:#e45649;--hl-comment:#a0a1a7;--hl-type:#c18401;--hl-builtin:#c18401;
  --hl-tag:#e45649;--hl-attr:#986801;--hl-symbol:#0184bc;--hl-meta:#9ca3af;
}
.dark{
  --bg:#0f172a;--bg2:#1e293b;--bg3:#1e293b;
  --bg-tbl-h:#1e293b;--bg-tbl-s:#162032;--bg-bq:#172554;
  --c:#e2e8f0;--c2:#94a3b8;--c3:#64748b;
  --b:#334155;--b-bq:#3b82f6;--accent:#60a5fa;
  --sb-bg:#1e293b;--sb-thumb:#475569;
  --sidebar-bg:#0f172a;
  /* Code: dark — One Dark Pro */
  --code-bg:#282c34;--code-border:#3e4451;--code-text:#abb2bf;--code-shadow:0 2px 8px rgba(0,0,0,.3);
  --code-inline-bg:#1e293b;--code-inline-c:#f472b6;
  --ln-c:#4b5263;--ln-border:#3e4451;
  --lang-bg:rgba(255,255,255,.06);--lang-c:#636d83;
  /* Syntax: One Dark */
  --hl-keyword:#c678dd;--hl-string:#98c379;--hl-number:#d19a66;--hl-func:#61afef;
  --hl-var:#e06c75;--hl-comment:#5c6370;--hl-type:#e5c07b;--hl-builtin:#e5c07b;
  --hl-tag:#e06c75;--hl-attr:#d19a66;--hl-symbol:#56b6c2;--hl-meta:#636d83;
}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--c);line-height:1.7;transition:background .2s,color .2s}
::-webkit-scrollbar{width:7px;height:7px}
::-webkit-scrollbar-track{background:var(--sb-bg)}
::-webkit-scrollbar-thumb{background:var(--sb-thumb);border-radius:4px}

/* ===== Top Bar ===== */
.topbar{position:sticky;top:0;z-index:200;background:var(--bg);border-bottom:1px solid var(--b);height:52px;display:flex;align-items:center;padding:0 1rem}
.topbar-inner{width:100%;display:flex;align-items:center;justify-content:space-between}
.topbar-left{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.95rem;color:var(--c)}
.topbar-left span{color:var(--accent)}
.topbar-right{display:flex;align-items:center;gap:6px}
.btn{background:var(--bg2);border:1px solid var(--b);color:var(--c2);border-radius:7px;padding:5px 11px;font-size:.78rem;cursor:pointer;transition:all .15s;text-decoration:none;display:flex;align-items:center;gap:4px}
.btn:hover{border-color:var(--accent);color:var(--accent)}
.menu-btn{display:none;background:none;border:none;color:var(--c2);font-size:1.3rem;cursor:pointer;padding:4px}

/* ===== Layout ===== */
.layout{display:flex;min-height:calc(100vh - 52px)}

/* ===== Sidebar ===== */
.sidebar{width:var(--sidebar-w);border-right:1px solid var(--b);background:var(--sidebar-bg);padding:1.25rem 0;position:sticky;top:52px;height:calc(100vh - 52px);overflow-y:auto;flex-shrink:0;transition:transform .25s}
.sidebar-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--c3);padding:0 1.25rem;margin:1rem 0 .4rem}
.sidebar-label:first-child{margin-top:0}
.nav-item{display:flex;align-items:center;gap:8px;padding:8px 1.25rem;font-size:.88rem;color:var(--c2);text-decoration:none;border-left:3px solid transparent;transition:all .12s}
.nav-item:hover{background:var(--bg2);color:var(--c)}
.nav-item.active{background:var(--bg2);color:var(--accent);border-left-color:var(--accent);font-weight:600}

/* ===== Main ===== */
.main{flex:1;min-width:0;padding:2rem 2.5rem 4rem;max-width:860px}

/* ===== Content ===== */
.content h1{font-size:1.85rem;font-weight:800;margin:2rem 0 .6rem;padding-bottom:.4rem;border-bottom:2px solid var(--b);color:var(--c)}
.content h1:first-child{margin-top:0}
.content h2{font-size:1.35rem;font-weight:700;margin:2.2rem 0 .6rem;padding-bottom:.35rem;border-bottom:1px solid var(--b);color:var(--c)}
.content h3{font-size:1.08rem;font-weight:600;margin:1.8rem 0 .4rem;color:var(--c)}
.content h4{font-size:.95rem;font-weight:600;margin:1.2rem 0 .3rem;color:var(--c2)}
.content p{margin:.5rem 0;color:var(--c2)}
.content strong{color:var(--c);font-weight:600}
.content a{color:var(--accent);text-decoration:none}
.content a:hover{text-decoration:underline}
.content hr{border:none;border-top:1px solid var(--b);margin:1.8rem 0}
.content ul,.content ol{margin:.4rem 0;padding-left:1.4rem;color:var(--c2)}
.content li{margin:.2rem 0}
/* ===== Code: inline ===== */
.content code{font-family:'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace;font-size:.82em;background:var(--code-inline-bg);color:var(--code-inline-c);padding:2px 6px;border-radius:5px;border:1px solid var(--b)}

/* ===== Code: block ===== */
.content pre{background:var(--code-bg);border:1px solid var(--code-border);border-radius:10px;overflow-x:auto;margin:.75rem 0;position:relative;padding:0;box-shadow:var(--code-shadow)}
.content pre code{background:none;border:none;padding:1rem 1.1rem;display:block;color:var(--code-text);font-size:.8rem;line-height:1.75;font-family:'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace}

/* Line numbers */
.content pre code .hljs-ln-numbers{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;text-align:right;color:var(--ln-c);border-right:1px solid var(--ln-border);padding-right:18px;width:36px;min-width:36px}
.content pre code .hljs-ln-code{padding-left:22px}
.content pre code table.hljs-ln{border:none;margin:0}
.content pre code table.hljs-ln tr{border:none}
.content pre code table.hljs-ln td{border:none;padding:1px 0}

/* Copy button — always visible top-right */
.copy-btn{position:absolute;top:8px;right:8px;background:var(--lang-bg);border:1px solid var(--code-border);color:var(--lang-c);border-radius:6px;padding:4px 14px;font-size:.72rem;cursor:pointer;transition:all .15s;z-index:2;font-family:system-ui;line-height:1.4}
.copy-btn:hover{background:var(--code-border);color:var(--code-text)}

/* Language badge — left of copy button */
.code-lang{position:absolute;top:10px;right:80px;background:var(--lang-bg);color:var(--ln-c);font-size:.6rem;padding:2px 8px;border-radius:4px;font-family:system-ui;text-transform:uppercase;letter-spacing:.06em;pointer-events:none}
.table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.content table{width:100%;border-collapse:collapse;margin:.65rem 0;font-size:.85rem;border:1px solid var(--b);border-radius:9px;overflow:hidden}
.content thead th{background:var(--bg-tbl-h);color:var(--c);font-weight:600;text-align:left;padding:9px 12px;border-bottom:2px solid var(--b);font-size:.78rem;text-transform:uppercase;letter-spacing:.03em}
.content tbody td{padding:8px 12px;border-bottom:1px solid var(--b);color:var(--c2);vertical-align:top}
.content tbody tr:nth-child(even){background:var(--bg-tbl-s)}
.content tbody tr:last-child td{border-bottom:none}
.content blockquote{background:var(--bg-bq);border-left:4px solid var(--b-bq);border-radius:0 7px 7px 0;padding:.65rem .9rem;margin:.65rem 0}
.content blockquote p{color:var(--c2);margin:0;font-size:.88rem}
.content blockquote strong{color:var(--c)}

/* ===== Images ===== */
.content img{max-width:100%;height:auto;border-radius:9px;border:1px solid var(--b);cursor:zoom-in;transition:opacity .15s}
.content img:hover{opacity:.85}

/* ===== Lightbox ===== */
.lightbox{display:none;position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.85);backdrop-filter:blur(6px);cursor:zoom-out;align-items:center;justify-content:center;padding:1rem;opacity:0;transition:opacity .2s}
.lightbox.open{display:flex;opacity:1}
.lightbox img{max-width:95vw;max-height:92vh;object-fit:contain;border-radius:10px;border:none;cursor:default;box-shadow:0 8px 40px rgba(0,0,0,.5)}
.lightbox-close{position:absolute;top:12px;right:16px;background:rgba(255,255,255,.15);border:none;color:#fff;font-size:1.6rem;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s}
.lightbox-close:hover{background:rgba(255,255,255,.3)}
.lightbox-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,.5);font-size:.75rem}

/* ===== Mobile ===== */
@media(max-width:768px){
  .sidebar{position:fixed;top:52px;left:0;bottom:0;z-index:150;transform:translateX(-100%);width:280px;box-shadow:4px 0 20px rgba(0,0,0,.15)}
  .sidebar.open{transform:translateX(0)}
  .overlay{display:none;position:fixed;inset:0;top:52px;z-index:140;background:rgba(0,0,0,.4)}
  .overlay.show{display:block}
  .menu-btn{display:block}
  .main{padding:1.2rem 1rem 3rem}
  .content h1{font-size:1.4rem}
  .content h2{font-size:1.15rem}
  .content h3{font-size:1rem}
  .content pre{padding:.7rem;font-size:.75rem}
  .content table{font-size:.78rem}
  .content thead th,.content tbody td{padding:6px 8px}
}
/* Highlight.js — theme-aware via CSS variables */
.hljs{background:transparent!important;padding:0!important}
pre .hljs-comment,pre .hljs-quote{color:var(--hl-comment);font-style:italic}
pre .hljs-keyword,pre .hljs-selector-tag,pre .hljs-deletion{color:var(--hl-keyword)}
pre .hljs-string,pre .hljs-doctag,pre .hljs-regexp{color:var(--hl-string)}
pre .hljs-number,pre .hljs-literal,pre .hljs-boolean{color:var(--hl-number)}
pre .hljs-built_in,pre .hljs-type{color:var(--hl-builtin)}
pre .hljs-function .hljs-title,pre .hljs-title.function_,pre .hljs-title{color:var(--hl-func)}
pre .hljs-variable,pre .hljs-template-variable,pre .hljs-property{color:var(--hl-var)}
pre .hljs-tag,pre .hljs-name{color:var(--hl-tag)}
pre .hljs-attr,pre .hljs-attribute{color:var(--hl-attr)}
pre .hljs-symbol,pre .hljs-bullet,pre .hljs-link{color:var(--hl-symbol)}
pre .hljs-meta,pre .hljs-meta .hljs-keyword{color:var(--hl-meta)}
pre .hljs-title.class_,pre .hljs-class .hljs-title{color:var(--hl-type)}
pre .hljs-addition{color:var(--hl-string)}
pre .hljs-section{color:var(--hl-func);font-weight:700}
pre .hljs-emphasis{font-style:italic}
pre .hljs-strong{font-weight:700}
</style>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/php.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlightjs-line-numbers.js/2.8.0/highlightjs-line-numbers.min.js"></script>
</head>
<body>
<!-- Top Bar -->
<div class="topbar">
  <div class="topbar-inner">
    <div class="topbar-left">
      <button class="menu-btn" onclick="toggleSidebar()" aria-label="Menu">☰</button>
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="6" fill="currentColor" style="color:var(--accent)"/><path d="M8 18v-2a8 8 0 0116 0v2" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="6" y="17" width="4" height="6" rx="1.5" fill="#fff"/><rect x="22" y="17" width="4" height="6" rx="1.5" fill="#fff"/></svg>
      <span>API</span> Docs
    </div>
    <div class="topbar-right">
      <button class="btn" onclick="toggleTheme()" id="themeBtn">🌙 Dark</button>
      <a href="/api/v1" class="btn">⚡ API</a>
    </div>
  </div>
</div>

<!-- Overlay for mobile sidebar -->
<div class="overlay" id="overlay" onclick="closeSidebar()"></div>

<!-- Layout -->
<div class="layout">
  <!-- Sidebar -->
  <nav class="sidebar" id="sidebar">
    <div class="sidebar-label">Dokumentasi</div>
    ${sidebarItems}
  </nav>

  <!-- Main Content -->
  <main class="main">
    <div class="content" id="content">
      ${htmlContent}
    </div>
  </main>
</div>

<!-- Lightbox -->
<div class="lightbox" id="lightbox" onclick="closeLightbox()">
  <button class="lightbox-close" onclick="closeLightbox()" aria-label="Tutup">&times;</button>
  <img id="lightbox-img" src="" alt="Preview"/>
  <span class="lightbox-hint">Klik di mana saja atau tekan Esc untuk menutup</span>
</div>

<script>
// Lightbox
function openLightbox(src){
  var lb=document.getElementById('lightbox');
  document.getElementById('lightbox-img').src=src;
  lb.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  var lb=document.getElementById('lightbox');
  lb.classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLightbox()});

// Make all content images clickable
document.querySelectorAll('.content img').forEach(function(img){
  img.addEventListener('click',function(){openLightbox(this.src)});
  img.title='Klik untuk memperbesar';
});

function getTheme(){return localStorage.getItem('api-docs-theme')||'light'}
function applyTheme(t){document.body.classList.toggle('dark',t==='dark');document.getElementById('themeBtn').textContent=t==='dark'?'☀️ Light':'🌙 Dark';localStorage.setItem('api-docs-theme',t)}
function toggleTheme(){applyTheme(getTheme()==='dark'?'light':'dark')}
applyTheme(getTheme());

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('overlay').classList.toggle('show')}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('overlay').classList.remove('show')}

// Wrap tables
document.querySelectorAll('.content table').forEach(function(t){if(!t.parentElement.classList.contains('table-wrap')){var w=document.createElement('div');w.className='table-wrap';t.parentNode.insertBefore(w,t);w.appendChild(t)}});

// Syntax highlighting + line numbers
document.querySelectorAll('pre code').forEach(function(block){
  hljs.highlightElement(block);
  hljs.lineNumbersBlock(block);
  // Add language badge
  var lang = block.className.match(/language-(\w+)/);
  if(lang && lang[1]){
    var badge = document.createElement('span');
    badge.className='code-lang';
    badge.textContent=lang[1];
    block.parentElement.appendChild(badge);
  }
});

// Copy buttons — always visible
document.querySelectorAll('.content pre').forEach(function(pre){
  var btn=document.createElement('button');
  btn.textContent='Copy';
  btn.className='copy-btn';
  btn.onclick=function(){
    var lines=pre.querySelectorAll('.hljs-ln-code');
    var text=lines.length?Array.from(lines).map(function(td){return td.textContent}).join('\\n'):pre.querySelector('code').textContent;
    navigator.clipboard.writeText(text).then(function(){
      btn.textContent='Copied!';
      btn.style.color='var(--hl-string)';
      setTimeout(function(){btn.textContent='Copy';btn.style.color=''},1500);
    });
  };
  pre.appendChild(btn);
});

// Close sidebar on nav click (mobile)
document.querySelectorAll('.nav-item').forEach(function(a){a.addEventListener('click',closeSidebar)});
</script>
</body>
</html>`;
}

// Redirect /docs to /docs/overview
router.get('/', (_req, res) => res.redirect('/docs/overview'));

// Serve each page
router.get('/:page', (req, res) => {
  try {
    const page = PAGES.find(p => p.slug === req.params.page);
    if (!page) return res.redirect('/docs/overview');
    res.type('html').send(renderPage(req.params.page));
  } catch (err) {
    res.status(500).json({ error: true, message: 'Gagal memuat dokumentasi' });
  }
});

module.exports = router;
