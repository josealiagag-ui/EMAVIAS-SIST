import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100" style={{background:'#f0f4f8'}}>
      <Navbar />
      <main className="flex-grow-1 py-4">
        <div className="container-fluid px-4">
          {children}
        </div>
      </main>
      <footer className="text-center py-2 text-muted" style={{fontSize:'0.78rem',background:'#e9ecef',borderTop:'1px solid #dee2e6'}}>
        © 2026 EMAVÍAS — Empresa Municipal de Asfaltos y Vías — La Paz, Bolivia
      </footer>
    </div>
  );
}
