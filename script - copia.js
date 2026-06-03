(function () {
  "use strict";

  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  let current = 0;
  let isAnimating = false;

  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const currentEl = document.getElementById("currentSlide");
  const totalEl = document.getElementById("totalSlides");
  const progressFill = document.getElementById("progressFill");
  const progressBar = document.getElementById("progressBar");
  const tooltip = document.getElementById("tooltip");
  const tooltipTitle = document.getElementById("tooltipTitle");
  const tooltipText = document.getElementById("tooltipText");

  if (totalEl) totalEl.textContent = total;

  function updateUI() {
    currentEl.textContent = current + 1;
    progressFill.style.width = `${((current + 1) / total) * 100}%`;
    progressBar.setAttribute("aria-valuenow", current + 1);
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === total - 1;
    updateSlidesPickerHighlight();
  }

  function clearSlideClasses() {
    slides.forEach((s) => {
      s.classList.remove(
        "active",
        "leaving-forward",
        "leaving-back",
        "entering-forward",
        "entering-back"
      );
    });
  }

  function goTo(index, direction) {
    if (isAnimating || index === current || index < 0 || index >= total) return;

    isAnimating = true;
    const prev = current;
    const forward = direction === "forward" || (direction !== "back" && index > prev);

    const outgoing = slides[prev];
    const incoming = slides[index];

    clearSlideClasses();

    if (forward) {
      outgoing.classList.add("leaving-forward");
      incoming.classList.add("entering-forward");
    } else {
      outgoing.classList.add("leaving-back");
      incoming.classList.add("entering-back");
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        incoming.classList.add("active");
      });
    });

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 850;

    setTimeout(() => {
      clearSlideClasses();
      incoming.classList.add("active");
      current = index;
      updateUI();
      isAnimating = false;
    }, duration);
  }

  function next() {
    goTo(current + 1, "forward");
  }

  function prev() {
    goTo(current - 1, "back");
  }

  function jumpToSlide(index) {
    if (index < 0 || index >= total || index === current) return;
    clearSlideClasses();
    slides.forEach((s) => s.classList.remove("active"));
    slides[index].classList.add("active");
    current = index;
    isAnimating = false;
    updateUI();
  }

  btnNext.addEventListener("click", next);
  btnPrev.addEventListener("click", prev);

  document.addEventListener("keydown", (e) => {
    if (slidesPickerOpen && e.key === "Escape") {
      e.preventDefault();
      closeSlidesPicker();
      return;
    }
    if (slidesPickerOpen) return;

    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
      e.preventDefault();
      if (current < total - 1) next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      if (current > 0) prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0, "back");
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1, "forward");
    }
  });

  /* Selector de diapositivas */
  const btnSlidesPicker = document.getElementById("btnSlidesPicker");
  const slidesPicker = document.getElementById("slidesPicker");
  const slidesPickerBackdrop = document.getElementById("slidesPickerBackdrop");
  const slidesPickerClose = document.getElementById("slidesPickerClose");
  const slidesPickerList = document.getElementById("slidesPickerList");
  let slidesPickerOpen = false;

  function buildSlidesPickerList() {
    slidesPickerList.innerHTML = "";
    slides.forEach((slide, index) => {
      const title =
        slide.getAttribute("data-nav-title") ||
        slide.querySelector(".slide-title, .title-main, .closing-title")?.textContent?.trim() ||
        `Diapositiva ${index + 1}`;

      const li = document.createElement("li");
      li.className = "slides-picker__item";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slides-picker__btn";
      btn.dataset.index = String(index);
      btn.innerHTML = `<span class="slides-picker__num">${index + 1}</span><span class="slides-picker__label">${title}</span>`;
      btn.addEventListener("click", () => {
        jumpToSlide(index);
        closeSlidesPicker();
      });
      li.appendChild(btn);
      slidesPickerList.appendChild(li);
    });
    updateSlidesPickerHighlight();
  }

  function updateSlidesPickerHighlight() {
    slidesPickerList?.querySelectorAll(".slides-picker__btn").forEach((btn, i) => {
      btn.classList.toggle("is-current", i === current);
    });
  }

  function openSlidesPicker() {
    slidesPickerOpen = true;
    slidesPicker.hidden = false;
    requestAnimationFrame(() => {
      slidesPicker.classList.add("is-open");
    });
    btnSlidesPicker.setAttribute("aria-expanded", "true");
    updateSlidesPickerHighlight();
    const currentBtn = slidesPickerList.querySelector(".slides-picker__btn.is-current");
    currentBtn?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeSlidesPicker() {
    slidesPickerOpen = false;
    slidesPicker.classList.remove("is-open");
    btnSlidesPicker.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!slidesPickerOpen) slidesPicker.hidden = true;
    }, 280);
  }

  btnSlidesPicker?.addEventListener("click", () => {
    if (slidesPickerOpen) closeSlidesPicker();
    else openSlidesPicker();
  });

  slidesPickerBackdrop?.addEventListener("click", closeSlidesPicker);
  slidesPickerClose?.addEventListener("click", closeSlidesPicker);

  buildSlidesPickerList();

  let touchStartX = 0;
  const book = document.getElementById("book");

  book.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );

  book.addEventListener(
    "touchend",
    (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) next();
        else prev();
      }
    },
    { passive: true }
  );

  /* Tooltips: siempre hacia abajo */
  let activeTip = null;
  let hideTimeout = null;

  function positionTooltip(el) {
    const rect = el.getBoundingClientRect();
    const margin = 10;
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    tooltip.style.visibility = "hidden";
    tooltip.classList.add("visible");
    const tipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;

    left = Math.max(margin, Math.min(left, vw - tipRect.width - margin));

    if (top + tipRect.height > vh - margin) {
      top = Math.max(margin, vh - tipRect.height - margin);
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.dataset.placement = "bottom";
    tooltip.style.visibility = "visible";

    const arrowLeft = rect.left + rect.width / 2 - left;
    tooltip.style.setProperty("--arrow-left", `${Math.max(16, Math.min(arrowLeft, tipRect.width - 16))}px`);
  }

  function showTooltip(el) {
    const detail = el.getAttribute("data-detail");
    if (!detail) return;

    clearTimeout(hideTimeout);
    activeTip = el;

    const title = el.getAttribute("data-tip-title");
    if (title) {
      tooltipTitle.textContent = title;
      tooltipTitle.hidden = false;
    } else {
      tooltipTitle.hidden = true;
    }

    tooltipText.textContent = detail;
    tooltip.hidden = false;

    requestAnimationFrame(() => {
      tooltip.classList.add("visible");
      positionTooltip(el);
    });
  }

  function hideTooltip() {
    hideTimeout = setTimeout(() => {
      tooltip.classList.remove("visible");
      setTimeout(() => {
        if (!tooltip.classList.contains("visible")) {
          tooltip.hidden = true;
        }
      }, 200);
      activeTip = null;
    }, 100);
  }

  function bindTips() {
    document.querySelectorAll(".tip").forEach((el) => {
      if (el.dataset.tipBound) return;
      el.dataset.tipBound = "1";
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute("aria-describedby", "tooltip");

      el.addEventListener("mouseenter", () => showTooltip(el));
      el.addEventListener("mouseleave", hideTooltip);
      el.addEventListener("focus", () => showTooltip(el));
      el.addEventListener("blur", hideTooltip);
    });
  }

  bindTips();

  window.addEventListener(
    "scroll",
    () => {
      if (activeTip && tooltip.classList.contains("visible")) {
        positionTooltip(activeTip);
      }
    },
    true
  );

  window.addEventListener("resize", () => {
    if (activeTip && tooltip.classList.contains("visible")) {
      positionTooltip(activeTip);
    }
  });

  updateUI();
})();
