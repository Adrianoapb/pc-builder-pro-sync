/**
 * PC Builder Pro - App Principal
 * Roteamento, navegação, modal, toast e inicialização PWA
 */

const App = (() => {

  // ===================== ESTADO =====================
  let currentPage = 'dashboard';
  let deferredInstallPrompt = null;

  const PAGE_CONFIG = {
    dashboard: { title: 'Dashboard', module: 'Dashboard', hasAction: false },
    builds:    { title: 'Builds',    module: 'BuildsModule',  hasAction: true, actionLabel: 'Nova Build',  actionFn: () => BuildsModule.showCreateModal() },
    parts:     { title: 'Peças',     module: 'PartsModule',   hasAction: true, actionLabel: 'Nova Peça',   actionFn: () => PartsModule.showCreateModal() },
    comparator:{ title: 'Comparador',module: 'ComparatorModule', hasAction: true, actionLabel: 'Nova Comparação', actionFn: () => ComparatorModule.showCreateModal() },
    shopping:  { title: 'Compras',   module: 'ShoppingModule',hasAction: false },
    reports:   { title: 'Relatórios',module: 'ReportsModule', hasAction: false },
    settings:  { title: 'Configurações', module: 'SettingsModule', hasAction: false },
  };

  // ===================== NAVEGAÇÃO =====================
  function navigate(page, params = {}) {
    if (!PAGE_CONFIG[page]) return;
    currentPage = page;

    // Atualiza nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Atualiza pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.dataset.page === page);
    });

    // Atualiza título
    const config = PAGE_CONFIG[page];
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = config.title;

    // Botão de ação
    const actionBtn = document.getElementById('main-action-btn');
    const actionText = document.getElementById('main-action-text');
    if (actionBtn) {
      actionBtn.style.display = config.hasAction ? 'flex' : 'none';
      if (config.hasAction && actionText) actionText.textContent = config.actionLabel;
    }

    // Fecha sidebar mobile
    closeSidebar();

    // Renderiza módulo
    renderPage(page);

    // Atualiza URL
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.history.replaceState({}, '', url);
  }

  function renderPage(page) {
    const modules = {
      dashboard: () => Dashboard.render(),
      builds: () => BuildsModule.render(),
      parts: () => PartsModule.render(),
      comparator: () => ComparatorModule.render(),
      shopping: () => ShoppingModule.render(),
      reports: () => ReportsModule.render(),
      settings: () => SettingsModule.render(),
    };
    if (modules[page]) {
      try {
        modules[page]();
      } catch (e) {
        console.error('[App] Erro ao renderizar página:', page, e);
      }
    }
  }

  // ===================== SIDEBAR =====================
  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
    // Bloqueia scroll do body sem usar overflow:hidden (preserva selects nativos)
    document.body.classList.add('body-locked');
  }

  function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.classList.remove('body-locked');
  }

  // ===================== MODAL =====================
  function showModal(title, body, actions = [], size = '') {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (!overlay || !container) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    container.className = 'modal-container' + (size ? ' ' + size : '');

    // Footer com botões
    footerEl.innerHTML = '';
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.className = action.cls || 'btn-secondary';
      btn.innerHTML = action.label;
      btn.onclick = action.action;
      footerEl.appendChild(btn);
    });
    if (actions.length === 0) footerEl.style.display = 'none';
    else footerEl.style.display = 'flex';

    overlay.style.display = 'flex';

    // CRÍTICO: NÃO usar body overflow:hidden — quebra selects nativos no iOS/Android
    // Usa position:fixed no body para bloquear scroll sem esconder dropdowns
    const scrollY = window.scrollY;
    document.body.dataset.scrollY = scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';

    // Foca no primeiro input (sem autofocus em select no iOS — abre teclado virtual)
    setTimeout(() => {
      const firstInput = bodyEl.querySelector('input[autofocus], input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]):not([type="file"]):not([readonly])');
      if (firstInput) firstInput.focus();
    }, 150);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
    // Restaura scroll do body
    const scrollY = parseInt(document.body.dataset.scrollY || '0');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollY);
  }

  function confirm(message, onConfirm, onCancel) {
    showModal('Confirmar Ação', `
      <div style="text-align:center; padding:10px 0;">
        <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
        <p style="font-size:15px; color:var(--text-secondary); line-height:1.6;">${message}</p>
      </div>
    `, [
      { label: 'Cancelar', cls: 'btn-ghost', action: () => { closeModal(); if (onCancel) onCancel(); } },
      { label: 'Confirmar', cls: 'btn-danger', action: () => { closeModal(); onConfirm(); } },
    ]);
  }

  // ===================== TOAST =====================
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <i class="fas ${icons[type] || icons.info} toast-icon"></i>
      <span>${message}</span>
    `;
    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ===================== BUSCA GLOBAL =====================
  function toggleSearch() {
    const searchEl = document.getElementById('global-search');
    const input = document.getElementById('global-search-input');
    if (!searchEl) return;
    const isVisible = searchEl.style.display !== 'none';
    searchEl.style.display = isVisible ? 'none' : 'block';
    if (!isVisible && input) {
      input.focus();
      input.value = '';
      document.getElementById('search-results').innerHTML = '';
    }
  }

  function performSearch(query) {
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl || !query.trim()) { resultsEl.innerHTML = ''; return; }

    const categories = DB.Settings.getCategories();
    const parts = DB.Parts.search(query);
    const builds = DB.Builds.getAll().filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || (b.description||'').toLowerCase().includes(query.toLowerCase()));

    let html = '';

    if (parts.length > 0) {
      html += `<div style="font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px; padding:4px 8px;">Peças</div>`;
      parts.slice(0, 5).forEach(p => {
        const cat = categories.find(c => c.id === p.category) || { icon: '📌' };
        html += `
          <div class="search-result-item" onclick="App.navigate('parts'); App.toggleSearch(); setTimeout(()=>PartsModule.showDetailModal('${p.id}'),100)">
            <span style="font-size:18px;">${cat.icon}</span>
            <div>
              <div style="font-weight:600; font-size:14px;">${escapeHtml(p.name)}</div>
              <div style="font-size:12px; color:var(--text-secondary);">${escapeHtml(p.brand)} · R$ ${(p.price||0).toFixed(2)}</div>
            </div>
          </div>
        `;
      });
    }

    if (builds.length > 0) {
      html += `<div style="font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.5px; padding:4px 8px; margin-top:8px;">Builds</div>`;
      builds.slice(0, 3).forEach(b => {
        html += `
          <div class="search-result-item" onclick="App.navigate('builds'); App.toggleSearch(); setTimeout(()=>BuildsModule.openBuild('${b.id}'),100)">
            <span style="font-size:18px;">🖥️</span>
            <div>
              <div style="font-weight:600; font-size:14px;">${escapeHtml(b.name)}</div>
              <div style="font-size:12px; color:var(--text-secondary);">${b.parts.length} peças</div>
            </div>
          </div>
        `;
      });
    }

    if (!html) html = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:13px;">Nenhum resultado para "${escapeHtml(query)}"</div>`;
    resultsEl.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ===================== BADGES =====================
  function updateBadges() {
    const parts = DB.Parts.getAll();
    const builds = DB.Builds.getAll();

    // Builds badge
    const buildsBadge = document.getElementById('builds-badge');
    if (buildsBadge) {
      buildsBadge.textContent = builds.length > 0 ? builds.length : '';
    }

    // Parts badge
    const partsBadge = document.getElementById('parts-badge');
    if (partsBadge) {
      partsBadge.textContent = parts.length > 0 ? parts.length : '';
    }

    // Shopping badge (pendentes)
    const shoppingBadge = document.getElementById('shopping-badge');
    if (shoppingBadge) {
      const pending = parts.filter(p => p.status !== 'bought' && p.status !== 'discarded').length;
      shoppingBadge.textContent = pending > 0 ? pending : '';
    }

    // Storage info
    const storageEl = document.getElementById('storage-info');
    if (storageEl) {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('pcbuilder_')) {
          total += (localStorage[key].length + key.length) * 2;
        }
      }
      storageEl.textContent = `${(total / 1024).toFixed(1)} KB armazenados`;
    }
  }

  // ===================== PWA =====================
  function initPWA() {
    // Registra Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('[PWA] Service Worker registrado:', reg.scope);
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast('Nova versão disponível! Atualize para usar.', 'info', 8000);
              }
            });
          });
        })
        .catch(err => console.warn('[PWA] SW não registrado:', err));
    }

    // Banner de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      const banner = document.getElementById('pwa-banner');
      if (banner && !localStorage.getItem('pwa-dismissed')) {
        setTimeout(() => banner.style.display = 'block', 3000);
      }
    });

    window.addEventListener('appinstalled', () => {
      const banner = document.getElementById('pwa-banner');
      if (banner) banner.style.display = 'none';
      toast('App instalado com sucesso! 🎉', 'success');
    });
  }

  // ===================== INICIALIZAÇÃO =====================
  function init() {
    // Aplica tema salvo
    const settings = DB.Settings.get();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.className = settings.theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';

    // Splash screen
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      const app = document.getElementById('app');
      if (splash) splash.classList.add('fade-out');
      if (app) app.style.display = 'flex';
      setTimeout(() => {
        if (splash) splash.style.display = 'none';
      }, 500);
    }, 1400);

    // Event listeners
    setupEventListeners();

    // Navega para a página inicial
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    const initialPage = PAGE_CONFIG[pageParam] ? pageParam : 'dashboard';

    setTimeout(() => {
      navigate(initialPage);
      updateBadges();
    }, 1500);

    // PWA
    initPWA();

    if (DB.Settings.get().cloudSyncEnabled) {
      setTimeout(() => {
        DB.CloudSync.autoSync().catch(err => console.warn('[CloudSync] inicial falhou:', err));
      }, 2500);
    }

    console.log('[App] PC Builder Pro inicializado');
  }

  function setupEventListeners() {
    // Menu toggle
    document.getElementById('menu-toggle')?.addEventListener('click', openSidebar);
    document.getElementById('sidebar-close')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);

    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(item.dataset.page);
      });
    });

    // Botão de ação principal da topbar
    document.getElementById('main-action-btn')?.addEventListener('click', () => {
      const config = PAGE_CONFIG[currentPage];
      if (config?.hasAction && config?.actionFn) config.actionFn();
    });

    // Tema toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const newTheme = current === 'dark' ? 'light' : 'dark';
      DB.Settings.update({ theme: newTheme });
      document.documentElement.setAttribute('data-theme', newTheme);
      const icon = document.getElementById('theme-icon');
      if (icon) icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
      toast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
    });

    // Busca
    document.getElementById('search-btn')?.addEventListener('click', toggleSearch);
    document.getElementById('search-close')?.addEventListener('click', toggleSearch);
    document.getElementById('global-search-input')?.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // ESC fecha modal e busca
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('modal-overlay');
        if (modal && modal.style.display !== 'none') {
          closeModal();
          return;
        }
        const search = document.getElementById('global-search');
        if (search && search.style.display !== 'none') {
          toggleSearch();
          return;
        }
      }
    });

    // Fecha modal ao clicar fora
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);

    // PWA Instalar
    document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const result = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        document.getElementById('pwa-banner').style.display = 'none';
      }
    });
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      document.getElementById('pwa-banner').style.display = 'none';
      localStorage.setItem('pwa-dismissed', '1');
    });

    window.addEventListener('online', () => {
      App.toast('Internet detectada. Sincronizando com a nuvem...', 'info', 3500);
      DB.CloudSync.autoSync()
        .then(() => App.toast('Nuvem sincronizada com sucesso!', 'success'))
        .catch(err => console.warn('[CloudSync] online sync falhou:', err));
    });

    window.addEventListener('offline', () => {
      DB.CloudSync.setMeta({ status: 'offline' });
      App.toast('Você está offline. O app continua funcionando localmente.', 'warning', 4000);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'k': e.preventDefault(); toggleSearch(); break;
          case '1': e.preventDefault(); navigate('dashboard'); break;
          case '2': e.preventDefault(); navigate('builds'); break;
          case '3': e.preventDefault(); navigate('parts'); break;
          case '4': e.preventDefault(); navigate('comparator'); break;
          case '5': e.preventDefault(); navigate('shopping'); break;
        }
      }
    });
  }

  return {
    navigate,
    openSidebar,
    closeSidebar,
    showModal,
    closeModal,
    confirm,
    toast,
    toggleSearch,
    updateBadges,
    init,
  };
})();

// ===================== INICIAR APP =====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
