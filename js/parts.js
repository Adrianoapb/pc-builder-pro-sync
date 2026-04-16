/**
 * PC Builder Pro - Gerenciamento de Peças
 * Cadastro, edição, exclusão e histórico de preços
 */

const PartsModule = (() => {

  let currentFilter = { status: '', category: '', priority: '', sort: 'date-desc', search: '' };

  function formatCurrency(v) {
    return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const STATUS_LABELS = { pending: 'Pendente', bought: 'Comprado', searching: 'Pesquisando', discarded: 'Descartado' };
  const PRIORITY_LABELS = { high: 'Alta', medium: 'Média', low: 'Baixa' };

  function render() {
    const container = document.getElementById('page-parts');
    const categories = DB.Settings.getCategories();
    const allParts = DB.Parts.getAll();

    container.innerHTML = `
      <!-- Header -->
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Catálogo de Peças</div>
          <div class="section-subtitle">${allParts.length} peça${allParts.length !== 1 ? 's' : ''} cadastrada${allParts.length !== 1 ? 's' : ''}</div>
        </div>
        <div class="section-actions">
          <button class="btn-secondary btn-sm" onclick="PartsModule.showBulkActions()">
            <i class="fas fa-list-check"></i> Ações em Lote
          </button>
          <button class="btn-primary" onclick="PartsModule.showCreateModal()">
            <i class="fas fa-plus"></i> Nova Peça
          </button>
        </div>
      </div>

      <!-- Busca e Filtros -->
      <div class="card mb-4 fade-in" id="parts-filters">
        <div class="flex gap-2 mb-3" style="flex-wrap:wrap;">
          <div style="position:relative; flex:1; min-width:200px;">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:13px;"></i>
            <input class="form-control" id="parts-search" placeholder="Buscar por nome, marca, modelo..."
              style="padding-left:36px;" oninput="PartsModule.onSearch(this.value)" value="${escapeHtml(currentFilter.search)}" />
          </div>
          <select class="filter-select" id="parts-sort" onchange="PartsModule.onSort(this.value)">
            <option value="date-desc" ${currentFilter.sort==='date-desc'?'selected':''}>Mais recentes</option>
            <option value="date-asc" ${currentFilter.sort==='date-asc'?'selected':''}>Mais antigos</option>
            <option value="price-asc" ${currentFilter.sort==='price-asc'?'selected':''}>Menor preço</option>
            <option value="price-desc" ${currentFilter.sort==='price-desc'?'selected':''}>Maior preço</option>
            <option value="name-asc" ${currentFilter.sort==='name-asc'?'selected':''}>Nome A-Z</option>
          </select>
        </div>
        <div class="filters-bar" id="status-filters">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Status:</span>
          ${['','pending','buying','bought','searching','discarded'].map(s => {
            const labels = {'': 'Todos', pending: 'Pendente', bought: 'Comprado', searching: 'Pesquisando', discarded: 'Descartado'};
            return `<button class="filter-chip ${currentFilter.status === s ? 'active' : ''}" onclick="PartsModule.onFilterStatus('${s}')">${labels[s] || s}</button>`;
          }).join('')}
        </div>
        <div class="filters-bar" id="priority-filters">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Prioridade:</span>
          ${['','high','medium','low'].map(p => {
            const labels = {'': 'Todas', high: 'Alta', medium: 'Média', low: 'Baixa'};
            return `<button class="filter-chip ${currentFilter.priority === p ? 'active' : ''}" onclick="PartsModule.onFilterPriority('${p}')">${labels[p]}</button>`;
          }).join('')}
        </div>
        <div class="filters-bar" style="flex-wrap:wrap;">
          <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">Categoria:</span>
          <button class="filter-chip ${!currentFilter.category ? 'active' : ''}" onclick="PartsModule.onFilterCategory('')">Todas</button>
          ${categories.map(c => `<button class="filter-chip ${currentFilter.category === c.id ? 'active' : ''}" onclick="PartsModule.onFilterCategory('${c.id}')">${c.icon} ${c.name}</button>`).join('')}
        </div>
      </div>

      <!-- Lista de Peças -->
      <div id="parts-list-container" class="fade-in">
        ${renderPartsList(getFilteredParts())}
      </div>
    `;
  }

  function getFilteredParts() {
    let parts = DB.Parts.getAll();
    if (currentFilter.search) {
      const q = currentFilter.search.toLowerCase();
      parts = parts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.model || '').toLowerCase().includes(q) ||
        (p.store || '').toLowerCase().includes(q)
      );
    }
    if (currentFilter.status) parts = parts.filter(p => p.status === currentFilter.status);
    if (currentFilter.category) parts = parts.filter(p => p.category === currentFilter.category);
    if (currentFilter.priority) parts = parts.filter(p => p.priority === currentFilter.priority);
    // Sort
    switch (currentFilter.sort) {
      case 'price-asc': parts.sort((a, b) => a.price - b.price); break;
      case 'price-desc': parts.sort((a, b) => b.price - a.price); break;
      case 'name-asc': parts.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'date-asc': parts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      default: parts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return parts;
  }

  function renderPartsList(parts) {
    if (parts.length === 0) {
      return `<div class="empty-state">
        <div class="empty-state-icon">🔧</div>
        <h3>${currentFilter.search || currentFilter.status || currentFilter.category ? 'Nenhuma peça encontrada' : 'Nenhuma peça cadastrada'}</h3>
        <p>${currentFilter.search || currentFilter.status || currentFilter.category ? 'Tente outros filtros' : 'Comece cadastrando suas primeiras peças'}</p>
        ${!currentFilter.search && !currentFilter.status && !currentFilter.category ? `<button class="btn-primary" onclick="PartsModule.showCreateModal()"><i class="fas fa-plus"></i> Nova Peça</button>` : ''}
      </div>`;
    }
    const categories = DB.Settings.getCategories();
    return `<div class="items-list">${parts.map(p => renderPartItem(p, categories)).join('')}</div>`;
  }

  function renderPartItem(part, categories) {
    const cat = categories.find(c => c.id === part.category) || { icon: '📌', color: '#94a3b8', name: part.category };
    const statusCls = { pending: 'status-pending', bought: 'status-bought', searching: 'status-searching', discarded: 'status-discarded' };
    const priorityCls = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    const history = DB.PriceHistory.getByPartId(part.id);
    const lastHistory = history[history.length - 1];
    const priceChange = lastHistory ? lastHistory.diff : 0;

    return `
      <div class="item-card" id="part-item-${part.id}">
        <div class="item-icon" style="background:${cat.color}20;">${cat.icon}</div>
        <div class="item-info" style="cursor:pointer;" onclick="PartsModule.showDetailModal('${part.id}')">
          <div class="item-name">${escapeHtml(part.name)}</div>
          <div class="item-meta">
            ${part.brand ? `<span>${escapeHtml(part.brand)}</span>` : ''}
            ${part.model ? `<span>${escapeHtml(part.model)}</span>` : ''}
            <span>${escapeHtml(cat.name)}</span>
            ${part.store ? `<span>${escapeHtml(part.store)}</span>` : ''}
            <span>${formatDate(part.createdAt)}</span>
          </div>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span class="badge ${statusCls[part.status] || 'badge-gray'}">${STATUS_LABELS[part.status] || part.status}</span>
            <span class="badge ${priorityCls[part.priority] || 'badge-gray'}">${PRIORITY_LABELS[part.priority] || part.priority}</span>
            ${part.quantity > 1 ? `<span class="badge badge-gray">Qtd: ${part.quantity}</span>` : ''}
          </div>
        </div>
        <div style="text-align:right; flex-shrink:0;">
          <div class="item-price">${formatCurrency(part.price * part.quantity)}</div>
          ${part.quantity > 1 ? `<div style="font-size:11px; color:var(--text-secondary);">${formatCurrency(part.price)} cada</div>` : ''}
          ${priceChange !== 0 ? `
            <div class="price-diff ${priceChange > 0 ? 'up' : 'down'}" style="font-size:11px; margin-top:2px;">
              ${priceChange > 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(priceChange))}
            </div>
          ` : ''}
          <div class="item-actions mt-2">
            <button class="btn-icon" title="Histórico de Preços" onclick="PartsModule.showPriceHistory('${part.id}')">
              <i class="fas fa-history"></i>
            </button>
            <button class="btn-icon" title="Editar" onclick="PartsModule.showEditModal('${part.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" title="Excluir" style="color:var(--danger)" onclick="PartsModule.deletePart('${part.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function refreshList() {
    const container = document.getElementById('parts-list-container');
    if (container) container.innerHTML = renderPartsList(getFilteredParts());
  }

  function onSearch(value) {
    currentFilter.search = value;
    refreshList();
  }
  function onSort(value) {
    currentFilter.sort = value;
    refreshList();
  }
  function onFilterStatus(status) {
    currentFilter.status = status;
    document.querySelectorAll('#status-filters .filter-chip').forEach((btn, i) => {
      btn.classList.toggle('active', btn.textContent.trim() === (
        status === '' ? 'Todos' : STATUS_LABELS[status] || status
      ));
    });
    refreshList();
  }
  function onFilterPriority(priority) {
    currentFilter.priority = priority;
    document.querySelectorAll('#priority-filters .filter-chip').forEach(btn => {
      btn.classList.remove('active');
    });
    // Find and activate correct chip
    const labels = {'': 'Todas', high: 'Alta', medium: 'Média', low: 'Baixa'};
    document.querySelectorAll('#priority-filters .filter-chip').forEach(btn => {
      if (btn.textContent.trim() === labels[priority]) btn.classList.add('active');
    });
    refreshList();
  }
  function onFilterCategory(catId) {
    currentFilter.category = catId;
    render();
  }

  // ===================== MODAL CRIAR PEÇA =====================
  function showCreateModal() {
    showPartFormModal('Nova Peça', null);
  }

  function showEditModal(id) {
    const part = DB.Parts.getById(id);
    if (!part) return;
    showPartFormModal('Editar Peça', part);
  }

  function showPartFormModal(title, part) {
    const categories = DB.Settings.getCategories();
    const catOptions = categories.map(c =>
      `<option value="${c.id}" ${part && part.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');

    App.showModal(title, `
      <form id="part-main-form">
        <div class="form-group">
          <label class="form-label">Nome da Peça <span class="required">*</span></label>
          <input class="form-control" id="pm-name" value="${part ? escapeHtml(part.name) : ''}" placeholder="Ex: Ryzen 7 7700X, RTX 4070 Ti, Samsung 980 Pro..." required autofocus />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-control" id="pm-category">${catOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="pm-status">
              <option value="pending" ${!part || part.status==='pending'?'selected':''}>Pendente</option>
              <option value="searching" ${part && part.status==='searching'?'selected':''}>Pesquisando</option>
              <option value="bought" ${part && part.status==='bought'?'selected':''}>Comprado</option>
              <option value="discarded" ${part && part.status==='discarded'?'selected':''}>Descartado</option>
            </select>
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <input class="form-control" id="pm-brand" value="${part ? escapeHtml(part.brand) : ''}" placeholder="AMD, Intel, Samsung..." list="pm-brands-list" />
          </div>
          <div class="form-group">
            <label class="form-label">Modelo</label>
            <input class="form-control" id="pm-model" value="${part ? escapeHtml(part.model) : ''}" placeholder="Modelo específico..." />
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade</label>
            <select class="form-control" id="pm-priority">
              <option value="high" ${part && part.priority==='high'?'selected':''}>Alta</option>
              <option value="medium" ${!part || part.priority==='medium'?'selected':''}>Média</option>
              <option value="low" ${part && part.priority==='low'?'selected':''}>Baixa</option>
            </select>
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input class="form-control" id="pm-price" type="number" min="0" step="0.01" value="${part ? part.price : ''}" placeholder="0,00" />
          </div>
          <div class="form-group">
            <label class="form-label">Quantidade</label>
            <input class="form-control" id="pm-qty" type="number" min="1" value="${part ? part.quantity : 1}" />
          </div>
          <div class="form-group">
            <label class="form-label">Loja</label>
            <input class="form-control" id="pm-store" value="${part ? escapeHtml(part.store) : ''}" placeholder="Kabum, Amazon, ML..." list="pm-stores-list" />
          </div>
        </div>
        ${part ? `
        <div class="form-group">
          <label class="form-label">Nota sobre Atualização de Preço</label>
          <input class="form-control" id="pm-price-note" placeholder="Motivo da alteração de preço (opcional)..." />
        </div>
        ` : ''}
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Socket (opcional)</label>
            <select class="form-control" id="pm-socket">
              <option value="">Nenhum</option>
              ${['AM5','AM4','LGA1700','LGA1200','LGA1851'].map(s => `<option ${part && part.socket===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Memória (opcional)</label>
            <select class="form-control" id="pm-memtype">
              <option value="">Nenhum</option>
              ${['DDR5','DDR4','LPDDR5','LPDDR4X'].map(m => `<option ${part && part.memoryType===m?'selected':''}>${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Link (opcional, apenas texto)</label>
          <input class="form-control" id="pm-link" value="${part ? escapeHtml(part.link) : ''}" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-control" id="pm-notes" rows="2" placeholder="Detalhes, especificações, anotações...">${part ? escapeHtml(part.notes) : ''}</textarea>
        </div>
      </form>
      <datalist id="pm-brands-list">
        ${DB.Settings.getBrands().map(b => `<option value="${escapeHtml(b)}">`).join('')}
      </datalist>
      <datalist id="pm-stores-list">
        ${DB.Settings.getStores().map(s => `<option value="${escapeHtml(s)}">`).join('')}
      </datalist>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: part ? 'Salvar Alterações' : 'Adicionar Peça', cls: 'btn-primary', action: () => submitForm(part ? part.id : null) },
    ], 'modal-lg');
  }

  function submitForm(id) {
    const name = document.getElementById('pm-name').value.trim();
    if (!name) { App.toast('Nome é obrigatório', 'error'); return; }
    const brand = document.getElementById('pm-brand').value.trim();
    const store = document.getElementById('pm-store').value.trim();
    if (brand) DB.Settings.addBrand(brand);
    if (store) DB.Settings.addStore(store);

    const data = {
      name,
      category: document.getElementById('pm-category').value,
      status: document.getElementById('pm-status').value,
      brand,
      model: document.getElementById('pm-model').value.trim(),
      priority: document.getElementById('pm-priority').value,
      price: document.getElementById('pm-price').value,
      quantity: document.getElementById('pm-qty').value,
      store,
      socket: document.getElementById('pm-socket').value,
      memoryType: document.getElementById('pm-memtype').value,
      link: document.getElementById('pm-link').value.trim(),
      notes: document.getElementById('pm-notes').value.trim(),
    };
    const priceNoteEl = document.getElementById('pm-price-note');
    if (priceNoteEl) data.priceNote = priceNoteEl.value.trim();

    if (id) {
      DB.Parts.update(id, data);
      App.toast('Peça atualizada!', 'success');
    } else {
      DB.Parts.create(data);
      App.toast('Peça adicionada!', 'success');
    }
    App.closeModal();
    App.updateBadges();
    refreshList();
    // Atualiza total na seção
    const subtitle = document.querySelector('#page-parts .section-subtitle');
    if (subtitle) subtitle.textContent = `${DB.Parts.getAll().length} peça(s) cadastrada(s)`;
  }

  function deletePart(id) {
    const part = DB.Parts.getById(id);
    if (!part) return;
    App.confirm(`Excluir "${part.name}"? Esta ação não pode ser desfeita.`, () => {
      DB.Parts.delete(id);
      App.toast('Peça excluída', 'success');
      App.updateBadges();
      refreshList();
    });
  }

  // ===================== HISTÓRICO DE PREÇOS =====================
  function showPriceHistory(id) {
    const part = DB.Parts.getById(id);
    if (!part) return;
    const history = DB.PriceHistory.getByPartId(id).reverse();

    App.showModal(`Histórico de Preços — ${escapeHtml(part.name)}`, `
      <div>
        <div class="flex items-center gap-3 mb-4 p-3" style="background:var(--bg-tertiary); border-radius:var(--radius-md);">
          <div>
            <div style="font-size:13px; color:var(--text-secondary);">Preço Atual</div>
            <div style="font-size:22px; font-weight:700; color:var(--primary);">${formatCurrency(part.price)}</div>
          </div>
        </div>

        <!-- Adicionar novo preço -->
        <div class="card mb-4" style="background:var(--bg-tertiary);">
          <div class="card-title mb-3">Registrar Novo Preço</div>
          <div class="form-row cols-2">
            <div class="form-group">
              <label class="form-label">Novo Preço (R$)</label>
              <input class="form-control" id="new-price-input" type="number" min="0" step="0.01" placeholder="0,00" />
            </div>
            <div class="form-group">
              <label class="form-label">Observação</label>
              <input class="form-control" id="new-price-note" placeholder="Ex: promoção, desconto..." />
            </div>
          </div>
          <button class="btn-primary btn-sm" onclick="PartsModule.addPriceRecord('${id}')">
            <i class="fas fa-plus"></i> Registrar Preço
          </button>
        </div>

        <!-- Histórico -->
        ${history.length === 0 ? `
          <div class="empty-state" style="padding:24px;">
            <div style="font-size:32px; margin-bottom:8px;">📊</div>
            <p>Nenhuma alteração de preço registrada</p>
          </div>
        ` : `
          <div class="card-title mb-3">Histórico de Alterações</div>
          <div>
            ${history.map(h => `
              <div class="price-history-item">
                <div class="price-arrow ${h.diff > 0 ? 'up' : 'down'}">
                  ${h.diff > 0 ? '↑' : '↓'}
                </div>
                <div style="flex:1;">
                  <div class="flex items-center gap-2">
                    <span class="price-old">${formatCurrency(h.oldPrice)}</span>
                    <i class="fas fa-arrow-right" style="font-size:11px; color:var(--text-muted);"></i>
                    <span class="price-new">${formatCurrency(h.newPrice)}</span>
                    <span class="price-diff ${h.diff > 0 ? 'up' : 'down'}">
                      (${h.diff > 0 ? '+' : ''}${formatCurrency(h.diff)})
                    </span>
                  </div>
                  ${h.note ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${escapeHtml(h.note)}</div>` : ''}
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${formatDate(h.date)}</div>
                </div>
                <button class="btn-icon btn-sm" style="color:var(--danger);" onclick="PartsModule.deletePriceRecord('${h.id}', '${id}')">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `, [{ label: 'Fechar', cls: 'btn-ghost', action: () => App.closeModal() }], 'modal-lg');
  }

  function addPriceRecord(partId) {
    const newPrice = parseFloat(document.getElementById('new-price-input').value);
    const note = document.getElementById('new-price-note').value.trim();
    if (isNaN(newPrice) || newPrice < 0) { App.toast('Informe um preço válido', 'error'); return; }
    const part = DB.Parts.getById(partId);
    if (!part) return;
    const oldPrice = part.price;
    DB.Parts.update(partId, { price: newPrice, priceNote: note });
    App.toast('Preço atualizado e registrado!', 'success');
    App.closeModal();
    showPriceHistory(partId);
    refreshList();
  }

  function deletePriceRecord(historyId, partId) {
    DB.PriceHistory.delete(historyId);
    App.toast('Registro removido', 'success');
    App.closeModal();
    showPriceHistory(partId);
  }

  // ===================== DETALHE DA PEÇA =====================
  function showDetailModal(id) {
    const part = DB.Parts.getById(id);
    if (!part) return;
    const categories = DB.Settings.getCategories();
    const cat = categories.find(c => c.id === part.category) || { icon: '📌', color: '#94a3b8', name: part.category };
    const statusCls = { pending: 'status-pending', bought: 'status-bought', searching: 'status-searching', discarded: 'status-discarded' };
    const priorityCls = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
    const history = DB.PriceHistory.getByPartId(id);

    App.showModal(`${cat.icon} ${escapeHtml(part.name)}`, `
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div style="width:56px; height:56px; background:${cat.color}20; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:28px; flex-shrink:0;">${cat.icon}</div>
          <div>
            <h3 style="font-size:18px; font-weight:700;">${escapeHtml(part.name)}</h3>
            <div style="font-size:13px; color:var(--text-secondary);">${escapeHtml(part.brand)} ${escapeHtml(part.model)}</div>
            <div class="flex gap-2 mt-1">
              <span class="badge ${statusCls[part.status] || 'badge-gray'}">${STATUS_LABELS[part.status] || part.status}</span>
              <span class="badge ${priorityCls[part.priority] || 'badge-gray'}">${PRIORITY_LABELS[part.priority] || part.priority}</span>
            </div>
          </div>
          <div style="margin-left:auto; text-align:right;">
            <div style="font-size:24px; font-weight:800; color:var(--primary);">${formatCurrency(part.price)}</div>
            ${part.quantity > 1 ? `<div style="font-size:12px; color:var(--text-secondary);">x${part.quantity} = ${formatCurrency(part.price * part.quantity)}</div>` : ''}
          </div>
        </div>

        <div class="divider"></div>

        <div class="grid-2" style="gap:10px; margin-bottom:16px;">
          ${renderDetailRow('Categoria', cat.name)}
          ${renderDetailRow('Loja', part.store || '—')}
          ${renderDetailRow('Cadastrado em', formatDate(part.createdAt))}
          ${renderDetailRow('Atualizado em', formatDate(part.updatedAt))}
          ${part.socket ? renderDetailRow('Socket', part.socket) : ''}
          ${part.memoryType ? renderDetailRow('Memória', part.memoryType) : ''}
          ${part.wattage ? renderDetailRow('Consumo', part.wattage + 'W') : ''}
          ${part.chipset ? renderDetailRow('Chipset', part.chipset) : ''}
        </div>

        ${part.link ? `<div style="margin-bottom:12px; padding:10px; background:var(--bg-tertiary); border-radius:var(--radius-md); font-size:13px; word-break:break-all;">
          <span style="color:var(--text-secondary);">Link:</span> ${escapeHtml(part.link)}
        </div>` : ''}

        ${part.notes ? `<div style="margin-bottom:12px; padding:10px; background:var(--bg-tertiary); border-radius:var(--radius-md); font-size:13px; white-space:pre-wrap;">
          <span style="color:var(--text-secondary); font-weight:600;">Observações:</span><br>${escapeHtml(part.notes)}
        </div>` : ''}

        ${history.length > 0 ? `
          <div style="padding:10px; background:var(--bg-tertiary); border-radius:var(--radius-md); font-size:13px;">
            <span style="color:var(--text-secondary); font-weight:600;">Histórico de Preços:</span> ${history.length} alteração(ões) registrada(s)
          </div>
        ` : ''}
      </div>
    `, [
      { label: 'Histórico de Preços', cls: 'btn-secondary', action: () => { App.closeModal(); showPriceHistory(id); } },
      { label: 'Editar', cls: 'btn-primary', action: () => { App.closeModal(); showEditModal(id); } },
    ]);
  }

  function renderDetailRow(label, value) {
    return `<div style="padding:8px 10px; background:var(--bg-tertiary); border-radius:var(--radius-md);">
      <div style="font-size:11px; color:var(--text-secondary);">${label}</div>
      <div style="font-size:14px; font-weight:600;">${value}</div>
    </div>`;
  }

  // ===================== AÇÕES EM LOTE =====================
  function showBulkActions() {
    App.showModal('Ações em Lote', `
      <div>
        <p style="color:var(--text-secondary); margin-bottom:20px;">Alterar o status de todas as peças de uma categoria ou filtro:</p>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select class="form-control" id="bulk-category">
            <option value="">Todas as categorias</option>
            ${DB.Settings.getCategories().map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Alterar Status Para</label>
          <select class="form-control" id="bulk-status">
            <option value="pending">Pendente</option>
            <option value="searching">Pesquisando</option>
            <option value="bought">Comprado</option>
            <option value="discarded">Descartado</option>
          </select>
        </div>
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Aplicar', cls: 'btn-primary', action: () => {
        const category = document.getElementById('bulk-category').value;
        const status = document.getElementById('bulk-status').value;
        let parts = DB.Parts.getAll();
        if (category) parts = parts.filter(p => p.category === category);
        parts.forEach(p => DB.Parts.update(p.id, { status }));
        App.closeModal();
        App.toast(`${parts.length} peça(s) atualizadas!`, 'success');
        App.updateBadges();
        refreshList();
      }},
    ]);
  }

  return {
    render,
    showCreateModal,
    showEditModal,
    showDetailModal,
    showPriceHistory,
    addPriceRecord,
    deletePriceRecord,
    deletePart,
    showBulkActions,
    onSearch,
    onSort,
    onFilterStatus,
    onFilterPriority,
    onFilterCategory,
  };
})();
