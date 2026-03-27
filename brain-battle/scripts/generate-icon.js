/**
 * generate-icon.js
 *
 * Generates app icon assets using the Canvas API (node-canvas).
 * Run: node scripts/generate-icon.js
 *
 * Outputs:
 *   assets/icon.png            — 1024×1024 main icon
 *   assets/splash-icon.png     — 288×288 splash centre image
 *   assets/favicon.png         — 64×64 web favicon
 *   assets/android-icon-foreground.png   — 1024×1024 adaptive foreground
 *   assets/android-icon-background.png  — 1024×1024 adaptive background (solid)
 */

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, '..', 'assets')

function drawIcon(canvas) {
  const { width: W, height: H } = canvas
  const ctx = canvas.getContext('2d')
  const cx = W / 2
  const cy = H / 2

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0d0d1a')
  bg.addColorStop(1, '#1a0d2e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Outer glow ring
  const glow = ctx.createRadialGradient(cx, cy, W * 0.15, cx, cy, W * 0.45)
  glow.addColorStop(0, 'rgba(0,229,255,0.18)')
  glow.addColorStop(1, 'rgba(0,229,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Brain icon — simplified stylised outline using bezier paths
  const scale = W / 1024
  ctx.save()
  ctx.translate(cx, cy * 0.95)
  ctx.scale(scale, scale)

  // Left hemisphere
  ctx.beginPath()
  ctx.moveTo(-20, -180)
  ctx.bezierCurveTo(-20, -280, -200, -280, -230, -160)
  ctx.bezierCurveTo(-260, -40, -200, 60, -120, 100)
  ctx.bezierCurveTo(-80, 120, -30, 110, -20, 90)
  ctx.lineTo(-20, -180)

  // Right hemisphere
  ctx.moveTo(20, -180)
  ctx.bezierCurveTo(20, -280, 200, -280, 230, -160)
  ctx.bezierCurveTo(260, -40, 200, 60, 120, 100)
  ctx.bezierCurveTo(80, 120, 30, 110, 20, 90)
  ctx.lineTo(20, -180)

  ctx.strokeStyle = '#00e5ff'
  ctx.lineWidth = 22
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = '#00e5ff'
  ctx.shadowBlur = 40 * scale
  ctx.stroke()

  // Centre divider
  ctx.beginPath()
  ctx.moveTo(0, -170)
  ctx.lineTo(0, 85)
  ctx.strokeStyle = 'rgba(0,229,255,0.4)'
  ctx.lineWidth = 8
  ctx.shadowBlur = 0
  ctx.stroke()

  // Accent folds — left
  ctx.beginPath()
  ctx.moveTo(-60, -120)
  ctx.bezierCurveTo(-120, -100, -140, -40, -80, 0)
  ctx.strokeStyle = 'rgba(0,229,255,0.55)'
  ctx.lineWidth = 14
  ctx.stroke()

  // Accent folds — right
  ctx.beginPath()
  ctx.moveTo(60, -120)
  ctx.bezierCurveTo(120, -100, 140, -40, 80, 0)
  ctx.stroke()

  ctx.restore()

  // "BB" wordmark at bottom
  const fontSize = Math.round(W * 0.09)
  ctx.font = `900 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.85
  ctx.fillText('BRAIN BATTLE', cx, H * 0.88)
  ctx.globalAlpha = 1
}

function save(canvas, filename) {
  const buf = canvas.toBuffer('image/png')
  const dest = path.join(ASSETS, filename)
  fs.writeFileSync(dest, buf)
  console.log(`  ✓ ${filename}`)
}

function generate(size, filename) {
  const canvas = createCanvas(size, size)
  drawIcon(canvas)
  save(canvas, filename)
}

console.log('Generating icon assets…')

generate(1024, 'icon.png')
generate(288, 'splash-icon.png')
generate(64, 'favicon.png')

// Android adaptive foreground (same art, no background fill)
generate(1024, 'android-icon-foreground.png')

// Android adaptive background — solid dark
const bgCanvas = createCanvas(1024, 1024)
const bgCtx = bgCanvas.getContext('2d')
bgCtx.fillStyle = '#0d0d1a'
bgCtx.fillRect(0, 0, 1024, 1024)
save(bgCanvas, 'android-icon-background.png')

console.log('Done.')
