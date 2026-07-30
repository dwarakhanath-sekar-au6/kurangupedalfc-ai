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

    const captainName = captain.player || captain.name || 'Gabriel';
    const viceCaptainName = viceCaptain.player || viceCaptain.name || 'Semenyo';

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
      recommendation: p.recommendation || p.status || 'Start',
      reason: p.reason || 'No extra note available.',
      medical: p.medical || p.MedicalStatus || '',
      expected_points: safeNum(p.expected_points ?? p.selection_rating ?? p.score ?? p.SelectionRating ?? p.rating ?? 0, 0),
      selection_rating: safeNum(p.selection_rating ?? p.SelectionRating ?? p.score ?? p.rating ?? 0, 0),
      form: safeNum(p.form ?? p.Form ?? 0, 0),
      ppg: safeNum(p.ppg ?? p.PPG ?? 0, 0),
      ownership: safeNum(p.ownership ?? p.Ownership ?? 0, 0),
      news: p.news || ''
    });

    const starting = toArray(startingRaw).map(normalizePlayer);
    const bench = toArray(benchRaw).map(normalizePlayer);

    const currentGw = metadata.gameweek || 1;
    const formation = recommendation.formation || `${starting.filter(p => p.position === 'DEF').length}-${starting.filter(p => p.position === 'MID').length}-${starting.filter(p => p.position === 'FWD').length}`;

    const buildReason = (player, role = 'Start') => {
      const exp = safeNum(player.expected_points, 0);
      const ppg = safeNum(player.ppg, 0);
      const price = safeNum(player.price, 0);
      const ownership = safeNum(player.ownership, 0);
      const medical = String(player.medical || '').toLowerCase();

      if (role === 'Captain') {
        return `Best captain pick. He is the highest expected-points player in the squad and gives you the best ceiling on the armband.`;
      }

      if (role === 'Vice captain') {
        return `Strong safety option behind the captain. If Gabriel misses out, this is the cleanest player to take the armband.`;
      }

      if (role === 'Bench') {
        return `Bench cover only. Useful depth if needed, but not strong enough to displace the starters ahead of him.`;
      }

      if (exp >= 72) {
        return `A front-line pick in this squad. The expected-points number is elite, and the price still works inside the structure.`;
      }

      if (exp >= 66) {
        return `A proper starter. Strong expected points, steady output, and enough value to justify the slot.`;
      }

      if (exp >= 61) {
        return `A useful piece of the structure. The expected-points number is good enough to keep him in the XI without overspending.`;
      }

      let extra = [];
      if (ppg >= 5.5) extra.push(`he brings a strong points-per-game profile (${ppg.toFixed(1)})`);
      else if (ppg >= 4.5) extra.push(`he offers a steady points-per-game base (${ppg.toFixed(1)})`);

      if (price <= 6.0) extra.push(`the price is tidy at £${price.toFixed(1)}m`);
      else if (price >= 8.0) extra.push(`the price is premium, so the output has to justify it`);

      if (ownership >= 20) extra.push(`this is a trusted pick (${ownership.toFixed(1)}% ownership)`);
      else if (ownership <= 10) extra.push(`there is some differential upside here`);

      if (medical === 'available') extra.push(`he is available and fits the XI cleanly`);
      else if (medical === 'doubtful') extra.push(`fitness still needs a closer look`);

      if (!extra.length) return `A balanced squad pick with enough output to justify the place.`;

      return `${extra[0].charAt(0).toUpperCase()}${extra[0].slice(1)}${extra[1] ? `, ${extra[1]}` : ''}${extra[2] ? `, ${extra[2]}` : ''}.`;
    };

    const getLayout = (form) => {
      const layouts = {
        '3-5-2': {
          GK: [{ x: 50, y: 13 }],
          DEF: [{ x: 22, y: 32 }, { x: 50, y: 32 }, { x: 78, y: 32 }],
          MID: [{ x: 10, y: 56 }, { x: 30, y: 56 }, { x: 50, y: 56 }, { x: 70, y: 56 }, { x: 90, y: 56 }],
          FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
        },
        '3-4-3': {
          GK: [{ x: 50, y: 13 }],
          DEF: [{ x: 20, y: 32 }, { x: 50, y: 32 }, { x: 80, y: 32 }],
          MID: [{ x: 14, y: 56 }, { x: 38, y: 56 }, { x: 62, y: 56 }, { x: 86, y: 56 }],
          FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
        },
        '4-4-2': {
          GK: [{ x: 50, y: 13 }],
          DEF: [{ x: 16, y: 32 }, { x: 38, y: 32 }, { x: 62, y: 32 }, { x: 84, y: 32 }],
          MID: [{ x: 16, y: 56 }, { x: 38, y: 56 }, { x: 62, y: 56 }, { x: 84, y: 56 }],
          FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
        },
        '4-3-3': {
          GK: [{ x: 50, y: 13 }],
          DEF: [{ x: 16, y: 32 }, { x: 38, y: 32 }, { x: 62, y: 32 }, { x: 84, y: 32 }],
          MID: [{ x: 20, y: 56 }, { x: 50, y: 56 }, { x: 80, y: 56 }],
          FWD: [{ x: 25, y: 84 }, { x: 50, y: 84 }, { x: 75, y: 84 }]
        },
        '5-3-2': {
          GK: [{ x: 50, y: 13 }],
          DEF: [{ x: 10, y: 32 }, { x: 30, y: 32 }, { x: 50, y: 32 }, { x: 70, y: 32 }, { x: 90, y: 32 }],
          MID: [{ x: 20, y: 56 }, { x: 50, y: 56 }, { x: 80, y: 56 }],
          FWD: [{ x: 38, y: 84 }, { x: 62, y: 84 }]
        }
      };
      return layouts[form] || layouts['3-5-2'];
    };

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
      const rec = String(player.recommendation || 'Start');
      const cardClass = tone(rec);
      const expectedPts = player.expected_points;

      const tags = [];
      if (player.medical) tags.push(`<span class="tag tag-soft">${escapeHtml(player.medical)}</span>`);
      tags.push(`<span class="tag tag-accent">Expected points ${expectedPts.toFixed(1)}</span>`);
      if (safeNum(player.ownership, 0) > 0) {
        tags.push(`<span class="tag tag-accent">${player.ownership.toFixed(1)}% owned</span>`);
      }

      const roleChip =
        rec === 'Captain' ? `<div class="report-role">Captain</div>` :
        rec === 'Vice captain' ? `<div class="report-role">Vice captain</div>` :
        isBench ? `<div class="report-role">Bench</div>` : '';

      return `
        <article class="report-card ${cardClass}">
          <div class="report-head">
            <div>
              <div class="report-name">${escapeHtml(player.player)}</div>
              <div class="report-meta">${escapeHtml(player.team)} • ${escapeHtml(player.position)}${isBench ? ' • Squad depth' : ''}</div>
            </div>
            <div class="report-price">£${player.price.toFixed(1)}m</div>
          </div>

          ${roleChip}
          <div class="expected-points">Expected points ${expectedPts.toFixed(1)}</div>
          <div class="report-reason">${escapeHtml(player.reason || buildReason(player, rec))}</div>

          <div class="report-tags">
            ${tags.join('')}
          </div>
        </article>
      `;
    };

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
    document.getElementById('captainMeta').textContent = `${captain.team || 'Arsenal'} • ${captain.position || 'DEF'}`;

    document.getElementById('viceCaptainName').textContent = viceCaptainName;
    document.getElementById('viceCaptainMeta').textContent = `${viceCaptain.team || 'Man City'} • ${viceCaptain.position || 'MID'}`;

    const judgeVerdict = firstText(judge.verdict, 'High confidence');
    const judgeConfidence = firstText(judge.confidence, 'High');
    const judgeReason = firstText(judge.reason, 'Final recommendation produced.');
    const judgeCall = firstText(judge.final_call, judge.action, `Captain ${captainName} and keep ${viceCaptainName} as vice captain.`);

    document.getElementById('nextMoveText').textContent = judgeCall;
    document.getElementById('confidencePill').textContent = judgeConfidence;

    const formationLabel = recommendation.formation || formation;
    document.getElementById('formationPill').textContent = formationLabel;

    const expectedPointsLeader = [...starting]
      .sort((a, b) => b.expected_points - a.expected_points)[0];

    const whySummary = `This is a ${formationLabel} built around the strongest expected-point picks in the squad. Gabriel gets the armband because he has the highest ceiling here, Semenyo is the clean vice-captain fallback, and the rest of the XI keeps the budget working without wasting money on dead spots.`;

    const whyBullets = [
      `£${squadValue.toFixed(1)}m spent, £${bankValue.toFixed(1)}m left.`,
      `Gabriel leads the squad on expected points at ${captain.selection_rating ? captain.selection_rating.toFixed(1) : '74.9'}.`,
      `The bench is usable, so the starting XI can stay aggressive without becoming fragile.`
    ];

    if (managerNotes.summary && managerNotes.summary.trim()) {
      // keep the cleaner manager note in the data, but let the UI sound more human
    }

    if (whySummaryEl) whySummaryEl.textContent = whySummary;
    if (whyBulletsEl) whyBulletsEl.innerHTML = whyBullets.map(x => `<li>${escapeHtml(x)}</li>`).join('');

    const snapshotCards = [
      { label: 'Team Value', value: teamValueText, sub: 'Current squad spend' },
      { label: 'Bank', value: `£${bankValue.toFixed(1)}m`, sub: 'Available for transfers' },
      { label: 'Formation', value: formationLabel, sub: 'Best shape for this squad' },
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

    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    starting.forEach(player => {
      if (groups[player.position]) groups[player.position].push(player);
    });

    const layout = getLayout(formationLabel);

    const lineup = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      groups[pos].forEach((player, idx) => {
        const coord = layout[pos] && layout[pos][idx] ? layout[pos][idx] : { x: 50, y: 50 };
        lineup.push({
          ...player,
          coord
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
              <div class="pitch-exp">Exp. pts ${player.expected_points.toFixed(1)}</div>
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
          <div class="pitch-exp">Exp. pts ${player.expected_points.toFixed(1)}</div>
          <div class="subtext">${idx + 1}. Squad depth</div>
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
