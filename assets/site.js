/* Shared, dependency-free shell for the original course-note HTML pages. */

// This catalog is the single source for the header search, rail, and chapter
// pagination. The filenames intentionally match the original static pages.
const CHAPTERS = [
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
const THEME_STORAGE_KEY = "os-notes-theme";

// GitHub Pages serves these documents directly, so navigation is resolved from
// the filename rather than from a router or a build-time manifest.
const getPageFilename = () => {
  const file = window.location.pathname.split("/").pop();
  return file || "index.html";
};

// Derive the page facts once so the rest of the shell does not read the URL
// independently and accidentally work with different page states.
const getPageContext = () => {
  const fileName = getPageFilename();
  return {
    fileName,
    isIndex: fileName === "index.html",
    chapter: CHAPTERS.find((chapter) => chapter.href === fileName) || null
  };
};

// Section IDs are generated only for the local outline. Prefixing them keeps
// headings such as "1.1" valid CSS selectors and stable hash targets.
const slugify = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

// Small DOM factory used by the shell builders below. It avoids repeating the
// class and text assignment pattern while keeping the markup explicit.
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

// Links are created in one place so generated navigation uses the same
// explicit text-node path as search results and never needs innerHTML.
const createLink = (href, text, className = "") => {
  const link = createElement("a", className, text);
  link.href = href;
  return link;
};

// Chapter numbers are stored as strings because they also appear in labels.
// This formatter keeps single-digit chapters aligned with the original UI.
const formatChapterNumber = (number) => {
  const value = String(number);
  return value.length < 2 ? `0${value}` : value;
};

// Use removeChild rather than innerHTML so callers can safely move existing
// source nodes without reparsing their contents.
const clearChildren = (element) => {
  while (element.firstChild) element.removeChild(element.firstChild);
};

// The old pages remain the content source. We move their body nodes into an
// article instead of duplicating or rewriting the course notes.
const extractSourceArticle = (context) => {
  const articleClass = context.isIndex ? "index-content" : "note-content";
  const article = createElement("article", `source-content ${articleClass}`);
  const sourceNodes = Array.from(document.body.childNodes).filter((node) => {
    return !(node.nodeType === Node.ELEMENT_NODE && node.tagName === "SCRIPT");
  });

  sourceNodes.forEach((node) => article.appendChild(node));
  return { article, sourceNodes };
};

// The source pages use tags and attributes that were common in early HTML.
// Remove those layout instructions so the stylesheet can own the presentation.
const removeLegacyLayout = (article) => {
  article.querySelectorAll("center").forEach((center) => {
    const parent = center.parentNode;
    if (!parent) return;
    Array.from(center.childNodes).forEach((child) => parent.insertBefore(child, center));
    parent.removeChild(center);
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
    if (!title.id) {
      title.id = "top";
    } else if (title.id !== "top" && !article.querySelector("#top")) {
      const topAnchor = createElement("span");
      topAnchor.id = "top";
      topAnchor.setAttribute("aria-hidden", "true");
      title.parentNode.insertBefore(topAnchor, title);
    }
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
      try {
        image.src = new URL(source, ORIGINAL_ROOT).href;
      } catch {
        // One malformed figure should not remove the rest of the notes.
      }
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
    if (table.parentElement && table.parentElement.classList.contains("table-wrap")) return;
    const wrapper = createElement("div", "table-wrap");
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
const prepareSourceArticle = (article) => {
  removeLegacyLayout(article);
  markPageTitles(article);
  addSectionAnchors(article);
  prepareImages(article);
  makeTablesScrollable(article);
  markCodeBlocks(article);
};

// Add the small orientation block used by the course index. DOM nodes are
// created explicitly so this remains safe if the copy changes later.
const addIndexIntro = (article) => {
  const title = article.querySelector("h1");
  if (!title || article.querySelector("[data-shell-intro]")) return;

  title.textContent = "Operating systems course notes";
  const kicker = createElement("span", "index-kicker", "Operating systems / course archive");
  const intro = createElement(
    "p",
    "index-intro",
    "Start with Chapter 1 and continue in order, or open a chapter from the topic groups below. Use Search to jump to a chapter by subject and Course map to return here."
  );
  kicker.dataset.shellIntro = "true";
  intro.dataset.shellIntro = "true";
  title.parentNode.insertBefore(kicker, title);
  title.parentNode.insertBefore(intro, title.nextSibling);
};

// Keep chapter navigation to one clear route back to the course index.
const addChapterIntro = (article, chapter) => {
  const title = article.querySelector("h1");
  if (!title || !chapter || article.querySelector("[data-shell-intro]")) return;

  const context = createElement("nav", "note-context");
  context.setAttribute("aria-label", "Chapter context");
  context.dataset.shellIntro = "true";
  context.appendChild(createLink("index.html#course-index", "Back to index"));
  title.parentNode.insertBefore(context, title);
};

// Header controls are shared by every document and stay usable without a
// framework or server-side include system.
const buildHeader = () => {
  const header = createElement("header", "site-header");
  const inner = createElement("div", "site-header__inner");
  const brand = createLink("index.html", "Operating systems notes", "site-brand");

  const controls = createElement("div", "site-header__meta");
  const nav = createElement("nav", "site-nav");
  nav.setAttribute("aria-label", "Primary");
  nav.appendChild(createLink("index.html", "Course map"));

  const searchButton = createElement("button", "header-button", "Search");
  searchButton.type = "button";
  searchButton.dataset.openSearch = "true";

  const themeButton = createElement("button", "header-button", "Night");
  themeButton.type = "button";
  themeButton.dataset.toggleTheme = "true";
  themeButton.setAttribute("aria-pressed", "false");

  controls.append(nav, searchButton, themeButton);
  inner.append(brand, controls);
  header.appendChild(inner);
  return header;
};

// Build the outline from h3 headings. h4 and lower headings stay in the prose
// so the outline remains useful instead of becoming a second full document.
const buildChapterOutline = (article) => {
  const headings = Array.from(article.querySelectorAll("h3"));
  if (!headings.length) return null;

  const aside = createElement("aside", "notes-toc");
  aside.setAttribute("aria-label", "Chapter outline");
  const details = createElement("details");
  details.open = true;
  const summary = createElement("summary", "", "On this page");
  const nav = createElement("nav");
  nav.setAttribute("aria-label", "On this page");

  headings.forEach((heading) => {
    const link = createLink(`#${heading.id}`, heading.textContent.trim());
    link.dataset.tocLink = "true";
    nav.appendChild(link);
  });

  details.append(summary, nav);
  aside.appendChild(details);
  return aside;
};

// Pagination uses the catalog order, keeping review sessions moving between
// adjacent chapters without inventing a separate route structure.
const buildPagination = (chapter) => {
  if (!chapter) return null;
  const index = CHAPTERS.indexOf(chapter);
  if (index < 0) return null;

  const previous = CHAPTERS[index - 1];
  const next = CHAPTERS[index + 1];
  if (!previous && !next) return null;

  const nav = createElement("nav", "chapter-pagination");
  nav.setAttribute("aria-label", "Chapter navigation");

  if (previous) {
    const link = createLink(previous.href, "");
    link.append(
      createElement("span", "", `Previous / ${formatChapterNumber(previous.number)}`),
      createElement("strong", "", previous.title)
    );
    nav.appendChild(link);
  } else {
    nav.appendChild(createElement("span"));
  }

  if (next) {
    const link = createLink(next.href, "");
    link.append(
      createElement("span", "", `Next / ${formatChapterNumber(next.number)}`),
      createElement("strong", "", next.title)
    );
    nav.appendChild(link);
  }

  return nav;
};

// The footer documents the source and the deployment model instead of adding
// generic product links that do not belong to a course archive.
const buildFooter = () => {
  const footer = createElement("footer", "site-footer");
  const inner = createElement("div", "site-footer__inner");
  const copy = createElement("div");
  copy.append(
    createElement("h2", "site-footer__title", "Read the system, one layer at a time."),
    createElement(
      "p",
      "",
      "The course material and figures are by John Bell for CS 385 at the University of Illinois Chicago. I did not write, revise, or claim authorship of that material. This project only modernizes the interface around the original static pages."
    )
  );

  const links = createElement("nav", "site-footer__links");
  links.setAttribute("aria-label", "Footer");
  const topLink = createLink("#top", "Back to top", "back-to-top");
  topLink.dataset.backToTop = "true";
  links.append(
    createLink("index.html", "Back to course map"),
    topLink
  );

  inner.append(copy, links);
  footer.appendChild(inner);
  return footer;
};

// Search is intentionally local and small. It covers the chapter catalog,
// which is the useful cross-page index for a static deployment.
const buildSearchDialog = () => {
  const dialog = createElement("dialog", "search-dialog");
  dialog.setAttribute("aria-labelledby", "search-dialog-title");

  const inner = createElement("div", "search-dialog__inner");
  const head = createElement("div", "search-dialog__head");
  const title = createElement("h2", "", "Search the notes");
  title.id = "search-dialog-title";

  const closeButton = createElement("button", "header-button search-dialog__close", "Close");
  closeButton.type = "button";
  closeButton.dataset.closeSearch = "true";
  head.append(title, closeButton);

  const input = createElement("input");
  input.type = "search";
  input.placeholder = 'Try "memory" or "processes"';
  input.setAttribute("aria-label", "Search course notes");

  const results = createElement("ul", "search-results");
  results.setAttribute("aria-live", "polite");
  const hint = createElement("p", "search-dialog__hint", "Press / to open. Press Escape to close.");

  inner.append(head, input, results, hint);
  dialog.appendChild(inner);
  return { dialog, input, results, closeButton };
};

// Search only the small static catalog. Note text stays on its own page so
// this interaction never needs a server or a second content index.
const getSearchMatches = (query) => {
  const normalized = query.trim().toLowerCase();
  return CHAPTERS.filter((chapter) => {
    const searchable = `${chapter.number} ${chapter.group} ${chapter.title}`.toLowerCase();
    return searchable.includes(normalized);
  });
};

// Render search results with text nodes so catalog values never become HTML.
const renderSearchResults = (results, query) => {
  const matches = getSearchMatches(query);
  clearChildren(results);
  results.setAttribute("aria-label", `${matches.length} chapters found`);

  matches.forEach((chapter) => {
    const item = createElement("li");
    const link = createLink(chapter.href, "");
    link.append(
      createElement("span", "", `${chapter.group} / ${formatChapterNumber(chapter.number)}`),
      createElement("strong", "", chapter.title)
    );
    item.appendChild(link);
    results.appendChild(item);
  });

  if (!matches.length) {
    results.appendChild(createElement("li", "search-empty", "No chapters found."));
  }
};

// Storage is optional. Private browsing or a restrictive browser policy should
// affect persistence only, never the theme control or the notes.
const readStoredTheme = () => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The visual preference still works when storage is unavailable.
  }
};

// Apply the state to both CSS and the button's accessible pressed value.
const applyTheme = (theme, button) => {
  const isNight = theme === "night";
  if (isNight) {
    document.body.dataset.theme = "night";
  } else {
    delete document.body.dataset.theme;
  }

  if (!button) return;
  button.textContent = isNight ? "Day" : "Night";
  button.setAttribute("aria-pressed", String(isNight));
};

// Persist the reader's surface preference without making storage a dependency
// of the page itself.
const bindTheme = () => {
  const button = document.querySelector("[data-toggle-theme]");
  const initialTheme = readStoredTheme() === "night" ? "night" : "day";
  applyTheme(initialTheme, button);
  if (!button) return;

  button.addEventListener("click", () => {
    const nextTheme = document.body.dataset.theme === "night" ? "day" : "night";
    applyTheme(nextTheme, button);
    writeStoredTheme(nextTheme);
  });
};

// A native dialog exposes the open state as an attribute. The same check also
// works for the simple open-attribute fallback used without showModal().
const isDialogOpen = (dialog) => dialog.hasAttribute("open");

// Open the search surface and remember the control that should regain focus.
const openSearch = (search, trigger) => {
  if (isDialogOpen(search.dialog)) return;
  search.lastTrigger = trigger || null;

  if (typeof search.dialog.showModal === "function") {
    search.dialog.showModal();
  } else {
    search.dialog.setAttribute("open", "true");
  }
  search.input.focus();
};

// Reset the query and restore focus after either Escape or the close button.
const resetSearch = (search) => {
  search.input.value = "";
  renderSearchResults(search.results, "");
  if (search.lastTrigger) search.lastTrigger.focus();
  search.lastTrigger = null;
};

// Use the native close event where available, with an attribute fallback for
// browsers that can render dialog but do not implement its modal methods.
const closeSearch = (search) => {
  if (!isDialogOpen(search.dialog)) return;

  if (typeof search.dialog.close === "function") {
    search.dialog.close();
  } else {
    search.dialog.removeAttribute("open");
    resetSearch(search);
  }
};

const isTextEntry = (target) => {
  if (!target) return false;
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target.isContentEditable;
};

// Support the visible button and the slash shortcut. The dialog object owns
// its own open, close, focus, and reset behavior.
const bindSearch = (search) => {
  renderSearchResults(search.results, "");

  document.querySelectorAll("[data-open-search]").forEach((button) => {
    button.addEventListener("click", () => openSearch(search, button));
  });
  search.closeButton.addEventListener("click", () => closeSearch(search));
  search.input.addEventListener("input", () => {
    renderSearchResults(search.results, search.input.value);
  });
  search.dialog.addEventListener("close", () => resetSearch(search));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isDialogOpen(search.dialog)) {
      event.preventDefault();
      closeSearch(search);
      return;
    }

    if (event.key === "/" && !isTextEntry(event.target)) {
      event.preventDefault();
      openSearch(search, document.activeElement);
    }
  });
};

