/**
 * PC Builder Pro - Comparador de Hardware
 * Comparação lado a lado com custo-benefício e recomendações
 */

const ComparatorModule = (() => {

  function formatCurrency(v) {
    return 'R$ ' + (parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render() {
    const container = document.getElementById('page-comparator');
    const comparisons = DB.Comparisons.getAll();

    container.innerHTML = `
      <div class="section-header fade-in">
        <div>
          <div class="section-title">Comparador de Hardware</div>
          <div class="section-subtitle">${comparisons.length} comparação(ões) salva(s)</div>
        </div>
        <button class="btn-primary" onclick="ComparatorModule.showCreateModal()">
          <i class="fas fa-plus"></i> Nova Comparação
        </button>
      </div>

      ${comparisons.length === 0 ? `
        <div class="empty-state fade-in">
          <div class="empty-state-icon">⚖️</div>
          <h3>Nenhuma comparação criada</h3>
          <p>Compare peças lado a lado para tomar a melhor decisão de compra</p>
          <button class="btn-primary" onclick="ComparatorModule.showCreateModal()">
            <i class="fas fa-plus"></i> Criar Comparação
          </button>
        </div>
      ` : `
        <div class="items-list fade-in">
          ${comparisons.map(c => renderComparisonItem(c)).join('')}
        </div>
      `}
    `;
  }

  function renderComparisonItem(comp) {
    const categories = DB.Settings.getCategories();
    const cat = categories.find(c => c.id === comp.category) || { icon: '📌', color: '#94a3b8', name: comp.category };
    const cheapest = comp.items.length > 0
      ? comp.items.reduce((min, i) => parseFloat(i.price) < parseFloat(min.price) ? i : min, comp.items[0])
      : null;

    return `
      <div class="item-card" onclick="ComparatorModule.openComparison('${comp.id}')">
        <div class="item-icon" style="background:${cat.color}20;">${cat.icon}</div>
        <div class="item-info">
          <div class="item-name">${escapeHtml(comp.name)}</div>
          <div class="item-meta">
            <span>${cat.name}</span>
            <span>${comp.items.length} itens</span>
            ${cheapest ? `<span>Mais barato: ${escapeHtml(cheapest.name)} — ${formatCurrency(cheapest.price)}</span>` : ''}
          </div>
        </div>
        <div class="item-actions" onclick="event.stopPropagation()">
          <button class="btn-icon" title="Editar" onclick="ComparatorModule.showEditModal('${comp.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon" title="Excluir" style="color:var(--danger)" onclick="ComparatorModule.deleteComparison('${comp.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  function openComparison(id) {
    const comp = DB.Comparisons.getById(id);
    if (!comp) return;
    const categories = DB.Settings.getCategories();
    const cat = categories.find(c => c.id === comp.category) || { icon: '📌', color: '#94a3b8', name: comp.category };

    const items = comp.items;
    if (items.length === 0) {
      App.showModal(escapeHtml(comp.name), `
        <div class="empty-state" style="padding:30px;">
          <div style="font-size:36px; margin-bottom:12px;">⚖️</div>
          <h3>Nenhum item para comparar</h3>
          <p>Edite esta comparação e adicione itens</p>
          <button class="btn-primary mt-3" onclick="App.closeModal(); ComparatorModule.showEditModal('${id}')">
            <i class="fas fa-edit"></i> Editar Comparação
          </button>
        </div>
      `, [{ label: 'Fechar', cls: 'btn-ghost', action: () => App.closeModal() }]);
      return;
    }

    // Análise
    const sortedByPrice = [...items].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
    const recommended = comp.recommended || cheapest.id;

    App.showModal(escapeHtml(comp.name), `
      <div>
        <div class="flex items-center gap-2 mb-4">
          <span style="font-size:22px;">${cat.icon}</span>
          <div>
            <div style="font-weight:700;">${escapeHtml(comp.name)}</div>
            <div style="font-size:12px; color:var(--text-secondary);">${cat.name} — ${items.length} itens comparados</div>
          </div>
        </div>

        <!-- Cards de comparação -->
        <div class="compare-grid" style="margin-bottom:20px;">
          ${items.map(item => {
            const isCheapest = item.id === cheapest.id;
            const isRecommended = item.id === recommended;
            const isPremium = item.id === mostExpensive.id && items.length > 1;
            return `
              <div class="compare-card ${isRecommended ? 'recommended' : isCheapest && !isRecommended ? 'cheapest' : ''}">
                ${isRecommended ? '<div class="recommended-badge">⭐ Recomendado</div>' : ''}
                ${isCheapest && !isRecommended ? '<div class="recommended-badge" style="background:linear-gradient(135deg,#f59e0b,#d97706);">💰 Mais Barato</div>' : ''}
                ${isPremium && !isRecommended && !isCheapest ? '<div class="recommended-badge" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);">👑 Premium</div>' : ''}

                <div style="font-size:15px; font-weight:700; margin-bottom:4px; margin-top:${isRecommended || isCheapest || isPremium ? '8px' : '0'};">${escapeHtml(item.name)}</div>
                ${item.brand ? `<div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">${escapeHtml(item.brand)}</div>` : ''}
                <div class="compare-price">${formatCurrency(item.price)}</div>

                <div style="text-align:left;">
                  ${item.brand ? `<div class="compare-attr"><span class="compare-attr-label">Marca</span><span class="compare-attr-value">${escapeHtml(item.brand)}</span></div>` : ''}
                  ${item.model ? `<div class="compare-attr"><span class="compare-attr-label">Modelo</span><span class="compare-attr-value">${escapeHtml(item.model)}</span></div>` : ''}
                  ${item.store ? `<div class="compare-attr"><span class="compare-attr-label">Loja</span><span class="compare-attr-value">${escapeHtml(item.store)}</span></div>` : ''}
                  ${item.socket ? `<div class="compare-attr"><span class="compare-attr-label">Socket</span><span class="compare-attr-value">${escapeHtml(item.socket)}</span></div>` : ''}
                  ${item.memoryType ? `<div class="compare-attr"><span class="compare-attr-label">Memória</span><span class="compare-attr-value">${escapeHtml(item.memoryType)}</span></div>` : ''}
                  ${item.wattage ? `<div class="compare-attr"><span class="compare-attr-label">Consumo</span><span class="compare-attr-value">${item.wattage}W</span></div>` : ''}
                  ${items.length > 1 ? `<div class="compare-attr">
                    <span class="compare-attr-label">vs. Mais Barato</span>
                    <span class="compare-attr-value ${parseFloat(item.price) > parseFloat(cheapest.price) ? 'text-danger' : 'text-success'}">
                      ${item.id === cheapest.id ? '—' : '+' + formatCurrency(parseFloat(item.price) - parseFloat(cheapest.price))}
                    </span>
                  </div>` : ''}
                  ${item.notes ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:8px; text-align:left; padding-top:8px; border-top:1px solid var(--border);">${escapeHtml(item.notes)}</div>` : ''}
                </div>

                <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px;">
                  ${item.id !== recommended ? `
                    <button class="btn-success btn-sm w-full" onclick="ComparatorModule.setRecommended('${comp.id}', '${item.id}')">
                      <i class="fas fa-star"></i> Recomendar
                    </button>
                  ` : ''}
                  <button class="btn-secondary btn-sm w-full" onclick="ComparatorModule.addToShoppingList('${comp.id}', '${item.id}')">
                    <i class="fas fa-shopping-cart"></i> Adicionar à Lista
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Análise -->
        <div class="card" style="background:var(--bg-tertiary);">
          <div class="card-title mb-3"><i class="fas fa-chart-bar" style="margin-right:6px; color:var(--primary);"></i>Análise</div>
          <div class="grid-3" style="gap:10px;">
            <div style="text-align:center; padding:10px; background:var(--bg-card); border-radius:var(--radius-md);">
              <div style="font-size:12px; color:var(--text-secondary);">Mais Barato</div>
              <div style="font-weight:700; color:var(--success);">${formatCurrency(cheapest.price)}</div>
              <div style="font-size:11px;">${escapeHtml(cheapest.name)}</div>
            </div>
            <div style="text-align:center; padding:10px; background:var(--bg-card); border-radius:var(--radius-md);">
              <div style="font-size:12px; color:var(--text-secondary);">Mais Caro</div>
              <div style="font-weight:700; color:var(--danger);">${formatCurrency(mostExpensive.price)}</div>
              <div style="font-size:11px;">${escapeHtml(mostExpensive.name)}</div>
            </div>
            <div style="text-align:center; padding:10px; background:var(--bg-card); border-radius:var(--radius-md);">
              <div style="font-size:12px; color:var(--text-secondary);">Diferença</div>
              <div style="font-weight:700; color:var(--warning);">${formatCurrency(parseFloat(mostExpensive.price) - parseFloat(cheapest.price))}</div>
              <div style="font-size:11px;">entre extremos</div>
            </div>
          </div>
          ${comp.notes ? `<div style="margin-top:12px; padding:10px; background:var(--bg-card); border-radius:var(--radius-md); font-size:13px;">${escapeHtml(comp.notes)}</div>` : ''}
        </div>
      </div>
    `, [
      { label: 'Editar', cls: 'btn-secondary', action: () => { App.closeModal(); showEditModal(comp.id); } },
      { label: 'Fechar', cls: 'btn-ghost', action: () => App.closeModal() },
    ], 'modal-xl');
  }

  function setRecommended(compId, itemId) {
    DB.Comparisons.update(compId, { recommended: itemId });
    App.closeModal();
    App.toast('Item marcado como recomendado!', 'success');
    openComparison(compId);
  }

  function addToShoppingList(compId, itemId) {
    const comp = DB.Comparisons.getById(compId);
    if (!comp) return;
    const item = comp.items.find(i => i.id === itemId);
    if (!item) return;
    DB.Parts.create({
      name: item.name,
      brand: item.brand || '',
      model: item.model || '',
      price: item.price || 0,
      category: comp.category || 'others',
      store: item.store || '',
      notes: item.notes || '',
      status: 'searching',
      priority: 'medium',
    });
    App.toast(`"${item.name}" adicionado à lista de compras!`, 'success');
    App.updateBadges();
  }

  // ===================== MODAIS CRIAR / EDITAR =====================
  function showCreateModal() {
    const categories = DB.Settings.getCategories();
    App.showModal('Nova Comparação', `
      <form id="comp-form">
        <div class="form-group">
          <label class="form-label">Nome da Comparação <span class="required">*</span></label>
          <input class="form-control" id="comp-name" placeholder="Ex: CPU Gaming AM5, GPU 1080p, SSD NVMe..." required autofocus />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-control" id="comp-category">
              ${categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" id="comp-notes" rows="2" placeholder="Observações sobre a comparação..."></textarea>
        </div>

        <div class="divider"></div>
        <div class="section-title mb-3">Itens para Comparar</div>
        <div id="comp-items-container">
          ${renderItemForm(0)}
          ${renderItemForm(1)}
        </div>
        <button type="button" class="btn-secondary btn-sm mt-2" onclick="ComparatorModule.addItemForm()">
          <i class="fas fa-plus"></i> Adicionar Item
        </button>
      </form>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Criar Comparação', cls: 'btn-primary', action: () => submitCreate() },
    ], 'modal-lg');
  }

  let itemCount = 2;
  function addItemForm() {
    const container = document.getElementById('comp-items-container');
    if (!container) return;
    if (itemCount >= 5) { App.toast('Máximo de 5 itens por comparação', 'warning'); return; }
    container.insertAdjacentHTML('beforeend', renderItemForm(itemCount));
    itemCount++;
  }

  function renderItemForm(idx) {
    return `
      <div class="card mb-3" id="comp-item-${idx}" style="background:var(--bg-tertiary);">
        <div class="flex items-center justify-between mb-3">
          <div style="font-weight:600; font-size:14px;">Item ${idx + 1}</div>
          ${idx > 1 ? `<button type="button" class="btn-icon btn-sm" style="color:var(--danger);" onclick="document.getElementById('comp-item-${idx}').remove()"><i class="fas fa-times"></i></button>` : ''}
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Nome <span class="required">*</span></label>
            <input class="form-control comp-item-name" placeholder="Nome do produto..." />
          </div>
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input class="form-control comp-item-price" type="number" min="0" step="0.01" placeholder="0,00" />
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <input class="form-control comp-item-brand" placeholder="AMD, Intel..." />
          </div>
          <div class="form-group">
            <label class="form-label">Modelo</label>
            <input class="form-control comp-item-model" placeholder="Modelo..." />
          </div>
          <div class="form-group">
            <label class="form-label">Loja</label>
            <input class="form-control comp-item-store" placeholder="Kabum..." />
          </div>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Socket</label>
            <select class="form-control comp-item-socket">
              <option value="">—</option>
              ${['AM5','AM4','LGA1700','LGA1200','LGA1851'].map(s => `<option>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Consumo (W)</label>
            <input class="form-control comp-item-wattage" type="number" placeholder="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <input class="form-control comp-item-notes" placeholder="Diferenciais, specs importantes..." />
        </div>
      </div>
    `;
  }

  function collectItems() {
    const items = [];
    document.querySelectorAll('#comp-items-container > .card').forEach((card, i) => {
      const name = card.querySelector('.comp-item-name')?.value?.trim();
      if (!name) return;
      items.push({
        id: DB.generateId(),
        name,
        price: card.querySelector('.comp-item-price')?.value || 0,
        brand: card.querySelector('.comp-item-brand')?.value?.trim() || '',
        model: card.querySelector('.comp-item-model')?.value?.trim() || '',
        store: card.querySelector('.comp-item-store')?.value?.trim() || '',
        socket: card.querySelector('.comp-item-socket')?.value || '',
        wattage: card.querySelector('.comp-item-wattage')?.value || '',
        notes: card.querySelector('.comp-item-notes')?.value?.trim() || '',
      });
    });
    return items;
  }

  function submitCreate() {
    const name = document.getElementById('comp-name')?.value?.trim();
    if (!name) { App.toast('Nome é obrigatório', 'error'); return; }
    const items = collectItems();
    if (items.length < 1) { App.toast('Adicione ao menos 1 item', 'error'); return; }
    const cheapest = items.reduce((min, i) => parseFloat(i.price) < parseFloat(min.price) ? i : min, items[0]);
    DB.Comparisons.create({
      name,
      category: document.getElementById('comp-category')?.value || 'others',
      notes: document.getElementById('comp-notes')?.value?.trim() || '',
      items,
      recommended: cheapest.id,
    });
    App.closeModal();
    itemCount = 2;
    App.toast('Comparação criada!', 'success');
    render();
  }

  function showEditModal(id) {
    const comp = DB.Comparisons.getById(id);
    if (!comp) return;
    const categories = DB.Settings.getCategories();

    App.showModal('Editar Comparação', `
      <form id="edit-comp-form">
        <div class="form-group">
          <label class="form-label">Nome <span class="required">*</span></label>
          <input class="form-control" id="edit-comp-name" value="${escapeHtml(comp.name)}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Categoria</label>
          <select class="form-control" id="edit-comp-category">
            ${categories.map(c => `<option value="${c.id}" ${comp.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea class="form-control" id="edit-comp-notes" rows="2">${escapeHtml(comp.notes || '')}</textarea>
        </div>
        <div class="divider"></div>
        <div class="section-title mb-3">Itens</div>
        <div id="edit-comp-items">
          ${comp.items.map((item, i) => renderEditItemForm(item, i)).join('')}
        </div>
        <button type="button" class="btn-secondary btn-sm mt-2" onclick="ComparatorModule.addEditItemForm()">
          <i class="fas fa-plus"></i> Adicionar Item
        </button>
      </form>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Salvar', cls: 'btn-primary', action: () => submitEdit(id) },
    ], 'modal-lg');
    editItemCount = comp.items.length;
  }

  let editItemCount = 0;
  function addEditItemForm() {
    if (editItemCount >= 5) { App.toast('Máximo de 5 itens', 'warning'); return; }
    const container = document.getElementById('edit-comp-items');
    if (!container) return;
    container.insertAdjacentHTML('beforeend', renderEditItemForm(null, editItemCount));
    editItemCount++;
  }

  function renderEditItemForm(item, idx) {
    return `
      <div class="card mb-3 edit-comp-item" id="edit-item-${idx}" style="background:var(--bg-tertiary);">
        <div class="flex items-center justify-between mb-3">
          <div style="font-weight:600; font-size:14px;">Item ${idx + 1}</div>
          <button type="button" class="btn-icon btn-sm" style="color:var(--danger);" onclick="document.getElementById('edit-item-${idx}').remove()"><i class="fas fa-times"></i></button>
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <input class="form-control ec-name" value="${item ? escapeHtml(item.name) : ''}" placeholder="Nome..." />
          </div>
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input class="form-control ec-price" type="number" value="${item ? item.price : ''}" placeholder="0,00" />
          </div>
        </div>
        <div class="form-row cols-3">
          <div class="form-group">
            <label class="form-label">Marca</label>
            <input class="form-control ec-brand" value="${item ? escapeHtml(item.brand) : ''}" placeholder="Marca..." />
          </div>
          <div class="form-group">
            <label class="form-label">Modelo</label>
            <input class="form-control ec-model" value="${item ? escapeHtml(item.model) : ''}" placeholder="Modelo..." />
          </div>
          <div class="form-group">
            <label class="form-label">Loja</label>
            <input class="form-control ec-store" value="${item ? escapeHtml(item.store) : ''}" placeholder="Loja..." />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <input class="form-control ec-notes" value="${item ? escapeHtml(item.notes) : ''}" placeholder="Observações..." />
        </div>
        <input type="hidden" class="ec-id" value="${item ? item.id : ''}" />
      </div>
    `;
  }

  function submitEdit(id) {
    const name = document.getElementById('edit-comp-name')?.value?.trim();
    if (!name) { App.toast('Nome é obrigatório', 'error'); return; }
    const items = [];
    document.querySelectorAll('#edit-comp-items .edit-comp-item').forEach(card => {
      const itemName = card.querySelector('.ec-name')?.value?.trim();
      if (!itemName) return;
      const existingId = card.querySelector('.ec-id')?.value;
      items.push({
        id: existingId || DB.generateId(),
        name: itemName,
        price: card.querySelector('.ec-price')?.value || 0,
        brand: card.querySelector('.ec-brand')?.value?.trim() || '',
        model: card.querySelector('.ec-model')?.value?.trim() || '',
        store: card.querySelector('.ec-store')?.value?.trim() || '',
        notes: card.querySelector('.ec-notes')?.value?.trim() || '',
      });
    });
    DB.Comparisons.update(id, {
      name,
      category: document.getElementById('edit-comp-category')?.value || 'others',
      notes: document.getElementById('edit-comp-notes')?.value?.trim() || '',
      items,
    });
    App.closeModal();
    App.toast('Comparação atualizada!', 'success');
    render();
  }

  function deleteComparison(id) {
    const comp = DB.Comparisons.getById(id);
    if (!comp) return;
    App.confirm(`Excluir a comparação "${comp.name}"?`, () => {
      DB.Comparisons.delete(id);
      App.toast('Comparação excluída', 'success');
      render();
    });
  }

  return {
    render,
    openComparison,
    setRecommended,
    addToShoppingList,
    showCreateModal,
    showEditModal,
    deleteComparison,
    addItemForm,
    addEditItemForm,
  };
})();
