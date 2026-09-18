/* Butlers After Dark — motion & atmosphere. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer  = window.matchMedia("(pointer: fine)").matches;
  var docEl = document.documentElement;

  /* ——— Time of day: the room reads darker after six ——— */
  var hour = new Date().getHours();
  if (hour >= 18 || hour < 6) docEl.classList.add("night");

  /* ——— Hero title: split into rising characters ——— */
  var heroButlers = document.getElementById("heroButlers");
  if (heroButlers) {
    var chars = heroButlers.textContent.split("");
    heroButlers.textContent = "";
    chars.forEach(function (c, i) {
      var wrap = document.createElement("span");
      wrap.className = "ch";
      var inner = document.createElement("span");
      inner.className = "ch-in";
      inner.style.setProperty("--i", i);
      inner.textContent = c;
      wrap.appendChild(inner);
      heroButlers.appendChild(wrap);
    });
  }

  /* ——— Smooth scroll (Lenis, with graceful fallback) ——— */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
  }
  function scrollToTarget(target) {
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    } else {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      scrollToTarget(id);
    } else if (id === "#top") {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.4 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  /* ——— Scroll reveal ——— */
  var heroReveals = document.querySelectorAll(".hero .reveal");
  var allReveals = document.querySelectorAll(".reveal");
  var roomArt = document.getElementById("roomArt");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -3% 0px" }
    );
    allReveals.forEach(function (el) {
      if (!el.closest(".hero")) io.observe(el);
    });
    if (roomArt) io.observe(roomArt);
  } else {
    allReveals.forEach(function (el) { el.classList.add("in-view"); });
    if (roomArt) roomArt.classList.add("in-view");
  }

  /* ——— Preloader ——— */
  var loaderDone = false;
  function finishLoading() {
    if (loaderDone) return;
    loaderDone = true;
    document.body.classList.add("is-loaded");
    heroReveals.forEach(function (el) { el.classList.add("in-view"); });
    if (heroButlers) heroButlers.classList.add("in-view");
  }
  var loadStart = Date.now();
  window.addEventListener("load", function () {
    var wait = Math.max(0, 1150 - (Date.now() - loadStart));
    setTimeout(finishLoading, wait);
  });
  setTimeout(finishLoading, 2600); /* never trap the page */

  /* ——— Room illustration: draws itself on approach ——— */
  if (roomArt && !reduceMotion) {
    var paths = roomArt.querySelectorAll(".lineart path");
    paths.forEach(function (p, i) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transitionDelay = p.classList.contains("flame") ? "1.5s" : (i * 0.11) + "s";
    });
    var artIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          paths.forEach(function (p) { p.style.strokeDashoffset = 0; });
          artIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    artIO.observe(roomArt);
  }

  /* ——— Section spy ——— */
  var spyLinks = document.querySelectorAll(".side-nav a[data-spy]");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (l) {
          l.classList.toggle("is-active", l.getAttribute("data-spy") === entry.target.id);
        });
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    ["story", "menu", "room", "notes", "visit"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ——— Magnetic elements ——— */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      el.style.transition = "transform 0.45s cubic-bezier(0.22,1,0.36,1)";
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * 0.22 + "px," + y * 0.22 + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ——— Custom cursor ——— */
  var cursor = document.querySelector(".cursor");
  var mouse = { x: -100, y: -100 };
  if (cursor && finePointer && !reduceMotion) {
    cursor.style.opacity = "0";
    cursor.style.transition = "opacity 0.4s";
    var cursorSeen = false;
    document.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!cursorSeen) { cursorSeen = true; cursor.style.opacity = "1"; }
    });
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .menu-list li, .spec-row, .ticker")) {
        cursor.classList.add("is-hover");
      }
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .menu-list li, .spec-row, .ticker")) {
        cursor.classList.remove("is-hover");
      }
    });
    document.addEventListener("mousedown", function () { cursor.classList.add("is-down"); });
    document.addEventListener("mouseup", function () { cursor.classList.remove("is-down"); });
    document.addEventListener("mouseleave", function () { cursor.style.opacity = "0"; });
    document.addEventListener("mouseenter", function () { if (cursorSeen) cursor.style.opacity = "1"; });
  }

  /* ——— Dust motes in the candlelight ——— */
  var motesCanvas = document.getElementById("motes");
  var motesCtx = null, motes = [], motesRunning = false, motesW = 0, motesH = 0;
  if (motesCanvas && !reduceMotion) {
    motesCtx = motesCanvas.getContext("2d");
    var moteCount = finePointer ? 46 : 22;
    function sizeMotes() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      motesW = motesCanvas.offsetWidth;
      motesH = motesCanvas.offsetHeight;
      motesCanvas.width = motesW * dpr;
      motesCanvas.height = motesH * dpr;
      motesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeMotes();
    window.addEventListener("resize", sizeMotes);
    for (var i = 0; i < moteCount; i++) {
      motes.push({
        x: Math.random(), y: Math.random(),
        r: 0.5 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.00006,
        vy: -(0.00004 + Math.random() * 0.00012),
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.9
      });
    }
    new IntersectionObserver(function (entries) {
      motesRunning = entries[0].isIntersecting;
    }, { threshold: 0 }).observe(document.querySelector(".hero"));
  }

  /* ——— Hero pointer parallax ——— */
  var heroInner = document.querySelector(".hero-inner");
  var heroGlow = document.querySelector(".hero-glow");
  var hero = document.querySelector(".hero");
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      par.tx = (e.clientX - r.left) / r.width - 0.5;
      par.ty = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("mouseleave", function () { par.tx = 0; par.ty = 0; });
  }

  /* ——— Header state, progress, parallax ——— */
  var head = document.querySelector(".site-head");
  var progress = document.getElementById("headProgress");
  var speedEls = document.querySelectorAll("[data-speed]");
  var dotEl = document.querySelector(".cursor-dot");
  var ringEl = document.querySelector(".cursor-ring");
  var dotPos = { x: -100, y: -100 }, ringPos = { x: -100, y: -100 };
  var t = 0;

  function frame(now) {
    t = now * 0.001;
    if (lenis) lenis.raf(now);

    /* scroll-driven bits */
    var y = window.scrollY;
    if (head) head.classList.toggle("is-scrolled", y > 40);
    if (progress) {
      var max = docEl.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
    for (var s = 0; s < speedEls.length; s++) {
      var el = speedEls[s];
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        var off = (r.top + r.height / 2 - window.innerHeight / 2) * parseFloat(el.dataset.speed);
        el.style.transform = "translateX(-50%) translateY(" + off + "px)";
      }
    }

    /* cursor */
    dotPos.x += (mouse.x - dotPos.x) * 0.4;
    dotPos.y += (mouse.y - dotPos.y) * 0.4;
    ringPos.x += (mouse.x - ringPos.x) * 0.16;
    ringPos.y += (mouse.y - ringPos.y) * 0.16;
    if (dotEl) dotEl.style.transform = "translate(" + (dotPos.x - 2.5) + "px," + (dotPos.y - 2.5) + "px)";
    if (ringEl) ringEl.style.transform = "translate(" + (ringPos.x - 17) + "px," + (ringPos.y - 17) + "px)";

    /* hero parallax */
    par.x += (par.tx - par.x) * 0.05;
    par.y += (par.ty - par.y) * 0.05;
    if (heroInner) heroInner.style.transform = "translate(" + par.x * 14 + "px," + par.y * 10 + "px)";
    if (heroGlow) heroGlow.style.transform = "translate(" + par.x * -34 + "px," + par.y * -22 + "px) scale(" + (1 + Math.abs(par.x) * 0.04) + ")";

    /* motes */
    if (motesCtx && motesRunning) {
      motesCtx.clearRect(0, 0, motesW, motesH);
      motesCtx.globalCompositeOperation = "lighter";
      for (var m = 0; m < motes.length; m++) {
        var p = motes[m];
        p.x += p.vx + Math.sin(t * p.sp + p.ph) * 0.00005;
        p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02) p.x = -0.02;
        var alpha = 0.10 + 0.16 * (0.5 + 0.5 * Math.sin(t * p.sp + p.ph));
        motesCtx.beginPath();
        motesCtx.arc(p.x * motesW, p.y * motesH, p.r, 0, Math.PI * 2);
        motesCtx.fillStyle = "rgba(232, 205, 160," + alpha.toFixed(3) + ")";
        motesCtx.fill();
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ——— Open now? Bar hours: daily 12:00 – 23:00 ——— */
  var dot = document.getElementById("statusDot");
  var text = document.getElementById("statusText");
  if (dot && text) {
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var open = mins >= 720 && mins < 1380;
    dot.classList.toggle("is-open", open);
    text.textContent = open ? "Open now · ’til 11pm" : "Opens at midday";
  }

  /* ——— Footer year ——— */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
