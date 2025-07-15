# MSSQL MCP Server Setup Instructions

This document outlines the steps required to set up the `mssql_mcp_server` on a new Linux (Ubuntu/Debian-based) machine.

## 1. Install the MCP Server

First, install the `mssql_mcp_server` package using `pipx`.

```bash
pipx install mssql_mcp_server
```

## 2. Install the Microsoft ODBC Driver

The server requires the Microsoft ODBC Driver for SQL Server to connect to the database.

### A. Add the Microsoft Package Repository

Run the following command to register the Microsoft package repository for your version of Ubuntu.

```bash
sudo su -c "curl -sSL https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && curl -sSL https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list > /etc/apt/sources.list.d/mssql-release.list && apt-get update"
```

### B. Install the Driver

Install the `msodbcsql18` package and the `unixodbc-dev` package, which is a common dependency.

```bash
sudo apt-get install -y msodbcsql18 unixodbc-dev
```
*Note: You will be prompted to accept the End-User License Agreement during the installation.*

## 3. Configure the MCP Server Connection

Create or edit the `.roo/mcp.json` file in your project's root directory to configure the server connection. The `env` section should look like this:

```json
{
  "mcpServers": {
    "mssql": {
      "command": "uv",
      "args": [
        "--directory",
        "/home/YOUR_USER/.local/share/pipx/venvs/mssql-mcp-server",
        "run",
        "mssql_mcp_server"
      ],
      "env": {
        "MSSQL_HOST": "YOUR_SERVER_IP\\INSTANCE_NAME",
        "MSSQL_USER": "your_username",
        "MSSQL_PASSWORD": "your_password",
        "MSSQL_DATABASE": "your_database_name",
        "MSSQL_DRIVER": "ODBC Driver 18 for SQL Server"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```
**Important:**
- Replace `YOUR_USER`, `YOUR_SERVER_IP\\INSTANCE_NAME`, `your_username`, `your_password`, and `your_database_name` with your actual values.
- The double backslash `\\` in `MSSQL_HOST` is required to correctly escape the backslash in the JSON file.

## 4. (Optional) Enforce Read-Only Access

To ensure the server can only read from the database, you can modify its source code.

1.  Open the following file (replace `YOUR_USER` with your username):
    `/home/YOUR_USER/.local/share/pipx/venvs/mssql-mcp-server/lib/python3.12/site-packages/mssql_mcp_server/server.py`

2.  Find the `call_tool` function.
3.  Locate the final `else` block within the `try...except` block.
4.  Replace the existing code in that block with the following to raise an error for any non-`SELECT` query:

    ```python
    # Non-SELECT queries are not allowed
    else:
        raise ValueError("Only SELECT queries are allowed for this connection.")
    ```

After making this change, the MCP server process must be restarted for the read-only restriction to take effect.