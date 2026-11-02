import jwt from 'jsonwebtoken';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'lostlecture_secret_dev_key_fallback_123456789',
    { expiresIn: '7d' }
  );
};

