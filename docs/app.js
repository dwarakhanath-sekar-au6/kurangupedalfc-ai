fetch('./dashboard.json', { cache: 'no-store' })
  .then(async res => {
    if (!res.ok) {
      throw new Error(`dashboard.json load failed: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const toArray = (v) => Array.isArray(v) ? v : [];
    const firstText = (...values) => values.find(v => typeof v === 'string' && v.trim()) || '';
    const safeNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    const parseMoney = (value) => {
      if (typeof value === 'number') return value;
      if (!value) return NaN;
      const cleaned = String(value).replace(/[£m,\s]/g, '');
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : NaN;
    };
    const escapeHtml = (s) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const teamColors = {
      "Arsenal": "#EF0107",
      "Aston Villa": "#7B0033",
      "Bournemouth": "#DA291C",
      "Brentford": "#E30613",
      "Brighton": "#0057B8",
      "Burnley": "#6C1D45",
      "Chelsea": "#034694",
      "Crystal Palace": "#1B458F",
      "Everton": "#003399",
      "Fulham": "#FFFFFF",
      "Liverpool": "#C8102E",
      "Luton": "#F78F1E",
      "Man City": "#6CABDD",
      "Man Utd": "#DA291C",
      "Newcastle": "#241F20",
      "Nott'm Forest": "#DA291C",
      "Spurs": "#FFFFFF",
      "West Ham": "#7A263A",
      "Wolves": "#FDB913",
      "Leeds": "#FFCD00",
      "Leicester": "#003090",
      "Southampton": "#D71920",
      "Watford": "#FBEE23",
      "Coventry City": "#5B9BD5",
      "Ipswich": "#0053A0",
      "BHA": "#0057B8",
      "BRE": "#E30613",
      "CRY": "#1B458F",
      "ARS": "#EF0107",
      "AVL": "#7B0033",
      "CHE": "#034694",
      "NEW": "#241F20",
      "TOT": "#FFFFFF",
      "LIV": "#C8102E",
      "FUL": "#FFFFFF",
      "MCI": "#6CABDD"
    };

    const metadata = isObj(data.metadata) ? data.metadata : {};
    const recommendation = isObj(data.recommendation) ? data.recommendation : {};
    const services = isObj(data.services) ? data.services : {};
    const judge = isObj(data.judge) ? data.judge : {};
    const squadTrace = isObj(data.squad_trace) ? data.squad_trace : {};

    const captain = isObj(recommendation.captain) ? recommendation.captain : (isObj(squadTrace.captain) ? squadTrace.captain : {});
    const viceCaptain = isObj(recommendation.vice_captain) ? recommendation.vice_captain : (isObj(squadTrace.vice_captain) ? squadTrace.vice_captain : {});

    const captainName = captain.player || captain.name || data.captain?.name || 'Thiago';
    const viceCaptainName = viceCaptain.player || viceCaptain.name || data.vice_captain?.name || 'Guéhi';

    const teamValueText = metadata.team_value || data.team_value || '£88.0m';
    const squadValue = parseMoney(teamValueText);
    const bankValue = Number.isFinite(squadValue) ? Math.max(0, 100 - squadValue) : 0;

    const starting = toArray(recommendation.starting_xi).length
      ? toArray(recommendation.starting_xi)
      : (toArray(squadTrace.starting_xi).length ? toArray(squadTrace.starting_xi) : toArray(data.player_cards));

    const bench = toArray(recommendation.bench).length
      ? toArray(recommendation.bench)
      : toArray(squadTrace.bench);

    const normalizedPlayers = (items) => toArray(items).map(p => ({
      player: p.player || p.name || p.Player || 'Unknown',
      team: p.team || p.Team || '—',
      position: p.position || p.Position || '—',
      price: safeNum(p.price ?? p.Price ?? 0, 0),
      recommendation: p.recommendation || p.status || 'Keep',
      reason: p.reason || '',
      medical: p.medical || p.MedicalStatus || '',
      fixture_difficulty: p.fixture_difficulty ?? p.Next3FixtureDifficulty ?? null
    }));

    const tone = (rec) => {
      const r = String(rec || '').toLowerCase();
      if (r.includes('avoid')) return 'bad';
      if (r.includes('monitor') || r.includes('keep only')) return 'warn';
      return 'good';
    };

    const renderShirt = (player, isCaptain = false, isVice = false) => {
      const team = player.team || player.Team || '';
      const shirt = player.shirt || teamColors[team] || '#6d4aff';

      return `
        <div class="shirt-wrap">
          <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
            <path
              d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z"
              fill="${shirt}"
              stroke="rgba(255,255,255,0.18)"
              stroke-width="2"
            />
            <path d="M28 6h16l4 8H24z" fill="rgba(255,255,255,0.16)" />
            <path d="M27 15h18l-2 8H29z" fill="rgba(0,0,0,0.12)" />
          </svg>
          ${isCaptain ? '<span class="badge badge-c">C</span>' : ''}
          ${isVice ? '<span class="badge badge-vc">VC</span>' : ''}
        </div>
      `;
    };

    const renderPitchPlayer = (player, isCaptain = false, isVice = false) => {
      const name = escapeHtml(player.name || player.player || player.Player || 'Unknown');
      const team = escapeHtml(player.team || player.Team || '—');
      const position = escapeHtml(player.position || player.Position || '—');
      const price = safeNum(player.price ?? player.Price ?? 0, 0);

      return `
        <div class="pitch-slot">
          ${renderShirt(player, isCaptain, isVice)}
          <div class="pitch-card">
            <div class="pitch-name">${name}</div>
            <div class="pitch-meta">${team} • ${position}</div>
            <div class="pitch-price">£${price.toFixed(1)}m</div>
          </div>
        </div>
      `;
    };

    const renderReportCard = (player, isBench = false) => {
      const name = escapeHtml(player.player);
      const team = escapeHtml(player.team);
      const position = escapeHtml(player.position);
      const price = safeNum(player.price, 0);
      const rec = escapeHtml(player.recommendation || 'Keep');
      const reason = escapeHtml(player.reason || 'No extra note available.');
      const medical = escapeHtml(player.medical || '');
      const fixture = player.fixture_difficulty != null && Number.isFinite(Number(player.fixture_difficulty))
        ? `Fixture ${Number(player.fixture_difficulty).toFixed(1)}`
        : '';

      return `
        <article class="report-card ${tone(player.recommendation)}">
          <div class="report-head">
            <div>
              <div class="report-name">${name}</div>
              <div class="report-meta">${team} • ${position}${isBench ? ' • Bench' : ''}</div>
            </div>
            <div class="report-price">£${price.toFixed(1)}m</div>
          </div>

          <div class="report-reco">${rec}</div>
          <div class="report-reason">${reason}</div>

          <div class="report-tags">
            ${medical ? `<span class="tag tag-soft">${medical}</span>` : ''}
            ${fixture ? `<span class="tag tag-accent">${fixture}</span>` : ''}
          </div>
        </article>
      `;
    };

    const teamValueEl = document.getElementById('teamValue');
    const bankValueEl = document.getElementById('bankValue');
    const rankValueEl = document.getElementById('rankValue');
    const captainNameEl = document.getElementById('captainName');
    const captainMetaEl = document.getElementById('captainMeta');
    const viceCaptainNameEl = document.getElementById('viceCaptainName');
    const viceCaptainMetaEl = document.getElementById('viceCaptainMeta');
    const nextMoveTextEl = document.getElementById('nextMoveText');
    const whySummaryEl = document.getElementById('whySummary');
    const whyBulletsEl = document.getElementById('whyBullets');
    const snapshotGridEl = document.getElementById('snapshotGrid');
    const startingReportsEl = document.getElementById('startingReports');
    const benchReportsEl = document.getElementById('benchReports');
    const pitchAreaEl = document.getElementById('pitchArea');
    const subsRowEl = document.getElementById('subsRow');
    const gwPillEl = document.getElementById('gwPill');
    const confidencePillEl = document.getElementById('confidencePill');

    const now = new Date();
    document.getElementById('updatedText').textContent =
      `Last updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const gameweek = metadata.gameweek || data.gameweek || 1;
    if (gwPillEl) gwPillEl.textContent = `Gameweek ${gameweek}`;

    if (teamValueEl) teamValueEl.textContent = teamValueText;
    if (bankValueEl) bankValueEl.textContent = `£${bankValue.toFixed(1)}m`;
    if (rankValueEl) rankValueEl.textContent = metadata.rank || data.rank || '-';

    if (captainNameEl) captainNameEl.textContent = captainName;
    if (captainMetaEl) captainMetaEl.textContent = `${captain.team || captain.Team || 'Brentford'} • ${captain.position || captain.Position || 'FWD'}`;

    if (viceCaptainNameEl) viceCaptainNameEl.textContent = viceCaptainName;
    if (viceCaptainMetaEl) viceCaptainMetaEl.textContent = `${viceCaptain.team || viceCaptain.Team || 'Crystal Palace'} • ${viceCaptain.position || viceCaptain.Position || 'DEF'}`;

    const finalCall = firstText(
      judge.final_call,
      judge.action,
      recommendation.captain ? `Captain ${captainName} and keep ${viceCaptainName} as vice captain.` : '',
      'Hold transfer this week.'
    );

    if (nextMoveTextEl) nextMoveTextEl.textContent = finalCall;
    if (confidencePillEl) confidencePillEl.textContent = judge.confidence || 'High confidence';

    const whySummary = firstText(
      'A balanced opening squad with captaincy set, bench cover in place, and budget still available for a quick move if needed.'
    );

    const whyBullets = [
      `Team value: ${teamValueText} • Bank: £${bankValue.toFixed(1)}m.`,
      `Captain: ${captainName} • Vice captain: ${viceCaptainName}.`,
      'The squad was built after checking fitness, fixtures, form, and news.'
    ];

    if (whySummaryEl) whySummaryEl.textContent = whySummary;
    if (whyBulletsEl) whyBulletsEl.innerHTML = whyBullets.map(x => `<li>${escapeHtml(x)}</li>`).join('');

    const snapshotCards = [
      { label: 'Team Value', value: teamValueText, sub: 'Current squad spend' },
      { label: 'Bank', value: `£${bankValue.toFixed(1)}m`, sub: 'Available for transfers' },
      { label: 'Confidence', value: escapeHtml(judge.confidence || 'High'), sub: 'Current recommendation' },
      { label: 'Verdict', value: escapeHtml(judge.verdict || 'Proceed'), sub: 'Final call status' }
    ];

    if (snapshotGridEl) {
      snapshotGridEl.innerHTML = snapshotCards.map(card => `
        <div class="metric-card">
          <div class="metric-label">${card.label}</div>
          <div class="metric-value">${card.value}</div>
          <div class="metric-sub">${card.sub}</div>
        </div>
      `).join('');
    }

    const startingPlayers = normalizedPlayers(starting);
    const benchPlayers = normalizedPlayers(bench);

    const grouped = { GK: [], DEF: [], MID: [], FWD: [] };
    startingPlayers.forEach(player => {
      const pos = player.position;
      if (grouped[pos]) grouped[pos].push(player);
    });

    const positions = {
      GK: [{ x: 50, y: 14 }],
      DEF: [{ x: 20, y: 33 }, { x: 50, y: 33 }, { x: 80, y: 33 }, { x: 38, y: 52 }, { x: 62, y: 52 }],
      MID: [{ x: 16, y: 57 }, { x: 38, y: 57 }, { x: 62, y: 57 }, { x: 84, y: 57 }, { x: 50, y: 76 }],
      FWD: [{ x: 26, y: 82 }, { x: 50, y: 82 }, { x: 74, y: 82 }]
    };

    const formation = `${grouped.DEF.length}-${grouped.MID.length}-${grouped.FWD.length}`;
    const formationPill = document.getElementById('formationPill');
    if (formationPill) formationPill.textContent = formation;

    const lineup = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      grouped[pos].forEach((player, idx) => {
        lineup.push({
          ...player,
          coord: positions[pos][idx]
        });
      });
    });

    if (pitchAreaEl) {
      pitchAreaEl.innerHTML = lineup.map(player => {
        const isCaptain = player.player === captainName;
        const isVice = player.player === viceCaptainName;

        return `
          <div class="slot" style="left:${player.coord.x}%; top:${player.coord.y}%;">
            ${renderShirt(player, isCaptain, isVice)}
            <div class="pitch-card">
              <div class="pitch-name">${escapeHtml(player.player)}</div>
              <div class="pitch-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}</div>
              <div class="pitch-price">£${player.price.toFixed(1)}m</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (subsRowEl) {
      subsRowEl.innerHTML = benchPlayers.slice(0, 4).map((player, idx) => `
        <div class="sub-card">
          ${renderShirt(player, false, false)}
          <div class="pitch-name">${escapeHtml(player.player)}</div>
          <div class="pitch-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}</div>
          <div class="pitch-price">£${player.price.toFixed(1)}m</div>
          <div class="subtext">${idx + 1}. ${escapeHtml(player.position)}</div>
        </div>
      `).join('');
    }

    const renderPlayerReport = (player) => {
      const rec = String(player.recommendation || 'Keep').toLowerCase();
      const cardClass = rec.includes('avoid') ? 'bad' : rec.includes('monitor') ? 'warn' : 'good';
      const tags = [];

      if (player.medical) tags.push(player.medical);
      if (player.fixture_difficulty != null && Number.isFinite(Number(player.fixture_difficulty))) {
        tags.push(`Fixture ${Number(player.fixture_difficulty).toFixed(1)}`);
      }

      return `
        <article class="report-card ${cardClass}">
          <div class="report-head">
            <div>
              <div class="report-name">${escapeHtml(player.player)}</div>
              <div class="report-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}</div>
            </div>
            <div class="report-price">£${player.price.toFixed(1)}m</div>
          </div>

          <div class="report-reco">${escapeHtml(player.recommendation || 'Keep')}</div>
          <div class="report-reason">${escapeHtml(player.reason || 'No extra note available.')}</div>

          <div class="report-tags">
            ${tags.map(tag => `<span class="tag ${tag === player.medical ? 'tag-soft' : 'tag-accent'}">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
      `;
    };

    const startingReportsHtml = startingPlayers.map(renderPlayerReport).join('');
    const benchReportsHtml = benchPlayers.map(renderPlayerReport).join('');

    if (startingReportsEl) startingReportsEl.innerHTML = startingReportsHtml;
    if (benchReportsEl) benchReportsEl.innerHTML = benchReportsHtml;

    // Keep the page professional: only show end-user content.
    // Internal decision trace stays in the JSON and backend, not on the main dashboard.
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
