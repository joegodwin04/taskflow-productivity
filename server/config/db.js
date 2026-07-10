// db.js — SQLite/PostgreSQL connection via Sequelize
//
// DATABASE SELECTION LOGIC:
//   1. If DATABASE_URL is set AND points to a real non-localhost Postgres host → use PostgreSQL
//   2. If DB_STORAGE_PATH is set → use SQLite at that path (e.g. Render persistent disk)
//   3. Otherwise → use SQLite at <project-root>/database.sqlite (default for local dev)
//
// WARNING: Never use SQLite on Render without a persistent disk. The default container
// filesystem is EPHEMERAL — it is wiped on every deploy/restart, deleting all user data.
// Always use Option A (Postgres) or Option B (persistent disk) in production on Render.

import { Sequelize } from 'sequelize'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Returns true only if DATABASE_URL is set AND is a real remote Postgres URL
 * (not a localhost/127.0.0.1 placeholder).
 */
function isRealPostgresUrl(url) {
  if (!url) return false
  try {
    const parsed = new URL(url)
    // Accept only postgres/postgresql protocol pointed at a real host
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) return false
    const host = parsed.hostname
    // Reject localhost/loopback placeholders – they are not real deployments
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      console.warn(
        `⚠️  DATABASE_URL is set but points to localhost ("${host}"). ` +
        `This is a placeholder. Falling back to SQLite for local development. ` +
        `Set DATABASE_URL to a real remote Postgres URL for production.`
      )
      return false
    }
    return true
  } catch {
    console.warn('⚠️  DATABASE_URL is set but could not be parsed. Falling back to SQLite.')
    return false
  }
}

let sequelize

if (isRealPostgresUrl(process.env.DATABASE_URL)) {
  // ── Production: Real remote PostgreSQL ───────────────────────────────────
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  })
  console.log('🗄️  Database mode: PostgreSQL (remote)')
} else {
  // ── Local / SQLite fallback ───────────────────────────────────────────────
  const storagePath = process.env.DB_STORAGE_PATH
    ? path.resolve(process.env.DB_STORAGE_PATH)
    : path.join(__dirname, '..', '..', 'database.sqlite')

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  })

  if (process.env.DB_STORAGE_PATH) {
    console.log(`🗄️  Database mode: SQLite (persistent disk) → ${storagePath}`)
  } else {
    console.log(`🗄️  Database mode: SQLite (local) → ${storagePath}`)
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '🚨 CRITICAL WARNING: Running SQLite in production WITHOUT a persistent disk path!\n' +
        '   All user data will be lost on every server restart/redeploy.\n' +
        '   Fix: Set DATABASE_URL (Postgres) or DB_STORAGE_PATH (persistent disk) in your\n' +
        '   Render service environment variables.'
      )
    }
  }
}

export const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log(`✅ Database connected successfully via Sequelize (${sequelize.getDialect()})`)
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`)
    process.exit(1)
  }
}

export default sequelize
