"use strict";

(function () {
  const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.querySelector("#site-nav");
  const navToggle = document.querySelector(".nav__toggle");
  const navLinksContainer = document.querySelector(".nav__links");
  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const sections = Array.from(document.querySelectorAll("section[id]"));

  // Toggle mobile nav
  if (navToggle && navLinksContainer) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinksContainer.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        navLinksContainer.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Smooth scrolling
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      if (prefersReducedMotion) {
        target.scrollIntoView();
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Active nav link highlighting via IntersectionObserver
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`.nav__link[href="#${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
          navLinks.forEach((l) => l.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "true");
        }
      });
    },
    { root: null, threshold: 0.6 }
  );

  sections.forEach((section) => observer.observe(section));

  // Sticky nav logic: transparent over hero, solid after scrolling past hero
  const hero = document.querySelector("#home");
  if (hero && header) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          header.classList.remove("scrolled");
        } else {
          header.classList.add("scrolled");
        }
      },
      { threshold: 0, rootMargin: "-60px 0px 0px 0px" }
    );
    heroObserver.observe(hero);
  }

  // Typewriter effect
  const typeTarget = document.getElementById("typewriter");
  const phrases = [
    "Engineer. Learner. Collaborator.",
    "Turning ideas into accessible experiences.",
    "Iterating with curiosity and craft.",
  ];

  function typewriter(element, words, { typingDelay = 70, erasingDelay = 40, holdDelay = 1200 } = {}) {
    if (!element || !Array.isArray(words) || words.length === 0) return;
    if (prefersReducedMotion) {
      element.textContent = words[0];
      return;
    }
    let wordIndex = 0;
    let charIndex = 0;
    let erasing = false;

    function step() {
      const current = words[wordIndex];
      if (!erasing) {
        element.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          erasing = true;
          setTimeout(step, holdDelay);
          return;
        }
        setTimeout(step, typingDelay);
      } else {
        element.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          erasing = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(step, typingDelay);
          return;
        }
        setTimeout(step, erasingDelay);
      }
    }

    step();
  }

  typewriter(typeTarget, phrases);

  // AOS initialization
  if (window.AOS && typeof window.AOS.init === "function") {
    window.AOS.init();
  }

  // Background orbs parallax (3D-like)
  const orbs = Array.from(document.querySelectorAll(".orb"));
  let mouseX = 0;
  let mouseY = 0;
  function updateOrbs() {
    const scrolled = window.scrollY || window.pageYOffset || 0;
    orbs.forEach((orb) => {
      const speed = parseFloat(orb.getAttribute("data-speed") || "0.08");
      const x = mouseX * 20 * speed;
      const y = scrolled * speed + mouseY * 20 * speed;
      orb.style.transform = `translate3d(${x}px, ${y}px, var(--z, -60px))`;
    });
  }
  window.addEventListener("scroll", updateOrbs, { passive: true });
  window.addEventListener("load", updateOrbs);
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
    updateOrbs();
  });

  // Animate skill bars when visible
  const skillbars = Array.from(document.querySelectorAll(".skillbar"));
  const skillObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const level = parseInt(el.getAttribute("data-level") || "0", 10);
        const bar = el.querySelector(".skillbar__bar");
        const valueEl = el.querySelector(".skillbar__value");
        if (bar) bar.style.width = `${level}%`;
        if (valueEl) {
          const duration = 900;
          const startTime = performance.now();
          function frame(now) {
            const p = Math.min(1, (now - startTime) / duration);
            const current = Math.round(level * p);
            valueEl.textContent = `${current}%`;
            if (p < 1) requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }
        skillObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  skillbars.forEach((el) => skillObserver.observe(el));

  // Testimonials slider
  const slider = document.querySelector(".slider");
  const slidesTrack = document.querySelector(".slides");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const prevBtn = document.querySelector(".slider__btn--prev");
  const nextBtn = document.querySelector(".slider__btn--next");
  const dotsContainer = document.querySelector(".slider__dots");
  let currentIndex = 0;
  let autoplayTimer = null;

  function updateSlider(index) {
    if (!slides.length) return;
    currentIndex = (index + slides.length) % slides.length;
    const offset = -currentIndex * 100;
    slidesTrack.style.transform = `translateX(${offset}%)`;

    // Update dots
    const dots = Array.from(dotsContainer.querySelectorAll("button.slider__dot"));
    dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === currentIndex)));
  }

  function createDots() {
    if (!slides.length || !dotsContainer) return;
    dotsContainer.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "slider__dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.setAttribute("role", "tab");
      dot.addEventListener("click", () => {
        stopAutoplay();
        updateSlider(i);
      });
      dotsContainer.appendChild(dot);
    });
  }

  function nextSlide() { updateSlider(currentIndex + 1); }
  function prevSlide() { updateSlider(currentIndex - 1); }

  function startAutoplay() {
    if (prefersReducedMotion) return;
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 5000);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  if (prevBtn) prevBtn.addEventListener("click", () => { stopAutoplay(); prevSlide(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { stopAutoplay(); nextSlide(); });
  if (slider) {
    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);
  }

  // Initialize
  createDots();
  updateSlider(0);
  startAutoplay();

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();