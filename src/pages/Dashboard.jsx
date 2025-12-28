import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Dashboard() {
  const navigate = useNavigate();
  const { userId, logout } = useAuthStore((state) => ({
    userId: state.userId,
    logout: state.logout,
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Cultivos Amparables
        </h1>
        <div className="flex items-center gap-5">
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm font-medium transition-colors hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Bienvenido al Panel de Control
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Acciones Rápidas
          </h2>
          <button
            onClick={() => navigate('/nueva-solicitud')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
          >
            Nueva Solicitud
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;

