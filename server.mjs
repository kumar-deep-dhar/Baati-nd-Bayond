import 'dotenv/config';
import express from 'express';
import Redis from 'ioredis';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 3001);
const allowedOrigin = process.env.FRONTEND_URL || '*';
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const cacheKey = 'baati:products';

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.setHeader('Access-Control-Allow-Origin', allowedOrigin); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS'); if (req.method === 'OPTIONS') return res.sendStatus(204); next(); });

app.get('/api/health', async (_req, res) => {
  let redisStatus = 'not configured';
  if (redis) {
    try { await redis.ping(); redisStatus = 'connected'; } catch { redisStatus = 'unavailable'; }
  }
  res.json({ ok: true, redis: redisStatus, firebase: 'client-side' });
});

app.get('/api/cache/products', async (_req, res) => {
  if (!redis) return res.json({ cached: false, products: null });
  try {
    const value = await redis.get(cacheKey);
    res.json({ cached: Boolean(value), products: value ? JSON.parse(value) : null });
  } catch {
    res.status(503).json({ cached: false, products: null, error: 'Redis unavailable' });
  }
});

app.put('/api/cache/products', async (req, res) => {
  if (!redis) return res.status(503).json({ cached: false, error: 'REDIS_URL is not configured' });
  if (!Array.isArray(req.body?.products)) return res.status(400).json({ error: 'products must be an array' });
  try {
    await redis.set(cacheKey, JSON.stringify(req.body.products), 'EX', 300);
    res.json({ cached: true, expiresIn: 300 });
  } catch {
    res.status(503).json({ cached: false, error: 'Redis unavailable' });
  }
});

app.delete('/api/cache/products', async (_req, res) => {
  if (!redis) return res.json({ cleared: false });
  try { await redis.del(cacheKey); res.json({ cleared: true }); }
  catch { res.status(503).json({ cleared: false, error: 'Redis unavailable' }); }
});

app.use(express.static(path.resolve('dist')));
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) return res.sendFile(path.resolve('dist/index.html'));
  next();
});

app.listen(port, () => console.log(`Baati API listening on http://localhost:${port}`));
