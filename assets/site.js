/* Shared, dependency-free shell for the original course-note HTML pages. */

// This catalog is the single source for the header search, rail, and chapter
// pagination. The filenames intentionally match the original static pages.
const chapters = [
  {
    group: "Preparation",
    number: "0",
    title: "C programming for Java programmers",
    href: "0_CforJavaProgrammers.html"
  },
  {
    group: "Part one / Overview",
    number: "1",
    title: "Introduction",
    href: "1_Introduction.html"
  },
  {
    group: "Part one / Overview",
    number: "2",
    title: "Operating-system structures",
    href: "2_Structures.html"
  },
  {
    group: "Part two / Process management",
    number: "3",
    title: "Processes",
    href: "3_Processes.html"
  },
  {
    group: "Part two / Process management",
    number: "4",
    title: "Threads",
    href: "4_Threads.html"
  },
  {
    group: "Part two / Process management",
    number: "5",
    title: "Process synchronization",
    href: "5_Synchronization.html"
  },
  {
    group: "Part two / Process management",
    number: "6",
    title: "CPU scheduling",
    href: "6_CPU_Scheduling.html"
  },
  {
    group: "Part two / Process management",
    number: "7",
    title: "Deadlocks",
    href: "7_Deadlocks.html"
  },
  {
    group: "Part three / Memory management",
    number: "8",
    title: "Main memory",
    href: "8_MainMemory.html"
  },
  {
    group: "Part three / Memory management",
    number: "9",
    title: "Virtual memory",
    href: "9_VirtualMemory.html"
  },
  {
    group: "Part four / Storage management",
    number: "10",
    title: "Mass-storage structure",
    href: "10_MassStorage.html"
  },
  {
    group: "Part four / Storage management",
    number: "11",
    title: "File-system interface",
    href: "11_FileSystemInterface.html"
  },
  {
    group: "Part four / Storage management",
    number: "12",
    title: "File-system implementation",
    href: "12_FileSystemImplementation.html"
  },
  {
    group: "Part four / Storage management",
    number: "13",
    title: "I/O systems",
    href: "13_IOSystems.html"
  },
  {
    group: "Part five / Protection and security",
    number: "14",
    title: "Protection",
    href: "14_Protection.html"
  },
  {
    group: "Part five / Protection and security",
    number: "15",
    title: "Security",
    href: "15_Security.html"
  }
];

// Figures stay hosted by the original course site. The shell rewrites their
// relative source paths at runtime so the repository contains no image copy.
const ORIGINAL_ROOT = "https://www.cs.uic.edu/~jbell/CourseNotes/OperatingSystems/";

// GitHub Pages serves these documents directly, so navigation is resolved from
// the filename rather than from a router or a build-time manifest.
const currentFile = () => {
  const file = window.location.pathname.split("/").pop();
  return file || "index.html";
};

const isIndex = currentFile() === "index.html";

// Section IDs are generated only for the local outline. Prefixing them keeps
// headings such as "1.1" valid CSS selectors and stable hash targets.
const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

// Small DOM factory used by the shell builders below. It avoids repeating the
// class and text assignment pattern while keeping the markup explicit.
const makeElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const getCurrentChapter = () => chapters.find((chapter) => chapter.href === currentFile());

// The old pages remain the content source. We move their body nodes into an
// article instead of duplicating or rewriting the course notes.
const getSourceContent = () => {
  const content = makeElement("article", `source-content ${isIndex ? "index-content" : "note-content"}`);
  const originalNodes = Array.from(document.body.childNodes);

  originalNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SCRIPT") return;
    content.appendChild(node);
  });

  return content;
};

// The source pages use tags and attributes that were common in early HTML.
// Remove those layout instructions so the stylesheet can own the presentation.
const removeLegacyLayout = (article) => {
  article.querySelectorAll("center").forEach((center) => {
    center.replaceWith(...Array.from(center.childNodes));
  });

  article.querySelectorAll("[align]").forEach((element) => {
    element.removeAttribute("align");
  });
};

// The first h1 is the page title. Any later h1 in the old index is a warning,
// so it receives a quieter alert style instead of competing with the title.
const markPageTitles = (article) => {
  const title = article.querySelector("h1");
  if (title) {
    title.classList.add("page-title");
    title.id = "top";
  }

  article.querySelectorAll("h1").forEach((heading, index) => {
    if (index > 0) heading.classList.add("legacy-alert");
  });
};

