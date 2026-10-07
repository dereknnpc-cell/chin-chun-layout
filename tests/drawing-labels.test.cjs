const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const functions = source.slice(source.indexOf('  function refreshAnnotationVisibility()'), source.indexOf('  // --- Specialized Architectural Component SVG Renderer'));

function label(text, size, x = 12, y = 57, width = 900) {
  const attrs = {x: String(x), y: String(y), 'font-size': String(size)};
  return {
    textContent: text, tagName: 'text', dataset: {}, style: {},
    getAttribute: key => attrs[key] || null,
    setAttribute: (key, value) => { attrs[key] = value; },
    getComputedTextLength: () => width,
    getBoundingClientRect: () => ({left: 0, right: 20, top: 0, bottom: 6, width: 20, height: 6}),
    attrs
  };
}

function setup(texts, groups = [], scale = .2) {
  const svgEl = {
    getScreenCTM: () => ({a: scale, b: 0}),
    querySelectorAll: selector => {
      if (selector === 'text') return texts;
      if (selector.includes('svg-equipment-group')) return groups;
      if (selector === '#layerTitleBlock text') return texts.filter(t => !t.parentElement);
      return [];
    }
  };
  const context = {
    svgEl, viewportEl: {}, viewBox: {width: 2400}, SCALE: 24,
    getComputedStyle: () => ({fontSize: '24px'}),
    findItemRecord: () => ({item: {x: 2, y: 2, width: 4, height: 2, category: 'Cutting'}}),
    metersToSvg: (x, y) => ({x: x * 24, y: y * 24})
  };
  vm.createContext(context);
  vm.runInContext(functions, context);
  return context;
}

test('declared CAD font size wins over Safari minimum computed size', () => {
  const title = label('工程圖', 11);
  const ctx = setup([title]);
  ctx.scaleDrawingText();
  assert.equal(title.dataset.cadFontSize, 11);
  assert.equal(title.attrs.transform.trim(), 'translate(12 57) scale(0.11)');
  assert.equal(title.style.webkitTextSizeAdjust, 'none');
  assert.equal(title.style.textRendering, 'geometricPrecision');
});

test('long metadata is fitted to its own cell without accumulating transforms', () => {
  const title = label('Long title', 11, 12, 57, 2000);
  title.dataset.fitWidth = 126;
  const ctx = setup([title]);
  ctx.scaleDrawingText();
  assert.equal(title.attrs.transform.trim(), 'translate(12 57) scale(0.063)');
  ctx.applyDrawingTextScale(title, 20, 12, 57);
  assert.equal(title.attrs.transform.trim(), 'translate(12 57) scale(0.063)');
});

test('overview keeps small machine codes visible and hides optional detail', () => {
  const code = label('T Cut 1', 11, 96, 88, 450);
  const detail = label('裁切機', 9, 96, 104);
  const group = {
    dataset: {id: 'test'}, children: [code, detail],
    classList: {contains: () => false},
    querySelectorAll: () => [code, detail],
    querySelector: () => ({getBoundingClientRect: () => ({width: 19.2, height: 9.6})})
  };
  code.parentElement = detail.parentElement = group;
  const ctx = setup([code, detail], [group]);
  ctx.scaleDrawingText();
  ctx.refreshAnnotationVisibility();
  assert.equal(code.style.visibility, '');
  assert.equal(detail.style.visibility, 'hidden');
  assert.match(code.attrs.transform, /translate\(96 72\)/);
  const ratio = Number(code.attrs.transform.match(/scale\(([^)]+)\)/)[1]);
  assert.ok(ratio * 450 <= 88, 'code stays within the machine width');
  assert.ok(ratio * 100 <= 48 * .72, 'code stays within the machine height');
  const firstTransform = code.attrs.transform;
  ctx.refreshAnnotationVisibility();
  assert.equal(code.attrs.transform, firstTransform);
  group.classList.contains = name => name === 'selected';
  ctx.refreshAnnotationVisibility();
  assert.equal(code.style.visibility, '');
  assert.equal(detail.style.visibility, 'hidden', 'selection does not force overlapping detail into an overview');
});
