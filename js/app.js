// Orquestração principal — dados, filtros e mapa
(async () => {
  MapController.init();

  const loading = document.getElementById('loading');
  const setLoading = (on) => { if (loading) loading.style.display = on ? 'flex' : 'none'; };

  setLoading(true);
  await DataStore.loadAll();
  setLoading(false);

  const idx = DataStore.index;

  async function renderMap(state) {
    const base = DataStore.geoBase;

    if (state.municipio) {
      const codUF = DataStore.getUFfromMun(state.municipio);
      if (!codUF) return;
      setLoading(true);
      const uf = await DataStore.loadGeoForUF(codUF);
      setLoading(false);
      const geoMunic = uf.municipios
        ? { type: 'FeatureCollection', features: uf.municipios.features.filter(
            f => String(f.properties?.cd_mun) === String(state.municipio)) }
        : null;
      MapController.showMunicipio(base, geoMunic);

    } else if (state.imediata) {
      const codUF = DataStore.getUFfromRGI(state.imediata);
      if (!codUF) return;
      setLoading(true);
      const uf = await DataStore.loadGeoForUF(codUF);
      setLoading(false);
      MapController.showImediata(base, uf, state.imediata, codUF);

    } else if (state.intermediaria) {
      const codUF = DataStore.getUFfromRGINT(state.intermediaria);
      if (!codUF) return;
      setLoading(true);
      const uf = await DataStore.loadGeoForUF(codUF);
      setLoading(false);
      MapController.showIntermediaria(base, uf, state.intermediaria, codUF);

    } else if (state.estado) {
      setLoading(true);
      const uf = await DataStore.loadGeoForUF(state.estado);
      setLoading(false);
      MapController.showEstado(base, uf, state.estado);

    } else if (state.regiao) {
      MapController.showRegiao(base, state.regiao);

    } else {
      MapController.showDefault(base);
    }
  }

  Filters.init(idx, renderMap);

  document.getElementById('btn-limpar').addEventListener('click', () => {
    Filters.reset(idx);
    renderMap(Filters.getState());
  });

  renderMap(Filters.getState());
})();
