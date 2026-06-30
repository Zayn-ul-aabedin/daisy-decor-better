/**
 * DAISY DECOR — script.js
 * Cinematic Room-to-Room Experience with Scroll-Jack Snapping
 * GSAP 3 + ScrollTrigger + Lenis
 */

/* ════════════════════════════════════════════════════════════
   0. REGISTER PLUGINS & CONFIG
   ════════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

// Prevent browser from restoring scroll position on reload
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

/* ════════════════════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   ════════════════════════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.1, // Quick scroll duration
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Clean ease-out
  smoothWheel: true,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.6,
  infinite: false,
});

// Sync Lenis → ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);

// Drive Lenis from requestAnimationFrame loop (independent of Lenis state locks)
function runLenisLoop(time) {
  lenis.raf(time);
  requestAnimationFrame(runLenisLoop);
}
requestAnimationFrame(runLenisLoop);

/* ════════════════════════════════════════════════════════════
   2. STATE VARIABLES
   ════════════════════════════════════════════════════════════ */
let currentRoomIndex = 0;
let isAnimatingScroll = false;
let queuedScrollDir = 0;
let roomLabelTimeout;
const rooms = document.querySelectorAll(".room");
let productsInitialized = false;

/* ════════════════════════════════════════════════════════════
   3. LOADER ANIMATION
   ════════════════════════════════════════════════════════════ */
function initLoader(onComplete) {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loader-bar");
  const pctEl = document.getElementById("loader-pct");
  const chars = document.querySelectorAll(".loader-char");
  const diamond = document.querySelector(".ornament-diamond");
  const lines = document.querySelectorAll(".ornament-line");
  const sub = document.querySelector(".loader-sub");
  const tagline = document.querySelector(".loader-tagline");

  const pctObj = { value: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      // Fade loader out
      gsap.to(loader, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          window.scrollTo(0, 0);
          lenis.scrollTo(0, { immediate: true });
          loader.remove();
          lenis.start();
          onComplete();
        },
      });
    },
  });

  // Ornament lines grow in
  tl.to(
    lines,
    { width: 80, duration: 0.8, ease: "power3.out", stagger: 0.05 },
    0.2,
  );
  tl.to(diamond, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.5);

  // Letters cascade in
  tl.to(
    chars,
    {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: "power3.out",
      stagger: 0.05,
    },
    0.5,
  );

  // Sub + tagline
  tl.to(sub, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 1.0);
  tl.to(tagline, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.2);

  // Progress bar + counter
  tl.to(pctEl, { opacity: 1, duration: 0.3 }, 0.8);
  tl.to(
    bar,
    {
      width: "100%",
      duration: 1.2,
      ease: "power1.inOut",
    },
    0.8,
  );
  tl.to(
    pctObj,
    {
      value: 100,
      duration: 1.2,
      ease: "power1.inOut",
      onUpdate() {
        pctEl.textContent = Math.round(pctObj.value) + "%";
      },
    },
    0.8,
  );

  // Brief hold before exit
  tl.to({}, { duration: 0.2 });
}

/* ════════════════════════════════════════════════════════════
   4. NAVBAR BEHAVIOR
   ════════════════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  // Hamburger toggle
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close on link click
    menu.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }
}

/* ════════════════════════════════════════════════════════════
   5. SMOOTH NAVIGATION (DOTS & LINKS INTERCEPTION)
   ════════════════════════════════════════════════════════════ */
function initSmoothNav() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      const roomIndex = Array.from(rooms).indexOf(target);
      if (roomIndex !== -1) {
        scrollToRoom(roomIndex);
      } else {
        lenis.scrollTo(target, { duration: 1.2 });
      }
    });
  });

  // Footer links
  document.querySelectorAll(".footer-nav a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      const roomIndex = Array.from(rooms).indexOf(target);
      if (roomIndex !== -1) {
        scrollToRoom(roomIndex);
      } else {
        lenis.scrollTo(target, { duration: 1.2 });
      }
    });
  });
}

function initRoomDots() {
  const dots = document.querySelectorAll(".room-dot");
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      scrollToRoom(i);
    });
  });
  dots[0]?.classList.add("is-active");
}

function updateActiveIndicators(index) {
  const dots = document.querySelectorAll(".room-dot");
  dots.forEach((d) => d.classList.remove("is-active", "show-label"));
  if (dots[index]) {
    dots[index].classList.add("is-active", "show-label");
    clearTimeout(roomLabelTimeout);
    roomLabelTimeout = setTimeout(() => {
      dots[index].classList.remove("show-label");
    }, 3000);
  }

  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.classList.remove("is-active");
    const href = link.getAttribute("href");
    if (href) {
      const target = document.querySelector(href);
      if (target) {
        const targetIndex = Array.from(rooms).indexOf(target);
        if (targetIndex === index) {
          link.classList.add("is-active");
        }
      }
    }
  });
}

/* ════════════════════════════════════════════════════════════
   6. SCROLL-JACK OBSERVER & TRANSITIONS
   ════════════════════════════════════════════════════════════ */
