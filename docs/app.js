(() => {
  const DASHBOARD_URLS = ['./dashboard.json', './docs/dashboard.json'];
  const PINT_AMOUNT = 119;

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

  const setHtml = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
  };

  const fetchDashboard = async () => {
    let lastErr = null;
    for (const url of DASHBOARD_URLS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          lastErr = new Error(`${url} returned ${res.status}`);
          continue;
        }
        return await res.json();
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Unable to load dashboard.json');
  };

  const fitPlayersByPosition = (players, formation) => {
    const layouts = {
      '3-5-2': {
        GK: [{ x: 50, y: 14 }],
        DEF: [{ x: 22, y: 36 }, { x: 50, y: 36 }, { x: 78, y: 36 }],
        MID: [{ x: 10, y: 60 }, { x: 30, y: 60 }, { x: 50, y: 60 }, { x: 70, y: 60 }, { x: 90, y: 60 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      },
      '3-4-3': {
        GK: [{ x: 50, y: 14 }],
        DEF: [{ x: 20, y: 36 }, { x: 50, y: 36 }, { x: 80, y: 36 }],
        MID: [{ x: 14, y: 60 }, { x: 38, y: 60 }, { x: 62, y: 60 }, { x: 86, y: 60 }],
        FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
      },
      '4-4-2': {
        GK: [{ x: 50, y: 14 }],
        DEF: [{ x: 16, y: 36 }, { x: 38, y: 36 }, { x: 62, y: 36 }, { x: 84, y: 36 }],
        MID: [{ x: 16, y: 60 }, { x: 38, y: 60 }, { x: 62, y: 60 }, { x: 84, y: 60 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      },
      '4-3-3': {
        GK: [{ x: 50, y: 14 }],
        DEF: [{ x: 16, y: 36 }, { x: 38, y: 36 }, { x: 62, y: 36 }, { x: 84, y: 36 }],
        MID: [{ x: 20, y: 60 }, { x: 50, y: 60 }, { x: 80, y: 60 }],
        FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
      },
      '5-3-2': {
        GK: [{ x: 50, y: 14 }],
        DEF: [{ x: 10, y: 36 }, { x: 30, y: 36 }, { x: 50, y: 36 }, { x: 70, y: 36 }, { x: 90, y: 36 }],
        MID: [{ x: 20, y: 60 }, { x: 50, y: 60 }, { x: 80, y: 60 }],
        FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
      }
    };
    return layouts[formation] || layouts['3-5-2'];
  };

  const shirtColor = (team) => {
    const colors = {
      Arsenal: '#EF0107', 'Aston Villa': '#7B0033', Bournemouth: '#DA291C', Brentford: '#E30613',
      Brighton: '#0057B8', Burnley: '#6C1D45', Chelsea: '#034694', 'Crystal Palace': '#1B458F',
      Everton: '#003399', Fulham: '#D9D9D9', Liverpool: '#C8102E', Luton: '#F78F1E',
      'Man City': '#6CABDD', 'Man Utd': '#DA291C', Newcastle: '#241F20', "Nott'm Forest": '#DA291C',
      Spurs: '#FFFFFF', 'West Ham': '#7A263A', Wolves: '#FDB913', Leeds: '#FFCD00', Leicester: '#003090',
      Southampton: '#D71920', Watford: '#FBEE23', Coventry: '#5B9BD5', Ipswich: '#0053A0', Sunderland: '#118C5A',
      Bournemouth: '#DA291C', Brighton: '#0057B8'
    };
    return colors[team] || '#0f7a54';
  };

  const buildSummary = (p, role = 'Start') => {
    const name = String(p.player || 'Player');
    const team = String(p.team || '');
    const pos = String(p.position || '').toUpperCase();
    const exp = Math.round(num(p.expected_points, 0));
    const owned = num(p.ownership, 0);
    const ppg = num(p.ppg, 0);
    const starts = num(p.starts, 0);
    const points = num(p.points, 0);
    const minutes = num(p.minutes, 0);
    const goals = num(p.goals, 0);
    const assists = num(p.assists, 0);
    const cs = num(p.clean_sheets, 0);

    if (role === 'Captain') {
      const parts = [
        `Captain call: ${name}.`,
        `Highest weekly upside in the squad at ${exp} projected points.`,
        minutes > 0 ? `${Math.round(minutes)} minutes played so far; expected to stay close to a full match.` : null,
        owned > 0 ? `${owned.toFixed(1)}% owned by managers, so it still carries the right balance of safety and leverage.` : null,
        goals > 0 || assists > 0 ? `Attacking output is already in the record: ${Math.round(goals)} goals and ${Math.round(assists)} assists.` : null
      ].filter(Boolean);
      return parts.join(' ');
    }

    if (role === 'Vice captain') {
      const parts = [
        `Vice-captain support: ${name}.`,
        `Clean fallback if the armband player is rotated or blanked.`,
        exp > 0 ? `Projected ${exp} weekly points and reliable involvement.` : null,
        owned > 0 ? `Owned by ${owned.toFixed(1)}% of managers, which makes it a sensible safety play.` : null
      ].filter(Boolean);
      return parts.join(' ');
    }

    if (pos === 'GK') {
      return [
        `${name} gives a stable goalkeeping slot for ${team}.`,
        `The case for him is simple: ${points > 0 ? `${Math.round(points)} career points, ` : ''}${starts > 0 ? `${Math.round(starts)} starts, ` : ''}${owned > 0 ? `${owned.toFixed(1)}% owned, ` : ''}and a structure that keeps the defence stable.`
      ].join(' ');
    }

    if (pos === 'DEF') {
      const bits = [];
      if (cs >= 10) bits.push(`${Math.round(cs)} clean sheets already`);
      if (goals > 0) bits.push(`${Math.round(goals)} goals from set-piece threat`);
      if (owned > 0) bits.push(`${owned.toFixed(1)}% owned`);
      return [
        `${name} is here because the defender has real weekly value, not just a shirt on the pitch.`,
        bits.length ? `The numbers behind him are ${bits.join(', ')}.` : `He fits the team shape and gives a safe route to steady returns.`,
        exp > 0 ? `Projected around ${exp} points this week.` : null
      ].filter(Boolean).join(' ');
    }

    if (pos === 'MID') {
      const bits = [];
      if (goals > 0) bits.push(`${Math.round(goals)} goals`);
      if (assists > 0) bits.push(`${Math.round(assists)} assists`);
      if (ppg > 0) bits.push(`${ppg.toFixed(1)} points per game`);
      if (owned > 0) bits.push(`${owned.toFixed(1)}% owned`);
      return [
        `${name} is a midfield pick because the player combines output with repeatability.`,
        bits.length ? `The case is built on ${bits.join(', ')}.` : `The role in the team is strong enough to justify the slot.`,
        exp > 0 ? `This week projects at ${exp} points.` : null
      ].filter(Boolean).join(' ');
    }

    if (pos === 'FWD') {
      const bits = [];
      if (goals > 0) bits.push(`${Math.round(goals)} goals`);
      if (assists > 0) bits.push(`${Math.round(assists)} assists`);
      if (starts > 0) bits.push(`${Math.round(starts)} starts`);
      if (owned > 0) bits.push(`${owned.toFixed(1)}% owned`);
      return [
        `${name} is the forward slot because the team needs real penalty-box threat.`,
        bits.length ? `He brings ${bits.join(', ')} and gives the squad a route to goals.` : `The weekly role is strong enough to keep him in the XI.`,
        exp > 0 ? `Projected about ${exp} points this week.` : null
      ].filter(Boolean).join(' ');
    }

    return [
      `${name} is in the squad for weekly value and structure.`,
      exp > 0 ? `Projected ${exp} points.` : null,
      owned > 0 ? `Owned by ${owned.toFixed(1)}% of managers.` : null,
      ppg > 0 ? `${ppg.toFixed(1)} points per game so far.` : null
    ].filter(Boolean).join(' ');
  };

  const buildTransferReason = (item) => {
    const gain = Math.max(0, num(item.expected_points_in, 0) - num(item.expected_points_out, 0));
    const sell = item.sell || 'the outgoing player';
    const buy = item.buy || 'the incoming player';
    const sellPrice = num(item.sell_price, NaN);
    const buyPrice = num(item.buy_price, NaN);
    const reasonOut = item.why_sell || 'The slot can be upgraded without hurting the squad shape.';
    const reasonIn = item.why_buy || 'The incoming player gives better weekly value.';
    return {
      gain,
      sellPrice: Number.isFinite(sellPrice) ? `£${sellPrice.toFixed(1)}m` : '£—',
      buyPrice: Number.isFinite(buyPrice) ? `£${buyPrice.toFixed(1)}m` : '£—',
      title: `${sell} → ${buy}`,
      text: `${reasonOut} ${reasonIn}`.trim()
    };
  };

  const renderChip = (name, obj) => {
    const statusRaw = text(obj?.status, 'wait').toLowerCase();
    const reason = text(obj?.reason, '');
    const cls = statusRaw === 'ready' ? 'chip-ready' : (statusRaw === 'watch' || statusRaw === 'consider') ? 'chip-watch' : 'chip-no';
    const status = statusRaw === 'ready' ? 'READY' : statusRaw === 'watch' ? 'WATCH' : statusRaw === 'consider' ? 'CONSIDER' : 'WAIT';
    return `
      <div class="chip-item ${cls}">
        <div class="chip-name">${esc(name)}</div>
        <div class="chip-status">${esc(status)}</div>
        <div class="chip-reason">${esc(reason)}</div>
      </div>
    `;
  };

  const buildPlayerNotes = (starting, captain, vice, transfers) => {
    const players = [];
    const captainName = captain?.player;
    const viceName = vice?.player;
    const topStarters = [...starting].sort((a, b) => num(b.expected_points, 0) - num(a.expected_points, 0)).slice(0, 4);

    if (captain) players.push({ role: 'Captain', player: captain, summary: buildSummary(captain, 'Captain') });
    if (vice) players.push({ role: 'Vice captain', player: vice, summary: buildSummary(vice, 'Vice captain') });
    for (const p of topStarters) {
      if (players.length >= 6) break;
      if (p.player === captainName || p.player === viceName) continue;
      players.push({ role: 'Starting XI', player: p, summary: buildSummary(p, 'Start') });
    }
    if (transfers[0]) {
      const buy = transfers[0];
      players.push({
        role: 'Transfer watch',
        player: { player: buy.buy, team: buy.buy_team, position: buy.position, expected_points: buy.expected_points_in, ownership: 0, ppg: 0, points: 0, minutes: 0, starts: 0, goals: 0, assists: 0, clean_sheets: 0 },
        summary: buildSummary({ player: buy.buy, team: buy.buy_team, position: buy.position, expected_points: buy.expected_points_in, ownership: 0, ppg: 0, points: 0, minutes: 0, starts: 0, goals: 0, assists: 0, clean_sheets: 0 }, 'Start')
      });
    }
    return players;
  };

  const renderPitchItem = (p, coord, isMobile, isCaptain, isVice) => {
    const accent = shirtColor(p.team);
    if (isMobile) {
      return `
        <div class="slot" style="left:${coord.x}%; top:${coord.y}%; width:64px;">
          <div class="button-token small-token" style="background:${accent}">
            <span class="button-token-letter">${esc((p.player || '?').slice(0,1).toUpperCase())}</span>
            ${isCaptain ? '<span class="button-badge button-c">C</span>' : ''}
            ${isVice ? '<span class="button-badge button-vc">VC</span>' : ''}
          </div>
          <div class="mobile-chip">${esc(p.player)} • ${Math.round(num(p.expected_points, 0))} pts</div>
        </div>
      `;
    }
    return `
      <div class="slot" style="left:${coord.x}%; top:${coord.y}%;">
        <div class="shirt-wrap">
          <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
            <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${accent}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
            <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.18)" />
            <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.10)" />
          </svg>
          ${isCaptain ? '<span class="badge badge-c">C</span>' : ''}
          ${isVice ? '<span class="badge badge-vc">VC</span>' : ''}
        </div>
        <div class="pitch-card">
          <div class="pitch-name">${esc(p.player)}</div>
          <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
          <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
          <div class="owned-pill">Owned by ${num(p.ownership, 0).toFixed(1)}%</div>
          <div class="stat-pill">PPG ${num(p.ppg, 0).toFixed(1)}</div>
        </div>
      </div>
    `;
  };

  const renderSubCard = (p, idx, isMobile) => {
    if (isMobile) {
      return `
        <div class="sub-card sub-pill">
          <div class="button-token small-token" style="background:${shirtColor(p.team)}">
            <span class="button-token-letter">${esc((p.player || '?').slice(0,1).toUpperCase())}</span>
          </div>
          <div class="pitch-name">${esc(p.player)}</div>
          <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
          <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
          <div class="mobile-chip">Bench ${idx + 1}</div>
        </div>
      `;
    }
    return `
      <div class="sub-card">
        <div class="shirt-wrap">
          <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
            <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${shirtColor(p.team)}" stroke="rgba(255,255,255,0.65)" stroke-width="2" />
            <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.18)" />
            <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.10)" />
          </svg>
        </div>
        <div class="pitch-name">${esc(p.player)}</div>
        <div class="pitch-subline">${esc(p.team)} • ${esc(p.position)}</div>
        <div class="pitch-points">${Math.round(num(p.expected_points, 0))} pts</div>
        <div class="owned-pill">Owned by ${num(p.ownership, 0).toFixed(1)}%</div>
        <div class="stat-pill">PPG ${num(p.ppg, 0).toFixed(1)}</div>
      </div>
    `;
  };

  const render = async () => {
    const data = await fetchDashboard();
    const metadata = isObj(data.metadata) ? data.metadata : {};
    const currentTeam = isObj(data.current_team) ? data.current_team : {};
    const recommendation = isObj(data.recommendation) ? data.recommendation : {};
    const weekly = isObj(data.weekly_advice) ? data.weekly_advice : {};
    const services = isObj(data.services) ? data.services : {};
    const judge = isObj(data.judge) ? data.judge : {};

    const startingRaw = toArray(recommendation.starting_xi);
    const benchRaw = toArray(recommendation.bench);
    const captain = isObj(recommendation.captain) ? recommendation.captain : {};
    const vice = isObj(recommendation.vice_captain) ? recommendation.vice_captain : {};
    const formation = text(recommendation.formation, currentTeam.formation, '3-5-2');
    const teamValue = text(metadata.team_value, currentTeam.squad_value ? `£${num(currentTeam.squad_value).toFixed(1)}m` : '£0.0m');
    const bank = text(currentTeam.bank !== undefined ? `£${num(currentTeam.bank).toFixed(1)}m` : '', '£0.0m');
    const projectedTeamPoints = num(
      weekly.projected_team_points ?? weekly.projected_starting_xi_points ?? data.projected_team_points,
      startingRaw.reduce((s, p) => s + num(p.expected_points, 0), 0)
    );

    const immediateCall = text(
      weekly.headline,
      weekly.immediate_call,
      weekly.transfer_call?.action ? `${weekly.transfer_call.action}.` : '',
      'Loading...'
    );

    setText('projectedPoints', String(Math.round(projectedTeamPoints)));
    setText('teamValue', teamValue);
    setText('bankValue', bank);
    setText('formationValue', formation);
    setText('nextMoveText', immediateCall);
    setText('callMeta', `Captain: ${text(captain.player, '—')} • Vice: ${text(vice.player, '—')}`);

    const teamNote = currentTeam.team_name || metadata.team_name || 'Recommended base squad';
    setHtml('heroSub', '');

    const teamIdInput = document.getElementById('teamIdInput');
    const teamIdStatus = document.getElementById('teamIdStatus');
    const savedTeamId = localStorage.getItem('kpfc_team_id') || '';
    if (teamIdInput) teamIdInput.value = savedTeamId;
    if (teamIdStatus) teamIdStatus.textContent = savedTeamId ? `Saved team ID: ${savedTeamId}` : 'No team ID saved yet.';

    const saveBtn = document.getElementById('teamIdSaveBtn');
    if (saveBtn && teamIdInput) {
      saveBtn.onclick = () => {
        const value = String(teamIdInput.value || '').trim();
        if (value) {
          localStorage.setItem('kpfc_team_id', value);
          if (teamIdStatus) teamIdStatus.textContent = `Saved team ID: ${value}`;
        } else {
          localStorage.removeItem('kpfc_team_id');
          if (teamIdStatus) teamIdStatus.textContent = 'No team ID saved yet.';
        }
      };
    }

    const pintBtn = document.getElementById('pintBtn');
    if (pintBtn) {
      pintBtn.setAttribute(
        'href',
        `upi://pay?pa=dwarakhanath.sekar@ybl&pn=Dwarakhanath%20Sekar&am=${PINT_AMOUNT}&cu=INR&tn=Buy%20me%20a%20pint`
      );
    }

    const startingPlayers = startingRaw.map(p => ({
      player: p.player || p.name || p.Player || 'Unknown',
      team: p.team || p.Team || '—',
      position: p.position || p.Position || '—',
      expected_points: num(p.expected_points ?? p.expected ?? 0, 0),
      ownership: num(p.ownership ?? 0, 0),
      ppg: num(p.ppg ?? 0, 0),
      points: num(p.points ?? 0, 0),
      minutes: num(p.minutes ?? 0, 0),
      starts: num(p.starts ?? 0, 0),
      goals: num(p.goals ?? 0, 0),
      assists: num(p.assists ?? 0, 0),
      clean_sheets: num(p.clean_sheets ?? 0, 0),
      recommendation: p.recommendation || 'Start',
      summary: p.summary || p.reason || ''
    }));

    const benchPlayers = benchRaw.map(p => ({
      player: p.player || p.name || p.Player || 'Unknown',
      team: p.team || p.Team || '—',
      position: p.position || p.Position || '—',
      expected_points: num(p.expected_points ?? p.expected ?? 0, 0),
      ownership: num(p.ownership ?? 0, 0),
      ppg: num(p.ppg ?? 0, 0),
      points: num(p.points ?? 0, 0),
      minutes: num(p.minutes ?? 0, 0),
      starts: num(p.starts ?? 0, 0),
      goals: num(p.goals ?? 0, 0),
      assists: num(p.assists ?? 0, 0),
      clean_sheets: num(p.clean_sheets ?? 0, 0),
      recommendation: p.recommendation || 'Bench',
      summary: p.summary || p.reason || ''
    }));

    const layout = fitPlayersByPosition(startingPlayers, formation);
    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    startingPlayers.forEach(p => {
      const pos = String(p.position || '').toUpperCase();
      if (grouped[pos]) grouped[pos].push(p);
    });
    Object.keys(grouped).forEach(pos => grouped[pos].sort((a, b) => num(b.expected_points, 0) - num(a.expected_points, 0) || num(b.ownership, 0) - num(a.ownership, 0)));

    const pitchItems = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      grouped[pos].forEach((p, i) => {
        pitchItems.push({ ...p, coord: layout[pos][i] || { x: 50, y: 50 } });
      });
    });

    const isMobile = window.matchMedia('(max-width: 760px)').matches;
    const pitchArea = document.getElementById('pitchArea');
    if (pitchArea) {
      pitchArea.innerHTML = pitchItems.map(p => {
        const isCaptain = p.player === text(captain.player, '');
        const isVice = p.player === text(vice.player, '');
        return renderPitchItem(p, p.coord, isMobile, isCaptain, isVice);
      }).join('');
    }

    const subsRow = document.getElementById('subsRow');
    if (subsRow) {
      subsRow.innerHTML = benchPlayers.length
        ? benchPlayers.map((p, idx) => renderSubCard(p, idx + 1, isMobile)).join('')
        : `<div class="empty-state">No bench players found in the JSON.</div>`;
    }

    const transferWatch = toArray(weekly.transfer_watch);
    const transferWatchEl = document.getElementById('transferWatch');
    if (transferWatchEl) {
      transferWatchEl.innerHTML = transferWatch.length
        ? transferWatch.map(item => {
            const t = buildTransferReason(item);
            return `
              <div class="transfer-card">
                <div class="transfer-side">
                  <div class="label">Out</div>
                  <div class="name">${esc(item.sell || '—')}</div>
                  <div class="meta">${esc(t.sellPrice)} • ${esc(item.sell_team || '')} • ${esc(item.position || '')}</div>
                  <div class="meta">${esc(item.why_sell || 'Current slot can be upgraded.')}</div>
                </div>
                <div>
                  <div class="transfer-arrow">→</div>
                  <div class="transfer-gain">+${t.gain} pts</div>
                </div>
                <div class="transfer-side">
                  <div class="label">In</div>
                  <div class="name">${esc(item.buy || '—')}</div>
                  <div class="meta">${esc(t.buyPrice)} • ${esc(item.buy_team || 'Target')} • ${esc(item.position || '')}</div>
                  <div class="meta">${esc(item.why_buy || 'Better weekly value.')}</div>
                </div>
              </div>
            `;
          }).join('')
        : `<div class="empty-state">No clear transfer move right now. Keep the squad shape and hold the free transfer.</div>`;
    }

    const chipWatchEl = document.getElementById('chipWatch');
    const chips = weekly.chip_watch || {};
    if (chipWatchEl) {
      chipWatchEl.innerHTML = [
        ['Triple Captain', chips.triple_captain],
        ['Bench Boost', chips.bench_boost],
        ['Wildcard', chips.wildcard],
        ['Free Hit', chips.free_hit]
      ].map(([name, obj]) => renderChip(name, obj)).join('');
    }

    const focusCardsEl = document.getElementById('focusCards');
    if (focusCardsEl) {
      const notes = buildPlayerNotes(startingPlayers, captain, vice, transferWatch);
      focusCardsEl.innerHTML = notes.length
        ? notes.map(note => `
            <article class="focus-card">
              <div class="topline">
                <div class="name">${esc(note.player.player || '—')}</div>
                <div class="role">${esc(note.role)}</div>
              </div>
              <div class="summary">${esc(note.summary)}</div>
              <div class="meta">${esc(note.player.team || '—')} • ${esc(note.player.position || '—')} • ${Math.round(num(note.player.expected_points, 0))} pts</div>
            </article>
          `).join('')
        : `<div class="empty-state">No player notes available yet.</div>`;
    }

    // Keep the page resilient and readable even if the backend is sparse.
    setText('projectedPoints', String(Math.round(projectedTeamPoints)));
    setText('callMeta', `Captain: ${text(captain.player, '—')} • Vice: ${text(vice.player, '—')}`);
    setText('teamValue', teamValue);
    setText('bankValue', bank);
    setText('formationValue', formation);

    const titleAnchor = document.querySelector('.brand-copy .brand-sub');
    if (titleAnchor && !titleAnchor.dataset.done) {
      titleAnchor.dataset.done = '1';
      titleAnchor.textContent = 'Weekly FPL briefing';
    }

    // If the backend is still sparse, keep the top card honest without adding an extra summary line.
    const statusLine = currentTeam.team_name || metadata.team_name || 'Recommended base squad';
    const accessCopy = document.querySelector('.access-copy p');
    if (accessCopy && !accessCopy.dataset.done) {
      accessCopy.dataset.done = '1';
      accessCopy.textContent = 'This page shows the recommended base squad for the gameweek until we receive your access. After that, the weekly advice switches to your own squad.';
    }
  };

  const boot = async () => {
    try {
      await render();
    } catch (err) {
      console.error(err);
      document.body.innerHTML = `
        <div style="padding:40px;font-family:Inter, sans-serif">
          <h2>Failed to load dashboard.json</h2>
          <pre style="white-space:pre-wrap">${esc(err && err.stack ? err.stack : String(err))}</pre>
        </div>
      `;
    }
  };

  boot();
})();
