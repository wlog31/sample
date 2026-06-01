// build.js, departments/index.html, series/index.html 의
// renderSubjectTable 관련 로직을 일괄 수정하는 스크립트

const fs = require('fs');

// ── 1. 새 CSS (td-group 줄바꿈 허용 + 모바일) ──────────────────────────────
const OLD_CSS = `  .subj-table { width:100%; border-collapse:collapse; font-size:.82rem; table-layout:fixed; }
  .subj-table th { padding:.6rem .8rem; font-size:.72rem; font-weight:700; letter-spacing:.05em; text-align:left; border-bottom:2px solid #e2e8f0; }
  .th-group { background:#f7fafc; color:#718096; width:90px; }
  .th-general { background:#dbeafe; color:#1e40af; width:30%; }
  .th-career  { background:#dcfce7; color:#166534; width:30%; }
  .th-fusion  { background:#fce7f3; color:#9d174d; width:30%; }
  .subj-table td { padding:.5rem .6rem; vertical-align:top; border-bottom:1px solid #f0f4f8; border-right:1px solid #e2e8f0; }
  .subj-table td:last-child { border-right:none; }
  .td-group { font-size:.73rem; font-weight:700; color:#4a5568; background:#f7fafc; white-space:nowrap; }
  .td-chips { }
  .chips-wrap { display:flex; flex-wrap:wrap; gap:.3rem; align-content:flex-start; }
  .subj-chip { background:#edf2f7; color:#2d3748; font-size:.75rem; padding:.2rem .6rem; border-radius:99px; text-decoration:none; border:1px solid #e2e8f0; cursor:pointer; transition:background .15s; display:inline-block; white-space:nowrap; }
  .subj-chip:hover { background:#2d6a9f; color:white; border-color:#2d6a9f; }
  .subj-table tr:last-child td { border-bottom:none; }
  @media(max-width:600px){ .subj-table { font-size:.72rem; } .subj-chip { white-space:normal; word-break:keep-all; font-size:.7rem; padding:.15rem .4rem; } .td-chips { overflow:hidden; } .th-group { width:56px; } }`;

const NEW_CSS = `  .subj-table { width:100%; border-collapse:collapse; font-size:.82rem; table-layout:fixed; }
  .subj-table th { padding:.6rem .8rem; font-size:.72rem; font-weight:700; letter-spacing:.05em; text-align:left; border-bottom:2px solid #e2e8f0; }
  .th-group { background:#f7fafc; color:#718096; width:88px; }
  .th-general { background:#dbeafe; color:#1e40af; width:30%; }
  .th-career  { background:#dcfce7; color:#166534; width:30%; }
  .th-fusion  { background:#fce7f3; color:#9d174d; width:30%; }
  .subj-table td { padding:.5rem .6rem; vertical-align:top; border-bottom:1px solid #f0f4f8; border-right:1px solid #e2e8f0; }
  .subj-table td:last-child { border-right:none; }
  .td-group { font-size:.71rem; font-weight:700; color:#4a5568; background:#f7fafc; white-space:normal; word-break:keep-all; line-height:1.4; }
  .td-chips { }
  .chips-wrap { display:flex; flex-wrap:wrap; gap:.3rem; align-content:flex-start; }
  .subj-chip { background:#edf2f7; color:#2d3748; font-size:.75rem; padding:.2rem .6rem; border-radius:99px; text-decoration:none; border:1px solid #e2e8f0; cursor:pointer; transition:background .15s; display:inline-block; white-space:nowrap; }
  .subj-chip:hover { background:#2d6a9f; color:white; border-color:#2d6a9f; }
  .subj-table tr:last-child td { border-bottom:none; }
  @media(max-width:600px){ .subj-table { font-size:.72rem; } .th-group { width:52px; } .subj-chip { white-space:normal; word-break:keep-all; font-size:.68rem; padding:.15rem .4rem; } }`;

// ── 2. 새 TABLE_ROWS (라벨에 <wbr> 추가) ─────────────────────────────────
const OLD_TABLE_ROWS = `const TABLE_ROWS = [
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
];`;

const NEW_TABLE_ROWS = `const TABLE_ROWS = [
  { label:'국어',                    groups:['국어'] },
  { label:'수학',                    groups:['수학'] },
  { label:'영어',                    groups:['영어'] },
  { label:'사회',                    groups:['사회'] },
  { label:'과학',                    groups:['과학'] },
  { label:'예체능',                  groups:['체육','예술'] },
  { label:'기술·가정<wbr>/정보',     groups:['기술·가정/정보'] },
  { label:'제2외국어<wbr>/한문',     groups:['제2외국어·한문'] },
  { label:'교양',                    groups:['교양'] },
  { label:'전문교과',                groups:['전문교과'] },
];`;

