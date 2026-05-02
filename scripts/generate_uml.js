const fs = require('fs');
const path = require('path');

const root = process.cwd();
const modelsDir = path.join(root, 'models');
const controllersDir = path.join(root, 'controllers');
const servicesDir = path.join(root, 'services');
const routesDir = path.join(root, 'routes');
const outDir = path.join(root, 'doc');
const umlDir = path.join(outDir, 'uml');
const dbDir = path.join(outDir, 'db');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
if (!fs.existsSync(umlDir)) fs.mkdirSync(umlDir);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

function readFiles(dir, ext = '.js'){
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => path.join(dir, f));
}

function extractInitObject(content){
  const idx = content.indexOf('.init(');
  if (idx === -1) return null;
  const after = content.slice(idx + '.init('.length);
  const firstBrace = after.indexOf('{');
  if (firstBrace === -1) return null;
  const start = idx + '.init('.length + firstBrace;
  // bracket matching
  let depth = 0;
  let i = start;
  for (; i < content.length; i++){
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) { return content.slice(start, i+1); }
    }
  }
  return null;
}

function extractOptionsObject(content){
  const idx = content.indexOf('.init(');
  if (idx === -1) return null;
  const after = content.slice(idx + '.init('.length);
  const firstBrace = after.indexOf('{');
  if (firstBrace === -1) return null;
  const start = idx + '.init('.length + firstBrace;
  // find end of first object
  let depth = 0;
  let i = start;
  for (; i < content.length; i++){
    if (content[i] === '{') depth++;
    else if (content[i] === '}') depth--;
    if (depth === 0) break;
  }
  // move to comma after
  let j = i+1;
  while(j < content.length && /[\s,]/.test(content[j])) j++;
  if (content[j] !== '{') return null;
  const optStart = j;
  depth = 0;
  for (i = optStart; i < content.length; i++){
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) return content.slice(optStart, i+1);
    }
  }
  return null;
}

function parseAttributes(objText){
  // objText includes outer braces
  const inner = objText.slice(1, -1);
  const attrs = [];
  let i = 0;
  while(i < inner.length){
    // skip whitespace
    while(i < inner.length && /[\s,]/.test(inner[i])) i++;
    if (i >= inner.length) break;
    // read key
    let keyStart = i;
    while(i < inner.length && /[A-Za-z0-9_]/.test(inner[i])) i++;
    const key = inner.slice(keyStart, i).trim();
    // skip spaces until colon
    while(i < inner.length && inner[i] !== ':') i++;
    if (inner[i] !== ':') break;
    i++; // skip colon
    while(i < inner.length && /[\s]/.test(inner[i])) i++;
    // value: if starts with {, extract until matching }
    let val = null;
    if (inner[i] === '{'){
      let depth = 0;
      const valStart = i;
      for (; i < inner.length; i++){
        if (inner[i] === '{') depth++;
        else if (inner[i] === '}'){
          depth--;
          if (depth === 0) { i++; break; }
        }
      }
      val = inner.slice(valStart, i);
    } else {
      // read until comma at top-level
      const valStart = i;
      while(i < inner.length && inner[i] !== ',') i++;
      val = inner.slice(valStart, i);
    }
    attrs.push({ key, val: val ? val.trim() : null });
    // skip comma
    while(i < inner.length && /[\s,]/.test(inner[i])) i++;
  }
  return attrs;
}

function detectTypeFromVal(val){
  if (!val) return 'UNKNOWN';
  const m = val.match(/type\s*:\s*DataTypes\.([A-Za-z0-9_]+)(\([^)]*\))?/);
  if (m) return m[1] + (m[2] || '');
  // fallback: look for DataTypes.FLOAT or DECIMAL spelled differently
  const m2 = val.match(/DataTypes\.([A-Za-z0-9_]+)/);
  if (m2) return m2[1];
  return 'OBJECT';
}

