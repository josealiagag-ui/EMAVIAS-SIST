import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
         style={{background:'linear-gradient(135deg,#1a3a5c 0%,#2d6a9f 50%,#1a3a5c 100%)'}}>
      <div className="card shadow-lg" style={{width:'100%',maxWidth:420,borderRadius:16,overflow:'hidden'}}>
        {/* Header */}
        <div className="text-center py-4 px-4" style={{background:'linear-gradient(135deg,#1a3a5c,#2d6a9f)'}}>
          <div className="mb-2" style={{fontSize:'2.5rem'}}>🏗️</div>
          <h3 className="text-white fw-bold mb-0">
            <span style={{color:'#ffc107'}}>EMA</span>VÍAS
          </h3>
          <p className="text-white-50 small mb-0">Sistema de Gestión de Obras Viales</p>
          <p className="text-white-50" style={{fontSize:'0.75rem'}}>Gerencia Técnica — La Paz, Bolivia</p>
        </div>

        {/* Form */}
        <div className="card-body px-4 py-4">
          {error && (
            <div className="alert alert-danger py-2 px-3 small" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>{error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small text-muted">USUARIO</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-person"></i></span>
                <input type="text" name="username" className="form-control" placeholder="Ingrese su usuario"
                       value={form.username} onChange={handleChange} required autoFocus/>
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small text-muted">CONTRASEÑA</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input type="password" name="password" className="form-control" placeholder="Ingrese su contraseña"
                       value={form.password} onChange={handleChange} required/>
              </div>
            </div>
            <button type="submit" className="btn btn-warning w-100 fw-bold py-2" disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"/></> : <><i className="bi bi-box-arrow-in-right me-2"/></>}
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <hr className="my-3"/>
          <p className="text-center small text-muted mb-1">Usuarios de prueba:</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            {[{u:'admin',p:'1234'},{u:'tony',p:'emavias2025'},{u:'gerente',p:'gerencia'}].map(({u,p})=>(
              <button key={u} className="btn btn-outline-secondary btn-sm" style={{fontSize:'0.72rem'}}
                onClick={()=>setForm({username:u,password:p})}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
