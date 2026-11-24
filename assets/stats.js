/*
 * 确定性统计分析引擎 (浏览器版)
 * 与 Python engine/stats.py 算法一致, 所有计算在前端完成, 结果可复现。
 * 不依赖任何外部库。
 */
(function (global) {
  'use strict';

  const round = (x, d = 6) => (x == null || !isFinite(x)) ? null : Math.round(x * 10 ** d) / 10 ** d;
  const clean = arr => (arr || []).map(Number).filter(v => isFinite(v));
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const sampleSd = a => a.length < 2 ? 0 : Math.sqrt(a.reduce((s, v) => s + (v - mean(a)) ** 2, 0) / (a.length - 1));

  function descriptive(values, target) {
    const a = clean(values);
    if (!a.length) return { error: '无有效数据' };
    const m = mean(a), sd = sampleSd(a);
    const r = {
      method: '描述统计 (样本标准差 n-1)', n: a.length,
      mean: round(m), sd: round(sd), cv_pct: m !== 0 ? round(sd / m * 100) : null,
      min: round(Math.min(...a)), max: round(Math.max(...a)),
      median: round([...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]),
    };
    if (target != null) {
      r.target = round(target); r.bias = round(m - target);
      r.bias_pct = target !== 0 ? round((m - target) / target * 100) : null;
    }
    return r;
  }

  function precision(levels) {
    const out = { method: '精密度评价 (CLSI EP05/EP15)', levels: {} };
    const cvs = [];
    for (const [lvl, vals] of Object.entries(levels)) {
      const d = descriptive(vals);
      out.levels[lvl] = d;
      if (d.cv_pct != null) cvs.push(d.cv_pct);
    }
    out.overall = cvs.length ? {
      mean_cv_pct: round(mean(cvs)), max_cv_pct: round(Math.max(...cvs)),
    } : {};
    return out;
  }

  function linreg(xs, ys) {
    const n = Math.min(xs.length, ys.length);
    xs = xs.slice(0, n); ys = ys.slice(0, n);
    const mx = mean(xs), my = mean(ys);
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
    const slope = sxy / sxx, intercept = my - slope * mx;
    let ssRes = 0; for (let i = 0; i < n; i++) ssRes += (ys[i] - (slope * xs[i] + intercept)) ** 2;
    const r2 = syy ? 1 - ssRes / syy : null;
    return { slope: round(slope), intercept: round(intercept), r_squared: round(r2), n };
  }

  function linearity(x, y) {
    const xs = clean(Array.isArray(x) ? x : []), ys = clean(Array.isArray(y) ? y : []);
    if (xs.length < 3 || xs.length !== ys.length) return { error: '线性分析需要≥3个有效配对点' };
    return { method: '线性回归 (CLSI EP06)', n: xs.length, linear: linreg(xs, ys) };
  }

  function deming(x, y) {
    const xs = clean(x), ys = clean(y), n = Math.min(xs.length, ys.length);
    if (n < 3) return { error: '方法学比对至少需要3对数据' };
    const X = xs.slice(0, n), Y = ys.slice(0, n);
    const mx = mean(X), my = mean(Y);
    let sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sxx += (X[i] - mx) ** 2; syy += (Y[i] - my) ** 2; sxy += (X[i] - mx) * (Y[i] - my); }
    const lam = 1;
    const b = ((syy - lam * sxx) + Math.sqrt((syy - lam * sxx) ** 2 + 4 * lam * sxy ** 2)) / (2 * sxy);
    const a = my - b * mx;
    const diff = Y.map((v, i) => v - X[i]);
    const md = mean(diff), sdD = sampleSd(diff);
    const r = n > 1 ? (sxy / Math.sqrt(sxx * syy)) : null;
    return {
      method: '方法学比对 (CLSI EP09) - Deming 回归', n,
      result: { slope: round(b), intercept: round(a), error_ratio_lambda: lam },
      mean_bias: round(md), mean_bias_pct: mx ? round(md / mx * 100) : null,
      pearson_r: round(r),
      bland_altman: { mean_diff: round(md), sd_diff: round(sdD), loa_upper: round(md + 1.96 * sdD), loa_lower: round(md - 1.96 * sdD) },
    };
  }

  function trueness(values, target) {
    const a = clean(values);
    if (a.length < 2) return { error: '正确度评价至少需要2个重复' };
    const m = mean(a), sd = sampleSd(a), bias = m - target, n = a.length;
    // t 检验 p 值 (正态近似, 自由度 n-1)
    const t = sd > 0 ? Math.abs(bias) / (sd / Math.sqrt(n)) : null;
    return {
      method: '正确度评价 - 偏倚与 t 检验', n, mean: round(m), sd: round(sd), target: round(target),
      bias: round(bias), bias_pct: target ? round(bias / target * 100) : null,
      t_statistic: round(t), note: 'p 值请用精确 t 分布核算; 此处提供 t 统计量',
    };
  }

  function recovery(measured, expected) {
    const m = clean(measured), e = clean(expected), n = Math.min(m.length, e.length);
    if (!n) return { error: '无有效数据' };
    const rates = []; for (let i = 0; i < n; i++) rates.push(m[i] / e[i] * 100);
    return {
      method: '回收率分析', n, recovery_pct_each: rates.map(r => round(r)),
      mean_recovery_pct: round(mean(rates)),
      sd_recovery_pct: n > 1 ? round(sampleSd(rates)) : null,
    };
  }

  function lobLodLoq(blank, low, lowLevel, teGoal) {
    teGoal = teGoal || 0.2;
    const b = clean(blank), lo = clean(low);
    if (b.length < 3 || lo.length < 3) return { error: 'LoB/LoD/LoQ 需要空白与低浓度样本各≥3个数据' };
    const mb = mean(b), sdb = sampleSd(b), lob = mb + 1.645 * sdb;
    const ml = mean(lo), sdl = sampleSd(lo), lod = lob + 1.645 * sdl;
    const detectRate = lo.filter(v => v > lob).length / lo.length;
    const bias = Math.abs(ml - lowLevel), te = bias + 2 * sdl, tePct = lowLevel ? te / lowLevel : null;
    return {
      method: '检出能力评价 (CLSI EP17) - 参数法',
      blank_n: b.length, blank_mean: round(mb), blank_sd: round(sdb), LoB: round(lob),
      low_n: lo.length, low_mean: round(ml), low_sd: round(sdl), LoD: round(lod),
      detection_rate_at_low: round(detectRate), total_error_pct: round(tePct), te_goal: teGoal,
      LoQ_estimate: (tePct != null && tePct <= teGoal) ? round(lowLevel) : null,
      note: 'LoQ 需以多浓度水平试验精确建立; 此处为单低浓度样本的总误差估算',
    };
  }

  function interference(testVals, ctrlVals) {
    const t = clean(testVals), c = clean(ctrlVals);
    if (!t.length || !c.length) return { error: '无有效数据' };
    const mt = mean(t), mc = mean(c);
    return { method: '干扰评价 (CLSI EP07)', control_mean: round(mc), test_mean: round(mt),
      interference_pct: mc ? round((mt - mc) / mc * 100) : null, absolute_bias: round(mt - mc) };
  }

  // 接受标准判定
  const CRITERIA = {
    precision: { metric: 'cv_pct', op: '<=', limit: 10, label: '批内精密度 CV', unit: '%' },
    linearity: { metric: 'r_squared', op: '>=', limit: 0.99, label: '决定系数 R²' },
    trueness: { metric: 'abs_bias_pct', op: '<=', limit: 15, label: '正确度相对偏倚', unit: '%' },
    recovery: { metric: 'mean_recovery_pct', op: 'between', limit: [85, 115], label: '平均回收率', unit: '%' },
    lod: { metric: 'detection_rate_at_low', op: '>=', limit: 0.95, label: '低浓度检出率' },
    specificity: { metric: 'abs(interference_pct)', op: '<=', limit: 10, label: '干扰率绝对值', unit: '%' },
  };

  function getPath(obj, path) {
    if (path.startsWith('abs(') && path.endsWith(')')) {
      const v = getPath(obj, path.slice(4, -1)); return typeof v === 'number' ? Math.abs(v) : null;
    }
    return path.split('.').reduce((o, k) => (o == null ? null : o[k]), obj);
  }
  function compare(v, op, limit) {
    if (v == null || !isFinite(v)) return false;
    if (op === '<=') return v <= limit; if (op === '<') return v < limit;
    if (op === '>=') return v >= limit; if (op === '>') return v > limit;
    if (op === 'between') return v >= limit[0] && v <= limit[1]; return false;
  }
  function judge(itemKey, result) {
    const crit = CRITERIA[itemKey];
    if (!crit) return { item: itemKey, status: '未判定' };
    // 自动解包: 线性结果外层含 linear 字段时取内层
    if (itemKey === 'linearity' && result && result.linear) result = result.linear;
    // Deming 结果用 mean_bias_pct 生成 bias_pct
    if (itemKey === 'trueness' && result && result.bias_pct == null && result.mean_bias_pct != null) {
      result = Object.assign({}, result, { bias_pct: result.mean_bias_pct });
    }
    if (itemKey === 'precision' && result.levels) {
      const lv = Object.entries(result.levels).map(([name, d]) => ({ level: name, value: d.cv_pct, pass: compare(d.cv_pct, crit.op, crit.limit) }));
      const pass = lv.every(x => x.pass);
      return { item: itemKey, label: crit.label, status: pass ? '通过' : '不通过', overall_pass: pass, levels: lv, standard: `CV ${crit.op} ${crit.limit}${crit.unit || ''}` };
    }
    let v = getPath(result, crit.metric);
    if (crit.metric === 'abs_bias_pct' && result.bias_pct != null) v = Math.abs(result.bias_pct);
    const pass = compare(v, crit.op, crit.limit);
    return { item: itemKey, label: crit.label, status: pass ? '通过' : '不通过', overall_pass: pass,
      checks: [{ metric: crit.metric, value: v, op: crit.op, limit: crit.limit }],
      standard: `${crit.label} ${crit.op} ${Array.isArray(crit.limit) ? crit.limit.join('~') : crit.limit}${crit.unit || ''}` };
  }

  global.Stats = {
    round, mean, sampleSd, descriptive, precision, linearity, deming, trueness,
    recovery, lobLodLoq, interference, judge, CRITERIA,
  };
})(window);
