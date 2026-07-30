fetch('./dashboard.json')
  .then(res => res.json())
  .then(data => {
    const teamValue = data.team_value ?? '£88.0m';
    const rankValue = data.rank ?? '-';

    document.getElementById('teamValue').textContent = teamValue;
    document.getElementById('rankValue').textContent = rankValue;
    document.getElementById('captainName').textContent = data.captain?.name ?? 'Thiago';
    document.getElementById('captainMeta').textContent = `${data.captain?.team ?? 'Brentford'} • ${data.captain?.position ?? 'FWD'}`;
    document.getElementById('viceCaptainName').textContent = data.vice_captain?.name ?? 'Guéhi';
    document.getElementById('viceCaptainMeta').textContent = `${data.vice_captain?.team ?? 'Crystal Palace'} • ${data.vice_captain?.position ?? 'DEF'}`;
    document.getElementById('nextMoveText').textContent = data.judge?.action ?? 'Hold transfer this week. Reassess after fresh updates.';

    const notes = data.insights || [];
    document.getElementById('notesList').innerHTML = notes.map(item => `
      <div class="note-item">
        <div class="note-icon">◉</div>
        <div>
          <div class="note-title">${item.title}</div>
          <div class="note-text">${item.text}</div>
        </div>
      </div>
    `).join('');

    const status = [
      'Planner: Ready',
      'Medical: Ready',
      'Fixture: Ready',
      'Scout: Ready',
      'News: Ready',
      'Final Review: Done'
    ];

    document.getElementById('statusList').innerHTML = status.map(s => `
      <div class="status-item">
        <div class="status-check">✓</div>
        <div class="status-text">${s}</div>
      </div>
    `).join('');

    const reasoning = [
      ['Planner Goal', data.plan?.goal ?? 'Build the best opening squad'],
      ['Planner Tasks', (data.plan?.tasks || []).map(t => `✔ ${t}`).join('<br>')],
      ['Final Review', data.judge?.verdict ?? 'High Confidence'],
      ['Recommendation', data.judge?.action ?? 'Captain Thiago and keep Guéhi as vice captain.']
    ];

    document.getElementById('reasoningList').innerHTML = reasoning.map(([title, text]) => `
      <div class="reason-item">
        <div class="reason-icon">★</div>
        <div>
          <div class="reason-title">${title}</div>
          <div class="reason-text">${text}</div>
        </div>
      </div>
    `).join('');

    const squad = (data.starting_xi && data.starting_xi.length ? data.starting_xi : (data.squad || [])).slice();
    const bench = (data.bench || []).slice();

    const formationPositions = {
      GK: { x: 50, y: 16 },
      DEF: [ {x: 29, y: 35}, {x: 50, y: 35}, {x: 71, y: 35}, {x: 39, y: 56}, {x: 61, y: 56} ],
      MID: [ {x: 18, y: 58}, {x: 40, y: 58}, {x: 60, y: 58}, {x: 82, y: 58}, {x: 50, y: 76} ],
      FWD: [ {x: 27, y: 82}, {x: 50, y: 82}, {x: 73, y: 82} ]
    };

    const lineup = [];
    const gk = squad.filter(p => p.position === 'GK').slice(0,1);
    const def = squad.filter(p => p.position === 'DEF').slice(0,5);
    const mid = squad.filter(p => p.position === 'MID').slice(0,5);
    const fwd = squad.filter(p => p.position === 'FWD').slice(0,3);

    lineup.push(...gk.map((p, i) => ({ ...p, pos: formationPositions.GK })));
    lineup.push(...def.map((p, i) => ({ ...p, pos: formationPositions.DEF[i] })));
    lineup.push(...mid.map((p, i) => ({ ...p, pos: formationPositions.MID[i] })));
    lineup.push(...fwd.map((p, i) => ({ ...p, pos: formationPositions.FWD[i] })));

    document.getElementById('pitchArea').innerHTML = lineup.map((p, idx) => {
      const isCaptain = data.captain?.name === p.name;
      const isVice = data.vice_captain?.name === p.name;
      const shirt = p.shirt || '#6d4aff';

      return `
        <div class="slot" style="left:${p.pos.x}%; top:${p.pos.y}%; --shirt:${shirt}">
          <div class="shirt"></div>
          ${isCaptain ? '<div class="captain-badge">C</div>' : ''}
          ${isVice ? '<div class="vc-badge">VC</div>' : ''}
          <div class="player-card">
            <div class="player-name">${p.name}</div>
            <div class="player-team">${p.team}</div>
            <div class="player-price">£${Number(p.score || 0).toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('');

    document.getElementById('subsRow').innerHTML = bench.slice(0, 4).map((p, idx) => `
      <div class="sub-card">
        <div class="shirt" style="--shirt:${p.shirt || '#6d4aff'}"></div>
        <div class="player-name">${p.name}</div>
        <div class="player-team">${p.team}</div>
        <div class="player-price">£${Number(p.score || 0).toFixed(2)}</div>
        <div class="subtext">${idx + 1}. ${p.position}</div>
      </div>
    `).join('');
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
