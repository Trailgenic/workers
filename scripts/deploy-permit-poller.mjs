import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceConfigPath = path.join(root, "workers/permit-poller/wrangler.jsonc");
const deployConfigPath = path.join(root, "workers/permit-poller/wrangler.deploy.json");
const databaseName = "trailgenic-permit-poller";
const queueNames = [
  "trailgenic-permit-polls-dlq",
  "trailgenic-permit-notifications-dlq",
  "trailgenic-permit-polls",
  "trailgenic-permit-notifications",
];
const secretNames = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "TWILIO_VERIFY_SERVICE_SID",
  "TURNSTILE_SECRET_KEY",
];
const productionHealthUrl = "https://alerts.trailgenic.com/health";

const missingSecrets = secretNames.filter((name) => !process.env[name]);
if (missingSecrets.length) {
  throw new Error(`Missing required deployment secrets: ${missingSecrets.join(", ")}`);
}

const wrangler = (...args) =>
  execFileSync("npx", ["wrangler", ...args], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "inherit"],
  });

const listDatabases = () => JSON.parse(wrangler("d1", "list", "--json"));

const verifyProductionHealth = async () => {
  let lastError = "not checked";
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    try {
      const response = await fetch(productionHealthUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      const body = await response.json();
      if (response.ok && body.status === "healthy" && body.sms_status === "configured") {
        console.log(`Production health check passed on attempt ${attempt}`);
        return;
      }
      lastError = `HTTP ${response.status}: ${JSON.stringify(body)}`;
    } catch (error) {
      lastError = error.message;
    }
    console.log(`Production health check attempt ${attempt} pending: ${lastError}`);
    if (attempt < 18) await delay(10_000);
  }
  throw new Error(`Production health check failed: ${lastError}`);
};

let database = listDatabases().find((candidate) => candidate.name === databaseName);

if (!database) {
  console.log(`Creating D1 database ${databaseName}`);
  wrangler("d1", "create", databaseName);
  database = listDatabases().find((candidate) => candidate.name === databaseName);
}

const databaseId = database?.uuid || database?.id;
if (!databaseId) throw new Error(`Unable to resolve D1 database ID for ${databaseName}`);

for (const queueName of queueNames) {
  const result = spawnSync("npx", ["wrangler", "queues", "create", queueName], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status === 0) {
    console.log(`Created queue ${queueName}`);
  } else if (/already exists|already been taken|code\s*10010/i.test(output)) {
    console.log(`Queue ${queueName} already exists`);
  } else {
    process.stderr.write(output);
    throw new Error(`Unable to create queue ${queueName}`);
  }
}

const config = JSON.parse(readFileSync(sourceConfigPath, "utf8"));
config.d1_databases[0].database_id = databaseId;
writeFileSync(deployConfigPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });

try {
  console.log("Applying D1 migrations");
  wrangler("d1", "migrations", "apply", databaseName, "--remote", "--config", deployConfigPath);

  console.log("Deploying permit poller");
  wrangler("deploy", "--config", deployConfigPath);

  const secretPayload = Object.fromEntries(secretNames.map((name) => [name, process.env[name]]));
  const secretResult = spawnSync("npx", ["wrangler", "secret", "bulk", "--config", deployConfigPath], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
    input: JSON.stringify(secretPayload),
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (secretResult.status !== 0) throw new Error("Unable to install permit poller secrets");

  console.log("Redeploying with production secrets");
  wrangler("deploy", "--config", deployConfigPath);
  await verifyProductionHealth();
} finally {
  rmSync(deployConfigPath, { force: true });
}
