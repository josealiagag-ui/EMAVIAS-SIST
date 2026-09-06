import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{background:'linear-gradient(135deg,#1a3a5c,#2d6a9f)'}}>
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
          <img src="/logo.png" alt="EMAVÍAS" height="36" onError={e=>e.target.style.display='none'}/>
          <span className="fw-bold" style={{fontSize:'1.1rem',letterSpacing:1}}>
            <span style={{color:'#ffc107'}}>EMA</span>VÍAS
          </span>
          <span className="badge bg-warning text-dark ms-1" style={{fontSize:'0.65rem'}}>Sistema</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={isActive('/dashboard')} to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/obras')} to="/obras">
                <i className="bi bi-building me-1"></i>Obras
              </Link>
            </li>
            <li className="nav-item">
              <Link className={isActive('/despachos')} to="/despachos">
                <i className="bi bi-truck me-1"></i>Despachos
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav align-items-center">
            <li className="nav-item me-2">
              <span className="nav-link text-light" style={{fontSize:'0.85rem'}}>
                <i className="bi bi-person-circle me-1"></i>
                <strong>{user?.name}</strong>
                <span className="ms-1 text-warning" style={{fontSize:'0.75rem'}}>— {user?.role}</span>
              </span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-warning btn-sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>Salir
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
