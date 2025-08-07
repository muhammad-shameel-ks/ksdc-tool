import express, { Request, Response } from "express";
import cors from "cors";
import sql from "mssql";
import { connectDB, getPool } from "./db";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3001;

// --- Security Enhancements ---

// 1. API Key Authentication Middleware
const API_KEY = process.env.VITE_API_KEY; // Should be in .env

if (!API_KEY) {
  console.warn(
    "⚠️ WARNING: API_KEY is not set. Using a default, insecure key. Please set a secure API_KEY in your .env file for production."
  );
}
const SECURE_API_KEY = API_KEY || "default-insecure-api-key-change-me";

const apiKeyAuth = (req: Request, res: Response, next: Function) => {
  const providedApiKey = req.headers["x-api-key"];
  if (req.path === "/api/test") {
    return next();
  }
  if (!providedApiKey || providedApiKey !== SECURE_API_KEY) {
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid or missing API Key" });
  }
  next();
};

// 2. Whitelist for database switching
const ALLOWED_DATABASES =
  (process.env.ALLOWED_DATABASES || process.env.DB_DATABASE)
    ?.split(",")
    .map((db) => db.trim()) || [];
if (ALLOWED_DATABASES.length === 0) {
  console.warn(
    "⚠️ WARNING: No allowed databases configured. Database switching will be disabled."
  );
}

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies
app.use(apiKeyAuth); // Apply API key authentication to all routes

// Test route to verify server is running
app.get("/api/test", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    const versionResult = await pool.request().query("SELECT @@VERSION");
    const dbNameResult = await pool
      .request()
      .query("SELECT DB_NAME() as db_name");
    res.json({
      message: "Database connection successful!",
      version: versionResult.recordset[0][""],
      dbName: dbNameResult.recordset[0].db_name,
    });
  } catch (err) {
    console.error("[/api/test] Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to connect to the database.",
    });
  }
});

