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
// DYNAMIC FAVICON & ASSET GUARANTEE ENGINE
// ==========================================================================
(function ensureFaviconAndAssets() {
  const favDataUri = "data:image/png;base64,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";
  
  function applyFavicon() {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.type = 'image/png';
    link.href = favDataUri;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFavicon);
  } else {
    applyFavicon();
  }
  window.addEventListener('load', applyFavicon);
})();
