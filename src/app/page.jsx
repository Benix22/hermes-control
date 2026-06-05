"use client";
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
  Monitor,
  AlertCircle,
  History,
  Fuel,
  Droplet,
  Key
} from 'lucide-react';

const API_URL = '/api';

export default function App() {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('token') || '';
    return '';
  });
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, conductor, admin
  const [isAdminSimulatingDriver, setIsAdminSimulatingDriver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal cambio contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setErrorMsg('');
    setPasswordSuccess('');
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Contraseña actualizada correctamente. Cierra esta ventana.');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setErrorMsg(data.error);
      }
    } catch (err) {
      setErrorMsg('Error de red al actualizar contraseña.');
    } finally {
      setPasswordLoading(false);
    }
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

            <button onClick={() => setShowPasswordModal(true)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} title="Cambiar Contraseña">
              <Key size={16} />
            </button>

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

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !passwordLoading && setShowPasswordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} /> Cambiar Contraseña
            </h3>
            {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
            {passwordSuccess && <div style={{ color: 'var(--color-success)', marginBottom: '1rem', fontSize: '0.9rem' }}>{passwordSuccess}</div>}
            
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Contraseña Actual *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nueva Contraseña *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} style={{ flex: 1 }} disabled={passwordLoading}>Cerrar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={passwordLoading || !currentPassword || !newPassword}>Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  
  // Modal repostaje
  const [showRefuelModal, setShowRefuelModal] = useState(false);
  const [refuelAmount, setRefuelAmount] = useState('');
  const [refuelKm, setRefuelKm] = useState('');
  const [adblueLitros, setAdblueLitros] = useState('');
  const [adblueEuros, setAdblueEuros] = useState('');
  const [refuelLoading, setRefuelLoading] = useState(false);

  // Modal limpieza
  const [showLimpiezaModal, setShowLimpiezaModal] = useState(false);
  const [limpiezaAmount, setLimpiezaAmount] = useState('');
  const [limpiezaLoading, setLimpiezaLoading] = useState(false);
  
  // Datos de Check-out
  const [kmFin, setKmFin] = useState('');
  const [fotoFinBase64, setFotoFinBase64] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const fileInputFinRef = useRef(null);

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

  const handlePhotoFinChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado debe ser una imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFotoFinBase64(dataUrl);
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
    if (!fotoBase64) {
      setErrorMsg('La fotografía del cuentakilómetros es obligatoria para iniciar la jornada.');
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

  const handleRefuel = async (e) => {
    e.preventDefault();
    if (!refuelAmount || parseFloat(refuelAmount) <= 0) return;
    if (!refuelKm || parseInt(refuelKm, 10) < 0) {
      setErrorMsg('Debes introducir los kilómetros actuales del vehículo.');
      setShowRefuelModal(false);
      return;
    }
    setRefuelLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/jornadas/repostajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          cantidad_euros: parseFloat(refuelAmount),
          km_repostaje: parseInt(refuelKm, 10),
          adblue_litros: adblueLitros ? parseFloat(adblueLitros) : 0,
          adblue_euros: adblueEuros ? parseFloat(adblueEuros) : 0
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Repostaje de ${parseFloat(refuelAmount).toFixed(2)}€ registrado correctamente.`);
        setShowRefuelModal(false);
        setRefuelAmount('');
        setRefuelKm('');
        setAdblueLitros('');
        setAdblueEuros('');
      } else {
        setErrorMsg(data.error);
        setShowRefuelModal(false);
      }
    } catch (err) {
      setErrorMsg('Error de red al registrar repostaje.');
      setShowRefuelModal(false);
    } finally {
      setRefuelLoading(false);
    }
  };

  const handleLimpieza = async (e) => {
    e.preventDefault();
    if (!limpiezaAmount || parseFloat(limpiezaAmount) <= 0) return;
    setLimpiezaLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/jornadas/limpiezas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cantidad_euros: parseFloat(limpiezaAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Limpieza de ${parseFloat(limpiezaAmount).toFixed(2)}€ registrada correctamente.`);
        setShowLimpiezaModal(false);
        setLimpiezaAmount('');
      } else {
        setErrorMsg(data.error);
        setShowLimpiezaModal(false);
      }
    } catch (err) {
      setErrorMsg('Error de red.');
      setShowLimpiezaModal(false);
    }
    setLimpiezaLoading(false);
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
    if (!fotoFinBase64) {
      setErrorMsg('La fotografía del cuentakilómetros es obligatoria para finalizar la jornada.');
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
          km_fin: parseInt(kmFin, 10),
          url_foto_fin_km: fotoFinBase64
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Jornada finalizada con éxito. Recorriste ${parseInt(kmFin, 10) - jornadaActiva.km_inicio} km.`);
        setJornadaActiva(null);
        setKmFin('');
        setFotoFinBase64('');
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
              <label className="form-label">Foto del Cuentakilómetros *</label>
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
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {jornadaActiva.estado === 'ACTIVA' ? (
              <>
                <button onClick={handlePause} className="btn btn-secondary" style={{ flex: 1, height: '2.6rem', minWidth: '140px' }}>
                  <Pause size={18} />
                  <span>Pausar Descanso</span>
                </button>
                <button onClick={() => setShowRefuelModal(true)} className="btn btn-primary" style={{ flex: 1, height: '2.6rem', minWidth: '140px' }}>
                  <Fuel size={18} />
                  <span>Repostar</span>
                </button>
                <button onClick={() => setShowLimpiezaModal(true)} className="btn btn-primary" style={{ flex: 1, height: '2.6rem', minWidth: '140px', background: 'var(--color-info)' }}>
                  <Droplet size={18} />
                  <span>Limpieza</span>
                </button>
              </>
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

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Foto del Cuentakilómetros *</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => fileInputFinRef.current.click()}
                  style={{ flex: 1 }}
                >
                  <Camera size={18} />
                  <span>Abrir Cámara / Galería</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputFinRef}
                  style={{ display: 'none' }} 
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoFinChange}
                />
              </div>
              {fotoFinBase64 && (
                <div style={{ marginTop: '1rem', position: 'relative' }}>
                  <img src={fotoFinBase64} alt="Cuentakilómetros fin" style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />
                  <button 
                    type="button" 
                    onClick={() => setFotoFinBase64('')}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
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

      {/* MODAL REPOSTAJE */}
      {showRefuelModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !refuelLoading && setShowRefuelModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Fuel size={20} /> Registrar Repostaje
            </h3>
            <form onSubmit={handleRefuel}>
              <div className="form-group">
                <label className="form-label">Coste del repostaje (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.1"
                  className="form-input" 
                  placeholder="Ej: 50.00"
                  value={refuelAmount}
                  onChange={(e) => setRefuelAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kilómetros actuales del vehículo *</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-input" 
                  placeholder="Ej: 120500"
                  value={refuelKm}
                  onChange={(e) => setRefuelKm(e.target.value)}
                  required
                />
              </div>

              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>AdBlue (Opcional)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Litros</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      className="form-input" 
                      placeholder="Ej: 10.5"
                      value={adblueLitros}
                      onChange={(e) => setAdblueLitros(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Coste (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      className="form-input" 
                      placeholder="Ej: 15.00"
                      value={adblueEuros}
                      onChange={(e) => setAdblueEuros(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRefuelModal(false)}
                  style={{ flex: 1 }}
                  disabled={refuelLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={refuelLoading}
                >
                  {refuelLoading ? <RefreshCw size={18} className="animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LIMPIEZA */}
      {showLimpiezaModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => !limpiezaLoading && setShowLimpiezaModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Droplet size={20} style={{ color: 'var(--color-info)' }} /> Registrar Limpieza
            </h3>
            <form onSubmit={handleLimpieza}>
              <div className="form-group">
                <label className="form-label">Coste de la limpieza (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.1"
                  className="form-input" 
                  placeholder="Ej: 15.00"
                  value={limpiezaAmount}
                  onChange={(e) => setLimpiezaAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLimpiezaModal(false)} style={{ flex: 1 }} disabled={limpiezaLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--color-info)' }} disabled={limpiezaLoading}>Registrar</button>
              </div>
            </form>
          </div>
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
          
          <button 
            className={`btn ${activeTab === 'repostajes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('repostajes')}
          >
            <Fuel size={18} />
            <span>Repostajes</span>
          </button>
          
          <button 
            className={`btn ${activeTab === 'limpiezas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('limpiezas')}
          >
            <Droplet size={18} />
            <span>Limpiezas</span>
          </button>
        </div>
      </div>

      {/* Renderizado de Pestañas */}
      <div className="animate-fade-in">
        {activeTab === 'conductores' && <AdminDrivers token={token} />}
        {activeTab === 'vehiculos' && <AdminVehicles token={token} />}
        {activeTab === 'reportes' && <AdminReports token={token} />}
        {activeTab === 'repostajes' && <AdminRepostajes token={token} />}
        {activeTab === 'limpiezas' && <AdminLimpiezas token={token} />}
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
  const [formData, setFormData] = useState({ matricula: '', marca_modelo: '', km_iniciales: 0, km_actuales: 0, activo: true, en_uso: false });

  // Historial de Vehiculo
  const [historyVehicle, setHistoryVehicle] = useState(null);
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    setFormData({ matricula: '', marca_modelo: '', km_iniciales: 0, km_actuales: 0, activo: true, en_uso: false });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehicle(v);
    setFormData({ matricula: v.matricula, marca_modelo: v.marca_modelo, km_iniciales: v.km_iniciales || 0, km_actuales: v.km_actuales || 0, activo: v.activo, en_uso: v.en_uso });
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

  const handleSearchHistory = async (e) => {
    if (e) e.preventDefault();
    setHistoryLoading(true);
    try {
      const query = `matricula=${historyVehicle.matricula}&fechaInicio=${historyDate}&fechaFin=${historyDate}`;
      const res = await fetch(`${API_URL}/admin/reportes?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.detalles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (historyVehicle) {
      handleSearchHistory();
    }
  }, [historyVehicle, historyDate]);

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
              <th>Km Iniciales</th>
              <th>Km Actuales</th>
              <th>Total Recorrido</th>
              <th>Estado Flota</th>
              <th>Uso en Tiempo Real</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculos.map(v => (
              <tr 
                key={v.matricula}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={() => setHistoryVehicle(v)}
              >
                <td><strong>{v.matricula}</strong></td>
                <td>{v.marca_modelo}</td>
                <td>{v.km_iniciales || 0} km</td>
                <td>{v.km_actuales || 0} km</td>
                <td><span className="badge badge-primary">{(v.km_actuales || 0) - (v.km_iniciales || 0)} km</span></td>
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
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={(e) => { e.stopPropagation(); handleOpenEdit(v); }}>
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

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label">Kilómetros Iniciales</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.km_iniciales}
                    onChange={(e) => setFormData({ ...formData, km_iniciales: e.target.value })}
                    placeholder="Ej. 100000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Kilómetros Actuales</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.km_actuales}
                    onChange={(e) => setFormData({ ...formData, km_actuales: e.target.value })}
                    placeholder="Ej. 150000"
                    min="0"
                  />
                </div>
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

      {/* MODAL HISTORIAL VEHÍCULO */}
      {historyVehicle && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }} onClick={() => setHistoryVehicle(null)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-main)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={20} style={{ color: 'var(--color-primary)' }} />
                Historial: {historyVehicle.matricula}
              </h3>
              <button onClick={() => setHistoryVehicle(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Buscar por fecha:</label>
              <input 
                type="date" 
                className="form-input" 
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
              />
            </div>

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--color-primary-hover)' }} />
              </div>
            ) : (
              <div>
                {!historyData || historyData.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay registros de uso para este vehículo en la fecha seleccionada.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {historyData.map(r => {
                      const timeStart = new Date(r.hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const timeEnd = r.hora_fin ? new Date(r.hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      return (
                        <div key={r.id} style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '1.1rem' }}>{r.conductor}</strong>
                            <span className="badge badge-success" style={{ fontWeight: 700 }}>+{r.km_recorridos} km</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <div>
                              <div><strong>Horario:</strong> {timeStart} - {timeEnd}</div>
                            </div>
                            <div>
                              <div><strong>Km:</strong> {r.km_inicio} a {r.km_fin || 'En curso'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
  
  // Modal de detalles de la jornada
  const [selectedReport, setSelectedReport] = useState(null);

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
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Detalle de Jornadas</h3>
        
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
                <th>Fotos (Inicio / Fin)</th>
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
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedReport(r)} 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td><strong>{dateStr}</strong></td>
                      <td>{r.conductor}</td>
                      <td>{r.matricula}</td>
                      <td>{r.km_inicio} km</td>
                      <td>{r.km_fin !== null ? `${r.km_fin} km` : <span style={{color: 'var(--text-muted)'}}>En curso</span>}</td>
                      <td>
                        {r.km_recorridos !== null ? (
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>
                            +{r.km_recorridos} km
                          </span>
                        ) : (
                          <span style={{color: 'var(--text-muted)'}}>-</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {timeStart} a {timeEnd}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {r.url_foto_km ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePhoto(r.url_foto_km);
                              }}
                              title="Foto Inicio"
                            >
                              <Camera size={12} />
                              <span>Inicio</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin foto inicio</span>
                          )}

                          {r.url_foto_fin_km ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePhoto(r.url_foto_fin_km);
                              }}
                              title="Foto Fin"
                            >
                              <Camera size={12} />
                              <span>Fin</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sin foto fin</span>
                          )}
                        </div>
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

      {/* MODAL DETALLE DE JORNADA */}
      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          onRefresh={handleFetchReport}
          token={token}
        />
      )}

    </div>
  );
}

