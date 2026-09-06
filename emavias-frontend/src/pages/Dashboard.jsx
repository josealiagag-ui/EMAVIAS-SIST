import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ESTADO_COLORS = {
  'Completado':   { bg: '#d4edda', text: '#155724', badge: 'success' },
  'En Ejecucion': { bg: '#fff3cd', text: '#856404', badge: 'warning' },
  'Planificado':  { bg: '#d1ecf1', text: '#0c5460', badge: 'info' },
};

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex align-items-center gap-3">
          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
               style={{width:56,height:56,background:color,fontSize:'1.5rem'}}>
            {icon}
          </div>
          <div>
            <div className="fw-bold fs-4 mb-0" style={{lineHeight:1}}>{value}</div>
            <div className="text-muted small">{label}</div>
            {sub && <div className="text-muted" style={{fontSize:'0.72rem'}}>{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/obras/stats/summary'),
      api.get('/despachos?limit=5'),
    ]).then(([obrasRes, despachoRes]) => {
      setStats(obrasRes.data.data);
      setDespachos(despachoRes.data.data.slice(0,5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="text-center py-5"><div className="spinner-border text-warning"/></div></Layout>;

  const totalM3 = despachos.reduce((s, d) => s + (d.vol_m3 || 0), 0);

  return (
    <Layout>
      {/* Welcome */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{color:'#1a3a5c'}}>
            <i className="bi bi-speedometer2 me-2 text-warning"></i>
            Panel de Control
          </h4>
          <small className="text-muted">Bienvenido, <strong>{user?.name}</strong> — {new Date().toLocaleDateString('es-BO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</small>
        </div>
        <div className="d-flex gap-2">
          <Link to="/obras/nuevo" className="btn btn-warning btn-sm">
            <i className="bi bi-plus-circle me-1"></i>Nueva Obra
          </Link>
          <Link to="/despachos/nuevo" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-plus-circle me-1"></i>Nuevo Despacho
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <StatCard label="Total de Obras" value={stats?.totalObras ?? 0} icon="🏗️" color="#fff3cd" sub="Registradas en el sistema"/>
        <StatCard label="Área Total" value={`${((stats?.totalArea||0)/1000).toFixed(1)}K m²`} icon="📐" color="#d1ecf1" sub="Superficie pavimentada"/>
        <StatCard label="Últimos Despachos" value={despachos.length} icon="🚛" color="#d4edda" sub={`${totalM3.toFixed(1)} m³ totales`}/>
        <StatCard label="Completadas" value={stats?.porEstado?.find(e=>e.estado==='Completado')?.cnt ?? 0} icon="✅" color="#f8d7da" sub="Obras finalizadas"/>
      </div>

      <div className="row g-4">
        {/* Estado de Obras */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 pt-3 pb-0">
              <h6 className="fw-bold mb-0" style={{color:'#1a3a5c'}}>
                <i className="bi bi-pie-chart me-2 text-warning"></i>Estado de Obras
              </h6>
            </div>
            <div className="card-body">
              {stats?.porEstado?.map(({ estado, cnt }) => {
                const pct = Math.round((cnt / stats.totalObras) * 100);
                const cfg = ESTADO_COLORS[estado] || { badge:'secondary' };
                return (
                  <div key={estado} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={`badge bg-${cfg.badge}`}>{estado}</span>
                      <span className="fw-bold small">{cnt} obras ({pct}%)</span>
                    </div>
                    <div className="progress" style={{height:8}}>
                      <div className={`progress-bar bg-${cfg.badge}`} style={{width:`${pct}%`}}/>
                    </div>
                  </div>
                );
              })}
              <hr/>
              {stats?.porTipo?.map(({tipo,cnt})=>(
                <div key={tipo} className="d-flex justify-content-between small py-1 border-bottom">
                  <span><i className="bi bi-circle-fill me-2 text-warning" style={{fontSize:'0.5rem'}}></i>{tipo}</span>
                  <strong>{cnt}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Obras Recientes */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 pb-0">
              <h6 className="fw-bold mb-0" style={{color:'#1a3a5c'}}>
                <i className="bi bi-clock-history me-2 text-warning"></i>Obras Recientes
              </h6>
              <Link to="/obras" className="btn btn-outline-primary btn-sm py-0">Ver todas</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th><th>Ubicación</th><th>Área m²</th><th>Estado</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recientes?.map(o => {
                      const cfg = ESTADO_COLORS[o.estado] || {badge:'secondary'};
                      return (
                        <tr key={o.id}>
                          <td className="fw-bold text-primary">{o.codigo}</td>
                          <td>
                            <div>{o.ubicacion}</div>
                            <small className="text-muted">{o.zona}</small>
                          </td>
                          <td>{o.area?.toLocaleString()}</td>
                          <td><span className={`badge bg-${cfg.badge}`}>{o.estado}</span></td>
                          <td>
                            <Link to={`/obras/${o.id}`} className="btn btn-sm btn-outline-secondary py-0 px-2">
                              <i className="bi bi-eye"></i>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Últimos Despachos */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3 pb-0">
              <h6 className="fw-bold mb-0" style={{color:'#1a3a5c'}}>
                <i className="bi bi-truck me-2 text-warning"></i>Últimos Despachos
              </h6>
              <Link to="/despachos" className="btn btn-outline-primary btn-sm py-0">Ver todos</Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 small">
                  <thead className="table-light">
                    <tr><th>Boleta</th><th>Fecha</th><th>Obra</th><th>Volqueta</th><th>Mezcla</th><th>m³</th><th>Temp °C</th></tr>
                  </thead>
                  <tbody>
                    {despachos.map(d => (
                      <tr key={d.id}>
                        <td className="fw-bold">{d.n_boleta}</td>
                        <td>{d.fecha} {d.hora}</td>
                        <td><span className="badge bg-light text-dark border">{d.codigo_obra}</span></td>
                        <td>{d.volqueta}</td>
                        <td>{d.tipo_mezcla}</td>
                        <td className="fw-bold text-success">{d.vol_m3}</td>
                        <td>{d.temperatura}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