// ── 3. 새 getSubjectGroup (개선된 매칭) ──────────────────────────────────
const OLD_GETSUB = `function getSubjectGroup(name) {
  return (EDU_DATA.subjects[name] && EDU_DATA.subjects[name].교과군) || '기타';
}`;

// build.js 용
const NEW_GETSUB_BUILD = `function getSubjectGroup(name) {
  const S = EDU_DATA.subjects;
  if (S[name]) return S[name].교과군;
  // " 등" 제거
  let c = name.replace(/\\s*등$/, '').trim();
  if (S[c]) return S[c].교과군;
  // 로마자 숫자 통일 (I→Ⅰ, II→Ⅱ, 1→Ⅰ, 2→Ⅱ)
  c = c.replace(/([가-힣])\\s*I\\b/g,'$1Ⅰ').replace(/([가-힣])\\s*II\\b/g,'$1Ⅱ')
       .replace(/([가-힣])\\s*1$/,'$1Ⅰ').replace(/([가-힣])\\s*2$/,'$1Ⅱ');
  if (S[c]) return S[c].교과군;
  // 공백 제거 후 fuzzy
  const nosp = c.replace(/\\s+/g,'');
  const hit = Object.keys(S).find(k=>k.replace(/\\s+/g,'')=== nosp);
  if (hit) return S[hit].교과군;
  // 키워드 폴백
  if (/제2외국어|한문|일본어|중국어|프랑스어|독일어|스페인어|러시아어|아랍어|베트남어/.test(name)) return '제2외국어·한문';
  if (/기술|정보과학|인공지능|소프트웨어|로봇|데이터/.test(name)) return '기술·가정/정보';
  if (/보건|생태|환경|철학|논리|논술|지식재산|생활과학|심리|종교/.test(name)) return '교양';
  if (/가정|생활|아동/.test(name)) return '기술·가정/정보';
  if (/체육|스포츠/.test(name)) return '체육';
  if (/음악|미술|연극|예술|미디어/.test(name)) return '예술';
  if (/역사|지리|윤리|경제|법|정치|국제|사회/.test(name)) return '사회';
  if (/물리|화학|생명|생물|지구|과학|행성|우주/.test(name)) return '과학';
  if (/수학|미적분|확률|통계|기하|대수/.test(name)) return '수학';
  if (/영어|영미|실생활 영어/.test(name)) return '영어';
  if (/국어|문학|화법|독서|언어|매체|글쓰기|한자/.test(name)) return '국어';
  return null; // 진짜 미분류 → 테이블에서 제외
}`;

// index.html 용 (EDU_DATA 변수명 동일)
const NEW_GETSUB_INDEX = NEW_GETSUB_BUILD;

// ── 4. buildSubjectTable: null 그룹 처리 + 기타 행 제거 ───────────────────
// build.js 의 renderSubjectTableStatic 안에서 getSubjectGroup 반환값이 null이면 skip
const OLD_GROUPBY_BUILD = `  function groupSubjects(list) {
    const map = {};
    list.forEach(name => {
      const group = subjectGroupMap[name] || '기타';
      if (!map[group]) map[group] = [];
      map[group].push(name);
    });
    return map;
  }`;

const NEW_GROUPBY_BUILD = `  function groupSubjects(list) {
    const map = {};
    list.forEach(name => {
      // 긴 문장(팁 텍스트 혼입) 또는 ':' 포함(설명문) 제외
      if (name.length > 25 || name.includes(':') || name.includes('\\n')) return;
      const group = getSubjectGroup(name);
      if (!group) return; // 미분류 제외
      if (!map[group]) map[group] = [];
      map[group].push(name);
    });
    return map;
  }`;

// index.html 의 buildSubjectTable 안 groupBy 함수
const OLD_GROUPBY_INDEX = `  function groupBy(list) {
    const m = {};
    list.forEach(name => {
      const g = (EDU_DATA.subjects[name] && EDU_DATA.subjects[name].교과군) || '기타';
      if (!m[g]) m[g] = [];
      m[g].push(name);
    });
    return m;
  }`;

const NEW_GROUPBY_INDEX = `  function groupBy(list) {
    const m = {};
    list.forEach(name => {
      if (name.length > 25 || name.includes(':') || name.includes('\\n')) return;
      const g = getSubjectGroup(name);
      if (!g) return;
      if (!m[g]) m[g] = [];
      m[g].push(name);
    });
    return m;
  }`;

// ── 5. 파일 수정 ────────────────────────────────────────────────────────
function patch(filePath, patches) {
  let c = fs.readFileSync(filePath, 'utf8');
  let ok = true;
  for (const [from, to, label] of patches) {
    if (!c.includes(from)) { console.log(`  MISS [${label}]`); ok = false; continue; }
    c = c.replace(from, to);
    console.log(`  OK   [${label}]`);
  }
  if (ok) fs.writeFileSync(filePath, c);
  else { fs.writeFileSync(filePath, c); console.log('  (일부 패치 누락, 그래도 저장)'); }
}

