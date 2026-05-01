// Ponto de entrada — orquestra dados, filtros e mapa
(async () => {
  MapController.init();

  await DataStore.loadAll();

  const data = {
    regioes:        DataStore.regioes,
    estados:        DataStore.estados,
    intermediarias: DataStore.intermediarias,
    imediatas:      DataStore.imediatas,
    municipios:     DataStore.municipios,
  };

  function renderMap(state) {
    const geo = DataStore.geo;

    if (state.municipio) {
      MapController.showMunicipio(geo, state.municipio);
    } else if (state.imediata) {
      MapController.showImediata(geo, state.imediata);
    } else if (state.intermediaria) {
      MapController.showIntermediaria(geo, state.intermediaria);
    } else if (state.estado) {
      MapController.showEstado(geo, state.estado);
    } else if (state.regiao) {
      MapController.showRegiao(geo, state.regiao);
    } else {
      MapController.showDefault(geo);
    }
  }

  Filters.init(data, renderMap);

  document.getElementById('btn-limpar').addEventListener('click', () => {
    Filters.reset();
    renderMap(Filters.getState());
  });

  // Estado inicial — mostra Brasil + regiões + estados
  renderMap(Filters.getState());
})();
