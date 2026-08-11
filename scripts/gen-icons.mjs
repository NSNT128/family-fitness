import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public', { recursive: true })

const BRAND = '#1b6ef5'

// The dumbbell mark, drawn in a 32-unit viewBox (matches favicon.svg).
const dumbbell = (scale = 1, translate = 0) => `
  <g transform="translate(${translate},${translate}) scale(${scale})"
     stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none">
    <path d="M9 16h14"/>
    <path d="M7 11.5v9M11 13v6M25 11.5v9M21 13v6"/>
  </g>`

// Full-bleed square (for maskable + apple — the platform applies its own shape).
const fullBleed = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="${BRAND}"/>
    ${dumbbell(0.62, 6.1)}
  </svg>`

// Rounded square (for the standard "any" icon).
const rounded = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="7" fill="${BRAND}"/>
    ${dumbbell(1, 0)}
  </svg>`

const render = (svg, size, file, flatten = false) => {
  let img = sharp(Buffer.from(svg)).resize(size, size)
  if (flatten) img = img.flatten({ background: BRAND })
  return img.png().toFile(`public/${file}`)
}

await Promise.all([
  render(rounded, 192, 'pwa-192.png'),
  render(rounded, 512, 'pwa-512.png'),
  render(fullBleed, 512, 'pwa-maskable-512.png'),
  render(fullBleed, 180, 'apple-touch-icon.png', true),
])

console.log('Generated: pwa-192, pwa-512, pwa-maskable-512, apple-touch-icon')