function mapToSQLType(dt){
  if (!dt) return 'TEXT';
  dt = dt.toUpperCase();
  if (dt.startsWith('UUID')) return 'UUID';
  if (dt.startsWith('STRING')) return 'VARCHAR(255)';
  if (dt.startsWith('TEXT')) return 'TEXT';
  if (dt.startsWith('INTEGER')) return 'INTEGER';
  if (dt.startsWith('BIGINT')) return 'BIGINT';
  if (dt.startsWith('BOOLEAN')) return 'BOOLEAN';
  if (dt.startsWith('DATE')) return 'TIMESTAMP';
  if (dt.startsWith('DECIMAL')){
    const p = dt.match(/DECIMAL\((\d+),(\d+)\)/);
    if (p) return `DECIMAL(${p[1]},${p[2]})`;
    return 'DECIMAL(10,2)';
  }
  if (dt.startsWith('DOUBLE') || dt.startsWith('FLOAT')) return 'DOUBLE PRECISION';
  if (dt.startsWith('DOUBLE(') || dt.startsWith('FLOAT(')) return 'DOUBLE PRECISION';
  if (dt.startsWith('DOUBLE')) return 'DOUBLE PRECISION';
  return 'TEXT';
}

function parseTableName(optionsText){
  if (!optionsText) return null;
  const m = optionsText.match(/tableName\s*:\s*["']([^"']+)["']/);
  if (m) return m[1];
  return null;
}

// Collect models
const modelFiles = readFiles(modelsDir).filter(f => f.endsWith('.models.js'));
const models = [];
for (const file of modelFiles){
  const content = fs.readFileSync(file, 'utf8');
  const initObj = extractInitObject(content);
  const optionsObj = extractOptionsObject(content);
  const attrs = initObj ? parseAttributes(initObj) : [];
  const modelNameMatch = content.match(/class\s+([A-Za-z0-9_]+)\s+extends\s+Model/);
  const modelName = modelNameMatch ? modelNameMatch[1] : path.basename(file).replace('.models.js','');
  const tableName = parseTableName(optionsObj) || null;
  const parsedAttrs = attrs.map(a => ({ name: a.key, raw: a.val, type: detectTypeFromVal(a.val) }));
  models.push({ file, modelName, tableName, attrs: parsedAttrs });
}

// Controllers/services: extract exported function names
function extractExports(filePath){
  const content = fs.readFileSync(filePath,'utf8');
  const matches = [];
  const re = /export\s+const\s+([A-Za-z0-9_]+)/g;
  let m;
  while((m = re.exec(content))){ matches.push(m[1]); }
  return matches;
}

const controllerFiles = [];
function collectControllerFiles(dir){
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const it of items){
    const full = path.join(dir, it);
    if (fs.statSync(full).isDirectory()) collectControllerFiles(full);
    else if (it.endsWith('.js')) controllerFiles.push(full);
  }
}
collectControllerFiles(controllersDir);

const serviceFiles = readFiles(servicesDir);

const controllers = controllerFiles.map(f => ({ file: f, name: path.basename(f).replace('.controller.js',''), methods: extractExports(f) }));
const services = serviceFiles.map(f => ({ file: f, name: path.basename(f).replace('.service.js',''), methods: extractExports(f) }));

// Routes mapping
function extractRoutes(routeFile){
  const content = fs.readFileSync(routeFile,'utf8');
  const lines = content.split(/\r?\n/);
  const routes = [];
  for (const ln of lines){
    const m = ln.match(/router\.(get|post|put|delete)\(['\\"]([^'\\"]+)['\\"],\s*([A-Za-z0-9_.]+)/);
    if (m){ routes.push({ method: m[1].toUpperCase(), path: m[2], handler: m[3] }); }
  }
  return routes;
}
const routeFiles = [];
function collectRouteFiles(dir){
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const it of items){
    const full = path.join(dir, it);
    if (fs.statSync(full).isDirectory()) collectRouteFiles(full);
    else if (it.endsWith('.js')) routeFiles.push(full);
  }
}
collectRouteFiles(routesDir);
let routes = [];
for (const rf of routeFiles){
  const rs = extractRoutes(rf);
  routes = routes.concat(rs.map(r => ({ ...r, file: rf })));
}

// Build PlantUML for models
let pumlModels = '@startuml\n' + 'skinparam classAttributeIconSize 0\n';
for (const m of models){
  pumlModels += `class ${m.modelName} {\n`;
  for (const a of m.attrs){
    const sqlType = mapToSQLType(a.type);
    pumlModels += `  +${a.name} : ${sqlType}\n`;
  }
  pumlModels += '}\n\n';
}
pumlModels += '@enduml\n';
fs.writeFileSync(path.join(umlDir, 'class_diagram_models.puml'), pumlModels, 'utf8');

