// Módulo de carregamento e índice dos dados geográficos
// Os CSVs serão carregados aqui após upload

const DataStore = (() => {
  // Índices populados após loadAll()
  let regioes = [];
  let estados = [];
  let intermediarias = [];
  let imediatas = [];
  let municipios = [];

  // GeoJSON por nível — populados pela função loadGeoJSON()
  const geo = {
    brasil: null,
    regioes: null,
    estados: null,
    intermediarias: null,
    imediatas: null,
    municipios: null,
  };

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
  }

  async function fetchCSV(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Falha ao carregar ${path}`);
    return parseCSV(await res.text());
  }

  async function loadAll() {
    // Tenta carregar cada nível — arquivos opcionais enquanto não forem enviados
    const tryLoad = async (path) => {
      try { return await fetchCSV(path); }
      catch { return []; }
    };

    [regioes, estados, intermediarias, imediatas, municipios] = await Promise.all([
      tryLoad('data/regioes.csv'),
      tryLoad('data/estados.csv'),
      tryLoad('data/regioes_intermediarias.csv'),
      tryLoad('data/regioes_imediatas.csv'),
      tryLoad('data/municipios.csv'),
    ]);

    // GeoJSON também opcional — será substituído pelos dados reais
    const tryGeo = async (path) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    };

    [geo.brasil, geo.regioes, geo.estados, geo.intermediarias, geo.imediatas, geo.municipios] =
      await Promise.all([
        tryGeo('data/geo/brasil.geojson'),
        tryGeo('data/geo/regioes.geojson'),
        tryGeo('data/geo/estados.geojson'),
        tryGeo('data/geo/regioes_intermediarias.geojson'),
        tryGeo('data/geo/regioes_imediatas.geojson'),
        tryGeo('data/geo/municipios.geojson'),
      ]);
  }

  return { loadAll, get regioes() { return regioes; }, get estados() { return estados; },
    get intermediarias() { return intermediarias; }, get imediatas() { return imediatas; },
    get municipios() { return municipios; }, get geo() { return geo; } };
})();
