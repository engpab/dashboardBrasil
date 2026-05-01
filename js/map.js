// Módulo de controle do mapa Leaflet
const MapController = (() => {
  let map;
  const layers = { brasil: null, regioes: null, estados: null,
                   intermediarias: null, imediatas: null, municipios: null };

  const STYLES = {
    brasil:          { color: '#1a4480', weight: 2, fillColor: '#ccd9f0', fillOpacity: 0.3 },
    regiao:          { color: '#2166ac', weight: 1.5, fillColor: '#74add1', fillOpacity: 0.35 },
    regiaoDest:      { color: '#1a4480', weight: 2.5, fillColor: '#4292c6', fillOpacity: 0.5 },
    estado:          { color: '#41629a', weight: 1, fillColor: '#9ecae1', fillOpacity: 0.3 },
    estadoDest:      { color: '#08306b', weight: 2.5, fillColor: '#2171b5', fillOpacity: 0.5 },
    intermediaria:   { color: '#6a4ca0', weight: 1.5, fillColor: '#bcbddc', fillOpacity: 0.35 },
    imediata:        { color: '#3d6e47', weight: 1.5, fillColor: '#74c476', fillOpacity: 0.35 },
    municipio:       { color: '#555', weight: 0.5, fillColor: '#fdae6b', fillOpacity: 0.4 },
    municipioDest:   { color: '#333', weight: 2, fillColor: '#f16913', fillOpacity: 0.6 },
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

  function addLayer(key, geojson, style, labelProp, onClick) {
    if (!geojson) return;
    layers[key] = L.geoJSON(geojson, {
      style: () => style,
      onEachFeature(feature, layer) {
        const name = feature.properties?.[labelProp] ?? '';
        if (name) layer.bindTooltip(name, { sticky: true, className: 'geo-tooltip' });
        if (onClick) layer.on('click', () => onClick(feature));
      },
    }).addTo(map);
  }

  // Nível 0 — Brasil + contorno regiões + contorno estados (sem seleção)
  function showDefault(geo) {
    clearAll();
    addLayer('brasil',  geo.brasil,  STYLES.brasil,  'nm_pais');
    addLayer('regioes', geo.regioes, STYLES.regiao,  'nm_regiao');
    addLayer('estados', geo.estados, STYLES.estado,  'nm_estado');
    map.fitBounds(BRASIL_BOUNDS);
  }

  // Nível 1 — Zoom numa região + estados da região em destaque
  function showRegiao(geo, codRegiao) {
    clearAll();
    addLayer('brasil', geo.brasil, STYLES.brasil, 'nm_pais');

    // Filtra feições da região selecionada
    const geoRegiao = filterGeo(geo.regioes, f => String(f.properties?.cd_regiao) === String(codRegiao));
    addLayer('regioes', geoRegiao, STYLES.regiaoDest, 'nm_regiao');

    const geoEstados = filterGeo(geo.estados, f => String(f.properties?.cd_regiao) === String(codRegiao));
    addLayer('estados', geoEstados, STYLES.estado, 'nm_estado');

    fitLayer('regioes');
  }

  // Nível 2 — Zoom num estado + municípios do estado
  function showEstado(geo, codUF) {
    clearAll();
    addLayer('brasil', geo.brasil, STYLES.brasil, 'nm_pais');

    const geoEstado = filterGeo(geo.estados, f => String(f.properties?.cd_uf) === String(codUF));
    addLayer('estados', geoEstado, STYLES.estadoDest, 'nm_estado');

    const geoMunic = filterGeo(geo.municipios, f => String(f.properties?.cd_uf) === String(codUF));
    addLayer('municipios', geoMunic, STYLES.municipio, 'nm_municipio');

    fitLayer('estados');
  }

  // Nível 3 — Zoom numa região intermediária + municípios
  function showIntermediaria(geo, codInter) {
    clearAll();
    addLayer('brasil', geo.brasil, STYLES.brasil, 'nm_pais');

    const geoInter = filterGeo(geo.intermediarias, f => String(f.properties?.cd_regiao_intermediaria) === String(codInter));
    addLayer('intermediarias', geoInter, STYLES.intermediaria, 'nm_regiao_intermediaria');

    const geoMunic = filterGeo(geo.municipios, f => String(f.properties?.cd_regiao_intermediaria) === String(codInter));
    addLayer('municipios', geoMunic, STYLES.municipio, 'nm_municipio');

    fitLayer('intermediarias');
  }

  // Nível 4 — Zoom numa região imediata + municípios
  function showImediata(geo, codImed) {
    clearAll();
    addLayer('brasil', geo.brasil, STYLES.brasil, 'nm_pais');

    const geoImed = filterGeo(geo.imediatas, f => String(f.properties?.cd_regiao_imediata) === String(codImed));
    addLayer('imediatas', geoImed, STYLES.imediata, 'nm_regiao_imediata');

    const geoMunic = filterGeo(geo.municipios, f => String(f.properties?.cd_regiao_imediata) === String(codImed));
    addLayer('municipios', geoMunic, STYLES.municipio, 'nm_municipio');

    fitLayer('imediatas');
  }

  // Nível 5 — Zoom num município
  function showMunicipio(geo, codMunic) {
    clearAll();
    const geoMunic = filterGeo(geo.municipios, f => String(f.properties?.cd_municipio) === String(codMunic));
    addLayer('municipios', geoMunic, STYLES.municipioDest, 'nm_municipio');
    fitLayer('municipios');
  }

  function filterGeo(geojson, predicate) {
    if (!geojson) return null;
    return { ...geojson, features: geojson.features.filter(predicate) };
  }

  function fitLayer(key) {
    if (layers[key]) {
      try { map.fitBounds(layers[key].getBounds(), { padding: [30, 30] }); }
      catch { map.fitBounds(BRASIL_BOUNDS); }
    }
  }

  return { init, showDefault, showRegiao, showEstado, showIntermediaria, showImediata, showMunicipio };
})();
