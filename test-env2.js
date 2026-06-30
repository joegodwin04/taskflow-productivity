import 'dotenv/config';
import { sequelize } from './server/models/index.js';

console.log('Dialect:', sequelize.getDialect());
