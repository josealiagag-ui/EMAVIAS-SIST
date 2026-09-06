import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const ESTADO_BADGE = { 'Completado':'success', 'En Ejecucion':'warning', 'Planificado':'info' };

export default function ObrasList() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tipo, setTipo] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchObras = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (estado) params.estado = estado;
      if (tipo) params.tipo = tipo;
      const res = await api.get('/obras', { params });
      setObras(res.data.data);
    } catch (e) { showToast('Error al cargar obras', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchObras(); }, [search, estado, tipo]);

  const handleDelete = async () => {
    try {
      await api.delete(`/obras/${deleteId}`);
      showToast('Obra eliminada exitosamente', 'success');
      setDeleteId(null);
      fetchObras();
    } catch (e) { showToast(e.response?.data?.error || 'Error al eliminar', 'danger'); }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow`} style={{zIndex:9999,minWidth:280}}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="mb-0 fw-bold" style={{color:'#1a3a5c'}}>
            <i className="bi bi-building me-2 text-warning"></i>Obras Viales
          </h4>
          <small className="text-muted">{obras.length} registro(s) encontrado(s)</small>
        </div>
        <Link to="/obras/nuevo" className="btn btn-warning">
          <i className="bi bi-plus-circle me-2"></i>Nueva Obra
        </Link>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Buscar por código, ubicación, zona..."
                       value={search} onChange={e => setSearch(e.target.value)}/>
                {search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>✕</button>}
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option>Completado</option>
                <option>En Ejecucion</option>
                <option>Planificado</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option>ASFALTADO</option>
                <option>BACHEO</option>
                <option>BASE</option>
              </select>
            </div>
            <div className="col-12 col-md-1">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setEstado(''); setTipo(''); }}>
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
            ) : obras.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-building-x fs-1 d-block mb-2"></i>No se encontraron obras
              </div>
            ) : (
              <table className="table table-hover mb-0 small align-middle">
                <thead style={{background:'#1a3a5c',color:'white'}}>
                  <tr>
                    <th className="px-3">Código</th>
                    <th>Fecha</th>
                    <th>Ubicación</th>
                    <th>Zona / Unidad</th>
                    <th>Tipo</th>
                    <th className="text-end">Área m²</th>
                    <th className="text-end">Mezcla T</th>
                    <th>Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.map(o => (
                    <tr key={o.id}>
                      <td className="px-3 fw-bold text-primary">{o.codigo}</td>
                      <td>{o.fecha}</td>
                      <td>
                        <div className="fw-semibold">{o.ubicacion}</div>
                      </td>
                      <td>
                        <div>{o.zona}</div>
                        <small className="text-muted">{o.unidad}</small>
                      </td>
                      <td><span className="badge bg-secondary">{o.tipo}</span></td>
                      <td className="text-end fw-bold">{o.area?.toLocaleString('es-BO')}</td>
                      <td className="text-end">{o.cant_mezcla?.toFixed(2)}</td>
                      <td>
                        <span className={`badge bg-${ESTADO_BADGE[o.estado] || 'secondary'}`}>{o.estado}</span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-1 justify-content-center">
                          <Link to={`/obras/${o.id}`} className="btn btn-sm btn-outline-info py-0 px-2" title="Ver">
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link to={`/obras/${o.id}/editar`} className="btn btn-sm btn-outline-warning py-0 px-2" title="Editar">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button className="btn btn-sm btn-outline-danger py-0 px-2" title="Eliminar"
                                  onClick={() => setDeleteId(o.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
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
              <div className="modal-body">¿Está seguro de eliminar esta obra? Esta acción no se puede deshacer.</div>
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
