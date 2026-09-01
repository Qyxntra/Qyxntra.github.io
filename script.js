/**
 * Qxyntra ("The Mentalist") - Master Portfolio Script
 * Ultra-Fast, Zero-Dependency, Modern Vanilla JavaScript
 */

// ==========================================================================
// GLOBAL STATE & VARIABLES
// ==========================================================================
let bmpUnlocked = false;
let currentZoom = 1;
const minZoom = 0.5;
const maxZoom = 5;
let isPanning = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;

// ==========================================================================
// TOAST NOTIFICATIONS & CLIPBOARD
// ==========================================================================
function showToast(message, duration = 3000) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--cyan); margin-right: 8px;"></i> ${message}`;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

function copyDiscord(tag = '4gkp') {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(tag).then(() => {
      showToast(`Pseudo Discord "${tag}" copié dans le presse-papier !`);
    }).catch(() => {
      fallbackCopy(tag);
    });
  } else {
    fallbackCopy(tag);
  }
}

function fallbackCopy(tag) {
  const textArea = document.createElement('textarea');
  textArea.value = tag;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(`Pseudo Discord "${tag}" copié !`);
  } catch (err) {
    prompt('Copiez le pseudo Discord :', tag);
  }
  document.body.removeChild(textArea);
}

function copyDiscordHandle(e) {
  if (e) e.preventDefault();
  copyDiscord('4gkp');
}

// ==========================================================================
// SHOWCASE TAB SWITCHER (Brevet, QXR, Mécanique)
// ==========================================================================
function initShowcaseGalleries() {
  const allTabBtns = document.querySelectorAll('.g-tab-btn');
  allTabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = btn.closest('.showcase-gallery-container');
      if (!container) return;

      const targetId = btn.getAttribute('data-target');
      if (!targetId) return;

      // Update button active states in this group
      container.querySelectorAll('.g-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panel active states in this group
      container.querySelectorAll('.gallery-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });

      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
        targetPanel.style.display = 'block';
      }
    });
  });
}

