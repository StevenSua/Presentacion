(function () {
  "use strict";

  const canvas = document.getElementById("particlesCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let animId = 0;
  let mouse = { x: -1000, y: -1000 };

  const COLORS = {
    gold: "rgba(197, 160, 89, 0.55)",
    goldDim: "rgba(197, 160, 89, 0.2)",
    teal: "rgba(74, 124, 122, 0.35)",
    cream: "rgba(247, 245, 241, 0.15)",
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(90, Math.floor((width * height) / 14000));
    if (particles.length !== count) {
      particles = Array.from({ length: count }, () => createParticle());
    }
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2 + 0.8,
      pulse: Math.random() * Math.PI * 2,
      type: Math.random() > 0.65 ? "gold" : "teal",
    };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        p.x -= (dx / dist) * 0.4;
        p.y -= (dy / dist) * 0.4;
      }

      const glow = 0.5 + Math.sin(p.pulse) * 0.25;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * glow, 0, Math.PI * 2);
      ctx.fillStyle = p.type === "gold" ? COLORS.gold : COLORS.teal;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle =
            dist < 70
              ? `rgba(197, 160, 89, ${0.12 * (1 - dist / 110)})`
              : COLORS.goldDim;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  resize();
  draw();

  window.ParticlesBackground = { resize };
})();
