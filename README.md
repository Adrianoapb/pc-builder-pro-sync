# PC Builder Pro — v2.0

**Aplicativo offline de orçamento de hardware e montagem de PCs**  
100% offline · PWA · Responsivo Mobile/Desktop · Pronto para APK

---

## Funcionalidades Implementadas ✅

### Dashboard
- Cards de métricas: total de builds, valor total, itens pendentes/comprados, build mais barata/cara, média por build, progresso geral
- Atalhos rápidos: Nova Build, Nova Peça, Comparar, Relatórios
- Progresso geral de todas as builds com barra de progresso

### Builds
- CRUD completo (criar, editar, excluir, duplicar)
- Campos: nome, status, orçamento, plataforma, socket, tipo de memória, cor, notas
- Peças por categoria com subtotais, progresso de compra e compatibilidade
- Compatibilidade básica: socket, chipset, plataforma, tipo de RAM, formato de placa
- Detalhes da build: total, comprado, pendente, progresso percentual

### Peças (Catálogo)
- CRUD completo com todos os campos: nome, categoria, marca, modelo, preço, quantidade, loja, prioridade, status, socket, tipo de memória, link, notas
- Histórico de preços por peça
- Filtros: status, prioridade, categoria
- Busca por nome/marca/modelo/loja
- Ordenação: data, preço, nome
- Ações em lote

### Comparador
- Criação de comparações nomeadas por categoria
- Até 5 itens por comparação
- Análise: mais barato, mais caro, custo-benefício, recomendação automática
- Importar item comparado para lista de compras

### Lista de Compras
- 3 abas: Lista Geral, Por Build, Alta Prioridade
- Filtros: status, prioridade
- Busca por nome/marca/modelo
- Ordenação: prioridade, preço, nome, data
- Marcar como comprado
- Mover itens para build específica
- Resumo: pendentes, pesquisando, comprados, total a gastar/já gasto

### Relatórios
- Resumo geral com métricas completas
- Tabela por categoria: total, itens, percentual
- Ranking de builds por valor
- Itens por status
- Marcas mais usadas
- Itens mais caros
- Opção de impressão

### Configurações
- Alternância de tema (claro/escuro)
- Seleção de moeda (BRL, USD, EUR)
- Categorias personalizadas (criar, editar, excluir)
- Marcas e lojas favoritas
- Backup: exportar JSON
- Restauração: importar JSON com confirmação
- Limpeza de dados locais
- Estatísticas de uso de armazenamento

---

## Estrutura de Arquivos

```
/
├── index.html              # Entrada PWA
├── manifest.json           # Manifesto PWA
├── service-worker.js       # Cache offline (v2.0.0)
├── README.md
├── generate-icons.html     # Gerador de ícones (utilitário)
├── css/
│   └── style.css           # Estilos (v2.0, mobile-first)
├── js/
│   ├── db.js               # Banco de dados localStorage
│   ├── app.js              # Roteamento, modal, toast, PWA
│   ├── dashboard.js        # Módulo Dashboard
│   ├── builds.js           # Módulo Builds
│   ├── parts.js            # Módulo Peças
│   ├── comparator.js       # Módulo Comparador
│   ├── shopping.js         # Módulo Lista de Compras
│   ├── reports.js          # Módulo Relatórios
│   ├── settings.js         # Módulo Configurações
│   └── icon-generator.js   # Gerador de ícones via Canvas
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## URIs / Navegação

| Rota (URL param) | Módulo         |
|-----------------|----------------|
| `?page=dashboard` | Dashboard      |
| `?page=builds`    | Builds         |
| `?page=parts`     | Peças          |
| `?page=comparator`| Comparador     |
| `?page=shopping`  | Lista de Compras|
| `?page=reports`   | Relatórios     |
| `?page=settings`  | Configurações  |

---

## Modelo de Dados (localStorage)

| Chave                        | Tipo   | Descrição                     |
|-----------------------------|--------|-------------------------------|
| `pcbuilder_parts`           | Array  | Peças do catálogo             |
| `pcbuilder_builds`          | Array  | Builds e montagens            |
| `pcbuilder_comparisons`     | Array  | Comparações de hardware       |
| `pcbuilder_price_history`   | Array  | Histórico de preços por peça  |
| `pcbuilder_settings`        | Object | Configurações do app          |
| `pcbuilder_categories`      | Array  | Categorias (padrão + custom)  |
| `pcbuilder_brands`          | Array  | Marcas favoritas              |
| `pcbuilder_stores`          | Array  | Lojas favoritas               |

---

## Correções Aplicadas (v2.0)

### Dropdowns / Selects não abrindo no mobile
**Causa raiz identificada e corrigida:**

1. **`document.body.style.overflow = 'hidden'`** ao abrir modal  
   → Substituído por `position:fixed` + `top:-scrollY` (não bloqueia selects nativos iOS/Android)

2. **`.modal-container { overflow: hidden }`**  
   → Substituído por `overflow: clip` (clipa visual mas não bloqueia eventos de select)  
   → Fallback automático para browsers sem suporte

3. **`select.form-control { -webkit-appearance: none }`**  
   → Substituído por `-webkit-appearance: auto` (obrigatório para dropdown nativo mobile)

4. **`.main-wrapper { overflow: hidden }`**  
   → Substituído por `overflow-x: hidden` (apenas eixo horizontal)

5. **`select.form-control` sem `appearance:auto` em media queries mobile**  
   → Adicionado `!important` para garantir override em todos os viewports

### Responsividade Mobile
- Form rows colapsam para 1 coluna em telas < 768px
- Modais viram "bottom sheet" em mobile (slide up from bottom)
- Topbar oculta texto do botão de ação em mobile (só ícone)
- Sidebar vira gaveta off-canvas com overlay
- Stat grid: 2 colunas em mobile
- Section header: empilha verticalmente em mobile
- Filtros: scroll horizontal em mobile
- Área de toque mínima: 44px em todos os botões e inputs
- `font-size: 16px` em todos os inputs (evita zoom automático iOS)
- Safe area insets para notch/home bar do iPhone

---

## PWA & APK

### Instalar como PWA
1. Abrir no Chrome/Edge
2. Aguardar banner de instalação ou usar menu do browser → "Instalar app"

### Converter para APK (Android)
```bash
# Usando Capacitor
npm install -g @capacitor/cli
npm init
npx cap init "PC Builder Pro" "com.pcbuilder.pro"
npx cap add android
# Copiar arquivos para capacitor/public
npx cap open android
# Build no Android Studio
```

### Converter para APK usando TWA (Trusted Web Activity)
- Usar Bubblewrap ou PWA Builder (pwabuilder.com)
- Informar a URL do app publicado

---

## Tecnologias

- **HTML5 / CSS3 / JavaScript ES6+** puro (sem frameworks)
- **localStorage** para persistência offline
- **Service Worker** (cache-first strategy, v2.0.0)
- **Web App Manifest** (PWA completo)
- **Font Awesome 6.4** (CDN)
- **Google Fonts — Inter** (CDN)
- Sem dependências de backend ou banco de dados externo

---

## Próximos Passos Sugeridos

- [ ] Exportar lista de compras como PDF
- [ ] Compartilhamento de builds via URL/QRCode
- [ ] Notificações de alerta de orçamento
- [ ] Sincronização via arquivo JSON em nuvem (Google Drive, Dropbox)
- [ ] Imagem local para peças (via FileReader API)
- [ ] Modo impressão para lista de compras
- [ ] Filtro por faixa de preço
- [ ] Suporte a builds de notebook completo
