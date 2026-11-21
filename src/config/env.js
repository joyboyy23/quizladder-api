// Loads .env once and fails fast when a required key is missing.
require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const usesUrl = Boolean(process.env.DATABASE_URL);

const REQUIRED = [
  // On Render the single DATABASE_URL replaces the five DB_ keys.
  ...(usesUrl ? [] : ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']),
  'HUB_API_KEY', 'JWT_SECRET', 'CORS_ORIGINS',
];
const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required .env keys: ${missing.join(', ')}. ` +
    'Copy .env.example to .env and fill in your own values.'
  );
}

// Tests use their own database, so your own data is never touched.
const dbName = process.env.DB_NAME && nodeEnv === 'test'
  ? `${process.env.DB_NAME}_test`
  : process.env.DB_NAME;

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT) || 3001,
  hubApiKey: process.env.HUB_API_KEY,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  corsOrigins: process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  db: {
    url: process.env.DATABASE_URL || null,
    ssl: process.env.DB_SSL === 'true',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    name: dbName,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
};