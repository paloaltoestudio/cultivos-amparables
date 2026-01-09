import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const nombre = useAuthStore((state) => state.nombre);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Full Width */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ backgroundColor: '#F7F8F2' }}>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <img src="/inn_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-lg font-bold" style={{ color: '#276399' }}>CULTIVOS AMPARABLES</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {nombre && (
            <div className="flex items-center gap-2">
              <FontAwesomeIcon 
                icon={faUser} 
                className="w-5 h-5" 
                style={{ color: '#276399' }}
              />
              <span className="text-sm font-medium" style={{ color: '#276399' }}>
                {nombre}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-full border border-black text-black text-sm font-medium hover:bg-white hover:bg-opacity-50 transition-colors"
            style={{ backgroundColor: '#F7F8F2' }}
          >
            Cerrar sesion
          </button>
        </div>
      </header>

      {/* Main Layout - Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col" style={{ backgroundColor: '#CFD1C5' }}>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-full transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-white text-black font-medium'
                      : 'bg-white text-black hover:bg-opacity-90'
                  }`}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/nueva-solicitud')}
                  className={`w-full text-left px-4 py-3 rounded-full transition-colors ${
                    isActive('/nueva-solicitud')
                      ? 'bg-white text-black font-medium'
                      : 'bg-white text-black hover:bg-opacity-90'
                  }`}
                >
                  Nueva solicitud
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/mis-solicitudes')}
                  className={`w-full text-left px-4 py-3 rounded-full transition-colors ${
                    isActive('/mis-solicitudes')
                      ? 'bg-white text-black font-medium'
                      : 'bg-white text-black hover:bg-opacity-90'
                  }`}
                >
                  Mis solicitudes
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;

