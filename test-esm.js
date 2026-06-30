import { sequelize } from './server/models/index.js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Dialect:', sequelize.getDialect());
console.log('Env var JWT_SECRET:', process.env.JWT_SECRET);
