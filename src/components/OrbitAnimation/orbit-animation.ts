const TAU = Math.PI * 2;
const DURATION = 15000;
const CX = 250;
const CY = 250;
const R = 180;
const SET_SIZE = 9;
const STEP = TAU / 3;
const SPRING_MS = 1000;

const wrapper = document.querySelector(".orbit-wrapper")!;
const groups = Array.from(
  wrapper.querySelectorAll<SVGGElement>("[data-topic]"),
);
const circles = groups.map((g) => g.querySelector("circle")!);
const texts = groups.map((g) => g.querySelector("text")!);
const canvas = wrapper.querySelector(".orbit-canvas") as HTMLElement;
const container = wrapper.querySelector(".orbit-bullets") as HTMLElement;
const track = wrapper.querySelector(".orbit-bullets-track") as HTMLElement;
const items = Array.from(track.querySelectorAll("p"));

// Layout-dependent values, recomputed in measure()
let stopAngle = 0;
let oneSetHeight = 0;
let baseOffset = 0;
let containerCenter = 0;
let solidZone = 0; // px from center where opacity stays 1
let fadeZone = 0; // px beyond solidZone where opacity goes 1 → 0

function measure() {
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  // On mobile (vertical layout), circles stop at the bottom instead of the right
  stopAngle = isMobile ? Math.PI / 2 : 0;

  // Reset inline styles so CSS takes effect before re-measuring
  canvas.style.width = "";
  container.style.width = "";
  container.style.height = "";
  items.forEach((p) => (p.style.fontSize = ""));

  if (!isMobile) {
    const maxBulletWidth = Math.max(...items.map((p) => p.scrollWidth));
    const gap = parseFloat(getComputedStyle(wrapper).gap) || 32;
    const wrapperWidth = wrapper.clientWidth;
    const halfWidth = (wrapperWidth - gap) / 2;

    let canvasSize: number;
    if (maxBulletWidth <= halfWidth) {
      canvasSize = halfWidth;
      canvas.style.width = `${halfWidth}px`;
      container.style.width = `${halfWidth}px`;
    } else {
      canvasSize = Math.max(200, wrapperWidth - maxBulletWidth - gap);
      canvas.style.width = `${canvasSize}px`;
    }
    container.style.height = `${canvasSize}px`;
  } else {
    // Mobile: scale font-size down so the widest bullet fits in one line
    const containerWidth = container.clientWidth;
    let fontSize = parseFloat(getComputedStyle(items[0]).fontSize);
    const minFontSize = 12;
    while (fontSize > minFontSize) {
      const maxBulletWidth = Math.max(...items.map((p) => p.scrollWidth));
      if (maxBulletWidth <= containerWidth) break;
      fontSize -= 0.5;
      items.forEach((p) => (p.style.fontSize = `${fontSize}px`));
    }
  }

  // Measure one set height (distance between copy 0 and copy 1)
  oneSetHeight =
    items[SET_SIZE].getBoundingClientRect().top -
    items[0].getBoundingClientRect().top;

  // Compute offset to center copy 1's first group (items 9-11) in the container
  const groupTop = items[SET_SIZE].getBoundingClientRect().top;
  const groupBottom = items[SET_SIZE + 2].getBoundingClientRect().bottom;
  const trackTop = track.getBoundingClientRect().top;
  const groupCenterInTrack = (groupTop + groupBottom) / 2 - trackTop;
  const containerH = container.clientHeight;
  const isTablet = !isMobile && window.matchMedia("(max-width: 1100px)").matches;
  const nudge = isMobile ? 7 : isTablet ? 10 : 15;
  baseOffset = containerH / 2 - groupCenterInTrack - nudge;

  // Fade zones based on actual group height — immune to between-group gap changes
  const groupHeight =
    items[SET_SIZE + 2].getBoundingClientRect().bottom -
    items[SET_SIZE].getBoundingClientRect().top;
  const avgItemInGroup = groupHeight / 3;
  // solidZone: covers the 3 grouped items (center ± half group height)
  solidZone = groupHeight / 2;
  // fadeZone: distance beyond solidZone over which opacity drops to 0
  fadeZone = avgItemInGroup * 2;
}

let elapsed = 0;
let lastTs: number | null = null;
let isHovering = false;
let isPaused = false;
let currentAngle = 0;

// Spring state
let springActive = false;
let springFrom = 0;
let springTo = 0;
let springStartTime = 0;

