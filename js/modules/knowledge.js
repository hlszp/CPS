/**
 * CPS三级备考平台 · 知识探索模块
 * 基于 AntV G6 v4 构建交互式知识图谱
 * 支持：力导向布局、节点拖拽、缩放、Minimap、右键菜单、暗黑/亮色主题、全屏、搜索高亮
 */
var KnowledgeModule = (function() {
  var graph = null;
  var graphData = null;
  var selectedNode = null;
  var isFullscreen = false;
  var theme = 'light';
  var detailPanel = null;
  var searchInput = null;
  var viewMode = 'graph';
  var contextMenu = null;
  var tooltipEl = null;
  var resizeHandler = null;
  var escHandler = null;
  var manualAnimId = null;     /* 手动物理动画帧 ID */
  var manualVelocities = {};   /* 手动物理速度缓存 */

  var levelColors = ['#185FA5', '#0F6E56', '#7C3AED', '#EA580C'];
  var levelSizes = [36, 28, 20, 14];
  var levelLabels = ['根类', '课程', '概念主题', '具体知识点'];

  var themes = {
    light: {
      bg: '#ffffff',
      surface: '#f8f9fa',
      edge: '#dee2e6',
      edgeRelated: '#b0b8c4',
      edgeLabel: '#868e96',
      nodeLabel: '#6c757d',
      minimapFill: '#dde4ed',
      minimapStroke: '#b5c4d4'
    },
    dark: {
      bg: '#1a1a2e',
      surface: '#16213e',
      edge: '#2a2a4a',
      edgeRelated: '#4a4a6a',
      edgeLabel: '#8888aa',
      nodeLabel: '#b0b0c0',
      minimapFill: '#3a3a5a',
      minimapStroke: '#5a5a7a'
    }
  };

  var physicsParams = {
    gravity: 0.8,        // 中心重力：越大所有节点越聚拢中心
    repulsion: 250,      // 斥力基准：越大节点间排斥越强
    linkDistance: 80,    // 连线基准长度
    collideStrength: 0.85, // 碰撞弹性：越大节点越不重叠
    nodeSpacing: 20      // 节点最小间距
  };

  function render(app) {
    destroyGraph();
    app.innerHTML = '';
    var container = document.createElement('div');
    container.className = 'knowledge-page';
    app.appendChild(container);

    container.innerHTML =
      '<div class="knowledge-header">' +
        '<h2>知识探索</h2>' +
        '<p>14门课程关键概念构建分层知识图谱，支持模糊搜索点亮知识点，呈现概念间逻辑关系</p>' +
      '</div>' +
      '<div class="knowledge-tabs">' +
        '<button class="ktab active" data-mode="graph">知识图谱</button>' +
        '<button class="ktab" data-mode="search">知识检索</button>' +
      '</div>' +
      '<div class="knowledge-body" id="kbBody"></div>';

    container.querySelectorAll('.ktab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        container.querySelectorAll('.ktab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        viewMode = tab.dataset.mode;
        renderBody();
      });
    });

    renderBody();
  }

  function renderBody() {
    var body = document.getElementById('kbBody');
    if (!body) return;
    if (viewMode === 'graph') {
      renderGraph(body);
    } else {
      destroyGraph();
      SearchModule.render(body);
    }
  }

  /* ===== 知识图谱 (G6) ===== */
  function renderGraph(body) {
    graphData = (typeof KNOWLEDGE_GRAPH !== 'undefined') ? KNOWLEDGE_GRAPH : { nodes: [], edges: [] };

    if (typeof G6 === 'undefined') {
      body.innerHTML = '<div class="kg-error" style="padding:60px;text-align:center;color:#888">' +
        '<p style="font-size:16px;margin-bottom:8px">知识图谱引擎加载失败</p>' +
        '<p style="font-size:13px">请检查网络连接后刷新页面</p></div>';
      return;
    }

    body.innerHTML =
      '<div class="kg-layout" id="kgLayout">' +
        '<div class="kg-toolbar">' +
          '<div class="kg-search-box">' +
            '<input type="text" id="kgSearch" placeholder="输入关键词搜索知识点..." class="kg-search-input">' +
            '<button class="kg-search-clear" id="kgClear" title="清除">✕</button>' +
            '<div class="kg-search-count" id="kgSearchCount" style="display:none"></div>' +
          '</div>' +
          '<div class="kg-zoom-controls">' +
            '<button class="kg-zoom-btn" id="kgZoomIn" title="放大">+</button>' +
            '<button class="kg-zoom-btn" id="kgZoomOut" title="缩小">−</button>' +
            '<button class="kg-zoom-btn" id="kgFitView" title="适配全图">⊡</button>' +
            '<button class="kg-zoom-btn" id="kgReLayout" title="重新布局">⟲</button>' +
          '</div>' +
          '<div class="kg-theme-controls">' +
            '<button class="kg-icon-btn" id="kgPhysicsToggle" title="物理参数">⚛</button>' +
            '<button class="kg-icon-btn" id="kgThemeToggle" title="切换主题">' +
              '<span id="kgThemeIcon">🌙</span>' +
            '</button>' +
            '<button class="kg-icon-btn" id="kgFullscreen" title="全屏查看">⛶</button>' +
          '</div>' +
          '<div class="kg-legend">' +
            '<span class="lg-item"><span class="lg-dot lg-root"></span>根类</span>' +
            '<span class="lg-item"><span class="lg-dot lg-course"></span>课程</span>' +
            '<span class="lg-item"><span class="lg-dot lg-concept"></span>概念</span>' +
            '<span class="lg-item"><span class="lg-dot lg-detail"></span>知识点</span>' +
            '<span class="lg-item"><span class="lg-line"></span>关联</span>' +
          '</div>' +
        '</div>' +
        '<div class="kg-main">' +
          '<div class="kg-canvas" id="kgCanvas"></div>' +
          '<div class="kg-detail" id="kgDetail">' +
            '<div class="kgd-placeholder">点击图谱中的节点查看详情<br>或使用搜索功能查找知识点<br><br>' +
            '<small style="color:#bbb">滚轮缩放 · 拖拽节点 · 右键菜单</small></div>' +
          '</div>' +
        '</div>' +
        '<div class="kg-hint">滚轮缩放 · 拖拽触发碰撞 · 单击节点/边选中 · 双击居中 · 右键菜单</div>' +
        '<div class="kg-physics-status" id="kgPhysicsStatus" style="display:none">⚛ 物理引擎运行中...</div>' +
        /* 物理参数控制面板（可折叠） */
        '<div class="kg-physics-panel" id="kgPhysicsPanel" style="display:none">' +
          '<div class="kg-physics-header">' +
            '<span class="kg-physics-title">⚛ 物理引擎参数</span>' +
            '<button class="kg-physics-close" id="kgPhysicsClose">✕</button>' +
          '</div>' +
          '<div class="kg-physics-body">' +
            '<div class="kg-physics-item">' +
              '<label>中心重力 <span class="kg-physics-val" id="kgGravVal">0.8</span></label>' +
              '<input type="range" id="kgGravity" min="0" max="3" step="0.1" value="0.8" class="kg-slider">' +
              '<small>越大节点越聚拢中心</small>' +
            '</div>' +
            '<div class="kg-physics-item">' +
              '<label>节点斥力 <span class="kg-physics-val" id="kgRepVal">250</span></label>' +
              '<input type="range" id="kgRepulsion" min="50" max="500" step="10" value="250" class="kg-slider">' +
              '<small>越大节点间排斥越强</small>' +
            '</div>' +
            '<div class="kg-physics-item">' +
              '<label>连线距离 <span class="kg-physics-val" id="kgLinkVal">80</span></label>' +
              '<input type="range" id="kgLinkDist" min="30" max="200" step="5" value="80" class="kg-slider">' +
              '<small>节点间目标距离基准</small>' +
            '</div>' +
            '<div class="kg-physics-item">' +
              '<label>碰撞强度 <span class="kg-physics-val" id="kgCollVal">0.85</span></label>' +
              '<input type="range" id="kgCollide" min="0.3" max="1" step="0.05" value="0.85" class="kg-slider">' +
              '<small>越大节点越不重叠</small>' +
            '</div>' +
            '<div class="kg-physics-actions">' +
              '<button class="kg-physics-btn" id="kgApplyPhysics">应用并重布局</button>' +
              '<button class="kg-physics-btn kg-physics-reset" id="kgResetPhysics">恢复默认</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    detailPanel = document.getElementById('kgDetail');
    searchInput = document.getElementById('kgSearch');

    initG6();
    bindUIEvents();
  }

  function initG6() {
    var canvasEl = document.getElementById('kgCanvas');
    var rect = canvasEl.getBoundingClientRect();
    var width = rect.width || 800;
    var height = rect.height || 600;
    var t = themes[theme];

    /* Minimap 插件 */
    var minimap = new G6.Minimap({
      size: [150, 100],
      className: 'kg-minimap',
      type: 'delegate',
      delegateStyle: {
        fill: t.minimapFill,
        stroke: t.minimapStroke,
        lineWidth: 1
      }
    });

    graph = new G6.Graph({
      container: 'kgCanvas',
      width: width,
      height: height,
      fitView: false,
      fitCenter: false,
      animate: true,
      animateCfg: { duration: 300, easing: 'easeCubic' },
      modes: {
        default: [
          'drag-canvas',
          'zoom-canvas',
          'drag-node',
          'shortcuts-call'
        ]
      },
      layout: {
        type: 'force',
        preventOverlap: true,
        nodeSize: 40,
        nodeSpacing: physicsParams.nodeSpacing,
        collideStrength: physicsParams.collideStrength,
        /* 中心重力：将节点拉向画布中心 */
        gravity: physicsParams.gravity,
        /* 中心点：画布中心 */
        center: [width / 2, height / 2],
        /* 斥力：按层级分配置，层级越高排斥越强 */
        nodeStrength: function(node) {
          var base = -physicsParams.repulsion;
          if (node.level === 0) return base * 1.8;   // 根节点最强斥力
          if (node.level === 1) return base * 1.0;   // 课程节点中等
          if (node.level === 2) return base * 0.5;   // 概念节点较弱
          return base * 0.3;                          // 知识点最弱
        },
        /* 边吸引力：父子边强关联，关联边弱关联 */
        edgeStrength: function(edge) {
          return edge.relationType === 'related' ? 0.15 : 0.8;
        },
        /* 边目标长度：关联边更长，父子边更短 */
        linkDistance: function(edge) {
          if (edge.relationType === 'related') return physicsParams.linkDistance * 2.5;
          var sourceLevel = edge.sourceModel ? edge.sourceModel.level : 1;
          if (sourceLevel === 0) return physicsParams.linkDistance * 1.5; // 根→课程
          if (sourceLevel === 1) return physicsParams.linkDistance * 1.0; // 课程→概念
          return physicsParams.linkDistance * 0.7;                         // 概念→知识点
        },
        alpha: 0.5,        // 初始温度：越高初始动画越剧烈
        alphaDecay: 0.02,  // 冷却速度
        alphaMin: 0.005,   // 停止温度
        forceSimulation: null
      },
      plugins: [minimap],
      defaultNode: {
        type: 'circle',
        size: 20,
        style: {
          stroke: '#fff',
          lineWidth: 2,
          cursor: 'pointer'
        },
        labelCfg: {
          position: 'bottom',
          offset: 6,
          style: {
            fontSize: 12,
            fill: t.nodeLabel,
            fontFamily: 'var(--font, sans-serif)'
          }
        }
      },
      defaultEdge: {
        type: 'line',
        style: {
          stroke: t.edge,
          lineWidth: 1,
          endArrow: false,
          opacity: 0.7
        }
      },
      nodeStateStyles: {
        selected: {
          stroke: '#1890ff',
          lineWidth: 3,
          shadowColor: 'rgba(24,144,255,0.5)',
          shadowBlur: 12
        },
        highlight: {
          stroke: '#52c41a',
          lineWidth: 2,
          shadowColor: 'rgba(82,196,26,0.4)',
          shadowBlur: 8
        },
        dimmed: {
          opacity: 0.15
        },
        'search-match': {
          stroke: '#FBBF24',
          lineWidth: 3,
          shadowColor: 'rgba(251,191,36,0.6)',
          shadowBlur: 15
        },
        'search-neighbor': {
          stroke: '#F59E0B',
          lineWidth: 2,
          shadowColor: 'rgba(245,158,11,0.3)',
          shadowBlur: 6
        },
        'search-dim': {
          opacity: 0.1
        },
        dragging: {
          stroke: '#FF6B6B',
          lineWidth: 3,
          shadowColor: 'rgba(255,107,107,0.6)',
          shadowBlur: 20,
          cursor: 'grabbing'
        },
        pinned: {
          stroke: '#8B5CF6',
          lineWidth: 2,
          lineDash: [3, 3],
          shadowColor: 'rgba(139,92,246,0.3)',
          shadowBlur: 10
        }
      },
      edgeStateStyles: {
        selected: {
          stroke: '#1890ff',
          lineWidth: 3,
          opacity: 1
        },
        hover: {
          stroke: '#1890ff',
          lineWidth: 2.5,
          opacity: 0.9,
          cursor: 'pointer'
        },
        'search-match': {
          stroke: '#FBBF24',
          lineWidth: 2.5,
          opacity: 0.9
        },
        dimmed: {
          opacity: 0.05
        },
        'search-dim': {
          opacity: 0.05
        }
      }
    });

    /* 数据转换 */
    var data = convertData();
    graph.data(data);
    graph.render();

    /* 布局收敛后适配视图 */
    setTimeout(function() {
      if (graph && !graph.get('destroyed')) {
        graph.fitView(50);
      }
    }, 800);

    bindG6Events();
    bindHoverEffects();
  }

  function convertData() {
    var t = themes[theme];

    var nodes = graphData.nodes.map(function(n) {
      var size = levelSizes[n.level] || 14;
      var color = levelColors[n.level] || '#999';
      return {
        id: n.id,
        label: n.label,
        x: n.x,
        y: n.y,
        level: n.level,
        nodeType: n.type,
        desc: n.desc,
        parent: n.parent,
        size: size,
        style: {
          fill: color,
          stroke: theme === 'dark' ? '#3a3a5a' : '#ffffff',
          lineWidth: 2
        },
        labelCfg: {
          position: 'bottom',
          offset: 6,
          style: {
            fill: n.level <= 1 ? color : t.nodeLabel,
            fontSize: n.level === 0 ? 16 : (n.level === 1 ? 13 : 11),
            fontWeight: n.level <= 1 ? 'bold' : 'normal',
            fontFamily: 'var(--font, sans-serif)'
          }
        }
      };
    });

    var edges = graphData.edges.map(function(e, i) {
      var isRelated = e.type === 'related';
      /* 父子边也显示关系标签 */
      var edgeLabel = '';
      if (isRelated) {
        edgeLabel = e.label || '关联';
      } else {
        /* 根据层级关系生成标签 */
        var fromNode = graphData.nodes.find(function(n) { return n.id === e.from; });
        if (fromNode && fromNode.level === 0) edgeLabel = '包含课程';
        else if (fromNode && fromNode.level === 1) edgeLabel = '包含概念';
        else if (fromNode && fromNode.level === 2) edgeLabel = '包含知识点';
        else edgeLabel = '属于';
      }

      return {
        id: 'edge-' + i,
        source: e.from,
        target: e.to,
        type: isRelated ? 'quadratic' : 'line',
        relationType: e.type,
        sourceModel: graphData.nodes.find(function(n) { return n.id === e.from; }),
        label: edgeLabel,
        style: {
          stroke: isRelated ? t.edgeRelated : t.edge,
          lineWidth: isRelated ? 1.8 : 1,
          /* 关联边用流动虚线，父子边实线 */
          lineDash: isRelated ? [6, 4] : [],
          /* 关联边带箭头 */
          endArrow: isRelated ? {
            path: 'M 0,0 L 6,3 L 6,-3 Z',
            fill: t.edgeRelated
          } : false,
          opacity: isRelated ? 0.75 : 0.5,
          curveness: isRelated ? 0.25 : 0
        },
        labelCfg: {
          autoRotate: true,
          style: {
            fill: isRelated ? t.edgeRelated : t.edgeLabel,
            fontSize: isRelated ? 11 : 9,
            fontWeight: isRelated ? 'bold' : 'normal',
            background: {
              fill: theme === 'dark' ? '#16213e' : '#ffffff',
              padding: [2, 6, 2, 6],
              radius: 4
            }
          }
        }
      };
    });

    return { nodes: nodes, edges: edges };
  }

  /* ===== G6 事件绑定 ===== */
  function bindG6Events() {
    if (!graph) return;

    /* 节点单击 - 选中高亮 */
    graph.on('node:click', function(e) {
      e.stopPropagation && e.stopPropagation();
      var nodeId = e.item.getID();
      selectNode(nodeId);
    });

    /* 节点双击 - 居中聚焦 */
    graph.on('node:dblclick', function(e) {
      var nodeId = e.item.getID();
      graph.focusItem(nodeId, true, { easing: 'easeCubic', duration: 500 });
    });

    /* 节点右键 - 上下文菜单 */
    graph.on('node:contextmenu', function(e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      var nodeId = e.item.getID();
      var clientX = e.clientX || (e.domEvent && e.domEvent.clientX) || 0;
      var clientY = e.clientY || (e.domEvent && e.domEvent.clientY) || 0;
      showContextMenu(clientX, clientY, nodeId);
    });

    /* 画布单击 - 清除选中 */
    graph.on('canvas:click', function() {
      clearSelection();
      hideContextMenu();
    });

    /* ===== 边交互：点击高亮两端节点 ===== */
    graph.on('edge:click', function(e) {
      if (!e.item) return;
      e.stopPropagation && e.stopPropagation();
      selectEdge(e.item);
    });

    /* 边悬停 - 加粗高亮 + 显示 Tooltip */
    graph.on('edge:mouseenter', function(e) {
      if (!e.item) return;
      graph.setItemState(e.item, 'hover', true);
      var model = e.item.getModel();
      var sourceNode = e.item.get('source');
      var targetNode = e.item.get('target');
      var sourceModel = sourceNode ? sourceNode.getModel() : null;
      var targetModel = targetNode ? targetNode.getModel() : null;
      var relLabel = model.label || (model.type === 'related' ? '关联' : '包含');
      showEdgeTooltip(e, sourceModel, targetModel, relLabel);
    });

    graph.on('edge:mouseleave', function() {
      if (!graph || graph.get('destroyed')) return;
      graph.getEdges().forEach(function(edge) {
        graph.clearItemStates(edge, ['hover']);
      });
      hideTooltip();
    });

    /* 节点 hover - 显示 Tooltip */
    graph.on('node:mouseenter', function(e) {
      var model = e.item.getModel();
      showTooltip(e, model);
    });

    graph.on('node:mouseleave', function() {
      hideTooltip();
    });

    /* 拖拽节点 - 实时碰撞 + 重新布局 */
    graph.on('node:dragstart', function(e) {
      if (!e.item) return;
      var nodeId = e.item.getID();
      graph.setItemState(e.item, 'dragging', true);
      showPhysicsStatus(true, 'active');

      /* 尝试 d3 模拟方式 */
      var sim = getSimulation();
      if (sim) {
        var simNode = getSimNode(sim, nodeId);
        if (simNode) { simNode.fx = e.x; simNode.fy = e.y; }
        sim.alphaTarget(0.3).alpha(0.5).restart();
      }
      /* 同时启动手动物理引擎，确保碰撞效果可见 */
      startManualPhysics(nodeId);
    });

    graph.on('node:drag', function(e) {
      if (!e.item) return;
      var nodeId = e.item.getID();
      var sim = getSimulation();
      if (sim) {
        var simNode = getSimNode(sim, nodeId);
        if (simNode) { simNode.fx = e.x; simNode.fy = e.y; }
      }
      /* 手动物理引擎会自动读取被拖节点的实时位置 */
    });

    graph.on('node:dragend', function(e) {
      if (!e.item) return;
      var nodeId = e.item.getID();
      graph.setItemState(e.item, 'dragging', false);
      graph.setItemState(e.item, 'pinned', true);
      var sim = getSimulation();
      if (sim) {
        sim.alphaTarget(0);
      }
      /* 停止手动物理引擎 */
      stopManualPhysics();
      setTimeout(function() { showPhysicsStatus(false); }, 800);
    });
  }

  /* ===== Tooltip ===== */
  function showTooltip(e, model) {
    hideTooltip();
    var levelLabel = levelLabels[model.level] || '节点';
    var desc = model.desc || '';

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'kg-tooltip';
    tooltipEl.innerHTML =
      '<div class="kg-tooltip-type" style="color:' + (levelColors[model.level] || '#999') + '">' + levelLabel + '</div>' +
      '<div class="kg-tooltip-title">' + model.label + '</div>' +
      (desc ? '<div class="kg-tooltip-desc">' + desc + '</div>' : '');

    document.body.appendChild(tooltipEl);

    var clientX = e.clientX || (e.domEvent && e.domEvent.clientX) || 0;
    var clientY = e.clientY || (e.domEvent && e.domEvent.clientY) || 0;
    var rect = tooltipEl.getBoundingClientRect();

    var left = clientX + 14;
    var top = clientY + 14;
    if (left + rect.width > window.innerWidth) left = clientX - rect.width - 14;
    if (top + rect.height > window.innerHeight) top = clientY - rect.height - 14;

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  }

  /* ===== UI 事件绑定 ===== */
  function bindUIEvents() {
    /* 搜索 */
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        var q = this.value.trim().toLowerCase();
        highlightSearch(q);
      });
    }
    var clearBtn = document.getElementById('kgClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        if (searchInput) searchInput.value = '';
        highlightSearch('');
      });
    }

    /* 缩放控制 */
    var zoomInBtn = document.getElementById('kgZoomIn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', function() {
      if (graph && !graph.get('destroyed')) {
        var zoom = graph.getZoom();
        graph.zoomTo(zoom * 1.2, graph.getGraphCenterPoint());
      }
    });

    var zoomOutBtn = document.getElementById('kgZoomOut');
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', function() {
      if (graph && !graph.get('destroyed')) {
        var zoom = graph.getZoom();
        graph.zoomTo(zoom * 0.8, graph.getGraphCenterPoint());
      }
    });

    var fitBtn = document.getElementById('kgFitView');
    if (fitBtn) fitBtn.addEventListener('click', function() {
      if (graph && !graph.get('destroyed')) graph.fitView(50);
    });

    var reLayoutBtn = document.getElementById('kgReLayout');
    if (reLayoutBtn) reLayoutBtn.addEventListener('click', function() {
      if (graph && !graph.get('destroyed')) {
        /* 清除 d3 模拟内部节点的固定 */
        var sim = getSimulation();
        if (sim) {
          sim.nodes().forEach(function(n) { n.fx = null; n.fy = null; });
          sim.alphaTarget(0);
        }
        /* 清除 G6 模型的固定状态 */
        graph.getNodes().forEach(function(node) {
          var model = node.getModel();
          model.fx = null;
          model.fy = null;
          graph.clearItemStates(node, ['pinned', 'dragging']);
        });
        graph.layout();
        setTimeout(function() {
          if (graph && !graph.get('destroyed')) graph.fitView(50);
        }, 800);
      }
    });

    /* 主题切换 */
    var themeBtn = document.getElementById('kgThemeToggle');
    if (themeBtn) themeBtn.addEventListener('click', function() {
      theme = theme === 'light' ? 'dark' : 'light';
      applyTheme();
    });

    /* 全屏切换 */
    var fsBtn = document.getElementById('kgFullscreen');
    if (fsBtn) fsBtn.addEventListener('click', function() {
      toggleFullscreen();
    });

    /* 物理参数面板 */
    var physToggle = document.getElementById('kgPhysicsToggle');
    var physPanel = document.getElementById('kgPhysicsPanel');
    var physClose = document.getElementById('kgPhysicsClose');
    if (physToggle) physToggle.addEventListener('click', function() {
      if (physPanel) {
        var isVisible = physPanel.style.display !== 'none';
        physPanel.style.display = isVisible ? 'none' : 'block';
      }
    });
    if (physClose) physClose.addEventListener('click', function() {
      if (physPanel) physPanel.style.display = 'none';
    });

    /* 滑块实时显示数值 */
    var sliders = [
      { input: 'kgGravity', val: 'kgGravVal' },
      { input: 'kgRepulsion', val: 'kgRepVal' },
      { input: 'kgLinkDist', val: 'kgLinkVal' },
      { input: 'kgCollide', val: 'kgCollVal' }
    ];
    sliders.forEach(function(s) {
      var el = document.getElementById(s.input);
      var valEl = document.getElementById(s.val);
      if (el && valEl) {
        el.addEventListener('input', function() {
          valEl.textContent = el.value;
        });
      }
    });

    /* 应用物理参数 */
    var applyBtn = document.getElementById('kgApplyPhysics');
    if (applyBtn) applyBtn.addEventListener('click', function() {
      var g = parseFloat(document.getElementById('kgGravity').value);
      var r = parseFloat(document.getElementById('kgRepulsion').value);
      var l = parseFloat(document.getElementById('kgLinkDist').value);
      var c = parseFloat(document.getElementById('kgCollide').value);
      applyPhysicsParams(g, r, l, c);
    });

    /* 恢复默认 */
    var resetBtn = document.getElementById('kgResetPhysics');
    if (resetBtn) resetBtn.addEventListener('click', function() {
      document.getElementById('kgGravity').value = 0.8;
      document.getElementById('kgRepulsion').value = 250;
      document.getElementById('kgLinkDist').value = 80;
      document.getElementById('kgCollide').value = 0.85;
      document.getElementById('kgGravVal').textContent = '0.8';
      document.getElementById('kgRepVal').textContent = '250';
      document.getElementById('kgLinkVal').textContent = '80';
      document.getElementById('kgCollVal').textContent = '0.85';
      applyPhysicsParams(0.8, 250, 80, 0.85);
    });

    /* ESC 退出全屏 */
    escHandler = function(e) {
      if (e.key === 'Escape') {
        if (contextMenu) { hideContextMenu(); return; }
        if (isFullscreen) toggleFullscreen();
      }
    };
    document.addEventListener('keydown', escHandler);

    /* 点击空白关闭右键菜单 */
    document.addEventListener('click', function(e) {
      if (contextMenu && !e.target.closest('.kg-context-menu')) {
        hideContextMenu();
      }
    });

    /* 窗口大小变化时重设画布 */
    resizeHandler = function() {
      if (graph && !graph.get('destroyed')) {
        var canvasEl = document.getElementById('kgCanvas');
        if (canvasEl) {
          var r = canvasEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            graph.changeSize(r.width, r.height);
          }
        }
      }
    };
    window.addEventListener('resize', resizeHandler);
  }

  /* ===== 物理参数应用 ===== */
  function applyPhysicsParams(gravity, repulsion, linkDist, collide) {
    physicsParams.gravity = gravity;
    physicsParams.repulsion = repulsion;
    physicsParams.linkDistance = linkDist;
    physicsParams.collideStrength = collide;

    if (!graph || graph.get('destroyed')) return;

    /* 更新布局参数并重新模拟 */
    var layout = graph.get('layout');
    if (layout) {
      layout.gravity = gravity;
      layout.collideStrength = collide;
      layout.nodeSpacing = 20;
    }

    /* 重新布局 */
    graph.layout();
    setTimeout(function() {
      if (graph && !graph.get('destroyed')) graph.fitView(50);
    }, 1000);
  }

  /* ===== 节点 hover 缩放 ===== */
  function bindHoverEffects() {
    if (!graph) return;

    graph.on('node:mouseenter', function(e) {
      if (!e.item) return;
      var model = e.item.getModel();
      var originalSize = model.size || 20;
      graph.updateItem(e.item, {
        size: originalSize * 1.25
      });
    });

    graph.on('node:mouseleave', function(e) {
      if (!e.item) return;
      var model = e.item.getModel();
      var level = model.level;
      var originalSize = levelSizes[level] || 14;
      /* 仅恢复非选中节点的尺寸 */
      var states = e.item.getStates();
      if (states.indexOf('selected') === -1 && states.indexOf('highlight') === -1) {
        graph.updateItem(e.item, {
          size: originalSize
        });
      }
    });
  }

  /* ===== 主题切换 ===== */
  function applyTheme() {
    var t = themes[theme];
    var layout = document.getElementById('kgLayout');
    if (layout) layout.classList.toggle('kg-theme-dark', theme === 'dark');

    var iconEl = document.getElementById('kgThemeIcon');
    if (iconEl) iconEl.textContent = theme === 'light' ? '🌙' : '☀️';

    var canvasEl = document.getElementById('kgCanvas');
    if (canvasEl) canvasEl.style.background = t.bg;

    if (!graph || graph.get('destroyed')) return;

    /* 更新节点样式 */
    graph.getNodes().forEach(function(node) {
      var model = node.getModel();
      var level = model.level;
      var color = levelColors[level] || '#999';
      graph.updateItem(node, {
        style: {
          fill: color,
          stroke: theme === 'dark' ? '#3a3a5a' : '#ffffff'
        },
        labelCfg: {
          style: {
            fill: level <= 1 ? color : t.nodeLabel
          }
        }
      });
    });

    /* 更新边样式 */
    graph.getEdges().forEach(function(edge) {
      var model = edge.getModel();
      var isRelated = model.relationType === 'related';
      graph.updateItem(edge, {
        style: {
          stroke: isRelated ? t.edgeRelated : t.edge,
          endArrow: isRelated ? {
            path: 'M 0,0 L 6,3 L 6,-3 Z',
            fill: t.edgeRelated
          } : false
        },
        labelCfg: {
          style: {
            fill: isRelated ? t.edgeRelated : t.edgeLabel,
            background: {
              fill: theme === 'dark' ? '#16213e' : '#ffffff',
              padding: [2, 6, 2, 6],
              radius: 4
            }
          }
        }
      });
    });
  }

  /* ===== 全屏模式 ===== */
  function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    var layout = document.getElementById('kgLayout');
    var fsBtn = document.getElementById('kgFullscreen');

    if (isFullscreen) {
      if (layout) layout.classList.add('kg-fullscreen');
      var backBtn = document.createElement('button');
      backBtn.className = 'kg-exit-fullscreen';
      backBtn.id = 'kgExitFs';
      backBtn.innerHTML = '✕ 退出全屏';
      backBtn.addEventListener('click', function() { toggleFullscreen(); });
      if (layout) layout.appendChild(backBtn);
      if (fsBtn) fsBtn.title = '退出全屏';
      document.body.style.overflow = 'hidden';
    } else {
      if (layout) layout.classList.remove('kg-fullscreen');
      var exitBtn = document.getElementById('kgExitFs');
      if (exitBtn) exitBtn.remove();
      if (fsBtn) fsBtn.title = '全屏查看';
      document.body.style.overflow = '';
    }

    /* 等待 CSS 过渡完成后重设画布尺寸 */
    setTimeout(function() {
      if (graph && !graph.get('destroyed')) {
        var canvasEl = document.getElementById('kgCanvas');
        if (canvasEl) {
          var r = canvasEl.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            graph.changeSize(r.width, r.height);
            graph.fitView(50);
          }
        }
      }
    }, 350);
  }

  /* ===== 边选中：高亮两端节点 ===== */
  function selectEdge(edgeItem) {
    clearSelection();

    if (!graph || graph.get('destroyed')) return;

    var model = edgeItem.getModel();
    var sourceNode = edgeItem.get('source');
    var targetNode = edgeItem.get('target');
    var sourceId = sourceNode.get('id');
    var targetId = targetNode.get('id');

    /* 高亮被点击的边 */
    graph.setItemState(edgeItem, 'selected', true);

    /* 高亮两端节点 */
    graph.setItemState(sourceNode, 'selected', true);
    graph.setItemState(targetNode, 'highlight', true);

    /* 暗化所有其他边和节点 */
    graph.getEdges().forEach(function(e) {
      if (e.get('id') !== edgeItem.get('id')) {
        graph.setItemState(e, 'dimmed', true);
      }
    });
    graph.getNodes().forEach(function(n) {
      var id = n.get('id');
      if (id !== sourceId && id !== targetId) {
        graph.setItemState(n, 'dimmed', true);
      }
    });

    /* 聚焦到该边的中心位置 */
    var sModel = sourceNode.getModel();
    var tModel = targetNode.getModel();
    var cx = (sModel.x + tModel.x) / 2;
    var cy = (sModel.y + tModel.y) / 2;
    graph.focusItem({ x: cx, y: cy }, true, { easing: 'easeCubic', duration: 400 });

    /* 显示边详情面板 */
    showEdgeDetail(model, sourceId, targetId);
  }

  /* ===== 边详情面板 ===== */
  function showEdgeDetail(edgeModel, sourceId, targetId) {
    if (!detailPanel) return;

    var source = graphData.nodes.find(function(n) { return n.id === sourceId; });
    var target = graphData.nodes.find(function(n) { return n.id === targetId; });
    if (!source || !target) return;

    var relLabel = edgeModel.label || (edgeModel.type === 'related' ? '关联' : '包含');
    var sourceLabel = levelLabels[source.level] || '节点';
    var targetLabel = levelLabels[target.level] || '节点';
    var sourceColor = levelColors[source.level] || '#999';
    var targetColor = levelColors[target.level] || '#999';

    var html = '<div class="kgd-content">' +
      '<div class="kgd-type" style="color:#1890ff;">🔗 关系详情</div>' +
      '<h3 class="kgd-title">' + relLabel + '</h3>' +
      '<p class="kgd-desc">关系类型：' + (edgeModel.type === 'related' ? '跨课程关联' : '层级包含') + '</p>';

    html += '<div class="kgd-section"><div class="kgd-section-title">连接节点</div>';
    html += '<div class="kgd-edge-nodes">';

    /* 源节点卡片 */
    html += '<div class="kgd-edge-card kgd-link" data-node="' + source.id + '">' +
      '<div class="kgd-edge-card-type" style="color:' + sourceColor + ';">' + sourceLabel + '</div>' +
      '<div class="kgd-edge-card-label">' + source.label + '</div>' +
      (source.desc ? '<div class="kgd-edge-card-desc">' + source.desc + '</div>' : '') +
    '</div>';

    /* 中间关系箭头 */
    html += '<div class="kgd-edge-arrow">' +
      '<div class="kgd-edge-arrow-label">' + relLabel + '</div>' +
      '<div class="kgd-edge-arrow-icon">→</div>' +
    '</div>';

    /* 目标节点卡片 */
    html += '<div class="kgd-edge-card kgd-link" data-node="' + target.id + '">' +
      '<div class="kgd-edge-card-type" style="color:' + targetColor + ';">' + targetLabel + '</div>' +
      '<div class="kgd-edge-card-label">' + target.label + '</div>' +
      (target.desc ? '<div class="kgd-edge-card-desc">' + target.desc + '</div>' : '') +
    '</div>';

    html += '</div></div>';

    /* 操作按钮 */
    html += '<div class="kgd-actions">';
    html += '<button class="kgd-action-btn" onclick="KnowledgeModule.centerNode(\'' + source.id + '\')">🎯 定位 ' + source.label + '</button>';
    html += '<button class="kgd-action-btn" onclick="KnowledgeModule.centerNode(\'' + target.id + '\')">🎯 定位 ' + target.label + '</button>';
    html += '</div>';

    html += '</div>';
    detailPanel.innerHTML = html;

    /* 绑定节点卡片点击 → 选中该节点 */
    detailPanel.querySelectorAll('[data-node]').forEach(function(el) {
      el.addEventListener('click', function() {
        var nid = el.getAttribute('data-node');
        selectNode(nid);
      });
    });
  }

  /* ===== 边 Tooltip ===== */
  function showEdgeTooltip(e, sourceModel, targetModel, relLabel) {
    hideTooltip();
    if (!sourceModel || !targetModel) return;

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'kg-tooltip';
    tooltipEl.innerHTML =
      '<div class="kg-tooltip-type" style="color:#1890ff;">🔗 ' + relLabel + '</div>' +
      '<div class="kg-tooltip-title">' + sourceModel.label + ' ↔ ' + targetModel.label + '</div>' +
      '<div class="kg-tooltip-desc" style="font-size:11px;">点击此边可高亮两端节点</div>';

    document.body.appendChild(tooltipEl);

    var clientX = e.clientX || (e.domEvent && e.domEvent.clientX) || 0;
    var clientY = e.clientY || (e.domEvent && e.domEvent.clientY) || 0;
    var rect = tooltipEl.getBoundingClientRect();

    var left = clientX + 14;
    var top = clientY + 14;
    if (left + rect.width > window.innerWidth) left = clientX - rect.width - 14;
    if (top + rect.height > window.innerHeight) top = clientY - rect.height - 14;

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  /* ===== 节点选中 ===== */
  function selectNode(nodeId) {
    clearSelection();
    selectedNode = nodeId;

    if (!graph || graph.get('destroyed')) return;

    var node = graph.findById(nodeId);
    if (!node) return;

    graph.setItemState(node, 'selected', true);

    /* 高亮关联节点和边，暗化其余 */
    var connected = new Set();
    graph.getEdges().forEach(function(edge) {
      var sourceNode = edge.get('source');
      var targetNode = edge.get('target');
      var sourceId = sourceNode.get('id');
      var targetId = targetNode.get('id');

      if (sourceId === nodeId) {
        connected.add(targetId);
        graph.setItemState(edge, 'selected', true);
        graph.setItemState(targetNode, 'highlight', true);
      } else if (targetId === nodeId) {
        connected.add(sourceId);
        graph.setItemState(edge, 'selected', true);
        graph.setItemState(sourceNode, 'highlight', true);
      } else {
        graph.setItemState(edge, 'dimmed', true);
      }
    });

    graph.getNodes().forEach(function(n) {
      var id = n.get('id');
      if (id !== nodeId && !connected.has(id)) {
        graph.setItemState(n, 'dimmed', true);
      }
    });

    showDetail(nodeId, connected);
  }

  /* ===== 手动物理引擎 ===== */
  /* 独立于 G6 内部 d3 模拟的轻量物理引擎，确保拖拽碰撞效果可见 */

  function startManualPhysics(draggedId) {
    stopManualPhysics();
    if (!graph || graph.get('destroyed')) return;

    var allNodes = graph.getNodes();
    var allEdges = graph.getEdges();

    /* 初始化速度缓存 */
    manualVelocities = {};
    allNodes.forEach(function(node) {
      manualVelocities[node.getID()] = { vx: 0, vy: 0 };
    });

    /* 预计算边关系：与被拖节点相连的边 */
    var springEdges = [];
    allEdges.forEach(function(edge) {
      var model = edge.getModel();
      var sid = model.source;
      var tid = model.target;
      if (sid === draggedId || tid === draggedId) {
        var otherId = sid === draggedId ? tid : sid;
        springEdges.push({
          otherId: otherId,
          type: model.relationType || 'parent',
          source: sid,
          target: tid
        });
      }
    });

    function physicsStep() {
      if (!graph || graph.get('destroyed')) {
        stopManualPhysics();
        return;
      }

      var dragNode = graph.findById(draggedId);
      if (!dragNode) {
        stopManualPhysics();
        return;
      }
      var dragModel = dragNode.getModel();
      var dragSize = dragModel.size || 20;
      var dragX = dragModel.x;
      var dragY = dragModel.y;

      /* 1) 碰撞排斥力：所有节点被拖拽节点推开 */
      allNodes.forEach(function(node) {
        var id = node.getID();
        if (id === draggedId) return;

        var model = node.getModel();
        var nodeSize = model.size || 20;
        var dx = model.x - dragX;
        var dy = model.y - dragY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var minDist = (dragSize + nodeSize) / 2 + 25; /* 期望间距 */

        if (dist < minDist && dist > 0.5) {
          /* 碰撞推力：距离越近推力越大 */
          var pushForce = Math.pow((minDist - dist) / minDist, 2) * 8;
          manualVelocities[id].vx += (dx / dist) * pushForce;
          manualVelocities[id].vy += (dy / dist) * pushForce;
        } else if (dist <= 0.5) {
          /* 完全重叠：随机方向弹开 */
          manualVelocities[id].vx += (Math.random() - 0.5) * 5;
          manualVelocities[id].vy += (Math.random() - 0.5) * 5;
        }
      });

      /* 2) 弹簧吸引力：相连节点被拉向/推离拖拽节点 */
      springEdges.forEach(function(spring) {
        var otherNode = graph.findById(spring.otherId);
        if (!otherNode) return;
        var otherModel = otherNode.getModel();
        var otherId = otherNode.getID();
        var dx = dragX - otherModel.x;
        var dy = dragY - otherModel.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var desiredDist = spring.type === 'related' ? 200 : 80;

        if (dist > desiredDist + 10 && dist > 0) {
          /* 太远 → 拉近 */
          var pullForce = (dist - desiredDist) / dist * 0.15;
          manualVelocities[otherId].vx += dx * pullForce;
          manualVelocities[otherId].vy += dy * pullForce;
        }
      });

      /* 3) 应用速度 + 阻尼衰减 + 更新位置 */
      var needRefresh = false;
      allNodes.forEach(function(node) {
        var id = node.getID();
        if (id === draggedId) return;
        if (!manualVelocities[id]) return;

        /* 阻尼 */
        manualVelocities[id].vx *= 0.82;
        manualVelocities[id].vy *= 0.82;

        var model = node.getModel();
        var newX = model.x + manualVelocities[id].vx;
        var newY = model.y + manualVelocities[id].vy;

        /* 只有位移足够大才更新（减少不必要的渲染） */
        if (Math.abs(manualVelocities[id].vx) > 0.1 || Math.abs(manualVelocities[id].vy) > 0.1) {
          graph.updateItem(node, { x: newX, y: newY }, { disableAnimate: true });
          needRefresh = true;
        }
      });

      if (needRefresh) {
        graph.refreshPositions();
      }

      manualAnimId = requestAnimationFrame(physicsStep);
    }

    physicsStep();
  }

  function stopManualPhysics() {
    if (manualAnimId) {
      cancelAnimationFrame(manualAnimId);
      manualAnimId = null;
    }
    manualVelocities = {};
  }

  /* ===== 力模拟控制 ===== */

  /* 显示/隐藏物理引擎状态指示器 */
  function showPhysicsStatus(active, mode) {
    var status = document.getElementById('kgPhysicsStatus');
    if (!status) return;
    if (active) {
      status.textContent = '⚛ 物理引擎运行中...';
      status.style.display = 'block';
    } else {
      status.style.display = 'none';
    }
  }

  /* 获取 G6 内部 d3-force 模拟实例（多路径查找） */
  function getSimulation() {
    if (!graph || graph.get('destroyed')) return null;
    var lc = graph.get('layoutController');
    if (!lc) return null;

    /* 路径 1: layoutController.layoutMethod.simulation */
    if (lc.layoutMethod && lc.layoutMethod.simulation) return lc.layoutMethod.simulation;

    /* 路径 2: layoutController.layoutMethods 数组 */
    if (lc.layoutMethods && lc.layoutMethods.length) {
      for (var i = 0; i < lc.layoutMethods.length; i++) {
        if (lc.layoutMethods[i] && lc.layoutMethods[i].simulation) return lc.layoutMethods[i].simulation;
      }
    }

    /* 路径 3: 通过 getter 方法 */
    if (typeof lc.getLayoutMethod === 'function') {
      var lm = lc.getLayoutMethod();
      if (lm && lm.simulation) return lm.simulation;
    }

    /* 路径 4: 直接在 graph 上查找 */
    if (graph.simulation) return graph.simulation;

    return null;
  }

  /* 从 d3 模拟中按 ID 查找内部节点 */
  function getSimNode(sim, nodeId) {
    if (!sim) return null;
    var nodes = sim.nodes();
    for (var i = 0; i < nodes.length; i++) {
      if (String(nodes[i].id) === String(nodeId)) return nodes[i];
    }
    return null;
  }

  function reheatSimulation(alpha) {
    if (!graph || graph.get('destroyed')) return;
    var sim = getSimulation();
    if (sim) {
      sim.alphaTarget(0.3).alpha(alpha || 0.5).restart();
    }
  }

  function coolDownSimulation() {
    if (!graph || graph.get('destroyed')) return;
    var sim = getSimulation();
    if (sim) sim.alphaTarget(0);
  }

  /* 释放所有固定节点，让图谱回归自然力导向布局 */
  function unpinAllNodes() {
    if (!graph || graph.get('destroyed')) return;
    var sim = getSimulation();
    /* 清除 d3 模拟内部节点的固定 */
    if (sim) {
      sim.nodes().forEach(function(n) { n.fx = null; n.fy = null; });
    }
    /* 清除 G6 模型上的固定 */
    graph.getNodes().forEach(function(node) {
      var model = node.getModel();
      model.fx = null;
      model.fy = null;
      graph.clearItemStates(node, ['pinned']);
    });
    /* 重新加热让节点自然散开 */
    if (sim) {
      sim.alphaTarget(0.3).alpha(0.3).restart();
    } else {
      graph.layout();
    }
  }

  /* 释放单个固定节点 */
  function unpinNode(nodeId) {
    if (!graph || graph.get('destroyed')) return;
    var sim = getSimulation();
    if (sim) {
      var simNode = getSimNode(sim, nodeId);
      if (simNode) { simNode.fx = null; simNode.fy = null; }
    }
    var node = graph.findById(nodeId);
    if (node) {
      var model = node.getModel();
      model.fx = null;
      model.fy = null;
      graph.setItemState(node, 'pinned', false);
    }
    if (sim) {
      sim.alphaTarget(0.3).alpha(0.3).restart();
      setTimeout(function() { if (sim) sim.alphaTarget(0); }, 2000);
    } else {
      graph.layout();
    }
  }

  function clearSelection() {
    if (!graph || graph.get('destroyed')) return;
    graph.getNodes().forEach(function(node) {
      graph.clearItemStates(node, ['selected', 'dimmed', 'highlight', 'search-match', 'search-dim', 'search-neighbor', 'dragging']);
    });
    graph.getEdges().forEach(function(edge) {
      graph.clearItemStates(edge, ['selected', 'hover', 'dimmed', 'search-match', 'search-dim']);
    });
    selectedNode = null;
  }

  /* ===== 详情面板 ===== */
  function showDetail(nodeId, connectedSet) {
    var node = graphData.nodes.find(function(n) { return n.id === nodeId; });
    if (!node || !detailPanel) return;

    var connectedNodes = [];
    connectedSet.forEach(function(id) {
      var cn = graphData.nodes.find(function(n) { return n.id === id; });
      if (cn) {
        var edge = graphData.edges.find(function(e) {
          return (e.from === nodeId && e.to === id) || (e.to === nodeId && e.from === id);
        });
        connectedNodes.push({ node: cn, edgeLabel: edge ? edge.label : null, edgeType: edge ? edge.type : 'parent' });
      }
    });

    var levelLabel = levelLabels[node.level] || '节点';
    var typeColor = levelColors[node.level] || '#999';

    var html = '<div class="kgd-content">' +
      '<div class="kgd-type" style="color:' + typeColor + ';">' + levelLabel + '</div>' +
      '<h3 class="kgd-title">' + node.label + '</h3>';

    if (node.desc) html += '<p class="kgd-desc">' + node.desc + '</p>';

    html += '<div class="kgd-actions">';
    html += '<button class="kgd-action-btn" onclick="KnowledgeModule.centerNode(\'' + nodeId + '\')">🎯 居中</button>';
    html += '</div>';

    /* 父节点 */
    var parentEdge = graphData.edges.find(function(e) { return e.to === nodeId && e.type === 'parent'; });
    if (parentEdge) {
      var parent = graphData.nodes.find(function(n) { return n.id === parentEdge.from; });
      if (parent) html += '<div class="kgd-parent">上级：<span class="kgd-link" data-node="' + parent.id + '">' + parent.label + '</span></div>';
    }

    /* 子节点 */
    var children = graphData.edges.filter(function(e) { return e.from === nodeId && e.type === 'parent'; });
    if (children.length) {
      html += '<div class="kgd-section"><div class="kgd-section-title">下级概念 (' + children.length + ')</div><div class="kgd-children">';
      children.forEach(function(ce) {
        var child = graphData.nodes.find(function(n) { return n.id === ce.to; });
        if (child) html += '<div class="kgd-child" data-node="' + child.id + '">' + child.label + '</div>';
      });
      html += '</div></div>';
    }

    /* 关联节点 */
    var related = connectedNodes.filter(function(cn) { return cn.edgeType === 'related'; });
    if (related.length) {
      html += '<div class="kgd-section"><div class="kgd-section-title">关联知识点 (' + related.length + ')</div>';
      related.forEach(function(rn) {
        html += '<div class="kgd-related">' +
          '<span class="kgd-rel-label">' + (rn.edgeLabel || '关联') + '</span>' +
          '<span class="kgd-rel-node kgd-link" data-node="' + rn.node.id + '">' + rn.node.label + '</span>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    detailPanel.innerHTML = html;

    /* 绑定详情面板内链接点击 */
    detailPanel.querySelectorAll('[data-node]').forEach(function(el) {
      el.addEventListener('click', function() {
        var nid = el.getAttribute('data-node');
        selectNode(nid);
        if (graph && !graph.get('destroyed')) {
          graph.focusItem(nid, true, { easing: 'easeCubic', duration: 500 });
        }
      });
    });
  }

  /* ===== 搜索高亮 ===== */
  function highlightSearch(query) {
    if (!graph || graph.get('destroyed')) return;

    /* 清除之前的搜索状态（节点和边） */
    graph.getNodes().forEach(function(node) {
      graph.clearItemStates(node, ['search-match', 'search-dim', 'search-neighbor']);
    });
    graph.getEdges().forEach(function(edge) {
      graph.clearItemStates(edge, ['search-match', 'search-dim']);
    });

    updateSearchCount(0);

    if (!query) return;

    /* 收集匹配节点 */
    var matchIds = new Set();
    graph.getNodes().forEach(function(node) {
      var model = node.getModel();
      var isMatch = model.label.toLowerCase().indexOf(query) >= 0 ||
        (model.desc && model.desc.toLowerCase().indexOf(query) >= 0);
      if (isMatch) {
        matchIds.add(model.id);
      }
    });

    if (matchIds.size === 0) {
      /* 无匹配：全部暗化并提示 */
      graph.getNodes().forEach(function(node) {
        graph.setItemState(node, 'search-dim', true);
      });
      graph.getEdges().forEach(function(edge) {
        graph.setItemState(edge, 'search-dim', true);
      });
      updateSearchCount(0, true);
      return;
    }

    /* 找到匹配节点的邻居节点和关联边 */
    var neighborIds = new Set();
    var matchedEdges = new Set();

    graph.getEdges().forEach(function(edge) {
      var sourceNode = edge.get('source');
      var targetNode = edge.get('target');
      var sourceId = sourceNode.get('id');
      var targetId = targetNode.get('id');

      if (matchIds.has(sourceId) || matchIds.has(targetId)) {
        /* 至少一端匹配，高亮此边 */
        matchedEdges.add(edge);
        /* 非匹配端标记为邻居 */
        if (matchIds.has(sourceId) && !matchIds.has(targetId)) {
          neighborIds.add(targetId);
        } else if (matchIds.has(targetId) && !matchIds.has(sourceId)) {
          neighborIds.add(sourceId);
        }
      }
    });

    /* 应用节点状态 */
    graph.getNodes().forEach(function(node) {
      var id = node.get('id');
      if (matchIds.has(id)) {
        graph.setItemState(node, 'search-match', true);
      } else if (neighborIds.has(id)) {
        graph.setItemState(node, 'search-neighbor', true);
      } else {
        graph.setItemState(node, 'search-dim', true);
      }
    });

    /* 应用边状态 */
    graph.getEdges().forEach(function(edge) {
      if (matchedEdges.has(edge)) {
        graph.setItemState(edge, 'search-match', true);
      } else {
        graph.setItemState(edge, 'search-dim', true);
      }
    });

    /* 更新搜索结果计数 */
    updateSearchCount(matchIds.size);

    /* 匹配数较少时聚焦到第一个匹配项 */
    if (matchIds.size <= 8) {
      var firstMatch = matchIds.values().next().value;
      if (firstMatch) {
        graph.focusItem(firstMatch, true, { easing: 'easeCubic', duration: 500 });
      }
    }
  }

  /* ===== 搜索结果计数 ===== */
  function updateSearchCount(count, noMatch) {
    var counter = document.getElementById('kgSearchCount');
    if (!counter) return;
    if (noMatch) {
      counter.textContent = '未找到匹配';
      counter.className = 'kg-search-count kg-search-count-empty';
      counter.style.display = 'block';
    } else if (count > 0) {
      counter.textContent = '找到 ' + count + ' 个匹配节点';
      counter.className = 'kg-search-count';
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }
  }

  /* ===== 右键菜单 ===== */
  function showContextMenu(x, y, nodeId) {
    hideContextMenu();
    var node = graphData.nodes.find(function(n) { return n.id === nodeId; });
    if (!node) return;

    var connected = graphData.edges.filter(function(e) {
      return (e.from === nodeId || e.to === nodeId) && e.type === 'related';
    });

    var menuItems = [
      { icon: '🎯', label: '居中显示', action: function() {
        if (graph && !graph.get('destroyed')) {
          graph.focusItem(nodeId, true, { easing: 'easeCubic', duration: 500 });
        }
      }},
      { icon: '📋', label: '查看详情', action: function() { selectNode(nodeId); }}
    ];

    if (connected.length > 0) {
      menuItems.push({ icon: '🔗', label: '高亮关联 (' + connected.length + ')', action: function() {
        selectNode(nodeId);
      }});
    }

    menuItems.push({ icon: '⎘', label: '复制名称', action: function() {
      if (navigator.clipboard) navigator.clipboard.writeText(node.label);
    }});

    /* 检查节点是否已固定，显示对应的菜单项 */
    var g6Node = graph.findById(nodeId);
    var isPinned = g6Node && g6Node.getModel().fx !== null && g6Node.getModel().fx !== undefined;
    if (isPinned) {
      menuItems.push({ icon: '🔓', label: '释放节点', action: function() {
        unpinNode(nodeId);
      }});
    }

    /* 检查是否有任何固定节点，显示"释放全部" */
    var hasPinned = false;
    if (graph && !graph.get('destroyed')) {
      graph.getNodes().forEach(function(n) {
        var m = n.getModel();
        if (m.fx !== null && m.fx !== undefined) hasPinned = true;
      });
    }
    if (hasPinned) {
      menuItems.push({ icon: '🌀', label: '释放全部并重新布局', action: function() {
        unpinAllNodes();
      }});
    }

    contextMenu = document.createElement('div');
    contextMenu.className = 'kg-context-menu';
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';

    var title = document.createElement('div');
    title.className = 'kg-ctx-title';
    title.textContent = node.label;
    contextMenu.appendChild(title);

    menuItems.forEach(function(item) {
      var btn = document.createElement('div');
      btn.className = 'kg-ctx-item';
      btn.innerHTML = '<span class="kg-ctx-icon">' + item.icon + '</span><span>' + item.label + '</span>';
      btn.addEventListener('click', function() {
        item.action();
        hideContextMenu();
      });
      contextMenu.appendChild(btn);
    });

    document.body.appendChild(contextMenu);

    /* 防止菜单超出视口 */
    var rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      contextMenu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      contextMenu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
  }

  function hideContextMenu() {
    if (contextMenu) {
      contextMenu.remove();
      contextMenu = null;
    }
  }

  /* ===== 销毁 ===== */
  function destroyGraph() {
    stopManualPhysics();
    hideTooltip();
    hideContextMenu();
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    if (graph && !graph.get('destroyed')) {
      graph.destroy();
      graph = null;
    }
    isFullscreen = false;
    document.body.style.overflow = '';
  }

  /* ===== 公开方法 ===== */
  function centerNode(nodeId) {
    if (graph && !graph.get('destroyed')) {
      graph.focusItem(nodeId, true, { easing: 'easeCubic', duration: 500 });
    }
  }

  function toggleCollapse(nodeId) {
    if (!graph || graph.get('destroyed')) return;
    var node = graph.findById(nodeId);
    if (!node) return;
    var isVisible = node.get('visible');
    var descendants = getDescendants(nodeId);
    descendants.forEach(function(did) {
      var item = graph.findById(did);
      if (item) {
        if (isVisible) graph.hideItem(item);
        else graph.showItem(item);
      }
    });
  }

  function getDescendants(nodeId) {
    var children = graphData.edges
      .filter(function(e) { return e.from === nodeId && e.type === 'parent'; })
      .map(function(e) { return e.to; });
    var all = [];
    children.forEach(function(c) {
      all.push(c);
      all = all.concat(getDescendants(c));
    });
    return all;
  }

  return {
    render: render,
    centerNode: centerNode,
    toggleCollapse: toggleCollapse,
    destroy: destroyGraph
  };
})();