/* ==========================================
   COMPONENTE: MODAL DETALLE DE JORNADA
   ========================================== */
function ReportDetailModal({ report, onClose, onRefresh, token }) {
  const [activePhoto, setActivePhoto] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Helpers para timezone local a input datetime-local
  const formatForInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [editForm, setEditForm] = useState({
    km_inicio: report.km_inicio || '',
    km_fin: report.km_fin || '',
    hora_inicio: formatForInput(report.hora_inicio),
    hora_fin: formatForInput(report.hora_fin)
  });

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start, end) => {
    if (!end) return 'En curso';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diffMs = e - s;
    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/reportes/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }
      setIsEditing(false);
      if (onRefresh) onRefresh();
      onClose(); // Cerrar modal para reflejar cambios frescos
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem'
    }} onClick={onClose}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-main)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            Detalle de Jornada
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isEditing ? (
              <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setIsEditing(true)}>
                <Edit size={14} /> Editar
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setIsEditing(false)} disabled={saving}>
                  Cancelar
                </button>
                <button className="btn btn-success" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={handleSave} disabled={saving}>
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}

        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Hora Inicio</label>
              <input type="datetime-local" className="form-input" value={editForm.hora_inicio} onChange={e => setEditForm({...editForm, hora_inicio: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Hora Fin</label>
              <input type="datetime-local" className="form-input" value={editForm.hora_fin} onChange={e => setEditForm({...editForm, hora_fin: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Km Inicio</label>
              <input type="number" className="form-input" value={editForm.km_inicio} onChange={e => setEditForm({...editForm, km_inicio: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Km Fin</label>
              <input type="number" className="form-input" value={editForm.km_fin} onChange={e => setEditForm({...editForm, km_fin: e.target.value})} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fecha</div>
                <div style={{ fontWeight: 600 }}>{new Date(report.hora_inicio).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Conductor</div>
                <div style={{ fontWeight: 600 }}>{report.conductor}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehículo</div>
                <div style={{ fontWeight: 600 }}>{report.matricula}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Horario</div>
                <div style={{ fontWeight: 600 }}>{formatTime(report.hora_inicio)} - {formatTime(report.hora_fin)}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Km Inicio</div>
                <div style={{ fontWeight: 600 }}>{report.km_inicio}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Km Fin</div>
                <div style={{ fontWeight: 600 }}>{report.km_fin || '-'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>{report.km_recorridos !== null ? `+${report.km_recorridos} km` : '-'}</div>
              </div>
            </div>
          </>
        )}

        {/* FOTOS DE KILOMETRAJE */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Foto Inicio</div>
            {report.url_foto_km ? (
              <button className="btn btn-secondary" onClick={() => setActivePhoto(report.url_foto_km)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Camera size={14} /> Ver Foto
              </button>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin foto</div>
            )}
          </div>
          
          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Foto Fin</div>
            {report.url_foto_fin_km ? (
              <button className="btn btn-secondary" onClick={() => setActivePhoto(report.url_foto_fin_km)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Camera size={14} /> Ver Foto
              </button>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin foto</div>
            )}
          </div>
        </div>

        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} />
          Registro de Pausas
        </h4>
        
        {(!report.pausas || report.pausas.length === 0) ? (
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No se registraron pausas en esta jornada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.pausas.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-warning)' }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Pausa {idx + 1}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {formatTime(p.hora_inicio)} - {formatTime(p.hora_fin)}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {calculateDuration(p.hora_inicio, p.hora_fin)}
                </div>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Fuel size={16} style={{ color: 'var(--color-primary)' }} />
          Registro de Repostajes
        </h4>
        
        {(!report.repostajes || report.repostajes.length === 0) ? (
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No se registraron repostajes en esta jornada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.repostajes.map((r, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                    <span style={{ fontSize: '0.9rem' }}>Repostaje {idx + 1}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatTime(r.fecha_hora)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {r.km_repostaje ? `${r.km_repostaje} km` : 'N/A'}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-success)' }}>
                    {parseFloat(r.cantidad_euros).toFixed(2)} €
                  </div>
                </div>
                { (parseFloat(r.adblue_euros) > 0 || parseFloat(r.adblue_litros) > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      AdBlue: {r.adblue_litros > 0 ? `${parseFloat(r.adblue_litros).toFixed(1)} L` : '-'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-info)' }}>
                      {r.adblue_euros > 0 ? `${parseFloat(r.adblue_euros).toFixed(2)} €` : '-'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <h4 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplet size={16} style={{ color: 'var(--color-info)' }} />
          Registro de Limpiezas
        </h4>
        
        {(!report.limpiezas || report.limpiezas.length === 0) ? (
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No se registraron limpiezas en esta jornada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.limpiezas.map((r, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-info)' }}></div>
                  <span style={{ fontSize: '0.9rem' }}>Limpieza {idx + 1}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {formatTime(r.fecha_hora)}
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-info)' }}>
                  {parseFloat(r.cantidad_euros).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }} onClick={onClose}>
          Cerrar Detalle
        </button>

      </div>

      {/* MODAL PARA VER FOTO (DENTRO DEL DETALLE) */}
      {activePhoto && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1100, padding: '1.5rem'
        }} onClick={() => setActivePhoto('')}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhoto('')}
              style={{
                position: 'absolute', top: '-15px', right: '-15px', background: 'var(--color-danger)', 
                color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1101
              }}
            >
              <X size={16} />
            </button>
            <img 
              src={activePhoto} 
              alt="Cuentakilómetros" 
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid var(--border-color)' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   ADMIN - REPOSTAJES
   ========================================== */
function AdminRepostajes({ token }) {
  const [repostajesData, setRepostajesData] = useState({ resumen: { totalEuros: 0, totalRepostajes: 0 }, detalles: [] });
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedConductor, setSelectedConductor] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState(todayStr);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [matricula, setMatricula] = useState('');

  useEffect(() => {
    fetchConductores();
    fetchVehiculos();
    fetchRepostajes();
  }, []);

  const fetchConductores = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/conductores`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setConductores(await res.json());
    } catch (err) {}
  };

  const fetchVehiculos = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/vehiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setVehiculos(await res.json());
    } catch (err) {}
  };

  const fetchRepostajes = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      let query = `?conductorId=${selectedConductor}`;
      if (fechaInicio) query += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) query += `&fechaFin=${fechaFin}`;
      if (matricula) query += `&matricula=${matricula}`;

      const res = await fetch(`${API_URL}/admin/repostajes${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRepostajesData(await res.json());
      } else {
        setErrorMsg('Error al cargar datos.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* TARJETA DE RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
          <Fuel size={24} />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Gastado en Repostajes</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {repostajesData.resumen.totalEuros.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {repostajesData.resumen.totalRepostajes} repostajes encontrados
          </div>
        </div>
          </div>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)' }}>
            <Droplet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Gastado en AdBlue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              {(repostajesData.resumen.totalAdblueEuros || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {(repostajesData.resumen.totalAdblueLitros || 0).toFixed(1)} L de AdBlue
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="glass-card">
        <form onSubmit={fetchRepostajes} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
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
            <label className="form-label">Matrícula</label>
            <select 
              className="form-input form-select"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            >
              <option value="">Todas</option>
              {vehiculos.map(v => (
                <option key={v.matricula} value={v.matricula}>{v.matricula}</option>
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
          </div>
        </form>
      </div>

      {/* RESULTADOS */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Detalle de Repostajes</h3>
        {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{errorMsg}</div>}
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Kilómetros</th>
                <th>Coste</th>
                <th>AdBlue (L)</th>
                <th>AdBlue (€)</th>
              </tr>
            </thead>
            <tbody>
              {repostajesData.detalles.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se han encontrado repostajes con estos filtros.
                  </td>
                </tr>
              ) : (
                repostajesData.detalles.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{new Date(r.fecha_hora).toLocaleDateString()}</strong> 
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        {new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>{r.conductor}</td>
                    <td>{r.matricula}</td>
                    <td>{r.km_repostaje} km</td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {parseFloat(r.cantidad_euros).toFixed(2)} €
                      </span>
                    </td>
                    <td>{r.adblue_litros > 0 ? `${parseFloat(r.adblue_litros).toFixed(1)} L` : '-'}</td>
                    <td>
                      {r.adblue_euros > 0 ? (
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {parseFloat(r.adblue_euros).toFixed(2)} €
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN - LIMPIEZAS
   ========================================== */
function AdminLimpiezas({ token }) {
  const [limpiezasData, setLimpiezasData] = useState({ resumen: { totalEuros: 0, totalLimpiezas: 0 }, detalles: [] });
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedConductor, setSelectedConductor] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState(todayStr);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [matricula, setMatricula] = useState('');

  useEffect(() => {
    fetchConductores();
    fetchVehiculos();
    fetchLimpiezas();
  }, []);

  const fetchConductores = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/conductores`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setConductores(await res.json());
    } catch (err) {}
  };

  const fetchVehiculos = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/vehiculos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setVehiculos(await res.json());
    } catch (err) {}
  };

  const fetchLimpiezas = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      let query = `?conductorId=${selectedConductor}`;
      if (fechaInicio) query += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) query += `&fechaFin=${fechaFin}`;
      if (matricula) query += `&matricula=${matricula}`;

      const res = await fetch(`${API_URL}/admin/limpiezas${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLimpiezasData(data);
      } else {
        setErrorMsg('Error al cargar datos');
      }
    } catch (err) {
      setErrorMsg('Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* RESUMEN */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.1)', color: 'var(--color-info)' }}>
          <Droplet size={24} />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Gastado en Limpiezas</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {limpiezasData.resumen.totalEuros.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {limpiezasData.resumen.totalLimpiezas} limpiezas encontradas
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="glass-card">
        <form onSubmit={fetchLimpiezas} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'end' }}>
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
            <label className="form-label">Matrícula</label>
            <select 
              className="form-input form-select"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
            >
              <option value="">Todas</option>
              {vehiculos.map(v => (
                <option key={v.matricula} value={v.matricula}>{v.matricula}</option>
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
          </div>
        </form>
      </div>

      {/* RESULTADOS */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Detalle de Limpiezas</h3>
        {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{errorMsg}</div>}
        
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Conductor</th>
                <th>Vehículo</th>
                <th>Coste</th>
              </tr>
            </thead>
            <tbody>
              {limpiezasData.detalles.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se han encontrado limpiezas con estos filtros.
                  </td>
                </tr>
              ) : (
                limpiezasData.detalles.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{new Date(r.fecha_hora).toLocaleDateString()}</strong> 
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        {new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>{r.conductor}</td>
                    <td>{r.matricula}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>
                        {parseFloat(r.cantidad_euros).toFixed(2)} €
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
