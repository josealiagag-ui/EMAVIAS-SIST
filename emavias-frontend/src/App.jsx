import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ObrasList from './pages/obras/ObrasList';
import ObrasForm from './pages/obras/ObrasForm';
import ObrasDetail from './pages/obras/ObrasDetail';
import DespachosList from './pages/despachos/DespachosList';
import DespachosForm from './pages/despachos/DespachosForm';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          <Route path="/obras" element={<PrivateRoute><ObrasList /></PrivateRoute>} />
          <Route path="/obras/nuevo" element={<PrivateRoute><ObrasForm /></PrivateRoute>} />
          <Route path="/obras/:id" element={<PrivateRoute><ObrasDetail /></PrivateRoute>} />
          <Route path="/obras/:id/editar" element={<PrivateRoute><ObrasForm /></PrivateRoute>} />

          <Route path="/despachos" element={<PrivateRoute><DespachosList /></PrivateRoute>} />
          <Route path="/despachos/nuevo" element={<PrivateRoute><DespachosForm /></PrivateRoute>} />
          <Route path="/despachos/:id/editar" element={<PrivateRoute><DespachosForm /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