// Build PlantUML for controllers+services (methods only)
let pumlCtrl = '@startuml\n';
for (const c of controllers){
  const className = c.name.replace(/[^A-Za-z0-9_]/g, '_');
  pumlCtrl += `class ${className}_Controller {\n`;
  for (const m of c.methods) pumlCtrl += `  +${m}()\n`;
  pumlCtrl += '}\n\n';
}
for (const s of services){
  const className = s.name.replace(/[^A-Za-z0-9_]/g, '_');
  pumlCtrl += `class ${className}_Service {\n`;
  for (const m of s.methods) pumlCtrl += `  +${m}()\n`;
  pumlCtrl += '}\n\n';
}
pumlCtrl += '@enduml\n';
fs.writeFileSync(path.join(umlDir, 'controllers_services.puml'), pumlCtrl, 'utf8');

// Build SQL schema
let sql = '-- Generated schema (informational)\n\n';
for (const m of models){
  const table = m.tableName || m.modelName.toLowerCase();
  sql += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
  const cols = m.attrs.map(a => {
    const colNameMatch = (a.raw || '').match(/field\s*:\s*["']([^"']+)["']/);
    const colName = colNameMatch ? colNameMatch[1] : a.name.replace(/[A-Z]/g, l => '_' + l.toLowerCase());
    const sqlType = mapToSQLType(a.type);
    const pk = a.name === 'id' ? ' PRIMARY KEY' : '';
    return `  ${colName} ${sqlType}${pk}`;
  });
  sql += cols.join(',\n') + '\n);\n\n';
}
fs.writeFileSync(path.join(dbDir, 'schema.sql'), sql, 'utf8');

// Build API -> table mapping (best-effort using route file names)
let mapping = '# API -> Controller -> Suggested Table Mapping\n\n';
for (const r of routes){
  const routePath = r.path;
  let controllerRef = r.handler;
  mapping += `- **${r.method} ${routePath}** : handler = ${controllerRef} (file: ${path.relative(root, r.file)})\n`;
  // guess table: take first segment after last folder in route file path
  const guessTable = path.basename(r.file).replace('.router.js','').replace('.route.js','');
  mapping += `  - suggested table/model: ${guessTable} (check models/${guessTable}*)\n`;
}
fs.writeFileSync(path.join(outDir, 'api_table_mapping.md'), mapping, 'utf8');

// Analysis skeleton (4.1.5 and 4.2)
const analysis = `**4.1.5 Analisis Sistem yang Akan Dibuat**\n\n- Tujuan sistem: implementasi OBE (Outcome-Based Education) untuk manajemen CPL/CPMK/RPS dan monitoring nilai.\n- Batasan: backend REST API (Express + Sequelize), DB relational (Postgres/MySQL).\n- Fungsional utama: manajemen kurikulum, mata kuliah, CPL, CPMK, RPS, pemetaan CPL-CPMK-MK, input nilai, monitoring, export laporan.\n- Non-fungsional: autentikasi, logging, backup, skalabilitas, responsivitas API.\n\n**4.2 Gambaran Umum Sistem**\n\n- Aktor: Kaprodi, Dosen, Mahasiswa, Admin.\n- Komponen: REST API server (Express), Database relasional (siak_* tables), storage untuk file RPS, client (web).\n- Alur singkat: Kaprodi/Administrator mengatur kurikulum → Dosen membuat CPMK & RPS → Dosen input nilai per mahasiswa → Sistem menghitung CPL/CPMK dan menyediakan monitoring untuk Kaprodi.\n\nDokumentasi lebih lengkap dan diagram di folder /doc/uml dan skema DB di /doc/db/schema.sql\n`;
fs.writeFileSync(path.join(outDir, 'analysis.md'), analysis, 'utf8');

console.log('UML & schema generated:');
console.log(' - ' + path.join(umlDir, 'class_diagram_models.puml'));
console.log(' - ' + path.join(umlDir, 'controllers_services.puml'));
console.log(' - ' + path.join(dbDir, 'schema.sql'));
console.log(' - ' + path.join(outDir, 'api_table_mapping.md'));
console.log(' - ' + path.join(outDir, 'analysis.md'));
