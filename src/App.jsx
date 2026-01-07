import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevaSolicitud from './pages/NuevaSolicitud';
import MisSolicitudes from './pages/MisSolicitudes';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nueva-solicitud"
          element={
            <ProtectedRoute>
              <Layout>
                <NuevaSolicitud />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/mis-solicitudes"
          element={
            <ProtectedRoute>
              <Layout>
                <MisSolicitudes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/nueva-solicitud" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

