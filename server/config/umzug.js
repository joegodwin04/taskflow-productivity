import { Umzug, SequelizeStorage } from 'umzug'
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'
import sequelize from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const migrator = new Umzug({
  migrations: {
    glob: path.join(__dirname, '..', 'migrations', '*.js').replace(/\\/g, '/'),
    resolve: ({ name, path: filePath, context }) => {
      const importPath = pathToFileURL(filePath).href
      return {
        name,
        up: async () => {
          const migration = await import(importPath)
          return migration.up({ context })
        },
        down: async () => {
          const migration = await import(importPath)
          return migration.down({ context })
        },
      }
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
})
