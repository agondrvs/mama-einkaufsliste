(() => {
  const STORAGE_KEY = "einkaufsliste:v1";
  const DEFAULT_SUGGESTIONS = ["Milch", "Brot", "Eier", "Butter", "Äpfel", "Käse", "Kaffee", "Tomaten", "Joghurt", "Bananen"];

  // Stichwort → Emoji. Erster Treffer gewinnt, daher Spezielles vor Allgemeinem.
  const EMOJI = [
    [["hafermilch", "milch"], "🥛"], [["brötchen", "semmel", "brot", "toast", "baguette"], "🍞"],
    [["croissant"], "🥐"], [["ei"], "🥚"], [["butter"], "🧈"], [["käse", "mozzarella", "parmesan"], "🧀"],
    [["joghurt", "quark", "sahne"], "🥣"], [["apfel", "äpfel"], "🍎"], [["birne"], "🍐"],
    [["banane"], "🍌"], [["orange", "mandarine"], "🍊"], [["zitrone"], "🍋"], [["traube"], "🍇"],
    [["erdbeer"], "🍓"], [["kirsch"], "🍒"], [["pfirsich"], "🍑"], [["melone"], "🍉"],
    [["ananas"], "🍍"], [["tomate"], "🍅"], [["gurke"], "🥒"], [["salat"], "🥬"],
    [["brokkoli"], "🥦"], [["karotte", "möhre", "rüebli"], "🥕"], [["kartoffel"], "🥔"],
    [["zwiebel"], "🧅"], [["knoblauch"], "🧄"], [["paprika"], "🫑"], [["pilz", "champignon"], "🍄"],
    [["mais"], "🌽"], [["avocado"], "🥑"], [["reis"], "🍚"], [["nudel", "pasta", "spaghetti"], "🍝"],
    [["mehl"], "🌾"], [["zucker", "honig"], "🍯"], [["salz", "pfeffer", "gewürz"], "🧂"],
    [["öl", "essig"], "🫒"], [["fleisch", "rind", "steak"], "🥩"], [["hähnchen", "huhn", "poulet"], "🍗"],
    [["wurst", "schinken", "salami", "speck"], "🥓"], [["fisch", "lachs", "thunfisch"], "🐟"],
    [["kaffee"], "☕"], [["tee"], "🍵"], [["wasser", "sprudel", "mineral"], "💧"], [["saft"], "🧃"],
    [["bier"], "🍺"], [["wein", "sekt", "prosecco"], "🍷"], [["schokolade", "praline"], "🍫"],
    [["keks", "kuchen", "torte"], "🍪"], [["eis"], "🍨"], [["chips", "snack"], "🍿"],
    [["blume", "strauss", "strauß"], "💐"], [["klopapier", "toilettenpapier", "küchenrolle", "taschentuch"], "🧻"],
    [["seife", "shampoo", "duschgel", "zahnpasta"], "🧴"], [["spülmittel", "waschmittel", "putzmittel", "schwamm"], "🧽"],
    [["batterie"], "🔋"], [["katze", "hund", "tierfutter"], "🐾"], [["medikament", "tablette", "apotheke"], "💊"],
  ];

  const $ = (id) => document.getElementById(id);
  const openList = $("open-list");
  const doneList = $("done-list");
  const doneWrap = $("done-wrap");
  const empty = $("empty");
  const count = $("count");
  const form = $("add-form");
  const input = $("add-input");
  const suggestions = $("suggestions");
  const toast = $("toast");
  const toastText = $("toast-text");
  const toastUndo = $("toast-undo");

  let state = load();
  let undoSnapshot = null;
  let toastTimer = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return { items: data.items || [], history: data.history || {} };
      }
    } catch (_) { /* leer starten */ }
    return { items: [], history: {} };
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* z.B. privater Modus */ }
  }

  const key = (name) => name.trim().toLocaleLowerCase("de");

  function emojiFor(name) {
    const n = key(name);
    const words = n.split(/[\s,.-]+/);
    for (const [terms, emoji] of EMOJI) {
      // Kurze Begriffe (z.B. "ei", "eis", "tee") nur als ganzes Wort, sonst trifft "ei" auf "Weißwein".
      if (terms.some((t) => (t.length <= 3 ? words.includes(t) || words.includes(t + "er") : n.includes(t)))) return emoji;
    }
    return "🛒";
  }

  function capitalize(s) {
    return s.charAt(0).toLocaleUpperCase("de") + s.slice(1);
  }

  function addItem(rawName) {
    const name = capitalize(rawName.trim().replace(/\s+/g, " "));
    if (!name) return;
    const k = key(name);
    const existing = state.items.find((i) => key(i.name) === k);
    if (existing) {
      existing.done = false;
      state.items = [existing, ...state.items.filter((i) => i !== existing)];
    } else {
      state.items.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, done: false });
    }
    const h = state.history[k] || { name, count: 0 };
    h.name = name;
    h.count += 1;
    h.last = Date.now();
    state.history[k] = h;
    save();
    render();
  }

  function toggle(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    item.done = !item.done;
    if (navigator.vibrate) navigator.vibrate(12);
    save();
    render();
  }

  function remove(id) {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;
    snapshot();
    state.items = state.items.filter((i) => i.id !== id);
    save();
    render();
    showToast(`„${item.name}“ entfernt`);
  }

  function clearDone() {
    const n = state.items.filter((i) => i.done).length;
    if (!n) return;
    snapshot();
    state.items = state.items.filter((i) => !i.done);
    save();
    render();
    showToast(n === 1 ? "1 Artikel aufgeräumt" : `${n} Artikel aufgeräumt`);
  }

  function snapshot() {
    undoSnapshot = JSON.parse(JSON.stringify(state.items));
  }

  function showToast(text) {
    toastText.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
  }

  function hideToast() {
    toast.hidden = true;
    undoSnapshot = null;
  }

  function icon(path, size = 22, width = 2.4) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
  }

  function itemEl(item) {
    const li = document.createElement("li");
    li.className = "item";
    li.dataset.id = item.id;

    const check = document.createElement("button");
    check.className = "check";
    check.type = "button";
    check.dataset.action = "toggle";
    check.setAttribute("aria-label", item.done ? `${item.name} zurück auf die Liste` : `${item.name} abhaken`);
    check.innerHTML = icon("M5 12.5l4.5 4.5L19 7.5", 20, 3);

    const main = document.createElement("button");
    main.className = "item-main";
    main.type = "button";
    main.dataset.action = "toggle";
    main.tabIndex = -1;
    const emoji = document.createElement("span");
    emoji.className = "emoji";
    emoji.textContent = emojiFor(item.name);
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name;
    main.append(emoji, name);

    const del = document.createElement("button");
    del.className = "remove";
    del.type = "button";
    del.dataset.action = "remove";
    del.setAttribute("aria-label", `${item.name} löschen`);
    del.innerHTML = icon("M7 7l10 10M17 7L7 17", 20, 2.2);

    li.append(check, main, del);
    return li;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 11) return "Guten Morgen";
    if (h < 17) return "Guten Tag";
    return "Guten Abend";
  }

  function render() {
    const open = state.items.filter((i) => !i.done);
    const done = state.items.filter((i) => i.done);

    openList.replaceChildren(...open.map(itemEl));
    doneList.replaceChildren(...done.map(itemEl));
    doneWrap.hidden = done.length === 0;
    empty.hidden = open.length > 0;
    empty.querySelector(".empty-title").textContent = state.items.length ? "Alles im Korb" : "Die Liste ist leer";

    count.textContent = open.length === 0 ? "" : open.length === 1 ? "Noch 1 Sache zu holen" : `Noch ${open.length} Sachen zu holen`;
    $("greeting").textContent = greeting();

    renderSuggestions();
  }

  function renderSuggestions() {
    const onList = new Set(state.items.filter((i) => !i.done).map((i) => key(i.name)));
    const fromHistory = Object.values(state.history)
      .sort((a, b) => b.count - a.count || b.last - a.last)
      .map((h) => h.name);
    const names = [...fromHistory, ...DEFAULT_SUGGESTIONS];
    const seen = new Set();
    const picks = [];
    for (const n of names) {
      const k = key(n);
      if (onList.has(k) || seen.has(k)) continue;
      seen.add(k);
      picks.push(n);
      if (picks.length === 10) break;
    }
    suggestions.replaceChildren(...picks.map((n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = `${emojiFor(n)} ${n}`;
      b.addEventListener("click", () => addItem(n));
      return b;
    }));
    suggestions.hidden = picks.length === 0;
  }

  function onListClick(e) {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.closest(".item").dataset.id;
    if (btn.dataset.action === "toggle") toggle(id);
    else if (btn.dataset.action === "remove") remove(id);
  }

  openList.addEventListener("click", onListClick);
  doneList.addEventListener("click", onListClick);
  $("clear-done").addEventListener("click", clearDone);

  toastUndo.addEventListener("click", () => {
    if (undoSnapshot) {
      state.items = undoSnapshot;
      save();
      render();
    }
    hideToast();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(input.value);
    input.value = "";
    input.focus();
  });

  // Änderungen aus einem anderen Tab übernehmen.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) { state = load(); render(); }
  });

  render();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
