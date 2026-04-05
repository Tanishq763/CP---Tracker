const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const codeforcesRoutes = require('./routes/codeforces');
const authRoutes = require('./routes/auth');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Attach user to all requests if token present
app.use(optionalAuth);

app.use('/api/auth', authRoutes);
app.use('/api', codeforcesRoutes);

app.get('/', (req, res) => res.json({ message: 'CP Tracker API running' }));

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY)    console.warn('⚠️  GROQ_API_KEY not set');
  if (!process.env.GOOGLE_CLIENT_ID) console.warn('⚠️  GOOGLE_CLIENT_ID not set');
  if (!process.env.JWT_SECRET)       console.warn('⚠️  JWT_SECRET not set — using default (change in production!)');
});
