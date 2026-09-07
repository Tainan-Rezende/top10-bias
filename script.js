const SUPABASE_URL = "https://dnbmosykcxbrlmegigau.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuYm1vc3lrY3hicmxtZWdpZ2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4NTM3MjMsImV4cCI6MjEwMjQyOTcyM30._you503MtBMbUjcMAQru_yyuvGNUOaZswN5A953Nuso";

let idolCatalog = [];
let currentSlots = Array(10).fill(null);
let selectedSlotIndex = null;
let draggedSlotIndex = null;
let lastSavedCode = "";

// ==========================================
// INICIALIZAÇÃO DO CATÁLOGO LOCAL
// ==========================================

async function loadIdolCatalog() {
  try {
    const res = await fetch("./idols.json");
    if (!res.ok) throw new Error("Could not load idols.json");
    idolCatalog = await res.json();
  } catch (error) {
    console.error("Catalog load error:", error);
    showToast("Warning: Failed to load local idol database.", "error");
  }
}

// ==========================================
// CONTROLE DE SCROLL DOS MODAIS
// ==========================================

function updateScrollLock() {
  const anyModalOpen =
    document.querySelectorAll('.modal-backdrop[style*="display: flex"]')
      .length > 0;
  if (anyModalOpen) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// BUSCA EM MEMÓRIA (INSTANTÂNEA)
// ==========================================

function normalizeStr(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-_'’.]/g, "");
}

function handleLiveSearch(queryText) {
  const queryClean = (queryText || "").trim();
  const statusElem = document.getElementById("search-status");

  if (queryClean.length < 1) {
    statusElem.innerText =
      "Type idol or group name (e.g. V, Lisa, BTS, Jennie)...";
    renderSearchResults([]);
    return;
  }

  const queryNorm = normalizeStr(queryClean);

  const matched = idolCatalog
    .map((idol) => {
      const nameNorm = normalizeStr(idol.name);
      const realNorm = normalizeStr(idol.realName || "");
      const groupNorm = normalizeStr(idol.group || "");

      let score = 0;
      if (nameNorm === queryNorm) score += 300;
      else if (nameNorm.startsWith(queryNorm)) score += 150;
      else if (nameNorm.includes(queryNorm)) score += 80;

      if (realNorm.startsWith(queryNorm)) score += 120;
      else if (realNorm.includes(queryNorm)) score += 60;

      if (groupNorm === queryNorm) score += 100;
      else if (groupNorm.startsWith(queryNorm)) score += 50;

      if (score === 0) return null;

      return {
        id: idol.id || idol.wikiTitle || idol.name,
        name: idol.name,
        group: (idol.group || "K-POP").toUpperCase(),
        rawTitle: idol.wikiTitle || idol.name,
        img: idol.img,
        score: score,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);

  if (matched.length === 0) {
    statusElem.innerText = `No idols matching "${queryClean}" found.`;
    renderSearchResults([]);
    return;
  }

  statusElem.innerText = `${matched.length} idol(s) found.`;
  renderSearchResults(matched);
}

function renderSearchResults(items) {
  const list = document.getElementById("search-list");
  list.innerHTML = "";

  if (items.length === 0) {
    return;
  }

  items.forEach((idol) => {
    const div = document.createElement("div");
    div.className = "idol-item";
    div.onclick = () => {
      currentSlots[selectedSlotIndex] = idol;
      closeSearchModal();
      renderGrid();
    };
    div.innerHTML = `
      <img src="${idol.img}" loading="lazy" decoding="async">
      <div class="idol-text">
        <strong>${idol.name}</strong>
        <small>${idol.group}</small>
      </div>
    `;
    list.appendChild(div);
  });
}

// ==========================================
// GALERIA OFICIAL DINÂMICA (FANDOM WIKI)
// ==========================================

async function openGalleryModal(slotIndex, e) {
  if (e) e.stopPropagation();
  selectedSlotIndex = slotIndex;
  const idol = currentSlots[slotIndex];
  if (!idol) return;

  document.getElementById("modal-gallery").style.display = "flex";
  updateScrollLock();

  document.getElementById("gallery-title").innerText =
    `Official Photos: ${idol.name} (${idol.group})`;
  const status = document.getElementById("gallery-status");
  status.innerText = "Fetching photos...";
  const list = document.getElementById("gallery-list");
  list.innerHTML = "";

  const wikiPageTitle = idol.rawTitle || idol.name;
  const galleryQueryTitle = `${wikiPageTitle}|${wikiPageTitle}/Gallery`;
  const endpoint = `https://kpop.fandom.com/api.php?action=query&generator=images&titles=${encodeURIComponent(
    galleryQueryTitle,
  )}&gimlimit=40&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json&origin=*`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (!data.query || !data.query.pages) {
      status.innerText = "No extra gallery photos found.";
      return;
    }

    const pages = Object.values(data.query.pages);

    const photoOptions = pages
      .map((p) => {
        if (!p.imageinfo || !p.imageinfo[0]) return null;
        const info = p.imageinfo[0];
        return {
          thumb: info.thumburl || info.url,
          full: info.url,
        };
      })
      .filter((item) => {
        if (!item || !item.full) return false;
        const lower = item.full.toLowerCase();
        return (
          (lower.includes(".jpg") ||
            lower.includes(".png") ||
            lower.includes(".webp")) &&
          !lower.includes("birthday") &&
          !lower.includes("logo") &&
          !lower.includes("icon") &&
          !lower.includes("placeholder") &&
          !lower.includes("badge")
        );
      });

    const uniqueUrls = new Set();
    const allPhotos = [];

    allPhotos.push({ thumb: idol.img, full: idol.img });
    uniqueUrls.add(idol.img);

    photoOptions.forEach((p) => {
      if (!uniqueUrls.has(p.full)) {
        uniqueUrls.add(p.full);
        allPhotos.push(p);
      }
    });

    status.innerText = `${allPhotos.length} official photo(s) available:`;

    allPhotos.forEach((p) => {
      const card = document.createElement("div");
      card.className = "gallery-card";
      card.onclick = () => {
        currentSlots[selectedSlotIndex].img = p.full;
        closeGalleryModal();
        renderGrid();
        showToast(`Updated photo for ${idol.name}`, "success");
      };
      card.innerHTML = `<img src="${p.thumb}" loading="lazy" decoding="async" alt="Concept Photo">`;
      list.appendChild(card);
    });
  } catch (err) {
    console.error("Gallery error:", err);
    status.innerText = "Failed to load official gallery.";
  }
}

function closeGalleryModal() {
  document.getElementById("modal-gallery").style.display = "none";
  updateScrollLock();
}

function removeIdol(index, e) {
  if (e) e.stopPropagation();
  currentSlots[index] = null;
  renderGrid();
  showToast("Idol removed from slot.");
}

// ==========================================
// DRAG & DROP
// ==========================================

function handleDragStart(e, index) {
  if (!currentSlots[index]) return;
  draggedSlotIndex = index;
  e.dataTransfer.effectAllowed = "move";
  e.currentTarget.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDragEnter(e) {
  e.preventDefault();
  const card = e.currentTarget;
  if (!card.classList.contains("dragging")) card.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e, targetIndex) {
  e.preventDefault();
  e.currentTarget.classList.remove("drag-over");

  if (draggedSlotIndex === null || draggedSlotIndex === targetIndex) return;

  const temp = currentSlots[draggedSlotIndex];
  currentSlots[draggedSlotIndex] = currentSlots[targetIndex];
  currentSlots[targetIndex] = temp;

  draggedSlotIndex = null;
  renderGrid();
  showToast("Position updated!");
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove("dragging");
  document
    .querySelectorAll(".idol-card")
    .forEach((c) => c.classList.remove("drag-over"));
}

// ==========================================
// TOUCH DRAG & DROP (MOBILE)
// ==========================================

let touchTargetIndex = null;

function handleTouchStart(e, index) {
  if (!currentSlots[index] || e.target.closest(".action-btn")) return;

  draggedSlotIndex = index;
  e.currentTarget.classList.add("dragging");
  e.currentTarget.style.touchAction = "none";
}

function handleTouchMove(e) {
  if (draggedSlotIndex === null) return;

  // Evita o scroll da página enquanto arrasta o card
  if (e.cancelable) e.preventDefault();

  const touch = e.touches[0];
  const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
  const cardUnder = elementUnder ? elementUnder.closest(".idol-card") : null;

  document
    .querySelectorAll(".idol-card")
    .forEach((c) => c.classList.remove("drag-over"));

  if (cardUnder && cardUnder.dataset.index !== undefined) {
    touchTargetIndex = parseInt(cardUnder.dataset.index, 10);
    if (touchTargetIndex !== draggedSlotIndex) {
      cardUnder.classList.add("drag-over");
    }
  } else {
    touchTargetIndex = null;
  }
}

function handleTouchEnd(e) {
  if (draggedSlotIndex === null) return;

  document.querySelectorAll(".idol-card").forEach((c) => {
    c.classList.remove("dragging");
    c.classList.remove("drag-over");
    c.style.touchAction = "";
  });

  if (touchTargetIndex !== null && touchTargetIndex !== draggedSlotIndex) {
    const temp = currentSlots[draggedSlotIndex];
    currentSlots[draggedSlotIndex] = currentSlots[touchTargetIndex];
    currentSlots[touchTargetIndex] = temp;
    renderGrid();
    showToast("Position updated!");
  }

  draggedSlotIndex = null;
  touchTargetIndex = null;
}

// ==========================================
// RENDERIZAÇÃO DO GRID PRINCIPAL
// ==========================================

function renderGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const idol = currentSlots[i];
    const card = document.createElement("div");
    card.className = `idol-card ${idol ? "draggable" : ""}`;

    card.dataset.index = i;

    // desktop drag & drop
    card.draggable = idol !== null;
    card.ondragstart = (e) => handleDragStart(e, i);
    card.ondragover = (e) => handleDragOver(e);
    card.ondragenter = (e) => handleDragEnter(e);
    card.ondragleave = (e) => handleDragLeave(e);
    card.ondrop = (e) => handleDrop(e, i);
    card.ondragend = (e) => handleDragEnd(e);

    // mobile drag & drop
    card.addEventListener("touchstart", (e) => handleTouchStart(e, i), {
      passive: true,
    });
    card.addEventListener("touchmove", handleTouchMove, { passive: false });
    card.addEventListener("touchend", handleTouchEnd, { passive: true });

    let content = `<span class="badge-rank">#${i + 1}</span>`;

    if (idol) {
      card.onclick = () => openSearchModal(i);
      content += `
        <div class="card-actions">
          <button class="action-btn" onclick="openGalleryModal(${i}, event)" title="Change Concept Photo">
            <i class="fa-solid fa-camera"></i>
          </button>
          <button class="action-btn btn-remove" onclick="removeIdol(${i}, event)" title="Remove Idol">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="card-img-bg" style="background-image: url('${idol.img}');"></div>
        <div class="card-info">
          <span class="name" title="${idol.name}">${idol.name}</span>
          <span class="group" title="${idol.group}">${idol.group}</span>
        </div>
      `;
    } else {
      card.onclick = () => openSearchModal(i);
      content += `<div class="empty-placeholder">+ Select #${i + 1}</div>`;
    }

    card.innerHTML = content;
    grid.appendChild(card);
  }
}

function openSearchModal(slotIndex) {
  selectedSlotIndex = slotIndex;
  document.getElementById("modal-search").style.display = "flex";
  updateScrollLock();

  const searchInput = document.getElementById("search");
  searchInput.value = "";
  document.getElementById("search-status").innerText =
    "Type idol or group name (e.g. V, Lisa, BTS, Jennie)...";
  document.getElementById("search-list").innerHTML = "";
  searchInput.focus();
}

function closeSearchModal() {
  document.getElementById("modal-search").style.display = "none";
  updateScrollLock();
}

function clearAllSlots() {
  currentSlots = Array(10).fill(null);
  renderGrid();
  showToast("Ranking reset.");
}

function startOwnRanking() {
  currentSlots = Array(10).fill(null);
  document.getElementById("access-key").value = "";
  document.getElementById("shared-banner").style.display = "none";
  window.history.pushState({}, "", window.location.pathname);
  renderGrid();
  showToast("Ready to build your own ranking!");
}

// ==========================================
// PERSISTÊNCIA NO SUPABASE (RPC COM PIN)
// ==========================================

function generateRandomCode(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function openSaveModal() {
  const hasSelectedIdols = currentSlots.some((slot) => slot !== null);
  if (!hasSelectedIdols) {
    showToast("Please select at least one idol before saving.", "error");
    return;
  }

  const currentCode = document.getElementById("access-key").value.trim();
  const modalTitle = document.querySelector("#modal-save h3");
  const modalDesc = document.querySelector("#modal-save .modal-desc");

  if (currentCode) {
    modalTitle.innerHTML = `✏️ Update Ranking: <span style="color: var(--accent-cyan); font-family: 'JetBrains Mono', monospace;">${currentCode}</span>`;
    modalDesc.innerText =
      "Enter your security PIN to save and update the changes to this ranking.";
  } else {
    modalTitle.innerText = "🔒 Save & Protect Ranking";
    modalDesc.innerText =
      "Set a security PIN. A random unique code will be assigned to your new ranking.";
  }

  document.getElementById("save-pin-input").value = "";
  document.getElementById("modal-save").style.display = "flex";
  updateScrollLock();
  document.getElementById("save-pin-input").focus();
}

function closeSaveModal() {
  document.getElementById("modal-save").style.display = "none";
  updateScrollLock();
}

async function confirmSaveRanking() {
  const currentKey = document.getElementById("access-key").value.trim();
  const pin = document.getElementById("save-pin-input").value.trim();

  if (pin.length < 4) {
    showToast("PIN must have at least 4 characters.", "error");
    return;
  }

  const isEditing = !!currentKey;
  const code = currentKey || generateRandomCode(8);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/save_ranking_with_pin`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_code: code,
          p_idols: currentSlots,
          p_pin: pin,
        }),
      },
    );

    const result = await response.json();

    if (result.success) {
      lastSavedCode = code;
      document.getElementById("access-key").value = code;
      closeSaveModal();
      document.getElementById("shared-banner").style.display = "none";

      const newUrl = `${window.location.origin}${window.location.pathname}?code=${code}`;
      window.history.pushState({}, "", newUrl);

      if (isEditing) {
        showToast(`Ranking ${code} updated successfully!`, "success");
      } else {
        document.getElementById("success-code-display").innerText = code;
        document.getElementById("modal-success").style.display = "flex";
        updateScrollLock();
      }
    } else if (result.error === "INVALID_PIN") {
      showToast("❌ Incorrect PIN for this ranking.", "error");
    } else {
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error("Save error:", error);
    showToast("Failed to connect to cloud database.", "error");
  }
}

function closeSuccessModal() {
  document.getElementById("modal-success").style.display = "none";
  updateScrollLock();
}

function copySuccessLink() {
  const shareUrl = `${window.location.origin}${window.location.pathname}?code=${lastSavedCode}`;
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      showToast("Link & Code copied to clipboard!", "success");
    })
    .catch(() => {
      showToast(`Code: ${lastSavedCode}`, "info");
    });
}

// Carregamento da nuvem
async function fetchRankingFromCloud(code) {
  const cleanCode = code.trim();
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rankings?code=eq.${encodeURIComponent(cleanCode)}&select=idols`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    },
  );

  const data = await response.json();
  if (data && data.length > 0) return data[0].idols;
  return null;
}

