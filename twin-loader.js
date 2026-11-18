// Keep the 2D bridge current without downloading the optional 3D viewer.
(() => {
  'use strict';
  let bridge, layout, floor, button, opening;
  const assets = new Map();
  function load(url, css = false) {
    if (assets.has(url)) return assets.get(url);
    const promise = new Promise((resolve, reject) => {
      const node = document.createElement(css ? 'link' : 'script');
      if (css) { node.rel = 'stylesheet'; node.href = url; }
      else { node.src = url; node.async = true; }
      node.onload = () => resolve();
      node.onerror = () => { node.remove(); assets.delete(url); reject(new Error(`Cannot load ${url}`)); };
      document.head.append(node);
    });
    assets.set(url, promise);
    return promise;
  }
  function showError() {
    let status = document.getElementById('twinLoadError');
    if (!status) {
      status = document.createElement('span'); status.id = 'twinLoadError';
      status.setAttribute('role', 'alert'); button.after(status);
    }
    status.textContent = /^th/i.test(document.documentElement.lang)
      ? 'โหลด 2.5D ไม่สำเร็จ โปรดกดอีกครั้งเพื่อลองใหม่'
      : '2.5D 載入失敗，請再按一次重試。';
  }
  async function open() {
    if (opening) return opening;
    button.disabled = true; button.setAttribute('aria-busy', 'true');
    document.getElementById('twinLoadError')?.remove();
    opening = (async () => {
      try {
        await Promise.all([load('digital-twin.css', true), load('three-twin.js'), load('live-twin.js')]);
        await load('digital-twin.js');
        const twin = window.ChinChunTwin;
        twin.update(layout, floor); twin.connect(bridge);
        button.removeEventListener('click', open);
        twin.open();
      } catch (error) {
        console.warn('Could not open the digital twin.', error);
        showError();
      } finally {
        button.disabled = false; button.removeAttribute('aria-busy'); opening = null;
      }
    })();
    return opening;
  }
  window.ChinChunTwin = {
    connect(api) {
      bridge = api;
      if (!button) { button = document.getElementById('openDigitalTwin'); button?.addEventListener('click', open); }
    },
    update(data, activeFloor) { layout = data; floor = activeFloor; }
  };
})();
