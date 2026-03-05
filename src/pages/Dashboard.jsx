import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useAuthStore from '../store/authStore';
import { fetchBoardData } from '../services/dashboardService';
import DashboardMap from '../components/DashboardMap';

const CHART_SKELETON_HEIGHT = 320;

function ChartCardSkeleton() {
  return (
    <div className="flex flex-col h-[320px]" data-testid="chart-skeleton">
      <Skeleton height={24} width="80%" className="mb-4" />
      <div className="flex-1 flex flex-col justify-end gap-3">
        {[70, 50, 85, 60, 45].map((w, i) => (
          <Skeleton key={i} height={28} width={`${w}%`} />
        ))}
      </div>
    </div>
  );
}

function MapCardSkeleton() {
  return (
    <div className="h-[320px] flex flex-col" data-testid="map-skeleton">
      <Skeleton height={24} width="75%" className="mb-4" />
      <Skeleton height={260} className="rounded-lg" />
    </div>
  );
}

const MES_LABELS = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

const PERIOD_OPTIONS = [
  { value: 'anio_actual', label: 'Año actual', filters: { anio_actual: true, anio_anterior: false, ultimos_3m: false, mes_anterior: false } },
  { value: 'anio_anterior', label: 'Año anterior', filters: { anio_actual: false, anio_anterior: true, ultimos_3m: false, mes_anterior: false } },
  { value: 'ultimos_3m', label: 'Últimos 3 meses', filters: { anio_actual: false, anio_anterior: false, ultimos_3m: true, mes_anterior: false } },
  { value: 'mes_anterior', label: 'Mes anterior', filters: { anio_actual: false, anio_anterior: false, ultimos_3m: false, mes_anterior: true } },
];

const PLOTLY_LAYOUT_BASE = {
  margin: { t: 40, r: 20, b: 40, l: 60 },
  paper_bgcolor: 'white',
  plot_bgcolor: 'white',
  font: { family: 'inherit', size: 12 },
  xaxis: { showgrid: true, gridcolor: '#f0f0f0', zeroline: false },
  yaxis: { showgrid: true, gridcolor: '#f0f0f0', zeroline: false },
  showlegend: false,
  hovermode: 'closest',
};