// Prefer a paint-aligned update, with a timer fallback for older browsers.
const scheduleFrame = (callback) => {
  if (typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback);
  }
  return window.setTimeout(callback, 0);
};

const getScrollPosition = () => window.scrollY || window.pageYOffset || 0;

const updateProgress = (bar) => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? getScrollPosition() / scrollable : 0;
  bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
};

// Reading progress is functional UI, so it updates on scroll and resize but
// batches the work into one animation frame per event burst.
const bindProgress = (context) => {
  const bar = document.querySelector(".reading-progress__bar");
  if (!bar || context.isIndex) return;

  let updatePending = false;
  const requestUpdate = () => {
    if (updatePending) return;
    updatePending = true;
    scheduleFrame(() => {
      updatePending = false;
      updateProgress(bar);
    });
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  updateProgress(bar);
};

// Resolve a hash by ID instead of treating it as a CSS selector. Source IDs
// can contain punctuation that selectors would interpret as syntax.
const getHashTarget = (hash) => {
  const rawId = hash && hash.charAt(0) === "#" ? hash.slice(1) : hash;
  if (!rawId) return null;
  try {
    return document.getElementById(decodeURIComponent(rawId));
  } catch {
    return null;
  }
};

const setActiveTocLink = (links, activeId) => {
  links.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${activeId}`;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

// Highlight the section currently near the reading viewport. The observer is
// optional, so the outline still works as plain links in older browsers.
const bindToc = () => {
  const links = Array.from(document.querySelectorAll("[data-toc-link]"));
  if (!links.length || typeof window.IntersectionObserver !== "function") return;

  const sections = links.map((link) => getHashTarget(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visibleEntries = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top);
    const firstVisible = visibleEntries[0];
    if (firstVisible) setActiveTocLink(links, firstVisible.target.id);
  }, { rootMargin: "-18% 0px -70% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
};

// Back-to-top follows the user's motion preference instead of forcing a
// smooth animation on every reader.
const getReducedMotionBehavior = () => {
  if (typeof window.matchMedia !== "function") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
};

const bindBackToTop = () => {
  const link = document.querySelector("[data-back-to-top]");
  if (!link) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    try {
      window.scrollTo({ top: 0, behavior: getReducedMotionBehavior() });
    } catch {
      window.scrollTo(0, 0);
    }
  });
};

// Compare URL origins so relative chapter links stay internal even after the
// browser exposes their absolute href property.
const isExternalLink = (link) => {
  const href = link.getAttribute("href");
  if (!href || href.charAt(0) === "#") return false;

  try {
    const url = new URL(href, window.location.href);
    return (url.protocol === "http:" || url.protocol === "https:")
      && url.origin !== window.location.origin;
  } catch {
    return false;
  }
};

// External references open separately. Relative links remain in the same tab
// so chapter navigation does not unexpectedly create new windows.
const bindExternalLinks = () => {
  document.querySelectorAll(".source-content a[href]").forEach((link) => {
    if (!isExternalLink(link)) return;
    link.target = "_blank";
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noreferrer");
    rel.add("noopener");
    link.setAttribute("rel", Array.from(rel).join(" "));
  });
};

// A few source pages contain inline legacy styles. The shared stylesheet is the
// single visual source of truth, so remove those rules before rendering.
const removeLegacyStyles = () => {
  document.head.querySelectorAll("style").forEach((style) => {
    if (style.parentNode) style.parentNode.removeChild(style);
  });
};

// Build the entire shell off-document. The body is replaced only after every
// node has been created successfully.
const buildPageShell = (context, article) => {
  const fragment = document.createDocumentFragment();
  const skipLink = createLink("#main-content", "Skip to content", "skip-link");
  const progress = createElement("div", "reading-progress");
  progress.setAttribute("aria-hidden", "true");
  progress.appendChild(createElement("span", "reading-progress__bar"));
  fragment.append(skipLink, progress, buildHeader());

  const mainClass = context.isIndex ? "index-main" : "note-main";
  const main = createElement("main", `site-main ${mainClass}`);
  main.id = "main-content";

  if (context.isIndex) {
    main.appendChild(article);
  } else {
    const layout = createElement("div", "reading-layout");
    const outline = buildChapterOutline(article);
    const pagination = buildPagination(context.chapter);
    if (pagination) article.appendChild(pagination);
    layout.appendChild(article);
    if (outline) layout.appendChild(outline);
    main.appendChild(layout);
  }

  fragment.append(main, buildFooter());
  const search = buildSearchDialog();
  fragment.appendChild(search.dialog);
  return { fragment, search };
};

// Keep the original notes usable if an optional browser feature breaks during
// initialization.
const restoreSourceContent = (sourceNodes) => {
  clearChildren(document.body);
  document.body.removeAttribute("class");
  sourceNodes.forEach((node) => document.body.appendChild(node));
};

// Assemble the shell only after preparation succeeds. If an optional browser
// API fails, the original notes are restored instead of leaving a blank page.
const init = () => {
  const context = getPageContext();
  const source = extractSourceArticle(context);

  try {
    removeLegacyStyles();
    prepareSourceArticle(source.article);
    if (context.isIndex) {
      addIndexIntro(source.article);
    } else {
      addChapterIntro(source.article, context.chapter);
    }

    const shell = buildPageShell(context, source.article);
    clearChildren(document.body);
    document.body.className = `site-page ${context.isIndex ? "is-index" : "is-note"}`;
    document.body.appendChild(shell.fragment);

    bindTheme();
    bindSearch(shell.search);
    bindProgress(context);
    bindToc();
    bindBackToTop();
    bindExternalLinks();
  } catch (error) {
    restoreSourceContent(source.sourceNodes);
    console.error("The reading shell could not initialize.", error);
  }
};

// Defer until the source body exists, while still supporting direct execution
// when this file is loaded after parsing.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
