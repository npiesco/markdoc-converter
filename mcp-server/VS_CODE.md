# VS Code MCP Guide for Mark My Words Down

## MCP Server Setup (Recommended)

Use the Mark My Words Down MCP server in VS Code via stdio transport.
This server exposes one tool that converts Markdown to a Word `.doc` file.

### Step 1: Install and Build

From `mcp-server/`:

```bash
npm install
npm run build
```

### Step 2: Create MCP Configuration

Create `.vscode/mcp.json` in your workspace.

Choose the `args` path that matches what you opened in VS Code:

- If you opened the repo root `markdoc-converter`: use `${workspaceFolder}/mcp-server/dist/index.js`
- If you opened the `mcp-server` folder directly: use `${workspaceFolder}/dist/index.js`

#### Windows / WSL / Linux / macOS

```json
{
  "servers": {
    "mark-my-words-down": {
      "type": "stdio",
      "command": "node",
      "args": [
        "${workspaceFolder}/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Step 3: Trust and Start

1. Open Chat (`Ctrl+Alt+I`)
2. Trust the MCP server when prompted
3. Select the server tools from the tool picker

### Available MCP Tool

- `convert_markdown_to_word`

### Typical Prompt in Chat

- “Convert this markdown to a Word doc named `notes` in my Downloads folder.”

#### Tool Input

- `markdown` (string, required)
- `filename` (string, optional)
- `outputDir` (string, optional)

#### Tool Output

- Saved `.doc` file path
- Base64-encoded Word document payload

## DO NOT

- Manually start the stdio server in a terminal when using VS Code MCP (VS Code manages stdin/stdout)
