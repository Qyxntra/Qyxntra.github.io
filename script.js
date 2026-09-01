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
// RUNTIME ASSET INJECTOR (FAVICON, AVATAR & ICONS GUARANTEE)
// ==========================================================================
(function injectGuaranteedAssets() {
  const favUri = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23070a10'/><circle cx='50' cy='50' r='38' fill='none' stroke='%2338bdf8' stroke-width='7'/><text x='50' y='64' font-family='system-ui,sans-serif' font-size='42' font-weight='900' fill='%2338bdf8' text-anchor='middle'>Q</text></svg>";
  const pdpUri = "data:image/webp;base64,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";

  function applyAssets() {
    // 1. Favicon in browser tab
    let links = document.querySelectorAll("link[rel~='icon'], link[rel='apple-touch-icon']");
    if (!links || links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
      links = [link];
    }
    links.forEach(l => {
      l.href = favUri;
    });

    // 2. Profile Avatar Image
    document.querySelectorAll('.profile-avatar-img, .profile-avatar-wrapper img').forEach(img => {
      if (img.src !== pdpUri) {
        img.src = pdpUri;
      }
      img.style.display = 'block';
      img.style.opacity = '1';
      img.style.visibility = 'visible';
    });

    // 3. Navbar Brevet Button Icon
    const bNav = document.querySelector('.nav-btn-brevet');
    if (bNav) {
      const oldImg = bNav.querySelector('img');
      if (oldImg) oldImg.remove();
      if (!bNav.querySelector('.fa-graduation-cap')) {
        bNav.insertAdjacentHTML('afterbegin', '<i class="fa-solid fa-graduation-cap" style="color:var(--cyan); margin-right:6px; font-size:0.95rem;"></i>');
      }
    }

    // 4. Navbar QXR Button Icon
    const qNav = document.querySelector('.nav-btn-qxr');
    if (qNav) {
      const oldImg = qNav.querySelector('img');
      if (oldImg) oldImg.remove();
      if (!qNav.querySelector('.fa-crosshairs')) {
        qNav.insertAdjacentHTML('afterbegin', '<i class="fa-solid fa-crosshairs" style="color:#c084fc; margin-right:6px; font-size:0.95rem;"></i>');
      }
    }

    // 5. Hero Brevet Button Icon
    const bHero = document.querySelector('.btn-cyan');
    if (bHero) {
      const oldImg = bHero.querySelector('img');
      if (oldImg) oldImg.remove();
      if (!bHero.querySelector('.fa-graduation-cap')) {
        bHero.insertAdjacentHTML('afterbegin', '<i class="fa-solid fa-graduation-cap" style="margin-right:8px; font-size:1.05rem;"></i>');
      }
    }

    // 6. Hero QXR Button Icon
    const qHero = document.querySelector('.btn-purple');
    if (qHero) {
      const oldImg = qHero.querySelector('img');
      if (oldImg) oldImg.remove();
      if (!qHero.querySelector('.fa-crosshairs')) {
        qHero.insertAdjacentHTML('afterbegin', '<i class="fa-solid fa-crosshairs" style="margin-right:8px; font-size:1.05rem;"></i>');
      }
    }

    // 7. Brevet Showcase Header Logo
    const bShowcaseLogo = document.querySelector('#brevet-showcase [style*="border-radius: 14px"]');
    if (bShowcaseLogo) {
      const oldImg = bShowcaseLogo.querySelector('img');
      if (oldImg) {
        bShowcaseLogo.innerHTML = '<i class="fa-solid fa-graduation-cap" style="font-size:2.2rem; color:var(--cyan);"></i>';
        bShowcaseLogo.style.width = '68px';
        bShowcaseLogo.style.height = '68px';
        bShowcaseLogo.style.display = 'flex';
        bShowcaseLogo.style.alignItems = 'center';
        bShowcaseLogo.style.justifyContent = 'center';
        bShowcaseLogo.style.flexShrink = '0';
      }}
    }

    // 8. QXR Showcase Header Logo
    const qShowcaseLogo = document.querySelector('#qxr-showcase [style*="border-radius: 14px"]');
    if (qShowcaseLogo) {
      const oldImg = qShowcaseLogo.querySelector('img');
      if (oldImg) {
        qShowcaseLogo.innerHTML = '<i class="fa-solid fa-crosshairs" style="font-size:2.2rem; color:#c084fc;"></i>';
        qShowcaseLogo.style.width = '68px';
        qShowcaseLogo.style.height = '68px';
        qShowcaseLogo.style.display = 'flex';
        qShowcaseLogo.style.alignItems = 'center';
        qShowcaseLogo.style.justifyContent = 'center';
        qShowcaseLogo.style.flexShrink = '0';
      }}
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAssets);
  } else {
    applyAssets();
  }
  window.addEventListener('load', applyAssets);
  setInterval(applyAssets, 400);
})();
