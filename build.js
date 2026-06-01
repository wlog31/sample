const vm = require('vm');
const fs = require('fs');
const path = require('path');

// Load data
const dataCode = fs.readFileSync(path.join(__dirname, 'data/data.js'), 'utf8');
const modCode = dataCode.replace('const EDU_DATA', 'globalThis.EDU_DATA');
eval(modCode);
const EDU_DATA = globalThis.EDU_DATA;

function slug(name) {
  return name.replace(/\s+/g,'_').replace(/[·・]/g,'_').replace(/\//g,'-').replace(/[<>:"\\|?*]/g,'');
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true});
}

const TABLE_ROWS = [
  { label:'국어',           groups:['국어'] },
  { label:'수학',           groups:['수학'] },
  { label:'영어',           groups:['영어'] },
  { label:'사회',           groups:['사회'] },
  { label:'과학',           groups:['과학'] },
  { label:'예체능',         groups:['체육','예술'] },
  { label:'기술·가정/정보', groups:['기술·가정/정보'] },
  { label:'제2외국어/한문', groups:['제2외국어·한문'] },
  { label:'교양',           groups:['교양'] },
  { label:'전문교과',       groups:['전문교과'] },
];

function renderSubjectTableStatic(generalList, careerList, fusionList, subjectURLFn) {
  function groupBy(list) {
    const m = {};
    list.forEach(name => {
      const g = (EDU_DATA.subjects[name] && EDU_DATA.subjects[name].교과군) || '기타';
      if (!m[g]) m[g] = [];
      m[g].push(name);
    });
    return m;
  }
  const gm = groupBy(generalList), cm = groupBy(careerList), fm = groupBy(fusionList);
  const handled = new Set();
  const rows = [];
  TABLE_ROWS.forEach(rd => {
    rd.groups.forEach(g => handled.add(g));
    const gen = rd.groups.flatMap(g => gm[g]||[]);
    const car = rd.groups.flatMap(g => cm[g]||[]);
    const fus = rd.groups.flatMap(g => fm[g]||[]);
    if (gen.length||car.length||fus.length) rows.push({label:rd.label,gen,car,fus});
  });
  new Set([...Object.keys(gm),...Object.keys(cm),...Object.keys(fm)]).forEach(g => {
    if (!handled.has(g)) rows.push({label:g, gen:gm[g]||[], car:cm[g]||[], fus:fm[g]||[]});
  });
  if (!rows.length) return '<p style="color:#a0aec0;font-size:.85rem;">권장 선택과목 정보가 없습니다.</p>';

  const chip = name => {
    const href = subjectURLFn(name);
    return `<a class="subj-chip" href="${href}">${name}</a>`;
  };

  return `<div class="subj-table-wrap"><table class="subj-table">
    <thead><tr>
      <th class="th-group">교과(군)</th>
      <th class="th-general">일반선택</th>
      <th class="th-career">진로선택</th>
      <th class="th-fusion">융합선택</th>
    </tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td class="td-group">${r.label}</td>
      <td class="td-chips">${r.gen.map(chip).join('')}</td>
      <td class="td-chips">${r.car.map(chip).join('')}</td>
      <td class="td-chips">${r.fus.map(chip).join('')}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

const COMMON_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif; background:#f0f4f8; color:#1a202c; }
  .top-bar { color:white; padding:1rem 1.5rem; display:flex; align-items:center; gap:1rem; flex-wrap:wrap; }
  .top-bar a { color:rgba(255,255,255,.75); text-decoration:none; font-size:.85rem; }
  .top-bar a:hover { color:white; }
  .top-bar h1 { font-size:1.1rem; font-weight:700; flex:1; }
  .breadcrumb { font-size:.8rem; opacity:.7; }
  .page-content { max-width:860px; margin:0 auto; padding:2rem 1.5rem; }
  .info-card { background:white; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,.07); padding:1.5rem; margin-bottom:1.2rem; }
  .info-card h3 { font-size:.78rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-bottom:.8rem; display:flex; align-items:center; gap:.5rem; }
  .info-card p { font-size:.88rem; line-height:1.75; color:#4a5568; white-space:pre-line; }
  .univ-grid { display:flex; flex-wrap:wrap; gap:.4rem; }
  .univ-chip { background:#f7fafc; border:1px solid #e2e8f0; border-radius:6px; padding:.25rem .6rem; font-size:.75rem; color:#4a5568; }
  .similar-chip { display:inline-block; border-radius:6px; padding:.25rem .6rem; font-size:.75rem; margin:.2rem; text-decoration:none; }
  .subj-table-wrap { overflow-x:auto; border-radius:10px; border:1px solid #e2e8f0; }
  .subj-table { width:100%; border-collapse:collapse; font-size:.82rem; table-layout:fixed; }
  .subj-table th { padding:.6rem .8rem; font-size:.72rem; font-weight:700; letter-spacing:.05em; text-align:left; border-bottom:2px solid #e2e8f0; }
  .th-group { background:#f7fafc; color:#718096; width:90px; }
  .th-general { background:#dbeafe; color:#1e40af; width:30%; }
  .th-career  { background:#dcfce7; color:#166534; width:30%; }
  .th-fusion  { background:#fce7f3; color:#9d174d; width:30%; }
  .subj-table td { padding:.5rem .6rem; vertical-align:top; border-bottom:1px solid #f0f4f8; border-right:1px solid #e2e8f0; }
  .subj-table td:last-child { border-right:none; }
  .td-group { font-size:.73rem; font-weight:700; color:#4a5568; background:#f7fafc; white-space:nowrap; }
  .td-chips { display:flex; flex-wrap:wrap; gap:.3rem; align-content:flex-start; }
  .subj-chip { background:#edf2f7; color:#2d3748; font-size:.75rem; padding:.2rem .6rem; border-radius:99px; text-decoration:none; border:1px solid #e2e8f0; cursor:pointer; transition:background .15s; display:inline-block; white-space:nowrap; }
  .subj-chip:hover { background:#2d6a9f; color:white; border-color:#2d6a9f; }
  .subj-table tr:last-child td { border-bottom:none; }
  @media(max-width:600px){ .page-content { padding:1rem; } }
`;

// ── DEPARTMENT PAGES ──────────────────────────────────────────────
function generateDeptPage(name, info) {
  const general = info.일반선택 ? info.일반선택.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const career  = info.진로선택 ? info.진로선택.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const fusion  = info.융합선택 ? info.융합선택.split(',').map(s=>s.trim()).filter(Boolean) : [];
  const similar = info.유사학과 ? info.유사학과.split(',').map(s=>s.trim()).filter(Boolean) : [];

  const subjectURLFn = (subName) => {
    const sinfo = EDU_DATA.subjects[subName];
    const grp = (sinfo && sinfo.교과군) || '기타';
    return `../../subjects/${slug(grp)}/${slug(subName)}/index.html`;
  };

  const univHTML = (str) => {
    if (!str) return '<span style="color:#a0aec0;font-size:.8rem;">정보 없음</span>';
    return str.split(',').map(u=>u.trim()).filter(Boolean)
      .map(u=>`<span class="univ-chip">${u}</span>`).join('');
  };

  const tableHTML = renderSubjectTableStatic(general, career, fusion, subjectURLFn);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} | 학과별 안내 | 선택과목 안내서</title>
<style>
${COMMON_CSS}
.top-bar { background: linear-gradient(135deg,#1a5c3a 0%,#2d9f6a 100%); }
.dept-header { background: linear-gradient(135deg,#f0fff4,#c6f6d5); border-radius:14px; padding:1.5rem 2rem; margin-bottom:1.5rem; border-left:5px solid #2d9f6a; }
.dept-header h2 { font-size:1.5rem; font-weight:800; color:#1a5c3a; }
.dept-header .meta { font-size:.83rem; color:#2d9f6a; margin-top:.3rem; }
.info-card h3 { color:#2d9f6a; }
.similar-chip { background:#f0fff4; border:1px solid #9ae6b4; color:#276749; }
.similar-chip:hover { background:#2d9f6a; color:white; }
</style>
</head>
<body>
<div class="top-bar">
  <div>
    <a href="../../index.html">🏠 홈</a>
    <span class="breadcrumb"> / <a href="../index.html" style="color:rgba(255,255,255,.75);text-decoration:none;">학과별 안내</a> / ${name}</span>
  </div>
  <h1>🏫 ${name}</h1>
</div>
<div class="page-content">
  <div class="dept-header">
    <h2>🏫 ${name}</h2>
    <div class="meta">${(general.length+career.length+fusion.length)}개 권장 선택과목</div>
  </div>

  ${info.학과설명 ? `<div class="info-card"><h3>📌 학과 소개</h3><p>${info.학과설명}</p></div>` : ''}
  ${info.추천학생 ? `<div class="info-card"><h3>✅ 이런 학생에게 추천</h3><p>${info.추천학생.replace(/\n/g,'<br>')}</p></div>` : ''}

  ${(general.length||career.length||fusion.length) ? `
  <div class="info-card">
    <h3>📚 권장 고교 선택과목</h3>
    ${tableHTML}
  </div>` : ''}

  ${info.전공기초 ? `<div class="info-card"><h3>📖 주요 전공 교과목</h3><p>${info.전공기초.replace(/\n/g,'<br>')}</p></div>` : ''}

  ${(info.개설대학_서울||info.개설대학_수도권||info.개설대학_지방) ? `
  <div class="info-card">
    <h3>🏛️ 개설 대학</h3>
    ${info.개설대학_서울 ? `<p style="font-size:.75rem;font-weight:700;color:#718096;margin-bottom:.4rem;">서울</p><div class="univ-grid" style="margin-bottom:.8rem;">${univHTML(info.개설대학_서울)}</div>` : ''}
    ${info.개설대학_수도권 ? `<p style="font-size:.75rem;font-weight:700;color:#718096;margin-bottom:.4rem;">수도권</p><div class="univ-grid" style="margin-bottom:.8rem;">${univHTML(info.개설대학_수도권)}</div>` : ''}
    ${info.개설대학_지방 ? `<p style="font-size:.75rem;font-weight:700;color:#718096;margin-bottom:.4rem;">지방</p><div class="univ-grid">${univHTML(info.개설대학_지방)}</div>` : ''}
  </div>` : ''}

  ${info.졸업후진로 ? `<div class="info-card"><h3>🚀 졸업 후 진로</h3><p>${info.졸업후진로.replace(/\n/g,'<br>')}</p></div>` : ''}

  ${similar.length ? `
  <div class="info-card">
    <h3>🔗 유사 학과</h3>
    <div>${similar.map(s=>{
      const exists = EDU_DATA.departments[s];
      return exists
        ? `<a class="similar-chip" href="../${slug(s)}/index.html">${s}</a>`
        : `<span class="similar-chip">${s}</span>`;
    }).join('')}</div>
  </div>` : ''}
</div>
</body>
</html>`;
}

// ── SERIES PAGES ──────────────────────────────────────────────────
function generateSeriesPage(name, info) {
  const ICONS = EDU_DATA.series_icons || {};
  const depts = (EDU_DATA.series_to_depts || {})[name] || [];

  const general = info.일반선택 ? info.일반선택.split('，').flatMap(s=>s.split(',')).map(s=>s.trim()).filter(Boolean) : [];
  const career  = info.진로선택 ? info.진로선택.split('，').flatMap(s=>s.split(',')).map(s=>s.trim()).filter(Boolean) : [];
  const fusion  = info.융합선택 ? info.융합선택.split('，').flatMap(s=>s.split(',')).map(s=>s.trim()).filter(Boolean) : [];

  const subjectURLFn = (subName) => {
    const sinfo = EDU_DATA.subjects[subName];
    const grp = (sinfo && sinfo.교과군) || '기타';
    return `../../subjects/${slug(grp)}/${slug(subName)}/index.html`;
  };

  const tableHTML = renderSubjectTableStatic(general, career, fusion, subjectURLFn);
  const icon = ICONS[name] || '📁';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} 계열 | 계열별 안내 | 선택과목 안내서</title>
<style>
${COMMON_CSS}
.top-bar { background: linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%); }
.series-header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; }
.series-header .big-icon { font-size:2.5rem; }
.series-header h2 { font-size:1.6rem; font-weight:800; }
.series-header p { font-size:.85rem; color:#718096; margin-top:.2rem; }
.info-card h3 { color:#2d6a9f; }
.dept-chips { display:flex; flex-wrap:wrap; gap:.5rem; }
.dept-chip { background:#e6f0fb; color:#1e4d8c; font-size:.78rem; padding:.3rem .8rem; border-radius:99px; border:1px solid #b9d1f0; text-decoration:none; display:inline-block; }
.dept-chip:hover { background:#2d6a9f; color:white; }
.tip-box { background:linear-gradient(135deg,#fffbeb,#fef3c7); border:1px solid #f6d860; border-radius:12px; padding:1.2rem 1.5rem; }
.tip-box h3 { color:#b7791f; font-size:.8rem; font-weight:700; margin-bottom:.6rem; }
.tip-box p { font-size:.85rem; color:#744210; line-height:1.7; white-space:pre-line; }
</style>
</head>
<body>
<div class="top-bar">
  <div>
    <a href="../../index.html">🏠 홈</a>
    <span class="breadcrumb"> / <a href="../index.html" style="color:rgba(255,255,255,.75);text-decoration:none;">계열별 안내</a> / ${name}</span>
  </div>
  <h1>${icon} ${name} 계열</h1>
</div>
<div class="page-content">
  <div class="series-header">
    <div class="big-icon">${icon}</div>
    <div>
      <h2>${name} 계열</h2>
      <p>관련 학과 ${depts.length}개 · 권장 선택과목 ${general.length+career.length+fusion.length}개</p>
    </div>
  </div>

  ${depts.length ? `
  <div class="info-card">
    <h3>🏫 관련 학과</h3>
    <div class="dept-chips">${depts.map(d=>{
      const exists = EDU_DATA.departments[d];
      return exists
        ? `<a class="dept-chip" href="../../departments/${slug(d)}/index.html">${d}</a>`
        : `<span class="dept-chip">${d}</span>`;
    }).join('')}</div>
  </div>` : ''}

  <div class="info-card">
    <h3>📚 권장 선택과목</h3>
    ${tableHTML}
  </div>

  ${info.tip ? `
  <div class="tip-box">
    <h3>💡 전공 선택을 위한 Tip</h3>
    <p>${info.tip.replace(/\n/g,'<br>')}</p>
  </div>` : ''}
</div>
</body>
</html>`;
}

// ── SUBJECT PAGES ─────────────────────────────────────────────────
const GROUP_ICONS = {
  '국어':'📗','수학':'📐','영어':'🌐','사회':'🗺️','과학':'🔬',
  '체육':'🏃','예술':'🎨','기술·가정/정보':'💡','제2외국어·한문':'🈳',
  '교양':'🌿','전문교과':'⭐'
};

function generateSubjectPage(name, info) {
  const keywords = info.키워드 ? info.키워드.replace(/#/g,'').split(/\s+/).filter(Boolean) : [];
  const recLines = info.추천학생
    ? info.추천학생.split(/\n|·|•|∙|･/).map(s=>s.trim()).filter(Boolean)
    : [];
  const domains = info.대영역 || [];

  function typeBadgeClass(t) {
    if (t==='일반선택') return 'meta-type-general';
    if (t==='진로선택') return 'meta-type-career';
    if (t==='융합선택') return 'meta-type-fusion';
    return 'meta-type-other';
  }
  const suneungText = info.수능출제 === 'O' ? '✅ 수능 출제' : info.수능출제 === '-' ? '❌ 미출제' : info.수능출제 || '-';
  const suneungCls  = info.수능출제 === 'O' ? 'meta-suneung-y' : 'meta-suneung-n';
  const grpIcon = (info.교과군 && GROUP_ICONS[info.교과군]) || '📋';

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} | 선택과목 안내 | 선택과목 안내서</title>
<style>
${COMMON_CSS}
.top-bar { background: linear-gradient(135deg,#5c3a1a 0%,#e07b2a 100%); }
.info-card h3 { color:#e07b2a; }
.subj-hero { background: linear-gradient(135deg,#fff5eb,#fde8cc); border-radius:14px; padding:1.5rem 2rem; margin-bottom:1.5rem; border-left:5px solid #e07b2a; }
.subj-hero h2 { font-size:1.4rem; font-weight:800; color:#7b341e; }
.subj-hero .intro { font-size:.9rem; color:#744210; line-height:1.65; margin-top:.5rem; }
.subj-hero .meta { display:flex; gap:.6rem; flex-wrap:wrap; margin-top:.8rem; }
.meta-badge { font-size:.72rem; padding:.2rem .65rem; border-radius:6px; font-weight:600; }
.meta-type-general { background:#dbeafe; color:#1e40af; }
.meta-type-career   { background:#dcfce7; color:#166534; }
.meta-type-fusion   { background:#fce7f3; color:#9d174d; }
.meta-type-other    { background:#f3f4f6; color:#374151; }
.meta-suneung-y { background:#fef3c7; color:#92400e; }
.meta-suneung-n { background:#f3f4f6; color:#6b7280; }
.meta-eval { background:#f0fdf4; color:#166534; }
.kw-grid { display:flex; flex-wrap:wrap; gap:.4rem; }
.kw-chip { background:#fff5eb; color:#c05621; font-size:.78rem; padding:.25rem .65rem; border-radius:99px; border:1px solid #fbd38d; }
.domain-grid { display:flex; flex-wrap:wrap; gap:.4rem; }
.domain-chip { background:#f7fafc; color:#4a5568; font-size:.78rem; padding:.25rem .7rem; border-radius:6px; border:1px solid #e2e8f0; }
.rec-list { list-style:none; }
.rec-list li { font-size:.88rem; color:#4a5568; line-height:1.7; padding:.2rem 0 .2rem 1.2rem; position:relative; }
.rec-list li::before { content:'✔'; position:absolute; left:0; color:#e07b2a; font-size:.75rem; top:.25rem; }
.suneung-box { display:flex; gap:1.5rem; flex-wrap:wrap; }
.suneung-item { flex:1; min-width:120px; text-align:center; }
.suneung-item .s-icon { font-size:1.8rem; }
.suneung-item .s-label { font-size:.7rem; color:#718096; margin:.3rem 0 .1rem; }
.suneung-item .s-val { font-size:.95rem; font-weight:700; }
</style>
</head>
<body>
<div class="top-bar">
  <div>
    <a href="../../../index.html">🏠 홈</a>
    <span class="breadcrumb"> / <a href="../../index.html" style="color:rgba(255,255,255,.75);text-decoration:none;">선택과목별 안내</a> / ${info.교과군||''} / ${name}</span>
  </div>
  <h1>📋 ${name}</h1>
</div>
<div class="page-content">
  <div class="subj-hero">
    <h2>${grpIcon} ${name}</h2>
    ${info.한줄소개 ? `<div class="intro">${info.한줄소개}</div>` : ''}
    <div class="meta">
      ${info.교과군 ? `<span class="meta-badge meta-type-other">${GROUP_ICONS[info.교과군]||''} ${info.교과군}</span>` : ''}
      ${info.구분 ? `<span class="meta-badge ${typeBadgeClass(info.구분)}">${info.구분}</span>` : ''}
      ${info.수능출제 ? `<span class="meta-badge ${suneungCls}">수능 ${info.수능출제==='O'?'출제':'미출제'}</span>` : ''}
      ${info.평가정보 ? `<span class="meta-badge meta-eval">${info.평가정보.substring(0,20)}</span>` : ''}
    </div>
  </div>

  ${keywords.length ? `<div class="info-card"><h3>🏷️ 주요 키워드</h3><div class="kw-grid">${keywords.map(k=>`<span class="kw-chip">#${k}</span>`).join('')}</div></div>` : ''}
  ${domains.length ? `<div class="info-card"><h3>📂 주요 학습 영역</h3><div class="domain-grid">${domains.map(d=>`<span class="domain-chip">${d}</span>`).join('')}</div></div>` : ''}
  ${recLines.length ? `<div class="info-card"><h3>✅ 이런 학생에게 추천</h3><ul class="rec-list">${recLines.map(l=>`<li>${l}</li>`).join('')}</ul></div>` : ''}

  <div class="info-card">
    <h3>📊 평가 및 수능 정보</h3>
    <div class="suneung-box">
      <div class="suneung-item">
        <div class="s-icon">${info.수능출제==='O'?'📝':'📄'}</div>
        <div class="s-label">수능 출제 여부</div>
        <div class="s-val" style="color:${info.수능출제==='O'?'#c05621':'#718096'}">${suneungText}</div>
      </div>
      <div class="suneung-item">
        <div class="s-icon">📋</div>
        <div class="s-label">과목 유형</div>
        <div class="s-val">${info.구분||'-'}</div>
      </div>
      ${info.평가정보 ? `<div class="suneung-item"><div class="s-icon">⭐</div><div class="s-label">평가 방법</div><div class="s-val" style="font-size:.78rem">${info.평가정보}</div></div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── GENERATE ALL FILES ────────────────────────────────────────────
const BASE = __dirname;
let deptCount = 0, seriesCount = 0, subjectCount = 0;

// Departments
Object.entries(EDU_DATA.departments).forEach(([name, info]) => {
  const dir = path.join(BASE, 'departments', slug(name));
  ensureDir(dir);
  const html = generateDeptPage(name, info);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  deptCount++;
  console.log(`[dept] departments/${slug(name)}/index.html`);
});

// Series
Object.entries(EDU_DATA.series).forEach(([name, info]) => {
  const dir = path.join(BASE, 'series', slug(name));
  ensureDir(dir);
  const html = generateSeriesPage(name, info);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  seriesCount++;
  console.log(`[series] series/${slug(name)}/index.html`);
});

// Subjects
Object.entries(EDU_DATA.subjects).forEach(([name, info]) => {
  const grp = info.교과군 || '기타';
  const dir = path.join(BASE, 'subjects', slug(grp), slug(name));
  ensureDir(dir);
  const html = generateSubjectPage(name, info);
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  subjectCount++;
  console.log(`[subject] subjects/${slug(grp)}/${slug(name)}/index.html`);
});

console.log(`\nDone! departments:${deptCount} series:${seriesCount} subjects:${subjectCount}`);
