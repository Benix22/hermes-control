import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hermes_super_secret_key_2026';

export function verifyAuth(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return { error: 'Acceso denegado. Token no proporcionado.', status: 401 };

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { user };
  } catch (err) {
    return { error: 'Token inválido o expirado.', status: 403 };
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
