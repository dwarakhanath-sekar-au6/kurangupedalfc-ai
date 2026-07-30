fetch('dashboard.json')
  .then(res => res.json())
  .then(data => {
    document.getElementById('kpis').innerHTML = `
      <div class="grid">
        <div class="card">Gameweek: ${data.gameweek}</div>
        <div class="card">Team Value: ${data.team_value}</div>
        <div class="card">Rank: ${data.rank}</div>
      </div>
    `;

    document.getElementById('insights').innerHTML = data.insights
      .map(i => `<div class="card"><b>${i.title}</b><br>${i.text}</div>`)
      .join('');

    document.getElementById('squad').innerHTML = data.squad
      .map(p => `<div class="card">${p.name} - ${p.team} - ${p.position} - ${p.score}</div>`)
      .join('');
  });