function scrollToRoom(index) {
  if (index < 0 || index >= rooms.length || isAnimatingScroll) return;

  isAnimatingScroll = true;

  // Reset contents of current room to prep for anim
  resetRoomContent(currentRoomIndex);

  currentRoomIndex = index;
  updateActiveIndicators(index);

  // Safety fallback: force-unlock scroll after a generous timeout (2500ms) in case animations hang
  let safetyTimeout = setTimeout(() => {
    isAnimatingScroll = false;
  }, 2500);

  lenis.scrollTo(rooms[index], {
    lock: true, // Prevents user scrolling/momentum from interrupting the transition
    duration: 1.0, // Quick snap duration
    ease: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Cinematic snap ease
    onComplete: () => {
      // Animate active room content in and get the timeline
      const tl = animateRoomIn(index);

      // Wait for the GSAP entrance animation to fully finish before unlocking the scroll state
      if (tl && tl.duration() > 0) {
        tl.eventCallback("onComplete", () => {
          clearTimeout(safetyTimeout);
          // Tiny cooldown (50ms) to safely eat any residual trackpad momentum after animations finish
          setTimeout(() => {
            isAnimatingScroll = false;
            if (queuedScrollDir !== 0) {
              let dir = queuedScrollDir;
              queuedScrollDir = 0;
              if (dir === -1 && currentRoomIndex > 0)
                scrollToRoom(currentRoomIndex - 1);
              else if (dir === 1 && currentRoomIndex < rooms.length - 1)
                scrollToRoom(currentRoomIndex + 1);
            }
          }, 50);
        });
      } else {
        clearTimeout(safetyTimeout);
        setTimeout(() => {
          isAnimatingScroll = false;
          if (queuedScrollDir !== 0) {
            let dir = queuedScrollDir;
            queuedScrollDir = 0;
            if (dir === -1 && currentRoomIndex > 0)
              scrollToRoom(currentRoomIndex - 1);
            else if (dir === 1 && currentRoomIndex < rooms.length - 1)
              scrollToRoom(currentRoomIndex + 1);
          }
        }, 50);
      }
    },
  });
}

function initProductsScrollIndicator() {
  const indicator = document.getElementById("products-scroll-indicator");
  const productsWrapper = document.querySelector(".products-list-wrapper");

  if (!indicator || !productsWrapper) return;

  // We need to wait for products to exist
  const lastProduct = productsWrapper.querySelector(
    ".product-showcase:last-child",
  );
  if (!lastProduct) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Hide indicator when last product is visible
          indicator.classList.add("is-hidden");
        } else {
          // Show indicator when last product is not visible
          indicator.classList.remove("is-hidden");
        }
      });
    },
    {
      root: productsWrapper,
      threshold: 0.1,
    },
  );

  observer.observe(lastProduct);
}

