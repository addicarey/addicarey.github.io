// The lattice background.
// A lattice is every point you can reach by adding whole-number copies of
// two "basis" vectors. Here the basis is (spacing, 0) and (skew, rowHeight).
// The cursor lights up nearby points and draws a line to the closest one.

const canvas = document.getElementById("lattice");
const ctx = canvas.getContext("2d");

// ---- Settings you can safely change ----
const spacing = 56;    // distance between points along a row, in pixels
const rowHeight = 50;  // distance between rows
const skew = 21;       // how far each row is shifted sideways from the one above
const reach = 190;     // how far the cursor's glow extends

const restColour = "rgba(163, 169, 207, 0.16)"; // points the cursor isn't near
const defaultTint = "247, 193, 214";            // baby pink, as red, green, blue

// ---- State that changes while the page is open ----
let tint = defaultTint; // current highlight colour
let pointer = null;     // cursor position, or null when it's off the page
let width = 0;
let height = 0;
let drawQueued = false;

// Match the canvas to the window, at the screen's full sharpness
function resize() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

// Ask the browser to redraw before its next screen refresh, at most once
function queueDraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(draw);
}

function draw() {
  drawQueued = false;
  ctx.clearRect(0, 0, width, height);

  let closest = null;
  let closestDistance = Infinity;

  for (let row = -1; row * rowHeight < height + rowHeight; row++) {
    const y = row * rowHeight;
    // Each row starts a little further right, wrapping round within one spacing
    const shift = (((row * skew) % spacing) + spacing) % spacing;

    for (let x = shift - spacing; x < width + spacing; x += spacing) {
      let glow = 0; // 0 = far from the cursor, 1 = right under it

      if (pointer) {
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        glow = Math.max(0, 1 - distance / reach);

        if (distance < closestDistance) {
          closestDistance = distance;
          closest = { x: x, y: y };
        }
      }

      ctx.beginPath();
      ctx.arc(x, y, 1.2 + glow * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = glow > 0
        ? "rgba(" + tint + ", " + (0.18 + glow * 0.82) + ")"
        : restColour;
      ctx.fill();
    }
  }

  // The closest vector: a line from the cursor to its nearest lattice point
  if (closest) {
    ctx.strokeStyle = "rgba(" + tint + ", 0.9)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(pointer.x, pointer.y);
    ctx.lineTo(closest.x, closest.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(closest.x, closest.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- Follow the cursor ----
window.addEventListener("pointermove", function (event) {
  pointer = { x: event.clientX, y: event.clientY };
  queueDraw();
});

document.documentElement.addEventListener("pointerleave", function () {
  pointer = null;
  queueDraw();
});

window.addEventListener("resize", resize);

// ---- Take on a project's colour while its card is hovered or focused ----
document.querySelectorAll(".project").forEach(function (card) {
  const cardTint = getComputedStyle(card).getPropertyValue("--tint").trim();

  function useCardTint() {
    tint = cardTint;
    queueDraw();
  }

  function useDefaultTint() {
    tint = defaultTint;
    queueDraw();
  }

  card.addEventListener("pointerenter", useCardTint);
  card.addEventListener("pointerleave", useDefaultTint);
  card.addEventListener("focusin", useCardTint);
  card.addEventListener("focusout", useDefaultTint);
});

resize();