async function loadList(codeFromParam = null) {
  const code = (
    codeFromParam || document.getElementById("access-key").value
  ).trim();
  if (!code) {
    showToast("Please enter a ranking code to load.", "error");
    return;
  }

  try {
    const idols = await fetchRankingFromCloud(code);
    if (idols) {
      currentSlots = idols;
      document.getElementById("access-key").value = code;
      renderGrid();

      if (codeFromParam) {
        document.getElementById("shared-code-tag").innerText = code;
        document.getElementById("shared-banner").style.display = "flex";
      }
      showToast(`Ranking ${code} loaded!`, "success");
    } else {
      showToast(`No ranking found for code: ${code}`, "error");
    }
  } catch (error) {
    console.error("Load error:", error);
    showToast("Failed to load ranking.", "error");
  }
}

function copyShareLink() {
  const code = document.getElementById("access-key").value.trim();
  if (!code) {
    showToast("Save your ranking first to generate a shareable link.", "error");
    return;
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?code=${code}`;
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      showToast("Share link copied to clipboard!", "success");
    })
    .catch(() => {
      showToast(`Link: ${shareUrl}`, "info");
    });
}

// ==========================================
// EXPORTAÇÃO DIRETA EM CANVAS 2D
// ==========================================

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function loadImagePromise(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(src)}&w=700&output=jpg&q=95`;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = proxyUrl;
  });
}