// Give every section heading a unique hash target for the right-hand outline.
// Existing IDs are kept because some source pages already contain anchors.
const addSectionAnchors = (article) => {
  const usedIds = new Set(
    Array.from(article.querySelectorAll("[id]"), (element) => element.id)
  );

  article.querySelectorAll("h3, h4, h5, h6").forEach((heading) => {
    if (heading.id) return;

    const base = `section-${slugify(heading.textContent) || "section"}`;
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${base}-${suffix}`;
      suffix += 1;
    }

    heading.id = id;
    usedIds.add(id);
  });
};

// Keep images on the original host while adding browser hints for loading and
// decoding. The first image is eager because it usually starts the chapter.
const prepareImages = (article) => {
  article.querySelectorAll("img").forEach((image, index) => {
    const source = image.getAttribute("src");
    if (source && !/^(?:https?:|data:|blob:)/i.test(source)) {
      image.src = new URL(source, ORIGINAL_ROOT).href;
    }
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";
    image.removeAttribute("border");
  });
};

// Tables keep their semantic markup but gain a scroll container for narrow
// screens, where forcing their columns to wrap would make them unreadable.
const makeTablesScrollable = (article) => {
  article.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-wrap")) return;
    const wrapper = makeElement("div", "table-wrap");
    table.replaceWith(wrapper);
    wrapper.appendChild(table);
  });
};

// The CSS uses this hook to give preformatted examples the same treatment as
// the rest of the technical notes.
const markCodeBlocks = (article) => {
  article.querySelectorAll("pre").forEach((pre) => pre.classList.add("code-block"));
};

// Keep the order visible: each helper handles one legacy-formatting concern,
// while this function describes the complete preparation pass at a glance.
const normalizeContent = (article) => {
  removeLegacyLayout(article);
  markPageTitles(article);
  addSectionAnchors(article);
  prepareImages(article);
  makeTablesScrollable(article);
  markCodeBlocks(article);
};

// The new interface adds a short orientation line before the original title.
// It is separate from the source prose so future source updates remain safe.
const addIntro = (content, chapter) => {
  if (isIndex) {
    const title = content.querySelector("h1");
    if (!title) return;
    title.textContent = "Operating systems course notes";
    title.insertAdjacentHTML(
      "beforebegin",
      '<span class="index-kicker">Operating systems / course archive</span>'
    );
    title.insertAdjacentHTML(
      "afterend",
      '<p class="index-intro">A working index of John Bell\'s course notes for CS 385. Use the chapter list to move through the material, then return here when you need the map again.</p>'
    );
    return;
  }

  const title = content.querySelector("h1");
  if (!title || !chapter) return;
  const label = `Chapter ${chapter.number.padStart(2, "0")} / ${chapter.group}`;
  title.insertAdjacentHTML("beforebegin", `<span class="note-kicker">${label}</span>`);
  title.insertAdjacentHTML(
    "afterend",
    '<p class="note-intro">Course notes arranged for a slower read. Follow the sections in order, or use the outline when you are reviewing a single idea.</p>'
  );
};

// Header controls are shared by every document and stay usable without a
// framework or server-side include system.
const buildHeader = () => {
  const header = makeElement("header", "site-header");
  const inner = makeElement("div", "site-header__inner");
  const brand = document.createElement("a");
  brand.className = "site-brand";
  brand.href = "index.html";
  brand.innerHTML = '<span class="site-brand__mark">os / notes</span><span>Operating systems</span>';

  const meta = makeElement("div", "site-header__meta");
  const nav = makeElement("nav", "site-nav");
  nav.setAttribute("aria-label", "Primary");
  const indexLink = document.createElement("a");
  indexLink.href = "index.html";
  indexLink.textContent = "Course map";
  nav.appendChild(indexLink);

  const searchButton = makeElement("button", "header-button", "Search");
  searchButton.type = "button";
  searchButton.dataset.openSearch = "true";

  const themeButton = makeElement("button", "header-button", "Night");
  themeButton.type = "button";
  themeButton.dataset.toggleTheme = "true";

  meta.append(nav, searchButton, themeButton);
  inner.append(brand, meta);
  header.appendChild(inner);
  return header;
};

// The rail gives long notes a fixed way back to the course map and a compact
// indication of the current chapter.
const buildRail = (chapter) => {
  const rail = makeElement("aside", "chapter-rail");
  const wordmark = document.createElement("a");
  wordmark.className = "chapter-rail__wordmark";
  wordmark.href = "index.html";
  wordmark.textContent = "OS / notes";

  const rule = makeElement("span", "chapter-rail__rule");
  rule.setAttribute("aria-hidden", "true");

  const indexLink = document.createElement("a");
  indexLink.className = "chapter-rail__link";
  indexLink.href = "index.html";
  indexLink.textContent = "Index";

  const current = makeElement("span", "chapter-rail__current", chapter ? `Ch. ${chapter.number}` : "Note");
  rail.append(wordmark, rule, indexLink, current);
  return rail;
};

// Build the outline from the content that is actually present on the page.
// Supplemental note pages therefore get only the headings they contain.
const buildToc = (content) => {
  const headings = Array.from(content.querySelectorAll("h3"));
  if (!headings.length) return null;

  const aside = makeElement("aside", "notes-toc");
  const details = document.createElement("details");
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = "On this page";
  const nav = document.createElement("nav");
  nav.setAttribute("aria-label", "On this page");

  headings.forEach((heading) => {
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    nav.appendChild(link);
  });

  details.append(summary, nav);
  aside.appendChild(details);
  return aside;
};

// Pagination uses the catalog order, keeping review sessions moving between
// adjacent chapters without inventing a separate route structure.
const buildPagination = (content, chapter) => {
  if (!chapter) return;
  const index = chapters.indexOf(chapter);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  if (!previous && !next) return;

  const nav = makeElement("nav", "chapter-pagination");
  nav.setAttribute("aria-label", "Chapter navigation");

  if (previous) {
    const link = document.createElement("a");
    link.href = previous.href;
    link.innerHTML = `<span>Previous / ${previous.number.padStart(2, "0")}</span><strong>${previous.title}</strong>`;
    nav.appendChild(link);
  } else {
    nav.appendChild(document.createElement("span"));
  }

  if (next) {
    const link = document.createElement("a");
    link.href = next.href;
    link.innerHTML = `<span>Next / ${next.number.padStart(2, "0")}</span><strong>${next.title}</strong>`;
    nav.appendChild(link);
  }

  content.appendChild(nav);
};

// The footer documents the source and the deployment model instead of adding
// generic product links that do not belong to a course archive.
const buildFooter = () => {
  const footer = makeElement("footer", "site-footer");
  const inner = makeElement("div", "site-footer__inner");
  const copy = makeElement("div");
  copy.innerHTML = '<h2 class="site-footer__title">Read the system, one layer at a time.</h2><p>Original course notes by John Bell for CS 385 at the University of Illinois Chicago. This interface keeps the source pages and figures, adds a reading shell, and has no build step or server dependency.</p>';

  const links = makeElement("nav", "site-footer__links");
  links.setAttribute("aria-label", "Footer");
  const indexLink = document.createElement("a");
  indexLink.href = "index.html";
  indexLink.textContent = "Back to course map";
  const printLink = document.createElement("a");
  printLink.href = "#top";
  printLink.textContent = "Back to top";
  printLink.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  links.append(indexLink, printLink);

  inner.append(copy, links);
  footer.appendChild(inner);
  return footer;
};

// Search is intentionally local and small. It covers the chapter catalog,
// which is the useful cross-page index for a static deployment.
const buildSearchDialog = () => {
  const dialog = document.createElement("dialog");
  dialog.className = "search-dialog";
  dialog.innerHTML = '<div class="search-dialog__inner"><h2>Search the notes</h2><input type="search" placeholder="Try \"memory\" or \"processes\"" aria-label="Search course notes"><ul class="search-results"></ul><p class="search-dialog__hint">Press / to open. Press Escape to close.</p></div>';

  const input = dialog.querySelector("input");
  const results = dialog.querySelector(".search-results");

  const renderResults = (query = "") => {
    const normalized = query.trim().toLowerCase();
    results.replaceChildren();
    chapters
      .filter((chapter) => `${chapter.number} ${chapter.group} ${chapter.title}`.toLowerCase().includes(normalized))
      .forEach((chapter) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = chapter.href;
        link.innerHTML = `<span>${chapter.group} / ${chapter.number.padStart(2, "0")}</span><strong>${chapter.title}</strong>`;
        link.addEventListener("click", () => dialog.close());
        item.appendChild(link);
        results.appendChild(item);
      });
  };

  input.addEventListener("input", () => renderResults(input.value));
  dialog.addEventListener("close", () => {
    input.value = "";
    renderResults();
  });
  renderResults();
  return dialog;
};

// Persist the reader's surface preference in local storage. No preference is
// required for the first visit, so the default remains the paper theme.
const setupTheme = () => {
  const savedTheme = window.localStorage.getItem("os-notes-theme");
  if (savedTheme === "night") document.body.dataset.theme = "night";

  const button = document.querySelector("[data-toggle-theme]");
  if (!button) return;
  const updateLabel = () => {
    button.textContent = document.body.dataset.theme === "night" ? "Day" : "Night";
  };
  updateLabel();
  button.addEventListener("click", () => {
    const night = document.body.dataset.theme === "night";
    if (night) {
      delete document.body.dataset.theme;
      window.localStorage.setItem("os-notes-theme", "day");
    } else {
      document.body.dataset.theme = "night";
      window.localStorage.setItem("os-notes-theme", "night");
    }
    updateLabel();
  });
};

// Support both a visible button and the slash shortcut without hijacking text
// input fields where the character should be typed normally.
const setupSearch = (dialog) => {
  const openButtons = document.querySelectorAll("[data-open-search]");
  openButtons.forEach((button) => button.addEventListener("click", () => {
    dialog.showModal();
    dialog.querySelector("input")?.focus();
  }));

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
    if (event.key === "/" && !isTyping) {
      event.preventDefault();
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    }
  });
};

// Reading progress is updated in one animation frame per scroll burst. This
// keeps the indicator responsive without doing layout work for every event.
const setupProgress = () => {
  const bar = document.querySelector(".reading-progress__bar");
  if (!bar || isIndex) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  };
  window.addEventListener("scroll", () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  }, { passive: true });
  update();
};

// Highlight the section currently near the reading viewport. The observer is
// optional, so the outline still works as plain links in older browsers.
const setupToc = () => {
  const links = Array.from(document.querySelectorAll(".notes-toc a"));
  if (!links.length || !window.IntersectionObserver) return;
  const sections = links
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.toggle("is-active", link.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
};

// External references open separately so a student does not lose their place
// in the notes while checking a source or supporting resource.
const setupExternalLinks = () => {
  document.querySelectorAll(".source-content a[href]").forEach((link) => {
    if (!/^https?:/i.test(link.href)) return;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
  });
};

// Assemble the shell after the original document has loaded. The same entry
// point handles the index, chapters, and the two supplemental note pages.
const init = () => {
  const chapter = getCurrentChapter();
  document.head.querySelectorAll("style").forEach((style) => style.remove());
  const content = getSourceContent();
  normalizeContent(content);
  addIntro(content, chapter);

  document.body.replaceChildren();
  document.body.className = `site-page ${isIndex ? "is-index" : "is-note"}`;
  document.body.appendChild(makeElement("a", "skip-link", "Skip to content"));
  document.querySelector(".skip-link").href = "#main-content";

  const progress = makeElement("div", "reading-progress");
  progress.setAttribute("aria-hidden", "true");
  progress.appendChild(makeElement("span", "reading-progress__bar"));
  document.body.append(progress, buildHeader());

  const main = makeElement("main", `site-main ${isIndex ? "index-main" : "note-main"}`);
  main.id = "main-content";

  if (isIndex) {
    main.appendChild(content);
  } else {
    const layout = makeElement("div", "reading-layout");
    const toc = buildToc(content);
    layout.append(buildRail(chapter), content);
    if (toc) layout.appendChild(toc);
    main.appendChild(layout);
    buildPagination(content, chapter);
  }

  document.body.append(main, buildFooter());
  const dialog = buildSearchDialog();
  document.body.appendChild(dialog);

  setupTheme();
  setupSearch(dialog);
  setupProgress();
  setupToc();
  setupExternalLinks();
};

// Defer until the source body exists, while still supporting direct execution
// when this file is loaded after parsing.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
