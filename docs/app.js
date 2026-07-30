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
      "MCI": "#6CABDD",
      "MID": "#6d4aff"
    };

    const noteMeta = {
      "Medical Review": { icon: "💚", label: "Fitness check" },
      "Fixture Review": { icon: "🗓️", label: "Fixtures" },
      "Scout Review": { icon: "📈", label: "Form & value" },
      "Final Review": { icon: "✅", label: "Final call" }
    };

    const parseMoney = value => {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      const num = String(value).replace(/[£m]/g, '').trim();
      const parsed = parseFloat(num);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const squadValue = parseMoney(data.team_value);
    const bankValue = Math.max(0, 100 - squadValue);

    document.getElementById('teamValue').textContent = data.team_value ?? '£88.0m';
    document.getElementById('bankValue').textContent = `£${bankValue.toFixed(1)}m`;
    document.getElementById('rankValue').textContent = data.rank ?? '-';

    document.getElementById('captainName').textContent = data.captain?.name ?? 'Thiago';
    document.getElementById('captainMeta').textContent = `${data.captain?.team ?? 'Brentford'} • ${data.captain?.position ?? 'FWD'}`;

    document.getElementById('viceCaptainName').textContent = data.vice_captain?.name ?? 'Guéhi';
    document.getElementById('viceCaptainMeta').textContent = `${data.vice_captain?.team ?? 'Crystal Palace'} • ${data.vice_captain?.position ?? 'DEF'}`;

    const now = new Date();
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('updatedText').textContent = `Last updated: ${timeText}`;

    document.getElementById('nextMoveText').textContent = data.judge?.action ?? 'Hold transfer this week. Reassess after fresh updates and press conferences.';

    const notes = data.insights || [];
    document.getElementById('notesList').innerHTML = notes.map(item => {
      const meta = noteMeta[item.title] || { icon: "•", label: item.title || "Note" };
      return `
        <div class="note-item">
          <div class="note-icon">${meta.icon}</div>
          <div>
            <div class="note-title">${meta.label}</div>
            <div class="note-text">${item.text || ''}</div>
          </div>
        </div>
      `;
    }).join('');

    const status = [
      'Fitness: checked',
      'Fixtures: checked',
      'Form: checked',
      'News: checked',
      'Final call: done'
    ];

    document.getElementById('statusList').innerHTML = status.map(s => `
      <div class="status-item">
        <div class="status-check">✓</div>
        <div class="status-text">${s}</div>
      </div>
    `).join('');

    const planGoal = data.plan?.goal ?? 'Build the best opening squad';
    const planTasks = Array.isArray(data.plan?.tasks) ? data.plan.tasks : [];
    const captainText = data.captain?.name ?? 'Thiago';
    const viceText = data.vice_captain?.name ?? 'Guéhi';
    const finalVerdict = data.judge?.verdict ?? 'High confidence';

    document.getElementById('reasoningList').innerHTML = `
      <div class="reason-item">
        <div class="reason-icon">🎯</div>
        <div>
          <div class="reason-title">Game plan</div>
          <div class="reason-text">${planGoal}</div>
        </div>
      </div>

      <div class="reason-item">
        <div class="reason-icon">✔</div>
        <div>
          <div class="reason-title">Checks completed</div>
          <div class="reason-text">${planTasks.map(task => `✔ ${task}`).join('<br>')}</div>
        </div>
      </div>

      <div class="reason-item">
        <div class="reason-icon">🏁</div>
        <div>
          <div class="reason-title">Final call</div>
          <div class="reason-text">${finalVerdict}</div>
        </div>
      </div>

      <div class="reason-item">
        <div class="reason-icon">⭐</div>
        <div>
          <div class="reason-title">Captain / vice</div>
          <div class="reason-text">${captainText}<br>${viceText}</div>
        </div>
      </div>
    `;

    const starting = Array.isArray(data.starting_xi) && data.starting_xi.length
      ? data.starting_xi.slice()
      : (Array.isArray(data.squad) ? data.squad.slice(0, 11) : []);

    const bench = Array.isArray(data.bench) ? data.bench.slice() : (Array.isArray(data.squad) ? data.squad.slice(11, 15) : []);

    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    starting.forEach(player => {
      if (groups[player.position]) groups[player.position].push(player);
    });

    const coords = {
      GK: [{ x: 50, y: 16 }],
      DEF: [{ x: 28, y: 35 }, { x: 50, y: 35 }, { x: 72, y: 35 }, { x: 39, y: 56 }, { x: 61, y: 56 }],
      MID: [{ x: 18, y: 58 }, { x: 40, y: 58 }, { x: 60, y: 58 }, { x: 82, y: 58 }, { x: 50, y: 76 }],
      FWD: [{ x: 27, y: 82 }, { x: 50, y: 82 }, { x: 73, y: 82 }]
    };

    const shirtMarkup = (player, isCaptain = false, isVice = false) => {
      const shirt = teamColors[player.team] || player.shirt || "#6d4aff";
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

    const lineup = [];
    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
      (groups[pos] || []).forEach((player, idx) => {
        lineup.push({
          ...player,
          pos,
          coord: coords[pos][idx]
        });
      });
    });

    document.getElementById('pitchArea').innerHTML = lineup.map(player => {
      const isCaptain = player.name === data.captain?.name;
      const isVice = player.name === data.vice_captain?.name;
      return `
        <div class="slot" style="left:${player.coord.x}%; top:${player.coord.y}%;">
          ${shirtMarkup(player, isCaptain, isVice)}
          <div class="player-card">
            <div class="player-name">${player.name || 'Unknown'}</div>
            <div class="player-team">${player.team || '—'}</div>
            <div class="player-price">£${Number(player.score || 0).toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('subsRow').innerHTML = bench.slice(0, 4).map((player, idx) => {
      return `
        <div class="sub-card">
          ${shirtMarkup(player, false, false)}
          <div class="player-name">${player.name || 'Unknown'}</div>
          <div class="player-team">${player.team || '—'}</div>
          <div class="player-price">£${Number(player.score || 0).toFixed(2)}</div>
          <div class="subtext">${idx + 1}. ${player.position || '—'}</div>
        </div>
      `;
    }).join('');
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
