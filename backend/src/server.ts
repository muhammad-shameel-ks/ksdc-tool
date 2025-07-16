import express, { Request, Response } from 'express';
import cors from 'cors';
import sql from 'mssql';
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
    const result = await pool.request()
      .input('searchTerm', searchTerm)
      .query(
        `SELECT int_loanappid, vchr_appreceivregno, vchr_applname, int_loanno
         FROM tbl_loanapp
         WHERE ${queryColumn} = @searchTerm`
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

app.post('/api/check-receipt', async (req: Request, res: Response) => {
  const { loanno, receiptAmount, date, receiptNo } = req.body;

  if (!loanno || !receiptAmount || !date || !receiptNo) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getPool();
    const exactMatchQuery = `
      SELECT * FROM tbl_Loantrans
      WHERE int_loanno = @loanno
      AND chr_rec_no = @receiptNo
      AND int_amt = @receiptAmount
      AND CAST(dt_transaction AS DATE) = @date
    `;
    const result = await pool.request()
      .input('loanno', sql.Int, loanno)
      .input('receiptNo', sql.VarChar, receiptNo)
      .input('receiptAmount', sql.Decimal(18, 2), receiptAmount)
      .input('date', sql.Date, date)
      .query(exactMatchQuery);

    if (result.recordset.length > 0) {
      return res.json({
        status: 'found',
        query: exactMatchQuery,
        result: result.recordset,
        debugInfo: { loanno, receiptNo, receiptAmount, date }
      });
    }

    // If not found, check for other receipts on the same date
    const dateMatchQuery = `
      SELECT * FROM tbl_Loantrans
      WHERE int_loanno = @loanno
      AND CAST(dt_transaction AS DATE) = @date
    `;
    const dateMatchResult = await pool.request()
      .input('loanno', sql.Int, loanno)
      .input('date', sql.Date, date)
      .query(dateMatchQuery);

    if (dateMatchResult.recordset.length > 0) {
        return res.json({
            status: 'not_found_warning',
            query1: exactMatchQuery,
            result1: [],
            query2: dateMatchQuery,
            result2: dateMatchResult.recordset,
            debugInfo: { loanno, receiptNo, receiptAmount, date }
        });
    }

    return res.json({
        status: 'not_found_clean',
        query1: exactMatchQuery,
        result1: [],
        query2: dateMatchQuery,
        result2: [],
        debugInfo: { loanno, receiptNo, receiptAmount, date }
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