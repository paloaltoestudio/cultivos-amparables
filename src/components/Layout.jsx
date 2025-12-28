import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">Cultivos amparables</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => navigate('/nueva-solicitud')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  isActive('/nueva-solicitud')
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Nueva solicitud
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/mis-solicitudes')}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  isActive('/mis-solicitudes')
                    ? 'bg-gray-200 text-gray-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mis solicitudes
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;

