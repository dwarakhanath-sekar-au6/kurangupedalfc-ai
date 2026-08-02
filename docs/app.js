fetch('./dashboard.json', { cache: 'no-store' })
  .then(async res => {
    if (!res.ok) throw new Error(`dashboard.json load failed: ${res.status}`);
    return res.json();
  })
  .then(data => {
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

    const baseSquad = isObj(data.base_squad) ? data.base_squad : {};
    const weekly = isObj(data.weekly_advice) ? data.weekly_advice : {};
    const recommendation = isObj(data.recommendation) ? data.recommendation : {};
    const judge = isObj(data.judge) ? data.judge : {};

    const startingRaw = toArray(recommendation.starting_xi).length
      ? toArray(recommendation.starting_xi)
      : toArray(baseSquad.starting_xi);

    const benchRaw = toArray(recommendation.bench).length
      ? toArray(recommendation.bench)
      : toArray(baseSquad.bench);

    const captain = isObj(recommendation.captain)
      ? recommendation.captain
      : (isObj(baseSquad.captain) ? baseSquad.captain : {});

    const viceCaptain = isObj(recommendation.vice_captain)
      ? recommendation.vice_captain
      : (isObj(baseSquad.vice_captain) ? baseSquad.vice_captain : {});

    const formation = recommendation.formation || baseSquad.formation || '3-5-2';
    const squadCost = num(baseSquad.squad_cost, 100);
    const teamValueText = baseSquad.team_value || `£${squadCost.toFixed(1)}m`;
    const bankValue = Math.max(0, 100 - squadCost);

    const normalize = (p) => ({
      player: p.player || p.name || p.Player || 'Unknown',
      team: p.team || p.Team || '—',
      position: p.position || p.Position || '—',
      price: num(p.price ?? p.Price ?? 0, 0),
      expected_points: num(p.expected_points ?? p.expected ?? 0, 0),
      recommendation: p.recommendation || 'Start',
      summary: p.summary || p.reason || '',
      ownership: num(p.ownership ?? 0, 0),
      ppg: num(p.ppg ?? 0, 0),
      points: num(p.points ?? 0, 0),
      minutes: num(p.minutes ?? 0, 0),
      starts: num(p.starts ?? 0, 0),
      goals: num(p.goals ?? 0, 0),
      assists: num(p.assists ?? 0, 0),
      clean_sheets: num(p.clean_sheets ?? 0, 0)
    });

    const starting = startingRaw.map(normalize);
    const bench = benchRaw.map(normalize);

    const projectedTeamPoints = num(
      weekly.projected_team_points,
      Math.round(starting.reduce((sum, p) => sum + num(p.expected_points, 0), 0) + num(captain.expected_points, 0))
    );

    const weeklyCall = text(
      weekly.immediate_call,
      `Captain ${captain.player || 'your best attacker'} and keep ${viceCaptain.player || 'your best vice'} as vice captain.`
    );

    const whyBullets = toArray(weekly.why_this_works).length
      ? toArray(weekly.why_this_works)
      : [
          `£${squadCost.toFixed(1)}m spent, £${bankValue.toFixed(1)}m left.`,
          `Formation set to ${formation}.`,
          `Captain: ${captain.player || '—'}. Vice captain: ${viceCaptain.player || '—'}.`
        ];

    const currentSquadMap = new Map([...starting, ...bench].map(p => [p.player, p]));

    const transferWatch = toArray(weekly.transfer_watch).map(item => {
      const sell = item.sell || item.out || '';
      const buy = item.buy || item.in || '';
      const sellPlayer = currentSquadMap.get(sell);
      const buyPrice = num(item.buy_price ?? item.price_in ?? item.buy_cost ?? NaN, NaN);
      const sellPrice = num(item.sell_price ?? item.price_out ?? item.sell_cost ?? (sellPlayer ? sellPlayer.price : NaN), NaN);
      return {
        sell,
        buy,
        sell_team: item.sell_team || sellPlayer?.team || '',
        buy_team: item.buy_team || '',
        position: item.position || sellPlayer?.position || '',
        why_sell: item.why_sell || '',
        why_buy: item.why_buy || '',
        expected_points_out: num(item.expected_points_out, sellPlayer?.expected_points ?? 0),
        expected_points_in: num(item.expected_points_in, 0),
        sell_price: sellPrice,
        buy_price: buyPrice
      };
    });

    const chipWatch = isObj(weekly.chip_watch) ? weekly.chip_watch : {};

    document.getElementById('gwPill').textContent = `Gameweek ${num(data.metadata?.gameweek, 1)}`;
    document.getElementById('updatedText').textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('teamValue').textContent = teamValueText;
    document.getElementById('bankValue').textContent = `£${bankValue.toFixed(1)}m`;
    document.getElementById('formationValue').textContent = formation;
    document.getElementById('projectedPoints').textContent = projectedTeamPoints.toString();
    document.getElementById('nextMoveText').textContent = weeklyCall;
    document.getElementById('heroSub').textContent = `Base squad locked for the season. Weekly advice updates only.`;
    document.getElementById('callMeta').textContent = `Captain: ${captain.player || '—'} • Vice: ${viceCaptain.player || '—'}`;

    const pintLink = 'upi://pay?pa=dwarakhanath.sekar@ybl&pn=Dwarakhanath%20Sekar&am=2&cu=INR&tn=Buy%20me%20a%20pint';
    const pintBtn = document.getElementById('pintBtn');
    if (pintBtn) pintBtn.setAttribute('href', pintLink);

    const renderShirt = (team) => {
      const colors = {
        Arsenal: '#EF0107', 'Aston Villa': '#7B0033', Bournemouth: '#DA291C', Brentford: '#E30613',
        Brighton: '#0057B8', Burnley: '#6C1D45', Chelsea: '#034694', 'Crystal Palace': '#1B458F',
        Everton: '#003399', Fulham: '#D9D9D9', Liverpool: '#C8102E', Luton: '#F78F1E',
        'Man City': '#6CABDD', 'Man Utd': '#DA291C', Newcastle: '#241F20', "Nott'm Forest": '#DA291C',
        Spurs: '#FFFFFF', 'West Ham': '#7A263A', Wolves: '#FDB913', Leeds: '#FFCD00', Leicester: '#003090',
        Southampton: '#D71920', Watford: '#FBEE23', Coventry: '#5B9BD5', Ipswich: '#0053A0'
      };
      return colors[team] || '#0f7a54';
    };

    const smartSummary = (p) => {
      const raw = String(p.summary || '').trim();
      if (raw && raw !== 'No extra note available.') return raw;

      const pos = String(p.position || '').toUpperCase();
      const own = num(p.ownership, 0);
      const ppg = num(p.ppg, 0);
      const goals = num(p.goals, 0);
      const assists = num(p.assists, 0);
      const cs = num(p.clean_sheets, 0);
      const pts = Math.round(num(p.expected_points, 0));

      if (pos === 'GK') {
        const bits = ['Safe goalkeeping slot'];
        if (num(p.points, 0) > 0) bits.push(`${Math.round(num(p.points, 0))} season points`);
        if (num(p.starts, 0) > 0) bits.push(`${Math.round(num(p.starts, 0))} starts`);
        return bits.slice(0, 3).join(' • ');
      }
      if (pos === 'DEF') {
        const bits = [];
        if (cs >= 10) bits.push('Clean-sheet threat');
        if (goals >= 2) bits.push('Set-piece threat');
        if (own >= 20) bits.push('Trusted pick');
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
        if (!bits.length) bits.push('Forward threat');
        return bits.slice(0, 3).join(' • ');
      }
      if (pts >= 8) return `Projected ${pts} pts • Strong weekly output`;
      if (pts >= 6) return `Projected ${pts} pts • Solid weekly output`;
      return `Projected ${pts} pts`;
    };

    const getLayout = (form) => {
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
      return layouts[form] || layouts['3-5-2'];
    };

    const layout = getLayout(formation);
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    starting.forEach(p => {
      if (grouped[p.position]) grouped[p.position].push(p);
    });
    Object.keys(grouped).forEach(pos => {
      grouped[pos].sort((a, b) => b.expected_points - a.expected_points || b.ownership - a.ownership);
    });

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const pitchItems = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      grouped[pos].forEach((p, i) => {
        const coord = layout[pos][i] || { x: 50, y: 50 };
        pitchItems.push({ ...p, coord });
      });
    });

    const pitchArea = document.getElementById('pitchArea');
    pitchArea.innerHTML = pitchItems.map(p => {
      const isCaptain = p.player === captain.player;
      const isVice = p.player === viceCaptain.player;

      if (isMobile) {
        return `
          <div class="slot" style="left:${p.coord.x}%; top:${p.coord.y}%; width:84px;">
            <div class="button-token" style="background:${renderShirt(p.team)}">
              <span class="button-token-letter">${esc((p.player || '?').slice(0,1).toUpperCase())}</span>
              ${isCaptain ? '<span class="button-badge button-c">C</span>' : ''}
              ${isVice ? '<span class="button-badge button-vc">VC</span>' : ''}
            </div>
            <div class="pitch-card button-card">
              <div class="pitch-name">${esc(p.player)}</div>
              <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
              <div class="pitch-points">${Math.round(p.expected_points)} pts</div>
            </div>
          </div>
        `;
      }

      return `
        <div class="slot" style="left:${p.coord.x}%; top:${p.coord.y}%;">
          <div class="shirt-wrap">
            <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
              <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${renderShirt(p.team)}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
              <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.18)" />
              <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.10)" />
            </svg>
            ${isCaptain ? '<span class="badge badge-c">C</span>' : ''}
            ${isVice ? '<span class="badge badge-vc">VC</span>' : ''}
          </div>
          <div class="pitch-card">
            <div class="pitch-name">${esc(p.player)}</div>
            <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
            <div class="pitch-points">${Math.round(p.expected_points)} pts</div>
          </div>
        </div>
      `;
    }).join('');

    const subsRow = document.getElementById('subsRow');
    if (bench.length) {
      subsRow.innerHTML = bench.map((p, idx) => {
        if (isMobile) {
          return `
            <div class="sub-card sub-pill">
              <div class="button-token small-token" style="background:${renderShirt(p.team)}">
                <span class="button-token-letter">${esc((p.player || '?').slice(0,1).toUpperCase())}</span>
              </div>
              <div class="pitch-name">${esc(p.player)}</div>
              <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
              <div class="pitch-points">${Math.round(p.expected_points)} pts</div>
              <div class="pitch-subline">${idx + 1}. Bench order</div>
            </div>
          `;
        }
        return `
          <div class="sub-card">
            <div class="shirt-wrap">
              <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
                <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${renderShirt(p.team)}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
                <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.18)" />
                <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.10)" />
              </svg>
            </div>
            <div class="pitch-name">${esc(p.player)}</div>
            <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
            <div class="pitch-points">${Math.round(p.expected_points)} pts</div>
            <div class="pitch-subline">${idx + 1}. Bench order</div>
          </div>
        `;
      }).join('');
    } else {
      subsRow.innerHTML = `<div class="empty-state">No bench players found in the JSON.</div>`;
    }

    const transferWatchEl = document.getElementById('transferWatch');
    if (transferWatch.length) {
      transferWatchEl.innerHTML = transferWatch.map(item => {
        const gain = Math.max(0, item.expected_points_in - item.expected_points_out);
        const sellPrice = Number.isFinite(item.sell_price) ? `£${item.sell_price.toFixed(1)}m` : '£—';
        const buyPrice = Number.isFinite(item.buy_price) ? `£${item.buy_price.toFixed(1)}m` : '£—';
        return `
          <div class="transfer-card">
            <div class="transfer-side">
              <div class="label">Out</div>
              <div class="name">${esc(item.sell)}</div>
              <div class="meta">${sellPrice} • ${esc(item.sell_team)} • ${esc(item.position)}</div>
              <div class="meta">${esc(item.why_sell || '')}</div>
            </div>
            <div>
              <div class="transfer-arrow">→</div>
              <div class="transfer-gain">+${gain} pts</div>
            </div>
            <div class="transfer-side">
              <div class="label">In</div>
              <div class="name">${esc(item.buy)}</div>
              <div class="meta">${buyPrice} • ${esc(item.buy_team || 'Target') } • ${esc(item.position)}</div>
              <div class="meta">${esc(item.why_buy || '')}</div>
            </div>
          </div>
        `;
      }).join('');
    } else {
      transferWatchEl.innerHTML = `<div class="empty-state">No clear transfer move right now. Keep the base squad and hold the free transfer.</div>`;
    }

    const chipWatchEl = document.getElementById('chipWatch');
    const chipConfig = [
      {
        name: 'Triple Captain',
        status: text(chipWatch.triple_captain?.status, 'wait'),
        reason: text(chipWatch.triple_captain?.reason, 'Use when your captain is the best ceiling pick and the fixture is kind.')
      },
      {
        name: 'Bench Boost',
        status: text(chipWatch.bench_boost?.status, 'wait'),
        reason: text(chipWatch.bench_boost?.reason, 'Use when the bench has proper starter-level points, not just bodies.')
      },
      {
        name: 'Wildcard',
        status: text(chipWatch.free_hit?.status, 'not needed'),
        reason: text(chipWatch.free_hit?.reason, 'Use when the squad needs a full reset, not just a single transfer.')
      },
      {
        name: 'Free Hit',
        status: text(chipWatch.free_hit?.status, 'not needed'),
        reason: text(chipWatch.free_hit?.reason, 'Use for one awkward week when the normal squad shape breaks down.')
      }
    ];

    chipWatchEl.innerHTML = chipConfig.map(item => {
      const status = item.status.toLowerCase();
      const cls = status === 'ready' ? 'chip-ready' : status === 'watch' || status === 'consider' ? 'chip-watch' : 'chip-no';
      return `
        <div class="chip-item ${cls}">
          <div class="chip-name">${esc(item.name)}</div>
          <div class="chip-status">${esc(item.status.toUpperCase())}</div>
          <div class="chip-reason">${esc(item.reason)}</div>
        </div>
      `;
    }).join('');

    const focusCardsEl = document.getElementById('focusCards');
    const focusCards = [
      {
        role: 'Captain',
        name: captain.player || '—',
        summary: smartSummary(captain),
        meta: `${captain.team || '—'} • ${Math.round(num(captain.expected_points, 0))} pts`
      },
      {
        role: 'Vice captain',
        name: viceCaptain.player || '—',
        summary: smartSummary(viceCaptain),
        meta: `${viceCaptain.team || '—'} • ${Math.round(num(viceCaptain.expected_points, 0))} pts`
      }
    ];

    if (transferWatch[0]) {
      focusCards.push({
        role: 'Transfer out',
        name: transferWatch[0].sell,
        summary: `${transferWatch[0].why_sell || 'Exit the weak spot.'} ${Number.isFinite(transferWatch[0].sell_price) ? `Current price: £${transferWatch[0].sell_price.toFixed(1)}m.` : ''}`.trim(),
        meta: `${transferWatch[0].sell_team || '—'} • ${transferWatch[0].position || '—'}`
      });
      focusCards.push({
        role: 'Transfer in',
        name: transferWatch[0].buy,
        summary: `${transferWatch[0].why_buy || 'Upgrade the slot.'} ${Number.isFinite(transferWatch[0].buy_price) ? `Price: £${transferWatch[0].buy_price.toFixed(1)}m.` : ''}`.trim(),
        meta: `${transferWatch[0].buy_team || 'Target'} • ${transferWatch[0].position || '—'}`
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

    document.getElementById('heroSub').textContent =
      `Base squad locked for the season. This week is only about transfers, captaincy, chips, and bench order.`;
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;font-family:Inter, sans-serif">Failed to load dashboard.json</div>';
  });
