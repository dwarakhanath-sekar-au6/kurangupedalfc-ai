(() => {
  const DASHBOARD_URLS = ['./dashboard.json', './docs/dashboard.json'];
  const PINT_LINK = 'upi://pay?pa=dwarakhanath.sekar@ybl&pn=Dwarakhanath%20Sekar&cu=INR&tn=Buy%20a%20pint';

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const toArray = (v) => Array.isArray(v) ? v : [];
  const text = (...values) => values.find(v => typeof v === 'string' && v.trim()) || '';
  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const loadDashboard = async () => {
    let lastError = null;
    for (const url of DASHBOARD_URLS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`${url} -> ${res.status}`);
        return await res.json();
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Failed to load dashboard.json');
  };

  const teamColors = {
    Arsenal: '#EF0107',
    'Aston Villa': '#7B0033',
    Bournemouth: '#DA291C',
    Brentford: '#E30613',
    Brighton: '#0057B8',
    Burnley: '#6C1D45',
    Chelsea: '#034694',
    'Crystal Palace': '#1B458F',
    Everton: '#003399',
    Fulham: '#D9D9D9',
    Liverpool: '#C8102E',
    Luton: '#F78F1E',
    'Man City': '#6CABDD',
    'Man Utd': '#DA291C',
    Newcastle: '#241F20',
    "Nott'm Forest": '#DA291C',
    Spurs: '#FFFFFF',
    'West Ham': '#7A263A',
    Wolves: '#FDB913',
    Leeds: '#FFCD00',
    Leicester: '#003090',
    Southampton: '#D71920',
    Watford: '#FBEE23',
    Coventry: '#5B9BD5',
    Ipswich: '#0053A0',
    Sunderland: '#C10000'
  };

  const shirtColor = (team) => teamColors[team] || '#0f7a54';
  const isLightColor = (hex) => {
    const c = String(hex || '').replace('#', '');
    if (c.length !== 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 200;
  };

  const formationLayouts = {
    '3-5-2': { GK: [{ x: 50, y: 12 }], DEF: [{ x: 22, y: 30 }, { x: 50, y: 30 }, { x: 78, y: 30 }], MID: [{ x: 10, y: 58 }, { x: 30, y: 58 }, { x: 50, y: 58 }, { x: 70, y: 58 }, { x: 90, y: 58 }], FWD: [{ x: 40, y: 84 }, { x: 60, y: 84 }] },
    '3-4-3': { GK: [{ x: 50, y: 12 }], DEF: [{ x: 20, y: 30 }, { x: 50, y: 30 }, { x: 80, y: 30 }], MID: [{ x: 14, y: 58 }, { x: 38, y: 58 }, { x: 62, y: 58 }, { x: 86, y: 58 }], FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }] },
    '4-4-2': { GK: [{ x: 50, y: 12 }], DEF: [{ x: 16, y: 30 }, { x: 38, y: 30 }, { x: 62, y: 30 }, { x: 84, y: 30 }], MID: [{ x: 16, y: 58 }, { x: 38, y: 58 }, { x: 62, y: 58 }, { x: 84, y: 58 }], FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }] },
    '4-3-3': { GK: [{ x: 50, y: 12 }], DEF: [{ x: 16, y: 30 }, { x: 38, y: 30 }, { x: 62, y: 30 }, { x: 84, y: 30 }], MID: [{ x: 20, y: 58 }, { x: 50, y: 58 }, { x: 80, y: 58 }], FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }] },
    '5-3-2': { GK: [{ x: 50, y: 12 }], DEF: [{ x: 10, y: 30 }, { x: 30, y: 30 }, { x: 50, y: 30 }, { x: 70, y: 30 }, { x: 90, y: 30 }], MID: [{ x: 20, y: 58 }, { x: 50, y: 58 }, { x: 80, y: 58 }], FWD: [{ x: 40, y: 84 }, { x: 60, y: 84 }] }
  };

  const normalizePlayer = (p) => ({
    player: p.player || p.name || '',
    team: p.team || p.Team || '',
    position: p.position || p.Position || '',
    price: num(p.price ?? p.Price ?? 0, 0),
    ownership: num(p.ownership ?? p.Ownership ?? 0, 0),
    headline: p.headline || p.recommendation || 'Squad',
    summary: p.summary || p.reason || '',
    is_starting: !!p.is_starting
  });

  const renderPitchSlot = (p, coord, isCaptain, isVice, isMobile = false) => {
    const color = shirtColor(p.team);
    const light = isLightColor(color);
    const cls = isCaptain ? 'token-captain' : isVice ? 'token-vice' : '';
    const tokenSize = isMobile ? 'small-token' : '';
    const meta = `£${num(p.price).toFixed(1)}m • 👥${num(p.ownership).toFixed(1)}%`;
    return `
      <div class="slot mobile-slot" style="left:${coord.x}%; top:${coord.y}%;">
        <div class="pitch-token ${cls} ${tokenSize} ${light ? 'light-token' : ''}" style="background:${color}">
          <span class="pitch-token-letter">${esc((p.player || '?').slice(0,1).toUpperCase())}</span>
          ${isCaptain ? '<span class="token-badge">C</span>' : ''}
          ${isVice ? '<span class="token-badge token-badge-vc">VC</span>' : ''}
        </div>
        <div class="pitch-card mobile-pitch-card">
          <div class="pitch-name">${esc(p.player)}</div>
          <div class="pitch-club">${esc(p.team)}</div>
          <div class="pitch-meta">${esc(meta)}</div>
        </div>
      </div>
    `;
  };

  const buildBrief = (p) => {
    if (!p) return '';
    const role = text(p.recommendation, 'Start');
    const headline = text(p.headline, role);
    return `
      <article class="focus-card">
        <div class="topline">
          <div class="name">${esc(p.player)}</div>
          <div class="role">${esc(headline)}</div>
        </div>
        <div class="summary">${esc(p.summary)}</div>
        <div class="meta">${esc(p.team)} • ${esc(p.position)} • Owned by ${num(p.ownership).toFixed(1)}%</div>
      </article>
    `;
  };

  const buildTransfer = (item) => {
    const gain = num(item.projected_gain, 0);
    const sellPrice = num(item.sell_price, NaN);
    const buyPrice = num(item.buy_price, NaN);
    return `
      <div class="transfer-card">
        <div class="transfer-side">
          <div class="label">Out</div>
          <div class="name">${esc(item.sell)}</div>
          <div class="meta">${esc(item.sell_team)} • ${esc(item.position)} • ${Number.isFinite(sellPrice) ? `£${sellPrice.toFixed(1)}m` : '£—'}</div>
          <div class="meta">${esc(item.why_sell || '')}</div>
        </div>
        <div>
          <div class="transfer-arrow">→</div>
          <div class="transfer-gain">${gain >= 0 ? '+' : ''}${gain} pts</div>
        </div>
        <div class="transfer-side">
          <div class="label">In</div>
          <div class="name">${esc(item.buy)}</div>
          <div class="meta">${esc(item.buy_team)} • ${esc(item.position)} • ${Number.isFinite(buyPrice) ? `£${buyPrice.toFixed(1)}m` : '£—'}</div>
          <div class="meta">${esc(item.why_buy || '')}</div>
        </div>
      </div>
    `;
  };

  const renderChip = (name, obj) => {
    const status = text(obj?.status, 'wait').toLowerCase();
    const cls = status === 'ready' ? 'chip-ready' : (status === 'watch' || status === 'consider') ? 'chip-watch' : 'chip-no';
    return `
      <div class="chip-item ${cls}">
        <div class="chip-name">${esc(name)}</div>
        <div class="chip-status">${esc(status.toUpperCase())}</div>
        <div class="chip-reason">${esc(text(obj?.reason, ''))}</div>
      </div>
    `;
  };

  const load = async () => {
    const dashboard = await loadDashboard();
    const meta = isObj(dashboard.metadata) ? dashboard.metadata : {};
    const weekly = isObj(dashboard.weekly_advice) ? dashboard.weekly_advice : {};
    const rec = isObj(dashboard.recommendation) ? dashboard.recommendation : {};
    const current = isObj(dashboard.current_team) ? dashboard.current_team : {};
    const starting = toArray(rec.starting_xi).map(normalizePlayer);
    const bench = toArray(rec.bench).map(normalizePlayer);
    const captain = normalizePlayer(rec.captain || {});
    const vice = normalizePlayer(rec.vice_captain || {});
    const transferWatch = toArray(weekly.transfer_watch);
    const chipWatch = isObj(weekly.chip_watch) ? weekly.chip_watch : {};
    const formation = rec.formation || current.formation || '4-4-2';
    const layout = formationLayouts[formation] || formationLayouts['4-4-2'];
    const isMobile = window.matchMedia('(max-width: 760px)').matches;

    setText('projectedPoints', String(num(weekly.projected_team_points, 0)));
    setText('nextMoveText', text(weekly.immediate_call, 'Hold transfer.'));
    setText('callMeta', `Recommended base squad for the gameweek.`);
    setText('teamValue', current.squad_value ? `£${num(current.squad_value).toFixed(1)}m` : text(meta.team_value, '£0.0m'));
    setText('bankValue', current.bank ? `£${num(current.bank).toFixed(1)}m` : text(meta.bank, '£0.0m'));
    setText('formationValue', formation);

    const pintBtn = document.getElementById('pintBtn');
    if (pintBtn) pintBtn.setAttribute('href', PINT_LINK);

    const pitchArea = document.getElementById('pitchArea');
    const pitchPlayers = starting.map(p => ({ ...p, price: p.price, ownership: p.ownership }));
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    pitchPlayers.forEach(p => { if (grouped[p.position]) grouped[p.position].push(p); });
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => b.price - a.price || b.ownership - a.ownership));

    const ordered = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => grouped[pos].forEach((p, idx) => ordered.push({ p, coord: layout[pos][idx] })));
    pitchArea.innerHTML = ordered.map(({ p, coord }) => renderPitchSlot(p, coord, p.player === captain.player, p.player === vice.player, isMobile)).join('');

    const focusCards = document.getElementById('focusCards');
    const topNotes = [captain, vice, ...starting.filter(p => p.player !== captain.player && p.player !== vice.player).slice(0, 2)];
    focusCards.innerHTML = topNotes.map(p => buildBrief(p)).join('');

    const subsRow = document.getElementById('subsRow');
    subsRow.innerHTML = bench.map((p, idx) => `
      <div class="sub-card">
        <div class="sub-token" style="background:${shirtColor(p.team)}">${esc((p.player || '?').slice(0,1).toUpperCase())}</div>
        <div class="pitch-name">${esc(p.player)}</div>
        <div class="pitch-club">${esc(p.team)} • ${esc(p.position)}</div>
        <div class="pitch-meta">£${num(p.price).toFixed(1)}m • 👥${num(p.ownership).toFixed(1)}%</div>
        <div class="pitch-owned">${idx + 1}. Bench</div>
      </div>
    `).join('');

    const transferEl = document.getElementById('transferWatch');
    transferEl.innerHTML = transferWatch.length ? transferWatch.map(buildTransfer).join('') : `<div class="empty-state">Hold transfer. No affordable upgrade stands out this week.</div>`;

    const chipEl = document.getElementById('chipWatch');
    chipEl.innerHTML = [
      ['Triple Captain', chipWatch.triple_captain],
      ['Bench Boost', chipWatch.bench_boost],
      ['Wildcard', chipWatch.wildcard],
      ['Free Hit', chipWatch.free_hit]
    ].map(([name, obj]) => renderChip(name, obj)).join('');

    const statusEl = document.getElementById('teamIdStatus');
    const savedKey = localStorage.getItem('kurangu_team_access_key');
    const input = document.getElementById('teamIdInput');
    if (input && savedKey) input.value = savedKey;
    if (statusEl) statusEl.textContent = savedKey ? 'Access key saved locally.' : 'No access saved yet.';

    const saveBtn = document.getElementById('teamIdSaveBtn');
    if (saveBtn && input) {
      saveBtn.addEventListener('click', () => {
        const value = input.value.trim();
        if (!value) {
          localStorage.removeItem('kurangu_team_access_key');
          if (statusEl) statusEl.textContent = 'Access key cleared.';
          return;
        }
        localStorage.setItem('kurangu_team_access_key', value);
        if (statusEl) statusEl.textContent = 'Access key saved locally.';
      });
    }
  };

  load().catch(err => {
    console.error(err);
    document.body.innerHTML = `<div style="padding:40px;font-family:Inter,sans-serif">Failed to load dashboard.json</div>`;
  });
})();
