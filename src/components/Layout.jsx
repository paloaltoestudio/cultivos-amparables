import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import useAuthStore from '../store/authStore';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const nombre = useAuthStore((state) => state.nombre);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header - Full Width */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center" style={{ backgroundColor: '#F7F8F2' }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors"
            style={{ color: '#276399' }}
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
          </button>
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <img src="/inn_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-sm sm:text-lg font-bold" style={{ color: '#276399' }}>CULTIVOS AMPARABLES</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {nombre && (
            <div className="hidden sm:flex items-center gap-2">
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
            className="px-3 sm:px-4 py-2 rounded-full border border-black text-black text-xs sm:text-sm font-medium hover:bg-white hover:bg-opacity-50 transition-colors"
            style={{ backgroundColor: '#F7F8F2' }}
          >
            <span className="hidden sm:inline">Cerrar sesion</span>
            <span className="sm:hidden">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Layout - Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ backgroundColor: '#CFD1C5' }}
        >
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => handleNavigation('/dashboard')}
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
                  onClick={() => handleNavigation('/nueva-solicitud')}
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
                  onClick={() => handleNavigation('/mis-solicitudes')}
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
            {/* Mobile User Info */}
            {nombre && (
              <div className="mt-4 pt-4 border-t border-gray-400 sm:hidden">
                <div className="flex items-center gap-2 px-4 py-2">
                  <FontAwesomeIcon 
                    icon={faUser} 
                    className="w-4 h-4" 
                    style={{ color: '#276399' }}
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {nombre}
                  </span>
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-white w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;