// build.js
console.log('\n=== build.js ===');
patch('/sessions/youthful-fervent-ride/mnt/sample/build.js', [
  [OLD_CSS,          NEW_CSS,          'CSS'],
  [OLD_TABLE_ROWS,   NEW_TABLE_ROWS,   'TABLE_ROWS'],
  [OLD_GROUPBY_BUILD, NEW_GROUPBY_BUILD, 'groupSubjects'],
]);

// build.js 에는 별도 getSubjectGroup 함수가 없고 subjectGroupMap을 쓰므로
// subjectGroupMap 빌드 로직도 교체
let bjs = fs.readFileSync('/sessions/youthful-fervent-ride/mnt/sample/build.js','utf8');
// subjectGroupMap 사용처를 getSubjectGroup 함수로 대체
const OLD_SGMAP = `// Build subject group lookup: name -> 교과군
const subjectGroupMap = {};
for (const [name, info] of Object.entries(D.subjects)) {
  subjectGroupMap[name] = info.교과군 || '기타';
}

function subjectToURL`;
const NEW_SGMAP = `function getSubjectGroup(name) {
  const S = D.subjects;
  if (S[name]) return S[name].교과군;
  let c = name.replace(/\\s*등$/, '').trim();
  if (S[c]) return S[c].교과군;
  c = c.replace(/([가-힣])\\s*I\\b/g,'$1Ⅰ').replace(/([가-힣])\\s*II\\b/g,'$1Ⅱ')
       .replace(/([가-힣])\\s*1$/,'$1Ⅰ').replace(/([가-힣])\\s*2$/,'$1Ⅱ');
  if (S[c]) return S[c].교과군;
  const nosp = c.replace(/\\s+/g,'');
  const hit = Object.keys(S).find(k=>k.replace(/\\s+/g,'')=== nosp);
  if (hit) return S[hit].교과군;
  if (/제2외국어|한문|일본어|중국어|프랑스어|독일어|스페인어|러시아어|아랍어|베트남어/.test(name)) return '제2외국어·한문';
  if (/기술|정보과학|인공지능|소프트웨어|로봇|데이터/.test(name)) return '기술·가정/정보';
  if (/보건|생태|환경|철학|논리|논술|지식재산|생활과학|심리|종교/.test(name)) return '교양';
  if (/가정|생활|아동/.test(name)) return '기술·가정/정보';
  if (/체육|스포츠/.test(name)) return '체육';
  if (/음악|미술|연극|예술|미디어/.test(name)) return '예술';
  if (/역사|지리|윤리|경제|법|정치|국제|사회/.test(name)) return '사회';
  if (/물리|화학|생명|생물|지구|과학|행성|우주/.test(name)) return '과학';
  if (/수학|미적분|확률|통계|기하|대수/.test(name)) return '수학';
  if (/영어|영미|실생활 영어/.test(name)) return '영어';
  if (/국어|문학|화법|독서|언어|매체|글쓰기|한자/.test(name)) return '국어';
  return null;
}

function subjectToURL`;

if (bjs.includes(OLD_SGMAP)) {
  bjs = bjs.replace(OLD_SGMAP, NEW_SGMAP);
  console.log('  OK   [getSubjectGroup 함수 교체]');
} else {
  console.log('  MISS [OLD_SGMAP]');
  // subjectGroupMap 참조를 getSubjectGroup 호출로 대체
  bjs = bjs.replace(/subjectGroupMap\[name\] \|\| '기타'/g, "getSubjectGroup(name) || '기타'");
}
fs.writeFileSync('/sessions/youthful-fervent-ride/mnt/sample/build.js', bjs);

