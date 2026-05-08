// Sanity check: verify DEEPSEEK_API_KEY works against deepseek-v4-flash
// before relying on it from the matcher.
//
// Usage:
//   node --env-file=.env.local scripts/smoke-deepseek.mjs
//
// Sends one cheap request that asks for a JSON object and validates the
// response shape. Costs roughly $0.0001. Exits non-zero if the API key is
// invalid, the model id is wrong, or the response is malformed.

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  console.error("✗ Missing DEEPSEEK_API_KEY in .env.local");
  process.exit(1);
}

const url = "https://api.deepseek.com/v1/chat/completions";
const model = "deepseek-v4-flash";

const body = {
  model,
  messages: [
    {
      role: "system",
      content:
        'Return JSON: {"ok": true, "model": "<the model name you are running as>"}. No prose.',
    },
    { role: "user", content: "go" },
  ],
  response_format: { type: "json_object" },
  temperature: 0,
  max_tokens: 60,
};

console.log(`→ POST ${url} (model=${model})`);

const t0 = Date.now();
const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
const ms = Date.now() - t0;

if (!res.ok) {
  const text = await res.text().catch(() => "");
  console.error(`✗ ${res.status} ${res.statusText} (${ms}ms)`);
  console.error(`  ${text.slice(0, 400)}`);
  process.exit(1);
}

const json = await res.json();
const content = json.choices?.[0]?.message?.content;
if (!content) {
  console.error(`✗ No content in response (${ms}ms)`);
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(content);
} catch {
  console.error(`✗ Non-JSON content (${ms}ms): ${content.slice(0, 200)}`);
  process.exit(1);
}

console.log(`✓ ${res.status} OK in ${ms}ms`);
console.log(`  model echo: ${parsed.model ?? "(not echoed)"}`);
console.log(`  usage: in=${json.usage?.prompt_tokens} out=${json.usage?.completion_tokens}`);
console.log(`  parsed content: ${JSON.stringify(parsed)}`);
console.log("✓ DeepSeek API key works.");
