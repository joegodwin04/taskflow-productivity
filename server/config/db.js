// db.js — SQLite/PostgreSQL connection via Sequelize
import { Sequelize } from 'sequelize'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let sequelize;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL if DATABASE_URL is provided (e.g. Render, Supabase, Neon)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // Fallback to SQLite with configurable persistent path
  const storagePath = process.env.DB_STORAGE_PATH 
    ? path.resolve(process.env.DB_STORAGE_PATH)
    : path.join(__dirname, '..', '..', 'database.sqlite');
    
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false, // Set to console.log to see SQL queries
  });
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
