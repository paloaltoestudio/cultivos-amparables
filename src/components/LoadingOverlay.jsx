function LoadingOverlay({ 
  show = false, 
  title = 'Procesando validación', 
  message = 'Por favor espere, esto puede tomar unos momentos...' 
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 rounded-full animate-spin" 
            style={{ 
              borderColor: '#3DAF2D',
              borderTopColor: 'transparent',
              borderRightColor: '#3DAF2D',
              borderBottomColor: '#3DAF2D',
              borderLeftColor: '#3DAF2D'
            }}
          ></div>
          <div 
            className="absolute inset-2 border-2 rounded-full animate-spin" 
            style={{ 
              borderColor: '#6BC55A',
              borderTopColor: '#6BC55A',
              borderRightColor: 'transparent',
              borderBottomColor: '#6BC55A',
              borderLeftColor: '#6BC55A',
              animationDirection: 'reverse', 
              animationDuration: '1.5s' 
            }}
          ></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 text-center mb-4">
          {message}
        </p>
        <div className="flex space-x-2">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#3DAF2D', animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#3DAF2D', animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#3DAF2D', animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingOverlay;

