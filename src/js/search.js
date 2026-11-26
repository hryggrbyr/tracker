document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("search");
  const results = document.getElementById("results");
  if (!input || !results) return;

  const ICONS = { book: "📚", movie: "🍿", series: "📺" };
  // Extra words people might type for each type
  const ALIASES = { book: "book", movie: "movie film", series: "series tv telly show" };
  const MAX_RESULTS = 50;
  // Higher = more important when a term matches
  const WEIGHTS = { title: 8, creator: 4, people: 2, meta: 1 };

  let index = [];

  const text = (v) => {
    if (v == null) return "";
    if (Array.isArray(v)) return v.map(text).join(" ");
    if (typeof v === "object") return text(v.name ?? v.title ?? Object.values(v));
    return String(v);
  };
  // Some titles contain HTML entities (e.g. &ldquo;), so decode them for display and search
  const decode = (s) =>
    s.includes("&")
      ? new DOMParser().parseFromString(s, "text/html").documentElement.textContent
      : s;
  // ISO dates become a bare year; anything else ("2024–", 1999) is left alone
  const yearOf = (v) => (/^\d{4}-\d{2}-\d{2}T/.test(v ?? "") ? v.slice(0, 4) : (v ?? ""));

  // Lowercase and strip accents so "Chloe" finds "Chloë"
  const normalise = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const prepare = (item) => {
    const creator = text(item.director || item.author || item.authors);
    const type = text(item.type).toLowerCase();
    const title = decode(text(item.title));
    const year = yearOf(item.year ?? item.published);
    return {
      ...item,
      title,
      year,
      type,
      creator: ["N/A", "Unknown"].includes(creator) ? "" : creator,
      fields: {
        title: normalise(`${title} ${decode(text(item.subtitle))} ${text(item.series)}`),
        creator: normalise(creator),
        people: normalise(text(item.actors)),
        meta: normalise(
          [
            text(item.genre),
            text(item.tags),
            text(item.publisher),
            text(item.recommended_by),
            year,
            ALIASES[type] ?? type,
            item.shelf,
            item.owned ? "owned" : "",
          ].join(" "),
        ),
      },
    };
  };

  // Every search term must match somewhere; the best field per term counts.
  const score = (entry, terms) => {
    let total = 0;
    for (const term of terms) {
      let best = 0;
      for (const [field, weight] of Object.entries(WEIGHTS)) {
        const value = entry.fields[field];
        if (!value.includes(term)) continue;
        const bonus = field === "title" && value.startsWith(term) ? 2 : 0;
        best = Math.max(best, weight + bonus);
      }
      if (best === 0) return 0;
      total += best;
    }
    return total;
  };

  const tableTemplate = document.getElementById("result-table");
  const rowTemplate = document.getElementById("result-row");
  const messageTemplate = document.getElementById("result-message");

  const message = (str) => {
    const p = messageTemplate.content.firstElementChild.cloneNode(true);
    p.textContent = str;
    results.append(p);
  };

  const render = () => {
    results.replaceChildren();
    const terms = normalise(input.value).split(/\s+/).filter(Boolean);
    if (!terms.length) return;

    const hits = index
      .map((entry) => ({ entry, score: score(entry, terms) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));

    if (!hits.length) return message("No results found 😢");

    const table = tableTemplate.content.firstElementChild.cloneNode(true);
    const tbody = table.querySelector("tbody");

    for (const { entry } of hits.slice(0, MAX_RESULTS)) {
      const row = rowTemplate.content.firstElementChild.cloneNode(true);

      const titleLink = row.querySelector(".title a");
      titleLink.href = entry.url;
      titleLink.textContent = `${ICONS[entry.type] ?? ""} ${entry.title}`.trim();

      row.querySelector(".creator").textContent = entry.creator || "—";
      row.querySelector(".year").textContent = entry.year || "—";

      tbody.append(row);
    }

    results.append(table);

    if (hits.length > MAX_RESULTS) {
      message(`Showing ${MAX_RESULTS} of ${hits.length}. Keep typing to narrow it down.`);
    }
  };

  fetch(input.dataset.index || "/search.json")
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      index = data.map(prepare);
      render(); // in case the user typed before the index arrived
    })
    .catch((error) => {
      console.error("Search index failed to load", error);
      results.replaceChildren();
      message("Search is unavailable right now.");
    });

  input.addEventListener("input", render);

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // "/" focuses the search box unless you're already typing somewhere
    if (e.key === "/" && !e.target.matches("input, textarea, select, [contenteditable]")) {
      e.preventDefault();
      input.focus();
    }

    // Escape clears the box and leaves it
    if (e.key === "Escape" && document.activeElement === input) {
      input.value = "";
      render();
      input.blur();
    }
  });
});
