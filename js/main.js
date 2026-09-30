(() => {
  "use strict";
  const model = window.PetsNavigation?.items || [];
  const toggle = document.querySelector(".nav-menu-toggle");
  const menu = document.querySelector(".nav-menu");
  const scrim = document.querySelector(".nav-menu-scrim");
  const closeButton = document.querySelector(".nav-menu-close");
  const nav = document.querySelector(".nav");
  const menuLinks = [...document.querySelectorAll(".nav-menu-list a[data-nav-id]")];
  const navLinks = [...document.querySelectorAll(".nav-links a[data-nav-id]")];
  if (!toggle || !menu || !scrim) return;

  const targets = new Map(model.map(item => [item.id, document.getElementById(item.id)]));
  let menuHistoryEntry = false;
  let historyCleanup = false;
  let lastFocused = toggle;

  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  const setOpen = open => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
    menu.setAttribute("aria-hidden", String(!open));
    menu.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
  };

  const applyModel = () => {
    model.forEach((item, index) => {
      const desktop = navLinks.find(link => link.dataset.navId === item.id);
      if (desktop) {
        desktop.href = "#" + item.id;
        desktop.textContent = item.label;
      }
      const mobile = menuLinks.find(link => link.dataset.navId === item.id);
      if (mobile) {
        const num = mobile.querySelector("span");
        const label = mobile.querySelector("b");
        if (num) num.textContent = String(index + 1).padStart(2, "0");
        if (label) label.textContent = item.menuLabel;
        mobile.href = "#" + item.id;
        mobile.setAttribute("aria-label", item.menuLabel);
      }
    });
  };

  const openMenu = () => {
    if (isOpen()) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : toggle;
    setOpen(true);
    if (!menuHistoryEntry && !historyCleanup && "pushState" in history) {
      menuHistoryEntry = true;
      history.pushState({petsMenu:true}, "", location.href);
    }
    closeButton?.focus();
  };

  const closeMenu = ({fromHistory=false} = {}) => {
    if (!isOpen()) return;
    const shouldRestore = !fromHistory && menuHistoryEntry && !historyCleanup && "back" in history;
    menuHistoryEntry = false;
    setOpen(false);
    if (shouldRestore) {
      historyCleanup = true;
      history.back();
    }
    (lastFocused || toggle).focus?.();
  };

  const sectionTop = target => {
    const headerHeight = nav?.getBoundingClientRect().height || 64;
    return Math.max(0, Math.round(
      window.pageYOffset + target.getBoundingClientRect().top - headerHeight - 10
    ));
  };

  const navigate = id => {
    const target = targets.get(id);
    if (!target) return;
    const hash = "#" + id;
    if ("replaceState" in history) history.replaceState(null, "", hash);
    else location.hash = hash;
    menuHistoryEntry = false;
    setOpen(false);
    window.scrollTo(0, sectionTop(target));
    lastFocused = toggle;
  };

  const syncActive = id => {
    [...navLinks, ...menuLinks].forEach(link => {
      const active = link.dataset.navId === id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  applyModel();

  toggle.addEventListener("click", openMenu);
  closeButton?.addEventListener("click", () => closeMenu());
  scrim.addEventListener("click", () => closeMenu());
  menuLinks.forEach(link => link.addEventListener("click", event => {
    event.preventDefault();
    navigate(link.dataset.navId);
  }));
  navLinks.forEach(link => link.addEventListener("click", event => {
    const id = link.dataset.navId;
    if (!targets.has(id)) return;
    event.preventDefault();
    navigate(id);
  }));

  window.addEventListener("popstate", event => {
    if (historyCleanup) {
      historyCleanup = false;
      return;
    }
    if (event.state?.petsMenu) {
      menuHistoryEntry = true;
      setOpen(true);
      closeButton?.focus();
    } else {
      menuHistoryEntry = false;
      setOpen(false);
    }
  });

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (targets.has(id)) {
      window.scrollTo(0, sectionTop(targets.get(id)));
      syncActive(id);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && isOpen()) closeMenu();
    if (event.key === "Tab" && isOpen()) {
      const focusable = [closeButton, ...menuLinks].filter(Boolean);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const sections = model.map(item => targets.get(item.id)).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) syncActive(visible.target.id);
    }, {rootMargin:"-16% 0px -64% 0px",threshold:[0.05,0.2,0.5]});
    sections.forEach(section => observer.observe(section));
  } else {
    let ticking = false;
    const update = () => {
      ticking = false;
      const marker = window.scrollY + window.innerHeight * .28;
      let current = sections[0]?.id || "about";
      sections.forEach(section => { if (section.offsetTop <= marker) current = section.id; });
      syncActive(current);
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, {passive:true});
  }

  const initialId = location.hash.slice(1);
  if (targets.has(initialId)) {
    requestAnimationFrame(() => window.scrollTo(0, sectionTop(targets.get(initialId))));
    syncActive(initialId);
  } else {
    syncActive("about");
  }

  window.addEventListener("pageshow", () => {
    const target = targets.get(location.hash.slice(1));
    if (target) requestAnimationFrame(() => window.scrollTo(0, sectionTop(target)));
  });
})();