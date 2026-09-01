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
