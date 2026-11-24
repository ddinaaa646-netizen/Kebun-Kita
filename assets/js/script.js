/**
 * Kebun Kita — TEFA Kebun Inovasi POLIJE
 * Vanilla JavaScript untuk navigasi responsif, smooth scroll,
 * scroll reveal, animasi statistik, dan recenter peta.
 */
(function () {
  "use strict";

  /**
   * Pure helper functions (digunakan oleh interaksi halaman dan mudah diuji).
   */
  function computeActiveSectionId(params) {
    var scrollY = params.scrollY;
    var headerHeight = params.headerHeight || 76;
    var viewportHeight = params.viewportHeight;
    var documentHeight = params.documentHeight;
    var sections = params.sections || [];

    if (!sections.length) {
      return "#beranda";
    }

    var scrollPosition = scrollY + headerHeight + 90;
    var activeId = "#" + sections[0].id;

    for (var i = 0; i < sections.length; i += 1) {
      if (sections[i].offsetTop <= scrollPosition) {
        activeId = "#" + sections[i].id;
      }
    }

    if (viewportHeight + scrollY >= documentHeight - 40) {
      activeId = "#" + sections[sections.length - 1].id;
    }

    return activeId;
  }

  function formatCounterValue(target, progress, suffix) {
    var clampedProgress = Math.max(0, Math.min(1, progress));
    var eased = 1 - Math.pow(1 - clampedProgress, 3);
    var currentValue = Math.round(eased * target);
    return String(currentValue) + (suffix || "");
  }

  function isValidMapEmbedUrl(url) {
    if (typeof url !== "string") {
      return false;
    }
    return url.indexOf("https://www.google.com/maps/embed?") === 0;
  }

  var helpers = {
    computeActiveSectionId: computeActiveSectionId,
    formatCounterValue: formatCounterValue,
    isValidMapEmbedUrl: isValidMapEmbedUrl,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = helpers;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  var prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * 1. Navbar Mobile Toggle & Transisi Saat Scroll
   */
  function initNavigation() {
    var header = document.getElementById("site-header");
    var toggleBtn = document.getElementById("nav-toggle");
    var nav = document.getElementById("primary-nav");
    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll("[data-nav-link]")
    );

    if (!header || !toggleBtn || !nav) {
      return;
    }

    var setMenuState = function (isOpen) {
      nav.classList.toggle("is-open", isOpen);
      toggleBtn.classList.toggle("is-open", isOpen);
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      toggleBtn.setAttribute(
        "aria-label",
        isOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
      );
    };

    toggleBtn.addEventListener("click", function () {
      var isCurrentlyOpen = nav.classList.contains("is-open");
      setMenuState(!isCurrentlyOpen);
    });

    // Tutup menu saat menekan tombol Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setMenuState(false);
        toggleBtn.focus();
      }
    });

    // Tutup menu saat klik di luar header pada mobile
    document.addEventListener("click", function (event) {
      if (
        nav.classList.contains("is-open") &&
        !header.contains(event.target)
      ) {
        setMenuState(false);
      }
    });

    var setActiveLink = function (hash) {
      navLinks.forEach(function (link) {
        var isMatch = link.getAttribute("href") === hash;
        link.classList.toggle("is-active", isMatch);
        if (isMatch) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    // Smooth scroll dan highlight link aktif saat diklik
    navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) !== "#") {
          return;
        }

        var target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();
        setMenuState(false);

        var headerOffset = header.offsetHeight || 76;
        var targetTop =
          target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });

        setActiveLink(href);

        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", href);
        }
      });
    });

    // Efek bayangan navbar & penentuan section aktif ketika scroll
    var sections = navLinks
      .map(function (link) {
        var href = link.getAttribute("href");
        return href ? document.querySelector(href) : null;
      })
      .filter(Boolean);

    var updateOnScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);

      var sectionMetrics = sections.map(function (section) {
        return {
          id: section.id,
          offsetTop: section.offsetTop,
        };
      });

      var activeId = computeActiveSectionId({
        scrollY: window.scrollY,
        headerHeight: header.offsetHeight || 76,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        sections: sectionMetrics,
      });

      setActiveLink(activeId);
    };

    window.addEventListener("scroll", updateOnScroll, { passive: true });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768 && nav.classList.contains("is-open")) {
        setMenuState(false);
      }
    });

    updateOnScroll();
  }

  /**
   * 2. Scroll Reveal Halus Menggunakan IntersectionObserver
   */
  function initScrollReveal() {
    var revealElements = Array.prototype.slice.call(
      document.querySelectorAll(".reveal")
    );

    if (!revealElements.length) {
      return;
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealElements.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    document.documentElement.classList.add("js-reveal-ready");

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          var target = entry.target;
          var delay = Number(target.getAttribute("data-reveal-delay") || 0);
          if (delay > 0) {
            target.style.transitionDelay = delay + "ms";
          }

          target.classList.add("is-visible");
          observer.unobserve(target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -36px 0px",
      }
    );

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /**
   * 3. Animasi Hitung Ringan untuk Statistik Saat Masuk Viewport
   */
  function initStatCounters() {
    var counters = Array.prototype.slice.call(
      document.querySelectorAll("[data-counter]")
    );

    if (
      !counters.length ||
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    var animateCounter = function (el) {
      var target = parseInt(el.getAttribute("data-counter"), 10);
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target) || target <= 0) {
        return;
      }

      var duration = 850;
      var startTime = null;

      var step = function (timestamp) {
        if (!startTime) {
          startTime = timestamp;
        }
        var progress = Math.min((timestamp - startTime) / duration, 1);
        el.textContent = formatCounterValue(target, progress, suffix);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target + suffix;
        }
      };

      window.requestAnimationFrame(step);
    };

    var statsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );

    counters.forEach(function (counterEl) {
      statsObserver.observe(counterEl);
    });
  }

  /**
   * 4. Tombol Recenter Peta Google Maps
   * Mengembalikan tampilan iframe peta ke titik koordinat awal Kebun Inovasi POLIJE.
   */
  function initMapRecenter() {
    var mapIframe = document.getElementById("kebun-map-iframe");
    var recenterBtn = document.getElementById("map-recenter-btn");
    var statusEl = document.getElementById("map-status");

    if (!mapIframe || !recenterBtn) {
      return;
    }

    var defaultMapUrl = mapIframe.getAttribute("src");
    var statusTimer = null;
    var spinTimer = null;

    recenterBtn.addEventListener("click", function () {
      if (!isValidMapEmbedUrl(defaultMapUrl)) {
        return;
      }

      recenterBtn.classList.add("is-recentering");
      recenterBtn.setAttribute("aria-busy", "true");

      // Muat ulang iframe secara bersih ke URL embed Kebun Inovasi POLIJE
      // agar posisi & zoom kembali terpusat walau pengguna sudah menggeser peta.
      mapIframe.src = "about:blank";
      window.requestAnimationFrame(function () {
        mapIframe.src = defaultMapUrl;
      });

      if (spinTimer) {
        window.clearTimeout(spinTimer);
      }
      spinTimer = window.setTimeout(function () {
        recenterBtn.classList.remove("is-recentering");
        recenterBtn.removeAttribute("aria-busy");
      }, 480);

      if (statusEl) {
        statusEl.textContent = "Peta dipusatkan kembali ke Kebun Inovasi POLIJE";
        statusEl.classList.add("is-visible");

        if (statusTimer) {
          window.clearTimeout(statusTimer);
        }
        statusTimer = window.setTimeout(function () {
          statusEl.classList.remove("is-visible");
        }, 2600);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavigation();
    initScrollReveal();
    initStatCounters();
    initMapRecenter();
  });
})();