/* Live data layer for the twin: IoT/MES equipment state and RTLS positions.
   Read-only overlay keyed by CAD ids; never writes layoutData or cloud data.
   Providers emit normalized events (see LIVE-DATA.md) through ingest(). */
(() => {
  'use strict';
  const STATUS = ['run','idle','setup','down','offline'];
  const KINDS = ['person','forklift','cart','asset'];
  const NON_MACHINE = /^(Furniture|Door|Window|Storage|Elevator|Stairs|Infrastructure|Office|Sanitary)$/;
  const options = { staleMs: 30000, trail: 24 };
  const equipment = new Map(), tags = new Map(), rawTrails = new Map(), listeners = new Set();
  let bindings = new Map(), provider = null, mode = 'off', getLayout = () => null;
  let sourceEpoch = 0, expiryTimer = null;
  let matrix = { a:1, b:0, c:0, d:1, tx:0, ty:0 };
  const num = v => v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
  const time = v => { const t = typeof v === 'string' ? Date.parse(v) : num(v); return Number.isFinite(t) ? t : Date.now(); };
  let queued = false;
  const notify = () => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; listeners.forEach(fn => fn()); }); };

  // Expiry is a view event too: a silent gateway must not leave a green status
  // or a stale RTLS marker painted until the next message/camera interaction.
  function scheduleExpiry() {
    clearTimeout(expiryTimer); expiryTimer = null;
    const now = Date.now(); let next = Infinity;
    for (const states of [equipment, tags]) for (const state of states.values()) {
      const deadline = state.ts + options.staleMs + 1;
      if (deadline > now) next = Math.min(next, deadline);
    }
    if (Number.isFinite(next)) {
      expiryTimer = setTimeout(() => { expiryTimer = null; notify(); scheduleExpiry(); }, Math.min(2147483647, next - now));
      expiryTimer?.unref?.();
    }
  }

  // RTLS anchor frame -> CAD metres (x right, y toward the drawing's bottom).
  const toCad = (x, y) => [matrix.a*x + matrix.b*y + matrix.tx, matrix.c*x + matrix.d*y + matrix.ty];
  function reproject() {
    for (const [tag, points] of rawTrails) {
      const state = tags.get(tag); if (!state) continue;
      state.trail = points.map(p => p.frame === 'cad' ? [p.x, p.y] : toCad(p.x, p.y));
      [state.x, state.y] = state.trail.at(-1);
    }
  }
  function solve3(m, r) {
    const det = (a,b,c) => a[0]*(b[1]*c[2]-b[2]*c[1]) - a[1]*(b[0]*c[2]-b[2]*c[0]) + a[2]*(b[0]*c[1]-b[1]*c[0]);
    const cols = [0,1,2].map(i => m.map(row => row[i])), d = det(...cols);
    if (Math.abs(d) < 1e-9) throw new Error('Calibration points are collinear');
    return [0,1,2].map(i => det(...cols.map((col, j) => j === i ? r : col)) / d);
  }
  // pairs: [{rtls:[x,y], cad:[x,y]}]. Two pairs fit rotation+scale+offset; three or more
  // fit a least-squares affine, which also absorbs a flipped Y axis.
  function calibrate(input) {
    if (!Array.isArray(input)) { matrix = { a:1, b:0, c:0, d:1, tx:0, ty:0, ...input }; reproject(); notify(); return { ...matrix }; }
    const pairs = input.filter(p => Array.isArray(p?.rtls) && Array.isArray(p?.cad) && p.rtls.length === 2 && p.cad.length === 2 && [...p.rtls, ...p.cad].every(v => num(v) !== null));
    if (pairs.length < 2) throw new Error('Calibration needs at least two point pairs');
    if (pairs.length === 2) {
      const [p, q] = pairs, ux = q.rtls[0]-p.rtls[0], uy = q.rtls[1]-p.rtls[1], vx = q.cad[0]-p.cad[0], vy = q.cad[1]-p.cad[1];
      const len = ux*ux + uy*uy; if (!len) throw new Error('Calibration points coincide');
      const a = (ux*vx + uy*vy)/len, b = (ux*vy - uy*vx)/len;
      matrix = { a, b:-b, c:b, d:a, tx:p.cad[0] - a*p.rtls[0] + b*p.rtls[1], ty:p.cad[1] - b*p.rtls[0] - a*p.rtls[1] };
    } else {
      const m = [[0,0,0],[0,0,0],[0,0,0]], rx = [0,0,0], ry = [0,0,0];
      for (const { rtls, cad } of pairs) {
        const v = [rtls[0], rtls[1], 1];
        for (let i = 0; i < 3; i++) { rx[i] += v[i]*cad[0]; ry[i] += v[i]*cad[1]; for (let j = 0; j < 3; j++) m[i][j] += v[i]*v[j]; }
      }
      const [a, b, tx] = solve3(m, rx), [c, d, ty] = solve3(m, ry);
      matrix = { a, b, c, d, tx, ty };
    }
    reproject(); notify(); return { ...matrix };
  }

  // MES work-centre / IoT device ids -> CAD equipment id. Unbound ids fall back to
  // a CAD id or equipment code match, so codes such as "A1-1" work without a table.
  function resolve(id) {
    let key = String(id ?? '').trim(); if (!key) return null;
    // Binding targets may be a CAD id OR a display code, just like direct ids.
    if (bindings.has(key)) key = String(bindings.get(key) ?? '').trim();
    if (!key) return null;
    const layout = getLayout(), all = [...(layout?.equipment || []), ...(layout?.equipment_2f || [])];
    const hit = all.find(e => e.id === key) || all.find(e => String(e.code || '').trim().toUpperCase() === key.toUpperCase());
    return hit?.id || key;
  }
  function bind(map) { bindings = new Map(Object.entries(map || {}).map(([k, v]) => [String(k).trim(), String(v)])); notify(); }
  function ingestOne(e) {
    if (!e || typeof e !== 'object') return false;
    if (e.type === 'equipment') {
      const id = resolve(e.id); if (!id) return false;
      const prev = equipment.get(id) || {}, ts = time(e.ts);
      if (prev.ts !== undefined && ts < prev.ts) return false;
      const status = STATUS.includes(e.status) ? e.status : prev.status || 'offline';
      equipment.set(id, { ...prev, id, sourceId: String(e.id), status, ts, source: e.source || prev.source || mode,
        ...Object.fromEntries(['workOrder','product','count','target','oee','alarm'].filter(k => e[k] !== undefined).map(k => [k, e[k]])) });
      return true;
    }
    if (e.type === 'position') {
      const tag = String(e.tag ?? '').trim(), x = num(e.x), y = num(e.y); if (!tag || x === null || y === null) return false;
      const [cx, cy] = e.frame === 'cad' ? [x, y] : toCad(x, y), prev = tags.get(tag), ts = time(e.ts);
      if (prev && ts < prev.ts) return false;
      const trail = [...(prev?.trail || []), [cx, cy]].slice(-options.trail);
      rawTrails.set(tag, [...(rawTrails.get(tag) || []), { x, y, frame: e.frame }].slice(-options.trail));
      tags.set(tag, { tag, kind: KINDS.includes(e.kind) ? e.kind : prev?.kind || 'person', label: e.label ?? prev?.label ?? tag,
        floor: e.floor === '2F' ? '2F' : '1F', x: cx, y: cy, ts, trail, source: e.source || mode });
      return true;
    }
    return false;
  }
  function ingest(events) {
    const list = Array.isArray(events) ? events : [events];
    let accepted = 0; for (const e of list) if (ingestOne(e)) accepted++;
    if (accepted) { notify(); scheduleExpiry(); }
    return accepted;
  }
  const fresh = ts => Date.now() - ts <= options.staleMs;
  function equipmentState(id) {
    const s = equipment.get(id); if (!s) return null;
    return fresh(s.ts) ? { ...s } : { ...s, status: 'offline', stale: true };
  }
  const positions = (floor = '1F') => [...tags.values()].filter(t => t.floor === floor && fresh(t.ts)).map(t => ({ ...t, trail: t.trail.map(p => [...p]) }));

  function stop() {
    const p = provider; sourceEpoch++; provider = null; mode = 'off';
    clearTimeout(expiryTimer); expiryTimer = null; equipment.clear(); tags.clear(); rawTrails.clear(); notify();
    try { p?.stop?.(); } catch (error) { console.warn('Live provider stop failed', error); }
  }
  function use(next) {
    stop(); if (!next) return;
    const epoch = sourceEpoch; provider = next; mode = next.name || 'live';
    // An old fetch, queued WebSocket message or custom provider callback can
    // finish after stop/switch. Only the current source may publish events.
    const guard = fn => (...args) => epoch === sourceEpoch && provider === next ? fn(...args) : 0;
    try { next.start({ ingest: guard(ingest), getLayout: () => getLayout(), calibrate: guard(calibrate), bind: guard(bind) }); }
    catch (error) {
      console.warn('Live provider failed to start', error);
      if (epoch === sourceEpoch && provider === next) stop();
    }
    notify();
  }

  // ---- Providers -------------------------------------------------------------
  function polyline(points) {
    const pts = points.map(p => [num(p.x ?? p[0]), num(p.y ?? p[1])]).filter(p => p[0] !== null && p[1] !== null);
    const seg = pts.slice(1).map((p, i) => Math.hypot(p[0]-pts[i][0], p[1]-pts[i][1]));
    return { pts, length: seg.reduce((a, b) => a + b, 0), at(d) {
      let left = ((d % (2*this.length)) + 2*this.length) % (2*this.length); if (left > this.length) left = 2*this.length - left;
      for (let i = 0; i < seg.length; i++) { if (left <= seg[i] || i === seg.length-1) { const f = seg[i] ? Math.min(1, left/seg[i]) : 0; return [pts[i][0] + (pts[i+1][0]-pts[i][0])*f, pts[i][1] + (pts[i+1][1]-pts[i][1])*f]; } left -= seg[i]; }
      return pts[0];
    } };
  }
  // Deterministic demo feed: people and forklifts travel the CAD flow routes and
  // aisle centre-lines; machine states are random. Not field data.
  function simulation({ seed = 20261024, tickMs = 400, people = 8 } = {}) {
    let timer = null, rnd = seed >>> 0;
    const random = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 2**32; };
    return { name: 'simulation', start({ ingest: push, getLayout: layoutOf }) {
      const layout = layoutOf() || {}, routes = [], machines = (layout.equipment || []).filter(e => e.code && !NON_MACHINE.test(e.category || ''));
      for (const f of layout.flows || []) if ((f.floor || '1F') === '1F' && Array.isArray(f.points) && f.points.length > 1) routes.push({ path: polyline(f.points), kind: f.type === 'forklift' ? 'forklift' : 'person' });
      for (const a of layout.aisles || []) {
        const x = num(a.x), y = num(a.y), w = num(a.width), h = num(a.height); if ([x, y, w, h].includes(null)) continue;
        routes.push({ path: polyline(w >= h ? [[x+.5, y+h/2], [x+w-.5, y+h/2]] : [[x+w/2, y+.5], [x+w/2, y+h-.5]]), kind: 'person' });
      }
      const walkable = routes.filter(r => r.path.length > 0), movers = [];
      walkable.filter(r => r.kind === 'forklift').forEach((r, i) => movers.push({ tag: `SIM-FL-${i+1}`, kind: 'forklift', route: r, d: random()*r.path.length, speed: 1.8 }));
      const walks = walkable.filter(r => r.kind === 'person');
      for (let i = 0; walks.length && i < people; i++) { const r = walks[i % walks.length]; movers.push({ tag: `SIM-P-${String(i+1).padStart(2,'0')}`, kind: 'person', route: r, d: random()*r.path.length, speed: .9 + random()*.5, pause: 0 }); }
      const states = new Map(machines.map(m => [m.id, { status: random() < .75 ? 'run' : 'idle', count: Math.floor(random()*400), target: 500, next: 0, wo: `WO-SIM-${String(Math.floor(random()*9000)+1000)}` }]));
      let last = Date.now();
      const tick = () => {
        const nowMs = Date.now(), dt = Math.min(2, (nowMs - last)/1000), events = []; last = nowMs;
        for (const m of movers) {
          if (m.pause > 0) m.pause -= dt; else { m.d += m.speed*dt; if (m.kind === 'person' && random() < .01) m.pause = 2 + random()*6; }
          const [x, y] = m.route.path.at(m.d); events.push({ type: 'position', tag: m.tag, kind: m.kind, label: m.tag, x, y, floor: '1F', frame: 'cad', source: 'simulation', ts: nowMs });
        }
        for (const m of machines) {
          const s = states.get(m.id);
          if (s.status === 'run') s.count = (s.count + (random() < .3 ? 1 : 0)) % (s.target + 1);
          if (nowMs >= s.next) { const r = random(); s.status = r < .7 ? 'run' : r < .84 ? 'idle' : r < .92 ? 'setup' : 'down'; s.next = nowMs + 8000 + random()*22000; }
          events.push({ type: 'equipment', id: m.id, status: s.status, workOrder: s.wo, count: s.count, target: s.target, source: 'simulation', ts: nowMs });
        }
        push(events);
      };
      tick(); timer = setInterval(tick, tickMs);
    }, stop() { clearInterval(timer); timer = null; } };
  }
  // Gateway feed (Node-RED / MQTT bridge / MES middleware) over WebSocket.
  // Each message is one event or an array; map() adapts a foreign payload.
  function websocket(url, { map = e => e, protocols } = {}) {
    let ws = null, retry = 0, timer = null, closed = false, version = 0;
    return { name: 'live', start({ ingest: push }) {
      closed = false; retry = 0; const session = ++version;
      const active = () => !closed && session === version;
      const open = () => {
        if (!active()) return;
        const socket = new WebSocket(url, protocols); ws = socket;
        const current = () => active() && ws === socket;
        socket.onopen = () => { if (current()) retry = 0; };
        socket.onmessage = msg => { if (!current()) return; try { const raw = JSON.parse(msg.data), out = map(raw); push(Array.isArray(out) ? out : [out]); } catch (error) { console.warn('Live message ignored', error); } };
        socket.onclose = () => { if (current()) { ws = null; timer = setTimeout(open, Math.min(30000, 1000 * 2**retry++)); } };
        socket.onerror = () => { if (current()) socket.close(); };
      };
      open();
    }, stop() { closed = true; version++; clearTimeout(timer); const socket = ws; ws = null; socket?.close(); } };
  }
  // REST polling for MES endpoints that only offer snapshots.
  function poll(url, { intervalMs = 5000, map = e => e, init } = {}) {
    let timer = null, stopped = false, controller = null, version = 0;
    return { name: 'live', start({ ingest: push }) {
      stopped = false; const session = ++version;
      const active = () => !stopped && session === version;
      const run = async () => {
        if (!active()) return;
        const request = new AbortController(), externalSignal = init?.signal;
        controller = request; const abort = () => request.abort();
        if (externalSignal?.aborted) abort(); else externalSignal?.addEventListener('abort', abort, { once: true });
        try {
          const res = await fetch(url, { ...init, signal: request.signal });
          if (active() && !request.signal.aborted && res.ok) {
            const raw = await res.json();
            if (active() && !request.signal.aborted) { const out = map(raw); push(Array.isArray(out) ? out : [out]); }
          }
        } catch (error) { if (active() && !request.signal.aborted) console.warn('Live poll failed', error); }
        finally { externalSignal?.removeEventListener('abort', abort); if (controller === request) controller = null; }
        if (active() && !externalSignal?.aborted) timer = setTimeout(run, intervalMs);
      };
      run();
    }, stop() { stopped = true; version++; clearTimeout(timer); controller?.abort(); controller = null; } };
  }

  // Supabase tables from the live-twin migration: the *_current tables seed the view and
  // Realtime pushes changes; the active calibration and MES bindings are applied first.
  const opt = v => v ?? undefined;
  const statusEvent = r => ({ type: 'equipment', id: r.cad_id, status: r.status, workOrder: opt(r.work_order), product: opt(r.product),
    count: opt(r.count), target: opt(r.target), oee: r.oee == null ? undefined : Number(r.oee), alarm: r.alarm, source: r.source, ts: r.ts });
  const tagEvent = r => ({ type: 'position', tag: r.tag, kind: r.kind, label: opt(r.label), x: r.x, y: r.y, floor: r.floor, frame: r.frame, source: r.source, ts: r.ts });
  function supabaseFeed(client, { workspaceId }) {
    let channel = null, retryTimer = null, version = 0;
    return { name: 'cloud', start({ ingest: push, calibrate: setCalibration, bind: setBindings }) {
      const session = ++version, active = () => session === version;
      let loading = false, dirty = false, ready = false, retries = 0;
      const pending = new Map();
      const rows = async query => { const { data, error } = await query; if (error) throw error; return data || []; };
      const scoped = table => client.from(table).select('*').eq('workspace_id', workspaceId);
      const receive = event => {
        if (!active()) return;
        if (ready) { push(event); return; }
        const key = event.type + ':' + (event.tag || event.id), previous = pending.get(key);
        if (!previous || time(event.ts) >= time(previous.ts)) pending.set(key, event);
      };
      const load = async () => {
        if (!active()) return;
        dirty = true; ready = false; clearTimeout(retryTimer);
        if (loading) return;
        loading = true;
        try {
          do {
            dirty = false;
            const [bound, calibration, status, tagRows] = await Promise.all([
              rows(scoped('equipment_bindings')), rows(scoped('rtls_calibrations').eq('is_active', true).limit(1)),
              rows(scoped('equipment_status_current')), rows(scoped('rtls_tags_current'))
            ]);
            if (!active()) return;
            // A config change during the snapshot invalidates it; drain the next
            // load before replaying buffered events with the new coordinate frame.
            if (dirty) continue;
            setBindings(Object.fromEntries(bound.map(b => [b.source_id, b.cad_id])));
            try { setCalibration(calibration[0] ? calibration[0].pairs : {}); }
            catch (error) { console.warn('RTLS calibration ignored', error); setCalibration({}); }
            push([...status.map(statusEvent), ...tagRows.map(tagEvent), ...pending.values()]);
            pending.clear(); ready = true; retries = 0;
          } while (dirty && active());
        } catch (error) { console.warn('Live cloud load failed', error); }
        finally {
          loading = false;
          if (active() && !ready) retryTimer = setTimeout(load, Math.min(30000, 1000 * 2**retries++));
        }
      };
      const filter = `workspace_id=eq.${workspaceId}`, on = (table, handler) => channel.on('postgres_changes', { event: '*', schema: 'public', table, filter }, handler);
      channel = client.channel(`live-twin:${workspaceId}`);
      on('equipment_status_current', ({ new: r }) => { if (r?.cad_id) receive(statusEvent(r)); });
      on('rtls_tags_current', ({ new: r }) => { if (r?.tag) receive(tagEvent(r)); });
      // Raw RTLS positions were converted with the old calibration: reload everything.
      on('rtls_calibrations', () => load());
      on('equipment_bindings', () => load());
      channel.subscribe(status => { if (!active()) return; if (status === 'SUBSCRIBED') load(); else if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) console.warn('Live cloud channel', status); });
    }, stop() { version++; clearTimeout(retryTimer); if (channel) client.removeChannel(channel); channel = null; } };
  }

  window.ChinChunLive = {
    STATUS, KINDS, options,
    attach({ layout } = {}) { if (typeof layout === 'function') getLayout = layout; },
    bind, calibrate, toCad, ingest, use, stop, equipmentState, positions,
    mode: () => mode,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    snapshot: () => ({ mode, equipment: [...equipment.keys()].map(equipmentState), tags: [...tags.values()].map(t => ({ ...t, trail: undefined })) }),
    providers: { simulation, websocket, poll, supabase: supabaseFeed }
  };
})();
