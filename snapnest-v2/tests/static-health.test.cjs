const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function htmlPages(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'tests' ? [] : htmlPages(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

function sitePath(page, raw) {
  if (/^(?:mailto:|tel:|data:|javascript:|#)/i.test(raw)) return null;
  const url = new URL(raw, 'https://snapnestsolutions.com/' + path.relative(root, page).replaceAll(path.sep, '/'));
  if (url.hostname !== 'snapnestsolutions.com') return null;
  const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
  return path.join(root, relative.endsWith('/') || !relative ? relative + 'index.html' : relative);
}

test('all public HTML has valid local links, assets and JSON-LD', () => {
  const pages = htmlPages();
  assert.ok(pages.length >= 20, 'Expected the public site and guide pages');
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    const label = path.relative(root, page);
    const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size, label + ': duplicate IDs');

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(match[0], /\balt\s*=/i, label + ': image missing alt attribute');
    }
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const target = sitePath(page, match[1]);
      if (target) assert.ok(fs.existsSync(target), label + ': missing local target ' + match[1]);
    }
    for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      assert.doesNotThrow(() => JSON.parse(match[1]), label + ': invalid JSON-LD');
    }
  }
});

test('public lead forms retain spam protection and the lifecycle fields', () => {
  const contact = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  const readiness = fs.readFileSync(path.join(root, 'business-readiness.html'), 'utf8');
  for (const [label, html] of [['contact', contact], ['readiness', readiness]]) {
    assert.match(html, /data-netlify-honeypot=["']bot-field["']/, label + ': missing honeypot');
    assert.match(html, /name=["']bot-field["']/, label + ': missing honeypot field');
  }
  assert.match(readiness, /name=["']selected_required_monthly_estimate["']/);
  assert.match(readiness, /name=["']snapnest_support_monthly_estimate["']/);
  assert.ok(readiness.indexOf('/readiness.js') < readiness.indexOf('/readiness-lifecycle.js'));
});

test('mobile navigation retains keyboard dismissal and expanded-state updates', () => {
  const source = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
  assert.match(source, /aria-expanded/);
  assert.match(source, /event\.key==='Escape'/);
  assert.match(source, /menu\.focus\(\)/);
});
