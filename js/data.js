// Carrega índices leves para dropdowns e GeoJSONs (lazy por UF)
const DataStore = (() => {
  let index = { regioes: [], estados: [], intermediarias: [], imediatas: [], municipios: [] };
  const geoBase = { brasil: null, regioes: null, estados: null };
  const geoCache = {}; // keyed by cd_uf

  async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro ao carregar ${url}: ${res.status}`);
    return res.json();
  }

  async function loadAll() {
    [index.regioes, index.estados, index.intermediarias, index.imediatas, index.municipios] =
      await Promise.all([
        loadJSON('data/index/regioes.json'),
        loadJSON('data/index/estados.json'),
        loadJSON('data/index/intermediarias.json'),
        loadJSON('data/index/imediatas.json'),
        loadJSON('data/index/municipios.json'),
      ]);

    [geoBase.brasil, geoBase.regioes, geoBase.estados] =
      await Promise.all([
        loadJSON('data/geo/brasil.geojson'),
        loadJSON('data/geo/regioes.geojson'),
        loadJSON('data/geo/estados.geojson'),
      ]);
  }

  async function loadGeoForUF(codUF) {
    if (geoCache[codUF]) return geoCache[codUF];
    const [municipios, intermediarias, imediatas] = await Promise.all([
      loadJSON(`data/geo/municipios/${codUF}.geojson`).catch(() => null),
      loadJSON(`data/geo/intermediarias/${codUF}.geojson`).catch(() => null),
      loadJSON(`data/geo/imediatas/${codUF}.geojson`).catch(() => null),
    ]);
    geoCache[codUF] = { municipios, intermediarias, imediatas };
    return geoCache[codUF];
  }

  function getUFfromRGINT(cdRgint) {
    return index.intermediarias.find(i => String(i.cd_rgint) === String(cdRgint))?.cd_uf;
  }

  function getUFfromRGI(cdRgi) {
    return index.imediatas.find(i => String(i.cd_rgi) === String(cdRgi))?.cd_uf;
  }

  function getUFfromMun(cdMun) {
    return index.municipios.find(m => String(m.cd_mun) === String(cdMun))?.cd_uf;
  }

  return { loadAll, loadGeoForUF, getUFfromRGINT, getUFfromRGI, getUFfromMun,
           get index() { return index; }, get geoBase() { return geoBase; } };
})();
