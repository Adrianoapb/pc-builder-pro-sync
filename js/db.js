/**
 * PC Builder Pro - Camada de Dados
 * Gerencia todo o armazenamento local via localStorage
 * Sem dependências externas, 100% offline
 */

const DB = (() => {
  // ===================== CHAVES DO STORAGE =====================
  const KEYS = {
    PARTS: 'pcbuilder_parts',
    BUILDS: 'pcbuilder_builds',
    COMPARISONS: 'pcbuilder_comparisons',
    PRICE_HISTORY: 'pcbuilder_price_history',
    SETTINGS: 'pcbuilder_settings',
    CATEGORIES: 'pcbuilder_categories',
    BRANDS: 'pcbuilder_brands',
    STORES: 'pcbuilder_stores',
    CLOUD_META: 'pcbuilder_cloud_meta',
  };

  // ===================== CATEGORIAS PADRÃO =====================
  const DEFAULT_CATEGORIES = [
    { id: 'motherboard', name: 'Placa-Mãe', icon: '🖥️', color: '#6366f1' },
    { id: 'cpu', name: 'Processador', icon: '⚡', color: '#f59e0b' },
    { id: 'ram', name: 'Memória RAM', icon: '💾', color: '#10b981' },
    { id: 'ssd', name: 'SSD', icon: '💿', color: '#3b82f6' },
    { id: 'hdd', name: 'HD', icon: '🖴', color: '#8b5cf6' },
    { id: 'psu', name: 'Fonte', icon: '🔌', color: '#ef4444' },
    { id: 'case', name: 'Gabinete', icon: '📦', color: '#6b7280' },
    { id: 'gpu', name: 'Placa de Vídeo', icon: '🎮', color: '#ec4899' },
    { id: 'cooler', name: 'Cooler', icon: '❄️', color: '#06b6d4' },
    { id: 'monitor', name: 'Monitor', icon: '🖥', color: '#0ea5e9' },
    { id: 'keyboard', name: 'Teclado', icon: '⌨️', color: '#84cc16' },
    { id: 'mouse', name: 'Mouse', icon: '🖱️', color: '#f97316' },
    { id: 'headset', name: 'Headset', icon: '🎧', color: '#a855f7' },
    { id: 'notebook', name: 'Notebook', icon: '💻', color: '#14b8a6' },
    { id: 'accessories', name: 'Acessórios', icon: '🔧', color: '#64748b' },
    { id: 'peripherals', name: 'Periféricos', icon: '🖨️', color: '#78716c' },
    { id: 'others', name: 'Outros', icon: '📌', color: '#94a3b8' },
  ];

  const DEFAULT_SETTINGS = {
    theme: 'dark',
    currency: 'BRL',
    currencySymbol: 'R$',
    language: 'pt-BR',
    notifications: true,
    autoBackup: false,
    cloudSyncEnabled: false,
    createdAt: new Date().toISOString(),
  };

  // ===================== UTILITÁRIOS =====================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function now() {
    return new Date().toISOString();
  }

  function getItem(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[DB] Erro ao ler:', key, e);
      return null;
    }
  }

  function setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[DB] Erro ao salvar:', key, e);
      return false;
    }
  }

  // ===================== INICIALIZAÇÃO =====================
  function init() {
    // Inicializa categorias padrão se não existirem
    if (!getItem(KEYS.CATEGORIES)) {
      setItem(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    // Inicializa configurações padrão
    if (!getItem(KEYS.SETTINGS)) {
      setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    // Inicializa arrays vazios se não existirem
    if (!getItem(KEYS.PARTS)) setItem(KEYS.PARTS, []);
    if (!getItem(KEYS.BUILDS)) setItem(KEYS.BUILDS, []);
    if (!getItem(KEYS.COMPARISONS)) setItem(KEYS.COMPARISONS, []);
    if (!getItem(KEYS.PRICE_HISTORY)) setItem(KEYS.PRICE_HISTORY, []);
    if (!getItem(KEYS.BRANDS)) setItem(KEYS.BRANDS, []);
    if (!getItem(KEYS.STORES)) setItem(KEYS.STORES, []);
    console.log('[DB] Banco de dados local inicializado');
  }

  // ===================== PEÇAS (PARTS) =====================
  const Parts = {
    getAll() {
      return getItem(KEYS.PARTS) || [];
    },
    getById(id) {
      return this.getAll().find(p => p.id === id) || null;
    },
    getByCategory(category) {
      return this.getAll().filter(p => p.category === category);
    },
    getByStatus(status) {
      return this.getAll().filter(p => p.status === status);
    },
    create(data) {
      const parts = this.getAll();
      const part = {
        id: generateId(),
        name: data.name || '',
        category: data.category || 'others',
        brand: data.brand || '',
        model: data.model || '',
        price: parseFloat(data.price) || 0,
        quantity: parseInt(data.quantity) || 1,
        store: data.store || '',
        notes: data.notes || '',
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        image: data.image || '',
        link: data.link || '',
        socket: data.socket || '',
        chipset: data.chipset || '',
        platform: data.platform || '',
        memoryType: data.memoryType || '',
        formFactor: data.formFactor || '',
        wattage: data.wattage || '',
        compatibility: data.compatibility || '',
        createdAt: now(),
        updatedAt: now(),
      };
      parts.push(part);
      setItem(KEYS.PARTS, parts);
      return part;
    },
    update(id, data) {
      const parts = this.getAll();
      const idx = parts.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const oldPrice = parts[idx].price;
      parts[idx] = { ...parts[idx], ...data, id, updatedAt: now() };
      setItem(KEYS.PARTS, parts);
      // Registra histórico de preço se mudou
      if (data.price !== undefined && parseFloat(data.price) !== oldPrice) {
        PriceHistory.add(id, oldPrice, parseFloat(data.price), data.priceNote || '');
      }
      return parts[idx];
    },
    delete(id) {
      const parts = this.getAll().filter(p => p.id !== id);
      setItem(KEYS.PARTS, parts);
      return true;
    },
    search(query) {
      const q = query.toLowerCase();
      return this.getAll().filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.store.toLowerCase().includes(q)
      );
    },
    getStats() {
      const parts = this.getAll();
      return {
        total: parts.length,
        pending: parts.filter(p => p.status === 'pending').length,
        bought: parts.filter(p => p.status === 'bought').length,
        searching: parts.filter(p => p.status === 'searching').length,
        discarded: parts.filter(p => p.status === 'discarded').length,
        totalValue: parts.reduce((s, p) => s + (p.price * p.quantity), 0),
      };
    }
  };

  // ===================== BUILDS =====================
  const Builds = {
    getAll() {
      return getItem(KEYS.BUILDS) || [];
    },
    getById(id) {
      return this.getAll().find(b => b.id === id) || null;
    },
    create(data) {
      const builds = this.getAll();
      const build = {
        id: generateId(),
        name: data.name || 'Nova Build',
        description: data.description || '',
        purpose: data.purpose || '',
        budget: parseFloat(data.budget) || 0,
        status: data.status || 'planning',
        parts: [],
        socket: data.socket || '',
        platform: data.platform || '',
        memoryType: data.memoryType || '',
        notes: data.notes || '',
        color: data.color || '#6366f1',
        createdAt: now(),
        updatedAt: now(),
      };
      builds.push(build);
      setItem(KEYS.BUILDS, builds);
      return build;
    },
    update(id, data) {
      const builds = this.getAll();
      const idx = builds.findIndex(b => b.id === id);
      if (idx === -1) return null;
      builds[idx] = { ...builds[idx], ...data, id, updatedAt: now() };
      setItem(KEYS.BUILDS, builds);
      return builds[idx];
    },
    delete(id) {
      const builds = this.getAll().filter(b => b.id !== id);
      setItem(KEYS.BUILDS, builds);
      return true;
    },
    duplicate(id) {
      const build = this.getById(id);
      if (!build) return null;
      const builds = this.getAll();
      const newBuild = {
        ...JSON.parse(JSON.stringify(build)),
        id: generateId(),
        name: build.name + ' (Cópia)',
        createdAt: now(),
        updatedAt: now(),
      };
      // Gera novos IDs para as peças duplicadas
      newBuild.parts = newBuild.parts.map(p => ({ ...p, id: generateId() }));
      builds.push(newBuild);
      setItem(KEYS.BUILDS, builds);
      return newBuild;
    },
    addPart(buildId, partData) {
      const builds = this.getAll();
      const idx = builds.findIndex(b => b.id === buildId);
      if (idx === -1) return null;
      const part = {
        id: generateId(),
        name: partData.name || '',
        category: partData.category || 'others',
        brand: partData.brand || '',
        model: partData.model || '',
        price: parseFloat(partData.price) || 0,
        quantity: parseInt(partData.quantity) || 1,
        store: partData.store || '',
        notes: partData.notes || '',
        priority: partData.priority || 'medium',
        status: partData.status || 'pending',
        link: partData.link || '',
        socket: partData.socket || '',
        chipset: partData.chipset || '',
        platform: partData.platform || '',
        memoryType: partData.memoryType || '',
        wattage: partData.wattage || '',
        compatibility: partData.compatibility || '',
        createdAt: now(),
      };
      builds[idx].parts.push(part);
      builds[idx].updatedAt = now();
      setItem(KEYS.BUILDS, builds);
      return part;
    },
    updatePart(buildId, partId, data) {
      const builds = this.getAll();
      const bIdx = builds.findIndex(b => b.id === buildId);
      if (bIdx === -1) return null;
      const pIdx = builds[bIdx].parts.findIndex(p => p.id === partId);
      if (pIdx === -1) return null;
      builds[bIdx].parts[pIdx] = { ...builds[bIdx].parts[pIdx], ...data, id: partId };
      builds[bIdx].updatedAt = now();
      setItem(KEYS.BUILDS, builds);
      return builds[bIdx].parts[pIdx];
    },
    deletePart(buildId, partId) {
      const builds = this.getAll();
      const idx = builds.findIndex(b => b.id === buildId);
      if (idx === -1) return false;
      builds[idx].parts = builds[idx].parts.filter(p => p.id !== partId);
      builds[idx].updatedAt = now();
      setItem(KEYS.BUILDS, builds);
      return true;
    },
    getStats(build) {
      if (!build) return {};
      const total = build.parts.reduce((s, p) => s + (p.price * p.quantity), 0);
      const bought = build.parts.filter(p => p.status === 'bought').reduce((s, p) => s + (p.price * p.quantity), 0);
      const pending = build.parts.filter(p => p.status !== 'bought' && p.status !== 'discarded').reduce((s, p) => s + (p.price * p.quantity), 0);
      const totalItems = build.parts.length;
      const boughtItems = build.parts.filter(p => p.status === 'bought').length;
      const progress = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0;
      const byCategory = {};
      build.parts.forEach(p => {
        if (!byCategory[p.category]) byCategory[p.category] = { total: 0, count: 0 };
        byCategory[p.category].total += p.price * p.quantity;
        byCategory[p.category].count++;
      });
      return { total, bought, pending, totalItems, boughtItems, progress, byCategory };
    },
    getAllStats() {
      const builds = this.getAll();
      if (builds.length === 0) return { count: 0, totalValue: 0, avgValue: 0, cheapest: null, mostExpensive: null };
      const values = builds.map(b => ({
        id: b.id,
        name: b.name,
        value: b.parts.reduce((s, p) => s + (p.price * p.quantity), 0)
      }));
      const totalValue = values.reduce((s, v) => s + v.value, 0);
      return {
        count: builds.length,
        totalValue,
        avgValue: totalValue / builds.length,
        cheapest: values.reduce((min, v) => v.value < min.value ? v : min, values[0]),
        mostExpensive: values.reduce((max, v) => v.value > max.value ? v : max, values[0]),
      };
    }
  };

  // ===================== HISTÓRICO DE PREÇOS =====================
  const PriceHistory = {
    getAll() {
      return getItem(KEYS.PRICE_HISTORY) || [];
    },
    getByPartId(partId) {
      return this.getAll().filter(h => h.partId === partId);
    },
    add(partId, oldPrice, newPrice, note = '') {
      const history = this.getAll();
      const entry = {
        id: generateId(),
        partId,
        oldPrice: parseFloat(oldPrice) || 0,
        newPrice: parseFloat(newPrice) || 0,
        diff: (parseFloat(newPrice) || 0) - (parseFloat(oldPrice) || 0),
        note,
        date: now(),
      };
      history.push(entry);
      setItem(KEYS.PRICE_HISTORY, history);
      return entry;
    },
    delete(id) {
      const history = this.getAll().filter(h => h.id !== id);
      setItem(KEYS.PRICE_HISTORY, history);
    }
  };

  // ===================== COMPARAÇÕES =====================
  const Comparisons = {
    getAll() {
      return getItem(KEYS.COMPARISONS) || [];
    },
    getById(id) {
      return this.getAll().find(c => c.id === id) || null;
    },
    create(data) {
      const comps = this.getAll();
      const comp = {
        id: generateId(),
        name: data.name || 'Nova Comparação',
        category: data.category || 'others',
        items: data.items || [],
        recommended: data.recommended || '',
        notes: data.notes || '',
        createdAt: now(),
        updatedAt: now(),
      };
      comps.push(comp);
      setItem(KEYS.COMPARISONS, comps);
      return comp;
    },
    update(id, data) {
      const comps = this.getAll();
      const idx = comps.findIndex(c => c.id === id);
      if (idx === -1) return null;
      comps[idx] = { ...comps[idx], ...data, id, updatedAt: now() };
      setItem(KEYS.COMPARISONS, comps);
      return comps[idx];
    },
    delete(id) {
      const comps = this.getAll().filter(c => c.id !== id);
      setItem(KEYS.COMPARISONS, comps);
      return true;
    }
  };

  // ===================== CONFIGURAÇÕES =====================
  const Settings = {
    get() {
      return { ...DEFAULT_SETTINGS, ...(getItem(KEYS.SETTINGS) || {}) };
    },
    update(data) {
      const settings = { ...this.get(), ...data, updatedAt: now() };
      setItem(KEYS.SETTINGS, settings);
      return settings;
    },
    getCategories() {
      return getItem(KEYS.CATEGORIES) || DEFAULT_CATEGORIES;
    },
    getCategoryById(id) {
      return this.getCategories().find(c => c.id === id) || { id, name: id, icon: '📌', color: '#94a3b8' };
    },
    addCategory(data) {
      const cats = this.getCategories();
      if (cats.find(c => c.id === data.id)) return null;
      const cat = { id: data.id || generateId(), name: data.name, icon: data.icon || '📌', color: data.color || '#94a3b8' };
      cats.push(cat);
      setItem(KEYS.CATEGORIES, cats);
      return cat;
    },
    deleteCategory(id) {
      const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
      if (defaultIds.includes(id)) return false; // Não deletar padrões
      const cats = this.getCategories().filter(c => c.id !== id);
      setItem(KEYS.CATEGORIES, cats);
      return true;
    },
    getBrands() {
      return getItem(KEYS.BRANDS) || [];
    },
    addBrand(name) {
      const brands = this.getBrands();
      if (!brands.includes(name)) {
        brands.push(name);
        setItem(KEYS.BRANDS, brands);
      }
      return brands;
    },
    getStores() {
      return getItem(KEYS.STORES) || [];
    },
    addStore(name) {
      const stores = this.getStores();
      if (!stores.includes(name)) {
        stores.push(name);
        setItem(KEYS.STORES, stores);
      }
      return stores;
    },
  };

  // ===================== BACKUP / RESTORE =====================

  // ===================== SINCRONIZAÇÃO EM NUVEM =====================
  const CloudSync = (() => {
    const STATE_KEYS = {
      parts: KEYS.PARTS,
      builds: KEYS.BUILDS,
      comparisons: KEYS.COMPARISONS,
      priceHistory: KEYS.PRICE_HISTORY,
      settings: KEYS.SETTINGS,
      categories: KEYS.CATEGORIES,
      brands: KEYS.BRANDS,
      stores: KEYS.STORES,
    };

    let syncing = false;

    function getMeta() {
      return getItem(KEYS.CLOUD_META) || {
        lastPushAt: '',
        lastPullAt: '',
        lastAutoSyncAt: '',
        lastError: '',
        status: navigator.onLine ? 'online' : 'offline',
      };
    }

    function setMeta(data) {
      const meta = { ...getMeta(), ...data, updatedAt: now() };
      setItem(KEYS.CLOUD_META, meta);
      return meta;
    }

    function getStateEntries() {
      return Object.entries(STATE_KEYS).map(([stateKey, storageKey]) => ({
        key: stateKey,
        payload: getItem(storageKey) ?? null,
        version: '1.0.0',
      }));
    }

    function buildBackupFromCloud(items) {
      return {
        version: '1.0.0',
        exportedAt: now(),
        app: 'PC Builder Pro',
        data: {
          parts: items.parts || [],
          builds: items.builds || [],
          comparisons: items.comparisons || [],
          priceHistory: items.priceHistory || [],
          settings: items.settings || DEFAULT_SETTINGS,
          categories: items.categories || DEFAULT_CATEGORIES,
          brands: items.brands || [],
          stores: items.stores || [],
        }
      };
    }

    async function parseResponse(res) {
      let data = null;
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) {
        const msg = data?.error || `Erro HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    }

    async function health() {
      const res = await fetch('/api/health', { cache: 'no-store' });
      return parseResponse(res);
    }

    async function push() {
      if (!navigator.onLine) throw new Error('Sem internet para sincronizar');
      const items = getStateEntries();
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await parseResponse(res);
      setMeta({ status: 'ok', lastPushAt: now(), lastAutoSyncAt: now(), lastError: '' });
      return data;
    }

    async function pull() {
      if (!navigator.onLine) throw new Error('Sem internet para baixar da nuvem');
      const res = await fetch('/api/sync', { cache: 'no-store' });
      const data = await parseResponse(res);
      const items = data?.items || {};
      const hasCloudData = Object.keys(items).length > 0;
      if (!hasCloudData) {
        return { ok: true, restored: false, message: 'Nenhum dado encontrado na nuvem.' };
      }
      const backup = buildBackupFromCloud(items);
      const result = Backup.import(backup);
      if (!result.success) throw new Error(result.message);
      setMeta({ status: 'ok', lastPullAt: now(), lastAutoSyncAt: now(), lastError: '' });
      return { ok: true, restored: true, message: 'Dados baixados da nuvem com sucesso.' };
    }

    async function autoSync() {
      if (syncing) return { skipped: true, reason: 'busy' };
      const settings = Settings.get();
      if (!settings.cloudSyncEnabled) return { skipped: true, reason: 'disabled' };
      if (!navigator.onLine) {
        setMeta({ status: 'offline' });
        return { skipped: true, reason: 'offline' };
      }

      syncing = true;
      try {
        const hasLocalData = Parts.getAll().length > 0 || Builds.getAll().length > 0 || Comparisons.getAll().length > 0;
        const res = await fetch('/api/sync', { cache: 'no-store' });
        const data = await parseResponse(res);
        const cloudItems = data?.items || {};
        const hasCloudData = Object.keys(cloudItems).length > 0;

        if (!hasLocalData && hasCloudData) {
          const backup = buildBackupFromCloud(cloudItems);
          const result = Backup.import(backup);
          if (!result.success) throw new Error(result.message);
          setMeta({ status: 'ok', lastPullAt: now(), lastAutoSyncAt: now(), lastError: '' });
          return { ok: true, mode: 'pull' };
        }

        await push();
        return { ok: true, mode: 'push' };
      } catch (error) {
        console.error('[CloudSync] autoSync error', error);
        setMeta({ status: 'error', lastError: error.message || String(error) });
        throw error;
      } finally {
        syncing = false;
      }
    }

    return { getMeta, setMeta, health, push, pull, autoSync };
  })();

  const Backup = {
    export() {
      return {
        version: '1.0.0',
        exportedAt: now(),
        app: 'PC Builder Pro',
        data: {
          parts: Parts.getAll(),
          builds: Builds.getAll(),
          comparisons: Comparisons.getAll(),
          priceHistory: PriceHistory.getAll(),
          settings: Settings.get(),
          categories: Settings.getCategories(),
          brands: Settings.getBrands(),
          stores: Settings.getStores(),
        }
      };
    },
    import(jsonData) {
      try {
        const backup = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        if (!backup.data) throw new Error('Formato de backup inválido');
        if (backup.data.parts) setItem(KEYS.PARTS, backup.data.parts);
        if (backup.data.builds) setItem(KEYS.BUILDS, backup.data.builds);
        if (backup.data.comparisons) setItem(KEYS.COMPARISONS, backup.data.comparisons);
        if (backup.data.priceHistory) setItem(KEYS.PRICE_HISTORY, backup.data.priceHistory);
        if (backup.data.settings) setItem(KEYS.SETTINGS, backup.data.settings);
        if (backup.data.categories) setItem(KEYS.CATEGORIES, backup.data.categories);
        if (backup.data.brands) setItem(KEYS.BRANDS, backup.data.brands);
        if (backup.data.stores) setItem(KEYS.STORES, backup.data.stores);
        return { success: true, message: 'Backup restaurado com sucesso!' };
      } catch (e) {
        return { success: false, message: 'Erro ao importar: ' + e.message };
      }
    },
    clear() {
      Object.values(KEYS).forEach(key => localStorage.removeItem(key));
      init();
      return true;
    }
  };

  // ===================== RELATÓRIOS =====================
  const Reports = {
    generate() {
      const parts = Parts.getAll();
      const builds = Builds.getAll();

      // Total por categoria
      const byCategory = {};
      parts.forEach(p => {
        if (!byCategory[p.category]) byCategory[p.category] = { count: 0, total: 0, items: [] };
        byCategory[p.category].count++;
        byCategory[p.category].total += p.price * p.quantity;
        byCategory[p.category].items.push(p);
      });

      // Total por status
      const byStatus = {
        pending: parts.filter(p => p.status === 'pending').length,
        bought: parts.filter(p => p.status === 'bought').length,
        searching: parts.filter(p => p.status === 'searching').length,
        discarded: parts.filter(p => p.status === 'discarded').length,
      };

      // Builds com valores
      const buildsWithValues = builds.map(b => {
        const stats = Builds.getStats(b);
        return { ...b, stats };
      }).sort((a, b) => b.stats.total - a.stats.total);

      // Marcas mais usadas
      const brandCount = {};
      parts.forEach(p => {
        if (p.brand) {
          brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
        }
      });
      const topBrands = Object.entries(brandCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([brand, count]) => ({ brand, count }));

      // Itens mais caros
      const mostExpensive = [...parts]
        .sort((a, b) => b.price - a.price)
        .slice(0, 10);

      // Lojas mais utilizadas
      const storeCount = {};
      parts.forEach(p => {
        if (p.store) storeCount[p.store] = (storeCount[p.store] || 0) + 1;
      });
      const topStores = Object.entries(storeCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([store, count]) => ({ store, count }));

      return {
        generatedAt: now(),
        summary: Parts.getStats(),
        buildsSummary: Builds.getAllStats(),
        byCategory,
        byStatus,
        buildsWithValues,
        topBrands,
        mostExpensive,
        topStores,
      };
    }
  };

  // Inicializa ao carregar
  init();

  // ===================== API PÚBLICA =====================
  return {
    Parts,
    Builds,
    PriceHistory,
    Comparisons,
    Settings,
    Backup,
    Reports,
    CloudSync,
    generateId,
    now,
    DEFAULT_CATEGORIES,
  };
})();
