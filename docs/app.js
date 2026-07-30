fetch('dashboard.json')
  .then(res => res.json())
  .then(data => {
    const kpis = document.getElementById('kpis');

    kpis.innerHTML = `
      <div class="card kpi">
        <div class="label">Gameweek</div>
        <div class="value">${data.gameweek}</div>
        <div class="sub">Auto-refresh on Tuesday night</div>
      </div>
      <div class="card kpi">
        <div class="label">Team Value</div>
        <div class="value">${data.team_value}</div>
        <div class="sub">Current squad valuation</div>
      </div>
      <div class="card kpi">
        <div class="label">Rank</div>
        <div class="value">${data.rank}</div>
        <div class="sub">Overall ranking snapshot</div>
      </div>
      <div class="card kpi">
        <div class="label">Top Captain Pick</div>
        <div class="value">${data.squad.slice().sort((a, b) => b.score - a.score)[0].name}</div>
        <div class="sub">Highest confidence recommendation</div>
      </div>
    `;

    document.getElementById('insights').innerHTML = data.insights
      .map(i => `
        <div class="insight">
          <strong>${i.title}</strong>
          <div>${i.text}</div>
        </div>
      `)
      .join('');

    document.getElementById('squad').innerHTML = data.squad
      .slice()
      .sort((a, b) => b.score - a.score)
      .map(p => `
        <div class="player" style="border-left: 8px solid ${p.shirt};">
          <div class="name">${p.name}</div>
          <div class="meta">${p.team} • ${p.position}</div>
          <div class="score">AI score: ${p.score.toFixed(2)}</div>
        </div>
      `)
      .join('');

    document.getElementById('reasoning').innerHTML = `
      <div class="insight">
        <strong>Planner Goal</strong>
        <div>${data.plan.goal}</div>
      </div>
      <div class="insight">
        <strong>Planner Tasks</strong>
        <div>${data.plan.tasks.map(t => `✅ ${t}`).join('<br>')}</div>
      </div>
      <div class="insight">
        <strong>Judge Verdict</strong>
        <div>${data.judge.verdict}</div>
      </div>
      <div class="insight">
        <strong>Judge Action</strong>
        <div>${data.judge.action}</div>
      </div>
    `;
  })
  .catch(err => {
    console.error(err);
    document.body.innerHTML = '<div style="padding:40px;color:white;font-family:Arial">Failed to load dashboard.json</div>';
  });
