import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { authService } from '../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await authService.login(email, password);

    if (result.success) {
      login(result.token, result.userId, result.nombre, result.exp);
      navigate('/dashboard');
    } else {
      setError(result.error || 'Credenciales inválidas');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden" style={{ backgroundColor: '#F7F8F2' }}>
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: `
          linear-gradient(#3DAF2D 1px, transparent 1px),
          linear-gradient(90deg, #3DAF2D 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 0 0',
        maskImage: 'radial-gradient(ellipse 100% 50% at 50% 0%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 50% at 50% 0%, black 40%, transparent 100%)'
      }}></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Logo */}
        <div className="mb-2 relative">
          <div className="relative w-20 h-20 mx-auto">
            <img src="/inn_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-m font-bold mb-8 text-center" style={{ color: '#276399' }}>
          CULTIVOS AMPARABLES
        </h1>

        {/* Login Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-full text-sm border border-red-200">
                {error}
              </div>
            )}
            
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              disabled={loading}
              className="px-4 py-3 border border-gray-300 rounded-full text-base transition-colors focus:outline-none focus:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Contraseña"
              disabled={loading}
              className="px-4 py-3 border border-gray-300 rounded-full text-base transition-colors focus:outline-none focus:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 px-6 py-3 bg-gray-800 text-white rounded-full text-base font-bold transition-all hover:bg-gray-700 active:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

