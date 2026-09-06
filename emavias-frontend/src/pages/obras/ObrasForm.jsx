import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const INITIAL = {
  fecha: new Date().toISOString().split('T')[0],
  codigo: '', unidad: '', ubicacion: '', zona: '',
  longitud: '', ancho: 1, area: '',
  tipo: 'ASFALTADO', grupo: '', estado: 'Planificado',
  personal: 12, horas: 8,
  cant_mezcla: 0,
  tipo_ligante: '', cant_ligante: 0,
  observaciones: ''
};

const Field = ({ label, name, type='text', required, options, form, errors, handleChange, ...props }) => (
  <div className="mb-3">
    <label className="form-label small fw-semibold text-muted">{label}{required && <span className="text-danger ms-1">*</span>}</label>
    {options ? (
      <select name={name} className={`form-select${errors[name]?' is-invalid':''}`} value={form[name]??''} onChange={handleChange} {...props}>
        {options.map(o => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    ) : (
      <input type={type} name={name} className={`form-control${errors[name]?' is-invalid':''}`} value={form[name]??''} onChange={handleChange} {...props}/>
    )}
    {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
  </div>
);

export default function ObrasForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`/obras/${id}`)
        .then(res => setForm(res.data.data))
        .catch(() => showToast('Error al cargar obra', 'danger'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate area
      if (name === 'longitud' || name === 'ancho') {
        const l = name === 'longitud' ? parseFloat(value) : parseFloat(prev.longitud);
        const a = name === 'ancho' ? parseFloat(value) : parseFloat(prev.ancho);
        if (!isNaN(l) && !isNaN(a)) updated.area = (l * a).toFixed(2);
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.fecha) e.fecha = 'La fecha es requerida';
    if (!form.codigo.trim()) e.codigo = 'El código es requerido';
    if (!form.unidad.trim()) e.unidad = 'La unidad es requerida';
    if (!form.ubicacion.trim()) e.ubicacion = 'La ubicación es requerida';
    if (!form.zona.trim()) e.zona = 'La zona es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/obras/${id}`, form);
        showToast('Obra actualizada exitosamente', 'success');
      } else {
        await api.post('/obras', form);
        showToast('Obra creada exitosamente', 'success');
      }
      setTimeout(() => navigate('/obras'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar';
      if (msg.includes('código')) setErrors({ codigo: msg });
      else showToast(msg, 'danger');
    } finally { setSaving(false); }
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
            <i className={`bi bi-${isEdit?'pencil-square':'plus-circle'} me-2 text-warning`}></i>
            {isEdit ? 'Editar Obra' : 'Nueva Obra'}
          </h4>
          <small className="text-muted">{isEdit ? `Editando: ${form.codigo}` : 'Registro de obra vial'}</small>
        </div>
        <Link to="/obras" className="btn btn-outline-secondary btn-sm">
          <i className="bi bi-arrow-left me-1"></i>Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Datos Generales */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-info-circle me-2"></i>Datos Generales</h6>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Fecha" name="fecha" type="date" required/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Código" name="codigo" placeholder="EMA-47" required/></div>
                  <div className="col-12"><Field form={form} errors={errors} handleChange={handleChange} label="Unidad de Ejecución" name="unidad" placeholder="MALLASILLA" required/></div>
                  <div className="col-12"><Field form={form} errors={errors} handleChange={handleChange} label="Ubicación" name="ubicacion" placeholder="AV. NOMBRE - TRAMO" required/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Zona" name="zona" placeholder="ZONA" required/></div>
                  <div className="col-6">
                    <Field form={form} errors={errors} handleChange={handleChange} label="Estado" name="estado" options={['Planificado','En Ejecucion','Completado']}/>
                  </div>
                  <div className="col-4">
                    <Field form={form} errors={errors} handleChange={handleChange} label="Tipo" name="tipo" options={['ASFALTADO','BACHEO','BASE']}/>
                  </div>
                  <div className="col-8"><Field form={form} errors={errors} handleChange={handleChange} label="Grupo" name="grupo" placeholder="ASFALTO 1"/></div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-rulers me-2"></i>Dimensiones y Recursos</h6>
              </div>
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-4"><Field form={form} errors={errors} handleChange={handleChange} label="Longitud (m)" name="longitud" type="number" step="0.01" placeholder="0"/></div>
                  <div className="col-4"><Field form={form} errors={errors} handleChange={handleChange} label="Ancho" name="ancho" type="number" step="0.01" placeholder="1"/></div>
                  <div className="col-4"><Field form={form} errors={errors} handleChange={handleChange} label="Área (m²)" name="area" type="number" step="0.01" placeholder="0"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Mezcla Requerida (m³)" name="cant_mezcla" type="number" step="0.01" min="0"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Tipo Ligante" name="tipo_ligante" placeholder="MC30 / MC70 / RC250"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Cant. Ligante (L)" name="cant_ligante" type="number" step="0.01"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Personal" name="personal" type="number"/></div>
                  <div className="col-6"><Field form={form} errors={errors} handleChange={handleChange} label="Horas trabajadas" name="horas" type="number"/></div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mt-3">
              <div className="card-header bg-white border-bottom">
                <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-chat-left-text me-2"></i>Observaciones</h6>
              </div>
              <div className="card-body">
                <textarea name="observaciones" className="form-control" rows={3}
                          placeholder="Observaciones adicionales..." value={form.observaciones??''} onChange={handleChange}/>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="col-12">
            <div className="d-flex gap-3 justify-content-end">
              <Link to="/obras" className="btn btn-outline-secondary px-4">Cancelar</Link>
              <button type="submit" className="btn btn-warning px-5 fw-bold" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Guardando...</> : <><i className={`bi bi-${isEdit?'check-circle':'plus-circle'} me-2`}/>{isEdit?'Actualizar Obra':'Crear Obra'}</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </Layout>
  );
}

