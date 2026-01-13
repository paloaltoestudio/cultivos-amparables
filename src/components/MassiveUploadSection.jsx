import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { cropService } from '../services/cropService';

function MassiveUploadSection({ token, solicitudId = null, onUploadSuccess = null }) {
  const navigate = useNavigate();
  const fileInputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleFileUpload(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await handleFileUpload(file);
      } else {
        setUploadError('Por favor, seleccione un archivo Excel (.xlsx o .xls)');
      }
    }
  };

  const handleFileUpload = async (file) => {
    setUploadError('');
    setUploadedFile(file);
    setUploading(true);

    const response = await cropService.uploadMassiveFile(
      file,
      token,
      solicitudId,
      'Test', // descriptor
      'david@paloaltoestudio.com'
    );

    if (response.success) {
      setShowSuccessMessage(true);
      setUploadedFile(null);
      setUploading(false);
      
      // Call callback if provided (e.g., to reload validations)
      // Delay to ensure modal is visible first
      if (onUploadSuccess) {
        setTimeout(async () => {
          await onUploadSuccess();
        }, 100);
      }
    } else {
      setUploadError(response.error || 'Error al subir el archivo');
      setUploadedFile(null);
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // TODO: Implement template download
    console.log('Download template');
  };

  return (
    <>
      {/* Massive Upload Section */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          isDragging
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-white'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          {uploading ? (
            <>
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm text-gray-600">Subiendo archivo...</p>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Consulta masiva (.xlsx)</h3>
              <p className="text-sm text-gray-500 mb-4">
                Arrastre y suelte su archivo aquí o haga clic para seleccionar
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id={fileInputId}
                disabled={uploading}
              />
              <label
                htmlFor={fileInputId}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-300 transition-colors mb-2"
              >
                Seleccionar archivo
              </label>
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Descargar plantilla
              </button>
              {uploadedFile && (
                <p className="text-sm text-green-600 mt-2">
                  Archivo seleccionado: {uploadedFile.name}
                </p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600 mt-2">{uploadError}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Solicitud Enviada
              </h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Estamos procesando tu solicitud, te enviaremos un email una vez esté lista tu consulta. Puedes cerrar esta ventana o hacer otra petición.
              </p>
              <button
                onClick={() => {
                  setShowSuccessMessage(false);
                  navigate('/dashboard');
                }}
                className="px-6 py-2 bg-gray-800 text-white rounded-full text-base font-medium transition-colors hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MassiveUploadSection;