app.post("/api/switch-db", async (req: Request, res: Response) => {
  const { dbName } = req.body;
  if (!dbName) {
    return res.status(400).json({ error: "dbName is required" });
  }
  // Security: Enforce a whitelist for allowed databases
  if (!ALLOWED_DATABASES.includes(dbName)) {
    return res
      .status(403)
      .json({ error: "Access to this database is not permitted" });
  }
  try {
    await connectDB(dbName);
    res.json({ message: `Successfully switched to database: ${dbName}` });
  } catch (err: any) {
    console.error("Failed to switch database", err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred while switching databases."
        : err.message;
    res
      .status(500)
      .json({ error: "Failed to switch database", message: errorMessage });
  }
});

app.get("/api/current-db", async (req: Request, res: Response) => {
  try {
    const pool = getPool();
    if (!pool.connected) {
      await connectDB();
    }
    const result = await pool.request().query("SELECT DB_NAME() as db_name");
    res.json({ dbName: result.recordset[0].db_name });
  } catch (err) {
    console.error("Failed to get current db", err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred while fetching the current database."
        : (err as Error).message;
    res
      .status(500)
      .json({ error: "Failed to get current database", message: errorMessage });
  }
});

app.get(
  "/api/transaction/:loanNo/:transNo",
  async (req: Request, res: Response) => {
    const { loanNo, transNo } = req.params;

    if (!loanNo || !transNo) {
      return res
        .status(400)
        .json({ error: "Loan number and transaction number are required" });
    }

    try {
      const pool = getPool();
      const result = await pool
        .request()
        .input("loanNo", sql.VarChar, loanNo)
        .input("transNo", sql.VarChar, transNo).query(`
        SELECT *
        FROM tbl_Acctrans
        WHERE int_loanno = @loanNo AND vchr_TransNo = @transNo
      `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(result.recordset);
    } catch (err) {
      console.error(err);
      const errorMessage =
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred."
          : (err as Error).message;
      res
        .status(500)
        .json({ error: "Internal Server Error", message: errorMessage });
    }
  }
);

app.get("/api/loan-details", async (req: Request, res: Response) => {
  const { searchTerm } = req.query;

  if (!searchTerm || typeof searchTerm !== "string") {
    return res.status(400).json({ error: "Search term is required" });
  }

  // --- SQL Injection Fix ---
  // Determine the query based on the search term format, but do not inject the column name directly.
  // Instead, use a complete, parameterized query for each case.
  let query = "";
  if (/^\d{9}$/.test(searchTerm)) {
    query = `SELECT int_loanappid, vchr_appreceivregno, vchr_applname, int_loanno
             FROM tbl_loanapp
             WHERE int_loanno = @searchTerm`;
  } else if (/^\d{6}$/.test(searchTerm)) {
    query = `SELECT int_loanappid, vchr_appreceivregno, vchr_applname, int_loanno
             FROM tbl_loanapp
             WHERE int_loanappid = @searchTerm`;
  } else if (/[a-zA-Z]/.test(searchTerm)) {
    query = `SELECT int_loanappid, vchr_appreceivregno, vchr_applname, int_loanno
             FROM tbl_loanapp
             WHERE vchr_appreceivregno = @searchTerm`;
  } else {
    return res.status(400).json({ error: "Invalid search term format" });
  }

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("searchTerm", sql.VarChar, searchTerm) // Explicitly set type for safety
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    res.json(result.recordset[0]);
  } catch (err: any) {
    console.error(err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message;
    res
      .status(500)
      .json({ error: "Internal Server Error", message: errorMessage });
  }
});

app.post("/api/check-receipt", async (req: Request, res: Response) => {
  const { loanno, receiptAmount, date, receiptNo } = req.body;
  const queries: {
    title: string;
    query: string;
    result?: any[];
    status?: string;
  }[] = [];

  if (!loanno || !receiptAmount || !date || !receiptNo) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pool = getPool();
    const request = pool.request(); // Create a single request object

    // 1. Check if loan exists
    const loanExistsQuery = `SELECT int_loanno FROM tbl_loanapp WHERE int_loanno = @loanno`;
    queries.push({ title: "Checking if loan exists", query: loanExistsQuery });
    const loanExistsResult = await request
      .input("loanno", sql.Int, loanno)
      .query(loanExistsQuery);
    queries[0].result = loanExistsResult.recordset;

    if (loanExistsResult.recordset.length === 0) {
      queries[0].status = "error";
      return res.status(404).json({
        status: "loan_not_found",
        message: "This loan number does not exist.",
        queries,
      });
    }
    queries[0].status = "success";

    // 2. Check for exact receipt match
    const exactMatchQuery = `
        SELECT * FROM tbl_Loantrans
        WHERE int_loanno = @loanno
        AND chr_rec_no = @receiptNo
        AND int_amt = @receiptAmount
        AND CAST(dt_transaction AS DATE) = @date
    `;
    queries.push({
      title: "Checking for exact receipt match",
      query: exactMatchQuery,
    });
    const exactMatchResult = await request
      .input("receiptNo", sql.VarChar, receiptNo)
      .input("receiptAmount", sql.Decimal(18, 2), receiptAmount)
      .input("date", sql.Date, date)
      .query(exactMatchQuery);
    queries[1].result = exactMatchResult.recordset;

    if (exactMatchResult.recordset.length > 0) {
      queries[1].status = "success";
      return res.json({
        status: "receipt_found",
        message: "An exact match for this receipt was found.",
        queries,
      });
    }
    queries[1].status = "warning";

    // 3. Check for double entry (same loan, amount, date, but different receipt number)
    const doubleEntryQuery = `
        SELECT * FROM tbl_Loantrans
        WHERE int_loanno = @loanno
        AND int_amt = @receiptAmount
        AND CAST(dt_transaction AS DATE) = @date
        AND chr_rec_no != @receiptNo
    `;
    queries.push({
      title: "Checking for potential double entry",
      query: doubleEntryQuery,
    });
    const doubleEntryResult = await request.query(doubleEntryQuery);
    queries[2].result = doubleEntryResult.recordset;

    if (doubleEntryResult.recordset.length > 0) {
      queries[2].status = "error";
      return res.json({
        status: "double_entry_warning",
        message:
          "Warning: A transaction with the same amount and date already exists for this loan.",
        queries,
      });
    }
    queries[2].status = "success";

    // 4. Check for duplicate receipt number for the same loan
    const duplicateReceiptNoQuery = `
        SELECT * FROM tbl_Loantrans
        WHERE int_loanno = @loanno AND chr_rec_no = @receiptNo
    `;
    queries.push({
      title: "Checking for duplicate receipt number",
      query: duplicateReceiptNoQuery,
    });
    const duplicateReceiptNoResult = await request.query(
      duplicateReceiptNoQuery
    );
    queries[3].result = duplicateReceiptNoResult.recordset;

    if (duplicateReceiptNoResult.recordset.length > 0) {
      queries[3].status = "error";
      return res.json({
        status: "duplicate_receipt_no",
        message: "This receipt number has already been used for this loan.",
        queries,
      });
    }
    queries[3].status = "success";

    // 5. Check for other receipts on the same date
    const dateMatchQuery = `
        SELECT * FROM tbl_Loantrans
        WHERE int_loanno = @loanno AND CAST(dt_transaction AS DATE) = @date
    `;
    queries.push({
      title: "Checking for other receipts on the same date",
      query: dateMatchQuery,
    });
    const dateMatchResult = await request.query(dateMatchQuery);
    queries[4].result = dateMatchResult.recordset;

    if (dateMatchResult.recordset.length > 0) {
      queries[4].status = "warning";
      return res.json({
        status: "date_warning",
        message:
          "No exact match found, but other transactions exist on this date.",
        queries,
      });
    }
    queries[4].status = "success";

    return res.json({
      status: "not_found",
      message: "This receipt does not exist in the database.",
      queries,
    });
  } catch (err: any) {
    console.error(err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message;
    res
      .status(500)
      .json({ error: "Internal Server Error", message: errorMessage });
  }
});

app.post("/api/check-receipt-step", async (req: Request, res: Response) => {
  const { loanno, receiptAmount, date, receiptNo, step } = req.body;

  if (!loanno || !receiptAmount || !date || !receiptNo || !step) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let query = "";
  let status: "success" | "warning" | "error" = "success";
  let message = "";
  let overallStatus: string | undefined = undefined;

  switch (step) {
    case "Exact Match Check":
      query = `SELECT * FROM tbl_Loantrans WHERE int_loanno = @loanno AND chr_rec_no = @receiptNo AND int_amt = @receiptAmount AND CAST(dt_transaction AS DATE) = @date`;
      break;
    case "Amount Mismatch Check":
      query = `SELECT * FROM tbl_Loantrans WHERE int_loanno = @loanno AND chr_rec_no = @receiptNo AND CAST(dt_transaction AS DATE) = @date AND int_amt != @receiptAmount`;
      status = "warning";
      overallStatus = "amount_mismatch_warning";
      message =
        "A record with the same loan, receipt number, and date was found, but the amount is different.";
      break;
    case "Date Mismatch Check":
      query = `SELECT * FROM tbl_Loantrans WHERE int_loanno = @loanno AND chr_rec_no = @receiptNo AND CAST(dt_transaction AS DATE) != @date`;
      status = "warning";
      overallStatus = "date_warning";
      message =
        "A record with the same loan and receipt number was found, but the date is different.";
      break;
    case "Duplicate Receipt No. Check":
      query = `SELECT * FROM tbl_Loantrans WHERE int_loanno = @loanno AND chr_rec_no = @receiptNo AND NOT (int_amt = @receiptAmount AND CAST(dt_transaction AS DATE) = @date)`;
      status = "warning";
      overallStatus = "double_entry_warning";
      message =
        "This receipt number has been used for this loan with different details, indicating a potential double entry.";
      break;
    case "Duplicate Receipt in Office Check":
      query = `SELECT * FROM tbl_Loantrans WHERE vchr_offidC = SUBSTRING(CAST(@loanno AS VARCHAR), 1, 4) AND chr_rec_no = @receiptNo AND int_loanno != @loanno`;
      status = "warning";
      overallStatus = "duplicate_receipt_in_office";
      message =
        "This receipt number is used for another loan in the same office.";
      break;
    case "Loan Existence Check":
      query = `SELECT * FROM tbl_loanapp WHERE int_loanno = @loanno`;
      break;
    default:
      return res.status(400).json({ error: "Invalid step provided" });
  }

  try {
    const pool = getPool();
    const request = pool
      .request()
      .input("loanno", sql.VarChar, loanno)
      .input("receiptAmount", sql.Decimal(18, 2), receiptAmount)
      .input("date", sql.Date, date)
      .input("receiptNo", sql.VarChar, receiptNo);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      // If a record is found, the original status ('warning' or 'error') is correct.
      // For 'Exact Match Check', it remains 'success'.
    } else {
      // If no record is found, it's a success for this step, as no issue was detected.
      status = "success";
      message = ""; // Clear the message as no warning/error was triggered.
      overallStatus = undefined;
    }

    res.json({ status, result: result.recordset, message, overallStatus });
  } catch (err: any) {
    console.error(err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message;
    res
      .status(500)
      .json({ status: "error", result: [], message: errorMessage });
  }
});

app.get("/api/bank-details/:loanAppId", async (req: Request, res: Response) => {
  const { loanAppId } = req.params;

  if (!loanAppId) {
    return res.status(400).json({ error: "Loan Application ID is required" });
  }

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input("loanAppId", sql.Numeric, loanAppId).query(`
        SELECT *
        FROM tbl_BankDetails
        WHERE int_loanappid = @loanAppId
      `);

    if (result.recordset.length > 0) {
      return res.json({ exists: true, details: result.recordset });
    } else {
      return res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : (err as Error).message;
    res
      .status(500)
      .json({ error: "Internal Server Error", message: errorMessage });
  }
});

const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
};

startServer();
