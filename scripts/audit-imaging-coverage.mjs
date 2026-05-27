import fs from 'fs';
const src = fs.readFileSync('src/data/polyclinicPatients.ts','utf8') + '\n' + fs.readFileSync('src/data/patients.ts','utf8');
const radSrc = fs.readFileSync('src/data/radiologyImages.ts','utf8');

const imgSet = ['cxr','kub','xr-extrem','xr-spine','xr-pelvis','us-abdomen','us-pelvis','echo','ct-head','ct-chest','ct-angio','ct-abdomen','ct-cspine','mri-brain','mri-cspine','mri-lspine','mri-abd','ecg'];

// Rough tag extraction: find the pool block between "<test>':" and the next pool key OR the closing of ABNORMAL_BY_TEST.
const abnIdx = radSrc.indexOf('ABNORMAL_BY_TEST');
const abnBlock = radSrc.slice(abnIdx);

const poolTags = {};
for (const t of imgSet) {
  const quoted = t.includes('-') || t === 'kub' || t === 'cxr' || t === 'ecg' || t === 'echo' ? `'${t}'` : t;
  // match key: either quoted or unquoted
  const keyRe = new RegExp(`(?:^|\\n)\\s+(?:'${t}'|${t.replace(/-/g, '\\-')})\\s*:\\s*\\[`, 'm');
  const km = abnBlock.match(keyRe);
  if (!km) { poolTags[t] = new Set(); continue; }
  const start = km.index + km[0].length;
  // find matching close bracket for this array by depth counting
  let depth = 1;
  let i = start;
  while (i < abnBlock.length && depth > 0) {
    const ch = abnBlock[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    i++;
  }
  const block = abnBlock.slice(start, i - 1);
  const tags = [...block.matchAll(/'([a-z0-9][a-z0-9-]*)'/g)].map(x => x[1]);
  poolTags[t] = new Set(tags);
}

// Extract all cases
const caseRegex = /\{\s*id:\s*'([^']+)',[\s\S]*?testResults:\s*\[([\s\S]*?)\],\s*correctDiagnosisId:\s*'([^']+)'/g;
let m;
const misses = {};
let caseCount = 0;
while ((m = caseRegex.exec(src))) {
  caseCount++;
  const [, caseId, trBody, diag] = m;
  const testMatches = [...trBody.matchAll(/testId:\s*'([^']+)'[^}]*?abnormal:\s*(true|false)/g)];
  for (const t of testMatches) {
    if (!imgSet.includes(t[1]) || t[2] !== 'true') continue;
    const tags = poolTags[t[1]];
    const dx = diag.toLowerCase();
    const match = [...tags].some(tag => dx === tag || dx.includes(tag) || tag.includes(dx));
    if (!match) {
      misses[t[1]] ||= [];
      misses[t[1]].push({ caseId, diag });
    }
  }
}

let total = 0;
for (const [t, arr] of Object.entries(misses).sort()) {
  console.log(`\n=== ${t} (${arr.length} unmatched)`);
  const uniq = {};
  for (const e of arr) (uniq[e.diag] ||= []).push(e.caseId);
  for (const [dx, ids] of Object.entries(uniq)) console.log(`  ${dx}  [${ids.join(', ')}]`);
  total += arr.length;
}
console.log(`\nCases audited: ${caseCount}`);
console.log(`Total unmatched imaging-abnormal cases: ${total}`);
