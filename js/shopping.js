/**
 * PC Builder Pro - Lista de Compras
 * Lista geral, filtros avançados e organização de compras
 */

const ShoppingModule = (() => {

  let filter = { status: '', category: '', priority: '', sort: 'priority', search: '' };

  function formatCurrency(v) {
    return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const STATUS_LABELS = { pending: 'Pendente', bought: 'Comprado', searching: 'Pesquisando', discarded: 'Descartado' };
  const PRIORITY_LABELS = { high: 'Alta', medium: 'Média', low: 'Baixa' };

  function render() {
    const container = document.getElementById('page-shopping');
    const allParts = DB.Parts.getAll();
    const builds = DB.Builds.getAll();
    const categories = DB.Settings.getCategories();

    // Todas as peças pendentes de builds + lista geral
    const allShoppingItems = getAllShoppingItems(allParts, builds);
    const stats = computeStats(allShoppingItems);

    container.innerHTML = `
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Lista de Compras</div>
          <div class="section-subtitle">${allShoppingItems.length} item(ns) · ${formatCurrency(stats.totalPending)} pendente</div>
        </div>
        <div class="section-actions">
          <button class="btn-secondary btn-sm" onclick="ShoppingModule.showMoveModal()">
            <i class="fas fa-share"></i> Mover para Build
          </button>
          <button class="btn-primary" onclick="App.navigate('parts'); setTimeout(() => PartsModule.showCreateModal(), 100)">
            <i class="fas fa-plus"></i> Nova Peça
          </button>
        </div>
      </div>

      <!-- Resumo -->
      <div class="stat-grid mb-4 fade-in" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));">
        <div class="stat-card" style="cursor:default;">
          <div class="stat-icon" style="background:rgba(245,158,11,.15);"><i class="fas fa-clock" style="color:#f59e0b;"></i></div>
          <div class="stat-info"><div class="stat-value">${stats.pending}</div><div class="stat-label">Pendentes</div></div>
        </div>
        <div class="stat-card" style="cursor:default;">
          <div class="stat-icon" style="background:rgba(99,102,241,.15);"><i class="fas fa-search" style="color:#6366f1;"></i></div>
          <div class="stat-info"><div class="stat-value">${stats.searching}</div><div class="stat-label">Pesquisando</div></div>
        </div>
        <div class="stat-card" style="cursor:default;">
          <div class="stat-icon" style="background:rgba(16,185,129,.15);"><i class="fas fa-check" style="color:#10b981;"></i></div>
          <div class="stat-info"><div class="stat-value">${stats.bought}</div><div class="stat-label">Comprados</div></div>
        </div>
        <div class="stat-card" style="cursor:default;">
          <div class="stat-icon" style="background:rgba(239,68,68,.15);"><i class="fas fa-coins" style="color:#ef4444;"></i></div>
          <div class="stat-info"><div class="stat-value" style="font-size:15px;">${formatCurrency(stats.totalPending)}</div><div class="stat-label">A Gastar</div></div>
        </div>
        <div class="stat-card" style="cursor:default;">
          <div class="stat-icon" style="background:rgba(16,185,129,.15);"><i class="fas fa-wallet" style="color:#10b981;"></i></div>
          <div class="stat-info"><div class="stat-value" style="font-size:15px;">${formatCurrency(stats.totalBought)}</div><div class="stat-label">Já Gasto</div></div>
        </div>
      </div>

      <!-- Abas: Lista Geral / Por Build -->
      <div class="tabs fade-in" id="shopping-tabs">
        <button class="tab-btn active" onclick="ShoppingModule.switchTab('all', this)">
          <i class="fas fa-list" style="margin-right:6px;"></i>Lista Geral (${allParts.length})
        </button>
        <button class="tab-btn" onclick="ShoppingModule.switchTab('builds', this)">
          <i class="fas fa-layer-group" style="margin-right:6px;"></i>Por Builds (${builds.length})
        </button>
        <button class="tab-btn" onclick="ShoppingModule.switchTab('priority', this)">
          <i class="fas fa-fire" style="margin-right:6px;"></i>Alta Prioridade (${allParts.filter(p=>p.priority==='high'&&p.status!=='bought').length})
        </button>
      </div>

      <!-- Filtros -->
      <div class="card mb-4 fade-in" id="shopping-filters">
        <div class="flex gap-2 mb-3" style="flex-wrap:wrap;">
          <div style="position:relative; flex:1; min-width:180px;">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:13px;"></i>
            <input class="form-control" id="shopping-search" placeholder="Buscar nome, marca, modelo..."
              style="padding-left:36px;" oninput="ShoppingModule.onSearch(this.value)" value="${escapeHtml(filter.search)}" />
          </div>
          <select class="filter-select" id="shopping-sort" onchange="ShoppingModule.onSort(this.value)">
            <option value="priority" ${filter.sort==='priority'?'selected':''}>Prioridade</option>
            <option value="price-asc" ${filter.sort==='price-asc'?'selected':''}>Menor preço</option>
            <option value="price-desc" ${filter.sort==='price-desc'?'selected':''}>Maior preço</option>
            <option value="name-asc" ${filter.sort==='name-asc'?'selected':''}>Nome A-Z</option>
            <option value="date-desc" ${filter.sort==='date-desc'?'selected':''}>Mais recentes</option>
          </select>
        </div>
        <div class="filters-bar">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Status:</span>
          ${['','pending','searching','bought','discarded'].map(s => {
            const lbl = {'' : 'Todos', pending:'Pendente', bought:'Comprado', searching:'Pesquisando', discarded:'Descartado'};
            return `<button class="filter-chip ${filter.status===s?'active':''}" onclick="ShoppingModule.onFilterStatus('${s}')">${lbl[s]||s}</button>`;
          }).join('')}
        </div>
        <div class="filters-bar">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Prioridade:</span>
          ${['','high','medium','low'].map(p => {
            const lbl = {'':'Todas', high:'Alta', medium:'Média', low:'Baixa'};
            return `<button class="filter-chip ${filter.priority===p?'active':''}" onclick="ShoppingModule.onFilterPriority('${p}')">${lbl[p]}</button>`;
          }).join('')}
        </div>
        <div class="filters-bar" style="flex-wrap:wrap;">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Categoria:</span>
          <button class="filter-chip ${!filter.category?'active':''}" onclick="ShoppingModule.onFilterCategory('')">Todas</button>
          ${categories.map(c => `<button class="filter-chip ${filter.category===c.id?'active':''}" onclick="ShoppingModule.onFilterCategory('${c.id}')">${c.icon} ${c.name}</button>`).join('')}
        </div>
      </div>

      <!-- Conteúdo dinâmico -->
      <div id="shopping-content" class="fade-in">
        ${renderAllTab(allParts, categories)}
      </div>
    `;
  }

  function getAllShoppingItems(parts, builds) {
    // Combina peças da lista geral + peças de builds
    const items = [...parts];
    builds.forEach(b => {
      b.parts.forEach(p => {
        if (!items.find(i => i.id === p.id)) {
          items.push({ ...p, _buildName: b.name, _buildId: b.id });
        }
      });
    });
    return items;
  }

  function computeStats(items) {
    const pending = items.filter(p => p.status === 'pending').length;
    const searching = items.filter(p => p.status === 'searching').length;
    const bought = items.filter(p => p.status === 'bought').length;
    const totalPending = items.filter(p => p.status !== 'bought' && p.status !== 'discarded')
      .reduce((s, p) => s + (p.price * (p.quantity || 1)), 0);
    const totalBought = items.filter(p => p.status === 'bought')
      .reduce((s, p) => s + (p.price * (p.quantity || 1)), 0);
    return { pending, searching, bought, totalPending, totalBought };
  }

  function getFilteredParts() {
    let parts = DB.Parts.getAll();
    if (filter.search) {
      const q = filter.search.toLowerCase();
      parts = parts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand||'').toLowerCase().includes(q) ||
        (p.model||'').toLowerCase().includes(q)
      );
    }
    if (filter.status) parts = parts.filter(p => p.status === filter.status);
    if (filter.priority) parts = parts.filter(p => p.priority === filter.priority);
    if (filter.category) parts = parts.filter(p => p.category === filter.category);
    switch (filter.sort) {
      case 'price-asc': parts.sort((a,b) => a.price - b.price); break;
      case 'price-desc': parts.sort((a,b) => b.price - a.price); break;
      case 'name-asc': parts.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'date-desc': parts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'priority':
      default: {
        const order = { high: 0, medium: 1, low: 2 };
        parts.sort((a,b) => (order[a.priority]||1) - (order[b.priority]||1));
        break;
      }
    }
    return parts;
  }

  function renderAllTab(parts, categories) {
    const filtered = getFilteredParts();
    if (filtered.length === 0) {
      return `<div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <h3>${filter.search || filter.status || filter.category ? 'Nenhum item encontrado' : 'Lista de compras vazia'}</h3>
        <p>${filter.search || filter.status || filter.category ? 'Tente outros filtros' : 'Adicione peças ao catálogo para acompanhar suas compras'}</p>
        ${!filter.search && !filter.status && !filter.category ? `<button class="btn-primary" onclick="App.navigate('parts'); setTimeout(() => PartsModule.showCreateModal(), 100)"><i class="fas fa-plus"></i> Adicionar Peça</button>` : ''}
      </div>`;
    }
    return `<div class="items-list">${filtered.map(p => renderShoppingItem(p, categories)).join('')}</div>`;
  }

  function renderShoppingItem(part, categories) {
    const cat = categories.find(c => c.id === part.category) || { icon: '📌', color: '#94a3b8', name: part.category };
    const statusCls = { pending:'status-pending', bought:'status-bought', searching:'status-searching', discarded:'status-discarded' };
    const priorityCls = { high:'priority-high', medium:'priority-medium', low:'priority-low' };
    const isBought = part.status === 'bought';

    return `
      <div class="item-card" style="${isBought ? 'opacity:0.65;' : ''}">
        <div>
          <input type="checkbox" ${isBought ? 'checked' : ''}
            onchange="ShoppingModule.toggleBought('${part.id}', this.checked)"
            style="width:16px; height:16px; cursor:pointer; accent-color:var(--success);" />
        </div>
        <div class="item-icon" style="background:${cat.color}20;">${cat.icon}</div>
        <div class="item-info" onclick="PartsModule.showDetailModal('${part.id}');" style="cursor:pointer;">
          <div class="item-name" style="${isBought ? 'text-decoration:line-through;' : ''}">${escapeHtml(part.name)}</div>
          <div class="item-meta">
            ${part.brand ? `<span>${escapeHtml(part.brand)}</span>` : ''}
            ${part.model ? `<span>${escapeHtml(part.model)}</span>` : ''}
            <span>${escapeHtml(cat.name)}</span>
            ${part.store ? `<span>${escapeHtml(part.store)}</span>` : ''}
          </div>
          <div class="flex gap-2 mt-1">
            <span class="badge ${statusCls[part.status]||'badge-gray'}">${STATUS_LABELS[part.status]||part.status}</span>
            <span class="badge ${priorityCls[part.priority]||'badge-gray'}">${PRIORITY_LABELS[part.priority]||part.priority}</span>
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="item-price">${formatCurrency(part.price * (part.quantity||1))}</div>
          ${(part.quantity||1) > 1 ? `<div style="font-size:11px; color:var(--text-secondary);">${formatCurrency(part.price)} x${part.quantity}</div>` : ''}
          <div class="item-actions mt-1">
            <button class="btn-icon" title="Editar" onclick="PartsModule.showEditModal('${part.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" title="Mover para Build" onclick="ShoppingModule.moveToBuild('${part.id}')">
              <i class="fas fa-share"></i>
            </button>
            <button class="btn-icon" style="color:var(--danger);" title="Excluir" onclick="ShoppingModule.deleteItem('${part.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBuildsTab() {
    const builds = DB.Builds.getAll();
    const categories = DB.Settings.getCategories();
    if (builds.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">🖥️</div><h3>Nenhuma build criada</h3><button class="btn-primary" onclick="App.navigate('builds'); setTimeout(()=>BuildsModule.showCreateModal(),100)"><i class="fas fa-plus"></i> Criar Build</button></div>`;
    }
    return builds.map(b => {
      const pendingParts = b.parts.filter(p => p.status !== 'bought' && p.status !== 'discarded');
      const boughtParts = b.parts.filter(p => p.status === 'bought');
      const stats = DB.Builds.getStats(b);
      return `
        <div class="card mb-3">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <div style="width:10px; height:10px; border-radius:50%; background:${b.color}; flex-shrink:0;"></div>
              <div>
                <div class="card-title">${escapeHtml(b.name)}</div>
                <div class="card-subtitle">${b.parts.length} peça(s) · ${formatCurrency(stats.total)}</div>
              </div>
            </div>
            <div class="badge ${stats.progress===100?'badge-success':'badge-primary'}">${stats.progress}%</div>
          </div>
          ${pendingParts.length > 0 ? `
            <div style="margin-bottom:10px;">
              <div style="font-size:12px; font-weight:600; color:var(--warning); margin-bottom:8px;">
                <i class="fas fa-clock"></i> Pendentes (${pendingParts.length})
              </div>
              <div class="items-list">
                ${pendingParts.map(p => {
                  const cat = categories.find(c => c.id === p.category) || { icon:'📌', color:'#94a3b8' };
                  return `<div class="item-card" style="padding:10px 12px;">
                    <div>${cat.icon}</div>
                    <div class="item-info" style="cursor:pointer;" onclick="App.navigate('builds'); setTimeout(()=>BuildsModule.openBuild('${b.id}'),100); App.closeModal();">
                      <div class="item-name" style="font-size:14px;">${escapeHtml(p.name)}</div>
                      <div class="item-meta"><span>${escapeHtml(p.brand||'')}</span>${p.store ? `<span>${escapeHtml(p.store)}</span>` : ''}</div>
                    </div>
                    <div class="item-price" style="font-size:14px;">${formatCurrency(p.price)}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}
          ${boughtParts.length > 0 ? `
            <div style="opacity:0.6;">
              <div style="font-size:12px; font-weight:600; color:var(--success); margin-bottom:8px;">
                <i class="fas fa-check-circle"></i> Comprados (${boughtParts.length})
              </div>
              <div class="items-list">
                ${boughtParts.map(p => {
                  const cat = categories.find(c => c.id === p.category) || { icon:'📌', color:'#94a3b8' };
                  return `<div class="item-card" style="padding:10px 12px;">
                    <div>${cat.icon}</div>
                    <div class="item-info"><div class="item-name" style="font-size:14px; text-decoration:line-through;">${escapeHtml(p.name)}</div></div>
                    <div class="item-price" style="font-size:14px;">${formatCurrency(p.price)}</div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}
          ${b.parts.length === 0 ? `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">Nenhuma peça nesta build</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderPriorityTab() {
    const parts = DB.Parts.getAll().filter(p => p.priority === 'high' && p.status !== 'bought');
    const categories = DB.Settings.getCategories();
    if (parts.length === 0) {
      return `<div class="empty-state"><div class="empty-state-icon">🔥</div><h3>Nenhum item de alta prioridade pendente</h3><p>Marque itens como alta prioridade no cadastro</p></div>`;
    }
    return `<div class="items-list">${parts.map(p => renderShoppingItem(p, categories)).join('')}</div>`;
  }

  // ===================== AÇÕES =====================
  function switchTab(tab, btn) {
    document.querySelectorAll('#shopping-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const content = document.getElementById('shopping-content');
    const categories = DB.Settings.getCategories();
    if (tab === 'all') content.innerHTML = renderAllTab(DB.Parts.getAll(), categories);
    else if (tab === 'builds') content.innerHTML = renderBuildsTab();
    else if (tab === 'priority') content.innerHTML = renderPriorityTab();
  }

  function toggleBought(id, checked) {
    DB.Parts.update(id, { status: checked ? 'bought' : 'pending' });
    App.updateBadges();
    refreshContent();
  }

  function moveToBuild(partId) {
    const builds = DB.Builds.getAll();
    const part = DB.Parts.getById(partId);
    if (!part) return;
    if (builds.length === 0) { App.toast('Crie uma build primeiro', 'warning'); return; }
    App.showModal('Mover para Build', `
      <div>
        <p style="color:var(--text-secondary); margin-bottom:16px;">Selecione a build de destino para <strong>${escapeHtml(part.name)}</strong>:</p>
        <select class="form-control" id="move-build-select">
          ${builds.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('')}
        </select>
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Mover', cls: 'btn-primary', action: () => {
        const buildId = document.getElementById('move-build-select').value;
        DB.Builds.addPart(buildId, part);
        App.closeModal();
        App.toast(`Peça movida para a build!`, 'success');
        App.updateBadges();
      }},
    ]);
  }

  function showMoveModal() {
    moveToBuild('');
  }

  function deleteItem(id) {
    const part = DB.Parts.getById(id);
    if (!part) return;
    App.confirm(`Excluir "${part.name}" da lista?`, () => {
      DB.Parts.delete(id);
      App.toast('Item removido', 'success');
      App.updateBadges();
      refreshContent();
    });
  }

  function refreshContent() {
    const activeTab = document.querySelector('#shopping-tabs .tab-btn.active');
    if (!activeTab) { render(); return; }
    const tabText = activeTab.textContent.trim().toLowerCase();
    const content = document.getElementById('shopping-content');
    const categories = DB.Settings.getCategories();
    if (tabText.startsWith('lista')) content.innerHTML = renderAllTab(DB.Parts.getAll(), categories);
    else if (tabText.startsWith('por')) content.innerHTML = renderBuildsTab();
    else content.innerHTML = renderPriorityTab();
  }

  function onSearch(value) {
    filter.search = value;
    refreshContent();
  }
  function onSort(value) {
    filter.sort = value;
    refreshContent();
  }
  function onFilterStatus(status) {
    filter.status = status;
    document.querySelectorAll('#shopping-filters .filters-bar:first-of-type .filter-chip').forEach(btn => {
      const map = {'':'Todos', pending:'Pendente', bought:'Comprado', searching:'Pesquisando', discarded:'Descartado'};
      btn.classList.toggle('active', btn.textContent.trim() === (map[status] || status));
    });
    refreshContent();
  }
  function onFilterPriority(p) {
    filter.priority = p;
    refreshContent();
  }
  function onFilterCategory(catId) {
    filter.category = catId;
    render();
  }

  return {
    render,
    switchTab,
    toggleBought,
    moveToBuild,
    showMoveModal,
    deleteItem,
    onSearch,
    onSort,
    onFilterStatus,
    onFilterPriority,
    onFilterCategory,
  };
})();
