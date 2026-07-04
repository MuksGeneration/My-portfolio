// ============================================================
// Mukula David — Portfolio interactions
// 1. Three.js animated circuit-node hero background
// 2. 3D tilt effect on cards
// 3. Nav, scroll-spy, mobile menu, fade-in reveals (from original)
// ============================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- Theme toggle (light default, dark optional) ---------------- */
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* ---------------- Mobile nav toggle ---------------- */
const navToggle = document.getElementById('navToggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------------- Smooth scrolling ---------------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId.length < 2) return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  });
});

/* ---------------- Intersection Observer fade-ins ---------------- */
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ---------------- Active nav highlighting ---------------- */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').includes(current) && current !== '') {
      link.classList.add('active');
    }
  });
});

/* ---------------- 3D tilt effect for cards ---------------- */
if (!prefersReducedMotion) {
  const tiltCards = document.querySelectorAll('.tilt-card');
  const MAX_TILT = 6; // degrees

  tiltCards.forEach(card => {
    card.style.transformStyle = 'preserve-3d';

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * MAX_TILT * 2;
      const rotateY = (x - 0.5) * MAX_TILT * 2;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
    });
  });
}

/* ---------------- Header background on scroll ---------------- */
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.35)';
    } else {
      header.style.boxShadow = 'none';
    }
  });
}

/* ============================================================
   3D animated circuit hero (Three.js)
   A network of glowing "component nodes" connected by traces,
   with pulses of light travelling along the traces — current flow.
   ============================================================ */
