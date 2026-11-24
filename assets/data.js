/*
 * 平台数据层 — 性能指标知识库 / 双法规框架 / 产品样例
 * 与 Python knowledge/ 保持一致的结构化数据。
 */
(function (global) {
  'use strict';

  const FRAMEWORKS = {
    ivdr: {
      key: 'ivdr', name: 'IVDR 欧盟体外诊断医疗器械法规', short: 'IVDR (EU)', region: '欧盟',
      report: '分析性能报告 (APR)',
      refs: [
        ['EU 2017/746 Annex I §9.1(a)', '通用安全与性能要求 - 分析性能特性', 'EU'],
        ['EU 2017/746 Annex I §9.1(b)', '通用安全与性能要求 - 临床性能特性', 'EU'],
        ['EU 2017/746 Annex I §9.3', '校准品/质控品量值计量溯源', 'EU'],
        ['EU 2017/746 Annex XIII Part A', '性能评价 - 科学/分析/临床性能', 'EU'],
        ['CLSI EP05', '精密度评价', 'CLSI'], ['CLSI EP06', '线性评价', 'CLSI'],
        ['CLSI EP07', '干扰评价', 'CLSI'], ['CLSI EP09', '方法学比对与偏倚', 'CLSI'],
        ['CLSI EP15', '用户精密度与正确度验证', 'CLSI'], ['CLSI EP17', '检出限与定量限', 'CLSI'],
        ['MDCG 2022-9', '安全与性能摘要 (SSP)', 'MDCG'],
      ],
      sections: ['器械识别与预期用途', '分析性能评价概述', '分析灵敏度 LoB/LoD/LoQ', '分析特异性与干扰',
        '正确度', '精密度', '测量区间与线性', '高剂量钩状效应', '样本稳定性', '计量溯源', '结论与论证'],
      acceptance: '预先定义接受标准并关联预期用途与临床决策点; 不适用的特性需给出正当理由',
    },
    nmpa: {
      key: 'nmpa', name: 'NMPA 中国体外诊断试剂注册', short: 'NMPA (中国)', region: '中国',
      report: '分析性能评估 / 变更注册资料',
      refs: [
        ['B1', '环孢霉素和他克莫司检测试剂注册审查指导原则', 'CMDE 2022年第35号附件15'],
        ['B2', '定量检测体外诊断试剂分析性能评估注册审查指导原则', 'CMDE 2022年第32号'],
        ['B3', '体外诊断试剂注册申报资料要求和批准证明文件格式', 'NMPA 2021年第122号公告'],
        ['B4', '霉酚酸测定试剂技术审评要点(征求意见稿)', 'CMDE 2026征求意见'],
        ['B5', 'YY/T 1255-2015 免疫比浊法检测试剂(透射法)', '行业标准'],
        ['B6', 'GB/T 42062 医疗器械 风险管理', '国标'],
        ['B7', 'GB/T 21415 / YY/T 1709 / WS/T 356', '溯源/不确定度/互换性'],
      ],
      sections: ['产品基本信息与变更说明', '性能指标差距识别', '性能验证方案设计', '分析性能研究结果',
        '样本稳定性与适用样本类型', '校准品溯源与质控品赋值', '准确度/正确度', '精密度',
        '空白限/检出限/定量限', '分析特异性', '高剂量钩状效应', '测量区间/可报告区间',
        '风险评估 (GB/T 42062)', '结论与变更注册建议'],
      acceptance: '对照指导原则逐项列出接受标准; 定量指标给出具体限值',
    },
  };

  // 性能指标知识库 (23项)
  const ITEMS = [
    { key: 'appearance', zh: '外观', cat: 'basic', method: '—', ivdr: 'Annex I 9.1', nmpa: 'B1 §3.2.1' },
    { key: 'filling_volume', zh: '装量/净含量', cat: 'basic', method: '—', ivdr: 'Annex I 9.1', nmpa: 'B1 §3.2.1' },
    { key: 'reagent_blank', zh: '试剂空白', cat: 'basic', method: 'descriptive', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §3.2.1' },
    { key: 'lob', zh: '空白限 (LoB)', cat: 'analytical', method: 'EP17', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.9' },
    { key: 'lod', zh: '检出限 (LoD)', cat: 'analytical', method: 'EP17', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.9' },
    { key: 'loq', zh: '定量限 (LoQ)', cat: 'analytical', method: 'EP17', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.9' },
    { key: 'trueness', zh: '正确度/准确度', cat: 'analytical', method: 'EP09/EP15', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.4' },
    { key: 'recovery', zh: '回收率', cat: 'analytical', method: 'EP15', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.4' },
    { key: 'precision', zh: '精密度', cat: 'analytical', method: 'EP05/EP15', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.5' },
    { key: 'linearity', zh: '线性区间', cat: 'analytical', method: 'EP06', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.8' },
    { key: 'reportable_range', zh: '可报告区间/稀释验证', cat: 'analytical', method: '—', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.8' },
    { key: 'specificity', zh: '分析特异性/干扰', cat: 'analytical', method: 'EP07', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.6' },
    { key: 'cross_reactivity', zh: '交叉反应', cat: 'analytical', method: 'EP07', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.6' },
    { key: 'hook_effect', zh: '高剂量钩状效应', cat: 'analytical', method: '—', ivdr: 'Annex XIII', nmpa: 'B1 §4.2.7' },
    { key: 'sample_stability', zh: '样本稳定性', cat: 'analytical', method: 'EP05', ivdr: 'Annex XIII', nmpa: 'B1 §4.2.1' },
    { key: 'sample_type', zh: '适用样本类型比对', cat: 'analytical', method: 'EP09', ivdr: 'Annex I 9.1(a)', nmpa: 'B1 §4.2.2' },
    { key: 'traceability', zh: '校准品量值溯源', cat: 'metrological', method: '—', ivdr: 'Annex I 9.3', nmpa: 'B4 §4.2' },
    { key: 'calibrator_value', zh: '校准品赋值及不确定度', cat: 'metrological', method: '—', ivdr: 'Annex I 9.3', nmpa: 'B1 §3.2.1' },
    { key: 'calibrator_homogeneity', zh: '校准品均匀性', cat: 'metrological', method: '方差分析', ivdr: 'Annex I 9.3', nmpa: 'B1 §3.2.1' },
    { key: 'qc_performance', zh: '质控品性能指标', cat: 'metrological', method: '—', ivdr: 'Annex I 9.1', nmpa: 'B1 §3.2.1' },
    { key: 'clinical_performance', zh: '临床性能', cat: 'clinical', method: 'ROC/灵敏度', ivdr: 'Annex I 9.1(b)', nmpa: 'B2' },
    { key: 'risk_management', zh: '风险管理', cat: 'doc', method: '—', ivdr: 'ISO 14971', nmpa: 'B6 / GB/T 42062' },
    { key: 'therapeutic_range_warning', zh: '治疗范围警告性解释', cat: 'doc', method: '—', ivdr: 'Annex I 信息', nmpa: 'B1 §6' },
  ];

  const CAT_LABELS = { basic: '基础/通用', analytical: '分析性能', metrological: '计量溯源', clinical: '临床性能', doc: '文档/风险' };

  // 4款 TDM 产品样例（公开演示版：注册证号/溯源细节已脱敏为占位符）
  const PRODUCTS = [
    { id: 'tacrolimus', name: '他克莫司测定试剂盒（示例）', method: '乳胶增强免疫抑制法(透射比浊,竞争法)', sample: 'EDTA抗凝全血',
      cert: '注册证号-示例01', range: '1.0~30.0 ng/mL', trace: '企业标准品（示例）',
      existing: ['appearance','filling_volume','reagent_blank','lob','linearity','trueness','precision','traceability'] },
    { id: 'cyclosporine', name: '环孢霉素测定试剂盒（示例）', method: '乳胶增强免疫抑制法(透射比浊,竞争法)', sample: 'EDTA抗凝全血',
      cert: '注册证号-示例02', range: '30~1000 ng/mL', trace: '国家标准品（示例）',
      existing: ['appearance','filling_volume','reagent_blank','lob','linearity','trueness','precision','traceability'] },
    { id: 'mpa', name: '霉酚酸检测试剂盒（示例）', method: 'IMPDHⅡ酶法', sample: '非溶血血清/血浆',
      cert: '注册证号-示例03', range: '0.40~15.00 μg/mL', trace: '参考测定系统（示例）',
      existing: ['appearance','filling_volume','linearity','trueness','precision','traceability'] },
    { id: 'sirolimus', name: '雷帕霉素测定试剂盒（示例）', method: '乳胶增强免疫抑制法(透射比浊,竞争法)', sample: 'EDTA抗凝全血',
      cert: '注册证号-示例04', range: '2~30 ng/mL', trace: '企业标准品（示例）',
      existing: ['appearance','filling_volume','reagent_blank','lob','linearity','trueness','precision','traceability'] },
  ];

  // 方案设计参数 (用于生成验证方案)
  const PLANS = {
    precision: { design: '3浓度水平(治疗不佳/治疗范围内/近毒性上限)×2重复×2批/天×5天', accept: 'CV ≤ 10% (霉酚酸批内 ≤5%)', ref: 'EP05/EP15' },
    linearity: { design: '7~11个浓度点, 覆盖声称区间宽20~30%, 每浓度2~4次', accept: '多项式回归, R²≥0.99, 失拟检验P>0.05', ref: 'EP06' },
    trueness: { design: '参考物质检测(≥2水平×3~5重复) 或 患者样本方法学比对', accept: '相对偏倚 ≤±15%', ref: 'EP09/EP15' },
    recovery: { design: '≥3浓度水平×3重复, 加标体积≤10%', accept: '回收率 85%~115%', ref: 'EP15' },
    lod: { design: '空白样本与低浓度样本各≥5个×3重复×多天', accept: 'LoB/LoD/LoQ分别建立; 低浓度检出率≥95%', ref: 'EP17' },
    specificity: { design: '潜在干扰物(胆红素/脂血/血红蛋白/RF/HAMA等)×2水平×3重复', accept: '干扰偏差 ≤10%', ref: 'EP07' },
    stability: { design: '室温/冷藏/冻融1-3次/长期保存, 2水平×3重复', accept: '相对基线偏差 ≤15%', ref: 'EP05' },
    sample_stability: { design: '采集/处理/运输/保存各阶段 + 冻融周期 + 抗凝剂', accept: '说明书【样本要求】详述', ref: 'B1 §4.2.1' },
    cross_reactivity: { design: '代谢物(环孢霉素AM1/AM9等; 他克莫司MI~MVIII)×高浓度', accept: '交叉反应率在可接受范围', ref: 'B1 §4.2.6' },
  };

  function applicableItems(product, framework) {
    return ITEMS.filter(it => {
      if (it.key === 'cross_reactivity' && !/免疫/.test(product.method)) return false;
      if (it.key === 'hook_effect' && !/夹心|sandwich/.test(product.method)) return false;
      if (['traceability','calibrator_value','calibrator_homogeneity'].includes(it.key) && !product.trace) return false;
      return true;
    });
  }

  function gaps(product, framework) {
    const app = applicableItems(product, framework);
    const have = app.filter(i => (product.existing || []).includes(i.key));
    const missing = app.filter(i => !(product.existing || []).includes(i.key));
    return { applicable: app, have, missing };
  }

  global.PlatformData = { FRAMEWORKS, ITEMS, CAT_LABELS, PRODUCTS, PLANS, applicableItems, gaps };
})(window);
