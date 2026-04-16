/**
 * PC Builder Pro - Builds / Montagens
 * Sistema completo de criação e gerenciamento de builds
 */

const BuildsModule = (() => {

  let currentBuildId = null;

  function formatCurrency(value) {
    return 'R$ ' + (parseFloat(value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const BUILD_COLORS = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#84cc16'];
  const STATUS_LABELS = { planning: 'Planejando', inprogress: 'Em andamento', completed: 'Concluída', paused: 'Pausada' };
  const PRIORITY_LABELS = { high: 'Alta', medium: 'Média', low: 'Baixa' };
  const PART_STATUS_LABELS = { pending: 'Pendente', bought: 'Comprado', searching: 'Pesquisando', discarded: 'Descartado' };

  // ===================== TELA PRINCIPAL =====================
  function render() {
    const container = document.getElementById('page-builds');
    if (currentBuildId) {
      renderBuildDetail(currentBuildId);
      return;
    }
    renderBuildsList();
  }

  function renderBuildsList() {
    const container = document.getElementById('page-builds');
    const builds = DB.Builds.getAll();

    container.innerHTML = `
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Builds & Montagens</div>
          <div class="section-subtitle">${builds.length} build${builds.length !== 1 ? 's' : ''} criada${builds.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="section-actions">
          <button class="btn-secondary btn-sm" onclick="BuildsModule.showImportPartModal()">
            <i class="fas fa-file-import"></i> Importar Peça
          </button>
          <button class="btn-primary" onclick="BuildsModule.showCreateModal()">
            <i class="fas fa-plus"></i> Nova Build
          </button>
        </div>
      </div>

      ${builds.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🖥️</div>
          <h3>Nenhuma build criada</h3>
          <p>Crie sua primeira montagem de PC, notebook ou setup completo</p>
          <button class="btn-primary" onclick="BuildsModule.showCreateModal()">
            <i class="fas fa-plus"></i> Criar Primeira Build
          </button>
        </div>
      ` : `
        <div class="grid-3 fade-in" id="builds-grid">
          ${builds.map(b => renderBuildCard(b)).join('')}
        </div>
      `}
    `;
  }

  function renderBuildCard(build) {
    const stats = DB.Builds.getStats(build);
    return `
      <div class="build-card fade-in" onclick="BuildsModule.openBuild('${build.id}')">
        <div class="build-card-header">
          <div class="build-color-dot" style="background:${build.color};"></div>
          <div class="build-card-info">
            <div class="build-card-name">${escapeHtml(build.name)}</div>
            <div class="build-card-desc">${escapeHtml(build.description || build.purpose || STATUS_LABELS[build.status] || '')}</div>
          </div>
          <div class="build-card-actions" onclick="event.stopPropagation()">
            <button class="btn-icon" title="Duplicar" onclick="BuildsModule.duplicateBuild('${build.id}')">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn-icon" title="Editar" onclick="BuildsModule.showEditModal('${build.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" title="Excluir" style="color:var(--danger)" onclick="BuildsModule.deleteBuild('${build.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="build-stats">
          <div class="build-stat">
            <div class="build-stat-value">${formatCurrency(stats.total)}</div>
            <div class="build-stat-label">Total</div>
          </div>
          <div class="build-stat">
            <div class="build-stat-value">${stats.totalItems}</div>
            <div class="build-stat-label">Peças</div>
          </div>
          <div class="build-stat">
            <div class="build-stat-value" style="color:var(--success)">${formatCurrency(stats.bought)}</div>
            <div class="build-stat-label">Comprado</div>
          </div>
        </div>

        <div class="build-progress-section">
          <div class="build-progress-label">
            <span>Progresso</span>
            <span>${stats.boughtItems}/${stats.totalItems} itens comprados</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${stats.progress === 100 ? 'success' : ''}" style="width:${stats.progress}%; background:${build.color};"></div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:6px;">
            <span class="badge ${getBuildStatusBadge(build.status)}">${STATUS_LABELS[build.status] || build.status}</span>
            <span style="font-size:12px; color:var(--text-secondary);">${stats.progress}%</span>
          </div>
        </div>
      </div>
    `;
  }

  function getBuildStatusBadge(status) {
    const map = { planning: 'badge-primary', inprogress: 'badge-warning', completed: 'badge-success', paused: 'badge-gray' };
    return map[status] || 'badge-gray';
  }

  // ===================== DETALHE DA BUILD =====================
  function openBuild(id) {
    currentBuildId = id;
    renderBuildDetail(id);
  }

  function renderBuildDetail(id) {
    const container = document.getElementById('page-builds');
    const build = DB.Builds.getById(id);
    if (!build) { currentBuildId = null; renderBuildsList(); return; }
    const stats = DB.Builds.getStats(build);
    const categories = DB.Settings.getCategories();

    // Agrupar peças por categoria
    const partsByCategory = {};
    build.parts.forEach(p => {
      if (!partsByCategory[p.category]) partsByCategory[p.category] = [];
      partsByCategory[p.category].push(p);
    });

    container.innerHTML = `
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 mb-4 fade-in" style="color:var(--text-secondary); font-size:13px;">
        <button onclick="BuildsModule.closeBuild()" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size:13px; padding:0;">
          <i class="fas fa-arrow-left" style="margin-right:4px;"></i> Builds
        </button>
        <span>/</span>
        <span style="color:var(--text-primary); font-weight:600;">${escapeHtml(build.name)}</span>
      </div>

      <!-- Build Header -->
      <div class="card mb-4 fade-in">
        <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start;">
          <div style="width:50px; height:50px; background:${build.color}20; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">🖥️</div>
          <div style="flex:1; min-width:200px;">
            <h2 style="font-size:22px; font-weight:700; margin-bottom:4px;">${escapeHtml(build.name)}</h2>
            ${build.description ? `<p style="color:var(--text-secondary); font-size:14px; margin-bottom:8px;">${escapeHtml(build.description)}</p>` : ''}
            <div class="flex gap-2 flex-wrap">
              <span class="badge ${getBuildStatusBadge(build.status)}">${STATUS_LABELS[build.status] || build.status}</span>
              ${build.platform ? `<span class="badge badge-info">${escapeHtml(build.platform)}</span>` : ''}
              ${build.socket ? `<span class="badge badge-gray">Socket ${escapeHtml(build.socket)}</span>` : ''}
              ${build.memoryType ? `<span class="badge badge-gray">${escapeHtml(build.memoryType)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0;">
            <button class="btn-secondary btn-sm" onclick="BuildsModule.showEditModal('${build.id}')">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-secondary btn-sm" onclick="BuildsModule.duplicateBuild('${build.id}')">
              <i class="fas fa-copy"></i> Duplicar
            </button>
          </div>
        </div>

        <!-- Stats da build -->
        <div class="divider"></div>
        <div class="stat-grid" style="grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));">
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(99,102,241,.15);"><i class="fas fa-coins" style="color:#6366f1;"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:16px;">${formatCurrency(stats.total)}</div><div class="stat-label">Valor Total</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(16,185,129,.15);"><i class="fas fa-check" style="color:#10b981;"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:16px;">${formatCurrency(stats.bought)}</div><div class="stat-label">Comprado</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(245,158,11,.15);"><i class="fas fa-clock" style="color:#f59e0b;"></i></div>
            <div class="stat-info"><div class="stat-value" style="font-size:16px;">${formatCurrency(stats.pending)}</div><div class="stat-label">Falta Comprar</div></div>
          </div>
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(59,130,246,.15);"><i class="fas fa-box" style="color:#3b82f6;"></i></div>
            <div class="stat-info"><div class="stat-value">${stats.totalItems}</div><div class="stat-label">Total de Peças</div></div>
          </div>
          ${build.budget > 0 ? `
          <div class="stat-card" style="cursor:default;">
            <div class="stat-icon" style="background:rgba(168,85,247,.15);"><i class="fas fa-wallet" style="color:#a855f7;"></i></div>
            <div class="stat-info">
              <div class="stat-value" style="font-size:16px; color:${stats.total > build.budget ? 'var(--danger)' : 'var(--success)'};">${formatCurrency(Math.abs(build.budget - stats.total))}</div>
              <div class="stat-label">${stats.total > build.budget ? 'Acima do Orçamento' : 'Dentro do Orçamento'}</div>
            </div>
          </div>` : ''}
        </div>

        <!-- Progresso -->
        <div class="mt-4">
          <div class="build-progress-label">
            <span style="font-weight:600;">Progresso da Montagem</span>
            <span>${stats.boughtItems} de ${stats.totalItems} itens comprados — ${stats.progress}%</span>
          </div>
          <div class="progress-bar" style="height:10px;">
            <div class="progress-fill ${stats.progress === 100 ? 'success' : ''}" style="width:${stats.progress}%; background:${build.color};"></div>
          </div>
        </div>
      </div>

      <!-- Peças por Categoria -->
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Peças da Build</div>
          <div class="section-subtitle">Organize e acompanhe cada componente</div>
        </div>
        <div class="section-actions">
          <button class="btn-secondary btn-sm" onclick="BuildsModule.showCompatibilityPanel('${build.id}')">
            <i class="fas fa-check-double"></i> Compatibilidade
          </button>
          <button class="btn-primary" onclick="BuildsModule.showAddPartModal('${build.id}')">
            <i class="fas fa-plus"></i> Adicionar Peça
          </button>
        </div>
      </div>

      <div id="build-parts-container" class="fade-in">
        ${renderPartsByCategory(build, partsByCategory, categories, stats)}
      </div>

      ${build.notes ? `
        <div class="card mt-4 fade-in">
          <div class="card-title mb-3"><i class="fas fa-sticky-note" style="margin-right:6px; color:var(--warning);"></i>Notas</div>
          <p style="font-size:14px; color:var(--text-secondary); white-space:pre-wrap;">${escapeHtml(build.notes)}</p>
        </div>
      ` : ''}

      <div style="height:40px;"></div>
    `;
  }

  function renderPartsByCategory(build, partsByCategory, categories, stats) {
    if (build.parts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-state-icon">🔧</div>
        <h3>Nenhuma peça adicionada</h3>
        <p>Adicione componentes à sua build</p>
        <button class="btn-primary" onclick="BuildsModule.showAddPartModal('${build.id}')">
          <i class="fas fa-plus"></i> Adicionar Primeira Peça
        </button>
      </div>`;
    }

    // Total por categoria
    const catTotals = Object.entries(stats.byCategory || {}).map(([catId, data]) => ({
      catId, ...data,
      cat: categories.find(c => c.id === catId) || { id: catId, name: catId, icon: '📌', color: '#94a3b8' }
    })).sort((a, b) => b.total - a.total);

    let html = '';

    // Subtotal por categoria
    if (catTotals.length > 1) {
      html += `<div class="card mb-4">
        <div class="card-title mb-3">Subtotal por Categoria</div>
        <div class="grid-3" style="gap:10px;">
          ${catTotals.map(ct => `
            <div style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--bg-tertiary); border-radius:var(--radius-md);">
              <span style="font-size:18px;">${ct.cat.icon}</span>
              <div style="flex:1; min-width:0;">
                <div style="font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ct.cat.name}</div>
                <div style="font-size:14px; font-weight:700; color:var(--primary);">${formatCurrency(ct.total)}</div>
              </div>
              <div style="font-size:11px; color:var(--text-muted);">${ct.count}x</div>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    // Peças agrupadas por categoria
    Object.entries(partsByCategory).forEach(([catId, parts]) => {
      const cat = categories.find(c => c.id === catId) || { id: catId, name: catId, icon: '📌', color: '#94a3b8' };
      const catTotal = parts.reduce((s, p) => s + p.price * p.quantity, 0);
      html += `
        <div class="card mb-3">
          <div class="card-header">
            <div class="flex items-center gap-2">
              <span style="font-size:22px;">${cat.icon}</span>
              <div>
                <div class="card-title">${cat.name}</div>
                <div class="card-subtitle">${parts.length} item${parts.length !== 1 ? 's' : ''} · ${formatCurrency(catTotal)}</div>
              </div>
            </div>
          </div>
          <div class="items-list">
            ${parts.map(part => renderBuildPartItem(part, build.id, cat)).join('')}
          </div>
        </div>
      `;
    });

    return html;
  }

  function renderBuildPartItem(part, buildId, cat) {
    const statusCls = { pending: 'status-pending', bought: 'status-bought', searching: 'status-searching', discarded: 'status-discarded' };
    const priorityCls = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    return `
      <div class="item-card" id="part-${part.id}">
        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
          <input type="checkbox" ${part.status === 'bought' ? 'checked' : ''}
            onchange="BuildsModule.togglePartBought('${buildId}', '${part.id}', this.checked)"
            style="width:16px; height:16px; cursor:pointer; accent-color:var(--success);" />
        </div>
        <div class="item-icon" style="background:${cat.color}20;">${cat.icon}</div>
        <div class="item-info">
          <div class="item-name" style="${part.status === 'bought' ? 'text-decoration:line-through; opacity:0.6;' : ''}">${escapeHtml(part.name)}</div>
          <div class="item-meta">
            ${part.brand ? `<span>${escapeHtml(part.brand)}</span>` : ''}
            ${part.model ? `<span>${escapeHtml(part.model)}</span>` : ''}
            ${part.store ? `<span>${escapeHtml(part.store)}</span>` : ''}
            ${part.quantity > 1 ? `<span>Qtd: ${part.quantity}</span>` : ''}
          </div>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span class="badge ${statusCls[part.status] || 'badge-gray'}">${PART_STATUS_LABELS[part.status] || part.status}</span>
            <span class="badge ${priorityCls[part.priority] || 'badge-gray'}">${PRIORITY_LABELS[part.priority] || part.priority}</span>
            ${part.compatibility ? `<span class="badge badge-info" title="${escapeHtml(part.compatibility)}"><i class="fas fa-info-circle"></i></span>` : ''}
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="item-price">${formatCurrency(part.price * part.quantity)}</div>
          ${part.quantity > 1 ? `<div style="font-size:11px; color:var(--text-secondary);">${formatCurrency(part.price)} each</div>` : ''}
          <div class="item-actions mt-2">
            <button class="btn-icon" title="Editar" onclick="BuildsModule.showEditPartModal('${buildId}', '${part.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" title="Excluir" style="color:var(--danger)" onclick="BuildsModule.deletePartFromBuild('${buildId}', '${part.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ===================== TOGGLE COMPRADO =====================
  function togglePartBought(buildId, partId, checked) {
    DB.Builds.updatePart(buildId, partId, { status: checked ? 'bought' : 'pending' });
    renderBuildDetail(buildId);
    App.updateBadges();
  }

  // ===================== MODAIS =====================
  function showCreateModal() {
    const colors = BUILD_COLORS.map((c, i) => `
      <button type="button" onclick="document.getElementById('build-color').value='${c}'; document.querySelectorAll('.color-dot-btn').forEach(b=>b.classList.remove('selected')); this.classList.add('selected');"
        class="color-dot-btn ${i === 0 ? 'selected' : ''}"
        style="width:28px; height:28px; border-radius:50%; background:${c}; border:3px solid ${i === 0 ? 'white' : 'transparent'}; cursor:pointer; transition:all .2s; box-shadow:0 2px 4px rgba(0,0,0,.3);"
      ></button>
    `).join('');

    App.showModal('Nova Build', `
      <form id="build-form">
        <div class="form-group">
          <label class="form-label">Nome da Build <span class="required">*</span></label>
          <input class="form-control" id="build-name" placeholder="Ex: PC Gamer AM5, Setup Home Office..." required autofocus />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="build-status">
              <option value="planning">Planejando</option>
              <option value="inprogress">Em andamento</option>
              <option value="completed">Concluída</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Orçamento (R$)</label>
            <input class="form-control" id="build-budget" type="number" min="0" step="0.01" placeholder="0,00" />
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Plataforma</label>
            <select class="form-control" id="build-platform">
              <option value="">Selecionar...</option>
              <option>Intel</option>
              <option>AMD</option>
              <option>Notebook</option>
              <option>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Socket</label>
            <select class="form-control" id="build-socket">
              <option value="">Selecionar...</option>
              <option>AM5</option>
              <option>AM4</option>
              <option>LGA1700</option>
              <option>LGA1200</option>
              <option>LGA1851</option>
              <option>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Memória</label>
            <select class="form-control" id="build-memory">
              <option value="">Selecionar...</option>
              <option>DDR5</option>
              <option>DDR4</option>
              <option>LPDDR5</option>
              <option>LPDDR4X</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição / Finalidade</label>
          <input class="form-control" id="build-desc" placeholder="Ex: Gaming 1440p, Home office, Edição de vídeo..." />
        </div>
        <div class="form-group">
          <label class="form-label">Cor da Build</label>
          <div class="flex gap-2 flex-wrap mt-1">${colors}</div>
          <input type="hidden" id="build-color" value="${BUILD_COLORS[0]}" />
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" id="build-notes" rows="2" placeholder="Observações gerais..."></textarea>
        </div>
      </form>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Criar Build', cls: 'btn-primary', action: () => submitCreate() },
    ]);
    // Fix selected color dots visual
    document.querySelectorAll('.color-dot-btn').forEach((btn, i) => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.color-dot-btn').forEach(b => b.style.border = '3px solid transparent');
        this.style.border = '3px solid white';
      });
    });
    if (document.querySelectorAll('.color-dot-btn')[0]) {
      document.querySelectorAll('.color-dot-btn')[0].style.border = '3px solid white';
    }
  }

  function submitCreate() {
    const name = document.getElementById('build-name').value.trim();
    if (!name) { App.toast('Nome da build é obrigatório', 'error'); return; }
    const build = DB.Builds.create({
      name,
      status: document.getElementById('build-status').value,
      budget: document.getElementById('build-budget').value,
      platform: document.getElementById('build-platform').value,
      socket: document.getElementById('build-socket').value,
      memoryType: document.getElementById('build-memory').value,
      description: document.getElementById('build-desc').value,
      color: document.getElementById('build-color').value,
      notes: document.getElementById('build-notes').value,
    });
    App.closeModal();
    App.toast('Build criada com sucesso!', 'success');
    App.updateBadges();
    openBuild(build.id);
  }

  function showEditModal(id) {
    const build = DB.Builds.getById(id);
    if (!build) return;
    const colors = BUILD_COLORS.map((c, i) => `
      <button type="button"
        onclick="document.getElementById('edit-build-color').value='${c}'; document.querySelectorAll('.color-dot-btn').forEach(b=>b.style.border='3px solid transparent'); this.style.border='3px solid white';"
        class="color-dot-btn"
        style="width:28px; height:28px; border-radius:50%; background:${c}; border:3px solid ${c === build.color ? 'white' : 'transparent'}; cursor:pointer; transition:all .2s; box-shadow:0 2px 4px rgba(0,0,0,.3);"
      ></button>
    `).join('');

    App.showModal('Editar Build', `
      <form id="edit-build-form">
        <div class="form-group">
          <label class="form-label">Nome <span class="required">*</span></label>
          <input class="form-control" id="edit-build-name" value="${escapeHtml(build.name)}" required />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="edit-build-status">
              <option value="planning" ${build.status==='planning'?'selected':''}>Planejando</option>
              <option value="inprogress" ${build.status==='inprogress'?'selected':''}>Em andamento</option>
              <option value="completed" ${build.status==='completed'?'selected':''}>Concluída</option>
              <option value="paused" ${build.status==='paused'?'selected':''}>Pausada</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Orçamento (R$)</label>
            <input class="form-control" id="edit-build-budget" type="number" min="0" step="0.01" value="${build.budget || ''}" />
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Plataforma</label>
            <select class="form-control" id="edit-build-platform">
              <option value="">Selecionar...</option>
              ${['Intel','AMD','Notebook','Outro'].map(p => `<option ${build.platform===p?'selected':''}>${p}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Socket</label>
            <select class="form-control" id="edit-build-socket">
              <option value="">Selecionar...</option>
              ${['AM5','AM4','LGA1700','LGA1200','LGA1851','Outro'].map(s => `<option ${build.socket===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Memória</label>
            <select class="form-control" id="edit-build-memory">
              <option value="">Selecionar...</option>
              ${['DDR5','DDR4','LPDDR5','LPDDR4X'].map(m => `<option ${build.memoryType===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <input class="form-control" id="edit-build-desc" value="${escapeHtml(build.description || '')}" />
        </div>
        <div class="form-group">
          <label class="form-label">Cor</label>
          <div class="flex gap-2 flex-wrap mt-1">${colors}</div>
          <input type="hidden" id="edit-build-color" value="${build.color}" />
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" id="edit-build-notes" rows="2">${escapeHtml(build.notes || '')}</textarea>
        </div>
      </form>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Salvar', cls: 'btn-primary', action: () => submitEdit(id) },
    ]);
  }

  function submitEdit(id) {
    const name = document.getElementById('edit-build-name').value.trim();
    if (!name) { App.toast('Nome obrigatório', 'error'); return; }
    DB.Builds.update(id, {
      name,
      status: document.getElementById('edit-build-status').value,
      budget: document.getElementById('edit-build-budget').value,
      platform: document.getElementById('edit-build-platform').value,
      socket: document.getElementById('edit-build-socket').value,
      memoryType: document.getElementById('edit-build-memory').value,
      description: document.getElementById('edit-build-desc').value,
      color: document.getElementById('edit-build-color').value,
      notes: document.getElementById('edit-build-notes').value,
    });
    App.closeModal();
    App.toast('Build atualizada!', 'success');
    App.updateBadges();
    if (currentBuildId === id) renderBuildDetail(id);
    else renderBuildsList();
  }

  function deleteBuild(id) {
    const build = DB.Builds.getById(id);
    if (!build) return;
    App.confirm(`Excluir a build "${build.name}"? Esta ação não pode ser desfeita.`, () => {
      DB.Builds.delete(id);
      if (currentBuildId === id) currentBuildId = null;
      App.toast('Build excluída', 'success');
      App.updateBadges();
      renderBuildsList();
    });
  }

  function duplicateBuild(id) {
    const newBuild = DB.Builds.duplicate(id);
    if (newBuild) {
      App.toast('Build duplicada com sucesso!', 'success');
      App.updateBadges();
      renderBuildsList();
    }
  }

  function closeBuild() {
    currentBuildId = null;
    renderBuildsList();
  }

  // ===================== MODAL ADICIONAR/EDITAR PEÇA =====================
  function showAddPartModal(buildId) {
    const build = DB.Builds.getById(buildId);
    if (!build) return;
    const categories = DB.Settings.getCategories();
    showPartFormModal('Adicionar Peça', null, buildId, categories, build);
  }

  function showEditPartModal(buildId, partId) {
    const build = DB.Builds.getById(buildId);
    if (!build) return;
    const part = build.parts.find(p => p.id === partId);
    if (!part) return;
    const categories = DB.Settings.getCategories();
    showPartFormModal('Editar Peça', part, buildId, categories, build);
  }

  function showPartFormModal(title, part, buildId, categories, build) {
    const catOptions = categories.map(c =>
      `<option value="${c.id}" ${part && part.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');

    App.showModal(title, `
      <form id="part-form">
        <div class="form-group">
          <label class="form-label">Nome da Peça <span class="required">*</span></label>
          <input class="form-control" id="pf-name" value="${part ? escapeHtml(part.name) : ''}" placeholder="Ex: Ryzen 7 7700X, RTX 4070 Ti..." required autofocus />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-control" id="pf-category">${catOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="pf-status">
              <option value="pending" ${part && part.status==='pending'?'selected':''}>Pendente</option>
              <option value="searching" ${part && part.status==='searching'?'selected':''}>Pesquisando</option>
              <option value="bought" ${part && part.status==='bought'?'selected':''}>Comprado</option>
              <option value="discarded" ${part && part.status==='discarded'?'selected':''}>Descartado</option>
            </select>
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <input class="form-control" id="pf-brand" value="${part ? escapeHtml(part.brand) : ''}" placeholder="AMD, Intel, Samsung..." list="brands-list" />
          </div>
          <div class="form-group">
            <label class="form-label">Modelo</label>
            <input class="form-control" id="pf-model" value="${part ? escapeHtml(part.model) : ''}" placeholder="Modelo específico..." />
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade</label>
            <select class="form-control" id="pf-priority">
              <option value="high" ${part && part.priority==='high'?'selected':''}>Alta</option>
              <option value="medium" ${!part || part.priority==='medium'?'selected':''}>Média</option>
              <option value="low" ${part && part.priority==='low'?'selected':''}>Baixa</option>
            </select>
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input class="form-control" id="pf-price" type="number" min="0" step="0.01" value="${part ? part.price : ''}" placeholder="0,00" />
          </div>
          <div class="form-group">
            <label class="form-label">Quantidade</label>
            <input class="form-control" id="pf-qty" type="number" min="1" value="${part ? part.quantity : 1}" />
          </div>
          <div class="form-group">
            <label class="form-label">Loja</label>
            <input class="form-control" id="pf-store" value="${part ? escapeHtml(part.store) : ''}" placeholder="Kabum, Amazon, ML..." list="stores-list" />
          </div>
        </div>

        <!-- Compatibilidade -->
        <details style="margin-bottom:16px;">
          <summary style="cursor:pointer; font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:8px;">
            <i class="fas fa-microchip" style="margin-right:4px;"></i> Informações de Compatibilidade
          </summary>
          <div class="form-row cols-2 mt-3">
            <div class="form-group">
              <label class="form-label">Socket</label>
              <select class="form-control" id="pf-socket">
                <option value="">Nenhum</option>
                ${['AM5','AM4','LGA1700','LGA1200','LGA1851'].map(s => `<option ${part && part.socket===s?'selected':''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Chipset</label>
              <input class="form-control" id="pf-chipset" value="${part ? escapeHtml(part.chipset) : ''}" placeholder="B650, X670, Z790..." />
            </div>
            <div class="form-group">
              <label class="form-label">Plataforma</label>
              <select class="form-control" id="pf-platform">
                <option value="">Nenhum</option>
                ${['Intel','AMD'].map(p => `<option ${part && part.platform===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Memória</label>
              <select class="form-control" id="pf-memtype">
                <option value="">Nenhum</option>
                ${['DDR5','DDR4','LPDDR5','LPDDR4X'].map(m => `<option ${part && part.memoryType===m?'selected':''}>${m}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Potência (W)</label>
              <input class="form-control" id="pf-wattage" type="number" value="${part ? part.wattage : ''}" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">Formato</label>
              <select class="form-control" id="pf-formfactor">
                <option value="">Nenhum</option>
                ${['ATX','mATX','ITX','E-ATX','M.2','2.5"','3.5"'].map(f => `<option ${part && part.formFactor===f?'selected':''}>${f}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Observação de Compatibilidade</label>
            <input class="form-control" id="pf-compat" value="${part ? escapeHtml(part.compatibility) : ''}" placeholder="Compatível com AM5, requer DDR5..." />
          </div>
        </details>

        <div class="form-group">
          <label class="form-label">Link (apenas texto)</label>
          <input class="form-control" id="pf-link" value="${part ? escapeHtml(part.link) : ''}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-control" id="pf-notes" rows="2" placeholder="Detalhes adicionais...">${part ? escapeHtml(part.notes) : ''}</textarea>
        </div>
      </form>

      <datalist id="brands-list">
        ${DB.Settings.getBrands().map(b => `<option value="${escapeHtml(b)}">`).join('')}
      </datalist>
      <datalist id="stores-list">
        ${DB.Settings.getStores().map(s => `<option value="${escapeHtml(s)}">`).join('')}
      </datalist>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: part ? 'Salvar' : 'Adicionar', cls: 'btn-primary', action: () => submitPartForm(buildId, part ? part.id : null) },
    ], 'modal-lg');
  }

  function submitPartForm(buildId, partId) {
    const name = document.getElementById('pf-name').value.trim();
    if (!name) { App.toast('Nome da peça é obrigatório', 'error'); return; }
    const brand = document.getElementById('pf-brand').value.trim();
    const store = document.getElementById('pf-store').value.trim();
    if (brand) DB.Settings.addBrand(brand);
    if (store) DB.Settings.addStore(store);

    const data = {
      name,
      category: document.getElementById('pf-category').value,
      status: document.getElementById('pf-status').value,
      brand,
      model: document.getElementById('pf-model').value.trim(),
      priority: document.getElementById('pf-priority').value,
      price: document.getElementById('pf-price').value,
      quantity: document.getElementById('pf-qty').value,
      store,
      socket: document.getElementById('pf-socket').value,
      chipset: document.getElementById('pf-chipset').value,
      platform: document.getElementById('pf-platform').value,
      memoryType: document.getElementById('pf-memtype').value,
      wattage: document.getElementById('pf-wattage').value,
      formFactor: document.getElementById('pf-formfactor').value,
      compatibility: document.getElementById('pf-compat').value,
      link: document.getElementById('pf-link').value.trim(),
      notes: document.getElementById('pf-notes').value.trim(),
    };

    if (partId) {
      DB.Builds.updatePart(buildId, partId, data);
      App.toast('Peça atualizada!', 'success');
    } else {
      DB.Builds.addPart(buildId, data);
      App.toast('Peça adicionada!', 'success');
    }
    App.closeModal();
    App.updateBadges();
    renderBuildDetail(buildId);
  }

  function deletePartFromBuild(buildId, partId) {
    App.confirm('Excluir esta peça da build?', () => {
      DB.Builds.deletePart(buildId, partId);
      App.toast('Peça removida', 'success');
      App.updateBadges();
      renderBuildDetail(buildId);
    });
  }

  // ===================== PAINEL DE COMPATIBILIDADE =====================
  function showCompatibilityPanel(buildId) {
    const build = DB.Builds.getById(buildId);
    if (!build) return;

    // Coleta informações de compatibilidade das peças
    const sockets = [...new Set(build.parts.filter(p => p.socket).map(p => p.socket))];
    const platforms = [...new Set(build.parts.filter(p => p.platform).map(p => p.platform))];
    const memTypes = [...new Set(build.parts.filter(p => p.memoryType).map(p => p.memoryType))];
    const chipsets = [...new Set(build.parts.filter(p => p.chipset).map(p => p.chipset))];
    const totalWattage = build.parts.reduce((s, p) => s + (parseFloat(p.wattage) || 0), 0);

    // Verificações básicas
    const warnings = [];
    const okMessages = [];

    if (sockets.length > 1) warnings.push(`⚠️ Múltiplos sockets detectados: ${sockets.join(', ')} — verifique compatibilidade`);
    else if (sockets.length === 1) okMessages.push(`✅ Socket uniforme: ${sockets[0]}`);

    if (platforms.length > 1) warnings.push(`⚠️ Plataformas mistas: ${platforms.join(' + ')} — verifique se intencional`);
    else if (platforms.length === 1) okMessages.push(`✅ Plataforma: ${platforms[0]}`);

    if (memTypes.length > 1) warnings.push(`⚠️ Tipos de memória diferentes: ${memTypes.join(', ')} — verifique compatibilidade`);
    else if (memTypes.length === 1) okMessages.push(`✅ Tipo de memória: ${memTypes[0]}`);

    if (build.socket && sockets.length > 0 && !sockets.includes(build.socket)) {
      warnings.push(`⚠️ Socket da build (${build.socket}) diferente do socket das peças (${sockets.join(', ')})`);
    }

    if (build.memoryType && memTypes.length > 0 && !memTypes.includes(build.memoryType)) {
      warnings.push(`⚠️ Memória da build (${build.memoryType}) diferente das peças (${memTypes.join(', ')})`);
    }

    if (totalWattage > 0) {
      const psu = build.parts.find(p => p.category === 'psu');
      if (psu) {
        const psuWatts = parseFloat(psu.wattage) || 0;
        if (psuWatts > 0) {
          const usage = Math.round((totalWattage / psuWatts) * 100);
          if (usage > 80) warnings.push(`⚠️ Consumo estimado (${totalWattage}W) é ${usage}% da fonte (${psuWatts}W) — considere uma fonte maior`);
          else okMessages.push(`✅ Consumo estimado: ${totalWattage}W / ${psuWatts}W (${usage}% da fonte)`);
        }
      } else {
        okMessages.push(`ℹ️ Consumo estimado das peças: ${totalWattage}W (adicione uma fonte à build)`);
      }
    }

    App.showModal('Verificação de Compatibilidade', `
      <div>
        <div class="flex items-center gap-2 mb-4">
          <div style="font-size:24px;">🖥️</div>
          <div>
            <div style="font-weight:700;">${escapeHtml(build.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${build.parts.length} peça(s) analisada(s)</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:16px;">
          <div style="text-align:center; padding:12px; background:var(--bg-tertiary); border-radius:var(--radius-md);">
            <div style="font-size:20px; font-weight:700;">${sockets.join(', ') || '—'}</div>
            <div style="font-size:11px; color:var(--text-secondary);">Socket</div>
          </div>
          <div style="text-align:center; padding:12px; background:var(--bg-tertiary); border-radius:var(--radius-md);">
            <div style="font-size:20px; font-weight:700;">${memTypes.join(', ') || '—'}</div>
            <div style="font-size:11px; color:var(--text-secondary);">Memória</div>
          </div>
          <div style="text-align:center; padding:12px; background:var(--bg-tertiary); border-radius:var(--radius-md);">
            <div style="font-size:20px; font-weight:700;">${totalWattage > 0 ? totalWattage + 'W' : '—'}</div>
            <div style="font-size:11px; color:var(--text-secondary);">Consumo Est.</div>
          </div>
        </div>

        ${chipsets.length > 0 ? `<div style="margin-bottom:12px; padding:10px; background:var(--bg-tertiary); border-radius:var(--radius-md); font-size:13px;">
          <span style="color:var(--text-secondary);">Chipsets:</span> ${chipsets.join(', ')}
        </div>` : ''}

        ${warnings.length > 0 ? `
          <div style="background:rgba(239,68,68,.1); border:1px solid rgba(239,68,68,.3); border-radius:var(--radius-md); padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:var(--danger); margin-bottom:8px;"><i class="fas fa-exclamation-triangle"></i> Alertas</div>
            ${warnings.map(w => `<div style="font-size:13px; margin-bottom:4px;">${w}</div>`).join('')}
          </div>
        ` : ''}

        ${okMessages.length > 0 ? `
          <div style="background:rgba(16,185,129,.1); border:1px solid rgba(16,185,129,.3); border-radius:var(--radius-md); padding:12px; margin-bottom:12px;">
            <div style="font-weight:700; color:var(--success); margin-bottom:8px;"><i class="fas fa-check-circle"></i> OK</div>
            ${okMessages.map(m => `<div style="font-size:13px; margin-bottom:4px;">${m}</div>`).join('')}
          </div>
        ` : ''}

        ${warnings.length === 0 && okMessages.length === 0 ? `
          <div style="text-align:center; color:var(--text-secondary); padding:20px;">
            <div style="font-size:40px; margin-bottom:10px;">ℹ️</div>
            <p>Adicione informações de socket, plataforma e memória às peças para verificar compatibilidade.</p>
          </div>
        ` : ''}

        <div style="font-size:11px; color:var(--text-muted); margin-top:12px; padding-top:12px; border-top:1px solid var(--border);">
          * Esta verificação é baseada nas informações inseridas manualmente. Sempre confirme a compatibilidade nos manuais oficiais.
        </div>
      </div>
    `, [{ label: 'Fechar', cls: 'btn-ghost', action: () => App.closeModal() }]);
  }

  function showImportPartModal() {
    const builds = DB.Builds.getAll();
    const parts = DB.Parts.getAll();
    if (builds.length === 0) { App.toast('Crie uma build primeiro', 'warning'); return; }
    if (parts.length === 0) { App.toast('Nenhuma peça cadastrada', 'warning'); return; }

    App.showModal('Importar Peça da Lista', `
      <div>
        <div class="form-group">
          <label class="form-label">Selecionar Build de Destino</label>
          <select class="form-control" id="import-build-id">
            ${builds.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Peça da Lista de Compras</label>
          <select class="form-control" id="import-part-id">
            ${parts.map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${formatCurrency(p.price)}</option>`).join('')}
          </select>
        </div>
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Importar', cls: 'btn-primary', action: () => {
        const buildId = document.getElementById('import-build-id').value;
        const partId = document.getElementById('import-part-id').value;
        const part = DB.Parts.getById(partId);
        if (!part) return;
        DB.Builds.addPart(buildId, part);
        App.closeModal();
        App.toast('Peça importada para a build!', 'success');
        if (currentBuildId === buildId) renderBuildDetail(buildId);
        else openBuild(buildId);
        App.updateBadges();
      }},
    ]);
  }

  return {
    render,
    openBuild,
    closeBuild,
    showCreateModal,
    showEditModal,
    deleteBuild,
    duplicateBuild,
    showAddPartModal,
    showEditPartModal,
    deletePartFromBuild,
    togglePartBought,
    showCompatibilityPanel,
    showImportPartModal,
  };
})();
