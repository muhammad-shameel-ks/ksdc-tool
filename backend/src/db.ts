import sql from "mssql";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, ".env") });

// In development, log connection details for debugging purposes.
if (process.env.NODE_ENV !== 'production') {
  console.log('--- DATABASE CONNECTION DEBUG ---');
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_SERVER:', process.env.DB_SERVER);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_DATABASE:', process.env.DB_DATABASE);
  console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('--- END DATABASE CONNECTION DEBUG ---');
}
const baseConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER!,
  port: Number(process.env.DB_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: process.env.NODE_ENV === "production", // Use this if you're on Azure SQL
    trustServerCertificate: true, // Change to true for local dev / self-signed certs
  },
};

let pool: sql.ConnectionPool | null = null;
let currentDB: string | undefined = process.env.DB_DATABASE;

export const connectDB = async (dbName?: string) => {
  if (pool && !dbName) {
    return; // Already connected, and no new DB name provided
  }

  if (pool) {
    await pool.close();
    pool = null;
  }

  currentDB = dbName || process.env.DB_DATABASE;

  const sqlConfig: sql.config = {
    ...baseConfig,
    database: currentDB,
  };

  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log(`✅ Database connection to ${currentDB} successful!`);
  } catch (err) {
    console.error(`❌ Database Connection to ${currentDB} Failed:`, err);
    pool = null; // Reset pool on connection failure
    throw err; // Re-throw error to be handled by caller
  }
};

export const getPool = (): sql.ConnectionPool => {
  if (!pool) {
    throw new Error(
      "Database not connected. Call connectDB() during server initialization."
    );
  }
  return pool;
};