function initProductDetails() {
  const btnClose = document.getElementById("close-product-details");
  const detailsPanel = document.getElementById("product-details-panel");
  const productsPanel = document.getElementById("products-panel");
  const gridContainer = document.getElementById("pd-grid");
  const titleEl = document.getElementById("pd-title");
  const descEl = document.getElementById("pd-desc");
  const eyebrowEl = document.getElementById("pd-eyebrow");

  if (!btnClose || !detailsPanel || !productsPanel) return;

  const buttons = document.querySelectorAll(".btn-view-product");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-product-index");
      if (idx !== null && window.PRODUCT_DATA && window.PRODUCT_DATA[idx]) {
        const p = window.PRODUCT_DATA[idx];

        // Update content (default values, customized below for specific sections)
        titleEl.innerHTML = p.title;
        descEl.innerHTML = p.desc;
        eyebrowEl.innerHTML = "Exclusive " + p.title;

        // Update grid
        gridContainer.innerHTML = "";
        if (p.title === "Wallpaper") {
          // Detailed 9 image grid
          const wallpapers = [
            "wall1.jpg",
            "wall2.jpg",
            "wall3.jpg",
            "wall4.jpg",
            "wall5.jpg",
            "wall6.jpg",
            "wall7.jpg",
            "wall8.jpg",
            "wall9.jpg",
          ];
          wallpapers.forEach((img, i) => {
            const num = (18000 + i * 13).toString();
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <span class="wall-tag">${num}</span>
                  <img src="assets/product-section/wallpaper-sec-imgs/${img}" alt="Wallpaper ${num}" class="wall-img" loading="lazy">
                  <span class="wall-label">Panipuri</span>
                </div>
              </article>`;
          });
        } else if (p.title === "Customized Wallpaper") {
          eyebrowEl.innerHTML = "EXCLUSIVE WALL DECOR";
          titleEl.innerHTML = "Redefine Your Space With Customized Wallpapers";
          descEl.innerHTML = `At <span class="brand-text">Daisy Decor</span>, we create premium customized wallpapers that transform ordinary walls into stunning design statements.`;
          const imgs = [
            "assets/service-cards/s4.jpeg",
            "assets/service-cards/s5.jpeg",
            "assets/service-cards/s6.jpeg",
            "assets/product-section/custom-wall-sec-imgs/cust.jpeg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Customized Wallpaper ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Marble Sheet") {
          eyebrowEl.innerHTML = "PREMIUM SURFACE SOLUTIONS";
          titleEl.innerHTML = "Elegant Marble Sheets For Modern Interiors";
          descEl.innerHTML = `At <span class="brand-text">Daisy Decor</span>, we offer high-quality marble sheets designed to deliver luxury aesthetics with long lasting durability.`;
          const imgs = [
            "assets/service-cards/s7.jpg",
            "assets/service-cards/s8.jpg",
            "assets/product-section/marble-sheet-imgs/m14.jpg",
            "assets/product-section/marble-sheet-imgs/m15.png",
            "assets/product-section/marble-sheet-imgs/m16.jpg",
            "assets/product-section/marble-sheet-imgs/m17.jpg",
            "assets/product-section/marble-sheet-imgs/m18.jpg",
            "assets/product-section/marble-sheet-imgs/m19.jpg",
            "assets/product-section/marble-sheet-imgs/m20.jpg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Marble Sheet ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Foam Sheet") {
          eyebrowEl.innerHTML = "MODERN CEILING SOLUTIONS";
          titleEl.innerHTML = "Elegant Foam Sheet False Ceiling";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers premium foam sheets solutions crafted for stylish false ceiling and wall designs.`;
          const imgs = [
            "assets/service-cards/s10.jpg",
            "assets/service-cards/s28.jpg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Foam Sheet ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Flooring Sheet") {
          eyebrowEl.innerHTML = "PREMIUM FLOORING SOLUTIONS";
          titleEl.innerHTML = "Durable & Stylish WPC Flooring Sheets";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers high quality WPC (Wood Plastic Composite) flooring sheets designed to bring durability, elegance, and modern appeal to interiors. These panels are water-resistant, termite-proof, and ideal for homes, offices, showrooms, and commercial spaces.`;
          const imgs = [
            "assets/service-cards/s27.jpeg",
            "assets/product-section/floor-sheet-imgs/fs1.jpeg",
            "assets/product-section/floor-sheet-imgs/fs2.jpeg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Flooring Sheet ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Carpet") {
          eyebrowEl.innerHTML = "Luxury Floor Décor";
          titleEl.innerHTML = "Premium Carpets for Elegant Interiors";
          descEl.innerHTML = `Add warmth, comfort, and style to your interiors with <span class="brand-text">Daisy Decor</span>’s premium carpet collection. Our carpets are designed to enhance indoor spaces with rich textures, modern patterns, and long-lasting quality, perfect for homes, offices, hotels, and commercial spaces.`;
          const imgs = [
            "assets/product-section/carpet-imgs/car1.webp",
            "assets/product-section/carpet-imgs/car2.jpeg",
            "assets/service-cards/s25.jpeg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Carpet ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Grass") {
          eyebrowEl.innerHTML = "Green Décor Solutions";
          titleEl.innerHTML = "Premium Artificial Grass for All Spaces";
          descEl.innerHTML = `Bring nature-inspired beauty to your surroundings with <span class="brand-text">Daisy Decor</span>’s high-quality artificial grass. Designed for both indoor and outdoor use, our grass solutions offer a lush green look without watering, trimming, or maintenance. Perfect for homes, balconies, gardens, terraces, offices, and commercial spaces.`;
          const imgs = [
            "assets/service-cards/s22.png",
            "assets/service-cards/s23.jpg",
            "assets/images/grass3.jpeg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Grass ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "PU Stone") {
          eyebrowEl.innerHTML = "Luxury Stone Finish";
          titleEl.innerHTML = "Premium PU Stone for Modern Interiors";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> brings you high-quality PU Stone panels that combine the beauty of natural stone with lightweight durability.`;
          const imgs = [
            "assets/product-section/pu-imgs/npu3.jpg",
            "assets/product-section/pu-imgs/npu4.jpg",
            "assets/product-section/pu-imgs/npu5.jpg",
            "assets/product-section/pu-imgs/npu6.jpg",
            "assets/product-section/pu-imgs/npu7.jpg",
            "assets/product-section/pu-imgs/npu8.jpg",
            "assets/product-section/pu-imgs/npu9.jpg",
            "assets/service-cards/s20.jpg",
            "assets/service-cards/s21.jpg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="PU Stone ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "3D Wall Panel") {
          eyebrowEl.innerHTML = "Modern Wall Décor";
          titleEl.innerHTML = "Transform Your Space with 3D Wall Panels";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers premium 3D wall panels designed to add depth, texture, and elegance to your interiors.`;
          const imgs = [
            "assets/product-section/3d-imgs/3dn13.png",
            "assets/product-section/3d-imgs/3dn14.png",
            "assets/product-section/3d-imgs/3dn15.png",
            "assets/product-section/3d-imgs/3dn16.png",
            "assets/service-cards/s18.png",
            "assets/service-cards/s19.png",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="3D Wall Panel ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Mosaic Acrylic") {
          eyebrowEl.innerHTML = "Luxury Surface Décor";
          titleEl.innerHTML =
            "Enhance Your Interiors with Mosaic Acrylic Panels";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers premium mosaic acrylic panels that bring a refined and contemporary touch to your interiors.`;
          const imgs = [
            "assets/service-cards/s16.jpeg",
            "assets/service-cards/s17.jpg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Mosaic Acrylic ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Mosaic Glass") {
          eyebrowEl.innerHTML = "Elegant Glass Décor";
          titleEl.innerHTML = "Enhance Your Walls with Mosaic Glass Panels";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> presents premium mosaic glass panels designed to bring elegance, shine, and artistic beauty to your interiors.`;
          const imgs = [
            "assets/product-section/mosaic-glass/mo3.jpg",
            "assets/product-section/mosaic-glass/mo4.jpg",
            "assets/product-section/mosaic-glass/mo5.jpg",
            "assets/product-section/mosaic-glass/mo6.jpeg",
            "assets/product-section/mosaic-glass/mo7.jpg",
            "assets/product-section/mosaic-glass/mo8.jpg",
            "assets/product-section/mosaic-glass/mo9.webp",
            "assets/service-cards/s11.png",
            "assets/service-cards/s12.jpg",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Mosaic Glass ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "PVC/WPC") {
          eyebrowEl.innerHTML = "Modern Interior Panels";
          titleEl.innerHTML =
            "Strong, Stylish & Long-Lasting PVC / WPC Solutions";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers premium PVC and WPC sheets designed for modern and durable interiors.`;
          const imgs = [
            "assets/product-section/pvc-imgs/npvc1.png",
            "assets/product-section/pvc-imgs/npvc2.png",
            "assets/product-section/pvc-imgs/npvc3.png",
            "assets/product-section/pvc-imgs/npvc4.png",
            "assets/product-section/pvc-imgs/npvc5.png",
            "assets/product-section/pvc-imgs/npvc6.png",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="PVC/WPC ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Glass Film") {
          eyebrowEl.innerHTML = "Modern Glass Décor";
          titleEl.innerHTML =
            "Enhance Privacy & Style with Premium Glass Films";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> offers a wide range of premium glass films designed to enhance privacy while adding elegance to your interiors.`;
          const imgs = [
            "assets/product-section/product-bg/ps13.png",
            "assets/product-section/glass-film-imgs/g2.png",
            "assets/product-section/glass-film-imgs/g3.png",
            "assets/product-section/glass-film-imgs/g4.png",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Glass Film ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else if (p.title === "Moulding") {
          eyebrowEl.innerHTML = "Interior Enhancement";
          titleEl.innerHTML = "Transform Your Space with Stylish Moldings";
          descEl.innerHTML = `<span class="brand-text">Daisy Decor</span> provides premium quality decorative moldings that add depth, elegance, and character to walls, ceilings, and interiors.`;
          const imgs = [
            "assets/product-section/moulding-imgs/molding1.jpg",
            "assets/product-section/moulding-imgs/molding2.jpg",
            "assets/product-section/moulding-imgs/molding3.png",
            "assets/product-section/moulding-imgs/molding4.png",
            "assets/product-section/moulding-imgs/molding5.png",
            "assets/product-section/moulding-imgs/molding6.png",
          ];
          imgs.forEach((img, i) => {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${img}" alt="Moulding ${i + 1}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          });
        } else {
          // Generic single image or duplicated to look good
          for (let i = 0; i < 3; i++) {
            gridContainer.innerHTML += `
              <article class="wall-item">
                <div class="wall-img-wrap">
                  <img src="${window.PRODUCT_BASE_DIR}${p.img}" alt="${p.title}" class="wall-img" loading="lazy">
                </div>
              </article>`;
          }
        }
      }

      // Products panel pushes left slightly and fades
      gsap.to(productsPanel, {
        autoAlpha: 0,
        x: -30,
        scale: 0.98,
        duration: 0.6,
        ease: "power3.inOut",
      });

      // Details panel emerges exactly from the right boundary without viewport overflow
      gsap.fromTo(
        detailsPanel,
        { autoAlpha: 0, clipPath: "inset(0 0 0 100%)", x: 0 },
        {
          autoAlpha: 1,
          clipPath: "inset(0 0 0 0%)",
          duration: 0.7,
          ease: "power3.out",
        },
      );
    });
  });

  btnClose.addEventListener("click", () => {
    // Details panel wipes back to the right
    gsap.to(detailsPanel, {
      autoAlpha: 0,
      clipPath: "inset(0 0 0 100%)",
      duration: 0.5,
      ease: "power3.in",
    });
    // Products panel slides back in from the left
    gsap.to(productsPanel, {
      autoAlpha: 1,
      x: 0,
      scale: 1,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.1,
    });
  });
}

function initScrollJack() {
  // Scrollable panels that should receive native mouse-wheel scrolling
  const scrollableSelectors = [
    ".filter-list",
    ".services-scroll-container",
    ".products-list-wrapper",
    ".product-details-scroll",
    ".gallery-scroll-container",
    ".gallery-carousel",
  ];

  const isInsideScrollable = (target) => {
    return scrollableSelectors.some((sel) => target.closest(sel));
  };

  // Capture-phase listener: block default scroll everywhere EXCEPT inside scrollable panels and form fields
  const blockScroll = (e) => {
    // SCROLL LEAKAGE FIX: If a transition is active, completely kill the event before Lenis can see it!
    if (typeof isAnimatingScroll !== "undefined" && isAnimatingScroll) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    const target = e.target;
    if (!target || !target.tagName) return;
    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT" ||
      target.closest(".form-input") ||
      isInsideScrollable(target)
    ) {
      return;
    }
    e.preventDefault();
  };
  window.addEventListener("wheel", blockScroll, {
    passive: false,
    capture: true,
  });
  window.addEventListener("touchmove", blockScroll, {
    passive: false,
    capture: true,
  });

  // Global observer for full-page transitions outside scrollable areas
  ScrollTrigger.observe({
    type: "wheel,touch,pointer",
    wheelSpeed: 0.9,
    tolerance: 15,
    preventDefault: true,
    onUp: (self) => {
      // Extra guard: ignore if event target is inside a scrollable panel
      if (self.event && isInsideScrollable(self.event.target)) return;
      if (isAnimatingScroll) {
        queuedScrollDir = -1;
        return;
      }
      if (currentRoomIndex > 0) {
        scrollToRoom(currentRoomIndex - 1);
      }
    },
    onDown: (self) => {
      if (self.event && isInsideScrollable(self.event.target)) return;
      if (isAnimatingScroll) {
        queuedScrollDir = 1;
        return;
      }
      if (currentRoomIndex < rooms.length - 1) {
        scrollToRoom(currentRoomIndex + 1);
      }
    },
  });

  // Localized observers for scrollable panels to handle boundary intent safely
  scrollableSelectors.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      // Shield native scroll from Lenis by stopping propagation in the bubble phase
      el.addEventListener("wheel", (e) => e.stopPropagation(), {
        passive: false,
      });
      el.addEventListener("touchmove", (e) => e.stopPropagation(), {
        passive: false,
      });

      ScrollTrigger.observe({
        target: el,
        type: "wheel,touch", // Omit pointer to ignore scrollbar dragging
        wheelSpeed: 0.9,
        tolerance: 15,
        preventDefault: false, // Absolutely allow native scrolling
        onUp: () => {
          if (isAnimatingScroll) {
            queuedScrollDir = -1;
            return;
          }

          // Trigger on first overscroll if at the absolute top (5px threshold)
          if (el.scrollTop > 5) return;

          if (currentRoomIndex > 0) {
            scrollToRoom(currentRoomIndex - 1);
          }
        },
        onDown: () => {
          if (isAnimatingScroll) {
            queuedScrollDir = 1;
            return;
          }

          // Trigger on first overscroll if at the absolute bottom (5px threshold)
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (el.scrollTop < maxScroll - 5) return;

          if (currentRoomIndex < rooms.length - 1) {
            scrollToRoom(currentRoomIndex + 1);
          }
        },
      });
    }
  });
}

/* ════════════════════════════════════════════════════════════
   7. ROOM CONTENT ANIMATIONS (ENTRANCE & RESETS)
   ════════════════════════════════════════════════════════════ */
function animateRoomIn(index) {
  // Clear any existing timelines
  gsap.killTweensOf([
    "#hero-content > *",
    "#about-panel",
    "#about-panel .panel-desc",
    "#about-panel .about-contact-btn",
    ".catalog-heading",
    ".catalog-item",
    "#services-filter-panel",
    ".filter-btn",
    "#services-items-panel",
    ".service-card",
    "#products-panel",
    "#products-panel .product-showcase",
    ".whyus-header",
    ".whyus-cards .why-card",
    ".gallery-text > *:not(.gallery-thumbs)",
    ".gt-fig",
    ".contact-info",
    ".contact-form-wrap",
  ]);

  const tl = gsap.timeline();

  switch (index) {
    case 0: // Hero
      tl.fromTo(
        "#hero-content > *",
        { autoAlpha: 0, y: 35 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
        },
      );
      break;

    case 1: // Who We Are
      tl.fromTo(
        "#about-panel",
        { opacity: 0.95, y: 15 },
        { opacity: 1, y: 0, duration: 1.0, ease: "power2.out" },
      );
      tl.fromTo(
        "#about-panel .section-eyebrow, #about-panel .section-title, #about-panel .panel-desc, #about-panel .about-contact-btn",
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.08,
        },
        "-=0.8",
      );
      tl.fromTo(
        ".catalog-heading",
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out" },
        "-=0.8",
      );
      tl.fromTo(
        ".catalog-item .catalog-panel",
        { opacity: 0.95, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power2.out",
          stagger: 0.1,
        },
        "-=0.9",
      );
      tl.fromTo(
        ".catalog-item .cc-image-wrap, .catalog-item .cc-btn",
        { autoAlpha: 0, y: 10 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.08,
        },
        "-=0.9",
      );
      break;

    case 2: // Services
      // Reset scroll position and filter state whenever entering this page
      const scrollContainer = document.querySelector(
        ".services-scroll-container",
      );
      if (scrollContainer) scrollContainer.scrollTop = 0;
      const filterList = document.querySelector(".filter-list");
      if (filterList) filterList.scrollTop = 0;

      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("is-active"));
      const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
      if (allBtn) allBtn.classList.add("is-active");

      document.querySelectorAll(".service-card").forEach((c) => {
        c.style.display = "flex";
      });

      tl.fromTo(
        "#services-filter-panel",
        { autoAlpha: 0, x: -60 },
        { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
      );
      tl.fromTo(
        ".filter-btn",
        { autoAlpha: 0, x: -20 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.04,
        },
        "-=0.5",
      );
      tl.fromTo(
        "#services-items-panel",
        { autoAlpha: 0, x: 60 },
        { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
        "-=0.8",
      );
      tl.fromTo(
        ".service-card",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, ease: "power3.out", stagger: 0.05 },
        "-=0.5",
      );
      break;

    case 3: // Products
      if (!productsInitialized) {
        tl.fromTo(
          "#products-panel",
          { autoAlpha: 0, x: 50 },
          { autoAlpha: 1, x: 0, duration: 0.65, ease: "power3.out" },
        );
        tl.fromTo(
          "#products-panel .product-showcase",
          { autoAlpha: 0, y: 25 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.1,
          },
          "-=0.35",
        );
        productsInitialized = true;
      }
      break;

    case 4: // Why Us
      tl.fromTo(
        ".whyus-header",
        { autoAlpha: 0, y: 35 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" },
      );
      tl.fromTo(
        ".whyus-cards .why-card",
        { autoAlpha: 0, y: 35 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 },
        "-=0.45",
      );
      break;

    case 5: // Gallery
      tl.fromTo(
        ".gallery-text > *:not(.gallery-thumbs)",
        { autoAlpha: 0, y: 35 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
        },
      );
      tl.fromTo(
        ".gt-fig",
        { autoAlpha: 0, y: 25, scale: 0.95 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.08,
        },
        "-=0.4",
      );
      break;

    case 6: // Contact
      tl.fromTo(
        ".contact-info",
        { autoAlpha: 0, x: -60 },
        { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
      );
      tl.fromTo(
        ".contact-form-wrap",
        { autoAlpha: 0, x: 60 },
        { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" },
        "-=0.8",
      );
      break;
  }

  return tl;
}

function resetRoomContent(index) {
  switch (index) {
    case 0:
      gsap.set("#hero-content > *", { autoAlpha: 0, y: 35 });
      break;
    case 1: // Who We Are
      gsap.set("#about-panel", { opacity: 0.95, y: 15 });
      gsap.set(
        "#about-panel .section-eyebrow, #about-panel .section-title, #about-panel .panel-desc, #about-panel .about-contact-btn",
        { autoAlpha: 0, y: 10 },
      );
      gsap.set(".catalog-heading", { autoAlpha: 0, y: 10 });
      gsap.set(".catalog-item .catalog-panel", { opacity: 0.95, y: 15 });
      gsap.set(".catalog-item .cc-image-wrap, .catalog-item .cc-btn", {
        autoAlpha: 0,
        y: 10,
      });
      break;
    case 2: // Services
      gsap.set("#services-filter-panel", { autoAlpha: 0, x: -60 });
      gsap.set(".filter-btn", { autoAlpha: 0, x: -20 });
      gsap.set("#services-items-panel", { autoAlpha: 0, x: 60 });
      gsap.set(".service-card", { autoAlpha: 0 });
      break;
    case 3: // Products
      if (!productsInitialized) {
        gsap.set("#products-panel", { autoAlpha: 0, x: 60, scale: 1 });
        gsap.set("#products-panel .product-showcase", { autoAlpha: 0, y: 35 });
        gsap.set("#product-details-panel", {
          autoAlpha: 0,
          clipPath: "inset(0 0 0 100%)",
        });
      }
      break;
    case 4: // Why Us
      gsap.set(".whyus-header", { autoAlpha: 0, y: 35 });
      gsap.set(".whyus-cards .why-card", { autoAlpha: 0, y: 35 });
      break;
    case 5: // Gallery
      gsap.set(".gallery-text > *:not(.gallery-thumbs)", {
        autoAlpha: 0,
        y: 35,
      });
      gsap.set(".gt-fig", { autoAlpha: 0, y: 25, scale: 0.95 });
      break;
    case 6: // Contact
      gsap.set(".contact-info", { autoAlpha: 0, x: -60 });
      gsap.set(".contact-form-wrap", { autoAlpha: 0, x: 60 });
      break;
  }
}

/* ════════════════════════════════════════════════════════════
   8. STATS COUNTER ANIMATION
   ════════════════════════════════════════════════════════════ */
function animateStatsCount() {
  document.querySelectorAll("[data-target]").forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    const numEl = el.querySelector(".stat-num");
    if (!numEl || isNaN(target)) return;

    const counter = { val: 0 };
    gsap.to(counter, {
      val: target,
      duration: 1.5,
      ease: "power2.out",
      onUpdate() {
        numEl.textContent = Math.round(counter.val);
      },
    });
  });
}

/* ════════════════════════════════════════════════════════════
   9. GALLERY THUMB HOVER EFFECT
   ════════════════════════════════════════════════════════════ */
function initGalleryThumbs() {
  if (!window.matchMedia("(hover: hover)").matches) return;

  document.querySelectorAll(".gt-fig").forEach((fig) => {
    const img = fig.querySelector("img");
    if (!img) return;

    fig.addEventListener("mouseenter", () => {
      gsap.to(img, { scale: 1.12, duration: 0.55, ease: "power2.out" });
    });
    fig.addEventListener("mouseleave", () => {
      gsap.to(img, { scale: 1, duration: 0.55, ease: "power2.out" });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   10. CONTACT FORM (AJAX)
   ════════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const submitBtn = document.getElementById("form-submit");
  const successEl = document.getElementById("form-success");
  if (!form || !submitBtn || !successEl) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector(".btn-text");
    if (btnText) btnText.textContent = "Sending…";

    successEl.className = "form-success";
    successEl.textContent = "";

    const formData = new FormData(form);

    try {
      const res = await fetch("index.php", {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();

      if (data.success) {
        form.reset();
        successEl.textContent =
          data.message ||
          "Your enquiry has been received. We'll be in touch within 24 hours.";
        successEl.classList.add("show", "is-ok");
        gsap.from(successEl, {
          y: 10,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        });

        if (btnText) btnText.textContent = "Sent ✓";
      } else {
        const msg = Array.isArray(data.errors)
          ? data.errors.join(" ")
          : data.message || "Please check your details and try again.";
        successEl.textContent = msg;
        successEl.classList.add("show", "is-err");
        gsap.from(successEl, { y: 8, opacity: 0, duration: 0.4 });

        submitBtn.disabled = false;
        if (btnText) btnText.textContent = "Send Enquiry";
      }
    } catch (err) {
      console.error("Form error:", err);
      successEl.textContent =
        "Network error. Please try again or email us directly.";
      successEl.classList.add("show", "is-err");
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = "Send Enquiry";
    }
  });

  form.querySelectorAll("input, select, textarea").forEach((el) => {
    el.addEventListener("focus", () => {
      gsap.to(el, { borderColor: "rgba(201,168,76,0.52)", duration: 0.3 });
    });
    el.addEventListener("blur", () => {
      gsap.to(el, { borderColor: "rgba(201,168,76,0.16)", duration: 0.3 });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   10.5. SERVICES FILTER COLLECTION
   ════════════════════════════════════════════════════════════ */
function initServicesFilter() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".service-card");
  const scrollContainer = document.querySelector(".services-scroll-container");

  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filterValue = btn.getAttribute("data-filter");

      // Update active button state
      filterBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      // Smooth scroll container back to top on filter change
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Filter cards
      const toHide = [];
      const toShow = [];

      cards.forEach((card) => {
        const cat = card.getAttribute("data-category");
        if (filterValue === "all" || cat === filterValue) {
          toShow.push(card);
        } else {
          toHide.push(card);
        }
      });

      // Instantly hide excluded cards to prevent layout shifts
      if (toHide.length) {
        gsap.killTweensOf(toHide);
        toHide.forEach((c) => {
          c.style.display = "none";
          gsap.set(c, { autoAlpha: 0 }); // Ensure they stay hidden for next time
        });
      }

      // Immediately display included cards in the grid layout, then animate opacity
      if (toShow.length) {
        toShow.forEach((c) => {
          c.style.display = "flex";
        });

        gsap.killTweensOf(toShow);
        gsap.fromTo(
          toShow,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.05,
          },
        );
      }
    });
  });
}

/* ════════════════════════════════════════════════════════════
   11. NAVBAR LOGO MICRO-ANIMATION
   ════════════════════════════════════════════════════════════ */
function initNavLogoAnimation() {
  const logo = document.getElementById("nav-logo-link");
  const logoImg = logo?.querySelector(".nav-logo-img");
  if (!logo || !logoImg) return;

  logo.addEventListener("mouseenter", () => {
    gsap.to(logoImg, {
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out",
    });
  });
  logo.addEventListener("mouseleave", () => {
    gsap.to(logoImg, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    });
  });
}

/* ════════════════════════════════════════════════════════════
   12. QUICK CONTACT FAB WIDGET
   ════════════════════════════════════════════════════════════ */
function initContactFAB() {
  const container = document.getElementById("contact-fab-container");
  const toggle = document.getElementById("fab-toggle");
  if (!container || !toggle) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = container.classList.toggle("is-open");
    toggle.classList.toggle("is-active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      container.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/* ════════════════════════════════════════════════════════════
   13. INITIAL STATE SETUP
   ════════════════════════════════════════════════════════════ */
function setInitialStates() {
  // Reset contents of all rooms to hidden states
  for (let i = 0; i < rooms.length; i++) {
    resetRoomContent(i);
  }

  // Reveal body content
  gsap.set("body", { visibility: "visible" });
}

/* ════════════════════════════════════════════════════════════
   14. POST-LOADER INTRO SEQUENCE
   ════════════════════════════════════════════════════════════ */
function playIntroAnimation() {
  // Navbar slides in
  gsap.fromTo(
    ".navbar",
    { y: -30, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", delay: 0.1 },
  );

  // Room dots appear
  gsap.fromTo(
    ".room-nav",
    { x: 20, autoAlpha: 0 },
    { x: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", delay: 0.3 },
  );

  // Scroll cue slides in
  gsap.fromTo(
    ".hero-scroll-cue",
    { autoAlpha: 0, y: 20 },
    { autoAlpha: 1, y: 0, duration: 0.8, delay: 1.0 },
  );

  // Play the first room content animation
  animateRoomIn(0);
}

/* ════════════════════════════════════════════════════════════
   INIT SEQUENCE
   ════════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  lenis.stop(); // Halt scroll events initially
  setInitialStates(); // Pre-hide all section elements to prevent FOUC

  initLoader(() => {
    initNavbar();
    initSmoothNav();
    initRoomDots();
    initGalleryThumbs();
    initContactForm();
    initNavLogoAnimation();
    initContactFAB();
    initServicesFilter();
    initProductsScrollIndicator();
    initProductDetails();

    // Set up scroll-jacking
    initScrollJack();

    // Reveal hero room
    playIntroAnimation();

    initGalleryRedesign();
    ScrollTrigger.refresh();
  });
});

/* ════════════════════════════════════════════════════════════
   RESIZE HANDLER
   ════════════════════════════════════════════════════════════ */
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh(true);
  }, 200);
});

/* ════════════════════════════════════════════════════════════
   GALLERY REDESIGN LOGIC
   ════════════════════════════════════════════════════════════ */
function initGalleryRedesign() {
  // Lightbox Logic
  const triggers = document.querySelectorAll(".gallery-img-trigger");
  const lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox || triggers.length === 0) return;

  const lbImg = document.getElementById("lightbox-img");
  const lbCurrent = document.getElementById("lightbox-current");
  const lbClose = document.querySelector(".lightbox-close");
  const lbNext = document.querySelector(".lightbox-next");
  const lbPrev = document.querySelector(".lightbox-prev");
  const lbThumbnailsContainer = document.getElementById("lightbox-thumbnails");

  let currentIndex = 0;
  const imageSources = Array.from(triggers).map((img) => img.src);

  // Generate Thumbnails
  if (lbThumbnailsContainer) {
    lbThumbnailsContainer.innerHTML = "";
    imageSources.forEach((src, idx) => {
      const thumb = document.createElement("div");
      thumb.className = "thumb-item";
      thumb.dataset.index = idx;
      thumb.innerHTML = `<img src="${src}" alt="Thumbnail ${idx + 1}" loading="lazy">`;
      thumb.addEventListener("click", () => openLightbox(idx));
      lbThumbnailsContainer.appendChild(thumb);
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    lbImg.src = imageSources[currentIndex];
    lbCurrent.innerText = currentIndex + 1;

    // Update active thumbnail
    if (lbThumbnailsContainer) {
      const thumbs = lbThumbnailsContainer.querySelectorAll(".thumb-item");
      thumbs.forEach((t) => t.classList.remove("is-active"));
      if (thumbs[currentIndex]) {
        const activeThumb = thumbs[currentIndex];
        activeThumb.classList.add("is-active");
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }

    lightbox.classList.add("is-open");
    if (typeof lenis !== "undefined") lenis.stop();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    if (typeof lenis !== "undefined") lenis.start();
  }

  function nextImage() {
    currentIndex = (currentIndex + 1) % imageSources.length;
    openLightbox(currentIndex);
  }

  function prevImage() {
    currentIndex =
      (currentIndex - 1 + imageSources.length) % imageSources.length;
    openLightbox(currentIndex);
  }

  triggers.forEach((trigger, idx) => {
    trigger.addEventListener("click", () => {
      openLightbox(idx);
    });
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbNext) lbNext.addEventListener("click", nextImage);
  if (lbPrev) lbPrev.addEventListener("click", prevImage);

  // Close on background click
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-bg")) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  window.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
  });

  // Masonry Reveal Animation
  const masonryItems = document.querySelectorAll(".masonry-item");
  if (masonryItems.length > 0) {
    const scrollContainer = document.querySelector(".gallery-scroll-container");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = "translateZ(0) translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: scrollContainer,
        threshold: 0.05,
        rootMargin: "0px 0px 50px 0px",
      },
    );

    masonryItems.forEach((item, i) => {
      item.style.opacity = 0;
      item.style.transform = "translateZ(0) translateY(40px)";
      // Apply a staggered delay for the initial load based on index
      item.style.transition = `opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${Math.min(i * 0.05, 0.3)}s, transform 0.8s cubic-bezier(0.25, 1, 0.5, 1) ${Math.min(i * 0.05, 0.3)}s`;
      observer.observe(item);
    });
  }
}
