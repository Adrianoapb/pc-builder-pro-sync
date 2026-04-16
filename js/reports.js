/**
 * PC Builder Pro - Relatórios
 * Relatórios offline completos com gráficos e análises
 */

const ReportsModule = (() => {

  function formatCurrency(v) {
    return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  function render() {
    const container = document.getElementById('page-reports');
    const report = DB.Reports.generate();
    const categories = DB.Settings.getCategories();

    if (report.summary.total === 0 && report.buildsSummary.count === 0) {
      container.innerHTML = `
        <div class="section-header fade-in">
          <div class="section-title">Relatórios</div>
        </div>
        <div class="empty-state fade-in">
          <div class="empty-state-icon">📊</div>
          <h3>Nenhum dado para gerar relatório</h3>
          <p>Adicione peças e builds para ver seus relatórios</p>
          <div class="flex gap-2 justify-center">
            <button class="btn-primary" onclick="App.navigate('builds'); setTimeout(()=>BuildsModule.showCreateModal(),100)"><i class="fas fa-plus"></i> Nova Build</button>
            <button class="btn-secondary" onclick="App.navigate('parts'); setTimeout(()=>PartsModule.showCreateModal(),100)"><i class="fas fa-puzzle-piece"></i> Nova Peça</button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Relatórios</div>
          <div class="section-subtitle">Gerado em ${formatDate(report.generatedAt)}</div>
        </div>
        <div class="section-actions">
          <button class="btn-secondary btn-sm" onclick="ReportsModule.printReport()">
            <i class="fas fa-print"></i> Imprimir
          </button>
          <button class="btn-primary btn-sm" onclick="App.navigate('settings')">
            <i class="fas fa-download"></i> Exportar JSON
          </button>
        </div>
      </div>

      <!-- Resumo Geral -->
      <div class="report-section fade-in">
        <div class="section-title mb-3">Resumo Geral</div>
        <div class="stat-grid">
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(99,102,241,.15);"><i class="fas fa-layer-group" style="color:#6366f1;"></i></div>
            <div class="stat-info"><div class="stat-value">${report.buildsSummary.count}</div><div class="stat-label">Builds</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(16,185,129,.15);"><i class="fas fa-puzzle-piece" style="color:#10b981;"></i></div>
            <div class="stat-info"><div class="stat-value">${report.summary.total}</div><div class="stat-label">Peças Cadastradas</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(239,68,68,.15);"><i class="fas fa-coins" style="color:#ef4444;"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:15px;">${formatCurrency(report.buildsSummary.totalValue)}</div><div class="stat-label">Total em Builds</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(245,158,11,.15);"><i class="fas fa-chart-line" style="color:#f59e0b;"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:15px;">${formatCurrency(report.buildsSummary.avgValue)}</div><div class="stat-label">Média por Build</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(16,185,129,.15);"><i class="fas fa-check-circle" style="color:#10b981;"></i></div>
            <div class="stat-info"><div class="stat-value">${report.byStatus.bought}</div><div class="stat-label">Itens Comprados</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(245,158,11,.15);"><i class="fas fa-clock" style="color:#f59e0b;"></i></div>
            <div class="stat-info"><div class="stat-value">${report.byStatus.pending}</div><div class="stat-label">Itens Pendentes</div></div>
          </div>
        </div>
      </div>

      <!-- Status dos Itens - Gráfico Visual -->
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Distribuição por Status</div>
          ${renderStatusChart(report.byStatus)}
        </div>
      </div>

      <!-- Builds Ranking -->
      ${report.buildsWithValues.length > 0 ? `
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Ranking de Builds por Valor</div>
          <table class="report-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Peças</th>
                <th>Compradas</th>
                <th>Progresso</th>
                <th>Valor Total</th>
                <th>Falta Comprar</th>
              </tr>
            </thead>
            <tbody>
              ${report.buildsWithValues.map((b, i) => `
                <tr style="cursor:pointer;" onclick="App.navigate('builds'); setTimeout(()=>BuildsModule.openBuild('${b.id}'),100)">
                  <td><strong>${i + 1}º</strong></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="width:8px; height:8px; border-radius:50%; background:${b.color}; flex-shrink:0;"></span>
                      ${escapeHtml(b.name)}
                    </div>
                  </td>
                  <td>${b.stats.totalItems}</td>
                  <td style="color:var(--success);">${b.stats.boughtItems}</td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div class="progress-bar" style="width:80px; height:6px;">
                        <div class="progress-fill ${b.stats.progress===100?'success':''}" style="width:${b.stats.progress}%; background:${b.color};"></div>
                      </div>
                      <span style="font-size:12px;">${b.stats.progress}%</span>
                    </div>
                  </td>
                  <td><strong style="color:var(--primary);">${formatCurrency(b.stats.total)}</strong></td>
                  <td style="color:var(--warning);">${formatCurrency(b.stats.pending)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Por Categoria -->
      ${Object.keys(report.byCategory).length > 0 ? `
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Investimento por Categoria</div>
          ${renderCategoryChart(report.byCategory, categories)}
          <table class="report-table mt-4">
            <thead>
              <tr><th>Categoria</th><th>Qtd. Itens</th><th>Valor Total</th><th>% do Total</th></tr>
            </thead>
            <tbody>
              ${Object.entries(report.byCategory)
                .sort((a,b) => b[1].total - a[1].total)
                .map(([catId, data]) => {
                  const cat = categories.find(c => c.id === catId) || { name: catId, icon: '📌', color: '#94a3b8' };
                  const pct = report.summary.totalValue > 0 ? Math.round((data.total / report.summary.totalValue) * 100) : 0;
                  return `<tr>
                    <td><span>${cat.icon}</span> ${cat.name}</td>
                    <td>${data.count}</td>
                    <td><strong>${formatCurrency(data.total)}</strong></td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div class="progress-bar" style="width:60px; height:4px;">
                          <div style="height:100%; width:${pct}%; background:${cat.color}; border-radius:99px;"></div>
                        </div>
                        <span>${pct}%</span>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Marcas Mais Usadas -->
      ${report.topBrands.length > 0 ? `
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Marcas Mais Utilizadas</div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${report.topBrands.map((b, i) => {
              const maxCount = report.topBrands[0].count;
              const pct = Math.round((b.count / maxCount) * 100);
              return `
                <div class="flex items-center gap-3">
                  <div style="width:24px; font-size:13px; font-weight:700; color:var(--text-muted); text-align:right;">${i+1}</div>
                  <div style="flex:1;">
                    <div class="flex justify-between mb-1">
                      <span style="font-weight:600; font-size:14px;">${escapeHtml(b.brand)}</span>
                      <span style="font-size:13px; color:var(--text-secondary);">${b.count} item(ns)</span>
                    </div>
                    <div class="progress-bar" style="height:6px;">
                      <div class="progress-fill" style="width:${pct}%;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Itens Mais Caros -->
      ${report.mostExpensive.length > 0 ? `
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Top 10 Itens Mais Caros</div>
          <table class="report-table">
            <thead>
              <tr><th>#</th><th>Nome</th><th>Categoria</th><th>Marca</th><th>Loja</th><th>Preço</th></tr>
            </thead>
            <tbody>
              ${report.mostExpensive.map((p, i) => {
                const cat = categories.find(c => c.id === p.category) || { icon:'📌', name: p.category };
                return `<tr style="cursor:pointer;" onclick="PartsModule.showDetailModal('${p.id}')">
                  <td><strong>${i+1}º</strong></td>
                  <td>${escapeHtml(p.name)}</td>
                  <td>${cat.icon} ${cat.name}</td>
                  <td>${escapeHtml(p.brand||'—')}</td>
                  <td>${escapeHtml(p.store||'—')}</td>
                  <td><strong style="color:var(--primary);">${formatCurrency(p.price)}</strong></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      ` : ''}

      <!-- Lojas -->
      ${report.topStores.length > 0 ? `
      <div class="report-section fade-in">
        <div class="card">
          <div class="card-title mb-4">Lojas Mais Utilizadas</div>
          <div class="grid-3" style="gap:12px;">
            ${report.topStores.map((s, i) => `
              <div style="padding:14px; background:var(--bg-tertiary); border-radius:var(--radius-md); text-align:center;">
                <div style="font-size:22px; margin-bottom:6px;">🏪</div>
                <div style="font-weight:700; font-size:15px;">${escapeHtml(s.store)}</div>
                <div style="font-size:12px; color:var(--text-secondary);">${s.count} item(ns)</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <div style="height:40px;"></div>
    `;
  }

  function renderStatusChart(byStatus) {
    const total = Object.values(byStatus).reduce((s, v) => s + v, 0);
    if (total === 0) return '<p style="color:var(--text-muted);">Sem dados</p>';

    const items = [
      { label: 'Pendentes', count: byStatus.pending, color: '#f59e0b' },
      { label: 'Pesquisando', count: byStatus.searching, color: '#6366f1' },
      { label: 'Comprados', count: byStatus.bought, color: '#10b981' },
      { label: 'Descartados', count: byStatus.discarded, color: '#64748b' },
    ].filter(i => i.count > 0);

    return `
      <div class="flex gap-3 flex-wrap">
        ${items.map(item => {
          const pct = Math.round((item.count / total) * 100);
          return `
            <div style="flex:1; min-width:120px; text-align:center; padding:16px; background:${item.color}18; border-radius:var(--radius-lg); border:1px solid ${item.color}30;">
              <div style="font-size:28px; font-weight:800; color:${item.color};">${item.count}</div>
              <div style="font-size:12px; font-weight:600; color:${item.color}; margin:2px 0;">${item.label}</div>
              <div style="font-size:11px; color:var(--text-muted);">${pct}% do total</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderCategoryChart(byCategory, categories) {
    const sorted = Object.entries(byCategory)
      .sort((a,b) => b[1].total - a[1].total)
      .slice(0, 8);
    if (sorted.length === 0) return '';
    const maxValue = sorted[0][1].total;

    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${sorted.map(([catId, data]) => {
          const cat = categories.find(c => c.id === catId) || { name: catId, icon: '📌', color: '#94a3b8' };
          const pct = Math.round((data.total / maxValue) * 100);
          return `
            <div class="flex items-center gap-3">
              <div style="width:28px; text-align:center; font-size:18px;">${cat.icon}</div>
              <div style="flex:1;">
                <div class="flex justify-between mb-1">
                  <span style="font-size:13px; font-weight:600;">${cat.name}</span>
                  <span style="font-size:13px; color:var(--text-secondary);">${formatCurrency(data.total)}</span>
                </div>
                <div class="progress-bar" style="height:8px;">
                  <div style="height:100%; width:${pct}%; background:${cat.color}; border-radius:99px; transition:width .5s ease;"></div>
                </div>
              </div>
              <div style="width:36px; text-align:right; font-size:12px; color:var(--text-muted);">${data.count}x</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function printReport() {
    const report = DB.Reports.generate();
    const categories = DB.Settings.getCategories();
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>Relatório PC Builder Pro</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; }
          h1 { color: #6366f1; margin-bottom: 8px; }
          h2 { margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 12px; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; text-align: center; }
          .stat-value { font-size: 22px; font-weight: 800; color: #6366f1; }
          .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h1>PC Builder Pro — Relatório Completo</h1>
        <p style="color:#64748b;">Gerado em: ${new Date().toLocaleDateString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' })}</p>
        
        <h2>Resumo Geral</h2>
        <div class="summary">
          <div class="stat"><div class="stat-value">${report.buildsSummary.count}</div><div class="stat-label">Builds</div></div>
          <div class="stat"><div class="stat-value">${report.summary.total}</div><div class="stat-label">Peças</div></div>
          <div class="stat"><div class="stat-value">R$ ${(report.buildsSummary.totalValue||0).toFixed(2)}</div><div class="stat-label">Valor Total</div></div>
          <div class="stat"><div class="stat-value">${report.byStatus.bought}</div><div class="stat-label">Comprados</div></div>
          <div class="stat"><div class="stat-value">${report.byStatus.pending}</div><div class="stat-label">Pendentes</div></div>
          <div class="stat"><div class="stat-value">R$ ${(report.buildsSummary.avgValue||0).toFixed(2)}</div><div class="stat-label">Média/Build</div></div>
        </div>

        <h2>Builds</h2>
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Peças</th><th>Progresso</th><th>Valor Total</th></tr></thead>
          <tbody>
            ${report.buildsWithValues.map((b,i) => `
              <tr><td>${i+1}º</td><td>${b.name}</td><td>${b.stats.totalItems}</td><td>${b.stats.progress}%</td><td>R$ ${(b.stats.total||0).toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Por Categoria</h2>
        <table>
          <thead><tr><th>Categoria</th><th>Qtd.</th><th>Valor</th></tr></thead>
          <tbody>
            ${Object.entries(report.byCategory).sort((a,b)=>b[1].total-a[1].total).map(([catId, data]) => {
              const cat = categories.find(c => c.id === catId) || { name: catId };
              return `<tr><td>${cat.name}</td><td>${data.count}</td><td>R$ ${(data.total||0).toFixed(2)}</td></tr>`;
            }).join('')}
          </tbody>
        </table>

        <h2>Top 10 Itens Mais Caros</h2>
        <table>
          <thead><tr><th>#</th><th>Nome</th><th>Marca</th><th>Preço</th></tr></thead>
          <tbody>
            ${report.mostExpensive.map((p,i) => `<tr><td>${i+1}º</td><td>${p.name}</td><td>${p.brand||'—'}</td><td>R$ ${(p.price||0).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return { render, printReport };
})();
