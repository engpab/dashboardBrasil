// Seletores em cascata — popula e filtra com base nos índices
const Filters = (() => {
  const sel = {
    regiao:        document.getElementById('sel-regiao'),
    estado:        document.getElementById('sel-estado'),
    intermediaria: document.getElementById('sel-intermediaria'),
    imediata:      document.getElementById('sel-imediata'),
    municipio:     document.getElementById('sel-municipio'),
  };

  function populate(selectEl, items, valueKey, labelKey, placeholder = '— Todos —') {
    const current = selectEl.value;
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
    if (items.find(i => String(i[valueKey]) === String(current))) selectEl.value = current;
  }

  function resetSelect(selectEl, placeholder = '— Todos —') {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    selectEl.value = '';
  }

  function init(idx, onChange) {
    // Carga inicial de todos os seletores sem filtro
    populate(sel.regiao,        idx.regioes,        'cd_regiao', 'nm_regiao');
    populate(sel.estado,        idx.estados,        'cd_uf',     'nm_estado');
    populate(sel.intermediaria, idx.intermediarias, 'cd_rgint',  'nm_rgint');
    populate(sel.imediata,      idx.imediatas,      'cd_rgi',    'nm_rgi');
    populate(sel.municipio,     idx.municipios,     'cd_mun',    'nm_mun');

    sel.regiao.addEventListener('change', () => {
      const cod = sel.regiao.value;
      // Reseta cascata abaixo
      resetSelect(sel.intermediaria); resetSelect(sel.imediata); resetSelect(sel.municipio);

      const estadosFilt = cod
        ? idx.estados.filter(e => String(e.cd_regiao) === String(cod))
        : idx.estados;
      populate(sel.estado, estadosFilt, 'cd_uf', 'nm_estado');

      onChange(getState());
    });

    sel.estado.addEventListener('change', () => {
      const cod = sel.estado.value;
      resetSelect(sel.intermediaria); resetSelect(sel.imediata); resetSelect(sel.municipio);

      if (cod) {
        populate(sel.intermediaria,
          idx.intermediarias.filter(i => String(i.cd_uf) === String(cod)),
          'cd_rgint', 'nm_rgint');
        populate(sel.imediata,
          idx.imediatas.filter(i => String(i.cd_uf) === String(cod)),
          'cd_rgi', 'nm_rgi');
        populate(sel.municipio,
          idx.municipios.filter(m => String(m.cd_uf) === String(cod)),
          'cd_mun', 'nm_mun');
      } else {
        populate(sel.intermediaria, idx.intermediarias, 'cd_rgint', 'nm_rgint');
        populate(sel.imediata,      idx.imediatas,      'cd_rgi',   'nm_rgi');
        populate(sel.municipio,     idx.municipios,     'cd_mun',   'nm_mun');
      }

      onChange(getState());
    });

    sel.intermediaria.addEventListener('change', () => {
      const cod = sel.intermediaria.value;
      resetSelect(sel.imediata); resetSelect(sel.municipio);

      if (cod) {
        populate(sel.imediata,
          idx.imediatas.filter(i => String(i.cd_rgint) === String(cod)),
          'cd_rgi', 'nm_rgi');
        populate(sel.municipio,
          idx.municipios.filter(m => String(m.cd_rgint) === String(cod)),
          'cd_mun', 'nm_mun');
      } else {
        const codUF = sel.estado.value;
        const baseI = codUF ? idx.imediatas.filter(i => String(i.cd_uf) === String(codUF)) : idx.imediatas;
        const baseM = codUF ? idx.municipios.filter(m => String(m.cd_uf) === String(codUF)) : idx.municipios;
        populate(sel.imediata,  baseI, 'cd_rgi', 'nm_rgi');
        populate(sel.municipio, baseM, 'cd_mun', 'nm_mun');
      }

      onChange(getState());
    });

    sel.imediata.addEventListener('change', () => {
      const cod = sel.imediata.value;
      resetSelect(sel.municipio);

      if (cod) {
        populate(sel.municipio,
          idx.municipios.filter(m => String(m.cd_rgi) === String(cod)),
          'cd_mun', 'nm_mun');
      } else {
        const codRgint = sel.intermediaria.value;
        const codUF    = sel.estado.value;
        let base = idx.municipios;
        if (codRgint) base = base.filter(m => String(m.cd_rgint) === String(codRgint));
        else if (codUF) base = base.filter(m => String(m.cd_uf) === String(codUF));
        populate(sel.municipio, base, 'cd_mun', 'nm_mun');
      }

      onChange(getState());
    });

    sel.municipio.addEventListener('change', () => onChange(getState()));
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

  function reset(idx) {
    Object.values(sel).forEach(s => { s.value = ''; });
    populate(sel.regiao,        idx.regioes,        'cd_regiao', 'nm_regiao');
    populate(sel.estado,        idx.estados,        'cd_uf',     'nm_estado');
    populate(sel.intermediaria, idx.intermediarias, 'cd_rgint',  'nm_rgint');
    populate(sel.imediata,      idx.imediatas,      'cd_rgi',    'nm_rgi');
    populate(sel.municipio,     idx.municipios,     'cd_mun',    'nm_mun');
  }

  return { init, getState, reset };
})();
