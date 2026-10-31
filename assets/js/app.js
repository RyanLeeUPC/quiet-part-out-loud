(() => {
  "use strict";

  // GitHub repo that receives quote submissions (issues). Update once the repo exists.
  const REPO_URL = "https://github.com/RyanLeeUPC/quiet-part-out-loud";

  const TAG_LABELS = {
    "labor": "Labor",
    "hustle": "Hustle culture",
    "privacy": "Privacy",
    "ai": "AI",
    "wealth": "Wealth",
    "diversity": "Diversity",
    "customers": "Customers",
    "layoffs": "Layoffs",
    "free-speech": "Free speech",
    "ethics": "Ethics",
    "rto": "Return to office",
    "gig-work": "Gig work",
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const $ = (sel) => document.querySelector(sel);
  const els = {
    search: $("#search"),
    sort: $("#sort"),
    random: $("#random"),
    tags: $("#tags"),
    count: $("#count"),
    list: $("#list"),
    empty: $("#empty"),
    tpl: $("#quote-tpl"),
    submit: $("#submit-link"),
  };

  let quotes = [];
  const state = { q: "", tag: "", sort: "newest" };

  els.submit.href = `${REPO_URL}/issues/new?template=submit-quote.yml`;

  // ---------- helpers ----------

  const tagLabel = (t) => TAG_LABELS[t] || t;

  // Dates are "YYYY", "YYYY-MM", or "YYYY-MM-DD"; format without Date() to avoid timezone drift.
  function formatDate(d) {
    const [y, m, day] = String(d).split("-");
    if (!m) return y;
    const mon = MONTHS[Number(m) - 1];
    return day ? `${mon} ${Number(day)}, ${y}` : `${mon} ${y}`;
  }

  function haystack(q) {
    return [q.quote, q.speaker, q.role, q.company, q.venue, q.context, (q.tags || []).join(" ")]
      .join(" ")
      .toLowerCase();
  }

  function quoteUrl(id) {
    return `${location.origin}${location.pathname}#${encodeURIComponent(id)}`;
  }

  // ---------- URL state ----------

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.q = p.get("q") || "";
    state.tag = p.get("tag") || "";
    state.sort = p.get("sort") === "oldest" ? "oldest" : "newest";
    els.search.value = state.q;
    els.sort.value = state.sort;
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.tag) p.set("tag", state.tag);
    if (state.sort !== "newest") p.set("sort", state.sort);
    const qs = p.toString();
    history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}${location.hash}`);
  }

  // ---------- rendering ----------

  function renderTags() {
    const counts = new Map();
    quotes.forEach((q) => (q.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    els.tags.replaceChildren(
      ...[["", quotes.length], ...sorted].map(([t, n]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tag";
        b.dataset.tag = t;
        b.textContent = `${t ? tagLabel(t) : "All"} (${n})`;
        return b;
      })
    );
    syncTagButtons();
  }

  function syncTagButtons() {
    els.tags.querySelectorAll(".tag").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.tag === state.tag));
    });
  }

  function buildCard(q) {
    const node = els.tpl.content.firstElementChild.cloneNode(true);
    node.id = q.id;
    node.classList.toggle("is-long", q.quote.length > 180);

    node.querySelector(".quote__text p").textContent = q.quote;
    node.querySelector(".quote__speaker").textContent = q.speaker;
    node.querySelector(".quote__role").textContent = q.role || "";

    const time = node.querySelector(".quote__date");
    time.dateTime = q.date;
    time.textContent = formatDate(q.date);
    node.querySelector(".quote__venue").textContent = q.venue || "";

    const ctx = node.querySelector(".quote__context");
    if (q.context) ctx.textContent = q.context;
    else ctx.remove();

    const after = node.querySelector(".quote__aftermath");
    if (q.aftermath) after.querySelector("span").textContent = q.aftermath;
    else after.remove();

    const tagList = node.querySelector(".quote__tags");
    (q.tags || []).forEach((t) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.tag = t;
      b.textContent = tagLabel(t);
      li.append(b);
      tagList.append(li);
    });

    const src = node.querySelector(".quote__sources");
    const sources = q.sources || [];
    if (sources.length) {
      src.append("Source: ");
      sources.forEach((s, i) => {
        if (i) src.append(", ");
        const a = document.createElement("a");
        a.href = s.url;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        a.textContent = s.label;
        src.append(a);
      });
    } else {
      src.remove();
    }

    const link = node.querySelector(".quote__link");
    link.href = `#${encodeURIComponent(q.id)}`;
    link.dataset.id = q.id;

    return node;
  }

  function filtered() {
    const terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    const out = quotes.filter(
      (q) =>
        (!state.tag || (q.tags || []).includes(state.tag)) &&
        terms.every((t) => q._hay.includes(t))
    );
    out.sort((a, b) => (state.sort === "oldest" ? 1 : -1) * a.date.localeCompare(b.date));
    return out;
  }

  function render() {
    const items = filtered();
    els.list.replaceChildren(...items.map(buildCard));
    els.empty.hidden = items.length > 0;
    els.count.textContent =
      items.length === quotes.length
        ? `${quotes.length} quote${quotes.length === 1 ? "" : "s"} on the record`
        : `Showing ${items.length} of ${quotes.length}`;
    syncTagButtons();
  }

  function update() {
    writeUrl();
    render();
  }

  // ---------- quote focus ----------

  function focusQuote(id, { scroll = true } = {}) {
    let el = document.getElementById(id);
    if (!el && quotes.some((q) => q.id === id)) {
      // Linked quote is hidden by the current filters; clear them so it shows.
      state.q = "";
      state.tag = "";
      els.search.value = "";
      update();
      el = document.getElementById(id);
    }
    if (!el) return;
    document.querySelectorAll(".quote.is-highlighted").forEach((n) => n.classList.remove("is-highlighted"));
    el.classList.add("is-highlighted");
    if (scroll) el.scrollIntoView({ block: "start" });
  }

  // ---------- events ----------

  let searchTimer;
  els.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = els.search.value.trim();
      update();
    }, 120);
  });

  els.sort.addEventListener("change", () => {
    state.sort = els.sort.value;
    update();
  });

  function onTagClick(e) {
    const b = e.target.closest("button[data-tag]");
    if (!b) return;
    state.tag = state.tag === b.dataset.tag ? "" : b.dataset.tag;
    update();
    if (b.closest(".quote")) els.tags.scrollIntoView({ block: "center" });
  }
  els.tags.addEventListener("click", onTagClick);
  els.list.addEventListener("click", (e) => {
    if (e.target.closest(".quote__tags")) return onTagClick(e);

    const link = e.target.closest(".quote__link");
    if (!link) return;
    e.preventDefault();
    const url = quoteUrl(link.dataset.id);
    history.replaceState(null, "", `${location.pathname}${location.search}#${encodeURIComponent(link.dataset.id)}`);
    focusQuote(link.dataset.id, { scroll: false });
    const done = () => {
      link.textContent = "Copied";
      setTimeout(() => (link.textContent = "Copy link"), 1600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
    else done();
  });

  els.random.addEventListener("click", () => {
    const pool = filtered().length ? filtered() : quotes;
    if (!pool.length) return;
    const current = location.hash.slice(1);
    let pick;
    do pick = pool[Math.floor(Math.random() * pool.length)];
    while (pool.length > 1 && pick.id === current);
    location.hash = encodeURIComponent(pick.id);
  });

  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) focusQuote(id);
  });

  // ---------- boot ----------

  fetch("data/quotes.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((data) => {
      quotes = data.map((q) => ({ ...q, _hay: haystack(q) }));
      readUrl();
      renderTags();
      render();
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) focusQuote(id);
    })
    .catch((err) => {
      els.count.textContent = "";
      els.empty.hidden = false;
      els.empty.textContent = `Couldn't load quotes (${err.message}).`;
    });
})();
