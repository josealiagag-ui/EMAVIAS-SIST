import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const ESTADO_BADGE = { 'Completado':'success', 'En Ejecucion':'warning', 'Planificado':'info' };

function InfoRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between py-2 border-bottom">
      <span className="text-muted small">{label}</span>
      <span className="fw-semibold small text-end">{value || '—'}</span>
    </div>
  );
}

export default function ObrasDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/obras/${id}`),
      api.get(`/despachos?codigo_obra=`).then(r => r) // will filter below
    ]).then(([obraRes, _]) => {
      const o = obraRes.data.data;
      setObra(o);
      return api.get(`/despachos?codigo_obra=${o.codigo}`);
    }).then(despachoRes => {
      setDespachos(despachoRes.data.data);
    }).catch(()=>navigate('/obras'))
    .finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <Layout><div className="text-center py-5"><div className="spinner-border text-warning"/></div></Layout>;
  if (!obra) return null;

  const badge = ESTADO_BADGE[obra.estado] || 'secondary';

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{color:'#1a3a5c'}}>
            <i className="bi bi-building me-2 text-warning"></i>
            {obra.codigo} — {obra.ubicacion}
          </h4>
          <small className="text-muted">{obra.zona} · {obra.unidad}</small>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/obras/${id}/editar`} className="btn btn-warning btn-sm">
            <i className="bi bi-pencil me-1"></i>Editar
          </Link>
          <Link to="/obras" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-arrow-left me-1"></i>Volver
          </Link>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-info-circle me-2"></i>Información General</h6>
            </div>
            <div className="card-body">
              <InfoRow label="Código" value={obra.codigo}/>
              <InfoRow label="Fecha" value={obra.fecha}/>
              <InfoRow label="Tipo" value={obra.tipo}/>
              <InfoRow label="Grupo" value={obra.grupo}/>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Estado</span>
                <span className={`badge bg-${badge}`}>{obra.estado}</span>
              </div>
              <InfoRow label="Personal" value={`${obra.personal} personas`}/>
              <InfoRow label="Horas" value={`${obra.horas} horas`}/>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-rulers me-2"></i>Dimensiones</h6>
            </div>
            <div className="card-body">
              <InfoRow label="Longitud" value={`${obra.longitud} m`}/>
              <InfoRow label="Ancho" value={`${obra.ancho} m`}/>
              <div className="text-center my-3 p-3 rounded" style={{background:'#f0f4f8'}}>
                <div className="fs-2 fw-bold text-primary">{obra.area?.toLocaleString('es-BO')}</div>
                <div className="text-muted small">m² de área total</div>
              </div>
              <InfoRow label="Boleta Mezcla" value={obra.boleta_mezcla}/>
              <InfoRow label="Cant. Mezcla" value={`${obra.cant_mezcla} T`}/>
              <InfoRow label="Tipo Ligante" value={obra.tipo_ligante}/>
              <InfoRow label="Cant. Ligante" value={`${obra.cant_ligante} L`}/>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-white border-bottom">
              <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-chat-left-text me-2"></i>Observaciones</h6>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-0">{obra.observaciones || 'Sin observaciones'}</p>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom d-flex justify-content-between">
              <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-truck me-2"></i>Despachos ({despachos.length})</h6>
              <Link to={`/despachos/nuevo?obra=${obra.codigo}`} className="btn btn-sm btn-outline-primary py-0">+ Agregar</Link>
            </div>
            <div className="card-body p-0">
              {despachos.length === 0 ? (
                <p className="text-center text-muted small py-3 mb-0">Sin despachos registrados</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {despachos.slice(0,5).map(d => (
                    <li key={d.id} className="list-group-item d-flex justify-content-between align-items-center small">
                      <div>
                        <div className="fw-bold">Boleta {d.n_boleta}</div>
                        <div className="text-muted">{d.fecha} · {d.tipo_mezcla}</div>
                      </div>
                      <span className="badge bg-success">{d.vol_m3} m³</span>
                    </li>
                  ))}
                  {despachos.length > 5 && (
                    <li className="list-group-item text-center">
                      <Link to={`/despachos?obra=${obra.codigo}`} className="text-primary small">Ver todos ({despachos.length})</Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
