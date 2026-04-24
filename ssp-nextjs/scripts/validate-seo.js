#!/usr/bin/env node
/**
 * SEO Validation Script — Sree Svadista Prasada
 *
 * Run against local dev server:
 *   npm run dev  (in one terminal)
 *   npm run validate-seo  (in another)
 *
 * Or against production:
 *   BASE_URL=https://sreesvadistaprasada.com node scripts/validate-seo.js
 */
const http = require('http')
const https = require('https')

const BASE = process.env.BASE_URL || 'http://localhost:3000'
const PAGES = ['/', '/menu', '/dabba-wala', '/catering', '/about', '/contact']
const CRAWLABLES = ['/sitemap.xml', '/robots.txt']

const KEYWORD_MAP = {
  '/': ['South Indian', 'Milton Keynes', 'Greenleys', 'takeaway', 'delivery'],
  '/menu': ['dosa', 'biryani', 'Milton Keynes', 'South Indian', 'idli'],
  '/dabba-wala': ['Dabba Wala', 'subscription', 'Milton Keynes', 'weekly', 'tiffin'],
  '/catering': ['catering', 'Milton Keynes', 'South Indian', 'wedding'],
  '/about': ['Andhra', 'Telugu', 'Milton Keynes', 'Greenleys'],
  '/contact': ['MK12', 'Greenleys', '07307', 'Milton Keynes'],
}

let passed = 0
let failed = 0
const failures = []

function log(label, ok, detail = '') {
  if (ok) {
    process.stdout.write(`  \x1b[32m✔\x1b[0m ${label}\n`)
    passed++
  } else {
    process.stdout.write(`  \x1b[31m✘\x1b[0m ${label}${detail ? ' — ' + detail : ''}\n`)
    failed++
    failures.push(label)
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, { headers: { 'User-Agent': 'SSP-SEO-Validator/1.0' } }, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

async function checkPage(path) {
  console.log(`\n\x1b[34m■ ${path || '/'}\x1b[0m`)
  let res
  try {
    res = await fetch(`${BASE}${path}`)
  } catch (e) {
    log(`Reachable`, false, e.message)
    return
  }

  log(`HTTP 200 (got ${res.status})`, res.status === 200)

  if (path === '/sitemap.xml') {
    log('Has <urlset> tag', res.body.includes('<urlset'))
    log('Includes homepage URL', res.body.includes('sreesvadistaprasada.com'))
    log('Includes /menu URL', res.body.includes('/menu'))
    log('Includes /dabba-wala URL', res.body.includes('/dabba-wala'))
    return
  }

  if (path === '/robots.txt') {
    log('Has User-agent directive', res.body.includes('User-agent'))
    log('Has Sitemap directive', res.body.includes('Sitemap:'))
    return
  }

  const b = res.body
  log('Not a JS-only empty shell', !b.includes('You need to enable JavaScript'))
  log('Has <title> tag', b.includes('<title>'))
  log('Has meta description', b.includes('name="description"'))
  log('Has canonical link', b.includes('rel="canonical"'))
  log('Has og:title', b.includes('og:title'))
  log('Has og:description', b.includes('og:description'))
  log('Has Twitter card meta', b.includes('twitter:card'))
  log('Exactly one <h1>', (b.match(/<h1[\s>]/gi) || []).length === 1)
  log('Has JSON-LD structured data', b.includes('application/ld+json'))
  log('Has phone number (NAP)', b.includes('07307') || b.includes('+447307'))
  log('Has MK12 postcode (NAP)', b.includes('MK12'))
  log('Has Oxman Ln address (NAP)', b.includes('Oxman') || b.includes('Greenleys'))
  log('Has nav link to /menu', b.includes('href="/menu"') || b.includes("href='/menu'"))
  log('No missing alt on images', !b.match(/<img(?![^>]*alt=)[^>]*>/i))

  const kws = KEYWORD_MAP[path] || []
  kws.forEach(kw => log(`Contains keyword "${kw}"`, b.toLowerCase().includes(kw.toLowerCase())))
}

async function run() {
  console.log('\x1b[1m')
  console.log('═══════════════════════════════════════════════')
  console.log('  SEO Validator — Sree Svadista Prasada')
  console.log(`  ${BASE}`)
  console.log('═══════════════════════════════════════════════')
  console.log('\x1b[0m')

  for (const p of [...PAGES, ...CRAWLABLES]) await checkPage(p)

  console.log('\n\x1b[1m═══════════════════════════════════════════════\x1b[0m')
  console.log(`\x1b[32m  Passed: ${passed}\x1b[0m  \x1b[31mFailed: ${failed}\x1b[0m`)

  if (failures.length) {
    console.log('\n\x1b[31m  Failed checks:\x1b[0m')
    failures.forEach(f => console.log(`   • ${f}`))
  } else {
    console.log('\n\x1b[32m  All checks passed — ready to deploy! ✓\x1b[0m')
  }

  console.log('\x1b[1m═══════════════════════════════════════════════\x1b[0m\n')
  process.exit(failed > 0 ? 1 : 0)
}

run()