(function initCircuitHero() {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const heroSection = document.getElementById('hero');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  const PALETTES = {
    light: { amber: 0xD97706, indigo: 0x4F46E5, line: 0xC7CCE0, fog: 0xF3F4FD, fogDensity: 0.024 },
    dark: { amber: 0xF59E0B, indigo: 0x818CF8, line: 0x3A5070, fog: 0x0A0E17, fogDensity: 0.028 }
  };

  function currentThemeName() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  // --- Generate a grid of nodes with slight randomness (circuit board layout) ---
  const GRID_X = 9;
  const GRID_Y = 6;
  const SPACING = 3.1;
  const nodes = [];

  for (let ix = 0; ix < GRID_X; ix++) {
    for (let iy = 0; iy < GRID_Y; iy++) {
      // skip some nodes randomly for an organic circuit feel
      if (Math.random() < 0.28) continue;
      const x = (ix - (GRID_X - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.6;
      const y = (iy - (GRID_Y - 1) / 2) * SPACING + (Math.random() - 0.5) * 0.6;
      const z = (Math.random() - 0.5) * 2.5;
      nodes.push(new THREE.Vector3(x, y, z));
    }
  }

  // --- Connect nearby nodes with trace lines (limited neighbors) ---
  const edges = [];
  const MAX_DIST = SPACING * 1.6;
  for (let i = 0; i < nodes.length; i++) {
    let connections = 0;
    for (let j = i + 1; j < nodes.length; j++) {
      if (connections >= 3) break;
      const d = nodes[i].distanceTo(nodes[j]);
      if (d < MAX_DIST && Math.random() < 0.55) {
        edges.push([i, j]);
        connections++;
      }
    }
  }

  // --- Trace lines geometry ---
  const lineGroup = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({ color: PALETTES[currentThemeName()].line, transparent: true, opacity: 0.35 });
  edges.forEach(([a, b]) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([nodes[a], nodes[b]]);
    lineGroup.add(new THREE.Line(geometry, lineMaterial));
  });
  scene.add(lineGroup);

  // --- Node points (glowing circles via sprite-like small spheres) ---
  const nodeGroup = new THREE.Group();
  nodes.forEach((pos, i) => {
    const isAmber = i % 2 === 0;
    const geometry = new THREE.SphereGeometry(0.075, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: isAmber ? PALETTES[currentThemeName()].amber : PALETTES[currentThemeName()].indigo, transparent: true, opacity: 0.85 });
    material.userData.isAmber = isAmber;
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(pos);
    nodeGroup.add(sphere);
  });
  scene.add(nodeGroup);

  // --- Traveling pulses along random edges (current flow) ---
  const PULSE_COUNT = 14;
  const pulses = [];
  const pulseGeometry = new THREE.SphereGeometry(0.06, 8, 8);

  for (let i = 0; i < PULSE_COUNT; i++) {
    if (edges.length === 0) break;
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const isAmber = Math.random() < 0.5;
    const material = new THREE.MeshBasicMaterial({ color: isAmber ? PALETTES[currentThemeName()].amber : PALETTES[currentThemeName()].indigo });
    material.userData.isAmber = isAmber;
    const mesh = new THREE.Mesh(pulseGeometry, material);
    scene.add(mesh);
    pulses.push({
      mesh,
      from: nodes[edge[0]],
      to: nodes[edge[1]],
      t: Math.random(),
      speed: 0.15 + Math.random() * 0.25
    });
  }

  // --- Ambient light not needed (unlit materials), add soft fog for depth ---
  scene.fog = new THREE.FogExp2(PALETTES[currentThemeName()].fog, PALETTES[currentThemeName()].fogDensity);

  function applyPalette(themeName) {
    const p = PALETTES[themeName] || PALETTES.light;
    lineMaterial.color.setHex(p.line);
    nodeGroup.children.forEach(sphere => {
      sphere.material.color.setHex(sphere.material.userData.isAmber ? p.amber : p.indigo);
    });
    pulses.forEach(pulse => {
      pulse.mesh.material.color.setHex(pulse.mesh.material.userData.isAmber ? p.amber : p.indigo);
    });
    if (scene.fog) {
      scene.fog.color.setHex(p.fog);
      scene.fog.density = p.fogDensity;
    }
  }

  window.addEventListener('themechange', (e) => applyPalette(e.detail.theme));

  let targetRotX = 0, targetRotY = 0;
  let mouseX = 0, mouseY = 0;

  function onPointerMove(e) {
    const rect = heroSection.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }
  window.addEventListener('mousemove', onPointerMove);

  function resize() {
    const width = heroSection.clientWidth;
    const height = heroSection.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  let rafId;

  function animate() {
    rafId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // gentle auto-rotation + mouse parallax
    targetRotY += ((mouseX * 0.25) - targetRotY) * 0.03;
    targetRotX += ((-mouseY * 0.15) - targetRotX) * 0.03;

    nodeGroup.rotation.y = elapsed * 0.03 + targetRotY;
    nodeGroup.rotation.x = targetRotX;
    lineGroup.rotation.y = nodeGroup.rotation.y;
    lineGroup.rotation.x = nodeGroup.rotation.x;

    // pulse node glow
    nodeGroup.children.forEach((sphere, i) => {
      const s = 1 + Math.sin(elapsed * 2 + i) * 0.15;
      sphere.scale.setScalar(s);
    });

    // animate traveling pulses along their edges
    pulses.forEach(p => {
      p.t += delta * p.speed;
      if (p.t > 1) {
        // pick a new random edge once pulse reaches its destination
        if (edges.length > 0) {
          const edge = edges[Math.floor(Math.random() * edges.length)];
          p.from = nodes[edge[0]];
          p.to = nodes[edge[1]];
        }
        p.t = 0;
      }
      p.mesh.position.lerpVectors(p.from, p.to, p.t);
      p.mesh.position.applyEuler(new THREE.Euler(nodeGroup.rotation.x, nodeGroup.rotation.y, 0));
    });

    renderer.render(scene, camera);
  }

  if (!prefersReducedMotion) {
    animate();
  } else {
    // static single frame for reduced-motion users
    renderer.render(scene, camera);
  }

  // pause render loop when hero is off-screen to save battery/CPU
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!prefersReducedMotion) {
        if (entry.isIntersecting && !rafId) {
          animate();
        } else if (!entry.isIntersecting && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    });
  }, { threshold: 0 });
  heroObserver.observe(heroSection);
})();