function Dashboard() {
  const navigate = useNavigate();
  const { token } = useAuthStore((state) => ({ token: state.token }));
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [periodFilter, setPeriodFilter] = useState('anio_actual');
  const [cropFilter, setCropFilter] = useState('*');
  const [zoneFilter, setZoneFilter] = useState('*');

  useEffect(() => {
    if (!token) return;
    const period = PERIOD_OPTIONS.find((p) => p.value === periodFilter);
    const filters = {
      cultivo: cropFilter,
      departamento: zoneFilter,
      ...(period?.filters ?? PERIOD_OPTIONS[0].filters),
    };
    setLoading(true);
    setError(null);
    fetchBoardData(token, filters)
      .then(setBoardData)
      .catch((err) => setError(err?.message || 'Error al cargar el tablero'))
      .finally(() => setLoading(false));
  }, [token, periodFilter, cropFilter, zoneFilter]);

  const isInitialLoad = loading && !boardData;

  const cropOptions = useMemo(() => {
    const list = boardData?.solicitudes_por_cultivo ?? [];
    const cultivos = [...new Set(list.map((d) => d.cultivo))].filter(Boolean).sort();
    return cultivos.map((cultivo) => ({ value: cultivo, label: cultivo }));
  }, [boardData?.solicitudes_por_cultivo]);

  const zoneOptions = useMemo(() => {
    const list = boardData?.solicitudes_por_departamento ?? [];
    const deptos = [...new Set(list.map((d) => d.depto))].filter(Boolean).sort();
    return deptos.map((depto) => ({ value: depto, label: depto }));
  }, [boardData?.solicitudes_por_departamento]);

  const chartPorCultivo = useMemo(() => {
    const list = boardData?.solicitudes_por_cultivo ?? [];
    const y = list.map((d) => d.cultivo);
    const x = list.map((d) => d.solicitudes);
    return {
      data: [
        {
          type: 'bar',
          orientation: 'h',
          x,
          y,
          marker: { color: '#7eb8da' },
          text: x,
          textposition: 'outside',
        },
      ],
      layout: {
        ...PLOTLY_LAYOUT_BASE,
        title: 'Solicitudes de validación por tipo de cultivo',
        xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: '', range: [0, Math.max(...x, 1) * 1.05] },
        yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, categoryorder: 'total ascending', title: '' },
        height: 280,
      },
    };
  }, [boardData?.solicitudes_por_cultivo]);

  const chartPorEstado = useMemo(() => {
    const list = boardData?.solicitudes_por_departamento ?? [];
    const x = list.map((d) => d.depto);
    const y = list.map((d) => d.solicitudes);
    return {
      data: [
        {
          type: 'bar',
          x,
          y,
          marker: { color: '#7eb8da' },
          text: y,
          textposition: 'outside',
        },
      ],
      layout: {
        ...PLOTLY_LAYOUT_BASE,
        title: 'Solicitudes de validación por estado',
        xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: '' },
        yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: '' },
        height: 280,
      },
    };
  }, [boardData?.solicitudes_por_departamento]);

  const chartPorMes = useMemo(() => {
    const list = boardData?.solicitudes_por_mes ?? [];
    const sorted = [...list].sort((a, b) => a.anio_mes.localeCompare(b.anio_mes));
    const labels = sorted.map((d) => {
      const [, mes] = d.anio_mes.split('-');
      return MES_LABELS[mes] || mes;
    });
    const y = sorted.map((d) => d.solicitudes);
    return {
      data: [
        {
          type: 'scatter',
          mode: 'lines+markers',
          x: labels,
          y,
          marker: { color: '#7eb8da', size: 8 },
          line: { color: '#7eb8da', width: 2 },
        },
      ],
      layout: {
        ...PLOTLY_LAYOUT_BASE,
        title: 'Solicitudes de validación por mes',
        xaxis: { ...PLOTLY_LAYOUT_BASE.xaxis, title: '' },
        yaxis: { ...PLOTLY_LAYOUT_BASE.yaxis, title: '' },
        height: 280,
      },
    };
  }, [boardData?.solicitudes_por_mes]);

  if (error && !boardData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const showFilters = !isInitialLoad;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {isInitialLoad ? (
          <Skeleton height={32} width={280} />
        ) : (
          <h1 className="text-2xl font-bold text-gray-800">Tablero de Control</h1>
        )}
        {isInitialLoad ? (
          <div className="flex flex-wrap gap-3">
            <Skeleton height={40} width={160} borderRadius={8} />
            <Skeleton height={40} width={160} borderRadius={8} />
            <Skeleton height={40} width={160} borderRadius={8} />
          </div>
        ) : showFilters ? (
          <div className="flex flex-wrap gap-3">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Período"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Tipo de cultivo"
            >
              <option value="*">Tipo de cultivo (todos)</option>
              {cropOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              disabled={loading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Zona geográfica"
            >
              <option value="*">Zona geográfica (todas)</option>
              {zoneOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
            ))}
          </select>
          </div>
        ) : null}
      </div>

      {error && boardData && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-h-[320px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitudes de validación por tipo de cultivo</h2>
          {loading ? <ChartCardSkeleton /> : (
            <Plot
              data={chartPorCultivo.data}
              layout={chartPorCultivo.layout}
              config={{ responsive: true }}
              className="w-full"
            />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-h-[320px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitudes de validación por zona geográfica</h2>
          {loading ? (
            <MapCardSkeleton />
          ) : (
            <DashboardMap
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
              markers={boardData?.solicitudes_geograficas ?? []}
            />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-h-[320px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitudes de validación por estado</h2>
          {loading ? <ChartCardSkeleton /> : (
            <Plot
              data={chartPorEstado.data}
              layout={chartPorEstado.layout}
              config={{ responsive: true }}
              className="w-full"
            />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-h-[320px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Solicitudes de validación por mes</h2>
          {loading ? <ChartCardSkeleton /> : (
            <Plot
              data={chartPorMes.data}
              layout={chartPorMes.layout}
              config={{ responsive: true }}
              className="w-full"
            />
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {isInitialLoad ? (
          <>
            <Skeleton height={24} width={180} className="mb-4" />
            <Skeleton width={160} height={44} className="rounded-lg" />
            <Skeleton width={140} height={44} className="rounded-lg ml-4 inline-block" />
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
            <button
              onClick={() => navigate('/nueva-solicitud')}
              className="px-6 py-3 border border-black text-black rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 hover:bg-black hover:text-white active:translate-y-0"
            >
              Nueva Solicitud
            </button>
            <button
              onClick={() => navigate('/mis-solicitudes')}
              className="ml-4 px-6 py-3 border border-black text-black rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 hover:bg-black hover:text-white active:translate-y-0"
            >
              Mis solicitudes
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
