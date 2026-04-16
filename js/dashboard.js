/**
 * PC Builder Pro - Dashboard
 * Tela inicial com métricas, atalhos e visão geral
 */

const Dashboard = (() => {

  function formatCurrency(value) {
    return 'R$ ' + (parseFloat(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function render() {
    const container = document.getElementById('page-dashboard');
    const partsStats = DB.Parts.getStats();
    const buildsStats = DB.Builds.getAllStats();
    const builds = DB.Builds.getAll();
    const parts = DB.Parts.getAll();
    const categories = DB.Settings.getCategories();

    // Calcular total de peças pendentes (soma de builds + lista de compras)
    const pendingInBuilds = builds.reduce((acc, b) => {
      return acc + b.parts.filter(p => p.status !== 'bought' && p.status !== 'discarded').length;
    }, 0);

    // Progresso geral
    const totalBuildsItems = builds.reduce((acc, b) => acc + b.parts.length, 0);
    const boughtBuildsItems = builds.reduce((acc, b) => acc + b.parts.filter(p => p.status === 'bought').length, 0);
    const globalProgress = totalBuildsItems > 0 ? Math.round((boughtBuildsItems / totalBuildsItems) * 100) : 0;

    container.innerHTML = `
      <!-- Welcome Banner -->
      <div class="dashboard-welcome fade-in">
        <h2><i class="fas fa-microchip" style="margin-right:8px;"></i>PC Builder Pro</h2>
        <p>Orçamento de hardware e montagem de PCs — 100% offline, tudo salvo no seu dispositivo.</p>
        <div class="welcome-actions">
          <button class="welcome-btn" onclick="App.navigate('builds'); setTimeout(() => BuildsModule.showCreateModal(), 100)">
            <i class="fas fa-plus" style="margin-right:6px;"></i>Nova Build
          </button>
          <button class="welcome-btn" onclick="App.navigate('parts'); setTimeout(() => PartsModule.showCreateModal(), 100)">
            <i class="fas fa-puzzle-piece" style="margin-right:6px;"></i>Nova Peça
          </button>
          <button class="welcome-btn" onclick="App.navigate('comparator')">
            <i class="fas fa-balance-scale" style="margin-right:6px;"></i>Comparar
          </button>
          <button class="welcome-btn" onclick="App.navigate('reports')">
            <i class="fas fa-chart-bar" style="margin-right:6px;"></i>Relatórios
          </button>
        </div>
      </div>

      <!-- Stat Cards -->
      <div class="stat-grid fade-in">
        <div class="stat-card card-hover" onclick="App.navigate('builds')">
          <div class="stat-icon" style="background:rgba(99,102,241,.15);">
            <i class="fas fa-layer-group" style="color:#6366f1;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${buildsStats.count}</div>
            <div class="stat-label">Builds Criadas</div>
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('builds')">
          <div class="stat-icon" style="background:rgba(16,185,129,.15);">
            <i class="fas fa-dollar-sign" style="color:#10b981;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:16px;">${formatCurrency(buildsStats.totalValue)}</div>
            <div class="stat-label">Valor Total</div>
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('shopping')">
          <div class="stat-icon" style="background:rgba(245,158,11,.15);">
            <i class="fas fa-clock" style="color:#f59e0b;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${partsStats.pending + pendingInBuilds}</div>
            <div class="stat-label">Itens Pendentes</div>
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('parts')">
          <div class="stat-icon" style="background:rgba(16,185,129,.15);">
            <i class="fas fa-check-circle" style="color:#10b981;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${partsStats.bought + boughtBuildsItems}</div>
            <div class="stat-label">Itens Comprados</div>
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('builds')">
          <div class="stat-icon" style="background:rgba(59,130,246,.15);">
            <i class="fas fa-arrow-down" style="color:#3b82f6;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:16px;">${buildsStats.cheapest ? formatCurrency(buildsStats.cheapest.value) : 'R$ 0'}</div>
            <div class="stat-label">Build Mais Barata</div>
            ${buildsStats.cheapest ? `<div class="stat-change">${buildsStats.cheapest.name}</div>` : ''}
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('builds')">
          <div class="stat-icon" style="background:rgba(239,68,68,.15);">
            <i class="fas fa-arrow-up" style="color:#ef4444;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:16px;">${buildsStats.mostExpensive ? formatCurrency(buildsStats.mostExpensive.value) : 'R$ 0'}</div>
            <div class="stat-label">Build Mais Cara</div>
            ${buildsStats.mostExpensive ? `<div class="stat-change">${buildsStats.mostExpensive.name}</div>` : ''}
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('builds')">
          <div class="stat-icon" style="background:rgba(168,85,247,.15);">
            <i class="fas fa-chart-line" style="color:#a855f7;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:16px;">${formatCurrency(buildsStats.avgValue)}</div>
            <div class="stat-label">Média por Build</div>
          </div>
        </div>
        <div class="stat-card card-hover" onclick="App.navigate('parts')">
          <div class="stat-icon" style="background:rgba(20,184,166,.15);">
            <i class="fas fa-puzzle-piece" style="color:#14b8a6;"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${partsStats.total}</div>
            <div class="stat-label">Peças Cadastradas</div>
          </div>
        </div>
      </div>

      <!-- Progresso Global -->
      ${totalBuildsItems > 0 ? `
      <div class="card mb-5 fade-in">
        <div class="card-header">
          <div>
            <div class="card-title">Progresso Geral das Builds</div>
            <div class="card-subtitle">${boughtBuildsItems} de ${totalBuildsItems} itens comprados</div>
          </div>
          <div class="badge ${globalProgress === 100 ? 'badge-success' : globalProgress >= 50 ? 'badge-primary' : 'badge-warning'}">${globalProgress}%</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${globalProgress === 100 ? 'success' : globalProgress < 30 ? 'danger' : ''}" style="width: ${globalProgress}%"></div>
        </div>
      </div>
      ` : ''}

      <!-- Builds Recentes -->
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Builds Recentes</div>
          <div class="section-subtitle">Últimas montagens criadas</div>
        </div>
        <button class="btn-secondary btn-sm" onclick="App.navigate('builds')">
          Ver todas <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
        </button>
      </div>

      <div class="items-list fade-in" id="dashboard-builds-list">
        ${renderRecentBuilds(builds)}
      </div>

      <!-- Peças Recentes -->
      <div class="section-header mt-5 fade-in">
        <div>
          <div class="section-title">Peças Adicionadas Recentemente</div>
          <div class="section-subtitle">Últimas peças da lista de compras</div>
        </div>
        <button class="btn-secondary btn-sm" onclick="App.navigate('parts')">
          Ver todas <i class="fas fa-arrow-right" style="margin-left:4px;"></i>
        </button>
      </div>

      <div class="items-list fade-in" id="dashboard-parts-list">
        ${renderRecentParts(parts, categories)}
      </div>

      <!-- Atalhos Rápidos -->
      <div class="section-header mt-5 fade-in">
        <div class="section-title">Atalhos Rápidos</div>
      </div>
      <div class="grid-4 fade-in" id="quick-shortcuts">
        ${renderQuickShortcuts()}
      </div>

      <div style="height:40px;"></div>
    `;
  }

  function renderRecentBuilds(builds) {
    const recent = [...builds]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 4);

    if (recent.length === 0) {
      return `<div class="empty-state" style="padding:30px 20px;">
        <div class="empty-state-icon">🖥️</div>
        <h3>Nenhuma build ainda</h3>
        <p>Crie sua primeira montagem de PC</p>
        <button class="btn-primary" onclick="App.navigate('builds'); setTimeout(() => BuildsModule.showCreateModal(), 100)">
          <i class="fas fa-plus"></i> Criar Build
        </button>
      </div>`;
    }

    return recent.map(build => {
      const stats = DB.Builds.getStats(build);
      const statusColors = { planning: '#6366f1', inprogress: '#f59e0b', completed: '#10b981', paused: '#94a3b8' };
      const statusLabels = { planning: 'Planejando', inprogress: 'Em andamento', completed: 'Concluída', paused: 'Pausada' };
      return `
        <div class="item-card" onclick="App.navigate('builds'); setTimeout(() => BuildsModule.openBuild('${build.id}'), 100)">
          <div class="item-icon" style="background:${build.color}20; font-size:22px;">
            <span style="color:${build.color};">🖥️</span>
          </div>
          <div class="item-info">
            <div class="item-name">${escapeHtml(build.name)}</div>
            <div class="item-meta">
              <span>${stats.totalItems} peças</span>
              <span>${stats.boughtItems} compradas</span>
              <span>${statusLabels[build.status] || build.status}</span>
            </div>
            <div class="progress-bar mt-2" style="height:4px;">
              <div class="progress-fill" style="width:${stats.progress}%; background:${build.color};"></div>
            </div>
          </div>
          <div>
            <div class="item-price">${formatCurrency(stats.total)}</div>
            <div style="font-size:11px; color:var(--text-secondary); text-align:right; margin-top:2px;">${stats.progress}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderRecentParts(parts, categories) {
    const recent = [...parts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recent.length === 0) {
      return `<div class="empty-state" style="padding:30px 20px;">
        <div class="empty-state-icon">🔧</div>
        <h3>Nenhuma peça cadastrada</h3>
        <p>Adicione peças à sua lista de compras</p>
        <button class="btn-primary" onclick="App.navigate('parts'); setTimeout(() => PartsModule.showCreateModal(), 100)">
          <i class="fas fa-plus"></i> Nova Peça
        </button>
      </div>`;
    }

    const statusMap = {
      pending: { label: 'Pendente', cls: 'status-pending' },
      bought: { label: 'Comprado', cls: 'status-bought' },
      searching: { label: 'Pesquisando', cls: 'status-searching' },
      discarded: { label: 'Descartado', cls: 'status-discarded' },
    };

    return recent.map(part => {
      const cat = categories.find(c => c.id === part.category) || { icon: '📌', color: '#94a3b8', name: part.category };
      const status = statusMap[part.status] || statusMap.pending;
      return `
        <div class="item-card" onclick="App.navigate('parts'); setTimeout(() => PartsModule.showEditModal('${part.id}'), 100)">
          <div class="item-icon" style="background:${cat.color}20;">${cat.icon}</div>
          <div class="item-info">
            <div class="item-name">${escapeHtml(part.name)}</div>
            <div class="item-meta">
              <span>${escapeHtml(part.brand || '—')}</span>
              <span>${escapeHtml(cat.name)}</span>
              <span>${escapeHtml(part.store || '—')}</span>
            </div>
          </div>
          <div style="text-align:right;">
            <div class="item-price">${formatCurrency(part.price)}</div>
            <div class="badge ${status.cls} mt-1">${status.label}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderQuickShortcuts() {
    const shortcuts = [
      { icon: 'fas fa-layer-group', label: 'Nova Build', color: '#6366f1', action: "App.navigate('builds'); setTimeout(() => BuildsModule.showCreateModal(), 100)" },
      { icon: 'fas fa-puzzle-piece', label: 'Nova Peça', color: '#10b981', action: "App.navigate('parts'); setTimeout(() => PartsModule.showCreateModal(), 100)" },
      { icon: 'fas fa-balance-scale', label: 'Comparar', color: '#f59e0b', action: "App.navigate('comparator')" },
      { icon: 'fas fa-shopping-cart', label: 'Compras', color: '#3b82f6', action: "App.navigate('shopping')" },
      { icon: 'fas fa-chart-bar', label: 'Relatórios', color: '#8b5cf6', action: "App.navigate('reports')" },
      { icon: 'fas fa-download', label: 'Backup', color: '#14b8a6', action: "App.navigate('settings')" },
      { icon: 'fas fa-history', label: 'Histórico', color: '#ec4899', action: "App.navigate('parts')" },
      { icon: 'fas fa-cog', label: 'Configurações', color: '#64748b', action: "App.navigate('settings')" },
    ];

    return shortcuts.map(s => `
      <div class="card card-hover" style="cursor:pointer; text-align:center; padding:18px 12px;" onclick="${s.action}">
        <div style="width:44px; height:44px; background:${s.color}20; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">
          <i class="${s.icon}" style="color:${s.color}; font-size:18px;"></i>
        </div>
        <div style="font-size:13px; font-weight:600; color:var(--text-primary);">${s.label}</div>
      </div>
    `).join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
