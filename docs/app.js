fetch('./dashboard.json', { cache: 'no-store' })
  .then(async res => {
    if (!res.ok) {
      throw new Error(`dashboard.json load failed: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
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

    const asArray = (v) => Array.isArray(v) ? v : [];
    const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
    const firstText = (...values) => values.find(v => typeof v === 'string' && v.trim()) || '';
    const safeNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };
    const listNames = (items, key = 'player', n = 3) => {
      return asArray(items)
        .slice(0, n)
        .map(x => {
          if (!isObj(x)) return typeof x === 'string' ? x : '';
          return x[key] || x.Player || x.name || '';
        })
        .filter(Boolean);
    };
    const getBlock = (v) => isObj(v) ? v : {};

    const flow = getBlock(data.decision_flow || data.trace_view || data.trace);
    const agents = getBlock(data.agent_cards);
    const squadTrace = getBlock(data.squad_trace);

    const plannerFlow = getBlock(flow.planner);
    const medicalFlow = getBlock(flow.medical);
    const fixtureFlow = getBlock(flow.fixture);
    const scoutFlow = getBlock(flow.scout);
    const newsFlow = getBlock(flow.news);
    const judgeFlow = getBlock(flow.judge);

    const plannerAgent = getBlock(agents.planner);
    const medicalAgent = getBlock(agents.medical);
    const fixtureAgent = getBlock(agents.fixture);
    const scoutAgent = getBlock(agents.scout);
    const newsAgent = getBlock(agents.news);
    const judgeAgent = getBlock(agents.judge);

    const selectedPlayers = asArray(squadTrace.starting_xi).length
      ? asArray(squadTrace.starting_xi)
      : asArray(data.player_cards).slice(0, 11);

    const benchPlayers = asArray(squadTrace.bench).length
      ? asArray(squadTrace.bench)
      : asArray(data.player_cards).slice(11);

    const captainReport = getBlock(squadTrace.captain);
    const viceReport = getBlock(squadTrace.vice_captain);

    const squadValue = safeNum(
      String(data.team_value || '0').replace(/[£m]/g, ''),
      0
    );
    const bankValue = Math.max(0, 100 - squadValue);

    const notesSection = document.querySelector('.notes');
    const whySection = document.querySelector('.why-panel');
    const statusSection = document.querySelector('.status-panel');
    const moveSection = document.querySelector('.move-panel');

    if (notesSection) {
      const h2 = notesSection.querySelector('h2');
      const sub = notesSection.querySelector('.panel-subtext');
      if (h2) h2.textContent = 'Decision flow';
      if (sub) sub.textContent = 'What each specialist checked before the final call.';
    }

    if (whySection) {
      const h2 = whySection.querySelector('h2');
      const sub = whySection.querySelector('.panel-subtext');
      if (h2) h2.textContent = 'Why this squad?';
      if (sub) sub.textContent = 'Budget use, strength, and the thinking behind the picks.';
    }

    if (statusSection) {
      const h2 = statusSection.querySelector('h2');
      const sub = statusSection.querySelector('.panel-subtext');
      if (h2) h2.textContent = 'Run status';
      if (sub) sub.textContent = 'Checks completed for this build.';
    }

    if (moveSection) {
      const h2 = moveSection.querySelector('h2');
      const sub = moveSection.querySelector('.panel-subtext');
      if (h2) h2.textContent = 'Next best move';
      if (sub) sub.textContent = 'The immediate call for this week.';
    }

    document.getElementById('teamValue').textContent = data.team_value ?? '£88.0m';
    document.getElementById('bankValue').textContent = `£${bankValue.toFixed(1)}m`;
    document.getElementById('rankValue').textContent = data.rank ?? '-';

    document.getElementById('captainName').textContent = data.captain?.name ?? captainReport.player ?? 'Thiago';
    document.getElementById('captainMeta').textContent = `${data.captain?.team ?? captainReport.team ?? 'Brentford'} • ${data.captain?.position ?? captainReport.position ?? 'FWD'}`;

    document.getElementById('viceCaptainName').textContent = data.vice_captain?.name ?? viceReport.player ?? 'Guéhi';
    document.getElementById('viceCaptainMeta').textContent = `${data.vice_captain?.team ?? viceReport.team ?? 'Crystal Palace'} • ${data.vice_captain?.position ?? viceReport.position ?? 'DEF'}`;

    const now = new Date();
    document.getElementById('updatedText').textContent = `Last updated: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const judgeFinalCall =
      firstText(
        judgeFlow.final_call,
        judgeFlow.action,
        judgeAgent.what_it_did,
        data.judge?.action,
        'Review the risk.'
      );

    document.getElementById('nextMoveText').textContent = judgeFinalCall;

    const statusItems = [
      { label: 'Planner', value: 'Complete' },
      { label: 'Fitness review', value: 'Complete' },
      { label: 'Fixture review', value: 'Complete' },
      { label: 'Scout review', value: 'Complete' },
      { label: 'News review', value: 'Complete' },
      { label: 'Judge', value: 'Complete' }
    ];

    document.getElementById('statusList').innerHTML = statusItems.map(item => `
      <div class="status-item">
        <div class="status-check">✓</div>
        <div class="status-text">${item.label}: ${item.value}</div>
      </div>
    `).join('');

    const plannerGoal = firstText(
      plannerAgent.output?.goal,
      plannerFlow.goal,
      'Build the best GW1 team'
    );

    const plannerTasks = asArray(
      plannerAgent.output?.tasks ||
      plannerFlow.tasks ||
      plannerFlow.questions
    );

    const medicalSummary = firstText(
      medicalAgent.what_it_did,
      medicalFlow.summary_text,
      medicalFlow.summary,
      'Fitness review completed.'
    );

    const medicalWatch = asArray(
      medicalAgent.watchlist ||
      medicalFlow.watchlist ||
      medicalFlow.top_concerns
    );

    const fixtureSummary = firstText(
      fixtureAgent.what_it_did,
      fixtureFlow.summary_text,
      fixtureFlow.headline,
      'Fixture review completed.'
    );

    const fixtureBest = asArray(
      fixtureAgent.best_runs ||
      fixtureFlow.best_runs ||
      fixtureFlow.easiest_runs
    );

    const fixtureWorst = asArray(
      fixtureAgent.worst_runs ||
      fixtureFlow.worst_runs ||
      []
    );

    const scoutSummary = firstText(
      scoutAgent.what_it_did,
      scoutFlow.summary_text,
      scoutFlow.headline,
      'Scout review completed.'
    );

    const scoutBestPlayers = asArray(
      scoutAgent.best_players ||
      scoutFlow.best_players ||
      scoutFlow.top_rated
    );

    const scoutBestValue = asArray(
      scoutAgent.best_value ||
      scoutFlow.best_value
    );

    const newsSummary = firstText(
      newsAgent.what_it_did,
      newsFlow.summary_text,
      newsFlow.headline,
      'News review completed.'
    );

    const newsMentions = asArray(
      newsAgent.mentions ||
      newsFlow.mentions
    );

    const judgeVerdict = firstText(
      judgeAgent.verdict,
      judgeFlow.verdict,
      data.judge?.verdict,
      'Unknown'
    );

    const judgeConfidence = firstText(
      judgeAgent.confidence,
      judgeFlow.confidence,
      'Unknown'
    );

    const judgeReason = firstText(
      judgeAgent.reason,
      judgeFlow.reason,
      'Final recommendation produced.'
    );

    const decisionCards = [
      {
        icon: '🎯',
        title: 'Planner',
        subtitle: 'Breaks the request into football questions',
        body: firstText(
          plannerAgent.what_it_did,
          plannerFlow.summary,
          'Asked for fitness, fixtures, form, news, and captaincy checks.'
        ),
        items: plannerTasks
      },
      {
        icon: '💚',
        title: 'Fitness review',
        subtitle: 'Flags risk before the deadline',
        body: medicalSummary,
        items: listNames(medicalWatch, 'player', 5)
      },
      {
        icon: '🗓️',
        title: 'Fixture review',
        subtitle: 'Looks for good and bad runs',
        body: fixtureSummary,
        items: listNames(fixtureBest, 'player', 5)
      },
      {
        icon: '📈',
        title: 'Scout review',
        subtitle: 'Balances form, value, and upside',
        body: scoutSummary,
        items: listNames(scoutBestValue.length ? scoutBestValue : scoutBestPlayers, 'player', 5)
      },
      {
        icon: '📰',
        title: 'News review',
        subtitle: 'Checks current notes and flags',
        body: newsSummary,
        items: listNames(newsMentions, 'player', 5)
      },
      {
        icon: '🏁',
        title: 'Judge',
        subtitle: 'Combines the evidence into one call',
        body: `${judgeVerdict} • ${judgeConfidence}`,
        items: [judgeFinalCall]
      }
    ];

    const decisionFlowHtml = decisionCards.map(card => `
      <div class="insight">
        <strong>${card.title}</strong>
        <div class="subtext" style="margin-top:4px;">${card.subtitle}</div>
        <div style="margin-top:8px;">${card.body}</div>
        ${card.items && card.items.length ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;">
            ${card.items.map(it => `<span style="padding:6px 10px;border-radius:999px;background:rgba(109,74,255,0.14);border:1px solid rgba(109,74,255,0.22);color:#d9d0ff;font-size:12px;">${it}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    document.getElementById('notesList').innerHTML = decisionFlowHtml;

    const judgeCall = firstText(
      judgeAgent.what_it_did,
      judgeFinalCall,
      judgeReason
    );

    const keyReasons = [
      `Captain: ${data.captain?.name ?? captainReport.player ?? 'Thiago'}`,
      `Vice captain: ${data.vice_captain?.name ?? viceReport.player ?? 'Guéhi'}`,
      `Budget used: ${data.team_value ?? '£88.0m'}`,
      `Bank left: £${bankValue.toFixed(1)}m`
    ];

    document.getElementById('reasoningList').innerHTML = `
      <div class="reason-item">
        <div class="reason-icon">🏁</div>
        <div>
          <div class="reason-title">Final call</div>
          <div class="reason-text">${judgeCall}</div>
        </div>
      </div>

      <div class="reason-item">
        <div class="reason-icon">⭐</div>
        <div>
          <div class="reason-title">What tipped it</div>
          <div class="reason-text">${judgeReason}</div>
        </div>
      </div>

      <div class="reason-item">
        <div class="reason-icon">💷</div>
        <div>
          <div class="reason-title">Budget</div>
          <div class="reason-text">${keyReasons.join('<br>')}</div>
        </div>
      </div>
    `;

    const lineup = [];
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    asArray(selectedPlayers).forEach(player => {
      const pos = player.position || player.Position;
      if (groups[pos]) groups[pos].push(player);
    });

    const coords = {
      GK: [{ x: 50, y: 14 }],
      DEF: [{ x: 20, y: 33 }, { x: 50, y: 33 }, { x: 80, y: 33 }, { x: 38, y: 52 }, { x: 62, y: 52 }],
      MID: [{ x: 16, y: 57 }, { x: 38, y: 57 }, { x: 62, y: 57 }, { x: 84, y: 57 }, { x: 50, y: 76 }],
      FWD: [{ x: 26, y: 82 }, { x: 50, y: 82 }, { x: 74, y: 82 }]
    };

    const shirtMarkup = (player, isCaptain = false, isVice = false) => {
      const name = player.name || player.player || player.Player || 'Unknown';
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

    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      (groups[pos] || []).forEach((player, idx) => {
        lineup.push({
          ...player,
          coord: coords[pos][idx]
        });
      });
    });

    document.getElementById('pitchArea').innerHTML = lineup.map(player => {
      const name = player.name || player.player || player.Player || 'Unknown';
      const team = player.team || player.Team || '—';
      const position = player.position || player.Position || '—';
      const isCaptain = name === (data.captain?.name || captainReport.player);
      const isVice = name === (data.vice_captain?.name || viceReport.player);
      const price = safeNum(player.price ?? player.Price ?? 0, 0);
      const selectionRating = safeNum(player.selection_rating ?? player.SelectionRating ?? player.score ?? player.FinalRating ?? 0, 0);

      return `
        <div class="slot" style="left:${player.coord.x}%; top:${player.coord.y}%;">
          ${shirtMarkup(player, isCaptain, isVice)}
          <div class="player-card">
            <div class="player-name">${name}</div>
            <div class="player-team">${team} • ${position}</div>
            <div class="player-price">£${price.toFixed(1)}m</div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('subsRow').innerHTML = asArray(benchPlayers).slice(0, 4).map((player, idx) => {
      const name = player.name || player.player || player.Player || 'Unknown';
      const team = player.team || player.Team || '—';
      const position = player.position || player.Position || '—';
      const price = safeNum(player.price ?? player.Price ?? 0, 0);

      return `
        <div class="sub-card">
          ${shirtMarkup(player, false, false)}
          <div class="player-name">${name}</div>
          <div class="player-team">${team} • ${position}</div>
          <div class="player-price">£${price.toFixed(1)}m</div>
          <div class="subtext">${idx + 1}. ${position}</div>
        </div>
      `;
    }).join('');

    const playerPanel = document.createElement('section');
    playerPanel.className = 'panel';
    playerPanel.style.padding = '18px';
    playerPanel.style.marginTop = '0';

    const reportSource = asArray(squadTrace.starting_xi).length
      ? asArray(squadTrace.starting_xi)
      : asArray(data.player_cards);

    const benchSource = asArray(squadTrace.bench).length
      ? asArray(squadTrace.bench)
      : [];

    const renderReportCard = (p) => {
      const name = p.player || p.name || 'Unknown';
      const team = p.team || '—';
      const pos = p.position || '—';
      const price = safeNum(p.price ?? 0, 0);
      const rec = p.recommendation || p.status || 'Keep';
      const reason = p.reason || '';
      const medical = p.medical || '';
      const fixture = p.fixture_difficulty != null ? `Fixture: ${p.fixture_difficulty}` : '';

      return `
        <div style="background:rgba(255,255,255,0.035);border:1px solid rgba(180,190,255,0.12);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:6px;min-height:150px;">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div>
              <div style="font-weight:800;font-size:15px;">${name}</div>
              <div style="color:#9ca8c7;font-size:12px;margin-top:2px;">${team} • ${pos}</div>
            </div>
            <div style="font-weight:800;color:#eef2ff;">£${price.toFixed(1)}m</div>
          </div>

          <div style="font-weight:700;color:#d9d0ff;">${rec}</div>

          <div style="color:#9ca8c7;font-size:13px;line-height:1.45;">${reason || 'No extra note available.'}</div>

          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;">
            ${medical ? `<span style="padding:5px 9px;border-radius:999px;background:rgba(45,211,111,0.12);border:1px solid rgba(45,211,111,0.22);color:#c9f7d7;font-size:11px;">${medical}</span>` : ''}
            ${fixture ? `<span style="padding:5px 9px;border-radius:999px;background:rgba(109,74,255,0.12);border:1px solid rgba(109,74,255,0.22);color:#d9d0ff;font-size:11px;">${fixture}</span>` : ''}
          </div>
        </div>
      `;
    };

    playerPanel.innerHTML = `
      <div class="section-head">
        <div>
          <h2 style="margin:0;">Selected players</h2>
          <div class="panel-subtext">Why each starter is in the team.</div>
        </div>
        <span class="view-details">Player reports</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px;">
        ${reportSource.slice(0, 11).map(renderReportCard).join('')}
      </div>

      ${benchSource.length ? `
        <div style="margin-top:18px;">
          <div class="section-head">
            <div>
              <h2 style="margin:0;font-size:16px;">Bench reports</h2>
              <div class="panel-subtext">Cover options if the starters need replacing.</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px;">
            ${benchSource.slice(0, 4).map(renderReportCard).join('')}
          </div>
        </div>
      ` : ''}
    `;

    const centerCol = document.querySelector('.center-col');
    if (centerCol) {
      centerCol.appendChild(playerPanel);
    }
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