// Damped spring easing: fast acceleration, overshoot, settle
function springEase(t: number): number {
  return 1 - Math.exp(-5 * t) * Math.cos(1.5 * Math.PI * t);
}

function render(angle: number) {
  currentAngle = angle;
  for (let i = 0; i < groups.length; i++) {
    const a = angle - i * STEP;
    const posAngle = a + stopAngle;
    groups[i].setAttribute(
      "transform",
      `translate(${CX + R * Math.cos(posAngle)},${CY + R * Math.sin(posAngle)})`,
    );

    // Proximity to stop position: 1 = at stop, 0 = far away
    const n = ((a % TAU) + TAU) % TAU;
    const d = Math.min(n, TAU - n);
    const t = Math.min(1, d / (STEP * 0.35));
    const proximity = (1 + Math.cos(t * Math.PI)) / 2;

    // Interpolate circle fill: dark (#2a2a2a) → light (#d9d9d9)
    const cf = Math.round(42 + 175 * proximity);
    circles[i].style.fill = `rgb(${cf},${cf},${cf})`;
    circles[i].style.stroke =
      `rgba(255,255,255,${((1 - proximity)).toFixed(3)})`;

    // Interpolate text fill: light (#d9d9d9) → dark (#222)
    const tf = Math.round(217 - 183 * proximity);
    texts[i].style.fill = `rgb(${tf},${tf},${tf})`;
  }

  // Scroll bullets in sync with orbit rotation
  const progress = (((angle / TAU) % 1) + 1) % 1;
  track.style.transform = `translateY(${baseOffset - progress * oneSetHeight}px)`;

  // Per-bullet opacity based on distance from container center
  const cRect = container.getBoundingClientRect();
  const center = cRect.top + cRect.height / 2;
  for (const p of items) {
    const rect = p.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const dist = Math.abs(itemCenter - center);
    const t = dist <= solidZone ? 1 : Math.max(0, 1 - (dist - solidZone) / fadeZone);
    const opacity = t * t;
    p.style.opacity = opacity.toFixed(3);
  }

  updateCursors();
}

// Spring animation: accelerate toward stop, then brake with bounce
function springFrame(ts: number) {
  const t = Math.min(1, (ts - springStartTime) / SPRING_MS);
  const angle = springFrom + (springTo - springFrom) * springEase(t);
  render(angle);

  if (t >= 1) {
    // Spring complete — snap exactly to stop angle
    elapsed = (springTo / TAU) * DURATION;
    render(springTo);
    springActive = false;

    if (isHovering) {
      isPaused = true;
    } else {
      // User already left, resume immediately
      lastTs = null;
      requestAnimationFrame(frame);
    }
    return;
  }

  requestAnimationFrame(springFrame);
}

function frame(ts: number) {
  if (isPaused || springActive) return;

  if (lastTs !== null) {
    elapsed += ts - lastTs;
  }
  lastTs = ts;

  const angle = (elapsed / DURATION) * TAU;
  render(angle);

  // On hover, trigger spring to the next stop point
  if (isHovering) {
    springFrom = angle;
    springTo = (Math.floor(angle / STEP) + 1) * STEP;
    springStartTime = ts;
    springActive = true;
    lastTs = null;
    requestAnimationFrame(springFrame);
    return;
  }

  requestAnimationFrame(frame);
}

function isAtStop(i: number): boolean {
  const diff = (((i * STEP - currentAngle) % TAU) + TAU) % TAU;
  return diff < 0.05 || TAU - diff < 0.05;
}

function springToCircle(i: number) {
  if (isAtStop(i)) return;

  const target = i * STEP;
  const diff = (((target - currentAngle) % TAU) + TAU) % TAU;

  springFrom = currentAngle;
  springTo = currentAngle + diff;
  springStartTime = performance.now();
  springActive = true;
  isHovering = true;
  isPaused = false;
  lastTs = null;
  requestAnimationFrame(springFrame);
}

function updateCursors() {
  groups.forEach((g, i) => {
    g.style.cursor = isAtStop(i) ? "default" : "pointer";
  });
}

groups.forEach((g, i) => {
  g.addEventListener("click", () => springToCircle(i));
});

wrapper.addEventListener("mouseenter", () => {
  isHovering = true;
});

wrapper.addEventListener("mouseleave", () => {
  isHovering = false;
  if (isPaused && !springActive) {
    isPaused = false;
    lastTs = null;
    requestAnimationFrame(frame);
  }
});

// Debounced resize handler
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measure();
    render(currentAngle);
  }, 150);
});

measure();
render(0);
requestAnimationFrame(frame);
