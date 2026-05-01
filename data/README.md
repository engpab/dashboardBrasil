# Dados

Coloque aqui os arquivos CSV e GeoJSON conforme a estrutura abaixo.

## CSVs esperados

| Arquivo | Colunas mínimas |
|---|---|
| `regioes.csv` | `cd_regiao`, `nm_regiao` |
| `estados.csv` | `cd_uf`, `nm_estado`, `cd_regiao` |
| `regioes_intermediarias.csv` | `cd_regiao_intermediaria`, `nm_regiao_intermediaria`, `cd_uf` |
| `regioes_imediatas.csv` | `cd_regiao_imediata`, `nm_regiao_imediata`, `cd_regiao_intermediaria` |
| `municipios.csv` | `cd_municipio`, `nm_municipio`, `cd_uf`, `cd_regiao_intermediaria`, `cd_regiao_imediata` |

## GeoJSONs esperados (pasta `geo/`)

- `brasil.geojson` — polígono do país (`nm_pais`)
- `regioes.geojson` — polígonos das 5 regiões (`cd_regiao`, `nm_regiao`)
- `estados.geojson` — polígonos dos estados (`cd_uf`, `nm_estado`, `cd_regiao`)
- `regioes_intermediarias.geojson` (`cd_regiao_intermediaria`, `nm_regiao_intermediaria`, `cd_uf`)
- `regioes_imediatas.geojson` (`cd_regiao_imediata`, `nm_regiao_imediata`, `cd_regiao_intermediaria`)
- `municipios.geojson` (`cd_municipio`, `nm_municipio`, `cd_uf`, `cd_regiao_intermediaria`, `cd_regiao_imediata`)
