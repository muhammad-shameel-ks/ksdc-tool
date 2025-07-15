import sql from 'mssql';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const sqlConfig: sql.config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: process.env.NODE_ENV === 'production', // Use this if you're on Azure SQL
    trustServerCertificate: true // Change to true for local dev / self-signed certs
  }
};

let pool: sql.ConnectionPool | null = null;

export const connectDB = async () => {
  if (pool) {
    return;
  }
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log('✅ Database connection successful!');
  } catch (err) {
    console.error('❌ Database Connection Failed:', err);
    pool = null; // Reset pool on connection failure
    process.exit(1); // Exit if we can't connect to the DB
  }
};

export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() during server initialization.');
  }
  return pool;
};