/**
 * CookMate server — thin proxy so the browser never holds any credential.
 *
 *   browser  ──POST /api/plan──▶  this server  ──▶  Vertex AI (GCP credits)
 *                                                 └▶  Gemini Developer API (fallback)
 *
 * Vertex requires service-account OAuth, which must live server-side — that is
 * the whole reason this proxy exists (and why the key never ships to the client).
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const provider = require('./llm/provider');

const app = express();
app.use(express.json({ limit: '4mb' }));

// Serve ONLY index.html on "/" — no express.static, so .env / server.js / llm/*
// are never exposed as static files. All assets in index.html are inline or CDN.
app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Tells the frontend which billing path is live (vertex = GCP credits).
app.get('/api/health', (_req, res) => res.json(provider.status()));

// The one generation endpoint the agent loop calls.
app.post('/api/plan', async (req, res) => {
  try {
    const { prompt, schema, temperature } = req.body || {};
    if (!prompt || !schema) return res.status(400).json({ error: 'prompt and schema are required' });
    const result = await provider.generatePlan(prompt, schema, { temperature });
    res.json(result); // { provider, model, plan }
  } catch (err) {
    res.status(502).json({ error: String(err && err.message || err) });
  }
});

const PORT = process.env.PORT || 5599;
app.listen(PORT, () => {
  const s = provider.status();
  const billing = s.provider === 'claude'
    ? `Claude API · model ${s.model}`
    : s.provider === 'vertex'
      ? `Vertex AI · project ${s.project} · USES GCP CREDITS ✅`
      : s.provider === 'developer'
        ? 'Gemini Developer API · ⚠ NOT GCP credits (fallback)'
        : 'NONE configured — set ANTHROPIC_API_KEY / Vertex creds / GEMINI_API_KEY in .env';
  console.log(`\nCookMate → http://localhost:${PORT}`);
  console.log(`Provider: ${billing}\n`);
});
