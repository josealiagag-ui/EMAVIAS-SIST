import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const INITIAL = {
  fecha: new Date().toISOString().split('T')[0],
  hora: '07:00', n_boleta: '', volqueta: '', conductor: '',
  vol_m3: 8, tipo_mezcla: 'Bacheo', temperatura: 155,
  planta: 'Ciber', responsable: '', codigo_obra: '', destino: ''
};

const VOLQUETAS = ['CV-01','CV-02','CV-03','VH-39','VH-42','VH-45'];
const PLANTAS = ['Ciber','OMIP','Senkata'];
const CONDUCTORES = [
  'Alanez Mercado Victor Hugo','Bautista Llanos Ramiro',
  'Chipana Ticona Nelson Fredy','Pusarico Condori Jorge',
  'Magarinos Loredo Jaime','Merma Garcia Santos Ricardo'
];

const Field = ({ label, name, type='text', required, options, list, form, errors, handleChange, ...props }) => (
  <div className="mb-3">
    <label className="form-label small fw-semibold text-muted">{label}{required && <span className="text-danger ms-1">*</span>}</label>
    {options ? (
      <select name={name} className={`form-select${errors[name]?' is-invalid':''}`} value={form[name]??''} onChange={handleChange} {...props}>
        <option value="">Seleccione...</option>
        {options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    ) : (
      <>
        <input type={type} name={name} className={`form-control${errors[name]?' is-invalid':''}`}
               value={form[name]??''} onChange={handleChange} list={list} {...props}/>
        {list && <datalist id={list}>{(props.suggestions||[]).map(s=><option key={s} value={s}/>)}</datalist>}
      </>
    )}
    {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
  </div>
);

export default function DespachosForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ ...INITIAL, codigo_obra: searchParams.get('obra') || '' });
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [mezclaStats, setMezclaStats] = useState(null);

  useEffect(() => {
    // Load obras for dropdown
    api.get('/obras').then(res => setObras(res.data.data));

    if (isEdit) {
      setLoading(true);
      api.get(`/despachos/${id}`)
        .then(res => setForm(res.data.data))
        .catch(() => showToast('Error al cargar despacho', 'danger'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Auto-fill destino from obra
    if (name === 'codigo_obra') {
      const obra = obras.find(o => o.codigo === value);
      if (obra) setForm(prev => ({ ...prev, codigo_obra: value, destino: `${obra.zona} ${obra.ubicacion}` }));
      fetchMezclaStats(value);
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fecha) e.fecha = 'Requerido';
    if (!form.hora) e.hora = 'Requerido';
    if (!form.n_boleta.trim()) e.n_boleta = 'Requerido';
    if (!form.volqueta.trim()) e.volqueta = 'Requerido';
    if (!form.conductor.trim()) e.conductor = 'Requerido';
    if (!form.codigo_obra.trim()) e.codigo_obra = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/despachos/${id}`, form);
        showToast('Despacho actualizado exitosamente', 'success');
      } else {
        await api.post('/despachos', form);
        showToast('Despacho creado exitosamente', 'success');
      }
      setTimeout(() => navigate('/despachos'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar';
      if (msg.includes('boleta')) setErrors({ n_boleta: msg });
      else showToast(msg, 'danger');
    } finally { setSaving(false); }
  };


  const fetchMezclaStats = async (codigo) => {
    if (!codigo) { setMezclaStats(null); return; }
    try {
      const res = await api.get(`/despachos/mezcla-stats/${codigo}`);
      setMezclaStats(res.data.data);
    } catch {
      setMezclaStats(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };


  if (loading) return <Layout><div className="text-center py-5"><div className="spinner-border text-warning"/></div></Layout>;

  return (
    <Layout>
      {toast && (
        <div className={`alert alert-${toast.type} position-fixed top-0 end-0 m-3 shadow`} style={{zIndex:9999,minWidth:300}}>
          {toast.msg}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0 fw-bold" style={{color:'#1a3a5c'}}>
            <i className={`bi bi-${isEdit?'pencil-square':'truck'} me-2 text-warning`}></i>
            {isEdit ? 'Editar Despacho' : 'Nuevo Despacho'}
          </h4>
          <small className="text-muted">{isEdit ? `Editando boleta: ${form.n_boleta}` : 'Registro de despacho de mezcla asfáltica'}</small>
        </div>
        <Link to="/despachos" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i>Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Datos del Despacho */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-receipt me-2"></i>Datos del Despacho</h6>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Fecha" name="fecha" type="date" required/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Hora" name="hora" type="time" required/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="N° Boleta" name="n_boleta" placeholder="3500" required/></div>
                  <div className="col-6">
                    <Field form={form} errors={errors} handleChange={handleChange} label="Tipo de Mezcla" name="tipo_mezcla" options={['Bacheo','Carpeta','Base']} required/>
                  </div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Volumen (m³)" name="vol_m3" type="number" step="0.01" placeholder="8"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Temperatura (°C)" name="temperatura" type="number" step="0.1" placeholder="155"/></div>
                  <div className="col-6">
                    <Field form={form} errors={errors} handleChange={handleChange} label="Planta" name="planta" options={PLANTAS}/>
                  </div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Responsable" name="responsable" placeholder="Victor 21 / INTECONS"/></div>
                </div>
              </div>
            </div>
          </div>

          {/* Obra y Transporte */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-building me-2"></i>Obra de Destino</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Código de Obra<span className="text-danger ms-1">*</span></label>
                  <select name="codigo_obra" className={`form-select${errors.codigo_obra?' is-invalid':''}`}
                          value={form.codigo_obra} onChange={handleChange}>
                    <option value="">Seleccione una obra...</option>
                    {obras.map(o => (
                      <option key={o.id} value={o.codigo}>{o.codigo} — {o.ubicacion}</option>
                    ))}
                  </select>
                  {errors.codigo_obra && <div className="invalid-feedback">{errors.codigo_obra}</div>}
                </div>
                <Field form={form} errors={errors} handleChange={handleChange} label="Destino (descripción)" name="destino" placeholder="Zona Ubicación"/>
              </div>
            </div>


            {/* Widget mezcla */}
            {mezclaStats && mezclaStats.requerido > 0 && (
              <div className={`alert border-0 shadow-sm mb-3 p-3 ${mezclaStats.excedido ? 'alert-danger' : mezclaStats.porcentaje >= 85 ? 'alert-warning' : 'alert-info'}`}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className="fw-bold">
                    <i className={`bi bi-${mezclaStats.excedido ? 'exclamation-triangle-fill' : mezclaStats.porcentaje >= 85 ? 'exclamation-circle' : 'bar-chart-fill'} me-1`}/>
                    Mezcla para esta obra
                  </small>
                  <small className="fw-bold">{mezclaStats.porcentaje}%</small>
                </div>
                <div className="progress mb-2" style={{height: 8}}>
                  <div
                    className={`progress-bar ${mezclaStats.excedido ? 'bg-danger' : mezclaStats.porcentaje >= 85 ? 'bg-warning' : 'bg-info'}`}
                    style={{width: `${Math.min(mezclaStats.porcentaje, 100)}%`}}
                  />
                </div>
                <div className="d-flex justify-content-between">
                  <small>Despachado: <strong>{mezclaStats.despachado} m³</strong> ({mezclaStats.total_viajes} viajes)</small>
                  <small>Requerido: <strong>{mezclaStats.requerido} m³</strong></small>
                </div>
                {mezclaStats.excedido ? (
                  <div className="mt-1 text-danger fw-bold small">
                    <i className="bi bi-exclamation-triangle-fill me-1"/>
                    ¡EXCEDIDO en {Math.abs(mezclaStats.disponible).toFixed(2)} m³! Verifique antes de registrar.
                  </div>
                ) : (
                  <div className="mt-1 small">
                    Disponible: <strong>{mezclaStats.disponible.toFixed(2)} m³</strong>
                    {mezclaStats.porcentaje >= 85 && <span className="text-warning fw-bold ms-2">⚠ Cerca del límite</span>}
                  </div>
                )}
              </div>
            )}

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-truck me-2"></i>Transporte</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Volqueta<span className="text-danger ms-1">*</span></label>
                  <input name="volqueta" className={`form-control${errors.volqueta?' is-invalid':''}`}
                         value={form.volqueta} onChange={handleChange} list="volquetasList" placeholder="CV-01"/>
                  <datalist id="volquetasList">{VOLQUETAS.map(v=><option key={v} value={v}/>)}</datalist>
                  {errors.volqueta && <div className="invalid-feedback">{errors.volqueta}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Conductor<span className="text-danger ms-1">*</span></label>
                  <input name="conductor" className={`form-control${errors.conductor?' is-invalid':''}`}
                         value={form.conductor} onChange={handleChange} list="conductoresList" placeholder="Nombre completo"/>
                  <datalist id="conductoresList">{CONDUCTORES.map(c=><option key={c} value={c}/>)}</datalist>
                  {errors.conductor && <div className="invalid-feedback">{errors.conductor}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="d-flex gap-3 justify-content-end">
              <Link to="/despachos" className="btn btn-outline-secondary px-4">Cancelar</Link>
              <button type="submit" className="btn btn-warning px-5 fw-bold" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Guardando...</> : <><i className={`bi bi-${isEdit?'check-circle':'truck'} me-2`}/>{isEdit?'Actualizar':'Registrar Despacho'}</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}
