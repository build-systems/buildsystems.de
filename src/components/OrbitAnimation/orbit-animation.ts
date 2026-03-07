const TAU = Math.PI * 2;
const DURATION = 15000;
const CX = 250;
const CY = 250;
const R = 180;
const SET_SIZE = 9;
const STEP = TAU / 3;
const SPRING_MS = 1000;
// On mobile (vertical layout), circles stop at the bottom instead of the right
const STOP_ANGLE = window.matchMedia("(max-width: 640px)").matches
  ? Math.PI / 2
  : 0;

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

// Size orbit canvas and bullets: try equal width, shrink orbit if bullets need more
const isMobile = window.matchMedia("(max-width: 640px)").matches;
if (!isMobile) {
  const maxBulletWidth = Math.max(...items.map((p) => p.scrollWidth));
  const gap = parseFloat(getComputedStyle(wrapper).gap) || 32;
  const wrapperWidth = wrapper.clientWidth;
  const halfWidth = (wrapperWidth - gap) / 2;

  let canvasSize: number;
  if (maxBulletWidth <= halfWidth) {
    // Both fit at equal width
    canvasSize = halfWidth;
    canvas.style.width = `${halfWidth}px`;
    container.style.width = `${halfWidth}px`;
  } else {
    // Bullets need more — shrink orbit to accommodate
    canvasSize = Math.max(200, wrapperWidth - maxBulletWidth - gap);
    canvas.style.width = `${canvasSize}px`;
  }
  // Match bullet height to orbit canvas (square SVG)
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
const oneSetHeight =
  items[SET_SIZE].getBoundingClientRect().top -
  items[0].getBoundingClientRect().top;

// Compute offset to center copy 1's first group (items 9-11) in the container
const groupTop = items[SET_SIZE].getBoundingClientRect().top;
const groupBottom = items[SET_SIZE + 2].getBoundingClientRect().bottom;
const trackTop = track.getBoundingClientRect().top;
const groupCenterInTrack = (groupTop + groupBottom) / 2 - trackTop;
const containerH = container.clientHeight;
const baseOffset = containerH / 2 - groupCenterInTrack - (isMobile ? 7 : 15);

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
    const posAngle = a + STOP_ANGLE;
    groups[i].setAttribute(
      "transform",
      `translate(${CX + R * Math.cos(posAngle)},${CY + R * Math.sin(posAngle)})`,
    );

    // Proximity to stop position: 1 = at stop, 0 = far away
    const n = ((a % TAU) + TAU) % TAU;
    const d = Math.min(n, TAU - n);
    const t = Math.min(1, d / STEP);
    const proximity = (1 + Math.cos(t * Math.PI)) / 2;

    // Interpolate circle fill: dark (#2a2a2a) → light (#d9d9d9)
    const cf = Math.round(42 + 175 * proximity);
    circles[i].style.fill = `rgb(${cf},${cf},${cf})`;
    circles[i].style.stroke =
      `rgba(255,255,255,${((1 - proximity) * 0.3).toFixed(3)})`;

    // Interpolate text fill: light (#d9d9d9) → dark (#222)
    const tf = Math.round(217 - 183 * proximity);
    texts[i].style.fill = `rgb(${tf},${tf},${tf})`;
  }

  // Scroll bullets in sync with orbit rotation
  const progress = (((angle / TAU) % 1) + 1) % 1;
  track.style.transform = `translateY(${baseOffset - progress * oneSetHeight}px)`;

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

render(0);
requestAnimationFrame(frame);
