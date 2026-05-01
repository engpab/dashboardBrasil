// Converte CSVs com geometria WKT para GeoJSON simplificados
// Municípios, intermediárias e imediatas são divididos por UF (lazy loading)
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const wellknown = require('wellknown');
const turf_simplify = require('@turf/simplify').default;

const DATA = path.join(__dirname, '../data');
const GEO  = path.join(DATA, 'geo');

// Tolerâncias de simplificação por nível (graus decimais)
// 0.05° ≈ 5km  |  0.01° ≈ 1km  |  0.003° ≈ 300m
const TOLERANCE = {
  overview: 0.05,   // brasil, regioes, estados
  mid:      0.01,   // intermediárias, imediatas
  detail:   0.003,  // municípios
};

const PRECISION = 4; // casas decimais finais após simplificação

function roundCoords(coords) {
  if (typeof coords[0] === 'number') {
    return coords.map(v => Math.round(v * 10 ** PRECISION) / 10 ** PRECISION);
  }
  return coords.map(roundCoords);
}

function applySimplify(feature, tolerance) {
  try {
    const simplified = turf_simplify(feature, { tolerance, highQuality: false, mutate: false });
    simplified.geometry.coordinates = roundCoords(simplified.geometry.coordinates);
    return simplified;
  } catch {
    // fallback: só arredonda sem simplificar
    feature.geometry.coordinates = roundCoords(feature.geometry.coordinates);
    return feature;
  }
}

function rowToFeature(row, propMap, tolerance) {
  const wkt = row.geometry;
  if (!wkt) return null;
  const geom = wellknown.parse(wkt);
  if (!geom) return null;
  const properties = {};
  for (const [key, col] of Object.entries(propMap)) properties[key] = row[col] ?? '';
  const feature = { type: 'Feature', properties, geometry: geom };
  return applySimplify(feature, tolerance);
}

function writeGeoJSON(outPath, features) {
  const fc = { type: 'FeatureCollection', features: features.filter(Boolean) };
  fs.writeFileSync(outPath, JSON.stringify(fc));
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`  ✓ ${path.relative(DATA, outPath)} — ${fc.features.length} feições, ${kb} KB`);
}

async function streamCSV(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const parser = parse({ columns: true, skip_empty_lines: true, relax_quotes: true });
    parser.on('readable', () => { let row; while ((row = parser.read()) !== null) onRow(row); });
    parser.on('error', reject);
    parser.on('end', resolve);
    stream.pipe(parser);
  });
}

async function convertPais() {
  console.log('\nibge_pais.csv → geo/brasil.geojson');
  const features = [];
  await streamCSV(path.join(DATA, 'ibge_pais.csv'), row =>
    features.push(rowToFeature(row, { nm_pais: 'Pais', area_km2: 'AREA_KM2' }, TOLERANCE.overview))
  );
  writeGeoJSON(path.join(GEO, 'brasil.geojson'), features);
}

async function convertRegioes() {
  console.log('\nibge_regioes.csv → geo/regioes.geojson');
  const features = [];
  await streamCSV(path.join(DATA, 'ibge_regioes.csv'), row =>
    features.push(rowToFeature(row, {
      cd_regiao: 'CD_REGIAO', nm_regiao: 'NM_REGIAO', sigla_rg: 'SIGLA_RG'
    }, TOLERANCE.overview))
  );
  writeGeoJSON(path.join(GEO, 'regioes.geojson'), features);
}

async function convertEstados() {
  console.log('\nibge_uf.csv → geo/estados.geojson');
  const features = [];
  await streamCSV(path.join(DATA, 'ibge_uf.csv'), row =>
    features.push(rowToFeature(row, {
      cd_uf: 'CD_UF', nm_estado: 'NM_UF', sigla_uf: 'SIGLA_UF', cd_regiao: 'CD_REGIAO'
    }, TOLERANCE.overview))
  );
  writeGeoJSON(path.join(GEO, 'estados.geojson'), features);
}

async function convertIntermediarias() {
  console.log('\nibge_rg_intermediarias.csv → geo/intermediarias/[CD_UF].geojson');
  const byUF = {};
  await streamCSV(path.join(DATA, 'ibge_rg_intermediarias.csv'), row => {
    const uf = row.CD_UF;
    if (!byUF[uf]) byUF[uf] = [];
    byUF[uf].push(rowToFeature(row, {
      cd_rgint: 'CD_RGINT', nm_rgint: 'NM_RGINT',
      cd_uf: 'CD_UF', sigla_uf: 'SIGLA_UF', cd_regiao: 'CD_REGIAO'
    }, TOLERANCE.mid));
  });
  const dir = path.join(GEO, 'intermediarias');
  for (const [uf, feats] of Object.entries(byUF)) writeGeoJSON(path.join(dir, `${uf}.geojson`), feats);
  console.log(`  → ${Object.keys(byUF).length} arquivos por UF`);
}

async function convertImediatas() {
  console.log('\nibge_rg_imediatas.csv → geo/imediatas/[CD_UF].geojson');
  const byUF = {};
  await streamCSV(path.join(DATA, 'ibge_rg_imediatas.csv'), row => {
    const uf = row.CD_UF;
    if (!byUF[uf]) byUF[uf] = [];
    byUF[uf].push(rowToFeature(row, {
      cd_rgi: 'CD_RGI', nm_rgi: 'NM_RGI',
      cd_rgint: 'CD_RGINT', cd_uf: 'CD_UF', sigla_uf: 'SIGLA_UF', cd_regiao: 'CD_REGIAO'
    }, TOLERANCE.mid));
  });
  const dir = path.join(GEO, 'imediatas');
  for (const [uf, feats] of Object.entries(byUF)) writeGeoJSON(path.join(dir, `${uf}.geojson`), feats);
  console.log(`  → ${Object.keys(byUF).length} arquivos por UF`);
}

async function convertMunicipios() {
  console.log('\nibge_municipios.csv → geo/municipios/[CD_UF].geojson');
  const byUF = {};
  await streamCSV(path.join(DATA, 'ibge_municipios.csv'), row => {
    const uf = row.CD_UF;
    if (!byUF[uf]) byUF[uf] = [];
    byUF[uf].push(rowToFeature(row, {
      cd_mun: 'CD_MUN', nm_mun: 'NM_MUN',
      cd_rgi: 'CD_RGI', cd_rgint: 'CD_RGINT',
      cd_uf: 'CD_UF', sigla_uf: 'SIGLA_UF', cd_regiao: 'CD_REGIAO'
    }, TOLERANCE.detail));
  });
  const dir = path.join(GEO, 'municipios');
  for (const [uf, feats] of Object.entries(byUF)) writeGeoJSON(path.join(dir, `${uf}.geojson`), feats);
  console.log(`  → ${Object.keys(byUF).length} arquivos por UF`);
}

(async () => {
  console.log('=== Convertendo CSVs para GeoJSON ===');
  console.log(`Precisão: ${PRECISION} casas decimais`);
  await convertPais();
  await convertRegioes();
  await convertEstados();
  await convertIntermediarias();
  await convertImediatas();
  await convertMunicipios();
  console.log('\n=== Concluído ===');
})();
