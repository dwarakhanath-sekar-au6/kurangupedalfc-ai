/* KuranguPedalFC app.js
   - Renders dashboard.json into the single-page homepage
   - Safe against missing elements / missing fields
   - Shows demo or user-squad mode based on JSON content
*/

(function () {
  'use strict';

  const DASHBOARD_URL = './dashboard.json';
  const FPL_BOOTSTRAP_URL = 'https://fantasy.premierleague.com/api/bootstrap-static/';

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value == null ? '' : String(value);
  };

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const toArray = (v) => Array.isArray(v) ? v : [];

  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const text = (...values) => {
    for (const v of values) {
      if (typeof v === 'string' && v.trim()) return v;
    }
    return '';
  };

  const normalizeName = (s) => String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const safePercent = (value) => {
    const n = num(value, 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  const formatMoney = (value) => {
    const n = num(value, 0);
    return `£${n.toFixed(1)}m`;
  };

  const getPositionLabel = (p) => String(p?.position ?? p?.Position ?? '').toUpperCase();

  const renderShirtColor = (team) => {
    const colors = {
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
      Sunderland: '#6A4C93',
      'Man United': '#DA291C'
    };
    return colors[team] || '#0f7a54';
  };

  const chipStatusClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'ready') return 'chip-ready';
    if (s === 'watch' || s === 'consider') return 'chip-watch';
    return 'chip-no';
  };

  const pickFirstExisting = (obj, keys, fallback = '') => {
    for (const key of keys) {
      const v = obj?.[key];
      if (typeof v === 'string' && v.trim()) return v;
      if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    }
    return fallback;
  };

  const loadLivePrices = async () => {
    const map = new Map();
    try {
      const res = await fetch(FPL_BOOTSTRAP_URL, { cache: 'no-store' });
      if (!res.ok) return map;
      const json = await res.json();
      const elements = Array.isArray(json.elements) ? json.elements : [];
      for (const p of elements) {
        const key = normalizeName(p.web_name);
        map.set(key, num(p.now_cost, 0) / 10);
      }
    } catch (err) {
      console.warn('Live price lookup failed:', err);
    }
    return map;
  };

  const formatBenchOrder = (bench) => {
    const sorted = [...bench].sort((a, b) => num(b.expected_points, 0) - num(a.expected_points, 0));
    return sorted.map(p => p.player || p.Player || 'Unknown');
  };

  const shortPlayerNote = (player) => {
    const role = String(player?.recommendation || player?.role || '').toLowerCase();
    const pos = getPositionLabel(player);
    const own = num(player?.ownership ?? player?.Ownership, 0);
    const ppg = num(player?.ppg ?? player?.PPG, 0);
    const points = num(player?.points ?? player?.Points, 0);
    const starts = num(player?.starts ?? player?.Starts, 0);
    const goals = num(player?.goals ?? player?.Goals, 0);
    const assists = num(player?.assists ?? player?.Assists, 0);
    const cs = num(player?.clean_sheets ?? player?.cleanSheets ?? player?.CleanSheets, 0);
    const price = num(player?.price ?? player?.Price, 0);
    const exp = num(player?.expected_points ?? player?.ExpectedPoints, 0);

    if (role === 'captain') return 'Best captain option • Highest weekly upside';
    if (role === 'vice captain') return 'Reliable vice-captain cover';
    if (role === 'bench') return 'Bench cover • Squad depth';

    if (pos === 'GK') {
      const bits = ['Safe goalkeeping slot'];
      if (points > 0) bits.push(`${Math.round(points)} points`);
      if (starts > 0) bits.push(`${Math.round(starts)} starts`);
      if (cs > 0) bits.push(`${Math.round(cs)} clean sheets`);
      return bits.slice(0, 3).join(' • ');
    }

    if (pos === 'DEF') {
      const bits = [];
      if (cs >= 10) bits.push('Clean-sheet threat');
      if (goals >= 2) bits.push('Set-piece threat');
      if (own >= 20) bits.push('Trusted pick');
      if (price <= 6.5) bits.push('Strong value');
      if (!bits.length) bits.push('Defensive value');
      return bits.slice(0, 3).join(' • ');
    }

    if (pos === 'MID') {
      const bits = [];
      if (goals >= 8) bits.push('Goal involvement');
      if (assists >= 6) bits.push('Creative outlet');
      if (ppg >= 5) bits.push('Consistent returns');
      if (own >= 25) bits.push('Highly owned');
      if (!bits.length) bits.push('Midfield output');
      return bits.slice(0, 3).join(' • ');
    }

    if (pos === 'FWD') {
      const bits = [];
      if (goals >= 12) bits.push('Proven scorer');
      else if (goals >= 6) bits.push('Goal threat');
      if (ppg >= 5) bits.push('Consistent returns');
      if (price <= 8) bits.push('Strong value');
      if (!bits.length) bits.push('Forward threat');
      return bits.slice(0, 3).join(' • ');
    }

    if (exp >= 8) return `Projected ${Math.round(exp)} pts • Strong weekly output`;
    if (exp >= 6) return `Projected ${Math.round(exp)} pts • Solid weekly output`;
    return `Projected ${Math.round(exp)} pts`;
  };

  const getFormationLayout = (formation) => {
    const layouts = {
      '3-5-2': {
        GK: [{ x: 50, y: 12 }],
        DEF: [{ x: 22, y: 32 }, { x: 50, y: 32 }, { x: 78, y: 32 }],
        MID: [{ x: 10, y: 56 }, { x: 30, y: 56 }, { x: 50, y: 56 }, { x: 70, y: 56 }, { x: 90, y: 56 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      },
      '3-4-3': {
        GK: [{ x: 50, y: 12 }],
        DEF: [{ x: 20, y: 32 }, { x: 50, y: 32 }, { x: 80, y: 32 }],
        MID: [{ x: 14, y: 56 }, { x: 38, y: 56 }, { x: 62, y: 56 }, { x: 86, y: 56 }],
        FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
      },
      '4-4-2': {
        GK: [{ x: 50, y: 12 }],
        DEF: [{ x: 16, y: 32 }, { x: 38, y: 32 }, { x: 62, y: 32 }, { x: 84, y: 32 }],
        MID: [{ x: 16, y: 56 }, { x: 38, y: 56 }, { x: 62, y: 56 }, { x: 84, y: 56 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      },
      '4-3-3': {
        GK: [{ x: 50, y: 12 }],
        DEF: [{ x: 16, y: 32 }, { x: 38, y: 32 }, { x: 62, y: 32 }, { x: 84, y: 32 }],
        MID: [{ x: 20, y: 56 }, { x: 50, y: 56 }, { x: 80, y: 56 }],
        FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
      },
      '5-3-2': {
        GK: [{ x: 50, y: 12 }],
        DEF: [{ x: 10, y: 32 }, { x: 30, y: 32 }, { x: 50, y: 32 }, { x: 70, y: 32 }, { x: 90, y: 32 }],
        MID: [{ x: 20, y: 56 }, { x: 50, y: 56 }, { x: 80, y: 56 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      }
    };
    return layouts[formation] || layouts['3-5-2'];
  };

  const parseDashboard = async () => {
    const res = await fetch(DASHBOARD_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`dashboard.json load failed: ${res.status}`);
    return res.json();
  };

  const normalizePlayer = (p) => ({
    player: p.player || p.name || p.Player || 'Unknown',
    team: p.team || p.Team || '—',
    position: p.position || p.Position || '—',
    price: num(p.price ?? p.Price ?? 0, 0),
    expected_points: num(p.expected_points ?? p.expected ?? p.ExpectedPoints ?? 0, 0),
    recommendation: p.recommendation || p.role || 'Start',
    summary: p.summary || p.reason || '',
    ownership: num(p.ownership ?? p.Ownership ?? 0, 0),
    ppg: num(p.ppg ?? p.PPG ?? 0, 0),
    points: num(p.points ?? p.Points ?? 0, 0),
    minutes: num(p.minutes ?? p.Minutes ?? 0, 0),
    starts: num(p.starts ?? p.Starts ?? 0, 0),
    goals: num(p.goals ?? p.Goals ?? 0, 0),
    assists: num(p.assists ?? p.Assists ?? 0, 0),
    clean_sheets: num(p.clean_sheets ?? p.cleanSheets ?? p.CleanSheets ?? 0, 0),
    medical: p.medical || p.MedicalStatus || 'Available',
    fpl_id: p.fpl_id || p.id || null
  });

  const renderButtonToken = (player, isCaptain, isVice, isSmall = false) => {
    const initial = String(player?.player || 'U').trim().charAt(0).toUpperCase() || 'U';
    return `
      <div class="${isSmall ? 'button-token small-token' : 'button-token'}" style="background:${renderShirtColor(player.team)}">
        <span class="button-token-letter">${esc(initial)}</span>
        ${isCaptain ? '<span class="button-badge button-c">C</span>' : ''}
        ${isVice ? '<span class="button-badge button-vc">VC</span>' : ''}
      </div>
    `;
  };

  const renderShirtToken = (player, isCaptain, isVice) => `
    <div class="shirt-wrap">
      <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
        <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${renderShirtColor(player.team)}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
        <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.18)" />
        <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.10)" />
      </svg>
      ${isCaptain ? '<span class="badge badge-c">C</span>' : ''}
      ${isVice ? '<span class="badge badge-vc">VC</span>' : ''}
    </div>
  `;

  const render = async () => {
    const data = await parseDashboard();
    const livePrices = await loadLivePrices();

    const metadata = isObj(data.metadata) ? data.metadata : {};
    const currentTeam = isObj(data.current_team) ? data.current_team : {};
    const weekly = isObj(data.weekly_advice) ? data.weekly_advice : {};
    const recommendation = isObj(data.recommendation) ? data.recommendation : {};
    const judge = isObj(data.judge) ? data.judge : {};

    const startingRaw = toArray(recommendation.starting_xi).length ? toArray(recommendation.starting_xi) : [];
    const benchRaw = toArray(recommendation.bench).length ? toArray(recommendation.bench) : [];

    const currentTeamPlayers = toArray(currentTeam.players).map(normalizePlayer);
    const starting = (startingRaw.length ? startingRaw : currentTeamPlayers.filter(p => p.recommendation !== 'Bench')).map(normalizePlayer);
    const bench = (benchRaw.length ? benchRaw : currentTeamPlayers.filter(p => p.recommendation === 'Bench')).map(normalizePlayer);

    const captain = normalizePlayer(isObj(recommendation.captain) ? recommendation.captain : currentTeamPlayers.find(p => p.recommendation === 'Captain' || p.is_captain) || starting[0] || {});
    const viceCaptain = normalizePlayer(isObj(recommendation.vice_captain) ? recommendation.vice_captain : currentTeamPlayers.find(p => p.recommendation === 'Vice captain' || p.is_vice_captain) || starting[1] || {});

    const formation = recommendation.formation || currentTeam.formation || '3-5-2';
    const squadValue = num(currentTeam.squad_value ?? metadata.team_value ?? 100, 100);
    const bank = num(currentTeam.bank ?? metadata.bank ?? 0, 0);
    const isDemo = Boolean(currentTeam.is_demo ?? metadata.is_demo ?? false);

    const projectedTeamPoints = num(
      weekly.projected_team_points,
      Math.round(starting.reduce((sum, p) => sum + num(p.expected_points, 0), 0) + num(captain.expected_points, 0))
    );

    const immediateCall = text(
      weekly.headline,
      weekly.immediate_call,
      `Captain ${captain.player || 'your best attacker'} and keep ${viceCaptain.player || 'your best vice'} as vice captain.`
    );

    const callMeta = text(
      weekly.transfer_call?.action,
      weekly.chip_call?.chip,
      weekly.captain_call?.player,
      weekly.vice_call?.player,
      judge.reason,
      'Base squad locked for the season.'
    );

    const whyThisWorks = toArray(weekly.why_this_works).length
      ? toArray(weekly.why_this_works)
      : [
          `${formatMoney(squadValue)} spent, ${formatMoney(bank)} left.`,
          `Formation set to ${formation}.`,
          `Captain: ${captain.player || '—'}. Vice captain: ${viceCaptain.player || '—'}.`
        ];

    const transferWatch = toArray(weekly.transfer_watch).map((item) => {
      const sell = item.sell || item.out || '';
      const buy = item.buy || item.in || '';
      const sellKey = normalizeName(sell);
      const buyKey = normalizeName(buy);
      const sellLivePrice = livePrices.get(sellKey);
      const buyLivePrice = livePrices.get(buyKey);
      const sellPrice = num(item.sell_price ?? item.price_out ?? sellLivePrice, sellLivePrice ?? 0);
      const buyPrice = num(item.buy_price ?? item.price_in ?? buyLivePrice, buyLivePrice ?? 0);
      return {
        sell,
        buy,
        sell_team: item.sell_team || '',
        buy_team: item.buy_team || '',
        position: item.position || '',
        why_sell: item.why_sell || '',
        why_buy: item.why_buy || '',
        expected_points_out: num(item.expected_points_out, 0),
        expected_points_in: num(item.expected_points_in, 0),
        sell_price: sellPrice,
        buy_price: buyPrice
      };
    });

    const chipWatch = isObj(weekly.chip_watch) ? weekly.chip_watch : {};

    setText('gwPill', `Gameweek ${num(metadata.gameweek, currentTeam.gameweek_last_updated || 1)}`);
    setText('updatedText', `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setText('teamValue', formatMoney(squadValue));
    setText('bankValue', formatMoney(bank));
    setText('formationValue', formation);
    setText('projectedPoints', String(projectedTeamPoints));
    setText('nextMoveText', immediateCall);
    const heroSummary = isDemo
      ? 'Demo squad until you import your team. Weekly advice updates only.'
      : (projectedTeamPoints < 55
        ? 'Quiet week, but the squad stays balanced and safe.'
        : 'Balanced weekly return with good upside.');
    setText('heroSub', heroSummary);
    setText('callMeta', callMeta);

    const pintBtn = $('pintBtn');
    if (pintBtn) {
      pintBtn.setAttribute('href', 'upi://pay?pa=dwarakhanath.sekar@ybl&pn=Dwarakhanath%20Sekar&am=119&cu=INR&tn=Buy%20me%20a%20pint');
    }

    // Pitch
    const pitchArea = $('pitchArea');
    if (pitchArea) {
      const layout = getFormationLayout(formation);
      const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
      starting.forEach(p => {
        const pos = getPositionLabel(p);
        if (grouped[pos]) grouped[pos].push(p);
      });
      Object.keys(grouped).forEach(pos => {
        grouped[pos].sort((a, b) => num(b.expected_points, 0) - num(a.expected_points, 0) || num(b.ownership, 0) - num(a.ownership, 0));
      });

      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const items = [];
      ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
        grouped[pos].forEach((p, i) => {
          const coord = layout[pos][i] || { x: 50, y: 50 };
          items.push({ ...p, coord });
        });
      });

      pitchArea.innerHTML = items.map(p => {
        const isC = p.player === captain.player;
        const isVC = p.player === viceCaptain.player;

        if (isMobile) {
          return `
            <div class="slot" style="left:${p.coord.x}%; top:${p.coord.y}%; width:84px;">
              ${renderButtonToken(p, isC, isVC)}
              <div class="pitch-card button-card">
                <div class="pitch-name">${esc(p.player)}</div>
                <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
                <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
              </div>
            </div>
          `;
        }

        return `
          <div class="slot" style="left:${p.coord.x}%; top:${p.coord.y}%;">
            ${renderShirtToken(p, isC, isVC)}
            <div class="pitch-card">
              <div class="pitch-name">${esc(p.player)}</div>
              <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
              <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Substitutes
    const subsRow = $('subsRow');
    if (subsRow) {
      if (bench.length) {
        const isMobile = window.matchMedia('(max-width: 760px)').matches;
        const benchSorted = [...bench].sort((a, b) => num(b.expected_points, 0) - num(a.expected_points, 0));
        subsRow.innerHTML = benchSorted.map((p, idx) => {
          if (isMobile) {
            return `
              <div class="sub-card sub-pill">
                ${renderButtonToken(p, false, false, true)}
                <div class="pitch-name">${esc(p.player)}</div>
                <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
                <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
                <div class="pitch-subline">${idx + 1}. Bench order</div>
              </div>
            `;
          }
          return `
            <div class="sub-card">
              ${renderShirtToken(p, false, false)}
              <div class="pitch-name">${esc(p.player)}</div>
              <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
              <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
              <div class="pitch-subline">${idx + 1}. Bench order</div>
            </div>
          `;
        }).join('');
      } else {
        subsRow.innerHTML = `<div class="empty-state">No bench players found in the JSON.</div>`;
      }
    }

    // Transfer watch
    const transferWatchEl = $('transferWatch');
    if (transferWatchEl) {
      if (transferWatch.length) {
        transferWatchEl.innerHTML = transferWatch.map(item => {
          const gain = Math.max(0, num(item.expected_points_in, 0) - num(item.expected_points_out, 0));
          const sellPrice = Number.isFinite(item.sell_price) ? `£${item.sell_price.toFixed(1)}m` : '£—';
          const buyPrice = Number.isFinite(item.buy_price) ? `£${item.buy_price.toFixed(1)}m` : '£—';
          return `
            <div class="transfer-card">
              <div class="transfer-side">
                <div class="label">Out</div>
                <div class="name">${esc(item.sell || '—')}</div>
                <div class="meta">${sellPrice} • ${esc(item.sell_team || '—')} • ${esc(item.position || '—')}</div>
                <div class="meta">${esc(item.why_sell || '')}</div>
              </div>
              <div>
                <div class="transfer-arrow">→</div>
                <div class="transfer-gain">+${gain} pts</div>
              </div>
              <div class="transfer-side">
                <div class="label">In</div>
                <div class="name">${esc(item.buy || '—')}</div>
                <div class="meta">${buyPrice} • ${esc(item.buy_team || 'Target')} • ${esc(item.position || '—')}</div>
                <div class="meta">${esc(item.why_buy || '')}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        transferWatchEl.innerHTML = `<div class="empty-state">No clear transfer move right now. Keep the squad and hold the free transfer.</div>`;
      }
    }

    // Chip watch
    const chipWatchEl = $('chipWatch');
    if (chipWatchEl) {
      const chipConfig = [
        {
          name: 'Triple Captain',
          status: text(chipWatch.triple_captain?.status, 'wait'),
          reason: text(chipWatch.triple_captain?.reason, 'Use when the captain has elite ceiling and a kind fixture.')
        },
        {
          name: 'Bench Boost',
          status: text(chipWatch.bench_boost?.status, 'wait'),
          reason: text(chipWatch.bench_boost?.reason, 'Use when the bench has proper starter-level points.')
        },
        {
          name: 'Wildcard',
          status: text(chipWatch.wildcard?.status, 'not needed'),
          reason: text(chipWatch.wildcard?.reason, 'Use only if the squad needs a full reset.')
        },
        {
          name: 'Free Hit',
          status: text(chipWatch.free_hit?.status, 'not needed'),
          reason: text(chipWatch.free_hit?.reason, 'Use for a single awkward week when the normal squad shape breaks.')
        }
      ];

      chipWatchEl.innerHTML = chipConfig.map(item => `
        <div class="chip-item ${chipStatusClass(item.status)}">
          <div class="chip-name">${esc(item.name)}</div>
          <div class="chip-status">${esc(String(item.status).toUpperCase())}</div>
          <div class="chip-reason">${esc(item.reason)}</div>
        </div>
      `).join('');
    }

    // Player notes
    const focusCardsEl = $('focusCards');
    if (focusCardsEl) {
      const focusCards = [
        {
          role: 'Captain',
          name: captain.player || '—',
          summary: shortPlayerNote(captain),
          meta: `${captain.team || '—'} • ${Math.round(num(captain.expected_points, 0))} pts`
        },
        {
          role: 'Vice captain',
          name: viceCaptain.player || '—',
          summary: shortPlayerNote(viceCaptain),
          meta: `${viceCaptain.team || '—'} • ${Math.round(num(viceCaptain.expected_points, 0))} pts`
        }
      ];

      if (transferWatch.length) {
        const first = transferWatch[0];
        focusCards.push({
          role: 'Transfer out',
          name: first.sell || '—',
          summary: `${first.why_sell || 'Exit the weak spot.'} ${Number.isFinite(first.sell_price) ? `Current price: £${first.sell_price.toFixed(1)}m.` : ''}`.trim(),
          meta: `${first.sell_team || '—'} • ${first.position || '—'}`
        });
        focusCards.push({
          role: 'Transfer in',
          name: first.buy || '—',
          summary: `${first.why_buy || 'Upgrade the slot.'} ${Number.isFinite(first.buy_price) ? `Price: £${first.buy_price.toFixed(1)}m.` : ''}`.trim(),
          meta: `${first.buy_team || 'Target'} • ${first.position || '—'}`
        });
      }

      focusCardsEl.innerHTML = focusCards.map(card => `
        <article class="focus-card">
          <div class="topline">
            <div class="name">${esc(card.name)}</div>
            <div class="role">${esc(card.role)}</div>
          </div>
          <div class="summary">${esc(card.summary)}</div>
          <div class="meta">${esc(card.meta)}</div>
        </article>
      `).join('');
    }

    // Footer / hero copy fallback
    if (!immediateCall) {
      setText('nextMoveText', 'Demo squad loaded. Import your team to switch to user mode.');
    }

    // Subtle path for top-level summary if model failed to provide it
    if (isDemo) {
      setText('heroSub', 'Demo squad until you import your team. Weekly advice updates only.');
    }
  };

  const showError = (err) => {
    console.error(err);
    document.body.innerHTML = `
      <div style="padding:24px;font-family:Inter,system-ui,sans-serif;color:#b91c1c;white-space:pre-wrap;">
        Failed to load dashboard.json\n\n${esc((err && err.stack) ? err.stack : String(err))}
      </div>
    `;
  };

  document.addEventListener('DOMContentLoaded', () => {
    render().catch(showError);
  });
})();