async function exportDirectCanvas() {
  showToast("Generating high-res image...");
  const scale = 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const padding = 28 * scale;
  const gap = 16 * scale;
  const cardW = 216 * scale;
  const cardH = 280 * scale;
  const radius = 16 * scale;

  const headerH = 68 * scale;
  const footerH = 44 * scale;

  const totalW = padding * 2 + cardW * 5 + gap * 4;
  const totalH = padding * 2 + headerH + cardH * 2 + gap + footerH;

  canvas.width = totalW;
  canvas.height = totalH;

  drawRoundedRect(ctx, 0, 0, totalW, totalH, 24 * scale);
  ctx.fillStyle = "#121622";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#38bdf8";
  ctx.font = `800 ${10 * scale}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText("PERSONAL RANKING", totalW / 2, padding + 18 * scale);

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${22 * scale}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText("MY TOP 10 IDOLS", totalW / 2, padding + 48 * scale);
  ctx.restore();

  const loadedImages = await Promise.all(
    currentSlots.map((slot) =>
      slot ? loadImagePromise(slot.img) : Promise.resolve(null),
    ),
  );

  const gridStartY = padding + headerH;

  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = padding + col * (cardW + gap);
    const y = gridStartY + row * (cardH + gap);

    const idol = currentSlots[i];
    const img = loadedImages[i];

    ctx.save();
    drawRoundedRect(ctx, x, y, cardW, cardH, radius);
    ctx.clip();

    if (idol && img) {
      const imgRatio = img.width / img.height;
      const cardRatio = cardW / cardH;
      let sw, sh, sx, sy;

      if (imgRatio > cardRatio) {
        sh = img.height;
        sw = img.height * cardRatio;
        sx = (img.width - sw) / 2;
        sy = 0;
      } else {
        sw = img.width;
        sh = img.width / cardRatio;
        sx = 0;
        sy = 0;
      }

      ctx.drawImage(img, sx, sy, sw, sh, x, y, cardW, cardH);

      const grad = ctx.createLinearGradient(x, y + cardH * 0.45, x, y + cardH);
      grad.addColorStop(0, "rgba(13, 17, 26, 0)");
      grad.addColorStop(0.75, "rgba(13, 17, 26, 0.8)");
      grad.addColorStop(1, "rgba(9, 11, 18, 0.98)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, cardW, cardH);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${15 * scale}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(idol.name, x + 14 * scale, y + cardH - 14 * scale);

      ctx.fillStyle = "#38bdf8";
      ctx.font = `800 ${11 * scale}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(idol.group, x + cardW - 14 * scale, y + cardH - 14 * scale);
    } else {
      ctx.fillStyle = "#1a2030";
      ctx.fillRect(x, y, cardW, cardH);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `600 ${13 * scale}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`+ Select #${i + 1}`, x + cardW / 2, y + cardH / 2);
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    ctx.restore();

    // Badge Rank
    ctx.save();
    const badgeX = x + 10 * scale;
    const badgeY = y + 10 * scale;
    const badgeW = 34 * scale;
    const badgeH = 20 * scale;

    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 10 * scale);
    const badgeGrad = ctx.createLinearGradient(
      badgeX,
      badgeY,
      badgeX + badgeW,
      badgeY + badgeH,
    );
    badgeGrad.addColorStop(0, "#6366f1");
    badgeGrad.addColorStop(1, "#4f46e5");
    ctx.fillStyle = badgeGrad;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${10 * scale}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `#${i + 1}`,
      badgeX + badgeW / 2,
      badgeY + badgeH / 2 + 0.5 * scale,
    );
    ctx.restore();
  }

  // Footer
  const footerY = gridStartY + cardH * 2 + gap + 26 * scale;

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(padding, footerY - 14 * scale);
  ctx.lineTo(totalW - padding, footerY - 14 * scale);
  ctx.stroke();

  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 ${11 * scale}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("Created with K-Pop Top 10 Maker", padding, footerY + 6 * scale);

  const authorText = "Made by @yuutokotaki";
  ctx.font = `700 ${11 * scale}px "Plus Jakarta Sans", sans-serif`;
  const textW = ctx.measureText(authorText).width;
  const tagW = textW + 20 * scale;
  const tagH = 24 * scale;
  const tagX = totalW - padding - tagW;
  const tagY = footerY - 6 * scale;

  drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 6 * scale);
  ctx.fillStyle = "rgba(56, 189, 248, 0.1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(authorText, tagX + tagW / 2, tagY + tagH / 2);
  ctx.restore();

  const link = document.createElement("a");
  link.download = "my-top10-kpop-idols.png";
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
  showToast("Image downloaded successfully!", "success");
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  renderGrid();
  await loadIdolCatalog();

  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get("code");
  if (codeParam) {
    loadList(codeParam);
  }
});
