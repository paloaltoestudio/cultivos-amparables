import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Acciones Rápidas
        </h2>
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
      </div>
    </div>
  );
}

export default Dashboard;

