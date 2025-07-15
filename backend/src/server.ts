import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB, getPool } from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// Test route to verify database connection
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT @@VERSION');
    res.json({
      message: 'Database connection successful!',
      version: result.recordset[0]['']
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
};

startServer();