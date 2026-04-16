/**
 * PC Builder Pro - Configurações
 * Tema, backup, categorias, marcas, lojas e limpeza de dados
 */

const SettingsModule = (() => {

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getStorageUsed() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += (localStorage[key].length + key.length) * 2;
      }
    }
    return (total / 1024).toFixed(1);
  }

  function render() {
    const container = document.getElementById('page-settings');
    const settings = DB.Settings.get();
    const categories = DB.Settings.getCategories();
    const brands = DB.Settings.getBrands();
    const stores = DB.Settings.getStores();
    const cloudMeta = DB.CloudSync.getMeta();
    const cloudStatusMap = { ok: 'Conectado', offline: 'Offline', error: 'Erro', online: 'Pronto' };
    const cloudStatus = cloudStatusMap[cloudMeta.status] || 'Pronto';
    const lastCloudAction = cloudMeta.lastAutoSyncAt || cloudMeta.lastPushAt || cloudMeta.lastPullAt || '';
    const storageKB = getStorageUsed();

    container.innerHTML = `
      <div class="section-header fade-in">
        <div class="section-title">Configurações</div>
      </div>

      <!-- Aparência -->
      <div class="card mb-4 fade-in">
        <div class="settings-section-title">Aparência</div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Tema</div>
            <div class="settings-item-desc">Escolha entre modo claro ou escuro</div>
          </div>
          <div class="flex gap-2">
            <button class="btn-${settings.theme === 'dark' ? 'primary' : 'secondary'} btn-sm" onclick="SettingsModule.setTheme('dark')">
              <i class="fas fa-moon"></i> Escuro
            </button>
            <button class="btn-${settings.theme === 'light' ? 'primary' : 'secondary'} btn-sm" onclick="SettingsModule.setTheme('light')">
              <i class="fas fa-sun"></i> Claro
            </button>
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Moeda</div>
            <div class="settings-item-desc">Moeda para exibição de preços</div>
          </div>
          <select class="filter-select" onchange="SettingsModule.setCurrency(this.value)">
            <option value="BRL" ${settings.currency === 'BRL' ? 'selected' : ''}>🇧🇷 Real (R$)</option>
            <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>🇺🇸 Dólar ($)</option>
            <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>🇪🇺 Euro (€)</option>
          </select>
        </div>
      </div>

      <!-- Sincronização em Nuvem -->
      <div class="card mb-4 fade-in">
        <div class="settings-section-title">Sincronização em Nuvem</div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Sync Automático</div>
            <div class="settings-item-desc">Quando houver internet, o app envia seus dados automaticamente para o Cloudflare D1</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${settings.cloudSyncEnabled ? 'checked' : ''} onchange="SettingsModule.toggleCloudSync(this.checked)">
            <span class="slider"></span>
          </label>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Status da Nuvem</div>
            <div class="settings-item-desc">${cloudStatus}${lastCloudAction ? ' · Última atividade: ' + new Date(lastCloudAction).toLocaleString('pt-BR') : ' · Ainda sem sincronização'}</div>
            ${cloudMeta.lastError ? `<div class="settings-item-desc" style="color:var(--danger); margin-top:4px;">${escapeHtml(cloudMeta.lastError)}</div>` : ''}
          </div>
          <div class="badge ${cloudMeta.status === 'error' ? 'badge-warning' : cloudMeta.status === 'offline' ? 'badge-warning' : 'badge-success'}">${cloudStatus}</div>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Teste de Conexão</div>
            <div class="settings-item-desc">Verifica se a API e o binding do D1 estão funcionando</div>
          </div>
          <button class="btn-secondary btn-sm" onclick="SettingsModule.testCloudConnection()">
            <i class="fas fa-wifi"></i> Testar
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Enviar para Nuvem</div>
            <div class="settings-item-desc">Atualiza o banco online com o estado atual do aplicativo</div>
          </div>
          <button class="btn-primary btn-sm" onclick="SettingsModule.pushToCloud()">
            <i class="fas fa-cloud-upload-alt"></i> Enviar
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Baixar da Nuvem</div>
            <div class="settings-item-desc">Restaura no aparelho os dados mais recentes salvos no Cloudflare</div>
          </div>
          <button class="btn-secondary btn-sm" onclick="SettingsModule.pullFromCloud()">
            <i class="fas fa-cloud-download-alt"></i> Baixar
          </button>
        </div>
      </div>

      <!-- Backup e Restauração -->
      <div class="card mb-4 fade-in">
        <div class="settings-section-title">Backup e Restauração</div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Exportar Backup</div>
            <div class="settings-item-desc">Salva todos os dados em um arquivo JSON</div>
          </div>
          <button class="btn-primary btn-sm" onclick="SettingsModule.exportBackup()">
            <i class="fas fa-download"></i> Exportar JSON
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Importar Backup</div>
            <div class="settings-item-desc">Restaura dados de um arquivo JSON exportado anteriormente</div>
          </div>
          <div class="flex gap-2">
            <label class="btn-secondary btn-sm" style="cursor:pointer;">
              <i class="fas fa-upload"></i> Importar JSON
              <input type="file" accept=".json" style="display:none;" onchange="SettingsModule.importBackup(this)" />
            </label>
          </div>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Armazenamento Local</div>
            <div class="settings-item-desc">${storageKB} KB usados no localStorage</div>
          </div>
          <div class="badge badge-info">${storageKB} KB</div>
        </div>
      </div>

      <!-- Categorias Personalizadas -->
      <div class="card mb-4 fade-in">
        <div class="card-header mb-3">
          <div class="settings-section-title" style="margin:0;">Categorias</div>
          <button class="btn-primary btn-sm" onclick="SettingsModule.showAddCategoryModal()">
            <i class="fas fa-plus"></i> Nova Categoria
          </button>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;" id="categories-list">
          ${categories.map(c => `
            <div class="flex items-center gap-3 p-2" style="background:var(--bg-tertiary); border-radius:var(--radius-md);">
              <div style="width:32px; height:32px; background:${c.color}20; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center;">${c.icon}</div>
              <div style="flex:1;">
                <div style="font-weight:600; font-size:14px;">${escapeHtml(c.name)}</div>
                <div style="font-size:11px; color:var(--text-muted);">ID: ${c.id}</div>
              </div>
              ${!['motherboard','cpu','ram','ssd','hdd','psu','case','gpu','cooler','monitor','keyboard','mouse','headset','notebook','accessories','peripherals','others'].includes(c.id) ? `
                <button class="btn-icon btn-sm" style="color:var(--danger);" onclick="SettingsModule.deleteCategory('${c.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              ` : '<span style="font-size:10px; color:var(--text-muted);">padrão</span>'}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Marcas Favoritas -->
      <div class="card mb-4 fade-in">
        <div class="card-header mb-3">
          <div class="settings-section-title" style="margin:0;">Marcas Cadastradas</div>
          <button class="btn-secondary btn-sm" onclick="SettingsModule.showAddBrandModal()">
            <i class="fas fa-plus"></i> Adicionar
          </button>
        </div>
        ${brands.length > 0 ? `
          <div style="display:flex; flex-wrap:wrap; gap:8px;" id="brands-list">
            ${brands.map(b => `
              <div style="display:flex; align-items:center; gap:6px; padding:4px 10px; background:var(--bg-tertiary); border-radius:var(--radius-full); font-size:13px;">
                <span>${escapeHtml(b)}</span>
                <button onclick="SettingsModule.deleteBrand('${escapeHtml(b)}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; padding:0; line-height:1;">✕</button>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color:var(--text-muted); font-size:13px;">Nenhuma marca cadastrada. As marcas são salvas automaticamente ao adicionar peças.</p>'}
      </div>

      <!-- Lojas -->
      <div class="card mb-4 fade-in">
        <div class="card-header mb-3">
          <div class="settings-section-title" style="margin:0;">Lojas Cadastradas</div>
          <button class="btn-secondary btn-sm" onclick="SettingsModule.showAddStoreModal()">
            <i class="fas fa-plus"></i> Adicionar
          </button>
        </div>
        ${stores.length > 0 ? `
          <div style="display:flex; flex-wrap:wrap; gap:8px;" id="stores-list">
            ${stores.map(s => `
              <div style="display:flex; align-items:center; gap:6px; padding:4px 10px; background:var(--bg-tertiary); border-radius:var(--radius-full); font-size:13px;">
                <span>${escapeHtml(s)}</span>
                <button onclick="SettingsModule.deleteStore('${escapeHtml(s)}')" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:11px; padding:0; line-height:1;">✕</button>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color:var(--text-muted); font-size:13px;">Nenhuma loja cadastrada. As lojas são salvas automaticamente ao adicionar peças.</p>'}
      </div>

      <!-- Zona de Perigo -->
      <div class="card mb-4 fade-in" style="border-color:rgba(239,68,68,.3);">
        <div class="settings-section-title" style="color:var(--danger);">Zona de Perigo</div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Limpar Todos os Dados</div>
            <div class="settings-item-desc">Remove permanentemente todas as peças, builds e configurações</div>
          </div>
          <button class="btn-danger btn-sm" onclick="SettingsModule.clearAllData()">
            <i class="fas fa-trash-alt"></i> Limpar Tudo
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Limpar Apenas Peças</div>
            <div class="settings-item-desc">Remove todas as peças do catálogo (mantém builds)</div>
          </div>
          <button class="btn-danger btn-sm" onclick="SettingsModule.clearParts()">
            <i class="fas fa-puzzle-piece"></i> Limpar Peças
          </button>
        </div>

        <div class="settings-item">
          <div class="settings-item-info">
            <div class="settings-item-label">Limpar Histórico de Preços</div>
            <div class="settings-item-desc">Remove todo o histórico de variações de preços</div>
          </div>
          <button class="btn-ghost btn-sm" onclick="SettingsModule.clearPriceHistory()">
            <i class="fas fa-history"></i> Limpar Histórico
          </button>
        </div>
      </div>

      <!-- Info do App -->
      <div class="card fade-in" style="text-align:center; padding:24px;">
        <div style="font-size:40px; margin-bottom:12px;">🖥️</div>
        <div style="font-size:18px; font-weight:700; margin-bottom:4px;">PC Builder Pro</div>
        <div style="color:var(--text-secondary); font-size:13px; margin-bottom:8px;">Versão 1.0.0 — 100% Offline</div>
        <div style="font-size:12px; color:var(--text-muted);">Todos os dados são salvos localmente no seu dispositivo.</div>
        <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Nenhuma API, nenhum servidor, nenhuma internet necessária.</div>
      </div>

      <div style="height:40px;"></div>
    `;
  }

  // ===================== TEMA =====================
  function setTheme(theme) {
    DB.Settings.update({ theme });
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    App.toast(`Tema ${theme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
    render();
  }

  function setCurrency(currency) {
    const symbols = { BRL: 'R$', USD: '$', EUR: '€' };
    DB.Settings.update({ currency, currencySymbol: symbols[currency] || 'R$' });
    App.toast('Moeda atualizada', 'success');
  }

  // ===================== BACKUP =====================
  function exportBackup() {
    const data = DB.Backup.export();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `pcbuilder-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.toast('Backup exportado com sucesso!', 'success');
  }

  function importBackup(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      App.confirm('Importar backup vai SOBRESCREVER todos os dados atuais. Deseja continuar?', () => {
        const result = DB.Backup.import(e.target.result);
        if (result.success) {
          App.toast(result.message, 'success');
          App.updateBadges();
          // Reload da página para garantir consistência
          setTimeout(() => {
            App.navigate('dashboard');
            render();
          }, 500);
        } else {
          App.toast(result.message, 'error');
        }
      });
    };
    reader.readAsText(file);
    input.value = '';
  }

  // ===================== CATEGORIAS =====================
  function showAddCategoryModal() {
    const catId = 'cat_' + DB.generateId();
    App.showModal('Nova Categoria', `
      <form id="cat-form">
        <div class="form-group">
          <label class="form-label">Nome <span class="required">*</span></label>
          <input class="form-control" id="cat-name" placeholder="Nome da categoria..." required autofocus />
        </div>
        <div class="form-row cols-2">
          <div class="form-group">
            <label class="form-label">Ícone (emoji)</label>
            <input class="form-control" id="cat-icon" value="📌" maxlength="2" placeholder="📌" />
          </div>
          <div class="form-group">
            <label class="form-label">Cor</label>
            <input class="form-control" id="cat-color" type="color" value="#6366f1" style="height:42px; padding:4px;" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">ID (automático)</label>
          <input class="form-control" id="cat-id" value="${catId}" readonly style="opacity:0.6;" />
        </div>
      </form>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Criar', cls: 'btn-primary', action: () => {
        const name = document.getElementById('cat-name').value.trim();
        if (!name) { App.toast('Nome obrigatório', 'error'); return; }
        DB.Settings.addCategory({
          id: document.getElementById('cat-id').value,
          name,
          icon: document.getElementById('cat-icon').value || '📌',
          color: document.getElementById('cat-color').value,
        });
        App.closeModal();
        App.toast('Categoria criada!', 'success');
        render();
      }},
    ]);
  }

  function deleteCategory(id) {
    App.confirm('Excluir esta categoria? Peças com ela manterão o ID antigo.', () => {
      const ok = DB.Settings.deleteCategory(id);
      if (ok) { App.toast('Categoria removida', 'success'); render(); }
      else App.toast('Não é possível excluir categorias padrão', 'error');
    });
  }

  // ===================== MARCAS =====================
  function showAddBrandModal() {
    App.showModal('Adicionar Marca', `
      <div class="form-group">
        <label class="form-label">Nome da Marca</label>
        <input class="form-control" id="brand-input" placeholder="Ex: AMD, Intel, Samsung..." autofocus />
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Adicionar', cls: 'btn-primary', action: () => {
        const name = document.getElementById('brand-input').value.trim();
        if (!name) return;
        DB.Settings.addBrand(name);
        App.closeModal();
        App.toast('Marca adicionada!', 'success');
        render();
      }},
    ]);
  }

  function deleteBrand(name) {
    const brands = DB.Settings.getBrands().filter(b => b !== name);
    localStorage.setItem('pcbuilder_brands', JSON.stringify(brands));
    App.toast('Marca removida', 'success');
    render();
  }

  // ===================== LOJAS =====================
  function showAddStoreModal() {
    App.showModal('Adicionar Loja', `
      <div class="form-group">
        <label class="form-label">Nome da Loja</label>
        <input class="form-control" id="store-input" placeholder="Ex: Kabum, Amazon, Mercado Livre..." autofocus />
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => App.closeModal() },
      { label: 'Adicionar', cls: 'btn-primary', action: () => {
        const name = document.getElementById('store-input').value.trim();
        if (!name) return;
        DB.Settings.addStore(name);
        App.closeModal();
        App.toast('Loja adicionada!', 'success');
        render();
      }},
    ]);
  }

  function deleteStore(name) {
    const stores = DB.Settings.getStores().filter(s => s !== name);
    localStorage.setItem('pcbuilder_stores', JSON.stringify(stores));
    App.toast('Loja removida', 'success');
    render();
  }

  // ===================== LIMPEZA =====================
  function clearAllData() {
    App.confirm('⚠️ ATENÇÃO: Isso vai apagar TODOS os dados permanentemente (builds, peças, histórico, configurações). Esta ação NÃO pode ser desfeita. Exporte um backup antes! Deseja continuar?', () => {
      DB.Backup.clear();
      App.toast('Todos os dados foram apagados', 'success');
      App.updateBadges();
      render();
    });
  }

  function clearParts() {
    App.confirm('Apagar todas as peças do catálogo? As builds não serão afetadas.', () => {
      localStorage.setItem('pcbuilder_parts', JSON.stringify([]));
      localStorage.setItem('pcbuilder_price_history', JSON.stringify([]));
      App.toast('Peças removidas', 'success');
      App.updateBadges();
      render();
    });
  }

  function clearPriceHistory() {
    App.confirm('Apagar todo o histórico de preços?', () => {
      localStorage.setItem('pcbuilder_price_history', JSON.stringify([]));
      App.toast('Histórico de preços limpo', 'success');
    });
  }


  // ===================== NUVEM =====================
  async function testCloudConnection() {
    try {
      const result = await DB.CloudSync.health();
      DB.CloudSync.setMeta({ status: 'ok', lastError: '' });
      App.toast(result.message || 'Conexão com a nuvem OK', 'success');
      render();
    } catch (error) {
      DB.CloudSync.setMeta({ status: navigator.onLine ? 'error' : 'offline', lastError: error.message || String(error) });
      App.toast('Falha na conexão com a nuvem: ' + (error.message || error), 'error', 5000);
      render();
    }
  }

  async function pushToCloud() {
    try {
      await DB.CloudSync.push();
      App.toast('Dados enviados para a nuvem com sucesso!', 'success');
      render();
    } catch (error) {
      DB.CloudSync.setMeta({ status: navigator.onLine ? 'error' : 'offline', lastError: error.message || String(error) });
      App.toast('Não foi possível enviar: ' + (error.message || error), 'error', 5000);
      render();
    }
  }

  async function pullFromCloud() {
    try {
      const result = await DB.CloudSync.pull();
      App.toast(result.message || 'Dados baixados com sucesso!', 'success');
      App.updateBadges();
      render();
      setTimeout(() => App.navigate('dashboard'), 250);
    } catch (error) {
      DB.CloudSync.setMeta({ status: navigator.onLine ? 'error' : 'offline', lastError: error.message || String(error) });
      App.toast('Não foi possível baixar: ' + (error.message || error), 'error', 5000);
      render();
    }
  }

  function toggleCloudSync(enabled) {
    DB.Settings.update({ cloudSyncEnabled: enabled });
    App.toast(enabled ? 'Sync automático ativado' : 'Sync automático desativado', enabled ? 'success' : 'info');
    render();
    if (enabled) {
      DB.CloudSync.autoSync().catch((error) => {
        console.warn('[Settings] auto sync start failed', error);
      });
    }
  }

  return {
    render,
    setTheme,
    setCurrency,
    exportBackup,
    importBackup,
    showAddCategoryModal,
    deleteCategory,
    showAddBrandModal,
    deleteBrand,
    showAddStoreModal,
    deleteStore,
    clearAllData,
    clearParts,
    clearPriceHistory,
    testCloudConnection,
    pushToCloud,
    pullFromCloud,
    toggleCloudSync,
  };
})();
