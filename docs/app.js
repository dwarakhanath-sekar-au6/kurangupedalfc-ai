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
    const text = (...values) => values.find(v => typeof v === 'string' && v.trim()) || '';
    const num = (v, fallback = 0) => {
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
    const esc = (s) => String(s ?? '')
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
      price: num(p.price ?? p.Price ?? 0, 0),
      recommendation: p.recommendation || p.status || 'Start',
      reason: p.reason || 'No extra note available.',
      medical: p.medical || p.MedicalStatus || '',
      expected_points: num(p.expected_points ?? p.selection_rating ?? p.score ?? p.SelectionRating ?? p.rating ?? 0, 0),
      selection_rating: num(p.selection_rating ?? p.SelectionRating ?? p.score ?? p.rating ?? 0, 0),
      form: num(p.form ?? p.Form ?? 0, 0),
      ppg: num(p.ppg ?? p.PPG ?? 0, 0),
      ownership: num(p.ownership ?? p.Ownership ?? 0, 0),
      points: num(p.points ?? p.Points ?? 0, 0),
      minutes: num(p.minutes ?? p.Minutes ?? 0, 0),
      starts: num(p.starts ?? p.Starts ?? 0, 0),
      goals: num(p.goals ?? p.Goals ?? 0, 0),
      assists: num(p.assists ?? p.Assists ?? 0, 0),
      clean_sheets: num(p.clean_sheets ?? p.CleanSheets ?? 0, 0),
      news: p.news || ''
    });

    const starting = toArray(startingRaw).map(normalizePlayer);
    const bench = toArray(benchRaw).map(normalizePlayer);

    const currentGw = metadata.gameweek || 1;
    const formation = recommendation.formation || `${starting.filter(p => p.position === 'DEF').length}-${starting.filter(p => p.position === 'MID').length}-${starting.filter(p => p.position === 'FWD').length}`;

    const buildReason = (player, role = 'Start') => {
      const exp = Math.round(num(player.expected_points, 0));
      const ppg = num(player.ppg, 0);
      const price = num(player.price, 0);
      const ownership = num(player.ownership, 0);
      const points = num(player.points, 0);
      const minutes = num(player.minutes, 0);
      const starts = num(player.starts, 0);
      const goals = num(player.goals, 0);
      const assists = num(player.assists, 0);
      const cleans = num(player.clean_sheets, 0);
      const med = String(player.medical || '').toLowerCase();
      const pos = player.position;

      if (role === 'Captain') {
        return `Chosen for the armband because he gives the best weekly upside in this XI. He has the clearest path to a big return, and the rest of the squad can still stay balanced around him.`;
      }

      if (role === 'Vice captain') {
        return `Chosen as the fallback captain because he is dependable, involved enough every week, and still gives a strong return if the main captain does not start.`;
      }

      if (role === 'Bench') {
        return `Bench cover only. Useful depth if needed, but the starting XI has the stronger weekly point options.`;
      }

      if (pos === 'GK') {
        return `I kept him in goal because he is the cleanest balance of price and reliability for this squad. ${points} total points, ${minutes} minutes played, and enough stability to avoid wasting budget.`;
      }

      if (pos === 'DEF') {
        return `I picked him in defence because he gives real weekly output from a slot that also protects the structure of the team. ${points} total points, ${cleans} clean sheets, ${starts} starts, and enough value to justify the place.`;
      }

      if (pos === 'MID') {
        return `I picked him in midfield because he adds steady weekly returns and keeps the squad balanced. ${points} total points, ${ppg.toFixed(1)} points per game, ${starts} starts, and enough involvement to matter every week.`;
      }

      if (pos === 'FWD') {
        return `I picked him up front because he is the clearest goal threat in this price bracket for this team. ${goals} goals, ${assists} assists, ${points} total points, and the minutes to keep threatening every week.`;
      }

      const details = [];
      if (exp >= 8) details.push(`the weekly projection is strong at ${exp} points`);
      else if (exp >= 6) details.push(`the weekly projection is solid at ${exp} points`);
      if (ownership >= 20) details.push(`he is backed by ${ownership.toFixed(1)}% of managers`);
      else if (ownership <= 10) details.push('he gives you some differential upside');
      if (price <= 6.0) details.push(`the price stays tidy at £${price.toFixed(1)}m`);
      else if (price >= 8.0) details.push(`the price is premium, so the output has to earn it`);
      if (med === 'available') details.push('he is available');
      else if (med === 'doubtful') details.push('fitness needs a closer look');
      return details.length ? details.slice(0, 2).join('. ') + '.' : 'He fits the squad balance well.';
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

    const tone = (rec) => {
      const r = String(rec || '').toLowerCase();
      if (r.includes('avoid')) return 'bad';
      if (r.includes('monitor') || r.includes('keep only')) return 'warn';
      return 'good';
    };

    const renderShirt = (player, isCaptain = false, isVice = false) => {
      const shirt = player.shirt || teamColors[player.team] || '#6d4aff';
      return `
        <div class="shirt-wrap">
          <svg class="shirt-svg" viewBox="0 0 72 78" aria-hidden="true">
            <path d="M22 6h28l8 6 11 8-6 18-8-4v36H17V34l-8 4-6-18 11-8 8-6z" fill="${shirt}" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
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
      const tags = [];
      if (player.medical) tags.push(`<span class="tag tag-soft">${esc(player.medical)}</span>`);
      tags.push(`<span class="tag tag-accent">Projected points ${Math.round(num(player.expected_points, 0))}</span>`);
      if (num(player.ownership, 0) > 0) tags.push(`<span class="tag tag-accent">${num(player.ownership, 0).toFixed(1)}% owned</span>`);

      const roleChip = rec === 'Captain' ? `<div class="report-role">Captain</div>` : rec === 'Vice captain' ? `<div class="report-role">Vice captain</div>` : isBench ? `<div class="report-role">Bench</div>` : '';

      return `
        <article class="report-card ${tone(rec)}">
          <div class="report-head">
            <div>
              <div class="report-name">${esc(player.player)}</div>
              <div class="report-meta">${esc(player.team)} &middot; ${esc(player.position)}${isBench ? ' &middot; Squad depth' : ''}</div>
            </div>
            <div class="report-price">${'£'}${num(player.price, 0).toFixed(1)}m</div>
          </div>

          ${roleChip}
          <div class="expected-points">Projected points ${Math.round(num(player.expected_points, 0))}</div>
          <div class="report-reason">${esc(player.reason || buildReason(player, rec))}</div>

          <div class="report-tags">${tags.join('')}</div>
        </article>
      `;
    };

    const renderMobilePlayer = (player, isBench = false) => `
      <div class="mobile-player">
        <div class="shirt-wrap" style="width:34px;height:38px;margin:0;">${renderShirt(player, false, false)}</div>
        <div>
          <div style="font-weight:800;">${esc(player.player)}</div>
          <div class="meta">${esc(player.team)} &middot; ${esc(player.position)}${isBench ? ' &middot; Bench' : ''}</div>
          <div class="meta">${esc(player.reason || buildReason(player, player.recommendation))}</div>
        </div>
        <div class="pts">Pts ${Math.round(num(player.expected_points, 0))}</div>
      </div>
    `;

    const renderMobilePanel = () => {
      const mobilePanelEl = document.getElementById('mobileSquadPanel');
      if (!mobilePanelEl) return;

      const whySummary = managerNotes.summary || `This is a ${formation} built around the best weekly return options, with captaincy on the strongest attacking pick and a bench that stays usable.`;
      const whyBullets = (managerNotes.bullets && managerNotes.bullets.length)
        ? managerNotes.bullets
        : [
            `${'£'}${squadValue.toFixed(1)}m spent, ${'£'}${bankValue.toFixed(1)}m left.`,
            `Formation: ${formation}.`,
            `Captain: ${captainName}. Vice captain: ${viceCaptainName}.`
          ];

      const mobileSnapshotCards = [
        { label: 'Team Value', value: teamValueText, sub: 'Current squad spend' },
        { label: 'Bank', value: `${'£'}${bankValue.toFixed(1)}m`, sub: 'Available for transfers' },
        { label: 'Formation', value: formation, sub: 'Best shape for this squad' },
        { label: 'Verdict', value: text(judge.verdict, 'High confidence'), sub: `Confidence: ${text(judge.confidence, 'High')}` }
      ];

      mobilePanelEl.innerHTML = `
        <div class="mobile-stack">
          <div class="mobile-card">
            <h2>Next Best Move</h2>
            <p>${esc(text(judge.final_call, `Captain ${captainName} and keep ${viceCaptainName} as vice captain.`))}</p>
          </div>

          <div class="mobile-card">
            <h2>Why this squad works</h2>
            <p>${esc(whySummary)}</p>
            <ul class="check-list" style="margin-top:12px;">${whyBullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>

          <div class="mobile-card">
            <h2>Team Snapshot</h2>
            <div class="mobile-snapshot-grid">
              ${mobileSnapshotCards.map(card => `
                <div class="metric-card">
                  <div class="metric-label">${esc(card.label)}</div>
                  <div class="metric-value">${esc(card.value)}</div>
                  <div class="metric-sub">${esc(card.sub)}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="mobile-card">
            <h2>Captain</h2>
            <div class="mobile-player-list">${renderMobilePlayer(normalizePlayer(captain), false)}</div>
          </div>

          <div class="mobile-card">
            <h2>Vice Captain</h2>
            <div class="mobile-player-list">${renderMobilePlayer(normalizePlayer(viceCaptain), false)}</div>
          </div>

          <div class="mobile-card">
            <h2>Starting XI</h2>
            <div class="mobile-player-list">${starting.map(p => renderMobilePlayer(p, false)).join('')}</div>
          </div>

          <div class="mobile-card">
            <h2>Bench</h2>
            <div class="mobile-player-list">${bench.map(p => renderMobilePlayer(p, true)).join('')}</div>
          </div>
        </div>
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
    document.getElementById('updatedText').textContent = `Last updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('teamValue').textContent = teamValueText;
    document.getElementById('bankValue').textContent = `${'£'}${bankValue.toFixed(1)}m`;
    document.getElementById('rankValue').textContent = metadata.rank || '-';

    document.getElementById('captainName').textContent = captainName;
    document.getElementById('captainMeta').textContent = `${captain.team || 'Arsenal'} &middot; ${captain.position || 'DEF'}`;
    document.getElementById('viceCaptainName').textContent = viceCaptainName;
    document.getElementById('viceCaptainMeta').textContent = `${viceCaptain.team || 'Man City'} &middot; ${viceCaptain.position || 'MID'}`;

    const judgeVerdict = text(judge.verdict, 'High confidence');
    const judgeConfidence = text(judge.confidence, 'High');
    const judgeReason = text(judge.reason, 'Final recommendation produced.');
    const judgeCall = text(judge.final_call, `Captain ${captainName} and keep ${viceCaptainName} as vice captain.`);

    document.getElementById('nextMoveText').textContent = judgeCall;
    document.getElementById('confidencePill').textContent = judgeConfidence;

    const formationLabel = recommendation.formation || formation;
    document.getElementById('formationPill').textContent = formationLabel;

    const whySummary = managerNotes.summary || `This is a ${formationLabel} built around the strongest weekly point picks, with the captain on the best attacking option and a bench that stays usable.`;
    const whyBullets = (managerNotes.bullets && managerNotes.bullets.length)
      ? managerNotes.bullets
      : [
          `${'£'}${squadValue.toFixed(1)}m spent, ${'£'}${bankValue.toFixed(1)}m left.`,
          `Formation: ${formationLabel}.`,
          `Captain: ${captainName}. Vice captain: ${viceCaptainName}.`
        ];

    if (whySummaryEl) whySummaryEl.textContent = whySummary;
    if (whyBulletsEl) whyBulletsEl.innerHTML = whyBullets.map(x => `<li>${esc(x)}</li>`).join('');

    const snapshotCards = [
      { label: 'Team Value', value: teamValueText, sub: 'Current squad spend' },
      { label: 'Bank', value: `${'£'}${bankValue.toFixed(1)}m`, sub: 'Available for transfers' },
      { label: 'Formation', value: formationLabel, sub: 'Best shape for this squad' },
      { label: 'Verdict', value: judgeVerdict, sub: `Confidence: ${judgeConfidence}` }
    ];

    if (snapshotGridEl) {
      snapshotGridEl.innerHTML = snapshotCards.map(card => `
        <div class="metric-card">
          <div class="metric-label">${esc(card.label)}</div>
          <div class="metric-value">${esc(card.value)}</div>
          <div class="metric-sub">${esc(card.sub)}</div>
        </div>
      `).join('');
    }

    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    starting.forEach(player => {
      if (groups[player.position]) groups[player.position].push(player);
    });

    Object.keys(groups).forEach(pos => {
      groups[pos].sort((a, b) => b.expected_points - a.expected_points || b.selection_rating - a.selection_rating);
    });

    const layout = getLayout(formationLabel);
    const lineup = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      groups[pos].forEach((player, idx) => {
        const coord = layout[pos] && layout[pos][idx] ? layout[pos][idx] : { x: 50, y: 50 };
        lineup.push({
          ...player,
          coord: {
            x: Math.max(8, Math.min(92, coord.x)),
            y: coord.y
          }
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
              <div class="pitch-name">${esc(player.player)}</div>
              <div class="pitch-meta">${esc(player.team)} &middot; ${esc(player.position)}</div>
              <div class="pitch-price">${'£'}${num(player.price, 0).toFixed(1)}m</div>
              <div class="pitch-exp">Exp. pts ${Math.round(num(player.expected_points, 0))}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (subsRowEl) {
      subsRowEl.innerHTML = bench.slice(0, 4).map((player, idx) => `
        <div class="sub-card">
          ${renderShirt(player, false, false)}
          <div class="pitch-name">${esc(player.player)}</div>
          <div class="pitch-meta">${esc(player.team)} &middot; ${esc(player.position)}</div>
          <div class="pitch-price">${'£'}${num(player.price, 0).toFixed(1)}m</div>
          <div class="pitch-exp">Exp. pts ${Math.round(num(player.expected_points, 0))}</div>
          <div class="subtext">${idx + 1}. Squad depth</div>
        </div>
      `).join('');
    }

    if (startingXIEl) startingXIEl.innerHTML = starting.map(p => renderReportCard(p, false)).join('');
    if (benchEl) benchEl.innerHTML = bench.map(p => renderReportCard(p, true)).join('');

    renderMobilePanel();
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