// Sub-Image Switcher for Tab Sub-Screenshots
function switchSubImage(btn, imgId, newSrc, newCaption, descBlockId) {
  const img = document.getElementById(imgId);
  if (img) {
    img.src = newSrc;
    img.setAttribute('data-caption', newCaption);
  }

  const parent = btn.parentElement;
  if (parent) {
    parent.querySelectorAll('.sub-thumb-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  const container = btn.closest('.gallery-panel');
  if (container && descBlockId) {
    container.querySelectorAll('.sub-desc-block').forEach(d => {
      d.classList.remove('active');
      d.style.display = 'none';
    });
    const targetDesc = document.getElementById(descBlockId);
    if (targetDesc) {
      targetDesc.classList.add('active');
      targetDesc.style.display = 'block';
    }
  }
}

// ==========================================================================
// LIGHTBOX & ZOOM ENGINE
// ==========================================================================
function openLightbox(src, title, desc) {
  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lbImg');
  const titleEl = document.getElementById('lbTitle');
  const descEl = document.getElementById('lbDesc');
  const badgeEl = document.getElementById('lbBadge');

  if (!modal || !img) return;

  img.src = src;
  if (titleEl) titleEl.textContent = title || 'Aperçu Détaillé';
  if (descEl) descEl.innerHTML = desc || '';

  if (badgeEl) {
    if (src && src.toLowerCase().includes('qxr')) {
      badgeEl.className = 'badge-tag purple';
      badgeEl.textContent = 'QXR External • C++';
    } else {
      badgeEl.className = 'badge-tag cyan';
      badgeEl.textContent = 'Brevet Révision • ODS';
    }
  }

  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  updateImageTransform();

  modal.style.display = 'flex';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
}

function zoomIn() {
  currentZoom = Math.min(maxZoom, +(currentZoom + 0.4).toFixed(2));
  updateImageTransform();
}

function zoomOut() {
  currentZoom = Math.max(minZoom, +(currentZoom - 0.4).toFixed(2));
  if (currentZoom <= 1) {
    translateX = 0;
    translateY = 0;
  }
  updateImageTransform();
}

function resetZoom() {
  currentZoom = 1;
  translateX = 0;
  translateY = 0;
  updateImageTransform();
}

function updateImageTransform() {
  const img = document.getElementById('lbImg');
  const levelEl = document.getElementById('lbZoomLevel');
  const viewport = document.getElementById('lbViewport');

  if (img) {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`;
  }
  if (levelEl) {
    levelEl.textContent = `${Math.round(currentZoom * 100)}%`;
  }
  if (viewport) {
    viewport.style.cursor = currentZoom > 1 ? 'grab' : 'zoom-in';
  }
}

function initLightboxEvents() {
  const viewport = document.getElementById('lbViewport');
  const img = document.getElementById('lbImg');
  if (!viewport || !img) return;

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    currentZoom = Math.max(minZoom, Math.min(maxZoom, +(currentZoom + delta).toFixed(2)));
    if (currentZoom <= 1) {
      translateX = 0;
      translateY = 0;
    }
    updateImageTransform();
  }, { passive: false });

  img.addEventListener('click', (e) => {
    if (isPanning) return;
    if (currentZoom === 1) {
      currentZoom = 2.0;
    } else {
      currentZoom = 1.0;
      translateX = 0;
      translateY = 0;
    }
    updateImageTransform();
  });

  viewport.addEventListener('mousedown', (e) => {
    if (currentZoom > 1) {
      isPanning = true;
      startX = e.clientX - translateX;
      startY = e.clientY - translateY;
      viewport.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPanning && currentZoom > 1) {
      translateX = e.clientX - startX;
      translateY = e.clientY - startY;
      updateImageTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      if (viewport && currentZoom > 1) {
        viewport.style.cursor = 'grab';
      }
    }
  });

  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightboxModal');
    if (!modal || modal.style.display !== 'flex' && !modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === '+' || e.key === '=') zoomIn();
    if (e.key === '-') zoomOut();
    if (e.key === '0') resetZoom();
  });

  document.querySelectorAll('.gallery-image-frame, .gallery-main-img, .zoom-indicator').forEach(el => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', () => {
      const frame = el.closest('.gallery-image-frame') || el;
      const targetImg = frame.querySelector('img') || (el.tagName === 'IMG' ? el : null);
      if (targetImg && targetImg.src) {
        const title = targetImg.getAttribute('data-caption') || targetImg.alt || 'Aperçu Capture';
        const descBlock = frame.closest('.gallery-media-row')?.querySelector('.gallery-info-pane');
        const desc = descBlock ? descBlock.innerHTML : '';
        openLightbox(targetImg.src, title, desc);
      }
    });
  });
}

// ==========================================================================
// CYBER TERMINAL CLI (SECRET SYSTEM & ALL COMMANDS)
// ==========================================================================
function appendTermLine(content, type = '') {
  const terminalOutput = document.getElementById('terminalOutput');
  const terminalBody = document.getElementById('terminalBody');
  if (!terminalOutput) return;

  const line = document.createElement('div');
  line.className = `term-line ${type}`.trim();
  line.innerHTML = content;
  terminalOutput.appendChild(line);
  if (terminalBody) {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}

function executeTermCmd(rawCmd) {
  if (!rawCmd) return;
  const cmd = rawCmd.toLowerCase().trim().replace(/\s+/g, ' ');
  appendTermLine(`<span class="term-prompt">qxyntra@ods:~$</span> ${rawCmd}`);

  // Secret Easter Egg Admin Commands
  const isSecretAdmin = [
    'admin', 'code admin', 'admin code', 'code_admin', 'codeadmin', 
    'code', 'admin brevet', 'brevet admin', 'bryan', 'martins', 
    'pinto', 'bryan martins pinto', 'bryan martins', 'bmp admin'
  ].includes(cmd);

  if (isSecretAdmin) {
    appendTermLine(`
<div style="color:#10b981; font-weight:800; font-size:1.1rem; margin-bottom:6px;">🎉 BRAVO ! TU AS DÉCOUVERT LE SECRET ULTIME !</div>
<div style="color:#fff; margin-bottom:4px;">La personne qui est réellement derrière tout ce travail, c'est :</div>
<div style="background:rgba(245,158,11,0.14); border-left:4px solid var(--amber); border-radius:6px; padding:10px 14px; margin:8px 0;">
  <div style="font-size:1.25rem; font-weight:800; color:#fff;">👑 Bryan Martins Pinto <span style="color:var(--cyan); font-size:0.9rem;">[BMP]</span></div>
  <div style="color:var(--amber); font-weight:700; font-size:0.95rem; margin-top:2px;">Élève en 3ème 1 au Collège Olivier de Serres (ODS)</div>
</div>
<div style="margin-top:6px; line-height:1.6;">Rôle : <strong style="color:#fff;">Concepteur, Développeur & Administrateur Officiel</strong> de l'application <strong>Brevet Révision</strong> et du projet <strong>QXR External</strong>.</div>
<div class="muted" style="margin-top:4px;">Alias : <span style="color:#c084fc; font-weight:600;">"The Mentalist"</span> • Secret Maître validé à 100%.</div>
`);
    return;
  }

  switch (cmd) {
    case 'help':
      appendTermLine("<strong>Commandes disponibles :</strong>", 'cyan');
      appendTermLine("  • <strong>whoami</strong>     : Profil (14 ans, 3e1 au Collège Olivier de Serres)", 'muted');
      appendTermLine("  • <strong>mentalist</strong>  : Profil d'Analyse & Logique (The Mentalist)", 'purple');
      appendTermLine("  • <strong>meca</strong>       : Objectif Ingénieur Mécanique & Moteurs", 'muted');
      appendTermLine("  • <strong>brevet</strong>     : Application Brevet Révision ODS 3e1", 'muted');
      appendTermLine("  • <strong>qxr</strong>        : Logiciel external en C++ sur Roblox", 'muted');
      appendTermLine("  • <strong>internet</strong>   : La vérité sur la cybersécurité et l'invisibilité", 'emerald');
      appendTermLine("  • <strong>bmp</strong>        : Protocole secret", 'amber');
      appendTermLine("  • <strong>clear</strong>      : Effacer l'écran", 'muted');
      break;

    case 'bmp':
      bmpUnlocked = true;
      appendTermLine(`
<div style="color:var(--cyan); font-weight:700;">🔐 [PROTOCOLE SECRET BMP ENCLENCHÉ - NIVEAU 1/2 ACTIF]</div>
<div>Signature : <strong style="color:var(--cyan);">[BMP]</strong> • Qxyntra "The Mentalist"</div>
<div>Statut : <span style="color:#10b981;">Code initial reconnu avec succès.</span></div>
<div style="color:var(--amber); margin-top:4px;">👉 Entrez le Code Maître Secret pour déverrouiller l'accès Administrateur...</div>
`);
      break;

    case 'mentalist':
      appendTermLine(`
<div style="color:#c084fc; font-weight:700;">🔮 [PROFIL : LE MENTALISTE (THE MENTALIST)]</div>
<div>Titre : <strong style="color:var(--amber);">"The Mentalist" (Le Mentaliste)</strong></div>
<div>Identité : <strong style="color:var(--cyan);">Qxyntra</strong> [BMP] • 14 ans (3e1 ODS)</div>
<div>Esprit : <span style="color:#fff;">Observation minutieuse, analyse psychologique et logique, détection des failles et compréhension des mécanismes cachés.</span></div>
<div class="muted">Domaines : Systèmes C++, mémoire vive, géométrie 3D et mécanique moteur automobile.</div>
`);
      break;

    case 'internet':
      appendTermLine(`
<div style="color:var(--emerald); font-weight:700;">🌐 [INTERNET & CYBERSÉCURITÉ - REALITY CHECK]</div>
<div>Règle : <strong style="color:#fff;">L'invisibilité à 100% sur Internet est un mythe.</strong></div>
<div class="muted">Même les hackers laissent des traces : adresses IP de routage, journaux FAI/serveurs, empreintes WebGL et corrélation temporelle.</div>
`);
      break;

    case 'whoami':
      appendTermLine(`<strong>Profil :</strong> Qxyntra surnommé "The Mentalist" [BMP]`, 'cyan');
      appendTermLine("Âge : 14 ans | Niveau : 3ème 1 au Collège Olivier de Serres (ODS)", 'muted');
      appendTermLine("Ambition : Devenir Ingénieur Mécanicien & Concepteur Moteur", 'amber');
      break;

    case 'meca':
      appendTermLine("<strong>Passion :</strong> Mécanique Automobile & Motorsport (Dragster, NASCAR V8, F1 V10, Groupe B)", 'amber');
      appendTermLine("Véhicules de cœur : Audi RS6 C8, BMW M5 V10 & M3 F80, Porsche 911 GT3 RS, Toyota Supra 2JZ-GTE", 'muted');
      break;

    case 'brevet':
      appendTermLine("<strong>Projet :</strong> Brevet Révision — Édition Spéciale Collège Olivier de Serres (3e1)", 'cyan');
      appendTermLine("Fonctionnalités : Fiches, quiz, flashcards, annales, calculatrice 800 pts et 12 mini-jeux.", 'muted');
      break;

    case 'qxr':
      appendTermLine("<strong>Projet :</strong> QXR External (Roblox) développé en C++ sous l'alias The Mentalist.", 'purple');
      appendTermLine("Modules : Aimbot trigonométrique, ESP WorldToScreen 144 FPS et explorateur mémoire DataModel.", 'muted');
      break;

    case 'clear':
    case 'cls':
      const out = document.getElementById('terminalOutput');
      if (out) out.innerHTML = '';
      break;

    default:
      appendTermLine(`Commande inconnue : <span style="color:var(--red);">'${rawCmd}'</span>. Tapez <strong style="color:var(--cyan);">'help'</strong> pour la liste.`, 'muted');
      break;
  }
}

function initTerminal() {
  const terminalInput = document.getElementById('terminalInput');
  if (!terminalInput) return;

  terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = terminalInput.value.trim();
      if (val.length > 0) {
        executeTermCmd(val);
        terminalInput.value = '';
      }
    }
  });
}

// ==========================================================================
// SCROLLSPY & SCROLL PROGRESS
// ==========================================================================
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  const scrollProgress = document.getElementById('scrollProgress');

  function update() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight - windowHeight;

    if (scrollProgress && docHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      scrollProgress.style.width = `${pct}%`;
    }

    let currentSectionId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentSectionId = sec.getAttribute('id');
      }
    });

    if (currentSectionId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href').replace('#', '');
        if (href === currentSectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ==========================================================================
// MAIN INITIALIZATION
// ==========================================================================
function initApp() {
  initShowcaseGalleries();
  initLightboxEvents();
  initTerminal();
  initScrollSpy();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Attach functions to global window for inline onclick attributes
window.executeTermCmd = executeTermCmd;
window.copyDiscord = copyDiscord;
window.copyDiscordHandle = copyDiscordHandle;
window.switchSubImage = switchSubImage;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;


// ==========================================================================

// ==========================================================================
// RUNTIME ASSET INJECTOR (FAVICON, AVATAR & ICONS GUARANTEE)
// ==========================================================================
(function injectGuaranteedAssets() {
  const favUri = "data:image/webp;base64,UklGRvwCAABXRUJQVlA4WAoAAAAQAAAAHwAAHwAAQUxQSDYBAAABkGptmyI5X9dfuxolSlLMGI5mcgx3EJ14jmNJNootMzMpZqq//i8wUAMXEBETgNweqFt+8Po38vetoxubAclQqMvQseMZC3x7ZByQAhxk23cyavwvaiR5sAmSR9B2lgzGAk2N94fgczi0vuBvY7GBPyfhATi0P2VgQuWXWRBkIqcYmFT5tNFlgq38zcSBRyFZy89oqaicAXZTmc7OoeGNWTpaHFzEyBIqt++nliLy8jVaKchf71ntv5XsLq00doxaCuODNYylUO5r+UorgXE+Tpimi/FOLXpYgsDVEBxgSKW8UCOZq79PTWPxczccBGO/LKawwPXwAASzAkNxSm6Ex/+COa+pWlgM/L4WgtwezSdJquUyNfLKIDzyC7D4fGCh17Z4eBTqHDC883YkafbkyEIPOOQEVlA4IKABAACQBwCdASogACAAPlEijUSjoiEYDAQAOAUEs4BS2AQI9PM98af1L7Ae3ALk3ksxjIbCEsX+kCes+4DfkyMbIt+cwhYEy0AA/v+9Ay/jUfzNqZfnm+9MrVZZ+6Q6hvvfSyDy++YL2nnCGjvj36dpO+A3TQmmuP/ml4JGEoRbfzBHBHl2fqf9kZ8ic5HlUcoZwWnAd099eflRvTV8Ks3gCqeEtYUMkID8kfi03OncyiOSY2Ln+vJMTunlLeIYeNL6iAyTr0xsKbcMVcW2OAzDSv4oukl4hD6vrfM5pOQmjqBSHYM2a0Eq8u6Zm57GknxpTYQ5XZOgdZZj9AdgWfxC4UM9+kHojLekGgW2wdWRncRswqe6Z2aENcaUykOB8QtHylg3kVcwG4Zqre7aqrNb0cdDtdZ8A41w3MSZHnZqXSa994b/ngArOOHmhdnW2DfZMcdiB/0aJRU4HemXOdLzIhAJcYEUuyvmplSBlZozv/qeMTAwqJTHX2/NrJd5vejlRULBbHn8HKuHHRA2zF/eHUrr8YkKYCQ6ZEcvzZi1uHgAAA==";
  const pdpUri = "data:image/webp;base64,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";
  const brevetUri = "data:image/webp;base64,UklGRkAEAABXRUJQVlA4IDQEAACQGQCdASpIAEgAPlEkjkWjoiESmgZIOAUEsgBkwEBlAIs5qagHwO9TO3V/ZX1M+cx/dP0r95f+l9QDpDf1g9gD9JfTG9jn9sPSveBVcxH+R5Wfnf/j+4J/GP6P/v95VMG1zLnLpHVm46k1tFPGh4jLUeeFl/7vD1xmvynvuz7iVmaqcFlDYS33Id/IQmki9w2B8p7hTw5k9W6vUpT2zvXbk2M/rNd9DIndQuiZ0KVIg77VaViMDafkvRVunSz6s5CfIgoolRm1/NKuapmVIlZ+yW9vvAAA/vvhWDqAcdavOXA1XK+L7W8ZK92Pjbc4IB3B6uZl5tyrSuNpTMV/s1VOx3/d9HHjF1WBa2jFckrGpM5+b1r3m2e18L62vn+6nEWG1HOTKr1ukdnvdRtLypeyGX/J3VQXJ/NVAiN84+jnc6S4+fbOhsTVei/y6eRi1L9vLsv0sWmeIaVbLXDZi+mneL8k/9UunIPZseg0R51hSC0Hbx/Eyd8Z/kTTq/FW7ijo8xcg14nDC+a99L6YyGLfmSryqTCIUtebvOOWxaKqh6aJg/hz7xNS4rJwUUvjtbq4JxzQeMi+s+8e/+aU3Ua1KDtCNeeVKbfnnyRBoDW25JhVnrZ/C4oLKT+FDbLbkQfS9J7RapsxRxf6N/SxmvPkeahVNCVvZYP4uk/272oThBWUO7UyeJQ2EXB5uXGp03neX5/2EgXEvYOBlHYwr5Ear9OB2wk4CKlZbIX++f39AJVdNLHS9Mv5cfiLmtxeMBQPzkVRK6iscBr+W8rmDPBvHrF/RxUvwFXgDAXNCMLWCf/558qDkhFuB70G6CnNJA3E3whjr1hrKIcrcGwAXYOQ0KYkAJ2xFBMKN0fqjFqfMBPVxHo0piKG0VmRwWtUTcNX8dG137Hroc//jsfGLSc5v/F6E+9BIjOPv+7rfkCyGc8VTcJHzrw8PM0xjrOWXaQJT1NykViWZ47KuvWohOOj4cslPwjGfI2qnpn/3TmhhLRA/7CBc2kf7J8TmlnJfQ3/oRpx1aa2LtE/J4L8XocB+FN83dMVOjm+pFrShHuthDmWnnkOlNkp/MrhmjOPHLkFRBf/otvZoYzhzE8I59kRrndYnk2zvY7OofweBrMr4OQ1Few/A3OfIZiQdrfp+ZlyDsoNRKrU0LNcHnaOx9oIMgAMoLKmXoiTp6q+RS6CMj+4PINITDOho+R+deGrgw/ie9PZQPjnRcJgpMo7fEeO1hOZ5aKOn3NCan30qfzgw/cCHZe/dtaKOssmVVwiSSAtgvQN7njyFB/ROEDEIiM12YYgvejzT9Y7Eq2O5/lb+8/h6bWW+6vFPMEfH1YO6l1lsF0LoHWKwBnPEvU2u33adN6k6e8H9xNlZLNqDQ60s5oJAi5L4HRSNTAq1KafAbZCJf4Nn4PJRgXgJpvje+7O8AAAA=";
  const qxrUri = "data:image/webp;base64,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";

  function applyAssets() {
    // 1. Favicon
    let links = document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']");
    if (!links || links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
      links = [link];
    }
    links.forEach(l => {
      l.type = 'image/webp';
      l.href = favUri;
    });

    // 2. Profile Avatar Image
    document.querySelectorAll('.profile-avatar-img, .profile-avatar-wrapper img').forEach(img => {
      img.src = pdpUri;
      img.style.display = 'block';
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    });

    // 3. Brevet Icons
    document.querySelectorAll('.nav-btn-brevet img, .btn-cyan img, a[href*="brevet"] img, #brevet-showcase img[alt*="Logo"]').forEach(img => {
      if (!img.classList.contains('gallery-main-img')) {
        img.src = brevetUri;
        img.style.display = 'inline-block';
      }
    });

    // 4. QXR Icons
    document.querySelectorAll('.nav-btn-qxr img, .btn-purple img, a[href*="qxr"] img, #qxr-showcase img[alt*="Logo"]').forEach(img => {
      if (!img.classList.contains('gallery-main-img')) {
        img.src = qxrUri;
        img.style.display = 'inline-block';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAssets);
  } else {
    applyAssets();
  }
  window.addEventListener('load', applyAssets);
  setInterval(applyAssets, 1000);
})();
