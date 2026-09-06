import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function DespachosList() {
  const [despachos, setDespachos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoMezcla, setTipoMezcla] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchParams] = useSearchParams();

  // Stats
  const totalM3 = despachos.reduce((s, d) => s + (d.vol_m3 || 0), 0);
  const avgTemp = despachos.length ? (despachos.reduce((s, d) => s + (d.temperatura || 0), 0) / despachos.length).toFixed(1) : 0;

  const fetchDespachos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (tipoMezcla) params.tipo_mezcla = tipoMezcla;
      const codigoObra = searchParams.get('obra');
      if (codigoObra) params.codigo_obra = codigoObra;
      const res = await api.get('/despachos', { params });
      setDespachos(res.data.data);
    } catch (e) { showToast('Error al cargar despachos', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDespachos(); }, [search, tipoMezcla]);

  const handleDelete = async () => {
    try {
      await api.delete(`/despachos/${deleteId}`);
      showToast('Despacho eliminado exitosamente', 'success');
      setDeleteId(null);
      fetchDespachos();
    } catch (e) { showToast(e.response?.data?.error || 'Error al eliminar', 'danger'); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <Layout>
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow`} style={{zIndex:9999,minWidth:280}}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{color:'#1a3a5c'}}>
            <i className="bi bi-truck me-2 text-warning"></i>Despachos de Mezcla
          </h4>
          <small className="text-muted">{despachos.length} registro(s) · {totalM3.toFixed(1)} m³ totales</small>
        </div>
        <Link to="/despachos/nuevo" className="btn btn-warning">
          <i className="bi bi-plus-circle me-2"></i>Nuevo Despacho
        </Link>
      </div>

      {/* Stats mini */}
      <div className="row g-3 mb-4">
        {[
          {label:'Total despachos',val:despachos.length,icon:'📋',color:'#d1ecf1'},
          {label:'Total m³ despachados',val:totalM3.toFixed(1)+' m³',icon:'🏗️',color:'#fff3cd'},
          {label:'Temperatura promedio',val:avgTemp+'°C',icon:'🌡️',color:'#f8d7da'},
          {label:'Obras atendidas',val:new Set(despachos.map(d=>d.codigo_obra)).size,icon:'📍',color:'#d4edda'},
        ].map(({label,val,icon,color})=>(
          <div key={label} className="col-6 col-xl-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3 py-3">
                <span style={{fontSize:'1.8rem'}}>{icon}</span>
                <div>
                  <div className="fw-bold fs-5 mb-0">{val}</div>
                  <div className="text-muted" style={{fontSize:'0.75rem'}}>{label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Buscar por boleta, conductor, obra, volqueta..."
                       value={search} onChange={e => setSearch(e.target.value)}/>
                {search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✕</button>}
              </div>
            </div>
            <div className="col-6 col-md-4">
              <select className="form-select" value={tipoMezcla} onChange={e => setTipoMezcla(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option>Bacheo</option>
                <option>Carpeta</option>
                <option>Base</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setTipoMezcla(''); }}>
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-warning"/></div>
            ) : despachos.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-truck fs-1 d-block mb-2"></i>No se encontraron despachos
              </div>
            ) : (
              <table className="table table-hover mb-0 small align-middle">
                <thead style={{background:'#1a3a5c',color:'white'}}>
                  <tr>
                    <th className="px-3">N° Boleta</th>
                    <th>Fecha / Hora</th>
                    <th>Obra</th>
                    <th>Destino</th>
                    <th>Volqueta</th>
                    <th>Tipo</th>
                    <th className="text-end">m³</th>
                    <th className="text-end">Temp °C</th>
                    <th>Planta</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {despachos.map(d => (
                    <tr key={d.id}>
                      <td className="px-3 fw-bold text-primary">{d.n_boleta}</td>
                      <td>
                        <div>{d.fecha}</div>
                        <small className="text-muted">{d.hora}</small>
                      </td>
                      <td><span className="badge bg-light text-dark border">{d.codigo_obra}</span></td>
                      <td className="text-truncate" style={{maxWidth:150}}>{d.destino}</td>
                      <td>{d.volqueta}</td>
                      <td>
                        <span className={`badge ${d.tipo_mezcla==='Carpeta'?'bg-primary':d.tipo_mezcla==='Bacheo'?'bg-warning text-dark':'bg-secondary'}`}>
                          {d.tipo_mezcla}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success">{d.vol_m3}</td>
                      <td className="text-end">{d.temperatura}°</td>
                      <td>{d.planta}</td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <Link to={`/despachos/${d.id}/editar`} className="btn btn-sm btn-outline-warning py-0 px-2" title="Editar">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button className="btn btn-sm btn-outline-danger py-0 px-2" title="Eliminar"
                                  onClick={() => setDeleteId(d.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={6} className="text-end fw-bold px-3">TOTALES:</td>
                    <td className="text-end fw-bold text-success">{totalM3.toFixed(1)}</td>
                    <td className="text-end text-muted">{avgTemp}°</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title text-danger"><i className="bi bi-exclamation-triangle me-2"></i>Confirmar eliminación</h5>
              </div>
              <div className="modal-body">¿Está seguro de eliminar este despacho?</div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i>Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
