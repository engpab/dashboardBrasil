// Gera arquivos JSON leves para popular os dropdowns (sem geometria)
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const DATA  = path.join(__dirname, '../data');
const INDEX = path.join(DATA, 'index');
fs.mkdirSync(INDEX, { recursive: true });

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

function writeIndex(name, rows) {
  const out = path.join(INDEX, `${name}.json`);
  fs.writeFileSync(out, JSON.stringify(rows));
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`  ✓ index/${name}.json — ${rows.length} itens, ${kb} KB`);
}

(async () => {
  console.log('=== Gerando índices para dropdowns ===\n');

  // Regiões
  const regioes = [];
  await streamCSV(path.join(DATA, 'ibge_regioes.csv'), row =>
    regioes.push({ cd_regiao: row.CD_REGIAO, nm_regiao: row.NM_REGIAO, sigla: row.SIGLA_RG })
  );
  writeIndex('regioes', regioes);

  // Estados
  const estados = [];
  await streamCSV(path.join(DATA, 'ibge_uf.csv'), row =>
    estados.push({ cd_uf: row.CD_UF, nm_estado: row.NM_UF, sigla_uf: row.SIGLA_UF, cd_regiao: row.CD_REGIAO })
  );
  writeIndex('estados', estados);

  // Regiões Intermediárias
  const inter = [];
  await streamCSV(path.join(DATA, 'ibge_rg_intermediarias.csv'), row =>
    inter.push({ cd_rgint: row.CD_RGINT, nm_rgint: row.NM_RGINT, cd_uf: row.CD_UF })
  );
  writeIndex('intermediarias', inter);

  // Regiões Imediatas
  const imed = [];
  await streamCSV(path.join(DATA, 'ibge_rg_imediatas.csv'), row =>
    imed.push({ cd_rgi: row.CD_RGI, nm_rgi: row.NM_RGI, cd_rgint: row.CD_RGINT, cd_uf: row.CD_UF })
  );
  writeIndex('imediatas', imed);

  // Municípios
  const munic = [];
  await streamCSV(path.join(DATA, 'ibge_municipios.csv'), row =>
    munic.push({ cd_mun: row.CD_MUN, nm_mun: row.NM_MUN, cd_rgi: row.CD_RGI, cd_rgint: row.CD_RGINT, cd_uf: row.CD_UF })
  );
  writeIndex('municipios', munic);

  console.log('\n=== Concluído ===');
})();
