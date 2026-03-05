import axios from 'axios';

const DASHBOARD_BASE =
  import.meta.env.VITE_DASHBOARD_API_URL || 'https://visor.inn.com.co:8009';

/**
 * @typedef {Object} BoardFilters
 * @property {string} [cultivo] - Cultivo or '*' for all (default '*')
 * @property {string} [departamento] - Departamento or '*' for all (default '*')
 * @property {boolean} [anio_actual] - Filter current year (default true)
 * @property {boolean} [anio_anterior] - Filter previous year (default false)
 * @property {boolean} [ultimos_3m] - Filter last 3 months (default false)
 * @property {boolean} [mes_anterior] - Filter previous month (default false)
 */

/**
 * Fetches dashboard board data with optional filters.
 * @param {string} token - Auth token (required)
 * @param {BoardFilters} [filters] - Optional query params
 * @returns {Promise<{ solicitudes_por_cultivo, solicitudes_geograficas, solicitudes_por_departamento, solicitudes_por_mes }>}
 */
export async function fetchBoardData(token, filters = {}) {
  const params = new URLSearchParams();
  params.set('token', token);
  params.set('cultivo', filters.cultivo ?? '*');
  params.set('departamento', filters.departamento ?? '*');
  params.set('anio_actual', String(filters.anio_actual ?? true));
  params.set('anio_anterior', String(filters.anio_anterior ?? false));
  params.set('ultimos_3m', String(filters.ultimos_3m ?? false));
  params.set('mes_anterior', String(filters.mes_anterior ?? false));

  const url = `${DASHBOARD_BASE}/dashboard/board?${params.toString()}`;
  const response = await axios.get(url);
  return response.data;
}
