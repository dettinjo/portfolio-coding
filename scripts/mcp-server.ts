import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createResumeMcpServer } from "../src/lib/mcp/server";

async function main() {
  const server = createResumeMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Resume MCP server running via stdio");
}

main().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
