(() => {
  "use strict";

  const model = window.PetsNavigation?.items || [];
  const header = document.querySelector(".site-header");
  const menu = document.getElementById("site-menu");
  const toggle = document.querySelector(".nav-menu-toggle");
  const closeButton = document.querySelector(".nav-menu-close");
  const scrim = document.querySelector(".nav-menu-scrim");
  const navLinks = [...document.querySelectorAll("[data-nav-id]")];
  const sectionTargets = new Map();

  for (const item of model) {
    const target = document.getElementById(item.targetId);
    const section = document.getElementById(item.sectionId);
    if (target && section) sectionTargets.set(item.id, {target, section});
  }

  if (!menu || !toggle || !closeButton || !scrim || !sectionTargets.size) return;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  let menuState = "CLOSED";
  let lastFocused = toggle;
  let menuHistoryOpen = false;
  let skipNextPopstate = false;

  const isMenuOpen = () => menuState === "OPEN";
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setMenuVisualState = open => {
    menuState = open ? "OPEN" : "CLOSED";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    document.documentElement.classList.toggle("menu-open", open); document.body?.classList.toggle("menu-open", open);
    if (open) closeButton.focus({preventScroll:true});
  };

  const restoreFocus = () => {
    const target = lastFocused?.isConnected ? lastFocused : toggle;
    target?.focus?.({preventScroll:true});
  };

  const headerOffset = () => (header?.getBoundingClientRect().height || 64) + 12;

  const targetTop = target => Math.max(
    0,
    Math.round(window.scrollY + target.getBoundingClientRect().top - headerOffset())
  );

  const scrollToTarget = (id, {behavior="auto"} = {}) => {
    const entry = sectionTargets.get(id);
    if (!entry) return false;
    window.scrollTo({
      top: targetTop(entry.target),
      left: 0,
      behavior: reducedMotion() ? "auto" : behavior
    });
    return true;
  };

  const syncActive = id => {
    navLinks.forEach(link => {
      const active = link.dataset.navId === id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const currentIdFromHash = () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    return sectionTargets.has(id) ? id : "";
  };

  const openMenu = () => {
    if (isMenuOpen()) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    setMenuVisualState(true);
    if (!menuHistoryOpen) {
      menuHistoryOpen = true;
      history.pushState({petsMenu:true, hash:location.hash}, "", location.href);
    }
  };

  const closeMenu = ({syncHistory=true, restore=true} = {}) => {
    if (!isMenuOpen()) return;
    setMenuVisualState(false);
    const shouldBack = syncHistory && menuHistoryOpen;
    menuHistoryOpen = false;
    if (shouldBack && "back" in history) {
      skipNextPopstate = true;
      history.back();
    }
    if (restore) restoreFocus();
  };

  const navigateTo = (id, {fromMenu=false, behavior="auto"} = {}) => {
    const entry = sectionTargets.get(id);
    if (!entry) return false;

    menuState = "NAVIGATING";
    const hash = "#" + id;

    if (fromMenu) {
      history.replaceState({petsSection:id}, "", hash);
      menuHistoryOpen = false;
      setMenuVisualState(false);
    } else if (location.hash !== hash) {
      history.pushState({petsSection:id}, "", hash);
    } else {
      history.replaceState({petsSection:id}, "", hash);
    }

    scrollToTarget(id, {behavior});
    syncActive(id);
    restoreFocus();
    menuState = "CLOSED";
    return true;
  };

  toggle.addEventListener("click", openMenu);
  closeButton.addEventListener("click", () => closeMenu());
  scrim.addEventListener("click", () => closeMenu());

  navLinks.forEach(link => {
    link.addEventListener("click", event => {
      const id = link.dataset.navId;
      if (!sectionTargets.has(id)) return;
      event.preventDefault();
      const fromMenu = link.closest(".nav-menu") !== null;
      navigateTo(id, {fromMenu, behavior:"auto"});
    });
  });

  window.addEventListener("popstate", event => {
    if (skipNextPopstate) {
      skipNextPopstate = false;
      return;
    }

    if (isMenuOpen()) {
      menuHistoryOpen = false;
      closeMenu({syncHistory:false});
      return;
    }

    const id = currentIdFromHash();
    if (id) {
      requestAnimationFrame(() => scrollToTarget(id));
      syncActive(id);
    } else if (!location.hash && !event.state?.petsMenu) {
      requestAnimationFrame(() => window.scrollTo({top:0,left:0,behavior:"auto"}));
      syncActive("");
    }
  });

  window.addEventListener("hashchange", () => {
    const id = currentIdFromHash();
    if (!id) return;
    requestAnimationFrame(() => scrollToTarget(id));
    syncActive(id);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isMenuOpen()) {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab" || !isMenuOpen()) return;
    const focusable = [closeButton, ...menu.querySelectorAll("a[href],button:not([disabled])")].filter(Boolean);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const activeIdFromScroll = () => {
    const threshold = window.scrollY + headerOffset() + 1;
    let activeId = "";
    for (const item of model) {
      const entry = sectionTargets.get(item.id);
      if (!entry) continue;
      const top = entry.target.getBoundingClientRect().top + window.scrollY;
      if (top <= threshold) activeId = item.id;
      else break;
    }
    return activeId;
  };

  let activeSyncFrame = 0;
  const syncActiveFromScroll = () => {
    activeSyncFrame = 0;
    syncActive(activeIdFromScroll());
  };
  const scheduleActiveSync = () => {
    if (activeSyncFrame) return;
    activeSyncFrame = requestAnimationFrame(syncActiveFromScroll);
  };

  window.addEventListener("scroll", scheduleActiveSync, {passive:true});
  window.addEventListener("resize", scheduleActiveSync);
  window.addEventListener("orientationchange", scheduleActiveSync);

  const initialId = currentIdFromHash();
  if (initialId) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToTarget(initialId));
      syncActive(initialId);
    });
  } else {
    requestAnimationFrame(syncActiveFromScroll);
  }
})();