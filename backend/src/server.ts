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
    const versionResult = await pool.request().query('SELECT @@VERSION');
    const dbNameResult = await pool.request().query('SELECT DB_NAME() as db_name');
    res.json({
      message: 'Database connection successful!',
      version: versionResult.recordset[0][''],
      dbName: dbNameResult.recordset[0].db_name
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/loan-details', async (req: Request, res: Response) => {
  const { searchTerm } = req.query;

  if (!searchTerm || typeof searchTerm !== 'string') {
    return res.status(400).json({ error: 'Search term is required' });
  }

  let queryColumn = '';
  if (/^\d{9}$/.test(searchTerm)) {
    queryColumn = 'int_loanno';
  } else if (/^\d{6}$/.test(searchTerm)) {
    queryColumn = 'int_loanappid';
  } else if (/[a-zA-Z]/.test(searchTerm)) {
    queryColumn = 'vchr_appreceivregno';
  } else {
    return res.status(400).json({ error: 'Invalid search term format' });
  }

  try {
    const pool = getPool();
    const result = await pool.request().query(
      `SELECT int_loanappid, vchr_appreceivregno, vchr_applname, int_loanno
       FROM tbl_loanapp
       WHERE ${queryColumn} = '${searchTerm}'`
    );
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(result.recordset[0]);
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