import { NextRequest } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createResumeMcpServer } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const expectedApiKey = process.env.RESUME_MCP_API_KEY;
  if (!expectedApiKey) {
    // If no API key is configured in env, allow access (e.g. local development)
    return true;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token === expectedApiKey) return true;
  }

  const apiKeyHeader = req.headers.get("x-api-key");
  if (apiKeyHeader && apiKeyHeader.trim() === expectedApiKey) {
    return true;
  }

  return false;
}

function normalizeRequest(req: NextRequest): Request {
  const headers = new Headers(req.headers);
  const accept = headers.get("accept") || "";

  // MCP spec requires client to accept application/json and text/event-stream
  if (!accept.includes("text/event-stream") || !accept.includes("application/json")) {
    headers.set("accept", "application/json, text/event-stream");
  }

  return new Request(req.url, {
    method: req.method,
    headers,
    body: req.body,
    // @ts-expect-error duplex required for streaming in Node/Fetch
    duplex: req.body ? "half" : undefined,
  });
}

async function handleMcpRequest(req: NextRequest): Promise<Response> {
  if (!checkAuth(req)) {
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Unauthorized: Invalid or missing MCP API key" },
        id: null,
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const server = createResumeMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    const normalizedReq = normalizeRequest(req);
    return await transport.handleRequest(normalizedReq);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[MCP API Route Error]:", err);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: `Internal server error: ${message}` },
        id: null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function GET(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleMcpRequest(req);
}