// departments/index.html
console.log('\n=== departments/index.html ===');
patch('/sessions/youthful-fervent-ride/mnt/sample/departments/index.html', [
  [OLD_CSS,          NEW_CSS,          'CSS'],
  [OLD_TABLE_ROWS,   NEW_TABLE_ROWS,   'TABLE_ROWS'],
  [OLD_GROUPBY_INDEX, NEW_GROUPBY_INDEX, 'groupBy'],
]);
// getSubjectGroup 추가 (buildSubjectTable 함수 앞에)
let djs = fs.readFileSync('/sessions/youthful-fervent-ride/mnt/sample/departments/index.html','utf8');
if (!djs.includes('function getSubjectGroup')) {
  const insertBefore = 'function buildSubjectTable(';
  const gsFn = `function getSubjectGroup(name) {
  const S = EDU_DATA.subjects;
  if (S[name]) return S[name].교과군;
  let c = name.replace(/\\s*등$/, '').trim();
  if (S[c]) return S[c].교과군;
  c = c.replace(/([가-힣])\\s*I\\b/g,'$1Ⅰ').replace(/([가-힣])\\s*II\\b/g,'$1Ⅱ')
       .replace(/([가-힣])\\s*1$/,'$1Ⅰ').replace(/([가-힣])\\s*2$/,'$1Ⅱ');
  if (S[c]) return S[c].교과군;
  const nosp = c.replace(/\\s+/g,'');
  const hit = Object.keys(S).find(k=>k.replace(/\\s+/g,'')=== nosp);
  if (hit) return S[hit].교과군;
  if (/제2외국어|한문|일본어|중국어|프랑스어|독일어|스페인어|러시아어|아랍어|베트남어/.test(name)) return '제2외국어·한문';
  if (/기술|정보과학|인공지능|소프트웨어|로봇|데이터/.test(name)) return '기술·가정/정보';
  if (/보건|생태|환경|철학|논리|논술|지식재산|생활과학|심리|종교/.test(name)) return '교양';
  if (/가정|생활|아동/.test(name)) return '기술·가정/정보';
  if (/체육|스포츠/.test(name)) return '체육';
  if (/음악|미술|연극|예술|미디어/.test(name)) return '예술';
  if (/역사|지리|윤리|경제|법|정치|국제|사회/.test(name)) return '사회';
  if (/물리|화학|생명|생물|지구|과학|행성|우주/.test(name)) return '과학';
  if (/수학|미적분|확률|통계|기하|대수/.test(name)) return '수학';
  if (/영어|영미|실생활 영어/.test(name)) return '영어';
  if (/국어|문학|화법|독서|언어|매체|글쓰기|한자/.test(name)) return '국어';
  return null;
}
`;
  djs = djs.replace(insertBefore, gsFn + insertBefore);
  fs.writeFileSync('/sessions/youthful-fervent-ride/mnt/sample/departments/index.html', djs);
  console.log('  OK   [getSubjectGroup 삽입]');
}

// series/index.html
console.log('\n=== series/index.html ===');
patch('/sessions/youthful-fervent-ride/mnt/sample/series/index.html', [
  [OLD_CSS,          NEW_CSS,          'CSS'],
  [OLD_TABLE_ROWS,   NEW_TABLE_ROWS,   'TABLE_ROWS'],
  [OLD_GROUPBY_INDEX, NEW_GROUPBY_INDEX, 'groupBy'],
]);
let sjs = fs.readFileSync('/sessions/youthful-fervent-ride/mnt/sample/series/index.html','utf8');
if (!sjs.includes('function getSubjectGroup')) {
  const insertBefore = 'function buildSubjectTable(';
  const gsFn = `function getSubjectGroup(name) {
  const S = EDU_DATA.subjects;
  if (S[name]) return S[name].교과군;
  let c = name.replace(/\\s*등$/, '').trim();
  if (S[c]) return S[c].교과군;
  c = c.replace(/([가-힣])\\s*I\\b/g,'$1Ⅰ').replace(/([가-힣])\\s*II\\b/g,'$1Ⅱ')
       .replace(/([가-힣])\\s*1$/,'$1Ⅰ').replace(/([가-힣])\\s*2$/,'$1Ⅱ');
  if (S[c]) return S[c].교과군;
  const nosp = c.replace(/\\s+/g,'');
  const hit = Object.keys(S).find(k=>k.replace(/\\s+/g,'')=== nosp);
  if (hit) return S[hit].교과군;
  if (/제2외국어|한문|일본어|중국어|프랑스어|독일어|스페인어|러시아어|아랍어|베트남어/.test(name)) return '제2외국어·한문';
  if (/기술|정보과학|인공지능|소프트웨어|로봇|데이터/.test(name)) return '기술·가정/정보';
  if (/보건|생태|환경|철학|논리|논술|지식재산|생활과학|심리|종교/.test(name)) return '교양';
  if (/가정|생활|아동/.test(name)) return '기술·가정/정보';
  if (/체육|스포츠/.test(name)) return '체육';
  if (/음악|미술|연극|예술|미디어/.test(name)) return '예술';
  if (/역사|지리|윤리|경제|법|정치|국제|사회/.test(name)) return '사회';
  if (/물리|화학|생명|생물|지구|과학|행성|우주/.test(name)) return '과학';
  if (/수학|미적분|확률|통계|기하|대수/.test(name)) return '수학';
  if (/영어|영미|실생활 영어/.test(name)) return '영어';
  if (/국어|문학|화법|독서|언어|매체|글쓰기|한자/.test(name)) return '국어';
  return null;
}
`;
  sjs = sjs.replace(insertBefore, gsFn + insertBefore);
  fs.writeFileSync('/sessions/youthful-fervent-ride/mnt/sample/series/index.html', sjs);
  console.log('  OK   [getSubjectGroup 삽입]');
}

console.log('\n완료. node build.js 를 실행하세요.');
