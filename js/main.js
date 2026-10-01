(() => {
  "use strict";
  const nav = window.PetsNavigation?.items || [];
  const menu = document.getElementById("site-menu");
  const toggle = document.querySelector(".menu-toggle");
  const close = document.querySelector(".menu-close");
  const scrim = document.querySelector(".menu-scrim");
  const main = document.querySelector("main");
  let previousFocus = null;
  let menuState = "closed";

  const setMenu = (open, restore = true) => {
    menuState = open ? "open" : "closed";
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    scrim.style.display = open ? "block" : "none";
    menu.style.display = open ? "block" : "none";
    document.documentElement.classList.toggle("menu-open", open);
    if (open) {
      previousFocus = document.activeElement;
      close.focus({preventScroll:true});
      history.pushState({petsMenu:true},"",location.href);
    } else if (restore && previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus({preventScroll:true});
    }
  };

  const navigate = (href) => {
    const id = href.startsWith("#") ? href.slice(1) : "";
    const target = document.getElementById(id);
    if (!target) return;
    if (menuState === "open") {
      history.replaceState({}, "", href);
      setMenu(false, false);
    } else {
      history.pushState({}, "", href);
    }
    const top = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header")) || 72) - 10;
    window.scrollTo({top:Math.max(0,top),behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
    target.focus?.({preventScroll:true});
  };

  toggle.addEventListener("click", () => setMenu(menuState !== "open"));
  close.addEventListener("click", () => { history.back(); });
  scrim.addEventListener("click", () => history.back());
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
    const href=a.getAttribute("href");
    if (href === "#top") return;
    e.preventDefault();
    navigate(href);
  }));
  window.addEventListener("popstate", () => {
    if (menuState === "open") setMenu(false);
    const id=location.hash.slice(1);
    const target=id && document.getElementById(id);
    if(target) {
      requestAnimationFrame(() => {
        const top=target.getBoundingClientRect().top+window.scrollY-(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header"))||72)-10;
        window.scrollTo({top:Math.max(0,top),behavior:"auto"});
      });
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && menuState === "open") { e.preventDefault(); history.back(); }
    if (e.key !== "Tab" || menuState !== "open") return;
    const focusable=[...menu.querySelectorAll('a[href],button:not([disabled])')];
    if (!focusable.length) return;
    const first=focusable[0], last=focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
  });
  const sections=nav.map(x=>document.getElementById(x.id)).filter(Boolean);
  const links=[...document.querySelectorAll("[data-nav-id]")];
  const setActive=id=>links.forEach(a=>a.classList.toggle("is-active",a.dataset.navId===id));
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)setActive(entry.target.id)}),{rootMargin:"-35% 0px -55% 0px",threshold:0});
    sections.forEach(s=>io.observe(s));
  }
  if(location.hash) requestAnimationFrame(()=>window.scrollTo(0,Math.max(0,document.getElementById(location.hash.slice(1))?.offsetTop-(parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header"))||72)-10||0)));
})();