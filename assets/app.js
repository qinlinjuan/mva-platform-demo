/* 平台应用逻辑 */
(function () {
  'use strict';
  const D = window.PlatformData, S = window.Stats;
  let framework = 'ivdr';
  let currentProduct = D.PRODUCTS[1]; // 默认环孢霉素
  const calcResults = {}; // 存储各计算结果供判定/报告使用

  const $ = s => document.querySelector(s);
  const el = (tag, attrs, html) => {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v; else if (k.startsWith('on')) e[k] = v; else e.setAttribute(k, v);
    }
    if (html != null) e.innerHTML = html;
    return e;
  };
  const fmt = (v, d = 2) => (v == null || !isFinite(v)) ? '—' : Number(v).toFixed(d);
  const today = () => new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  function setFramework(fw) {
    framework = fw;
    document.querySelectorAll('.fw-btn').forEach(b => b.classList.toggle('active', b.dataset.fw === fw));
    render();
  }

  function nav(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const names = { dashboard: '驾驶舱', products: '产品档案', gaps: '差距识别', plans: '验证方案',
      calc: '统计计算器', verdict: '符合性判定', report: '报告生成', regulations: '法规依据' };
    $('#crumb').textContent = names[page];
    render(page);
  }

  function render(page) {
    page = page || (document.querySelector('.nav-item.active') || {}).dataset?.page || 'dashboard';
    const c = $('#content');
    c.innerHTML = '';
    const pages = { dashboard: pageDashboard, products: pageProducts, gaps: pageGaps, plans: pagePlans,
      calc: pageCalc, verdict: pageVerdict, report: pageReport, regulations: pageRegulations };
    (pages[page] || pageDashboard)(c);
  }

  // ============ 驾驶舱 ============
  function pageDashboard(c) {
    const fw = D.FRAMEWORKS[framework];
    const totalGaps = D.PRODUCTS.reduce((s, p) => s + D.gaps(p, framework).missing.length, 0);
    c.appendChild(el('div', { class: 'hero' },
      `<div class="eyebrow">${fw.region} · 4 款 TDM 产品 · 方法学验证</div>
       <h1>方法学验证与统计分析驾驶舱</h1>
       <p>面向他克莫司、环孢霉素、霉酚酸、雷帕霉素 4 款治疗药物监测（TDM）定量检测产品，按 <strong>${fw.short}</strong> 体系自动识别性能验证差距、生成验证方案、执行确定性统计分析并输出注册报告。所有数值由本地计算引擎完成，结果可复现、可审计。</p>`));

    const metrics = el('div', { class: 'grid g4', style: 'margin-bottom:20px' });
    [['4', '在管产品', 'c1'], [String(D.ITEMS.length), '性能指标', 'c2'],
     [String(totalGaps), '待补指标(合计)', 'c3'], [String(Object.keys(calcResults).length), '已完成分析', 'c4']]
      .forEach(([v, l, cls]) => metrics.appendChild(el('div', { class: `card metric ${cls}` },
        `<div class="v">${v}</div><div class="l">${l}</div>`)));
    c.appendChild(metrics);

    const row = el('div', { class: 'grid g2' });
    // 产品卡
    const pc = el('div', { class: 'card' }, `<div class="card-h">在管 TDM 产品 <span class="sub">点击查看差距</span></div>`);
    D.PRODUCTS.forEach(p => {
      const g = D.gaps(p, framework);
      const card = el('div', { class: 'prod-card', style: 'padding:12px 0;border-bottom:1px solid var(--line)' },
        `<div class="pn">${p.name}</div>
         <div class="pm">${p.method}</div>
         <div class="row"><span>线性范围</span><span>${p.range}</span></div>
         <div class="row"><span>校准品溯源</span><span>${p.trace}</span></div>
         <div style="margin-top:8px"><span class="badge warn">缺失 ${g.missing.length} 项</span> <span class="badge ok">已有 ${g.have.length} 项</span></div>`);
      card.onclick = () => { currentProduct = p; nav('gaps'); };
      pc.appendChild(card);
    });
    row.appendChild(pc);

    // 工作进度 + 快捷入口
    const right = el('div');
    const prog = el('div', { class: 'card', style: 'margin-bottom:16px' },
      `<div class="card-h">当前法规体系</div>
       <p style="font-size:13px;color:var(--ink-2)">${fw.name}</p>
       <p class="hint">报告模板：${fw.report}</p>
       <div style="margin-top:12px"><div class="hint" style="margin-bottom:6px">适用性能指标 ${D.ITEMS.length} 项</div>
       <div class="bar"><i style="width:100%"></i></div></div>
       <p class="hint" style="margin-top:12px">${fw.acceptance}</p>`);
    right.appendChild(prog);
    const quick = el('div', { class: 'card' }, `<div class="card-h">快捷入口</div>`);
    [['gap', '识别性能差距'], ['plan', '生成验证方案'], ['calc', '运行统计计算'], ['report', '生成注册报告']]
      .forEach(([p, label]) => {
        const b = el('button', { class: 'btn ghost sm', style: 'margin:0 6px 6px 0' }, label);
        b.onclick = () => nav(p === 'gap' ? 'gaps' : p === 'plan' ? 'plans' : p === 'calc' ? 'calc' : 'report');
        quick.appendChild(b);
      });
    right.appendChild(quick);
    row.appendChild(right);
    c.appendChild(row);
  }

  // ============ 产品档案 ============
  function pageProducts(c) {
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">PRODUCTS</div><h1>产品档案</h1>
      <p>4 款已上市 TDM 产品的基本信息与现有性能指标体系（数据源：仓库真实对比分析文档）。</p>`));
    D.PRODUCTS.forEach(p => {
      const g = D.gaps(p, framework);
      const card = el('div', { class: 'card', style: 'margin-bottom:14px' });
      card.appendChild(el('div', { class: 'card-h' }, `<span>${p.name}</span><span class="badge info">${p.id}</span>`));
      const rows = [['注册证号', p.cert], ['方法学', p.method], ['样本类型', p.sample],
        ['线性范围', p.range], ['校准品溯源', p.trace],
        ['现有指标', `${g.have.length} 项 / 适用 ${g.applicable.length} 项`]];
      const t = el('table');
      rows.forEach(([k, v]) => t.appendChild(el('tr', {}, `<td style="width:130px;color:var(--ink-3)">${k}</td><td><strong>${v}</strong></td>`)));
      card.appendChild(t);
      const b = el('button', { class: 'btn sm', style: 'margin-top:12px' }, '查看差距 →');
      b.onclick = () => { currentProduct = p; nav('gaps'); };
      card.appendChild(b);
      c.appendChild(card);
    });
  }

  // ============ 差距识别 ============
  function pageGaps(c) {
    const fw = D.FRAMEWORKS[framework];
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">GAP ANALYSIS</div><h1>性能指标差距识别</h1>
      <p>对照 <strong>${fw.short}</strong> 现行要求，自动识别产品现有指标体系中缺失的性能指标。</p>`));
    const sel = el('div', { class: 'card', style: 'margin-bottom:16px' });
    sel.appendChild(el('div', { class: 'card-h' }, '选择产品'));
    const select = el('select', { style: 'max-width:360px' });
    D.PRODUCTS.forEach(p => {
      const o = el('option', { value: p.id }, p.name);
      if (p.id === currentProduct.id) o.selected = true;
      select.appendChild(o);
    });
    select.onchange = e => { currentProduct = D.PRODUCTS.find(p => p.id === e.target.value); render('gaps'); };
    sel.appendChild(select);
    c.appendChild(sel);

    const g = D.gaps(currentProduct, framework);
    const m = el('div', { class: 'grid g3', style: 'margin-bottom:16px' });
    [['适用指标', g.applicable.length, 'c1'], ['已有', g.have.length, 'c3'], ['缺失/需新增', g.missing.length, 'c4']]
      .forEach(([l, v, cls]) => m.appendChild(el('div', { class: `card metric ${cls}` }, `<div class="v">${v}</div><div class="l">${l}</div>`)));
    c.appendChild(m);

    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, `指标对照 — ${currentProduct.name}`));
    card.appendChild(el('div', { class: 'pill-list', style: 'margin-bottom:16px' },
      g.applicable.map(i => `<span class="pill ${i.key && g.have.includes(i) ? 'have' : 'miss'}">${g.have.includes(i) ? '✓' : '○'} ${i.zh}</span>`).join('')));
    const t = el('table');
    t.appendChild(el('tr', {}, '<th>性能指标</th><th>类别</th><th>统计方法</th><th>状态</th><th>法规依据</th>'));
    g.applicable.forEach(i => {
      const has = g.have.includes(i);
      t.appendChild(el('tr', {},
        `<td><strong>${i.zh}</strong></td><td>${D.CAT_LABELS[i.cat]}</td><td>${i.method}</td>
         <td><span class="badge ${has ? 'ok' : 'warn'}">${has ? '已有' : '缺失'}</span></td>
         <td style="font-size:11px">${framework === 'ivdr' ? i.ivdr : i.nmpa}</td>`));
    });
    card.appendChild(t);
    c.appendChild(card);
    const b = el('button', { class: 'btn', style: 'margin-top:16px' }, `生成 ${g.missing.length} 项验证方案 →`);
    b.onclick = () => nav('plans');
    c.appendChild(b);
  }

  // ============ 验证方案 ============
  function pagePlans(c) {
    const fw = D.FRAMEWORKS[framework];
    const g = D.gaps(currentProduct, framework);
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">VALIDATION PLANS</div><h1>性能验证方案</h1>
      <p>针对 <strong>${currentProduct.name}</strong> 的 ${g.missing.length} 项缺失指标，自动生成实验设计、接受标准与法规依据（基于 CLSI EP 系列与 ${fw.short}）。</p>`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, `验证方案清单 <span class="sub">${g.missing.length} 项</span>`));
    const t = el('table');
    t.appendChild(el('tr', {}, '<th>指标</th><th>实验设计</th><th>接受标准</th><th>方法依据</th>'));
    g.missing.forEach(i => {
      const p = D.PLANS[i.key] || { design: '按指导原则设计研究', accept: i.method === '—' ? '符合技术要求/指导原则' : '按 CLSI/指导原则设定', ref: (framework === 'ivdr' ? i.ivdr : i.nmpa) };
      t.appendChild(el('tr', {},
        `<td><strong>${i.zh}</strong></td><td style="font-size:11.5px">${p.design}</td>
         <td style="font-size:11.5px">${p.accept}</td><td><span class="badge purple">${p.ref}</span></td>`));
    });
    card.appendChild(t);
    c.appendChild(card);
    const row = el('div', { class: 'btn-row' });
    const b1 = el('button', { class: 'btn ghost' }, '复制方案清单');
    b1.onclick = () => {
      const txt = g.missing.map((i, n) => `${n + 1}. ${i.zh}\n   设计: ${(D.PLANS[i.key] || {}).design || '按指导原则'}\n   接受标准: ${(D.PLANS[i.key] || {}).accept || '—'}`).join('\n');
      navigator.clipboard?.writeText(txt).then(() => alert('方案清单已复制')).catch(() => alert('复制失败，请手动选择'));
    };
    row.appendChild(b1);
    const b2 = el('button', { class: 'btn' }, '生成报告 →');
    b2.onclick = () => nav('report');
    row.appendChild(b2);
    c.appendChild(row);
  }

  // ============ 统计计算器 ============
  function pageCalc(c) {
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">CALCULATORS</div><h1>统计计算器</h1>
      <p>输入原始数据，本地引擎确定性计算。每个计算器独立于 AI，结果可复现。支持粘贴 Excel 数据列（空格/逗号/换行分隔）。</p>`));
    const tabs = el('div', { class: 'tabs' });
    const calcs = [['precision', '精密度 CV'], ['linearity', '线性拟合'], ['deming', '方法学比对'],
      ['recovery', '回收率'], ['lod', 'LoB/LoD/LoQ'], ['trueness', '正确度'], ['interference', '干扰率']];
    const panes = {};
    calcs.forEach(([k, label], idx) => {
      const tab = el('div', { class: 'tab' + (idx === 0 ? ' active' : '') }, label);
      tab.onclick = () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        Object.values(panes).forEach(p => p.classList.remove('active'));
        tab.classList.add('active'); panes[k].classList.add('active');
      };
      tabs.appendChild(tab);
    });
    c.appendChild(tabs);
    calcs.forEach(([k, label]) => {
      const pane = el('div', { class: 'pane' + (k === 'precision' ? ' active' : '') });
      panes[k] = pane;
      c.appendChild(pane);
    });
    buildPrecisionCalc(panes.precision);
    buildLinearityCalc(panes.linearity);
    buildDemingCalc(panes.deming);
    buildSimpleCalc(panes.recovery, 'recovery', '回收率', '实测值', '期望值', '每行一对：实测值,期望值',
      ta => { const pairs = ta.split(/\n/).map(l => l.split(/[,，\s]+/).map(Number)).filter(p => p.length >= 2 && p.every(isFinite)); return S.recovery(pairs.map(p=>p[0]), pairs.map(p=>p[1])); });
    buildLodCalc(panes.lod);
    buildTruenessCalc(panes.trueness);
    buildSimpleCalc(panes.interference, 'interference', '干扰率', '干扰样本', '对照组', '每行一组：干扰值（第一行）与控制值（第二行），空格分隔',
      ta => { const nums = ta.split(/[\s,，\n]+/).map(Number).filter(isFinite); const half = Math.floor(nums.length/2); return S.interference(nums.slice(0,half), nums.slice(half)); });
  }

  function makeInput(label, placeholder, rows) {
    const f = el('div', { class: 'field' }, `<label>${label}</label>`);
    const ta = el('textarea', { placeholder });
    if (rows) ta.rows = rows;
    f.appendChild(ta); return { wrap: f, ta };
  }
  function showResult(pane, data, verdictFn) {
    let box = pane.querySelector('.result-box');
    if (!box) { box = el('div', { class: 'result-box' }); pane.appendChild(box); }
    box.innerHTML = '';
    box.appendChild(el('h4', {}, '计算结果'));
    const kv = el('div', { class: 'kv' });
    const flat = flatten(data);
    Object.entries(flat).forEach(([k, v]) => kv.appendChild(el('div', { class: 'i' }, `<div class="k">${k}</div><div class="v">${typeof v === 'number' ? fmt(v, 4) : v}</div>`)));
    box.appendChild(kv);
    if (verdictFn) {
      const vd = verdictFn(data);
      const v = el('div', { style: 'margin-top:12px' },
        `<span class="verdict ${vd.overall_pass ? 'pass' : 'fail'}">${vd.overall_pass ? '✓' : '✕'} ${vd.status}</span>
         <span class="hint" style="margin-left:8px">${vd.standard || ''}</span>`);
      box.appendChild(v);
    }
  }
  function flatten(obj, prefix, out) {
    out = out || {}; prefix = prefix || '';
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
      else if (k !== 'method' && k !== 'note' && !Array.isArray(v)) out[prefix ? `${prefix}.${k}` : k] = v;
    }
    return out;
  }
  function store(key, data) { calcResults[key] = data; updateBadge(); }
  function updateBadge() { const b = document.querySelector('.metric.c4 .v'); if (b) b.textContent = Object.keys(calcResults).length; }

  function buildPrecisionCalc(pane) {
    const inp = makeInput('精密度原始数据 — 每行一个浓度水平，数值以空格/逗号分隔（每行为同一水平的重复测量）',
      '低值: 10.1 10.3 9.9 10.2 10.0\n中值: 20.1 20.4 19.8 20.2 20.0\n高值: 50.2 49.8 50.5 50.1 49.9', 6);
    pane.appendChild(inp.wrap);
    const btn = el('button', { class: 'btn' }, '计算精密度');
    btn.onclick = () => {
      const levels = {};
      inp.ta.value.split('\n').forEach((line, idx) => {
        const parts = line.split(/[:,，\s]+/).filter(Boolean);
        const nums = parts.filter(p => isFinite(Number(p))).map(Number);
        const name = parts.find(p => !isFinite(Number(p))) || `水平${idx + 1}`;
        if (nums.length >= 2) levels[name] = nums;
      });
      if (!Object.keys(levels).length) { alert('请至少输入一个浓度水平的重复数据'); return; }
      const r = S.precision(levels); store('precision', r);
      showResult(pane, r, d => S.judge('precision', d));
    };
    pane.appendChild(btn);
    pane.appendChild(el('div', { class: 'hint' }, '判定标准：批内精密度 CV ≤ 10%（霉酚酸技术要求为批内 CV ≤ 5%）。'));
  }

  function buildLinearityCalc(pane) {
    const a = makeInput('浓度水平 X（空格/逗号/换行分隔）', '1 2 4 8 16', 3);
    const b = makeInput('实测浓度 Y（与 X 一一对应）', '1.05 2.02 3.98 8.1 15.9', 3);
    pane.appendChild(a.wrap); pane.appendChild(b.wrap);
    const btn = el('button', { class: 'btn' }, '计算线性');
    btn.onclick = () => {
      const xs = a.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      const ys = b.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      if (xs.length < 3 || xs.length !== ys.length) { alert('X/Y 需各≥3个且数量一致'); return; }
      const r = S.linearity(xs, ys); store('linearity', r);
      showResult(pane, r, d => S.judge('linearity', d.linear || d));
    };
    pane.appendChild(btn);
    pane.appendChild(el('div', { class: 'hint' }, '判定标准：决定系数 R² ≥ 0.99。正式研究建议 7~11 个浓度点并做失拟检验。'));
  }

  function buildDemingCalc(pane) {
    const a = makeInput('比对方法 X（参考方法）', '1.0 2.0 4.0 8.0 16.0', 3);
    const b = makeInput('待评方法 Y', '1.05 1.98 4.1 7.9 16.2', 3);
    pane.appendChild(a.wrap); pane.appendChild(b.wrap);
    const btn = el('button', { class: 'btn' }, '计算 Deming 回归');
    btn.onclick = () => {
      const xs = a.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      const ys = b.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      if (xs.length < 3 || xs.length !== ys.length) { alert('X/Y 需各≥3个且数量一致'); return; }
      const r = S.deming(xs, ys); store('deming', r);
      showResult(pane, r, d => S.judge('trueness', { bias_pct: d.mean_bias_pct }));
    };
    pane.appendChild(btn);
    pane.appendChild(el('div', { class: 'hint' }, 'Deming 回归（误差比 λ=1）+ Bland-Altman 一致性界限；判定：相对偏倚 |bias| ≤ 15%。'));
  }

  function buildSimpleCalc(pane, key, title, la, lb, ph, fn) {
    const inp = makeInput(`${title} — ${ph}`, ph === '每行一对：实测值,期望值' ? '10.2,10.0\n20.5,20.0\n30.1,30.0' : '', 6);
    pane.appendChild(inp.wrap);
    const btn = el('button', { class: 'btn' }, `计算${title}`);
    btn.onclick = () => {
      const r = fn(inp.ta.value);
      if (r.error) { alert(r.error); return; }
      store(key, r);
      showResult(pane, r, key === 'recovery' ? d => S.judge('recovery', d) : key === 'interference' ? d => S.judge('specificity', d) : null);
    };
    pane.appendChild(btn);
  }

  function buildLodCalc(pane) {
    const a = makeInput('空白样本重复测量值', '0.10 0.15 0.12 0.18 0.14 0.16 0.11 0.13', 3);
    const b = makeInput('低浓度样本重复测量值', '1.05 1.12 0.98 1.20 1.08 1.15', 3);
    const c = makeInput('低浓度样本标称浓度', '1.0', 1);
    pane.appendChild(a.wrap); pane.appendChild(b.wrap); pane.appendChild(c.wrap);
    const btn = el('button', { class: 'btn' }, '计算 LoB/LoD/LoQ');
    btn.onclick = () => {
      const blank = a.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      const low = b.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      const lvl = Number(c.ta.value) || 1;
      const r = S.lobLodLoq(blank, low, lvl, 0.2);
      if (r.error) { alert(r.error); return; }
      store('lod', r); showResult(pane, r, d => S.judge('lod', d));
    };
    pane.appendChild(btn);
    pane.appendChild(el('div', { class: 'hint' }, 'CLSI EP17 参数法：LoB = 空白均值 + 1.645×SD；LoD = LoB + 1.645×SD(低浓度)。'));
  }

  function buildTruenessCalc(pane) {
    const a = makeInput('重复测量值', '10.1 10.3 9.9 10.2 10.0', 3);
    const b = makeInput('目标值/参考值', '10.0', 1);
    pane.appendChild(a.wrap); pane.appendChild(b.wrap);
    const btn = el('button', { class: 'btn' }, '计算正确度');
    btn.onclick = () => {
      const vals = a.ta.value.split(/[\s,，\n]+/).map(Number).filter(isFinite);
      const target = Number(b.ta.value);
      const r = S.trueness(vals, target);
      if (r.error) { alert(r.error); return; }
      store('trueness', r); showResult(pane, r, d => S.judge('trueness', d));
    };
    pane.appendChild(btn);
    pane.appendChild(el('div', { class: 'hint' }, '正确度：偏倚 + t 统计量；判定标准：相对偏倚 |bias| ≤ 15%。'));
  }

  // ============ 符合性判定 ============
  function pageVerdict(c) {
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">COMPLIANCE</div><h1>接受标准符合性判定</h1>
      <p>对已完成的统计计算按预设接受标准自动判定 Pass/Fail。判定规则确定、可追溯，直接服务于注册报告结论。</p>`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, `判定汇总 <span class="sub">${Object.keys(calcResults).length} 项分析</span>`));
    const map = { precision: 'precision', linearity: 'linearity', deming: 'trueness', recovery: 'recovery', lod: 'lod', interference: 'specificity', trueness: 'trueness' };
    const verdicts = [];
    Object.entries(calcResults).forEach(([key, data]) => {
      let res = data;
      if (key === 'linearity') res = data.linear || data;
      if (key === 'deming') res = { ...data, bias_pct: data.mean_bias_pct };
      const vd = S.judge(map[key] || key, res);
      verdicts.push(vd);
    });
    if (!verdicts.length) {
      card.appendChild(el('div', { class: 'hint', style: 'padding:30px;text-align:center' }, '尚无计算数据。请先在「统计计算器」中运行至少一项分析。'));
    } else {
      const t = el('table');
      t.appendChild(el('tr', {}, '<th>性能指标</th><th>接受标准</th><th>实测</th><th>判定</th>'));
      verdicts.forEach(v => {
        const measured = v.levels ? v.levels.map(x => `${x.level}:${fmt(x.value)}%`).join('，') :
          (v.checks?.[0]?.value != null ? fmt(v.checks[0].value, 4) : '—');
        t.appendChild(el('tr', {},
          `<td><strong>${v.label || v.item}</strong></td><td>${v.standard || '—'}</td><td>${measured}</td>
           <td><span class="verdict ${v.overall_pass ? 'pass' : 'fail'}">${v.overall_pass ? '✓ 通过' : '✕ 不通过'}</span></td>`));
      });
      card.appendChild(t);
      const pass = verdicts.filter(v => v.overall_pass).length;
      card.appendChild(el('p', { class: 'hint', style: 'margin-top:12px' }, `汇总：${pass}/${verdicts.length} 项符合接受标准。`));
    }
    c.appendChild(card);
    const b = el('button', { class: 'btn', style: 'margin-top:16px' }, '生成含判定的报告 →');
    b.onclick = () => nav('report'); c.appendChild(b);
  }

  // ============ 报告生成 ============
  function pageReport(c) {
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">REPORT</div><h1>注册报告生成</h1>
      <p>基于产品信息、差距识别、验证方案与统计结果，生成可提交注册的 ${D.FRAMEWORKS[framework].report} 结构报告。</p>`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, '报告配置'));
    const grid = el('div', { class: 'grid g3' });
    const pf = el('div', { class: 'field' }, '<label>产品</label>');
    const psel = el('select'); D.PRODUCTS.forEach(p => { const o = el('option', { value: p.id }, p.name); if (p.id === currentProduct.id) o.selected = true; psel.appendChild(o); });
    psel.onchange = e => currentProduct = D.PRODUCTS.find(p => p.id === e.target.value);
    pf.appendChild(psel); grid.appendChild(pf);
    const ff = el('div', { class: 'field' }, '<label>法规体系</label>');
    const fsel = el('select'); Object.values(D.FRAMEWORKS).forEach(fw => { const o = el('option', { value: fw.key }, fw.short); if (fw.key === framework) o.selected = true; fsel.appendChild(o); });
    fsel.onchange = e => setFramework(e.target.value);
    ff.appendChild(fsel); grid.appendChild(ff);
    const tf = el('div', { class: 'field' }, '<label>报告标题</label>');
    const tin = el('input', { type: 'text', value: `${currentProduct.name} 分析性能验证报告` });
    tf.appendChild(tin); grid.appendChild(tf);
    card.appendChild(grid);
    const b = el('button', { class: 'btn' }, '预览报告');
    card.appendChild(b);
    c.appendChild(card);

    const preview = el('div', { class: 'report-preview', style: 'margin-top:16px;display:none' });
    c.appendChild(preview);
    b.onclick = () => {
      preview.style.display = 'block';
      preview.innerHTML = buildReportHTML(tin.value, currentProduct, framework);
      preview.scrollIntoView({ behavior: 'smooth' });
    };
    const row = el('div', { class: 'btn-row' });
    const bp = el('button', { class: 'btn ghost' }, '打印 / 另存为 PDF');
    bp.onclick = () => window.print();
    row.appendChild(bp);
    const bw = el('button', { class: 'btn ghost' }, '下载 HTML 报告');
    bw.onclick = () => {
      const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>报告</title></head><body>${buildReportHTML(tin.value, currentProduct, framework)}</body></html>`], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${currentProduct.name}_分析性能报告.html`; a.click();
    };
    row.appendChild(bw);
    c.appendChild(row);
  }

  function buildReportHTML(title, product, fwKey) {
    const fw = D.FRAMEWORKS[fwKey], g = D.gaps(product, fwKey);
    let h = `<h2>${title}</h2><div class="meta">法规体系：${fw.name} · 报告模板：${fw.report}<br>编制日期：${today()} · 工具：方法学验证与统计分析 Agent</div>`;
    h += `<h3>一、产品基本信息</h3><table><tr><td>产品名称</td><td>${product.name}</td></tr>
      <tr><td>方法学</td><td>${product.method}</td></tr><tr><td>样本类型</td><td>${product.sample}</td></tr>
      <tr><td>线性范围</td><td>${product.range}</td></tr><tr><td>校准品溯源</td><td>${product.trace}</td></tr></table>`;
    h += `<h3>二、法规依据与指导原则</h3><table><tr><th>编号</th><th>文件名称</th><th>发布机构</th></tr>` +
      fw.refs.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') + `</table>`;
    h += `<h3>三、性能指标差距识别</h3><p>适用 ${g.applicable.length} 项，已有 ${g.have.length} 项，缺失/需新增 <strong>${g.missing.length}</strong> 项。</p>
      <p>缺失项：${g.missing.map(i => i.zh).join('、') || '无'}</p>`;
    h += `<h3>四、性能验证方案</h3><table><tr><th>序号</th><th>性能指标</th><th>实验设计</th><th>接受标准</th></tr>` +
      g.missing.map((i, n) => `<tr><td>${n+1}</td><td>${i.zh}</td><td>${(D.PLANS[i.key]||{}).design||'按指导原则设计'}</td><td>${(D.PLANS[i.key]||{}).accept||'—'}</td></tr>`).join('') + `</table>`;
    if (Object.keys(calcResults).length) {
      h += `<h3>五、统计分析结果</h3>`;
      const map = { precision:'precision', linearity:'linearity', deming:'trueness', recovery:'recovery', lod:'lod', interference:'specificity', trueness:'trueness' };
      Object.entries(calcResults).forEach(([key, data]) => {
        const res = key === 'linearity' ? (data.linear||data) : data;
        const vd = S.judge(map[key]||key, res);
        h += `<p><strong>${key}</strong>：${data.method||''} · <span class="verdict ${vd.overall_pass?'pass':'fail'}">${vd.status}</span></p>`;
      });
    }
    h += `<h3>六、结论与建议</h3><p>本报告基于所提供数据与现行法规/指导原则完成分析性能评估。各项指标的符合性需结合预先设定的接受标准、产品预期用途及临床决策点综合判定。对识别出的缺失指标，建议按第四部分方案开展研究并补充申报资料。</p>`;
    h += `<p style="font-size:11px;color:#8a9099;margin-top:20px;border-top:1px solid #e6e8ec;padding-top:10px">声明：本报告仅供研发与申报准备参考，不构成注册申报的正式结论。正式申报前须以 NMPA/CMDE 或欧盟官方最新有效版本为准逐条核对。霉酚酸技术审评要点目前仍为征求意见稿。</p>`;
    return h;
  }

  // ============ 法规依据 ============
  function pageRegulations(c) {
    const fw = D.FRAMEWORKS[framework];
    c.appendChild(el('div', { class: 'hero' }, `<div class="eyebrow">REGULATIONS</div><h1>法规依据与指导原则</h1>
      <p>${fw.name} — 共 ${fw.refs.length} 条核心依据，${fw.sections.length} 个报告章节。</p>`));
    const card = el('div', { class: 'card' });
    card.appendChild(el('div', { class: 'card-h' }, '核心法规/指导原则'));
    const t = el('table'); t.appendChild(el('tr', {}, '<th>编号</th><th>文件名称</th><th>发布机构</th>'));
    fw.refs.forEach(r => t.appendChild(el('tr', {}, `<td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td>`)));
    card.appendChild(t); c.appendChild(card);
    const card2 = el('div', { class: 'card', style: 'margin-top:16px' });
    card2.appendChild(el('div', { class: 'card-h' }, '报告章节结构'));
    card2.appendChild(el('div', {}, fw.sections.map((s, i) => `<div style="padding:6px 0;border-bottom:1px dashed var(--line);font-size:13px">${i+1}. ${s}</div>`).join('')));
    c.appendChild(card2);
    c.appendChild(el('div', { class: 'hint', style: 'margin-top:14px' },
      '注：法规文本为公开结构化摘要，正式申报前须核对官方发布的最新有效版本。'));
  }

  // ============ 初始化 ============
  function init() {
    $('#topDate').textContent = today();
    $('#disclaimer').textContent = '声明：本平台输出的方案与报告基于公开法规/指导原则结构化摘要，仅供研发与申报准备参考，不构成注册申报的正式结论。正式申报前须以官方最新有效版本为准逐条核对。';
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => nav(n.dataset.page));
    document.querySelectorAll('.fw-btn').forEach(b => b.onclick = () => setFramework(b.dataset.fw));
    render('dashboard');
  }
  init();
})();
