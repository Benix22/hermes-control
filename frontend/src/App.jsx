import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  User, 
  Lock, 
  LogOut, 
  Play, 
  Pause, 
  CheckCircle, 
  Users, 
  FileText, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Camera, 
  Eye, 
  Clock, 
  TrendingUp, 
  X,
  RefreshCw,
  Monitor
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, conductor, admin
  const [isAdminSimulatingDriver, setIsAdminSimulatingDriver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar token en axios/fetch y cargar usuario
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setView('login');
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.rol === 'ADMINISTRADOR' && !isAdminSimulatingDriver) {
          setView('admin');
        } else {
          setView('conductor');
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con el servidor.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setView('login');
    setIsAdminSimulatingDriver(false);
  };

  if (view === 'login') {
    return <LoginScreen setToken={setToken} errorMsg={errorMsg} setErrorMsg={setErrorMsg} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-container">
          <div className="app-logo">
            <Car size={24} style={{ color: 'var(--color-primary-hover)' }} />
            <span>Javify Control</span>
          </div>
          
          <div className="user-info-section">
            <span className="username-display" style={{ marginRight: '0.5rem', fontWeight: 500 }}>
              {user?.username} ({user?.rol})
            </span>
            
            {user?.rol === 'ADMINISTRADOR' && (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => {
                  const newState = !isAdminSimulatingDriver;
                  setIsAdminSimulatingDriver(newState);
                  setView(newState ? 'conductor' : 'admin');
                }}
              >
                {isAdminSimulatingDriver ? (
                  <>
                    <Monitor size={16} />
                    <span>Ver Panel Admin</span>
                  </>
                ) : (
                  <>
                    <User size={16} />
                    <span>Probar Vista Móvil</span>
                  </>
                )}
              </button>
            )}

            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} title="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {view === 'admin' ? (
          <AdminDashboard token={token} />
        ) : (
          <ConductorDashboard token={token} />
        )}
      </main>
    </div>
  );
}

/* ==========================================================================
   PANTALLA DE LOGIN
   ========================================================================== */
