// Módulo de gerenciamento dos seletores (filtros em cascata)
const Filters = (() => {
  const sel = {
    regiao:        document.getElementById('sel-regiao'),
    estado:        document.getElementById('sel-estado'),
    intermediaria: document.getElementById('sel-intermediaria'),
    imediata:      document.getElementById('sel-imediata'),
    municipio:     document.getElementById('sel-municipio'),
  };

  function populate(selectEl, items, valueKey, labelKey) {
    const current = selectEl.value;
    selectEl.innerHTML = '<option value="">— Todos —</option>';
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
    if (items.find(i => i[valueKey] === current)) selectEl.value = current;
  }

  function clearBelow(level) {
    // level: 'regiao' | 'estado' | 'intermediaria' | 'imediata'
    const order = ['regiao', 'estado', 'intermediaria', 'imediata', 'municipio'];
    const idx = order.indexOf(level);
    order.slice(idx + 1).forEach(k => {
      sel[k].innerHTML = '<option value="">— Todos —</option>';
      sel[k].value = '';
    });
  }

  function init(data, onChange) {
    // Regiões — sempre fixo
    populate(sel.regiao, data.regioes, 'cd_regiao', 'nm_regiao');

    sel.regiao.addEventListener('change', () => {
      const cod = sel.regiao.value;
      clearBelow('regiao');
      if (cod) {
        const estadosFiltrados = data.estados.filter(e => String(e.cd_regiao) === String(cod));
        populate(sel.estado, estadosFiltrados, 'cd_uf', 'nm_estado');
      } else {
        populate(sel.estado, data.estados, 'cd_uf', 'nm_estado');
      }
      onChange(getState());
    });

    sel.estado.addEventListener('change', () => {
      const cod = sel.estado.value;
      clearBelow('estado');
      if (cod) {
        const inter = data.intermediarias.filter(i => String(i.cd_uf) === String(cod));
        populate(sel.intermediaria, inter, 'cd_regiao_intermediaria', 'nm_regiao_intermediaria');
        const munic = data.municipios.filter(m => String(m.cd_uf) === String(cod));
        populate(sel.municipio, munic, 'cd_municipio', 'nm_municipio');
      }
      onChange(getState());
    });

    sel.intermediaria.addEventListener('change', () => {
      const cod = sel.intermediaria.value;
      sel.imediata.innerHTML = '<option value="">— Todas —</option>';
      sel.imediata.value = '';
      if (cod) {
        const imed = data.imediatas.filter(i => String(i.cd_regiao_intermediaria) === String(cod));
        populate(sel.imediata, imed, 'cd_regiao_imediata', 'nm_regiao_imediata');
        const munic = data.municipios.filter(m => String(m.cd_regiao_intermediaria) === String(cod));
        populate(sel.municipio, munic, 'cd_municipio', 'nm_municipio');
      }
      onChange(getState());
    });

    sel.imediata.addEventListener('change', () => {
      const cod = sel.imediata.value;
      if (cod) {
        const munic = data.municipios.filter(m => String(m.cd_regiao_imediata) === String(cod));
        populate(sel.municipio, munic, 'cd_municipio', 'nm_municipio');
      }
      onChange(getState());
    });

    sel.municipio.addEventListener('change', () => onChange(getState()));

    // Estado sem região selecionada — popula todos os estados
    populate(sel.estado, data.estados, 'cd_uf', 'nm_estado');
    populate(sel.intermediaria, data.intermediarias, 'cd_regiao_intermediaria', 'nm_regiao_intermediaria');
    populate(sel.imediata, data.imediatas, 'cd_regiao_imediata', 'nm_regiao_imediata');
    populate(sel.municipio, data.municipios, 'cd_municipio', 'nm_municipio');
  }

  function getState() {
    return {
      regiao:        sel.regiao.value,
      estado:        sel.estado.value,
      intermediaria: sel.intermediaria.value,
      imediata:      sel.imediata.value,
      municipio:     sel.municipio.value,
    };
  }

  function reset() {
    Object.values(sel).forEach(s => { s.value = ''; });
  }

  return { init, getState, reset };
})();
