import { createResumeMcpServer } from "../src/lib/mcp/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import canonicalResume from "../src/data/resume.json";
import { validateResumeLayout } from "../src/lib/resume/validator";
import { saveVariant, listVariants, getVariant } from "../src/lib/resume/variants";

async function runTests() {
  console.log("=== 1. Testing Resume Layout Validator Safeguards ===");
  // Test baseline valid data
  const validRes = validateResumeLayout(canonicalResume);
  console.log("Canonical resume valid:", validRes.valid);
  if (!validRes.valid) {
    throw new Error("Canonical resume failed validation: " + validRes.errors.join(", "));
  }
  console.log("Safe budget metrics:", validRes.budget);

  // Test intentionally overflowing data (overflow safeguards)
  const overflowingResume = JSON.parse(JSON.stringify(canonicalResume));
  // Add 10 skills
  overflowingResume.sections.skills.items = [
    { id: "s1", name: "Skill 1", level: 5, visible: true },
    { id: "s2", name: "Skill 2", level: 5, visible: true },
    { id: "s3", name: "Skill 3", level: 5, visible: true },
    { id: "s4", name: "Skill 4", level: 5, visible: true },
    { id: "s5", name: "Skill 5", level: 5, visible: true },
    { id: "s6", name: "Skill 6", level: 5, visible: true },
    { id: "s7", name: "Skill 7", level: 5, visible: true },
    { id: "s8", name: "Skill 8", level: 5, visible: true },
  ];
  // Add 6 experiences with excessively long summary
  overflowingResume.sections.experience.items = [
    {
      id: "e1",
      company: "Company 1",
      position: "Engineer",
      date: "2023",
      visible: true,
      summary: "A".repeat(300), // > 200 chars
    },
    { id: "e2", company: "Company 2", position: "Engineer", date: "2022", visible: true },
    { id: "e3", company: "Company 3", position: "Engineer", date: "2021", visible: true },
    { id: "e4", company: "Company 4", position: "Engineer", date: "2020", visible: true },
    { id: "e5", company: "Company 5", position: "Engineer", date: "2019", visible: true },
  ];

  const overflowRes = validateResumeLayout(overflowingResume);
  console.log("Overflowing resume properly rejected:", !overflowRes.valid);
  console.log("Expected Safeguard Errors caught:", overflowRes.errors);
  if (overflowRes.valid) {
    throw new Error("Safeguards failed to catch overflowing resume!");
  }

  console.log("\n=== 2. Testing Variants Persistence ===");
  const testTailored = JSON.parse(JSON.stringify(canonicalResume));
  testTailored.basics.headline = "Senior Cloud & Platform Engineer";
  testTailored.sections.skills.items = [
    { id: "s1", name: "Kubernetes & Docker", level: 5, visible: true },
    { id: "s2", name: "Go & Microservices", level: 5, visible: true },
    { id: "s3", name: "TypeScript & Next.js", level: 5, visible: true },
    { id: "s4", name: "AWS & Terraform", level: 4, visible: true },
  ];

  const { variant } = saveVariant({
    company: "Acme Cloud",
    role: "Platform Engineer",
    data: testTailored,
    notes: "Tailored for Acme Cloud platform vacancy",
  });
  console.log("Saved test variant ID:", variant.id);

  const retrieved = getVariant(variant.id);
  console.log("Retrieved variant matches:", retrieved?.id === variant.id);
  if (retrieved?.id !== variant.id) {
    throw new Error("Variant retrieval failed");
  }

  const allVariants = listVariants();
  console.log(`Found ${allVariants.length} saved variant(s) in store.`);

  console.log("\n=== 3. Testing MCP JSON-RPC Protocol over WebStandard Transport ===");
  // Helper creating a transport per request in stateless mode
  async function callMcp(body: Record<string, any>) {
    const s = createResumeMcpServer();
    const t = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await s.connect(t);
    const req = new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(body),
    });
    const res = await t.handleRequest(req);
    return res.json();
  }

  // JSON-RPC tools/list
  const listJson = await callMcp({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {},
  });
  const toolNames = listJson.result.tools.map((t: any) => t.name);
  console.log("Exposed MCP tools:", toolNames);

  // JSON-RPC tools/call: get_layout_guidelines
  const callJson = await callMcp({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "get_layout_guidelines",
      arguments: {},
    },
  });
  console.log("Layout guidelines tool output:", callJson.result.content[0].text);

  // JSON-RPC tools/call: validate_resume_layout
  const valJson = await callMcp({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "validate_resume_layout",
      arguments: {
        resumeData: testTailored,
      },
    },
  });
  console.log("Validation tool output:", valJson.result.content[0].text);

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
