const jwt = require('jsonwebtoken');
const supabase = require('../db/supabaseClient');
const JWT_SECRET = process.env.APP_JWT_SECRET;

module.exports = async function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.userId).single();
    if (error) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
