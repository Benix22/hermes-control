"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';


function Pagination({ currentPage, totalItems, pageSize, onPageChange }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button 
        className="btn btn-secondary" 
        style={{ padding: '0.4rem 0.8rem' }}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </button>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Página {currentPage} de {totalPages}
      </span>
      <button 
        className="btn btn-secondary" 
        style={{ padding: '0.4rem 0.8rem' }}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
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
  Edit2,
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
  Key,
  Map,
  Settings,
  Mic,
  MicOff,
  Loader2
} from 'lucide-react';

const API_URL = '/api';

const getGoogleMapsLink = (origen, destino) => {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origen)}&destination=${encodeURIComponent(destino)}&travelmode=driving`;
};

const AddressAutocomplete = ({ value, onChange, placeholder, token }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!value || !showDropdown) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/admin/places-autocomplete?input=${encodeURIComponent(value)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching autocomplete:', err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [value, token, showDropdown]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => {
          if (value) setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
        required
      />
      {showDropdown && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          listStyle: 'none',
          padding: 0,
          margin: '0.25rem 0 0 0',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((sug, idx) => (
            <li 
              key={idx}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(sug);
                setShowDropdown(false);
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {sug}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401 || res.status === 403) {
        if (typeof args[0] === 'string' && !args[0].includes('/auth/login')) {
          setToken('');
          setUser(null);
          setView('login');
          setIsAdminSimulatingDriver(false);
          setErrorMsg('Tu sesión ha caducado por inactividad. Por favor, vuelve a iniciar sesión.');
        }
      }
      return res;
    };

    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setView('login');
    }

    return () => {
      window.fetch = originalFetch;
    };
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
            <span>Hermes Fleet Control</span>
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
        <Portal>
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
        </Portal>
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
      setErrorMsg('No se pudo conectar con la API de Hermes Fleet Control.');
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
          <h2>Hermes Fleet Control</h2>
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
  const [partesPendientes, setPartesPendientes] = useState([]);
  const [selectedParteId, setSelectedParteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [vehiculos]);
  
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
  
  // Voice AI States
  const [isRecording, setIsRecording] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setAiProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.webm');
        
        try {
          const res = await fetch(`${API_URL}/conductor/ai-voice`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.action === 'repostaje') {
              setRefuelAmount(data.data.cantidad_euros?.toString() || '');
              setRefuelKm(data.data.km_repostaje?.toString() || '');
              setShowRefuelModal(true);
              setSuccessMsg('¡Datos de repostaje capturados! Revisa y guarda.');
            } else if (data.action === 'limpieza') {
              setLimpiezaAmount(data.data.cantidad_euros?.toString() || '');
              setShowLimpiezaModal(true);
              setSuccessMsg('¡Datos de limpieza capturados! Revisa y guarda.');
            } else if (data.action === 'check_out') {
              setKmFin(data.data.km_fin?.toString() || '');
              setSuccessMsg('¡Kilómetros finales capturados! Puedes terminar tu jornada.');
              setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
            } else {
              setErrorMsg('No entendí bien la acción. Por favor, repítelo o rellénalo a mano.');
            }
          } else {
            const err = await res.json();
            setErrorMsg(err.error || 'Error procesando la voz');
          }
        } catch (err) {
          setErrorMsg('Error de red al conectar con IA');
        } finally {
          setAiProcessing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setErrorMsg('No se pudo acceder al micrófono. Da permisos en tu navegador.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  
  // Datos de Check-out
  const [kmFin, setKmFin] = useState('');
  const [fotoFinBase64, setFotoFinBase64] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const fileInputFinRef = useRef(null);

  useEffect(() => {
    loadActiveShift();
    loadPartes();
  }, []);

  const loadPartes = async () => {
    try {
      const res = await fetch(`${API_URL}/conductor/partes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPartesPendientes(data);
      }
    } catch (err) {
      console.error('Error cargando partes', err);
    }
  };

  const handleAceptarParte = (id) => {
    setSelectedParteId(id);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancelarParte = async (id) => {
    const motivo = prompt('Por favor, indica el motivo de la cancelación:');
    if (motivo === null) return; // User cancelled prompt
    
    try {
      const res = await fetch(`${API_URL}/conductor/partes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: 'CANCELADO', motivo_cancelacion: motivo })
      });
      if (res.ok) {
        loadPartes();
      }
    } catch (err) {
      console.error('Error cancelando parte', err);
    }
  };

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
          url_foto_km: fotoBase64,
          id_parte: selectedParteId
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg('Jornada iniciada correctamente.');
        setSelectedMatricula('');
        setKmInicio('');
        setFotoBase64('');
        setSelectedParteId(null);
        loadActiveShift();
        loadPartes();
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
        loadPartes();
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
        <>
          {partesPendientes.length > 0 && (
            <div className="glass-card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: '1.25rem' }}>Tus Partes Asignados</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {partesPendientes.map(p => (
                  <div key={p.id} style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1rem',
                    background: selectedParteId === p.id ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className={`badge ${p.estado === 'CADUCADO' ? 'badge-danger' : 'badge-warning'}`}>{p.estado}</span>
                      <strong>{new Date(p.fecha_hora_recogida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {p.nombre_pasajero}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <strong>Recogida:</strong> {p.direccion_recogida}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      <strong>Destino:</strong> {p.direccion_destino}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <a href={getGoogleMapsLink(p.direccion_recogida, p.direccion_destino)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
                        <Map size={18} style={{ marginRight: '0.5rem' }} /> Ver Ruta en Google Maps
                      </a>
                    </div>

                    {p.estado === 'PENDIENTE' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleAceptarParte(p.id)}
                          className={`btn ${selectedParteId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1 }}
                        >
                          {selectedParteId === p.id ? 'Seleccionado ▼' : 'Aceptar Parte'}
                        </button>
                        <button 
                          onClick={() => handleCancelarParte(p.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Cancelar Parte"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* ==========================================
           FORMULARIO DE CHECK-IN (COMIENZO DE JORNADA)
           ========================================== */}
        <div className="glass-card animate-fade-in" style={{ border: selectedParteId ? '2px solid var(--color-primary)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Play size={20} style={{ color: 'var(--color-success)' }} />
            <h2 style={{ fontSize: '1.25rem' }}>
              {selectedParteId ? 'Comenzar Parte de Trabajo' : 'Comenzar Jornada Libre'}
            </h2>
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
        </>
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

          {/* Controles de Pausa/Reanudación y Voz */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {jornadaActiva.estado === 'ACTIVA' ? (
              <>
                <div style={{ width: '100%', display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`} 
                    style={{ flex: 1, height: '3.5rem', background: isRecording ? 'var(--color-danger)' : 'var(--bg-card)', border: '2px solid', borderColor: isRecording ? 'var(--color-danger)' : 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                    disabled={aiProcessing}
                  >
                    {aiProcessing ? (
                      <><RefreshCw size={24} className="animate-spin" /> Procesando IA...</>
                    ) : isRecording ? (
                      <><MicOff size={24} className="animate-pulse" /> Escuchando... (Suelta para enviar)</>
                    ) : (
                      <><Mic size={24} style={{ color: 'var(--color-primary)' }} /> Mantén pulsado para Dictar</>
                    )}
                  </button>
                </div>
                
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
        <Portal>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
        </Portal>
      )}

      {/* MODAL LIMPIEZA */}
      {showLimpiezaModal && (
        <Portal>
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
        </Portal>
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
  const [activeTab, setActiveTab] = useState('reportes'); // reportes, conductores, vehiculos, partes

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
          
          <button 
            className={`btn ${activeTab === 'partes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('partes')}
          >
            <FileText size={18} />
            <span>Partes</span>
          </button>
          
          <button 
            className={`btn ${activeTab === 'ajustes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ajustes')}
          >
            <Settings size={18} />
            <span>Ajustes</span>
          </button>
          <button 
            className={`btn ${activeTab === 'anomalias' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('anomalias')}
          >
            <TrendingUp size={18} style={{ color: 'var(--color-warning)' }} />
            <span>Analíticas IA</span>
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
        {activeTab === 'partes' && <AdminPartes token={token} />}
        {activeTab === 'anomalias' && <AdminAnomalias token={token} />}
        {activeTab === 'ajustes' && <AdminAjustes token={token} />}
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN - CRUD CONDUCTORES
   ========================================== */
function AdminDrivers({ token }) {
  const [conductores, setConductores] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [conductores]);
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
    <>
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
            {conductores.slice((currentPage - 1) * 25, currentPage * 25).map(c => (
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
      
      <Pagination 
        currentPage={currentPage} 
        totalItems={conductores.length} 
        pageSize={25} 
        onPageChange={setCurrentPage} 
      />
      </div>

      {/* MODAL FORMULARIO */}
      {showModal && (
        <Portal>
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
        </Portal>
      )}
    </>
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
    <>
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
              <th>Km Perdidos</th>
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
                <td>
                  <span className="badge badge-warning" style={{ backgroundColor: 'var(--color-warning)', color: '#000' }}>
                    {v.km_perdidos || 0} km
                  </span>
                </td>
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

      </div>

      {/* MODAL */}
      {showModal && (
        <Portal>
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
        </Portal>
      )}

      {/* MODAL HISTORIAL VEHÍCULO */}
      {historyVehicle && (
        <Portal>
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
        </Portal>
      )}
    </>
  );
}

/* ==========================================
   ADMIN - REPORTES DE KILOMETRAJE
   ========================================== */
function AdminReports({ token }) {
  const [reportsData, setReportsData] = useState({ resumen: { totalKilometros: 0, totalJornadas: 0 }, detalles: [] });
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [reportsData]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  
  // Filtros
  const [selectedConductor, setSelectedConductor] = useState('todos');
  const [selectedVehiculo, setSelectedVehiculo] = useState('todas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [loading, setLoading] = useState(false);
  
  // Visualizar foto en modal
  const [activePhoto, setActivePhoto] = useState('');
  
  // Modal de detalles de la jornada
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadActiveDrivers();
    loadVehicles();
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

  const loadVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/vehiculos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVehiculos(await res.json());
    } catch (err) {}
  };

  const handleFetchReport = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      let query = `conductorId=${selectedConductor}`;
      if (selectedVehiculo && selectedVehiculo !== 'todas') query += `&matricula=${selectedVehiculo}`;
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
            <label className="form-label">Vehículo</label>
            <select 
              className="form-input form-select"
              value={selectedVehiculo}
              onChange={(e) => setSelectedVehiculo(e.target.value)}
            >
              <option value="todas">Todos</option>
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
                reportsData.detalles.slice((currentPage - 1) * 25, currentPage * 25).map(r => {
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
        
        <Pagination 
          currentPage={currentPage} 
          totalItems={reportsData.detalles.length} 
          pageSize={25} 
          onPageChange={setCurrentPage} 
        />
      </div>

      {/* MODAL PARA VER FOTO */}
      {activePhoto && (
        <Portal>
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
        </Portal>
      )}

      {/* MODAL DETALLE DE JORNADA */}
      {selectedReport && (
        <Portal>
<ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
          onRefresh={handleFetchReport}
          token={token}
        />
        </Portal>
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
    hora_fin: formatForInput(report.hora_fin),
    repostajes: report.repostajes ? report.repostajes.map(r => ({ ...r })) : [],
    limpiezas: report.limpiezas ? report.limpiezas.map(l => ({ ...l })) : []
  });

  const handleAddRepostaje = () => {
    setEditForm({
      ...editForm,
      repostajes: [...editForm.repostajes, { cantidad_euros: '', km_repostaje: '', adblue_litros: '', adblue_euros: '' }]
    });
  };

  const handleRemoveRepostaje = (index) => {
    const newArr = [...editForm.repostajes];
    newArr.splice(index, 1);
    setEditForm({ ...editForm, repostajes: newArr });
  };

  const handleRepostajeChange = (index, field, value) => {
    const newArr = [...editForm.repostajes];
    newArr[index][field] = value;
    setEditForm({ ...editForm, repostajes: newArr });
  };

  const handleAddLimpieza = () => {
    setEditForm({
      ...editForm,
      limpiezas: [...editForm.limpiezas, { cantidad_euros: '' }]
    });
  };

  const handleRemoveLimpieza = (index) => {
    const newArr = [...editForm.limpiezas];
    newArr.splice(index, 1);
    setEditForm({ ...editForm, limpiezas: newArr });
  };

  const handleLimpiezaChange = (index, field, value) => {
    const newArr = [...editForm.limpiezas];
    newArr[index][field] = value;
    setEditForm({ ...editForm, limpiezas: newArr });
  };

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
      const payload = { ...editForm };
      if (payload.hora_inicio) {
        payload.hora_inicio = new Date(payload.hora_inicio).toISOString();
      }
      if (payload.hora_fin) {
        payload.hora_fin = new Date(payload.hora_fin).toISOString();
      }

      const res = await fetch(`/api/admin/reportes/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
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

  const handleDelete = async () => {
    if (!window.confirm("¿Estás completamente seguro de que deseas ELIMINAR esta jornada? Esto borrará también todos sus repostajes, pausas y limpiezas de forma irreversible.")) {
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/reportes/${report.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      if (onRefresh) onRefresh();
      onClose();
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setIsEditing(true)}>
                  <Edit size={14} /> Editar
                </button>
                <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)' }} onClick={handleDelete} disabled={saving}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
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
        
        {!isEditing ? (
          (!report.repostajes || report.repostajes.length === 0) ? (
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
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {editForm.repostajes.map((r, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button type="button" onClick={() => handleRemoveRepostaje(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>Repostaje {idx + 1}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Combustible (€)</label>
                    <input type="number" step="0.01" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.cantidad_euros} onChange={e => handleRepostajeChange(idx, 'cantidad_euros', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Km Vehículo</label>
                    <input type="number" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.km_repostaje || ''} onChange={e => handleRepostajeChange(idx, 'km_repostaje', e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>AdBlue (Litros)</label>
                    <input type="number" step="0.1" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.adblue_litros || ''} onChange={e => handleRepostajeChange(idx, 'adblue_litros', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>AdBlue (€)</label>
                    <input type="number" step="0.01" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.adblue_euros || ''} onChange={e => handleRepostajeChange(idx, 'adblue_euros', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }} onClick={handleAddRepostaje}>
              <Plus size={16} /> Añadir Repostaje
            </button>
          </div>
        )}

        <h4 style={{ fontSize: '1rem', marginTop: '2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Droplet size={16} style={{ color: 'var(--color-info)' }} />
          Registro de Limpiezas
        </h4>
        
        {!isEditing ? (
          (!report.limpiezas || report.limpiezas.length === 0) ? (
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
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {editForm.limpiezas.map((r, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button type="button" onClick={() => handleRemoveLimpieza(idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>Limpieza {idx + 1}</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Coste (€)</label>
                  <input type="number" step="0.01" className="form-input" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={r.cantidad_euros} onChange={e => handleLimpiezaChange(idx, 'cantidad_euros', e.target.value)} />
                </div>
              </div>
            ))}
            <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }} onClick={handleAddLimpieza}>
              <Plus size={16} /> Añadir Limpieza
            </button>
          </div>
        )}

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: '2rem' }} onClick={onClose}>
          Cerrar Detalle
        </button>

      </div>

      {/* MODAL PARA VER FOTO (DENTRO DEL DETALLE) */}
      {activePhoto && (
        <Portal>
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
        </Portal>
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

  const handleExportCSV = () => {
    if (repostajesData.detalles.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Fecha y Hora;Conductor;Vehículo;Kilómetros;Coste (€);AdBlue (L);AdBlue (€)\n';

    repostajesData.detalles.forEach(r => {
      const dateStr = new Date(r.fecha_hora).toLocaleDateString('es-ES');
      const timeStr = new Date(r.fecha_hora).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
      const fechaHora = `${dateStr} ${timeStr}`;
      const conductor = r.conductor || '';
      const matricula = r.matricula || '';
      const km = r.km_repostaje || '';
      const coste = parseFloat(r.cantidad_euros || 0).toFixed(2).replace('.', ',');
      const adblueL = parseFloat(r.adblue_litros || 0).toFixed(1).replace('.', ',');
      const adblueE = parseFloat(r.adblue_euros || 0).toFixed(2).replace('.', ',');
      
      csvContent += `${fechaHora};${conductor};${matricula};${km};${coste};${adblueL};${adblueE}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `repostajes_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detalle de Repostajes</h3>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportCSV}
            title="Exportar a CSV"
          >
            <Download size={16} /> Exportar Excel
          </button>
        </div>
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

  const handleExportCSV = () => {
    if (limpiezasData.detalles.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Fecha y Hora;Conductor;Vehículo;Coste (€)\n';

    limpiezasData.detalles.forEach(r => {
      const dateStr = new Date(r.fecha_hora).toLocaleDateString('es-ES');
      const timeStr = new Date(r.fecha_hora).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
      const fechaHora = `${dateStr} ${timeStr}`;
      const conductor = r.conductor || '';
      const matricula = r.matricula || '';
      const coste = parseFloat(r.cantidad_euros || 0).toFixed(2).replace('.', ',');
      
      csvContent += `${fechaHora};${conductor};${matricula};${coste}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `limpiezas_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Detalle de Limpiezas</h3>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={handleExportCSV}
            title="Exportar a CSV"
          >
            <Download size={16} /> Exportar Excel
          </button>
        </div>
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

/* ==========================================
   ADMIN - CRUD PARTES DE TRABAJO
   ========================================== */
function AdminPartes({ token }) {
  const [partes, setPartes] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [suggestedDrivers, setSuggestedDrivers] = useState(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  
  const [subTab, setSubTab] = useState('listado');
  const [resumenData, setResumenData] = useState([]);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyParteId, setHistoryParteId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id_conductor: '',
    fecha_hora_recogida: '',
    nombre_pasajero: '',
    direccion_recogida: '',
    direccion_destino: ''
  });

  const fetchPartes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(API_URL + '/admin/partes', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener los partes');
      setPartes(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchConductores = async () => {
    try {
      const res = await fetch(API_URL + '/admin/conductores', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setConductores(data);
      }
    } catch (err) {
      console.error('Error fetching drivers', err);
    }
  };

  useEffect(() => {
    fetchPartes();
    fetchConductores();
  }, []);

  const fetchResumen = async () => {
    setResumenLoading(true);
    try {
      let query = '';
      if (filtroFechaInicio) query += `fechaInicio=${filtroFechaInicio}&`;
      if (filtroFechaFin) query += `fechaFin=${filtroFechaFin}&`;
      
      const res = await fetch(`${API_URL}/admin/partes/resumen-conductores?${query}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setResumenData(data);
      } else {
        alert(data.error || 'Error al obtener el resumen');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResumenLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'resumen') {
      fetchResumen();
    }
  }, [subTab, filtroFechaInicio, filtroFechaFin]);

  const handleRowClick = async (parte) => {
    if (parte.estado === 'PENDIENTE' || parte.estado === 'CANCELADO') return;
    
    try {
      const res = await fetch(`${API_URL}/admin/reportes?id_parte=${parte.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.detalles && data.detalles.length > 0) {
          setSelectedReport(data.detalles[0]);
        } else {
          alert('Aún no hay datos de jornada para este parte (el conductor no ha iniciado la sesión o hubo un error).');
        }
      }
    } catch (err) {
      console.error('Error fetching report', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        fecha_hora_recogida: new Date(formData.fecha_hora_recogida).toISOString()
      };
      
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_URL}/admin/partes/${editingId}` : `${API_URL}/admin/partes`;
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el parte');
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        id_conductor: '',
        fecha_hora_recogida: '',
        nombre_pasajero: '',
        direccion_recogida: '',
        direccion_destino: ''
      });
      fetchPartes();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (parte, e) => {
    e.stopPropagation();
    setSuggestedDrivers(null);
    
    // Format date for datetime-local input
    const d = new Date(parte.fecha_hora_recogida);
    const pad = (n) => n.toString().padStart(2, '0');
    const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    setFormData({
      id_conductor: parte.id_conductor,
      fecha_hora_recogida: formattedDate,
      nombre_pasajero: parte.nombre_pasajero,
      direccion_recogida: parte.direccion_recogida,
      direccion_destino: parte.direccion_destino
    });
    setEditingId(parte.id);
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas borrar este parte permanentemente?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/partes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar el parte');
      
      fetchPartes();
    } catch (err) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleAdminCancelar = async (id, e) => {
    e.stopPropagation();
    const motivo = prompt('Por favor, indica el motivo de la cancelación:');
    if (motivo === null) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/partes/${id}/cancelar`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token 
        },
        body: JSON.stringify({ motivo_cancelacion: motivo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cancelar el parte');
      
      fetchPartes();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (id, e) => {
    e.stopPropagation();
    setHistoryParteId(id);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/partes/${id}/historial`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setHistoryData(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSugerirConductores = async () => {
    if (!formData.direccion_recogida || !formData.fecha_hora_recogida || !formData.direccion_destino) {
      alert('Para sugerir conductores, primero debes rellenar la Fecha/Hora, Origen y Destino.');
      return;
    }
    setIsSuggesting(true);
    setSuggestedDrivers(null);
    try {
      const res = await fetch(`${API_URL}/admin/partes/sugerencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          origen: formData.direccion_recogida,
          destino: formData.direccion_destino,
          fecha_hora: formData.fecha_hora_recogida
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestedDrivers(data);
        setShowSuggestionsModal(true);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error al obtener sugerencias de Google Maps: ' + err.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    setSuggestedDrivers(null);
    setFormData({
      id_conductor: '',
      fecha_hora_recogida: '',
      nombre_pasajero: '',
      direccion_recogida: '',
      direccion_destino: ''
    });
    setShowModal(true);
  };

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Gestión de Partes de Trabajo</h3>
        <button className="btn btn-primary" onClick={handleOpenNewModal}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Nuevo Parte
        </button>
      </div>

      {errorMsg && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>{errorMsg}</div>}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${subTab === 'listado' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('listado')}
        >
          Listado de Partes
        </button>
        <button 
          className={`btn ${subTab === 'resumen' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSubTab('resumen')}
        >
          Resumen por Conductor
        </button>
      </div>

      {subTab === 'listado' ? (
        <div className="table-container">
        {loading && partes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha/Hora Recogida</th>
                <th>Conductor</th>
                <th>Pasajero</th>
                <th>Origen / Destino</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {partes.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay partes registrados.
                  </td>
                </tr>
              ) : (
                partes.map(p => (
                  <tr 
                    key={p.id} 
                    onClick={() => handleRowClick(p)} 
                    style={{ cursor: (p.estado === 'EN_CURSO' || p.estado === 'COMPLETADO') ? 'pointer' : 'default' }}
                    className={(p.estado === 'EN_CURSO' || p.estado === 'COMPLETADO') ? 'hover-row' : ''}
                    title={(p.estado === 'EN_CURSO' || p.estado === 'COMPLETADO') ? 'Clic para ver detalles de la jornada' : ''}
                  >
                    <td>
                      <strong>{new Date(p.fecha_hora_recogida).toLocaleDateString()}</strong> 
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        {new Date(p.fecha_hora_recogida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>{p.conductor_nombre}</td>
                    <td>{p.nombre_pasajero}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}><strong>Origen:</strong> {p.direccion_recogida}</div>
                      <div style={{ fontSize: '0.85rem' }}><strong>Destino:</strong> {p.direccion_destino}</div>
                      <a href={getGoogleMapsLink(p.direccion_recogida, p.direccion_destino)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', marginTop: '0.25rem' }}>
                        <Map size={14} style={{ marginRight: '0.25rem' }} /> Abrir en Google Maps
                      </a>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.estado === 'COMPLETADO' ? 'badge-success' : 
                        (p.estado === 'CANCELADO' || p.estado === 'CADUCADO') ? 'badge-danger' : 
                        p.estado === 'EN_CURSO' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {p.estado}
                      </span>
                      {p.estado === 'CANCELADO' && p.motivo_cancelacion && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          Motivo: {p.motivo_cancelacion}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', marginRight: '0.5rem' }} 
                        onClick={(e) => handleOpenHistory(p.id, e)}
                        title="Ver Historial"
                      >
                        <History size={16} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', marginRight: '0.5rem' }} 
                        onClick={(e) => handleEdit(p, e)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      {p.estado !== 'CANCELADO' && p.estado !== 'COMPLETADO' && p.estado !== 'CADUCADO' && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', marginRight: '0.5rem', color: 'var(--color-warning)' }} 
                          onClick={(e) => handleAdminCancelar(p.id, e)}
                          title="Cancelar Parte"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem', color: 'var(--color-danger)' }} 
                        onClick={(e) => handleDelete(p.id, e)}
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      ) : (
        <div className="resumen-container">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Desde:</label>
              <input type="date" className="form-input" value={filtroFechaInicio} onChange={e => setFiltroFechaInicio(e.target.value)} style={{ width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hasta:</label>
              <input type="date" className="form-input" value={filtroFechaFin} onChange={e => setFiltroFechaFin(e.target.value)} style={{ width: 'auto' }} />
            </div>
          </div>
          
          <div className="table-container">
            {resumenLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando resumen...</div>
            ) : resumenData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay datos para las fechas seleccionadas.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th style={{ textAlign: 'center' }}>Partes Completados</th>
                    <th style={{ textAlign: 'center' }}>KM Recorridos</th>
                    <th style={{ textAlign: 'right' }}>Combustible (€)</th>
                    <th style={{ textAlign: 'right' }}>Limpiezas (€)</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenData.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.username}</strong></td>
                      <td style={{ textAlign: 'center' }}>{r.partes_completados}</td>
                      <td style={{ textAlign: 'center' }}>{r.total_km} km</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{r.total_combustible > 0 ? `-${r.total_combustible.toFixed(2)} €` : '0.00 €'}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{r.total_limpiezas > 0 ? `-${r.total_limpiezas.toFixed(2)} €` : '0.00 €'}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
                    <td>TOTAL</td>
                    <td style={{ textAlign: 'center' }}>{resumenData.reduce((acc, curr) => acc + curr.partes_completados, 0)}</td>
                    <td style={{ textAlign: 'center' }}>{resumenData.reduce((acc, curr) => acc + curr.total_km, 0)} km</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-{resumenData.reduce((acc, curr) => acc + curr.total_combustible, 0).toFixed(2)} €</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>-{resumenData.reduce((acc, curr) => acc + curr.total_limpiezas, 0).toFixed(2)} €</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content glass-card animate-scale-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{editingId ? 'Editar Parte' : 'Crear Nuevo Parte'}</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Conductor *</span>
                    <button type="button" className="btn btn-secondary" onClick={handleSugerirConductores} disabled={isSuggesting} style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}>
                      {isSuggesting ? 'Calculando...' : '💡 Sugerir (Usar Maps)'}
                    </button>
                  </label>
                  
                  <select 
                    className="form-input form-select" 
                    required 
                    value={formData.id_conductor}
                    onChange={(e) => setFormData({...formData, id_conductor: e.target.value})}
                  >
                    <option value="">Seleccionar conductor...</option>
                    {suggestedDrivers ? (
                      suggestedDrivers.map(c => (
                        <option key={c.id_conductor} value={c.id_conductor}>{c.username}</option>
                      ))
                    ) : (
                      conductores.map(c => (
                        <option key={c.id} value={c.id}>{c.username}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha y Hora de Recogida</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    required 
                    value={formData.fecha_hora_recogida}
                    onChange={(e) => setFormData({...formData, fecha_hora_recogida: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre del Pasajero</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.nombre_pasajero}
                    onChange={(e) => setFormData({...formData, nombre_pasajero: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección de Recogida</label>
                  <AddressAutocomplete 
                    value={formData.direccion_recogida}
                    onChange={(val) => setFormData({...formData, direccion_recogida: val})}
                    placeholder="Escribe la dirección de origen"
                    token={token}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección de Destino</label>
                  <AddressAutocomplete 
                    value={formData.direccion_destino}
                    onChange={(val) => setFormData({...formData, direccion_destino: val})}
                    placeholder="Escribe la dirección de destino"
                    token={token}
                  />
                </div>

                {editingId && partes.find(p => p.id === editingId)?.estado === 'CANCELADO' && (
                  <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <strong>Nota:</strong> Estás editando un parte que fue cancelado. Al guardar los cambios, el parte se reabrirá y volverá al estado <strong>PENDIENTE</strong>, asignándose al conductor seleccionado.
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Guardando...' : (editingId ? 'Guardar Cambios y Reasignar' : 'Crear Parte de Trabajo')}
                </button>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {showSuggestionsModal && suggestedDrivers && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div className="modal-content glass-card animate-scale-in" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary)' }}>💡 Sugerencias por proximidad</h3>
                <button onClick={() => setShowSuggestionsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {suggestedDrivers.map((s, idx) => {
                  const isBest = idx === 0 && !s.conflicto;
                  const borderColor = s.conflicto ? 'var(--color-error)' : (isBest ? 'var(--color-success)' : 'var(--border-color)');
                  const textColor = s.conflicto ? 'var(--color-error)' : (isBest ? 'var(--color-success)' : 'inherit');
                  
                  // Verificar si está libre desde el día anterior
                  let libreMismoDia = false;
                  if (s.libre_a_las && formData.fecha_hora_recogida) {
                    const d1 = new Date(s.libre_a_las);
                    const d2 = new Date(formData.fecha_hora_recogida);
                    libreMismoDia = d1.getFullYear() === d2.getFullYear() && 
                                    d1.getMonth() === d2.getMonth() && 
                                    d1.getDate() === d2.getDate();
                  }

                  return (
                    <div key={s.id_conductor} style={{ padding: '0.75rem', borderLeft: `4px solid ${borderColor}`, marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: textColor, fontSize: '1.1rem' }}>
                          {idx + 1}. {s.username} {s.conflicto && '(Conflicto)'}
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: 'normal' }}>
                            ({s.numero_partes || 0} partes este día | Puntaje: {s.score_equidad})
                          </span>
                        </strong>
                        {s.duracion_aproximacion_segs === null ? (
                          <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>(Sin servicio previo)</div>
                        ) : (
                          <div style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                            {libreMismoDia 
                              ? `Libre a las ${new Date(s.libre_a_las).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` 
                              : <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Hoy está libre.</span>
                            } 
                            {' '}Aprox: {s.tiempo_texto} ({s.distancia_texto}) desde {s.direccion_origen_viaje_aproximacion}
                          </div>
                        )}
                        {s.conflicto && (
                          <div style={{ marginTop: '0.25rem', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                            ⚠️ {s.detalles_conflicto}
                          </div>
                        )}
                      </div>
                      <button 
                        className={`btn ${isBest ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.5rem 1rem', marginLeft: '1rem' }}
                        onClick={() => {
                          setFormData({...formData, id_conductor: s.id_conductor});
                          setShowSuggestionsModal(false);
                        }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {selectedReport && (
        <Portal>
          <ReportDetailModal 
            report={selectedReport} 
            onClose={() => setSelectedReport(null)} 
            onRefresh={() => { setSelectedReport(null); fetchPartes(); }}
            token={token}
          />
        </Portal>
      )}

      {showHistoryModal && (
        <Portal>
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content glass-card animate-scale-in" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Historial del Parte</h3>
                <button onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando historial...</div>
              ) : historyData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No hay eventos registrados para este parte.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {historyData.map((h) => (
                    <div key={h.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--color-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--color-primary)' }}>{h.accion.replace(/_/g, ' ')}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(h.creado_en).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <strong>Usuario:</strong> {h.username || 'Sistema'} {h.rol ? `(${h.rol})` : ''}
                      </div>
                      {h.detalles && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                          {h.detalles}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* ==========================================
   ADMIN - AJUSTES
   ========================================== */
function AdminAnomalias({ token }) {
  const [data, setData] = useState({ reporteIA: '', anomalias: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnomalias();
  }, []);

  const loadAnomalias = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/analytics/anomalias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        const err = await res.json();
        setError(err.error || 'Error cargando analíticas');
      }
    } catch (err) {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--color-primary)' }} /><p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Analizando tiempos con IA...</p></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-warning)' }}>
        <AlertCircle size={28} />
        Detección de Anomalías (IA)
      </h2>

      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} /> Reporte Ejecutivo
        </h3>
        <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {data.reporteIA}
        </p>
      </div>

      <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Top Anomalías (Más de 10% desviación)</h3>
      {data.anomalias.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No hay anomalías registradas.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Conductor</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Ruta</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Tiempo Estimado</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Tiempo Real</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Desviación</th>
              </tr>
            </thead>
            <tbody>
              {data.anomalias.map(a => (
                <tr key={a.parte_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{a.conductor_nombre}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {a.direccion_recogida.split(',')[0]} &rarr; {a.direccion_destino.split(',')[0]}<br/>
                    <small>Pax: {a.nombre_pasajero}</small>
                  </td>
                  <td style={{ padding: '1rem' }}>{a.mins_estimados} min</td>
                  <td style={{ padding: '1rem', color: 'var(--color-danger)', fontWeight: 'bold' }}>{a.mins_reales} min</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      background: a.desviacion_porcentaje > 50 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      color: a.desviacion_porcentaje > 50 ? 'var(--color-danger)' : 'var(--color-warning)',
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontWeight: 'bold' 
                    }}>
                      +{a.desviacion_porcentaje}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminAjustes({ token }) {
  const [direccionBase, setDireccionBase] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL + '/admin/configuracion', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setDireccionBase(data.direccion_base || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(API_URL + '/admin/configuracion', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ direccion_base: direccionBase })
      });
      if (res.ok) {
        alert('Configuración guardada correctamente.');
      } else {
        const data = await res.json();
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Ajustes de la Empresa</h3>
      
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando ajustes...</div>
      ) : (
        <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 'bold' }}>Dirección del Centro Base</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Esta dirección se usará como punto de partida para los conductores que no tengan partes previos o cuyo último parte haya sido en días anteriores.
            </p>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej: Calle Larios, Málaga"
              value={direccionBase}
              onChange={(e) => setDireccionBase(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Ajustes'}
          </button>
        </form>
      )}
    </div>
  );
}
