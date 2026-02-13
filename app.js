const App = (() => {
  // =========================
  // EDIT THESE (LOCAL FILES, NOT URL)
  // =========================
  const girlfriendName = "My Bebelabidabssugarplamhampihampidampi";

  // Put these inside /assets folder:
  const gifUrl = "assets/happy-cat.gif";
  const musicUrl = "assets/Laufey - Valentine.mp3";

  // ✅ NEW: Bouquet video (instead of bouquet image)
  const bouquetVideoUrl = "assets/vid.mp4";

  // Fixed message (no localStorage saving)
  const FIXED_MESSAGE = `Hello bebe
First of all I wanna take this opportunity to say sorry sa nagawa ko kahapon i was so immature na ganon ginawa ko sorry. I realize na I was so busy playing ML that I didn't think about how'd you feel na magkasama tayo pero nasa iba attention ko and thank you for making me realize it. and sorry. Yun lang So our date has been set so See YOu! babawi ako. ILOVEYOUUUUUUU`;

  // Formspree endpoint (keep yours)
  const formEndpoint = "https://formspree.io/f/xnjbplda";

  // LocalStorage keys
  const LS_MUSIC = "valentine_music_prefs";

  // =========================
  // State
  // =========================
  const state = {
    page: 1,
    noClicks: 0,
    yesScale: 1,
    noScale: 1,
    hasInteracted: false,
    musicOn: false,
    volume: 0.7,
    plan: {
      location: "",
      date: "",
      time: "",
      extras: [],
      notes: ""
    }
  };

  // =========================
  // Helpers
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function safeSetText(el, txt) { if (el) el.textContent = String(txt ?? ""); }

  // =========================
  // Navigation / Transitions
  // =========================
  function showPage(nextPage) {
    const app = $("#app");
    const pages = [$("#page1"), $("#page2"), $("#page3")];
    pages.forEach((p) => p && p.classList.remove("page--active"));
    const next = pages[nextPage - 1];
    if (!next) return;

    state.page = nextPage;
    app?.setAttribute("data-page", String(nextPage));

    requestAnimationFrame(() => {
      next.classList.add("page--active");
      const focusTarget = next.querySelector("button, input, select, textarea, a, [tabindex]:not([tabindex='-1'])");
      if (focusTarget) focusTarget.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }

  function showP3(view) {
    const hub = $("#p3Hub");
    const bq = $("#p3Bouquet");
    const msg = $("#p3Message");

    [hub, bq, msg].forEach(el => { if (el) el.hidden = true; });

    if (view === "bouquet") bq.hidden = false;
    else if (view === "message") msg.hidden = false;
    else hub.hidden = false;
  }

  // =========================
  // Page 1 behaviors
  // =========================
  function moveNoButtonPlayfully(btn) {
    const maxShift = 18;
    const dx = (Math.random() * 2 - 1) * maxShift;
    const dy = (Math.random() * 2 - 1) * maxShift;
    btn.style.transform = `translate(${dx}px, ${dy}px) scale(${state.noScale})`;
  }

  function updateYesNoScales() {
    const yes = $("#yesBtn");
    const no = $("#noBtn");
    if (yes) yes.style.transform = `scale(${state.yesScale})`;
    if (no) no.style.transform = `scale(${state.noScale})`;
  }

  function onNoClick() {
    const no = $("#noBtn");
    const yes = $("#yesBtn");
    const hint = $("#noHint");
    if (!no || !yes) return;

    state.noClicks += 1;
    const t = clamp(state.noClicks, 0, 8);
    state.noScale = clamp(1 - t * 0.06, 0.55, 1);
    state.yesScale = clamp(1 + t * 0.06, 1, 1.55);

    updateYesNoScales();
    moveNoButtonPlayfully(no);

    if (state.noClicks >= 8) {
      no.disabled = true;
      no.style.opacity = "0.35";
      no.style.cursor = "not-allowed";
      safeSetText(hint, "Hehe okay… you can’t say no forever 😘");
    } else {
      safeSetText(hint, "");
    }
  }

  function burstHearts(durationMs = 850) {
    const layer = $("#fxLayer");
    if (!layer || prefersReducedMotion()) return;

    const heartEmojis = ["💖", "💘", "💗", "💓", "💞", "✨"];
    const count = 26;

    const rect = document.documentElement.getBoundingClientRect();
    const startX = rect.width / 2;
    const startY = rect.height * 0.55;

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "fx-heart";
      el.textContent = heartEmojis[i % heartEmojis.length];

      const spreadX = (Math.random() * 2 - 1) * 180;
      const spreadY = (Math.random() * 2 - 1) * 60;

      el.style.left = `${startX + spreadX}px`;
      el.style.top = `${startY + spreadY}px`;
      el.style.fontSize = `${14 + Math.random() * 18}px`;

      layer.appendChild(el);
      setTimeout(() => el.remove(), durationMs + 120);
    }
  }

  async function onYesClick() {
    burstHearts();
    setTimeout(() => showPage(2), prefersReducedMotion() ? 0 : 260);
  }

  // =========================
  // Page 2: Planner + Formspree send
  // =========================
  function getLocationValue() {
    const sel = $("#locationSelect");
    const custom = $("#customLocation");
    const selected = sel?.value || "";
    const customVal = (custom?.value || "").trim();
    if (selected === "Custom") return customVal;
    return selected;
  }

  function collectPlannerData() {
    const date = ($("#dateInput")?.value || "").trim();
    const time = ($("#timeInput")?.value || "").trim();
    const location = (getLocationValue() || "").trim();

    const extras = $$("input[name='extras']:checked").map((c) => c.value);
    const notes = ($("#notesInput")?.value || "").trim();

    state.plan = { location, date, time, extras, notes };
    return state.plan;
  }

  function validatePlanner(plan) {
    const errors = [];
    if (!plan.location) errors.push("Please choose a location.");
    if (!plan.date) errors.push("Please pick a date.");
    return errors;
  }

  function renderSummaryLine() {
    const el = $("#summaryLine");
    if (!el) return;

    const { location, date, time, extras, notes } = state.plan;
    const parts = [];
    if (location) parts.push(`Location: ${location}`);
    if (date) parts.push(`Date: ${date}`);
    if (time) parts.push(`Time: ${time}`);
    if (extras?.length) parts.push(`Extras: ${extras.join(", ")}`);
    if (notes) parts.push(`Notes: ${notes}`);

    safeSetText(el, parts.length ? `Our plan — ${parts.join(" • ")}` : "Our plan is going to be perfect 💞");
  }

  async function onPlannerSubmit(e) {
    e.preventDefault();

    const plan = collectPlannerData();
    const errors = validatePlanner(plan);

    const errRegion = $("#plannerErrors");
    if (errors.length) {
      if (errRegion) errRegion.textContent = errors.join(" ");
      if (!plan.location) $("#locationSelect")?.focus();
      else $("#dateInput")?.focus();
      return;
    }
    if (errRegion) errRegion.textContent = "";

    const payload = {
      girlfriendName,
      submittedAt: new Date().toISOString(),
      location: plan.location,
      date: plan.date,
      time: plan.time || "",
      extras: plan.extras || [],
      notes: plan.notes || ""
    };

    const planPayloadInput = $("#planPayload");
    if (planPayloadInput) planPayloadInput.value = JSON.stringify(payload, null, 2);

    try {
      const formEl = $("#plannerForm");
      const formData = new FormData(formEl);

      const res = await fetch(formEndpoint, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error("Failed to submit");

      renderSummaryLine();
      showPage(3);
      showP3("hub");
      loadMessage();
    } catch (err) {
      if (errRegion) {
        errRegion.textContent = "Oops—couldn’t send the plan right now. Please check your connection and try again.";
      }
    }
  }

  // =========================
  // Page 3 - Message (fixed in code)
  // =========================
  function loadMessage() {
    const preview = $("#loveMessagePreview");
    if (preview) preview.textContent = FIXED_MESSAGE;
  }

  // =========================
  // ✅ Bouquet video mount
  // =========================
  function mountBouquetVideo() {
    const vid = $("#bouquetVideo");
    if (!vid) return;

    const src = vid.querySelector("source");
    if (src) src.src = bouquetVideoUrl;
    vid.load();
  }

  // =========================
  // Music prefs + autoplay-safe
  // =========================
  function loadMusicPrefs() {
    try {
      const raw = localStorage.getItem(LS_MUSIC);
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (typeof prefs.volume === "number") state.volume = clamp(prefs.volume, 0, 1);
      if (typeof prefs.musicOn === "boolean") state.musicOn = prefs.musicOn;
    } catch (_) {}
  }

  function saveMusicPrefs() {
    try {
      localStorage.setItem(LS_MUSIC, JSON.stringify({
        volume: state.volume,
        musicOn: state.musicOn
      }));
    } catch (_) {}
  }

  function syncMusicUI() {
    const audio = $("#bgMusic");
    const toggle = $("#musicToggle");
    const vol = $("#musicVolume");

    if (vol) vol.value = String(state.volume);
    if (audio) audio.volume = state.volume;

    const on = !!state.musicOn;
    if (toggle) {
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
      const label = toggle.querySelector(".music-btn__text");
      if (label) label.textContent = on ? "Music On" : "Play Music";
      toggle.title = on ? "Turn music off" : "Play music";
    }
  }

  async function tryPlayMusic() {
    const audio = $("#bgMusic");
    if (!audio) return false;

    if (!audio.src && musicUrl) {
      const src = $("#musicSource");
      if (src) src.src = musicUrl;
      audio.load();
    }

    audio.volume = state.volume;

    try {
      await audio.play();
      state.musicOn = true;
      syncMusicUI();
      saveMusicPrefs();
      return true;
    } catch (_) {
      state.musicOn = false;
      syncMusicUI();
      saveMusicPrefs();
      return false;
    }
  }

  function pauseMusic() {
    const audio = $("#bgMusic");
    if (!audio) return;
    audio.pause();
    state.musicOn = false;
    syncMusicUI();
    saveMusicPrefs();
  }

  function bindAutoplayAfterFirstInteraction() {
    const handler = async () => {
      if (state.hasInteracted) return;
      state.hasInteracted = true;
      if (state.musicOn) await tryPlayMusic();
    };
    window.addEventListener("pointerdown", handler, { once: true, passive: true });
    window.addEventListener("keydown", handler, { once: true });
  }

  // =========================
  // Init
  // =========================
  function wireEvents() {
    $("#noBtn")?.addEventListener("click", () => {
      state.hasInteracted = true;
      onNoClick();
    });

    $("#yesBtn")?.addEventListener("click", async () => {
      state.hasInteracted = true;
      if (state.musicOn) await tryPlayMusic();
      onYesClick();
    });

    $("#plannerForm")?.addEventListener("submit", async (e) => {
      state.hasInteracted = true;
      if (state.musicOn) await tryPlayMusic();
      await onPlannerSubmit(e);
    });

    $("#backToP1")?.addEventListener("click", () => showPage(1));
    $("#backToP2")?.addEventListener("click", () => showPage(2));

    // ✅ bouquet now opens video view only
    $("#openBouquet")?.addEventListener("click", () => {
      showP3("bouquet");
      mountBouquetVideo();
    });

    $("#openMessage")?.addEventListener("click", () => { showP3("message"); loadMessage(); });

    $("#backToHubFromBouquet")?.addEventListener("click", () => showP3("hub"));
    $("#backToHubFromMessage")?.addEventListener("click", () => showP3("hub"));

    $("#restartBtn")?.addEventListener("click", () => {
      state.noClicks = 0;
      state.yesScale = 1;
      state.noScale = 1;
      state.plan = { location: "", date: "", time: "", extras: [], notes: "" };

      $("#plannerForm")?.reset();
      safeSetText($("#plannerErrors"), "");
      safeSetText($("#noHint"), "");
      showPage(1);
      showP3("hub");
    });

    $("#musicToggle")?.addEventListener("click", async () => {
      state.hasInteracted = true;
      if (state.musicOn) pauseMusic();
      else {
        state.musicOn = true;
        syncMusicUI();
        saveMusicPrefs();
        await tryPlayMusic();
      }
    });

    $("#musicVolume")?.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      state.volume = clamp(isNaN(v) ? 0.7 : v, 0, 1);
      syncMusicUI();
      saveMusicPrefs();
    });

    $("#locationSelect")?.addEventListener("change", () => {
      const sel = $("#locationSelect");
      const custom = $("#customLocation");
      if (sel?.value === "Custom") custom?.focus();
    });
  }

  function mountAssets() {
    safeSetText($("#valentineName"), girlfriendName);

    const gif = $("#valentineGif");
    if (gif) gif.src = gifUrl || "";

    const src = $("#musicSource");
    const audio = $("#bgMusic");
    if (src && musicUrl) src.src = musicUrl;
    if (audio) audio.load();

    loadMessage();
    mountBouquetVideo();
  }

  function init() {
    loadMusicPrefs();
    mountAssets();
    wireEvents();
    syncMusicUI();
    bindAutoplayAfterFirstInteraction();

    if (state.musicOn) tryPlayMusic();
    showPage(1);
    showP3("hub");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
