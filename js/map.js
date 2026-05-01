// Controle do mapa Leaflet — renderiza camadas por nível geográfico
const MapController = (() => {
  let map;
  const layers = { brasil: null, regioes: null, estados: null,
                   intermediarias: null, imediatas: null, municipios: null };

  const STYLES = {
    brasil:        { color: '#1a4480', weight: 2,   fillColor: '#ccd9f0', fillOpacity: 0.25 },
    regiao:        { color: '#2166ac', weight: 1.5, fillColor: '#74add1', fillOpacity: 0.30 },
    regiaoDest:    { color: '#1a4480', weight: 2.5, fillColor: '#4292c6', fillOpacity: 0.45 },
    estado:        { color: '#41629a', weight: 1,   fillColor: '#9ecae1', fillOpacity: 0.25 },
    estadoDest:    { color: '#08306b', weight: 2.5, fillColor: '#2171b5', fillOpacity: 0.45 },
    intermediaria: { color: '#6a4ca0', weight: 1.5, fillColor: '#bcbddc', fillOpacity: 0.35 },
    imediata:      { color: '#3d6e47', weight: 1.5, fillColor: '#74c476', fillOpacity: 0.35 },
    municipio:     { color: '#666',   weight: 0.6, fillColor: '#fdae6b', fillOpacity: 0.40 },
    municipioDest: { color: '#333',   weight: 2,   fillColor: '#f16913', fillOpacity: 0.60 },
  };

  const BRASIL_BOUNDS = [[-33.75, -73.99], [5.27, -28.84]];

  function init() {
    map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd', maxZoom: 14,
    }).addTo(map);
    map.fitBounds(BRASIL_BOUNDS);
  }

  function clearAll() {
    Object.keys(layers).forEach(k => { if (layers[k]) { map.removeLayer(layers[k]); layers[k] = null; } });
  }

  function addLayer(key, geojson, style, labelProp) {
    if (!geojson) return;
    layers[key] = L.geoJSON(geojson, {
      style: () => style,
      onEachFeature(feature, layer) {
        const name = feature.properties?.[labelProp] ?? '';
        if (name) layer.bindTooltip(name, { sticky: true });
      },
    }).addTo(map);
  }

  function filterGeo(geojson, predicate) {
    if (!geojson) return null;
    const features = geojson.features.filter(predicate);
    return features.length ? { type: 'FeatureCollection', features } : null;
  }

  function fitLayer(key, fallback) {
    const layer = layers[key] ?? (fallback ? layers[fallback] : null);
    if (layer) {
      try { map.fitBounds(layer.getBounds(), { padding: [30, 30] }); return; }
      catch { /* empty bounds */ }
    }
    map.fitBounds(BRASIL_BOUNDS);
  }

  // Sem seleção — Brasil + contorno regiões + contorno estados
  function showDefault(base) {
    clearAll();
    addLayer('brasil',  base.brasil,  STYLES.brasil,  'nm_pais');
    addLayer('regioes', base.regioes, STYLES.regiao,  'nm_regiao');
    addLayer('estados', base.estados, STYLES.estado,  'nm_estado');
    map.fitBounds(BRASIL_BOUNDS);
  }

  // Região selecionada — zoom na região + estados da região
  function showRegiao(base, codRegiao) {
    clearAll();
    addLayer('brasil', base.brasil, STYLES.brasil, 'nm_pais');
    const geoReg = filterGeo(base.regioes, f => String(f.properties?.cd_regiao) === String(codRegiao));
    addLayer('regioes', geoReg, STYLES.regiaoDest, 'nm_regiao');
    const geoUF = filterGeo(base.estados, f => String(f.properties?.cd_regiao) === String(codRegiao));
    addLayer('estados', geoUF, STYLES.estado, 'nm_estado');
    fitLayer('regioes');
  }

  // Estado selecionado — zoom no estado + municípios
  function showEstado(base, uf, codUF) {
    clearAll();
    addLayer('brasil', base.brasil, STYLES.brasil, 'nm_pais');
    const geoUF = filterGeo(base.estados, f => String(f.properties?.cd_uf) === String(codUF));
    addLayer('estados', geoUF, STYLES.estadoDest, 'nm_estado');
    addLayer('municipios', uf.municipios, STYLES.municipio, 'nm_mun');
    fitLayer('estados');
  }

  // Região intermediária — zoom + municípios da intermediária
  function showIntermediaria(base, uf, codRgint, codUF) {
    clearAll();
    addLayer('brasil', base.brasil, STYLES.brasil, 'nm_pais');
    const geoUF = filterGeo(base.estados, f => String(f.properties?.cd_uf) === String(codUF));
    addLayer('estados', geoUF, STYLES.estado, 'nm_estado');
    const geoInter = filterGeo(uf.intermediarias, f => String(f.properties?.cd_rgint) === String(codRgint));
    addLayer('intermediarias', geoInter, STYLES.intermediaria, 'nm_rgint');
    const geoMunic = filterGeo(uf.municipios, f => String(f.properties?.cd_rgint) === String(codRgint));
    addLayer('municipios', geoMunic, STYLES.municipio, 'nm_mun');
    fitLayer('intermediarias', 'estados');
  }

  // Região imediata — zoom + municípios da imediata
  function showImediata(base, uf, codRgi, codUF) {
    clearAll();
    addLayer('brasil', base.brasil, STYLES.brasil, 'nm_pais');
    const geoUF = filterGeo(base.estados, f => String(f.properties?.cd_uf) === String(codUF));
    addLayer('estados', geoUF, STYLES.estado, 'nm_estado');
    const geoImed = filterGeo(uf.imediatas, f => String(f.properties?.cd_rgi) === String(codRgi));
    addLayer('imediatas', geoImed, STYLES.imediata, 'nm_rgi');
    const geoMunic = filterGeo(uf.municipios, f => String(f.properties?.cd_rgi) === String(codRgi));
    addLayer('municipios', geoMunic, STYLES.municipio, 'nm_mun');
    fitLayer('imediatas', 'estados');
  }

  // Município específico
  function showMunicipio(base, geoMunic) {
    clearAll();
    addLayer('municipios', geoMunic, STYLES.municipioDest, 'nm_mun');
    fitLayer('municipios');
  }

  return { init, showDefault, showRegiao, showEstado, showIntermediaria, showImediata, showMunicipio };
})();