function LoginScreen({ setToken, errorMsg, setErrorMsg }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Por favor introduce tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
      } else {
        setErrorMsg(data.error || 'Error al iniciar sesión.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('No se pudo conectar con la API de Javify.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '1rem', 
            background: 'var(--color-primary-glow)', 
            borderRadius: '50%',
            marginBottom: '1rem',
            color: 'var(--color-primary-hover)'
          }}>
            <Car size={36} />
          </div>
          <h2>Javify Control</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Control de kilometraje y jornadas de flota
          </p>
        </div>

        {errorMsg && (
          <div style={{ 
            padding: '0.75rem', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: 'var(--radius-md)', 
            color: 'var(--color-danger)', 
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="Ej. conductor1" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-input" 
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '2.8rem' }}
            disabled={loading}
          >
            {loading ? 'Iniciando Sesión...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VISTA CONDUCTOR (MÓVIL)
   ========================================================================== */
function ConductorDashboard({ token }) {
  const [jornadaActiva, setJornadaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  
  // Datos del formulario de Check-in
  const [selectedMatricula, setSelectedMatricula] = useState('');
  const [kmInicio, setKmInicio] = useState('');
  const [fotoBase64, setFotoBase64] = useState('');
  
  // Datos de Check-out
  const [kmFin, setKmFin] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadActiveShift();
  }, []);

  const loadActiveShift = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/jornadas/activa`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.activa) {
          setJornadaActiva(data.jornada);
          setKmFin('');
        } else {
          setJornadaActiva(null);
          loadVehicles();
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/vehiculos/disponibles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Convertir foto a Base64
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado debe ser una imagen.');
      return;
    }

    // Comprimir ligeramente limitando a un tamaño adecuado
    const reader = new FileReader();
    reader.onload = (event) => {
      // Usar un Canvas para redimensionar la imagen antes de subirla
      // Esto evita saturar Neon si suben fotos enormes de 10MB
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG con calidad 0.7
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFotoBase64(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMatricula) {
      setErrorMsg('Debes seleccionar obligatoriamente una matrícula.');
      return;
    }
    if (kmInicio === '' || parseInt(kmInicio, 10) < 0) {
      setErrorMsg('Debes introducir un kilometraje inicial válido.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_URL}/jornadas/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matricula: selectedMatricula,
          km_inicio: parseInt(kmInicio, 10),
          url_foto_km: fotoBase64
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg('Jornada iniciada correctamente.');
        setSelectedMatricula('');
        setKmInicio('');
        setFotoBase64('');
        // Recargar jornada activa
        loadActiveShift();
      } else {
        setErrorMsg(data.error || 'Error al iniciar la jornada.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/jornadas/pausar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadActiveShift();
      } else {
        const data = await res.json();
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Error al pausar la jornada.');
    }
  };

  const handleResume = async () => {
    setErrorMsg('');
    try {
      const res = await fetch(`${API_URL}/jornadas/reanudar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadActiveShift();
      } else {
        const data = await res.json();
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Error al reanudar la jornada.');
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    if (kmFin === '' || parseInt(kmFin, 10) < 0) {
      setErrorMsg('Introduce un kilometraje final válido.');
      return;
    }
    if (parseInt(kmFin, 10) < jornadaActiva.km_inicio) {
      setErrorMsg(`Los kilómetros finales no pueden ser inferiores a los iniciales (${jornadaActiva.km_inicio} km).`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_URL}/jornadas/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          km_fin: parseInt(kmFin, 10)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Jornada finalizada con éxito. Recorriste ${parseInt(kmFin, 10) - jornadaActiva.km_inicio} km.`);
        setJornadaActiva(null);
        setKmFin('');
        loadVehicles();
      } else {
        setErrorMsg(data.error || 'Error al finalizar jornada.');
      }
    } catch (err) {
      setErrorMsg('Error de red.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !jornadaActiva) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--color-primary-hover)' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando estado de la jornada...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
      {/* MENSAJES */}
      {errorMsg && (
        <div style={{ 
          padding: '0.75rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: 'var(--radius-md)', 
          color: 'var(--color-danger)', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ 
          padding: '0.75rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid rgba(16, 185, 129, 0.2)', 
          borderRadius: 'var(--radius-md)', 
          color: 'var(--color-success)', 
          marginBottom: '1rem',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          {successMsg}
        </div>
      )}

      {!jornadaActiva ? (
        /* ==========================================
           FORMULARIO DE CHECK-IN (COMIENZO DE JORNADA)
           ========================================== */
        <div className="glass-card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Play size={20} style={{ color: 'var(--color-success)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>Comenzar Jornada</h2>
          </div>

          <form onSubmit={handleCheckIn}>
            <div className="form-group">
              <label className="form-label">Vehículo Disponible *</label>
              <select 
                className="form-input form-select"
                value={selectedMatricula}
                onChange={(e) => setSelectedMatricula(e.target.value)}
                required
              >
                <option value="">Selecciona una matrícula...</option>
                {vehiculos.map(v => (
                  <option key={v.matricula} value={v.matricula}>
                    {v.matricula} - {v.marca_modelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kilómetros Iniciales *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Introduce km actuales del cuentakilómetros"
                value={kmInicio}
                onChange={(e) => setKmInicio(e.target.value)}
                min="0"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Foto del Cuentakilómetros (Opcional)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current.click()}
                  style={{ flex: 1 }}
                >
                  <Camera size={18} />
                  <span>Abrir Cámara / Galería</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  style={{ display: 'none' }} 
                  accept="image/*"
                  capture="environment" // Llama a la cámara trasera en móvil
                  onChange={handlePhotoChange}
                />
              </div>
              
              {fotoBase64 && (
                <div style={{ marginTop: '0.75rem', position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={fotoBase64} alt="Previsualización" style={{ width: '100%', display: 'block', maxHeight: '180px', objectFit: 'cover' }} />
                  <button 
                    type="button"
                    onClick={() => setFotoBase64('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '0.5rem',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '0.25rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              <CheckCircle size={18} />
              <span>Iniciar Jornada</span>
            </button>
          </form>
        </div>
      ) : (
        /* ==========================================
           PANEL DE ESTADO (JORNADA EN CURSO)
           ========================================== */
        <div className="glass-card animate-fade-in">
          {/* Encabezado de Estado */}
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span className={`badge ${jornadaActiva.estado === 'ACTIVA' ? 'badge-success' : 'badge-warning'}`}>
                JORNADA {jornadaActiva.estado}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Vehículo: <strong>{jornadaActiva.matricula}</strong>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {jornadaActiva.marca_modelo} • Km Inicio: <strong>{jornadaActiva.km_inicio} km</strong>
          </p>

          {/* Cronómetro Dinámico */}
          <ShiftTimer 
            startTimeStr={jornadaActiva.hora_inicio} 
            estado={jornadaActiva.estado} 
            pausas={jornadaActiva.pausas || []} 
          />

          {/* Controles de Pausa/Reanudación */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
            {jornadaActiva.estado === 'ACTIVA' ? (
              <button onClick={handlePause} className="btn btn-secondary" style={{ flex: 1, height: '2.6rem' }}>
                <Pause size={18} />
                <span>Pausar Descanso</span>
              </button>
            ) : (
              <button onClick={handleResume} className="btn btn-primary" style={{ flex: 1, height: '2.6rem' }}>
                <Play size={18} />
                <span>Reanudar Jornada</span>
              </button>
            )}
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }} />

          {/* FORMULARIO DE CHECK-OUT */}
          <form onSubmit={handleCheckOut}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Kilómetros Finales *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="Introduce kilómetros finales"
                value={kmFin}
                onChange={(e) => setKmFin(e.target.value)}
                min={jornadaActiva.km_inicio}
                required
              />
              
              {kmFin && parseInt(kmFin, 10) >= jornadaActiva.km_inicio && (
                <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                  Distancia total recorrida: <strong>{parseInt(kmFin, 10) - jornadaActiva.km_inicio} km</strong>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-danger pulse-glow-danger" 
              style={{ width: '100%', height: '2.8rem' }}
              disabled={kmFin === '' || parseInt(kmFin, 10) < jornadaActiva.km_inicio}
            >
              <CheckCircle size={18} />
              <span>Finalizar Jornada (Check-Out)</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* COMPONENTE AUXILIAR: CRONÓMETRO */
function ShiftTimer({ startTimeStr, estado, pausas }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Función para calcular segundos netos de jornada activa
    const calculateSeconds = () => {
      const start = new Date(startTimeStr).getTime();
      const now = Date.now();
      
      let totalPausaMs = 0;
      
      pausas.forEach(p => {
        const pStart = new Date(p.hora_inicio).getTime();
        const pEnd = p.hora_fin ? new Date(p.hora_fin).getTime() : now;
        totalPausaMs += (pEnd - pStart);
      });

      const elapsedMs = (now - start) - totalPausaMs;
      // No permitir valores negativos por ligeros desfases horario cliente/servidor
      return Math.max(0, Math.floor(elapsedMs / 1000));
    };

    setElapsedSeconds(calculateSeconds());

    let interval = null;
    if (estado === 'ACTIVA') {
      interval = setInterval(() => {
        setElapsedSeconds(calculateSeconds());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTimeStr, estado, pausas]);

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="timer-container">
      <div className="timer-digits">{formatTime(elapsedSeconds)}</div>
      <div className="timer-label">Tiempo Activo Transcurrido</div>
    </div>
  );
}


/* ==========================================================================
   VISTA DE ADMINISTRADOR (ESCRITORIO)
   ========================================================================== */
function AdminDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('reportes'); // reportes, conductores, vehiculos

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Menú de pestañas */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'reportes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reportes')}
          >
            <FileText size={18} />
            <span>Reportes de Kilometraje</span>
          </button>
          
          <button 
            className={`btn ${activeTab === 'conductores' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('conductores')}
          >
            <Users size={18} />
            <span>Conductores</span>
          </button>

          <button 
            className={`btn ${activeTab === 'vehiculos' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vehiculos')}
          >
            <Car size={18} />
            <span>Vehículos</span>
          </button>
        </div>
      </div>

      {/* Renderizado de Pestañas */}
      <div className="animate-fade-in">
        {activeTab === 'conductores' && <AdminDrivers token={token} />}
        {activeTab === 'vehiculos' && <AdminVehicles token={token} />}
        {activeTab === 'reportes' && <AdminReports token={token} />}
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN - CRUD CONDUCTORES
   ========================================== */
function AdminDrivers({ token }) {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal de añadir/editar
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null); // null para añadir, objeto conductor para editar
  const [formData, setFormData] = useState({ username: '', password: '', activo: true });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/conductores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConductores(data);
      }
    } catch (err) {
      setErrorMsg('Error al cargar conductores.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({ username: '', password: '', activo: true });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({ username: driver.username, password: '', activo: driver.activo });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.username) return;

    setLoading(true);
    setErrorMsg('');
    
    const isEditing = !!editingDriver;
    const url = isEditing 
      ? `${API_URL}/admin/conductores/${editingDriver.id}`
      : `${API_URL}/admin/conductores`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        loadDrivers();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Error al guardar.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas dar de baja a este conductor? Se liberará su vehículo si está conduciendo.')) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/conductores/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadDrivers();
      }
    } catch (err) {
      alert('Error al dar de baja.');
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Gestión de Conductores</h3>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Añadir Conductor</span>
        </button>
      </div>

      {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{errorMsg}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre de Usuario</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {conductores.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.username}</strong></td>
                <td>
                  <span className={`badge ${c.activo ? 'badge-success' : 'badge-danger'}`}>
                    {c.activo ? 'Activo' : 'Baja'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }} onClick={() => handleOpenEdit(c)}>
                    <Edit size={14} />
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleDelete(c.id)} disabled={!c.activo}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORMULARIO */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4>{editingDriver ? 'Editar Conductor' : 'Nuevo Conductor'}</h4>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Usuario *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Contraseña {editingDriver && '(Dejar vacío para mantener)'} *
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingDriver}
                />
              </div>

              {editingDriver && (
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="activo" 
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                  <label htmlFor="activo" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Conductor Activo</label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   ADMIN - CRUD VEHÍCULOS
   ========================================== */
function AdminVehicles({ token }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal de añadir/editar
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({ matricula: '', marca_modelo: '', activo: true, en_uso: false });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/vehiculos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehiculos(data);
      }
    } catch (err) {
      setErrorMsg('Error al cargar vehículos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({ matricula: '', marca_modelo: '', activo: true, en_uso: false });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({ matricula: v.matricula, marca_modelo: v.marca_modelo, activo: v.activo, en_uso: v.en_uso });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.matricula || !formData.marca_modelo) return;

    setLoading(true);
    setErrorMsg('');
    
    const isEditing = !!editingVehicle;
    const url = isEditing 
      ? `${API_URL}/admin/vehiculos/${editingVehicle.matricula}`
      : `${API_URL}/admin/vehiculos`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        loadVehicles();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Error al guardar vehículo.');
      }
    } catch (err) {
      setErrorMsg('Error de red.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Gestión de Flota de Vehículos</h3>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Añadir Vehículo</span>
        </button>
      </div>

      {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{errorMsg}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Marca y Modelo</th>
              <th>Estado Flota</th>
              <th>Uso en Tiempo Real</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map(v => (
              <tr key={v.matricula}>
                <td><strong>{v.matricula}</strong></td>
                <td>{v.marca_modelo}</td>
                <td>
                  <span className={`badge ${v.activo ? 'badge-success' : 'badge-danger'}`}>
                    {v.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${v.en_uso ? 'badge-danger' : 'badge-success'}`}>
                    {v.en_uso ? 'Ocupado' : 'Libre'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleOpenEdit(v)}>
                    <Edit size={14} />
                    <span>Editar</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4>{editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h4>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Matrícula *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="Ej. 1234-LMX"
                  required
                  disabled={!!editingVehicle} // Clave primaria
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marca y Modelo *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.marca_modelo}
                  onChange={(e) => setFormData({ ...formData, marca_modelo: e.target.value })}
                  placeholder="Ej. Toyota Corolla"
                  required
                />
              </div>

              {editingVehicle && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="activoVehiculo" 
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                    <label htmlFor="activoVehiculo" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Vehículo Activo (para asignaciones)</label>
                  </div>
                  
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox" 
                      id="enUsoVehiculo" 
                      checked={formData.en_uso}
                      onChange={(e) => setFormData({ ...formData, en_uso: e.target.checked })}
                      style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                    <label htmlFor="enUsoVehiculo" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Marcar como Ocupado (Fuerza manual)</label>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   ADMIN - REPORTES DE KILOMETRAJE
   ========================================== */
function AdminReports({ token }) {
  const [reportsData, setReportsData] = useState({ resumen: { totalKilometros: 0, totalJornadas: 0 }, detalles: [] });
  const [conductores, setConductores] = useState([]);
  
  // Filtros
  const [selectedConductor, setSelectedConductor] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  // Visualizar foto en modal
  const [activePhoto, setActivePhoto] = useState('');

  useEffect(() => {
    loadActiveDrivers();
    handleFetchReport();
  }, []);

  const loadActiveDrivers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/conductores`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConductores(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      let query = `conductorId=${selectedConductor}`;
      if (fechaInicio) query += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) query += `&fechaFin=${fechaFin}`;

      const res = await fetch(`${API_URL}/admin/reportes?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportsData.detalles.length === 0) return;

    // Cabeceras del CSV
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // Añadir BOM para caracteres especiales de Excel
    csvContent += 'Fecha;Conductor;Vehículo;Km Inicio;Km Fin;Km Recorridos;Hora Inicio;Hora Fin\n';

    reportsData.detalles.forEach(r => {
      const dateStr = new Date(r.hora_inicio).toLocaleDateString();
      const timeStart = new Date(r.hora_inicio).toLocaleTimeString();
      const timeEnd = r.hora_fin ? new Date(r.hora_fin).toLocaleTimeString() : 'N/A';
      
      csvContent += `${dateStr};${r.conductor};${r.matricula};${r.km_inicio};${r.km_fin};${r.km_recorridos};${timeStart};${timeEnd}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    const filename = `reporte_kilometraje_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* TARJETAS DE AGREGACIÓN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary-glow)', color: 'var(--color-primary-hover)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Kilómetros Recorridos</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              {reportsData.resumen.totalKilometros.toLocaleString()} km
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Turnos Finalizados</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              {reportsData.resumen.totalJornadas}
            </div>
          </div>
        </div>

      </div>

      {/* FILTROS */}
      <div className="glass-card">
        <form onSubmit={handleFetchReport} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Conductor</label>
            <select 
              className="form-input form-select"
              value={selectedConductor}
              onChange={(e) => setSelectedConductor(e.target.value)}
            >
              <option value="todos">Todos</option>
              {conductores.map(c => (
                <option key={c.id} value={c.id}>{c.username}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha Inicio</label>
            <input 
              type="date" 
              className="form-input" 
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fecha Fin</label>
            <input 
              type="date" 
              className="form-input" 
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '2.5rem' }} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Filtrar</span>
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleExportCSV}
              disabled={reportsData.detalles.length === 0}
              style={{ height: '2.5rem' }}
              title="Exportar a CSV"
            >
              <Download size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Detalle de Jornadas Cerradas</h3>
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Km Inicio</th>
                <th>Km Fin</th>
                <th>Total Km</th>
                <th>Hora Inicio/Fin</th>
                <th>Foto</th>
              </tr>
            </thead>
            <tbody>
              {reportsData.detalles.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se han encontrado jornadas registradas en este rango de fecha.
                  </td>
                </tr>
              ) : (
                reportsData.detalles.map(r => {
                  const dateStr = new Date(r.hora_inicio).toLocaleDateString();
                  const timeStart = new Date(r.hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const timeEnd = r.hora_fin 
                    ? new Date(r.hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : '--:--';
                  
                  return (
                    <tr key={r.id}>
                      <td><strong>{dateStr}</strong></td>
                      <td>{r.conductor}</td>
                      <td>{r.matricula}</td>
                      <td>{r.km_inicio} km</td>
                      <td>{r.km_fin} km</td>
                      <td>
                        <span className="badge badge-success" style={{ fontWeight: 700 }}>
                          +{r.km_recorridos} km
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {timeStart} a {timeEnd}
                      </td>
                      <td>
                        {r.url_foto_km ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setActivePhoto(r.url_foto_km)}
                          >
                            <Eye size={12} />
                            <span>Ver Foto</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin foto</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA VER FOTO */}
      {activePhoto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1.5rem'
        }} onClick={() => setActivePhoto('')}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhoto('')} 
              style={{
                position: 'absolute', right: '-1rem', top: '-2.5rem', background: 'none', 
                border: 'none', color: 'white', cursor: 'pointer'
              }}
            >
              <X size={28} />
            </button>
            <img 
              src={activePhoto} 
              alt="Foto Odometer" 
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)', display: 'block', margin: '0 auto' }} 
            />
          </div>
        </div>
      )}

    </div>
  );
}
