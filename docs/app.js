fetch('./dashboard.json')
  .then(res => res.json())
  .then(data => {
    const kpis = document.getElementById('kpis');

    const sortedSquad = (data.squad || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
    const topPick = sortedSquad[0] || { name: 'N/A' };

    kpis.innerHTML = `
      <div class="card kpi">
        <div class="label">Gameweek</div>
        <div class="value">${data.gameweek ?? '—'}</div>
        <div class="sub">Updated from the latest run</div>
      </div>
      <div class="card kpi">
        <div class="label">Team Value</div>
        <div class="value">${data.team_value ?? '—'}</div>
        <div class="sub">Current squad valuation</div>
      </div>
      <div class="card kpi">
        <div class="label">Rank</div>
        <div class="value">${data.rank ?? '—'}</div>
        <div class="sub">Overall ranking snapshot</div>
      </div>
      <div class="card kpi">
        <div class="label">Top Pick</div>
        <div class="value">${topPick.name || '—'}</div>
        <div class="sub">Highest rated player right now</div>
      </div>
    `;

    document.getElementById('insights').innerHTML = (data.insights || [])
      .map(item => `
        <div class="insight">
          <strong>${item.title || 'Note'}</strong>
          <div>${item.text || ''}</div>
        </div>
      `)
      .join('');

    document.getElementById('squad').innerHTML = sortedSquad
      .map(player => `
        <div class="player" style="border-left: 8px solid ${player.shirt || '#4f46e5'};">
          <div class="name">${player.name || 'Unknown'}</div>
          <div class="meta">${player.team || '—'} • ${player.position || '—'}</div>
          <div class="score">Selection Rating: ${Number(player.score || 0).toFixed(2)}</div>
        </div>
      `)
      .join('');

    const planTasks = (data.plan && data.plan.tasks) ? data.plan.tasks : [];
    const planGoal = (data.plan && data.plan.goal) ? data.plan.goal : 'No plan available yet.';
    const judgeVerdict = data.judge?.verdict || '—';
    const judgeAction = data.judge?.action || '—';

    document.getElementById('reasoning').innerHTML = `
      <div class="insight">
        <strong>Planner Goal</strong>
        <div>${planGoal}</div>
      </div>

      <div class="insight">
        <strong>Planner Tasks</strong>
        <div>${planTasks.map(task => `✅ ${task}`).join('<br>') || 'No tasks yet.'}</div>
      </div>

      <div class="insight">
        <strong>Final Review</strong>
        <div>${judgeVerdict}</div>
      </div>

      <div class="insight">
        <strong>Recommendation</strong>
        <div>${judgeAction}</div>
      </div>
    `;
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
