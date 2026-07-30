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
      Arsenal: '#EF0107',
      'Aston Villa': '#7B0033',
      Bournemouth: '#DA291C',
      Brentford: '#E30613',
      Brighton: '#0057B8',
      Burnley: '#6C1D45',
      Chelsea: '#034694',
      'Crystal Palace': '#1B458F',
      Everton: '#003399',
      Fulham: '#FFFFFF',
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
      'Coventry City': '#5B9BD5',
      Ipswich: '#0053A0',
      BHA: '#0057B8',
      BRE: '#E30613',
      CRY: '#1B458F',
      ARS: '#EF0107',
      AVL: '#7B0033',
      CHE: '#034694',
      NEW: '#241F20',
      TOT: '#FFFFFF',
      LIV: '#C8102E',
      FUL: '#FFFFFF',
      MCI: '#6CABDD',
      SUN: '#FFCD00'
    };

    const metadata = isObj(data.metadata) ? data.metadata : {};
    const planner = isObj(data.planner) ? data.planner : {};
    const services = isObj(data.services) ? data.services : {};
    const judge = isObj(data.judge) ? data.judge : {};
    const recommendation = isObj(data.recommendation) ? data.recommendation : {};
    const squadTrace = isObj(data.squad_trace) ? data.squad_trace : {};
    const managerNotes = isObj(data.manager_notes) ? data.manager_notes : {};
    const playerCards = toArray(data.player_cards);

    const captain = isObj(recommendation.captain) ? recommendation.captain : (isObj(squadTrace.captain) ? squadTrace.captain : {});
    const viceCaptain = isObj(recommendation.vice_captain) ? recommendation.vice_captain : (isObj(squadTrace.vice_captain) ? squadTrace.vice_captain : {});

    const captainName = captain.player || captain.name || 'Thiago';
    const viceCaptainName = viceCaptain.player || viceCaptain.name || 'Guéhi';

    const teamValueText = metadata.team_value || '£100.0m';
    const squadValue = parseMoney(teamValueText);
    const bankValue = Number.isFinite(squadValue) ? Math.max(0, 100 - squadValue) : 0;

    const startingRaw = toArray(recommendation.starting_xi).length
      ? toArray(recommendation.starting_xi)
      : (toArray(squadTrace.starting_xi).length ? toArray(squadTrace.starting_xi) : playerCards.slice(0, 11));

    const benchRaw = toArray(recommendation.bench).length
      ? toArray(recommendation.bench)
      : (toArray(squadTrace.bench).length ? toArray(squadTrace.bench) : playerCards.slice(11, 15));

    const normalizePlayer = (p) => ({
      player: p.player || p.name || p.Player || 'Unknown',
      team: p.team || p.Team || '—',
      position: p.position || p.Position || '—',
      price: safeNum(p.price ?? p.Price ?? 0, 0),
      recommendation: p.recommendation || p.status || 'Keep',
      reason: p.reason || 'No extra note available.',
      medical: p.medical || p.MedicalStatus || '',
      fixture_difficulty: p.fixture_difficulty ?? p.Next3FixtureDifficulty ?? null,
      selection_rating: safeNum(p.selection_rating ?? p.SelectionRating ?? p.score ?? p.FinalRating ?? 0, 0),
      form: safeNum(p.form ?? p.Form ?? 0, 0),
      ppg: safeNum(p.ppg ?? p.PPG ?? 0, 0),
      ownership: safeNum(p.ownership ?? p.Ownership ?? 0, 0),
      news: p.news || ''
    });

    const starting = toArray(startingRaw).map(normalizePlayer);
    const bench = toArray(benchRaw).map(normalizePlayer);

    const tone = (rec) => {
      const r = String(rec || '').toLowerCase();
      if (r.includes('avoid')) return 'bad';
      if (r.includes('monitor') || r.includes('keep only')) return 'warn';
      return 'good';
    };

    const renderShirt = (player, isCaptain = false, isVice = false) => {
      const team = player.team || '';
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

    const renderReportCard = (player, isBench = false) => {
      const rec = String(player.recommendation || 'Keep');
      const cardClass = tone(rec);

      const tags = [];
      if (player.medical) tags.push(`<span class="tag tag-soft">${escapeHtml(player.medical)}</span>`);
      if (player.fixture_difficulty != null && Number.isFinite(Number(player.fixture_difficulty))) {
        tags.push(`<span class="tag tag-accent">Fixture ${Number(player.fixture_difficulty).toFixed(1)}</span>`);
      }

      return `
        <article class="report-card ${cardClass}">
          <div class="report-head">
            <div>
              <div class="report-name">${escapeHtml(player.player)}</div>
              <div class="report-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}${isBench ? ' • Bench' : ''}</div>
            </div>
            <div class="report-price">£${player.price.toFixed(1)}m</div>
          </div>

          <div class="report-reco">${escapeHtml(rec)}</div>
          <div class="report-reason">${escapeHtml(player.reason)}</div>

          <div class="report-tags">
            ${tags.join('')}
          </div>
        </article>
      `;
    };

    const currentGw = metadata.gameweek || 1;

    const startingXIEl = document.getElementById('startingReports');
    const benchEl = document.getElementById('benchReports');
    const pitchAreaEl = document.getElementById('pitchArea');
    const subsRowEl = document.getElementById('subsRow');
    const whySummaryEl = document.getElementById('whySummary');
    const whyBulletsEl = document.getElementById('whyBullets');
    const snapshotGridEl = document.getElementById('snapshotGrid');

    document.getElementById('gwPill').textContent = `Gameweek ${currentGw}`;
    document.getElementById('updatedText').textContent =
      `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    document.getElementById('teamValue').textContent = teamValueText;
    document.getElementById('bankValue').textContent = `£${bankValue.toFixed(1)}m`;
    document.getElementById('rankValue').textContent = metadata.rank || '-';

    document.getElementById('captainName').textContent = captainName;
    document.getElementById('captainMeta').textContent = `${captain.team || 'Brentford'} • ${captain.position || 'FWD'}`;

    document.getElementById('viceCaptainName').textContent = viceCaptainName;
    document.getElementById('viceCaptainMeta').textContent = `${viceCaptain.team || 'Crystal Palace'} • ${viceCaptain.position || 'DEF'}`;

    const judgeVerdict = firstText(judge.verdict, 'High confidence');
    const judgeConfidence = firstText(judge.confidence, 'High');
    const judgeReason = firstText(judge.reason, 'Final recommendation produced.');
    const judgeCall = firstText(judge.final_call, judge.action, `Captain ${captainName} and keep ${viceCaptainName} as vice captain.`);

    document.getElementById('nextMoveText').textContent = judgeCall;
    document.getElementById('confidencePill').textContent = judgeConfidence;

    const formation = recommendation.formation || `${starting.filter(p => p.position === 'DEF').length}-${starting.filter(p => p.position === 'MID').length}-${starting.filter(p => p.position === 'FWD').length}`;

    document.getElementById('formationPill').textContent = formation;

    const whySummary = managerNotes.summary || `Balanced ${formation} build that uses the full budget, keeps a usable bench, and gives you a clear captain and vice captain.`;
    const whyBullets = managerNotes.bullets || [
      `£${squadValue.toFixed(1)}m spent, £${bankValue.toFixed(1)}m left.`,
      `Formation: ${formation}.`,
      `Captain: ${captainName}. Vice captain: ${viceCaptainName}.`
    ];

    if (whySummaryEl) whySummaryEl.textContent = whySummary;
    if (whyBulletsEl) whyBulletsEl.innerHTML = whyBullets.map(x => `<li>${escapeHtml(x)}</li>`).join('');

    const snapshotCards = [
      { label: 'Team Value', value: teamValueText, sub: 'Current squad spend' },
      { label: 'Bank', value: `£${bankValue.toFixed(1)}m`, sub: 'Available for transfers' },
      { label: 'Formation', value: formation, sub: 'Best shape for this squad' },
      { label: 'Verdict', value: `${judgeVerdict}`, sub: `Confidence: ${judgeConfidence}` }
    ];

    if (snapshotGridEl) {
      snapshotGridEl.innerHTML = snapshotCards.map(card => `
        <div class="metric-card">
          <div class="metric-label">${card.label}</div>
          <div class="metric-value">${escapeHtml(card.value)}</div>
          <div class="metric-sub">${escapeHtml(card.sub)}</div>
        </div>
      `).join('');
    }

    // Build pitch
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    starting.forEach(player => {
      if (groups[player.position]) groups[player.position].push(player);
    });

    const positions = {
      GK: [{ x: 50, y: 14 }],
      DEF: [{ x: 20, y: 33 }, { x: 50, y: 33 }, { x: 80, y: 33 }, { x: 38, y: 52 }, { x: 62, y: 52 }],
      MID: [{ x: 16, y: 57 }, { x: 38, y: 57 }, { x: 62, y: 57 }, { x: 84, y: 57 }, { x: 50, y: 76 }],
      FWD: [{ x: 26, y: 82 }, { x: 50, y: 82 }, { x: 74, y: 82 }]
    };

    const lineup = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      groups[pos].forEach((player, idx) => {
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
      subsRowEl.innerHTML = bench.slice(0, 4).map((player, idx) => `
        <div class="sub-card">
          ${renderShirt(player, false, false)}
          <div class="pitch-name">${escapeHtml(player.player)}</div>
          <div class="pitch-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}</div>
          <div class="pitch-price">£${player.price.toFixed(1)}m</div>
          <div class="subtext">${idx + 1}. ${escapeHtml(player.position)}</div>
        </div>
      `).join('');
    }

    if (startingXIEl) {
      startingXIEl.innerHTML = starting.map(p => renderReportCard(p, false)).join('');
    }

    if (benchEl) {
      benchEl.innerHTML = bench.map(p => renderReportCard(p, true)).join('');
    }
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
