// ── Groq API Key Rotation Pool ────────────────────────────────────────────────
// Self-contained — uses its own axios, no dependency on caller
// Rotates keys automatically, cools down on 429

const axios = require('axios');

const keys = [];
let currentIndex = 0;
const cooldowns = {};

// ── Load all keys from env ─────────────────────────────────────────────────────
const loadKeys = () => {
  if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
  let i = 1;
  while (process.env[`GROQ_API_KEY_${i}`]) {
    keys.push(process.env[`GROQ_API_KEY_${i}`]);
    i++;
  }
  const unique = [...new Set(keys)];
  keys.length = 0;
  keys.push(...unique);
  console.log(`✅ Groq key pool: ${keys.length} key(s) loaded`);
};

loadKeys();

// ── Get next available key ─────────────────────────────────────────────────────
const getNextKey = () => {
  if (keys.length === 0) throw new Error('No GROQ API keys configured in .env');

  const now = Date.now();
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx = (currentIndex + attempt) % keys.length;
    const key = keys[idx];
    if (now >= (cooldowns[key] || 0)) {
      currentIndex = (idx + 1) % keys.length;
      return key;
    }
  }

  // All cooling down — find soonest recovery
  const soonest = keys.reduce((best, k) =>
    (cooldowns[k] || 0) < (cooldowns[best] || 0) ? k : best, keys[0]);
  const waitSec = Math.ceil(((cooldowns[soonest] || 0) - Date.now()) / 1000);
  throw new Error(`All Groq keys are rate limited. Try again in ${waitSec} seconds.`);
};

// ── Mark a key as rate-limited ─────────────────────────────────────────────────
const markKeyRateLimited = (key, cooldownSeconds = 65) => {
  cooldowns[key] = Date.now() + cooldownSeconds * 1000;
  console.warn(`⚠️ Key ...${key.slice(-6)} rate limited — cooling down ${cooldownSeconds}s`);
};

// ── Main function: make Groq request with auto key rotation ───────────────────
const groqRequest = async (prompt, options = {}) => {
  const {
    model = 'llama-3.3-70b-versatile',
    temperature = 0.65,
    max_tokens = 8000,
  } = options;

  const maxRetries = Math.max(keys.length, 1);
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let key;
    try {
      key = getNextKey();
    } catch (e) {
      throw e; // All keys rate limited
    }

    try {
      console.log(`🔑 Using key ...${key.slice(-6)} (attempt ${attempt + 1}/${maxRetries})`);
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
          },
          timeout: 90000,
        }
      );
      return res.data.choices[0].message.content.trim(); // return text directly
    } catch (err) {
      lastError = err;
      if (err.response?.status === 429) {
        markKeyRateLimited(key, 65);
        console.log(`↩️  Retrying with next key...`);
        continue;
      }
      throw err; // non-429 error
    }
  }

  throw lastError || new Error('All Groq API attempts failed');
};

// ── Pool status for /api/groq-status endpoint ─────────────────────────────────
const getPoolStatus = () => {
  const now = Date.now();
  return {
    totalKeys: keys.length,
    available: keys.filter(k => (cooldowns[k] || 0) <= now).length,
    coolingDown: keys.filter(k => (cooldowns[k] || 0) > now).length,
    keys: keys.map((k, i) => ({
      index: i + 1,
      suffix: `...${k.slice(-6)}`,
      available: (cooldowns[k] || 0) <= now,
      availableIn: Math.max(0, Math.ceil(((cooldowns[k] || 0) - now) / 1000)),
    })),
  };
};

module.exports = { groqRequest, getPoolStatus };
