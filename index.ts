import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./src/mcp-server.js";

const server = createServer()

const transport = new StdioServerTransport();

process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

try {
    await server.connect(transport);
    console.error('MCP Server started successfully');
} catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
}