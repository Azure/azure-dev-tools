import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);

// canvases/azure-sre-agent/src/extension.mjs
import { execFile as execFile2 } from "node:child_process";
import { createHash as createHash2 } from "node:crypto";
import { createServer } from "node:http";
import { mkdirSync, readdirSync, readFileSync as readFileSync2, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";

// packages/sre-agent-core/src/domain/execution-gates.mjs
var EXECUTION_KINDS = Object.freeze([
  "azCliExecution",
  "kubectlExecution",
  "psqlExecution"
]);
function normalizedStatus(value) {
  return String(value || "").toLowerCase();
}
function threadIdOf(thread) {
  return thread?.id || thread?.threadId || "";
}
function findExecutionInThread(thread, { executionType, executionId, status } = {}) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  const kinds = executionType ? [executionType] : EXECUTION_KINDS;
  const wantedStatus = status ? normalizedStatus(status) : "";
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    for (const kind of kinds) {
      const execution = message?.[kind];
      if (!execution) continue;
      if (executionId && execution.id !== executionId) continue;
      if (wantedStatus && normalizedStatus(execution.status) !== wantedStatus) continue;
      return { kind, execution, messageIndex: index };
    }
  }
  return null;
}
function findCurrentExecutionGate(thread, attention = {}, observedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const threadId2 = attention.threadId || threadIdOf(thread);
  if (!threadId2) return null;
  const found = findExecutionInThread(thread, {
    executionType: attention.executionType,
    executionId: attention.executionId,
    status: "PendingAuthorization"
  }) || (!attention.executionId ? findExecutionInThread(thread, {
    executionType: attention.executionType,
    status: "PendingAuthorization"
  }) : null);
  if (!found) return null;
  const executionId = found.execution.id || "";
  return {
    key: `${threadId2}:${found.kind}:${executionId}`,
    threadId: threadId2,
    kind: found.kind,
    executionId,
    status: found.execution.status || "",
    command: found.execution.command || "",
    requiredScopes: Array.isArray(found.execution.requiredScopes) ? found.execution.requiredScopes : [],
    ...found.execution.resourceId ? { resourceId: found.execution.resourceId } : {},
    observedAt
  };
}
function deriveExecutionGateSnapshot({
  needsAttention = [],
  threads = [],
  previousObservedKeys = [],
  observedAt = (/* @__PURE__ */ new Date()).toISOString(),
  omittedThreadCount = 0,
  totalThreadCount = needsAttention.length + omittedThreadCount,
  detailErrors = []
} = {}) {
  const threadById = new Map(
    threads.filter((thread) => threadIdOf(thread)).map((thread) => [threadIdOf(thread), thread])
  );
  const observedGateKeys = [];
  const seenKeys = /* @__PURE__ */ new Set();
  for (const key of previousObservedKeys) {
    if (typeof key !== "string" || !key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    observedGateKeys.push(key);
  }
  let missingDetailCount = 0;
  const rows = needsAttention.map((attention) => {
    const thread = threadById.get(attention?.threadId);
    const currentGate = thread ? findCurrentExecutionGate(thread, attention, observedAt) : null;
    if (!thread || !currentGate) missingDetailCount++;
    if (currentGate && !seenKeys.has(currentGate.key)) {
      seenKeys.add(currentGate.key);
      observedGateKeys.push(currentGate.key);
    }
    return {
      threadId: attention?.threadId || "",
      title: attention?.title || thread?.title || "",
      pendingOn: attention?.pendingOn,
      pendingSince: attention?.pendingSince,
      currentGate,
      observedGateCount: currentGate ? observedGateKeys.filter((key) => key.startsWith(`${currentGate.threadId}:`)).length : 0,
      moreGatesUnknown: Boolean(currentGate)
    };
  });
  return {
    observedAt,
    threads: rows,
    threadCount: totalThreadCount,
    currentGateCount: rows.filter((row) => row.currentGate).length,
    observedGateCount: observedGateKeys.length,
    observedGateKeys,
    partial: missingDetailCount > 0 || omittedThreadCount > 0,
    missingDetailCount,
    omittedThreadCount,
    detailErrors
  };
}

// packages/sre-agent-core/src/actions/execution-gates.mjs
function isApprovalCandidate(item) {
  return Boolean(
    item?.executionId || item?.executionType || String(item?.pendingOn || "").toLowerCase().includes("approval")
  );
}
async function listExecutionGates({
  listNeedsAttention: listNeedsAttention2,
  getThread: getThread2,
  previousObservedKeys = [],
  limit = 25,
  concurrency = 5,
  observedAt = (/* @__PURE__ */ new Date()).toISOString()
} = {}) {
  if (typeof listNeedsAttention2 !== "function" || typeof getThread2 !== "function") {
    throw new Error("listExecutionGates requires listNeedsAttention and getThread functions.");
  }
  const boundedLimit = Math.max(1, Math.min(100, Number.isInteger(limit) ? limit : 25));
  const boundedConcurrency = Math.max(1, Math.min(10, Number.isInteger(concurrency) ? concurrency : 5));
  const needsAttention = await listNeedsAttention2();
  const approvalCandidates = needsAttention.filter(isApprovalCandidate);
  const selected = approvalCandidates.slice(0, boundedLimit);
  const threads = [];
  const detailErrors = [];
  for (let index = 0; index < selected.length; index += boundedConcurrency) {
    const batch = selected.slice(index, index + boundedConcurrency);
    const results = await Promise.all(batch.map(async (item) => {
      try {
        return await getThread2(item.threadId);
      } catch (error) {
        detailErrors.push({
          threadId: item.threadId,
          error: error?.message || String(error)
        });
        return null;
      }
    }));
    threads.push(...results.filter(Boolean));
  }
  const snapshot2 = deriveExecutionGateSnapshot({
    needsAttention: selected,
    threads,
    previousObservedKeys,
    observedAt,
    omittedThreadCount: Math.max(0, approvalCandidates.length - selected.length),
    totalThreadCount: approvalCandidates.length,
    detailErrors
  });
  return {
    ...snapshot2,
    needsAttentionThreadCount: needsAttention.length,
    nonApprovalThreadCount: needsAttention.length - approvalCandidates.length
  };
}

// packages/sre-agent-core/src/contracts/execution-gates.mjs
var LIST_NEEDS_ATTENTION_CONTRACT = Object.freeze({
  name: "list_needs_attention",
  description: "List threads the selected SRE Agent has parked waiting on a human. This reports a thread count, not an execution backlog count, and does not by itself prove an Azure RBAC denial.",
  inputSchema: Object.freeze({ type: "object", properties: Object.freeze({}) })
});
var LIST_EXECUTION_GATES_CONTRACT = Object.freeze({
  name: "list_execution_gates",
  description: "List each waiting thread's current PendingAuthorization execution gate. Reports a lower-bound history observed across refreshes and never claims to know hidden later gates or diagnose an RBAC failure.",
  inputSchema: Object.freeze({
    type: "object",
    properties: Object.freeze({
      limit: Object.freeze({
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Maximum thread details to inspect. Defaults to 25."
      })
    })
  })
});

// packages/sre-agent-core/src/contracts/thread-focus.mjs
var FOCUS_CONTRACT = "Focus mode is ON. Route the user's operational questions and instructions about this system to the SRE Agent with ask_agent (threadId defaults to the focused thread). Answer questions about data this studio already holds - threads, the needs-attention queue, scheduled tasks, memory - from that data instead, without relaying. Say which of the two you did. Leave with unfocus_thread.";
var GET_THREAD_CONTRACT = {
  name: "get_thread",
  description: "Load one SRE Agent thread and its messages by threadId.",
  inputSchema: {
    type: "object",
    properties: { threadId: { type: "string" } },
    required: ["threadId"]
  }
};
var FOCUS_THREAD_CONTRACT = {
  name: "focus_thread",
  description: "Pair the conversation with one SRE Agent thread. While focused, ask_agent needs no threadId, and every tool result restates the routing contract: relay the user's operational questions to the agent, answer questions about data this studio already holds from that data, and say which you did. Read-only itself - it changes nothing in Azure - but ask_agent posts a real message. Leave with unfocus_thread.",
  inputSchema: {
    type: "object",
    properties: { threadId: { type: "string" } },
    required: ["threadId"]
  }
};
var UNFOCUS_THREAD_CONTRACT = {
  name: "unfocus_thread",
  description: "Leave focus mode. Messages stop being routed to the SRE Agent thread by default.",
  inputSchema: { type: "object", properties: {} }
};
var ASK_AGENT_CONTRACT = {
  name: "ask_agent",
  description: "Ask the SRE Agent a follow-up question inside an existing thread and wait briefly for its newest reply to complete. Mutating: posts a real message to the agent, which may make it act. While focused, threadId defaults to the focused thread.",
  inputSchema: {
    type: "object",
    properties: {
      threadId: { type: "string", description: "Optional thread to continue. Defaults to the focused thread." },
      message: { type: "string", description: "The question or instruction to send to the agent." },
      waitSeconds: { type: "number", description: "How long to wait for the newest reply message to complete before returning (default 20, max 120)." }
    },
    required: ["message"]
  }
};

// packages/sre-agent-core/src/domain/thread-projection.mjs
var MESSAGE_LIMIT = 40;
var THREAD_TEXT_BUDGET = 14e3;
var TEXT_LIMIT = 2e3;
var PREVIEW_LIMIT = 240;
function threadRecency(thread) {
  const candidates = [
    thread?.modifiedTimestamp,
    thread?.updatedTimestamp,
    thread?.updatedAt,
    thread?.lastMessage?.timeStamp,
    thread?.lastMessage?.timestamp,
    thread?.createdTimestamp,
    thread?.createdAt
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = Date.parse(candidate);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Number.NEGATIVE_INFINITY;
}
function sortThreadsByRecency(threads) {
  const list = Array.isArray(threads) ? threads : [];
  return [...list].sort((a, b) => threadRecency(b) - threadRecency(a));
}
function clip(value, limit) {
  if (typeof value !== "string") return value;
  return value.length > limit ? `${value.slice(0, limit)}\u2026 [${value.length - limit} more chars]` : value;
}
function compact(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === void 0 || value === "") continue;
    out[key] = value;
  }
  return out;
}
function attachedExecutions(message) {
  return Object.keys(message || {}).filter((key) => /Execution|ExecutionGroup|SearchResult|Result$/.test(key) && message[key]);
}
function projectMessage(message, { textLimit = TEXT_LIMIT } = {}) {
  if (!message || typeof message !== "object") return null;
  const executions = attachedExecutions(message);
  return compact({
    id: message.id,
    timeStamp: message.timeStamp,
    role: message.author?.role || message.role,
    author: message.author?.displayName,
    text: clip(message.text, textLimit),
    isComplete: message.isComplete === false ? false : void 0,
    executions: executions.length ? executions : void 0
  });
}
function projectThread(thread) {
  if (!thread || typeof thread !== "object") return null;
  return compact({
    id: thread.id,
    title: thread.title,
    type: thread.type,
    source: thread.source,
    threadOrigin: thread.threadOrigin,
    createdTimestamp: thread.createdTimestamp,
    modifiedTimestamp: thread.modifiedTimestamp,
    favorite: thread.favorite || void 0,
    incidentStatus: thread.status?.incidentStatus?.status || void 0,
    hasCriticalActions: thread.status?.actionsStatus?.hasCriticalActions || void 0,
    hasWarningActions: thread.status?.actionsStatus?.hasWarningActions || void 0,
    lastMessage: thread.lastMessage ? compact({
      role: thread.lastMessage.author?.role,
      timeStamp: thread.lastMessage.timeStamp,
      preview: clip(thread.lastMessage.text, PREVIEW_LIMIT)
    }) : void 0
  });
}
function projectThreadDetail(thread, { limit = MESSAGE_LIMIT, textBudget = THREAD_TEXT_BUDGET } = {}) {
  if (!thread || typeof thread !== "object") return null;
  const messages = Array.isArray(thread.messages) ? thread.messages : [];
  const kept = [];
  let spent = 0;
  for (let index = messages.length - 1; index >= 0 && kept.length < limit; index--) {
    const projected = projectMessage(messages[index]);
    if (!projected) continue;
    const cost = (projected.text || "").length;
    if (kept.length && spent + cost > textBudget) break;
    kept.push(projected);
    spent += cost;
  }
  kept.reverse();
  return {
    ...projectThread(thread),
    messages: kept,
    totalMessages: messages.length,
    messagesTruncated: messages.length > kept.length
  };
}

// packages/studio-runtime/src/studio-commands.mjs
import { execFile, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, readFileSync } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
function resolveStudioRoot(moduleUrl) {
  const directory = path.dirname(fileURLToPath(moduleUrl));
  const candidates = path.basename(directory) === "src" ? [directory, path.dirname(directory)] : [directory];
  for (const candidate of candidates) {
    for (const metadata of ["studio-package.json", "package.json"]) {
      try {
        accessSync(path.join(candidate, metadata));
        return candidate;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  }
  throw new Error(`Missing canvas package metadata for ${moduleUrl}`);
}
function resolveStudioBuildInfo(moduleUrl, fallbackVersion = "unknown") {
  let version = fallbackVersion;
  let revision = "unknown";
  try {
    let manifest;
    try {
      manifest = readFileSync(new URL("./studio-package.json", moduleUrl), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      manifest = readFileSync(path.join(resolveStudioRoot(moduleUrl), "package.json"), "utf8");
    }
    version = JSON.parse(manifest).version || fallbackVersion;
  } catch {
  }
  try {
    revision = createHash("sha256").update(readFileSync(new URL(moduleUrl))).digest("hex").slice(0, 10);
  } catch {
  }
  return { version, revision };
}
var ICONS = {
  vscode: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>',
  github: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  azure: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.05 2 4 20.01h5.86l1.45-3.73 5.63 5.72H24L13.05 2Zm.8 6.42 4.37 10.36-5.25-4.79 2.91-5.01-2.03-.56ZM10.1 17.73H6.78l5.45-10.85 1.43 3.38-3.56 7.47Z"/></svg>'
};
var COMMAND_BUTTONS = `<button class="btn ghost" id="open-vscode">${ICONS.vscode}<span class="label">Open in VS Code</span></button>
      <button class="btn ghost" id="save-github">${ICONS.github}<span class="label">Save to GitHub</span></button>
      <button class="btn ghost" id="deploy-azure">${ICONS.azure}<span class="label">Deploy to Azure</span></button>`;
var COMMAND_CSS = `.btn {
    border: none; cursor: pointer; border-radius: 10px; padding: 10px 16px;
    font-size: .86rem; font-weight: 600; color: #0b1120;
    background: linear-gradient(135deg, var(--accent), #ffcf6b);
    display: inline-flex; align-items: center; gap: .45rem;
  }
  .btn svg { width: 15px; height: 15px; flex: 0 0 auto; }
  .btn:hover { filter: brightness(1.05); }
  .btn.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
  .btn.ghost:hover { color: var(--ink); }
  .mode-badge {
    display: inline-block; font-size: .72rem; color: var(--muted); border: 1px solid var(--line);
    border-radius: 999px; padding: 3px 10px; background: var(--panel);
  }
  .deploy-status {
    display: none; color: var(--muted); font-size: .78rem; line-height: 1.45;
    margin: -.35rem 0 1rem; padding: .65rem .75rem; border: 1px solid var(--line);
    border-radius: 10px; background: rgba(255,255,255,.03); overflow-wrap: anywhere;
  }
  .deploy-status.show { display: block; }
  .deploy-status strong { color: var(--ink); }
  .deploy-status a { color: var(--accent2); text-decoration: none; }
  .deploy-status a:hover { text-decoration: underline; }`;
function responseJson(res, data) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
function shortError(error) {
  return redactDeploymentOutput(error?.stderr || error?.stdout || error?.message || error || "Command failed").replace(/\s+/g, " ").trim().slice(0, 300);
}
function canExecuteCommand(file, osName = os.platform()) {
  try {
    accessSync(file, osName === "win32" ? constants.F_OK : constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
var WINDOWS_COMMAND_META_CHARACTERS = /([()\][%!^"`<>&|;, *?])/g;
function escapeWindowsCommandMetaCharacters(value) {
  return value.replace(WINDOWS_COMMAND_META_CHARACTERS, "^$1");
}
function assertWindowsCommandValue(value) {
  const text = String(value);
  if (/[\r\n]/.test(text)) {
    throw new Error("Command arguments contain unsupported Windows command characters.");
  }
  return text;
}
function escapeWindowsCommand(value) {
  return escapeWindowsCommandMetaCharacters(assertWindowsCommandValue(value));
}
function quoteWindowsCommandArgument(value) {
  let text = assertWindowsCommandValue(value);
  text = text.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
  text = text.replace(/(?=(\\+?)?)\1$/, "$1$1");
  return escapeWindowsCommandMetaCharacters(`"${text}"`);
}
function windowsCommandShellLine(command, args = []) {
  const shellCommand = [escapeWindowsCommand(command), ...args.map(quoteWindowsCommandArgument)].join(" ");
  return `"${shellCommand}"`;
}
function spawnSpecForLocated(located, args, env, osName) {
  if (osName === "win32" && /\.(?:cmd|bat)$/i.test(located.path)) {
    const comSpec = env.ComSpec || env.COMSPEC || path.win32.join(env.SystemRoot || env.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
    return {
      file: comSpec,
      args: [
        "/d",
        "/s",
        "/c",
        windowsCommandShellLine(located.path, args)
      ],
      env,
      located,
      windowsVerbatimArguments: true
    };
  }
  return { file: located.path, args: [...args], env, located, windowsVerbatimArguments: false };
}
var AZURE_CLI_ENV_KEYS = [
  "HOME",
  "USER",
  "LOGNAME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "SHELL",
  "USERPROFILE",
  "HOMEDRIVE",
  "HOMEPATH",
  "SystemRoot",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "ComSpec",
  "COMSPEC",
  "PATHEXT",
  "AZURE_CONFIG_DIR",
  "XDG_CONFIG_HOME",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
  "REQUESTS_CA_BUNDLE",
  "CURL_CA_BUNDLE",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "AZURE_CLI_DISABLE_CONNECTION_VERIFICATION"
];
function sourcePath(source) {
  return source.PATH || source.Path || source.path || "";
}
function locateAzureCli(source = process.env, osName = os.platform(), exists = (candidate) => canExecuteCommand(candidate, osName)) {
  const paths = osName === "win32" ? path.win32 : path.posix;
  const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
  const home = source.HOME || source.USERPROFILE || os.homedir();
  const known = osName === "win32" ? [
    paths.join(source.ProgramFiles || "C:\\Program Files", "Microsoft SDKs", "Azure", "CLI2", "wbin"),
    paths.join(
      source["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
      "Microsoft SDKs",
      "Azure",
      "CLI2",
      "wbin"
    )
  ] : [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/opt/local/bin",
    paths.join(home, ".local", "bin"),
    paths.join(home, "bin"),
    "/usr/bin",
    "/bin",
    "/snap/bin"
  ];
  const directories = [.../* @__PURE__ */ new Set([...inherited, ...known])];
  const searched = [];
  if (source.AZURE_CLI_PATH) {
    searched.push(source.AZURE_CLI_PATH);
    if (exists(source.AZURE_CLI_PATH)) {
      return {
        found: true,
        path: source.AZURE_CLI_PATH,
        directory: paths.dirname(source.AZURE_CLI_PATH),
        searched
      };
    }
  }
  for (const directory of directories) {
    for (const name of osName === "win32" ? ["az.cmd", "az.exe", "az"] : ["az"]) {
      const candidate = paths.join(directory, name);
      searched.push(candidate);
      if (exists(candidate)) return { found: true, path: candidate, directory, searched };
    }
  }
  return { found: false, path: "", directory: "", searched };
}
var AzureCliNotFoundError = class extends Error {
  constructor(searched = []) {
    super(
      "Azure CLI executable was not found. Install Azure CLI or set AZURE_CLI_PATH to its absolute path, then retry."
    );
    this.name = "AzureCliNotFoundError";
    this.code = "AZURE_CLI_NOT_FOUND";
    this.searched = searched;
  }
};
function isAzureCliLoginRequiredError(error) {
  return /(?:please run ['"`]?az login|run ['"`]?az login|not logged in|login required|no subscriptions found)/i.test(
    shortError(error)
  );
}
function azureCliChildEnv(source = process.env, located = locateAzureCli(source), osName = os.platform()) {
  const paths = osName === "win32" ? path.win32 : path.posix;
  const env = {};
  const copied = /* @__PURE__ */ new Set();
  for (const key of AZURE_CLI_ENV_KEYS) {
    const identity = osName === "win32" ? key.toLowerCase() : key;
    if (source[key] != null && !copied.has(identity)) {
      env[key] = source[key];
      copied.add(identity);
    }
  }
  const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
  const fallbacks = osName === "win32" ? [
    paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32"),
    source.SystemRoot || source.SYSTEMROOT || "C:\\Windows"
  ] : ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  env.PATH = [.../* @__PURE__ */ new Set([...located.found ? [located.directory] : [], ...inherited, ...fallbacks])].join(
    paths.delimiter
  );
  if (osName === "win32" && !env.ComSpec && !env.COMSPEC) {
    env.ComSpec = paths.join(source.SystemRoot || source.SYSTEMROOT || "C:\\Windows", "System32", "cmd.exe");
  }
  return env;
}
function azureCliSpawnSpec(args, {
  env = process.env,
  osName = os.platform(),
  locate = locateAzureCli
} = {}) {
  assertFixtureAuthenticationDenied("az");
  const located = locate(env, osName);
  if (!located.found) throw new AzureCliNotFoundError(located.searched);
  const childEnv = azureCliChildEnv(env, located, osName);
  return spawnSpecForLocated(located, args, childEnv, osName);
}
function tokenExpiryMs(token) {
  const epochSeconds = Number(token?.expires_on || token?.expiresOnTimestamp || 0);
  if (Number.isFinite(epochSeconds) && epochSeconds > 0) return epochSeconds * 1e3;
  const parsed = Date.parse(String(token?.expiresOn || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function createAzureCliSession(runJson, { metadataTtlMs = 5 * 60 * 1e3, now = () => Date.now() } = {}) {
  const values = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  const generations = /* @__PURE__ */ new Map();
  async function cached(key, validUntil, loader, force = false) {
    const existing = values.get(key);
    if (!force && existing && existing.validUntil > now()) return existing.value;
    if (!force && pending.has(key)) return pending.get(key);
    const generation = (generations.get(key) || 0) + 1;
    generations.set(key, generation);
    const promise = Promise.resolve().then(loader).then((value) => {
      if (generations.get(key) === generation) {
        values.set(key, { value, validUntil: validUntil(value) });
      }
      return value;
    }).finally(() => {
      if (pending.get(key) === promise) pending.delete(key);
    });
    pending.set(key, promise);
    return promise;
  }
  return {
    account(force = false) {
      return cached("account", () => now() + metadataTtlMs, () => runJson(["account", "show", "-o", "json"]), force);
    },
    subscriptions(force = false) {
      return cached(
        "subscriptions",
        () => now() + metadataTtlMs,
        () => runJson(["account", "list", "--query", "[?state=='Enabled']", "-o", "json"]),
        force
      );
    },
    accessToken(subscription, resource, force = false) {
      const key = `token:${subscription || "default"}:${resource}`;
      return cached(
        key,
        (token) => Math.max(now(), tokenExpiryMs(token) - 5 * 60 * 1e3),
        () => runJson(["account", "get-access-token", "--resource", resource, "-o", "json"], subscription),
        force
      );
    },
    clear() {
      values.clear();
      generations.clear();
    }
  };
}
async function runAzureCliJson(args, subscription, {
  timeout = 3e4,
  maxBuffer = 1024 * 1024,
  env = process.env,
  execute = execFileText,
  locate = locateAzureCli,
  osName = os.platform()
} = {}) {
  const full = subscription ? [...args, "--subscription", subscription] : [...args];
  const withFlag = full.includes("--only-show-errors") ? full : [...full, "--only-show-errors"];
  const { stdout } = await runAzureCliText(withFlag, { env, maxBuffer, timeout, execute, locate, osName });
  const text = stdout.trim();
  return text ? JSON.parse(text) : null;
}
async function runAzureCliText(args, {
  env = process.env,
  execute = execFileText,
  locate = locateAzureCli,
  osName = os.platform(),
  ...options
} = {}) {
  const command = azureCliSpawnSpec(args, { env, locate, osName });
  return execute(command.file, command.args, {
    maxBuffer: 1024 * 1024,
    ...options,
    env: command.env,
    windowsVerbatimArguments: command.windowsVerbatimArguments
  });
}
var fixtureAuthCommands = [];
function assertFixtureAuthenticationDenied(command, args = []) {
  if (process.env.FUNCTION_STUDIO_TEST_MODE !== "1") return;
  const name = path.win32.basename(String(command)).replace(/\.(?:cmd|bat|exe)$/i, "").toLowerCase();
  const gitRemote = name === "git" && args.some((arg) => ["clone", "fetch", "pull", "push", "ls-remote", "credential"].includes(arg));
  const packageInstall = ["npm", "npx", "pip", "pip3", "uv"].includes(name) && args.some((arg) => ["install", "exec", "add", "run"].includes(arg)) || /^python(?:\d+(?:\.\d+)?)?$/.test(name) && args.includes("pip") && args.includes("install");
  if (!gitRemote && !packageInstall && !["az", "azd", "gh", "azureauth", "security", "codesign", "npx"].includes(name)) return;
  fixtureAuthCommands.push(name);
  throw new Error(`Live authentication command '${name}' is disabled in Hosted Skills fixture mode. Inject a fake service instead.`);
}
function execFileText(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    assertFixtureAuthenticationDenied(file, args);
    execFile(file, args, { maxBuffer: 1024 * 1024, ...options }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}
function redactDeploymentOutput(value) {
  return String(value || "").replace(/(https?:\/\/)[^/\s@]+@/gi, "$1[REDACTED]@").replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(
    /((?:^|[\s,{])["']?[A-Za-z0-9_-]*(?:token|secret|password|key|connection[_-]?string)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
    "$1[REDACTED]"
  ).replace(/([?&](?:code|key|sig|token|secret)=)[^&\s]+/gi, "$1[REDACTED]");
}

// canvases/azure-sre-agent/src/thread-ux.mjs
var MAX_EMBEDDED_MESSAGES = 50;
var MAX_COMMAND_CHARS = 2e3;
var MAX_TOOL_OUTPUT_CHARS = 4e3;
var MAX_ERROR_CHARS = 2e3;
function dataPlaneEndpoint(agent) {
  if (!agent) throw new Error("Select an SRE Agent first.");
  const endpoint = String(agent.endpoint || "").trim();
  if (!endpoint) {
    throw new Error("The selected SRE Agent does not expose a data-plane endpoint yet. Wait for provisioning to complete, then refresh agents.");
  }
  return endpoint.replace(/\/$/, "");
}
function threadId(thread) {
  return thread && (thread.id || thread.threadId) || "";
}
function displayedActiveThread(state, draftThread) {
  return draftThread && draftThread.active ? draftThread : state && state.activeThread || null;
}
function shouldCreateThread(state, draftThread, forceNewThread) {
  const displayed = displayedActiveThread(state, draftThread);
  return Boolean(forceNewThread || draftThread || !threadId(displayed) || displayed.draft);
}
function threadTimestamp(thread) {
  const value = thread && (thread.modifiedTimestamp || thread.createdTimestamp);
  const timestamp = value ? Date.parse(value) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}
function sortThreads(threads) {
  return [...threads || []].sort((left, right) => threadTimestamp(right) - threadTimestamp(left));
}
function upsertThread(threads, thread) {
  const id = threadId(thread);
  if (!id) return sortThreads(threads);
  const existing = (threads || []).find((item) => threadId(item) === id) || {};
  const definedUpdates = Object.fromEntries(Object.entries(thread).filter(([, value]) => value !== void 0));
  const merged = { ...existing, ...definedUpdates };
  return sortThreads([merged, ...(threads || []).filter((item) => threadId(item) !== id)]);
}
function boundedTranscriptMessages(thread) {
  const messages = thread && (thread.messages || thread.value) || [];
  return messages.slice(-MAX_EMBEDDED_MESSAGES);
}
function truncateTranscriptText(value, limit) {
  const text = String(value == null ? "" : value);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}

[Truncated in Azure SRE Agent. Open the full transcript in Portal.]`;
}
function transcriptRenderKey(thread) {
  if (!thread) return "none";
  if (thread.draft) return `draft:${threadId(thread)}`;
  return JSON.stringify({
    id: threadId(thread),
    messages: boundedTranscriptMessages(thread),
    awaiting: thread && thread.awaitingResponse
  });
}
var THREAD_CLIENT_HELPERS = [
  `var MAX_EMBEDDED_MESSAGES = ${MAX_EMBEDDED_MESSAGES};`,
  `var MAX_COMMAND_CHARS = ${MAX_COMMAND_CHARS};`,
  `var MAX_TOOL_OUTPUT_CHARS = ${MAX_TOOL_OUTPUT_CHARS};`,
  `var MAX_ERROR_CHARS = ${MAX_ERROR_CHARS};`,
  dataPlaneEndpoint,
  threadId,
  displayedActiveThread,
  shouldCreateThread,
  threadTimestamp,
  sortThreads,
  upsertThread,
  boundedTranscriptMessages,
  truncateTranscriptText,
  transcriptRenderKey
].map((value) => typeof value === "function" ? value.toString() : value).join("\n");

// canvases/azure-sre-agent/src/extension.mjs
var execFileAsync = promisify(execFile2);
var { version: STUDIO_VERSION, revision: STUDIO_REVISION } = resolveStudioBuildInfo(import.meta.url);
var WRITES_ENABLED = process.env.ALLOW_WRITES === "true";
var PRIVATE_CONNECTORS_ENABLED = WRITES_ENABLED && process.env.ALLOW_PRIVATE_CONNECTORS === "true";
var MUTATING_HTTP_ROUTES = /* @__PURE__ */ new Set([
  "/create-thread",
  "/send-message",
  "/investigate",
  "/grant-execution",
  "/cancel-execution",
  "/grant-durable-role",
  "/create-incident",
  "/diagnose-app",
  "/correlate-ticket",
  "/create-scheduled-task",
  "/pause-scheduled-task",
  "/resume-scheduled-task",
  "/add-memory",
  "/create-delegated-kusto-mcp",
  "/confirm-delegated-kusto-consent",
  "/attach-connector-namespace-mcp",
  "/detach-connector",
  "/generate-workflow"
]);
var PRIVATE_CONNECTOR_HTTP_ROUTES = /* @__PURE__ */ new Set([
  "/create-delegated-kusto-mcp",
  "/confirm-delegated-kusto-consent",
  "/attach-connector-namespace-mcp",
  "/detach-connector"
]);
function connectorOwnerKey(objectId) {
  const normalized = String(objectId || "").trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) return "";
  return createHash2("sha256").update(normalized).digest("hex").slice(0, 8);
}
function connectorNameOwnedBy(name, objectId) {
  const ownerKey = connectorOwnerKey(objectId);
  return Boolean(ownerKey && String(name || "").startsWith(`private-kusto-${ownerKey}-`));
}
var cmdSeq = 0;
function cmdStart(entry, rec) {
  if (!entry.commands) entry.commands = [];
  const item = { id: ++cmdSeq, ts: Date.now(), status: "run", ms: null, note: "", ...rec };
  entry.commands.unshift(item);
  if (entry.commands.length > 40) entry.commands.length = 40;
  broadcast(entry, "state", snapshot(entry));
  return item;
}
function cmdEnd(entry, item, patch) {
  if (!item) return;
  const ms = item.ts ? Date.now() - item.ts : null;
  Object.assign(item, { ms, status: "ok" }, patch || {});
  if (patch && patch.ok === false) item.status = "err";
  broadcast(entry, "state", snapshot(entry));
}
async function azLogged(entry, args, subscription, meta) {
  if (!entry) return runAz(args, subscription);
  const shown = ["az", ...args, ...subscription ? ["--subscription", subscription] : []].join(" ");
  const item = cmdStart(entry, { kind: "az", title: meta && meta.title || args.slice(0, 3).join(" "), cmd: shown, purpose: meta && meta.purpose || "" });
  try {
    const out = await runAz(args, subscription);
    cmdEnd(entry, item, { ok: true, note: meta && meta.done || "ok" });
    return out;
  } catch (err) {
    cmdEnd(entry, item, { ok: false, note: shortError(err) });
    throw err;
  }
}
function restLogged(entry, method, url, meta) {
  if (!entry) return null;
  return cmdStart(entry, { kind: "rest", title: meta && meta.title || `${method} ${url}`, cmd: `${method} ${url}`, purpose: meta && meta.purpose || "" });
}
var SRE_AGENT_TOKEN_RESOURCE = "https://azuresre.ai";
var ARM_API_VERSION = "2025-05-01-preview";
var CONNECTOR_GATEWAY_API_VERSION = "2026-05-01-preview";
var DOC_URL = "https://techcommunity.microsoft.com/blog/appsonazureblog/access-your-sre-agent-from-any-ide-terminal-or-ai-assistant/4523434";
async function runAz(args, subscription) {
  return runAzureCliJson(args, subscription, {
    maxBuffer: 8 * 1024 * 1024,
    timeout: 45e3
  });
}
var azureCliSession = createAzureCliSession(runAz);
async function listSubscriptions(force = false, entry) {
  const item = entry ? cmdStart(entry, { kind: "az", title: "list subscriptions", cmd: "az account list --all", purpose: "Discover subscriptions the signed-in account can see." }) : null;
  try {
    const rows = await azureCliSession.subscriptions(force);
    if (item) cmdEnd(entry, item, { ok: true, note: `${rows.length} subscription(s)` });
    const subs = rows.map((s) => ({ id: s.id, name: s.name, isDefault: Boolean(s.isDefault) }));
    subs.sort((a, b) => a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1);
    return subs;
  } catch (err) {
    if (item) cmdEnd(entry, item, { ok: false, note: shortError(err) });
    throw err;
  }
}
async function armGet(pathAndQuery, subscription, entry, meta) {
  return azLogged(entry, ["rest", "--method", "get", "--url", `https://management.azure.com${pathAndQuery}`, "-o", "json"], subscription, meta);
}
async function armPut(pathAndQuery, body, subscription, entry, meta) {
  return azLogged(
    entry,
    ["rest", "--method", "put", "--url", `https://management.azure.com${pathAndQuery}`, "--body", JSON.stringify(body), "-o", "json"],
    subscription,
    meta
  );
}
async function armPost(pathAndQuery, body, subscription, entry, meta) {
  return azLogged(
    entry,
    ["rest", "--method", "post", "--url", `https://management.azure.com${pathAndQuery}`, "--body", JSON.stringify(body), "-o", "json"],
    subscription,
    meta
  );
}
async function armDelete(pathAndQuery, subscription, entry, meta) {
  return azLogged(
    entry,
    ["rest", "--method", "delete", "--url", `https://management.azure.com${pathAndQuery}`],
    subscription,
    meta
  );
}
function withApiVersion(url) {
  return url.includes("?") ? `${url}&api-version=${ARM_API_VERSION}` : `${url}?api-version=${ARM_API_VERSION}`;
}
async function graphQuery(query, subscription, entry, meta) {
  const args = ["graph", "query", "-q", query, "-o", "json"];
  if (subscription) args.push("--subscriptions", subscription);
  const result = await azLogged(entry, args, void 0, meta);
  return result?.data || [];
}
async function listAgents(subscription, entry) {
  const query = "Resources | where type =~ 'microsoft.app/agents' | project name, id, location, resourceGroup, properties";
  const rows = await graphQuery(query, subscription, entry, { title: "graph query (agents)", purpose: "List Azure SRE Agent resources in this subscription." });
  return rows.map((r) => ({
    name: r.name,
    id: r.id,
    location: r.location,
    resourceGroup: r.resourceGroup,
    provisioningState: r.properties?.provisioningState || "",
    endpoint: r.properties?.endpoint || r.properties?.agentEndpoint || ""
  }));
}
var APP_RESOURCE_TYPES = [
  "microsoft.web/sites",
  "microsoft.app/containerapps",
  "microsoft.containerservice/managedclusters",
  "microsoft.devtestlab/labs",
  "microsoft.labservices/labs"
];
function appResourceKind(row) {
  const type = String(row.type || "").toLowerCase();
  const kind = String(row.kind || "").split(",")[0];
  if (type === "microsoft.web/sites") return kind || "webapp";
  if (type === "microsoft.app/containerapps") return "containerapp";
  if (type === "microsoft.containerservice/managedclusters") return "aks";
  if (type === "microsoft.devtestlab/labs" || type === "microsoft.labservices/labs") return "sandbox";
  return kind || type.split("/").pop() || "resource";
}
async function listAppResources(subscription, entry) {
  const types = APP_RESOURCE_TYPES.map((t) => `'${t}'`).join(",");
  const query = `Resources
| where type in~ (${types}) or type contains 'sandbox'
| project name, id, type, location, resourceGroup, kind
| order by name asc`;
  const rows = await graphQuery(query, subscription, entry, { title: "graph query (apps)", purpose: "List App Service, Function App, Container App, AKS, and sandbox resources for the diagnose picker." });
  return rows.map((r) => ({
    name: r.name,
    id: r.id,
    type: r.type,
    kind: appResourceKind(r),
    location: r.location,
    resourceGroup: r.resourceGroup
  }));
}
async function getAgent(resourceGroup, name, subscription, entry) {
  const data = await armGet(
    withApiVersion(`/subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.App/agents/${name}`),
    subscription,
    entry,
    { title: `get agent ${name}`, purpose: "Fetch the SRE Agent resource (endpoint, provisioning state)." }
  );
  const actionIdentityId = data?.properties?.actionConfiguration?.identity || "";
  const uaMap = data?.identity?.userAssignedIdentities || {};
  const uaEntry = actionIdentityId ? Object.entries(uaMap).find(([key]) => key.toLowerCase() === actionIdentityId.toLowerCase())?.[1] : null;
  const executionPrincipalId = uaEntry?.principalId || data?.identity?.principalId || "";
  return {
    name: data?.name || name,
    id: data?.id || "",
    location: data?.location || "",
    resourceGroup,
    provisioningState: data?.properties?.provisioningState || "",
    endpoint: data?.properties?.endpoint || data?.properties?.agentEndpoint || "",
    executionPrincipalId,
    executionIdentityId: actionIdentityId || "",
    systemPrincipalId: data?.identity?.principalId || "",
    tenantId: data?.identity?.tenantId || "",
    raw: data
  };
}
async function listConnectors(agent, subscription, entry) {
  const data = await armGet(
    withApiVersion(`/subscriptions/${subscription}/resourceGroups/${agent.resourceGroup}/providers/Microsoft.App/agents/${agent.name}/connectors`),
    subscription,
    entry,
    { title: "list connectors", purpose: "List connectors (Kusto, MCP, Azure Monitor) attached to this agent." }
  );
  const attached = (data?.value || []).map((c) => ({
    name: c.name,
    kind: c.properties?.dataConnectorType || c.properties?.kind || c.kind || "",
    id: c.id,
    dataSource: c.properties?.dataSource || "",
    identityMode: c.properties?.identity || "",
    extendedProperties: c.properties?.extendedProperties || {},
    isPrivateSession: /^private-session-/i.test(c.name || "")
  }));
  return attached;
}
async function deleteConnector(agent, name, subscription, entry) {
  if (!name) throw new Error("Connector name is required.");
  return armDelete(
    withApiVersion(`/subscriptions/${subscription}/resourceGroups/${agent.resourceGroup}/providers/Microsoft.App/agents/${agent.name}/connectors/${encodeURIComponent(name)}`),
    subscription,
    entry,
    { title: `detach connector ${name}`, purpose: "Detach this connector from the selected SRE Agent." }
  );
}
async function listKustoResources(subscription, entry) {
  const clusters = await graphQuery(
    "Resources | where type =~ 'microsoft.kusto/clusters' | project name, id, location, resourceGroup, properties | order by name asc",
    subscription,
    entry,
    { title: "graph query (Kusto clusters)", purpose: "Discover Azure Data Explorer clusters visible to the signed-in user." }
  );
  const databases = await graphQuery(
    "Resources | where type =~ 'microsoft.kusto/clusters/databases' | project name, id, resourceGroup, properties | order by name asc",
    subscription,
    entry,
    { title: "graph query (Kusto databases)", purpose: "Discover Azure Data Explorer databases visible to the signed-in user." }
  );
  const databaseByClusterId = /* @__PURE__ */ new Map();
  for (const db of databases) {
    const clusterId = String(db.id || "").replace(/\/databases\/[^/]+$/i, "").toLowerCase();
    if (!databaseByClusterId.has(clusterId)) databaseByClusterId.set(clusterId, []);
    databaseByClusterId.get(clusterId).push({
      name: String(db.name || "").split("/").pop(),
      id: db.id,
      resourceGroup: db.resourceGroup
    });
  }
  return clusters.map((cluster) => ({
    name: cluster.name,
    id: cluster.id,
    subscriptionId: String(cluster.id || "").match(/\/subscriptions\/([^/]+)/i)?.[1] || "",
    location: cluster.location,
    resourceGroup: cluster.resourceGroup,
    clusterUrl: cluster.properties?.uri || cluster.properties?.clusterUri || "",
    databases: databaseByClusterId.get(String(cluster.id || "").toLowerCase()) || []
  }));
}
function operationList(data) {
  if (data?.paths && typeof data.paths === "object") {
    const definitions = data.definitions || {};
    const operations = [];
    for (const pathItem of Object.values(data.paths)) {
      for (const method of ["get", "post", "put", "patch", "delete"]) {
        const operation = pathItem?.[method];
        if (!operation?.operationId) continue;
        const parameters = [];
        for (const parameter of operation.parameters || []) {
          if (parameter?.["x-ms-visibility"] === "internal") continue;
          const ref = parameter?.schema?.$ref || "";
          const definitionName = ref.split("/").pop();
          const definition = definitionName ? definitions[definitionName] : null;
          if (parameter.in === "body" && definition?.properties) {
            for (const [name, schema] of Object.entries(definition.properties)) {
              parameters.push({ name, ...schema });
            }
          } else if (parameter.name) {
            parameters.push(parameter);
          }
        }
        operations.push({
          name: operation.operationId,
          displayName: operation.summary || operation.operationId,
          description: operation.description || "",
          parameters
        });
      }
    }
    return operations;
  }
  return data?.value || data?.items || data?.operations || data || [];
}
function operationName(operation) {
  return operation?.name || operation?.id || operation?.properties?.name || "";
}
function operationDisplayName(operation) {
  return operation?.displayName || operation?.properties?.displayName || operationName(operation);
}
function kustoOperationConfig(operation, clusterUrl, database) {
  const parameters = operation?.parameters || operation?.properties?.parameters || [];
  const userParameters = [];
  const agentParameters = [];
  for (const parameter of parameters) {
    const name = parameter?.name || parameter?.id || "";
    if (!name) continue;
    if (/(cluster|endpoint|server|data\s*source)/i.test(name)) {
      userParameters.push({ name, value: clusterUrl });
    } else if (/database/i.test(name) || /^db$/i.test(name)) {
      userParameters.push({ name, value: database });
    } else {
      agentParameters.push({ name });
    }
  }
  return {
    name: operationName(operation),
    displayName: operationDisplayName(operation),
    description: operation?.description || operation?.properties?.description || "",
    userParameters,
    agentParameters: agentParameters.map((parameter) => ({
      name: parameter.name,
      ...parameter.schema ? { schema: parameter.schema } : {}
    }))
  };
}
function connectorGatewayApi(path2) {
  return path2.includes("?") ? `${path2}&api-version=${CONNECTOR_GATEWAY_API_VERSION}` : `${path2}?api-version=${CONNECTOR_GATEWAY_API_VERSION}`;
}
async function listConnectorGateways(subscription, entry) {
  const gateways = await graphQuery(
    "Resources | where type =~ 'microsoft.web/connectorgateways' | project name, id, location, resourceGroup, properties | order by name asc",
    subscription,
    entry,
    { title: "graph query (Connector Namespaces)", purpose: "Find the general Connector Namespace used to create the delegated Kusto MCP." }
  );
  return gateways.map((gateway) => ({
    name: gateway.name,
    id: gateway.id,
    location: gateway.location,
    resourceGroup: gateway.resourceGroup,
    properties: gateway.properties || {}
  }));
}
async function listConnectorNamespaceMcps(gateways, subscription, attachedConnectors, entry) {
  const attachedNames = new Set((attachedConnectors || []).map((connector) => connector.name));
  const identity = await currentIdentity(entry);
  const groups = await Promise.all((gateways || []).map(async (gateway) => {
    const base = gatewayResourcePath(gateway);
    const data = await armGet(
      connectorGatewayApi(`${base}/mcpserverConfigs`),
      subscription,
      entry,
      { title: `list MCPs in ${gateway.name}`, purpose: "Discover existing Connector Namespace MCP configurations that can be attached to this SRE Agent." }
    );
    const gatewayId = gateway?.properties?.connectorGatewayId || gateway?.properties?.gatewayId || "";
    return (data?.value || []).filter((mcp) => connectorNameOwnedBy(mcp?.name, identity.objectId)).map((mcp) => {
      const name = mcp.name || "";
      const connectionName = mcp?.properties?.connectors?.[0]?.connectionName || "";
      const endpoint = mcp?.properties?.endpoint || mcp?.properties?.mcpEndpointUrl || (gatewayId && gateway.location && name ? `https://app-16.${gateway.location}.logic.azure.com/api/connectorGateways/${gatewayId}/mcpServerConfigs/${name}/mcp` : "");
      const attached = attachedNames.has(name);
      return {
        name,
        endpoint,
        mcpPath: `${base}/mcpserverConfigs/${encodeURIComponent(name)}`,
        connectionPath: connectionName ? `${base}/connections/${encodeURIComponent(connectionName)}` : "",
        gatewayName: gateway.name,
        state: mcp?.properties?.state || "",
        provisioningState: mcp?.properties?.provisioningState || "",
        attached,
        attachmentStatus: attached ? "Attached to this SRE Agent." : "Available to attach to this SRE Agent."
      };
    });
  }));
  return groups.flat();
}
function normalizedAzureLocation(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
async function createConnectorGateway(agent, subscription, entry) {
  const provider = await azLogged(
    entry,
    ["provider", "show", "--namespace", "Microsoft.Web", "-o", "json"],
    subscription,
    { title: "read Connector Namespace regions", purpose: "Choose a supported region before creating a Connector Namespace." }
  );
  const resourceType = (provider?.resourceTypes || []).find((item) => String(item?.resourceType || "").toLowerCase() === "connectorgateways");
  const locations = resourceType?.locations || [];
  const agentLocation = normalizedAzureLocation(agent.location);
  const matchingLocation = locations.find((location2) => normalizedAzureLocation(location2) === agentLocation);
  const fallbackLocation = locations.find((location2) => normalizedAzureLocation(location2) === "westcentralus") || locations[0];
  const location = normalizedAzureLocation(matchingLocation || fallbackLocation || agent.location);
  if (!location) throw new Error("Microsoft.Web did not advertise a supported Connector Namespace region.");
  const name = await connectorGatewayName(agent, subscription);
  const path2 = `/subscriptions/${subscription}/resourceGroups/${agent.resourceGroup}/providers/Microsoft.Web/connectorGateways/${name}`;
  const created = await armPut(
    connectorGatewayApi(path2),
    {
      location,
      identity: { type: "SystemAssigned" },
      properties: {}
    },
    subscription,
    entry,
    {
      title: `create Connector Namespace ${name}`,
      purpose: "Create the shared Connector Namespace required to host delegated connections and MCP configurations."
    }
  );
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const gateway = attempt === 0 ? created : await armGet(
      connectorGatewayApi(path2),
      subscription,
      entry,
      { title: `check Connector Namespace ${name}`, purpose: "Wait until the new namespace is ready." }
    );
    const state = String(gateway?.properties?.provisioningState || "").toLowerCase();
    if (state === "succeeded") {
      entry.connectorGateways = await listConnectorGateways(subscription, entry);
      entry.status = `Created Connector Namespace ${name}; continuing delegated Kusto MCP setup.`;
      return {
        name: gateway.name || name,
        id: gateway.id || path2,
        location: gateway.location || location,
        resourceGroup: agent.resourceGroup,
        properties: gateway.properties || {}
      };
    }
    if (state === "failed" || state === "canceled") {
      throw new Error(`Connector Namespace ${name} provisioning ended in ${gateway?.properties?.provisioningState}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
  }
  throw new Error(`Connector Namespace ${name} did not finish provisioning within the expected time.`);
}
async function connectorGatewayName(agent, subscription) {
  const suffix = (await stableGuid(`${subscription}|${agent.id}|connector-namespace`)).slice(0, 8);
  const prefix = String(agent.name || "sre-agent").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
  return `cg-${prefix || "sre-agent"}-${suffix}`;
}
async function findConnectorGateway(subscription, selectedName, agent, connectionName, database, entry) {
  const gateways = await listConnectorGateways(subscription, entry);
  if (selectedName) {
    const selected = gateways.find((gateway) => gateway.name === selectedName);
    if (!selected) throw new Error(`Connector Namespace "${selectedName}" is no longer available in the selected subscription.`);
    return { gateway: selected, connectionName };
  }
  const dedicatedName = await connectorGatewayName(agent, subscription);
  const dedicated = gateways.find((gateway) => gateway.name === dedicatedName);
  for (const gateway of gateways) {
    const data = await armGet(
      connectorGatewayApi(`${gatewayResourcePath(gateway)}/connections`),
      subscription,
      entry,
      { title: `check ${gateway.name} for existing Kusto connections`, purpose: "Resume an earlier authenticated Kusto setup without asking the user to choose infrastructure." }
    );
    const connections = data?.value || [];
    const connected = connections.find((connection) => connection?.properties?.connectorName === "kusto" && delegatedConnectionStatus(connection) === "connected" && (connection.name === connectionName || String(connection?.properties?.displayName || "").toLowerCase() === `azure data explorer - ${database}`.toLowerCase()));
    if (connected) return { gateway, connectionName: connected.name };
  }
  for (const gateway of gateways) {
    const existingConnection = await armGet(
      connectorGatewayApi(`${gatewayResourcePath(gateway)}/connections/${encodeURIComponent(connectionName)}`),
      subscription,
      entry,
      { title: `check ${gateway.name} for pending Kusto connection`, purpose: "Resume an earlier delegated Kusto sign-in." }
    );
    if (existingConnection) return { gateway, connectionName };
  }
  if (dedicated) return { gateway: dedicated, connectionName };
  return { gateway: await createConnectorGateway(agent, subscription, entry), connectionName };
}
function gatewayResourcePath(gateway) {
  return gateway.id || `/subscriptions/${gateway.subscriptionId}/resourceGroups/${gateway.resourceGroup}/providers/Microsoft.Web/connectorGateways/${gateway.name}`;
}
function delegatedConnectionStatus(connection) {
  return String(connection?.properties?.overallStatus || connection?.properties?.status || "").toLowerCase();
}
async function refreshDelegatedConnection(connectionPath, initial, subscription, entry) {
  if (delegatedConnectionStatus(initial) === "connected") return initial;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const connection = await armGet(
      connectorGatewayApi(connectionPath),
      subscription,
      entry,
      { title: "check delegated Kusto connection", purpose: "Resume an already-authenticated connection before starting another sign-in." }
    );
    if (delegatedConnectionStatus(connection) === "connected") return connection;
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 750));
  }
  return initial;
}
async function grantConnectionUserAccess(resourcePath, identity, subscription, entry) {
  if (!identity?.objectId || !identity?.tenantId) throw new Error("The signed-in user must have an immutable Entra identity before delegated connection access can be granted.");
  return armPut(
    connectorGatewayApi(`${resourcePath}/accessPolicies/${encodeURIComponent(identity.objectId)}`),
    {
      properties: {
        principal: {
          type: "ActiveDirectory",
          identity: { objectId: identity.objectId, tenantId: identity.tenantId }
        }
      }
    },
    subscription,
    entry,
    { title: "grant signed-in user access to Kusto connection", purpose: "Allow the user who authorized Kusto to invoke the delegated connection." }
  );
}
async function requireConnectionUserAccess(resourcePath, identity, subscription, entry) {
  if (!resourcePath || !identity?.objectId) {
    throw new Error("This Connector Namespace MCP has no verifiable delegated connection owner.");
  }
  const policy = await armGet(
    connectorGatewayApi(`${resourcePath}/accessPolicies/${encodeURIComponent(identity.objectId)}`),
    subscription,
    entry,
    { title: "verify delegated connection owner", purpose: "Fail closed unless the signed-in user already owns access to this delegated connection." }
  );
  const principalId = policy?.properties?.principal?.identity?.objectId || "";
  if (String(principalId).toLowerCase() !== String(identity.objectId).toLowerCase()) {
    throw new Error("Only the signed-in owner of the delegated Kusto connection can attach this MCP.");
  }
}
async function grantMcpPrincipalAccess(resourcePath, objectId, tenantId, subscription, entry) {
  if (!objectId || !tenantId) throw new Error("The SRE Agent managed identity and tenant must be resolved before MCP access can be granted.");
  return armPut(
    connectorGatewayApi(`${resourcePath}/accessPolicies/${encodeURIComponent(objectId)}`),
    {
      properties: {
        principal: {
          type: "ActiveDirectory",
          identity: { objectId, tenantId }
        },
        // Connector Namespace uses User for direct object-ID matching, including
        // service principals and managed identities. Group means membership expansion.
        principalType: "User"
      }
    },
    subscription,
    entry,
    { title: "grant SRE managed identity access to Kusto MCP", purpose: "Allow the managed identity selected by the generic MCP connector to invoke the MCP endpoint." }
  );
}
function protectedResourceMetadataUrl(endpoint) {
  const url = new URL(endpoint);
  if (!/\/mcp\/?$/i.test(url.pathname)) {
    throw new Error("Connector Namespace returned an MCP endpoint with an unsupported path.");
  }
  url.pathname = `${url.pathname.replace(/\/mcp\/?$/i, "")}/.well-known/oauth-protected-resource`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
async function discoverMcpTokenScope(endpoint) {
  const response = await fetch(protectedResourceMetadataUrl(endpoint), {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`MCP protected-resource metadata failed (${response.status}).`);
  }
  const metadata = await response.json();
  const scopes = [...new Set(
    (metadata?.scopes_supported || []).map((scope) => String(scope || "").trim()).filter((scope) => /^https:\/\/.+\/\.default$/i.test(scope))
  )];
  if (scopes.length !== 1) {
    throw new Error("MCP protected-resource metadata must advertise exactly one HTTPS .default token scope.");
  }
  return scopes[0];
}
async function registerGenericMcp(agent, mcpName, endpoint, tokenScope, subscription, entry) {
  const connectorPath = withApiVersion(
    `/subscriptions/${subscription}/resourceGroups/${agent.resourceGroup}/providers/Microsoft.App/agents/${agent.name}/connectors/${encodeURIComponent(mcpName)}`
  );
  const connectorIdentity = agent.executionIdentityId || "system";
  const body = {
    properties: {
      name: mcpName,
      dataConnectorType: "Mcp",
      dataSource: "placeholder",
      identity: connectorIdentity,
      extendedProperties: {
        type: "http",
        endpoint,
        // Preview remote-MCP managed identity serializes to the runtime's
        // AzureARM wire contract; the portal labels this Managed Identity.
        authType: "AzureARM",
        armScope: tokenScope
      }
    }
  };
  const probe = await dataPlaneFetch(
    agent,
    subscription,
    "POST",
    `/api/v2/extendedAgent/connectors/${encodeURIComponent(mcpName)}/testconnection`,
    { name: mcpName, type: "AgentConnector", ...body },
    entry,
    { title: `test generic MCP ${mcpName}` }
  );
  if (!probe?.success) {
    throw new Error(
      `MCP connection test failed: ${probe?.errorMessage || "the SRE Agent runtime could not authenticate to Connector Namespace"}. Remote HTTP MCP managed identity requires SRE Agent Preview version 26.4.164.0 or later.`
    );
  }
  const selectedTools = (probe.tools || []).map((tool) => tool?.name).filter(Boolean);
  if (selectedTools.length === 0) {
    throw new Error("The MCP connection succeeded but exposed no tools to attach to the SRE Agent.");
  }
  body.properties.extendedProperties.selectedTools = selectedTools;
  body.properties.extendedProperties.toolsVisibleToMetaAgent = selectedTools;
  const registration = await armPut(
    connectorPath,
    body,
    subscription,
    entry,
    {
      title: `register generic MCP ${mcpName}`,
      purpose: "Attach the Connector Namespace endpoint as a generic managed-identity HTTP MCP connector and enable its discovered tools."
    }
  );
  return { registration, probe };
}
async function finishDelegatedKustoMcp(agent, pending, subscription, entry) {
  const { gateway, connectionName, clusterUrl, database } = pending;
  const base = gatewayResourcePath(gateway);
  const exported = await armGet(
    connectorGatewayApi(`${base}/managedApis/kusto?export=true`),
    subscription,
    entry,
    { title: "read Kusto connector operations", purpose: "Use the Connector Namespace Kusto contract as the source of truth." }
  );
  const queryOperation = operationList(exported).find(
    (operation2) => /listKustoResults|query|execute|run/i.test(`${operationName(operation2)} ${operationDisplayName(operation2)}`)
  );
  if (!queryOperation) throw new Error("PLATFORM BLOCKER: Connector Namespace exposes no Kusto query operation to wrap as MCP.");
  const operation = kustoOperationConfig(queryOperation, clusterUrl, database);
  const identity = await currentIdentity(entry);
  const ownerKey = connectorOwnerKey(identity.objectId);
  if (!ownerKey) throw new Error("An immutable signed-in Entra identity is required to create a reusable private Kusto MCP.");
  const mcpName = `private-kusto-${ownerKey}-${(await stableGuid(`${agent.id}|${clusterUrl}|${database}`)).slice(0, 8)}`;
  const mcpPath = `${base}/mcpserverConfigs/${encodeURIComponent(mcpName)}`;
  const mcpConfig = await armPut(
    connectorGatewayApi(mcpPath),
    {
      properties: {
        description: `Delegated read-only Kusto access to ${database}`,
        state: "Enabled",
        disableApiKeyAuth: true,
        settings: { TextOnlyContent: true },
        connectors: [{
          name: "kusto",
          connectionName,
          displayName: "Azure Data Explorer",
          operations: [operation]
        }]
      }
    },
    subscription,
    entry,
    { title: `create Connector Namespace MCP ${mcpName}`, purpose: "Wrap the signed-in Kusto connection as an authenticated MCP endpoint." }
  );
  await grantConnectionUserAccess(`${base}/connections/${encodeURIComponent(connectionName)}`, identity, subscription, entry);
  await grantMcpPrincipalAccess(mcpPath, agent.executionPrincipalId, agent.tenantId, subscription, entry);
  const gatewayId = gateway?.properties?.connectorGatewayId || gateway?.properties?.gatewayId || "";
  const endpoint = mcpConfig?.properties?.endpoint || mcpConfig?.properties?.mcpEndpointUrl || (gatewayId && gateway.location ? `https://app-16.${gateway.location}.logic.azure.com/api/connectorGateways/${gatewayId}/mcpServerConfigs/${mcpName}/mcp` : "");
  if (!endpoint) throw new Error("Connector Namespace created the MCP config but did not return enough information to determine its endpoint.");
  const namespaceMcp = {
    name: mcpName,
    endpoint,
    state: mcpConfig?.properties?.state || "Enabled",
    provisioningState: mcpConfig?.properties?.provisioningState || "Succeeded",
    attached: false,
    attachmentStatus: "Checking SRE Agent attachment..."
  };
  entry.connectorNamespaceMcps = [
    namespaceMcp,
    ...(entry.connectorNamespaceMcps || []).filter((item) => item.name !== mcpName)
  ];
  let registration;
  try {
    const tokenScope = await discoverMcpTokenScope(endpoint);
    registration = await registerGenericMcp(agent, mcpName, endpoint, tokenScope, subscription, entry);
  } catch (err) {
    namespaceMcp.attachmentStatus = `MCP registration failed: ${shortError(err)}`;
    entry.connectors = await listConnectors(agent, subscription, entry).catch(() => entry.connectors);
    entry.status = `Created Connector Namespace MCP ${mcpName}, but it is not attached or usable from SRE Agent. ${namespaceMcp.attachmentStatus}`;
    broadcast(entry, "state", snapshot(entry));
    return {
      signInRequired: false,
      mcpName,
      operation: operation.name,
      endpoint,
      attached: false,
      platformBlocker: namespaceMcp.attachmentStatus,
      registrationError: shortError(err)
    };
  }
  namespaceMcp.attached = true;
  namespaceMcp.attachmentStatus = "Attached to SRE Agent as a managed-identity HTTP MCP connector.";
  entry.connectors = await listConnectors(agent, subscription, entry).catch(() => entry.connectors);
  entry.status = `Created delegated Kusto MCP ${mcpName}, granted the SRE managed identity access, and attached the generic MCP connector. Validate a read-only query next. CRITICAL TODO: fail-closed thread-owner enforcement is not implemented.`;
  return { signInRequired: false, mcpName, operation: operation.name, endpoint, attached: true, registration };
}
async function createDelegatedKustoMcp(agent, { clusterUrl, database, gatewayName }, subscription, entry) {
  if (!clusterUrl || !database) throw new Error("Choose a Kusto cluster and database.");
  if (!agent.executionPrincipalId || !agent.tenantId) {
    throw new Error("The selected SRE Agent does not expose the managed identity used for connector execution.");
  }
  const cluster = String(clusterUrl).replace(/\/+$/, "");
  const desiredConnectionName = `private-kusto-${(await stableGuid(`${agent.id}|${cluster}|${database}`)).slice(0, 8)}`;
  const selected = await findConnectorGateway(subscription, gatewayName, agent, desiredConnectionName, database, entry);
  const { gateway, connectionName } = selected;
  const base = gatewayResourcePath(gateway);
  await armGet(
    connectorGatewayApi(`${base}/managedApis/kusto`),
    subscription,
    entry,
    { title: "verify Kusto connector", purpose: "Verify that this general Connector Namespace supports Azure Data Explorer." }
  );
  const connectionPath = `${base}/connections/${encodeURIComponent(connectionName)}`;
  let connection = await armPut(
    connectorGatewayApi(connectionPath),
    {
      location: gateway.location,
      properties: {
        displayName: `Azure Data Explorer - ${database}`,
        connectorName: "kusto"
      }
    },
    subscription,
    entry,
    { title: `create delegated Kusto connection ${connectionName}`, purpose: "Create or reuse a user-delegated Kusto connection in Connector Namespace." }
  );
  const pending = { gateway, connectionName, connectionPath, clusterUrl: cluster, database };
  connection = await refreshDelegatedConnection(connectionPath, connection, subscription, entry);
  if (delegatedConnectionStatus(connection) === "connected") {
    return finishDelegatedKustoMcp(agent, pending, subscription, entry);
  }
  const consent = await armPost(
    connectorGatewayApi(`${connectionPath}/listConsentLinks`),
    {
      parameters: [{
        parameterName: "token",
        redirectUrl: `${entry.url.replace(/\/$/, "")}/auth/callback.html`
      }]
    },
    subscription,
    entry,
    { title: "start Kusto sign-in", purpose: "Open Connector Namespace user-delegated OAuth without exposing authentication internals." }
  );
  const signInUrl = consent?.value?.[0]?.link || consent?.value?.[0]?.consentLink || consent?.link || consent?.consentLink || "";
  if (!signInUrl) throw new Error("Connector Namespace did not return a Kusto sign-in URL.");
  entry.pendingKustoConsent = pending;
  entry.status = "Complete the Azure Data Explorer sign-in. Azure SRE Agent will continue MCP creation automatically when consent returns.";
  return { signInRequired: true, signInUrl };
}
async function confirmDelegatedKustoConsent(agent, code, subscription, entry) {
  const pending = entry.pendingKustoConsent;
  if (!pending || !code) throw new Error("No pending Kusto sign-in was found. Start Sign in & create MCP again.");
  await armPost(
    connectorGatewayApi(`${pending.connectionPath}/confirmConsentCode`),
    { code },
    subscription,
    entry,
    { title: "confirm Kusto sign-in", purpose: "Complete Connector Namespace consent without logging or persisting the consent code." }
  );
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const connection = await armGet(
      connectorGatewayApi(pending.connectionPath),
      subscription,
      entry,
      { title: "check Kusto connection", purpose: "Wait until the delegated connection is ready." }
    );
    if (delegatedConnectionStatus(connection) === "connected") {
      entry.pendingKustoConsent = null;
      return finishDelegatedKustoMcp(agent, pending, subscription, entry);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Kusto sign-in returned, but Connector Namespace did not report the connection as Connected.");
}
async function dataPlaneFetch(agent, subscription, method, urlPath, body, entry, meta) {
  const endpoint = dataPlaneEndpoint(agent);
  const token = await azureCliSession.accessToken(subscription, SRE_AGENT_TOKEN_RESOURCE);
  const accessToken = token?.accessToken || token?.access_token;
  if (!accessToken) throw new Error("Could not obtain an SRE Agent data-plane access token from az login.");
  const url = `${endpoint}${urlPath}`;
  const cmd = restLogged(entry, method, url, meta);
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : void 0
    });
  } catch (err) {
    cmdEnd(entry, cmd, { ok: false, note: shortError(err) });
    throw err;
  }
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: text };
  }
  if (!res.ok) {
    const message = shortError(new Error(parsed?.message || parsed?.error || text || `HTTP ${res.status}`));
    cmdEnd(entry, cmd, { ok: false, note: `HTTP ${res.status}: ${message}` });
    throw new Error(`${method} ${urlPath} failed (${res.status}): ${message}`);
  }
  cmdEnd(entry, cmd, { ok: true, note: `HTTP ${res.status}` });
  return parsed;
}
var cachedIdentity = null;
async function currentIdentity(entry) {
  if (cachedIdentity) return cachedIdentity;
  const item = entry ? cmdStart(entry, { kind: "az", title: "whoami", cmd: "az account show && az ad signed-in-user show", purpose: "Resolve the signed-in user's immutable Entra object ID for thread ownership and private connector authorization." }) : null;
  try {
    const account = await runAz(["account", "show", "-o", "json"]);
    let user = null;
    if (String(account?.user?.type || "").toLowerCase() === "user") {
      user = await runAz([
        "ad",
        "signed-in-user",
        "show",
        "--query",
        "{objectId:id,userPrincipalName:userPrincipalName,displayName:displayName}",
        "-o",
        "json"
      ]).catch(() => null);
    }
    const objectId = user?.objectId || "";
    const upn = user?.userPrincipalName || account?.user?.name || "";
    cachedIdentity = {
      objectId,
      userId: objectId || upn,
      userPrincipalName: upn,
      displayName: user?.displayName || upn,
      tenantId: account?.tenantId || ""
    };
    if (item) cmdEnd(entry, item, { ok: true, note: cachedIdentity.displayName });
  } catch (err) {
    if (item) cmdEnd(entry, item, { ok: false, note: shortError(err) });
    throw err;
  }
  return cachedIdentity;
}
async function listThreads(agent, subscription, entry) {
  const data = await dataPlaneFetch(agent, subscription, "GET", "/api/v1/threads", void 0, entry, { title: "list threads" });
  return sortThreadsByRecency(data?.value || data || []);
}
async function listNeedsAttention(agent, subscription, entry) {
  const data = await dataPlaneFetch(agent, subscription, "GET", "/api/v1/threads/needsAttention", void 0, entry, { title: "list threads waiting on you" });
  return data?.value || data || [];
}
async function getThreadMessages(agent, subscription, threadId2, entry) {
  const messages = await dataPlaneFetch(
    agent,
    subscription,
    "GET",
    `/api/v1/threads/${encodeURIComponent(threadId2)}/messages?skip=0&top=100&orderby=timestamp`,
    void 0,
    entry,
    { title: "get thread messages" }
  );
  return messages?.value || messages || [];
}
async function getThread(agent, subscription, threadId2, entry) {
  const [thread, messages] = await Promise.all([
    dataPlaneFetch(agent, subscription, "GET", `/api/v1/threads/${encodeURIComponent(threadId2)}`, void 0, entry, { title: "get thread" }),
    getThreadMessages(agent, subscription, threadId2, entry)
  ]);
  if (!thread?.id) throw new Error(`Thread "${threadId2}" was not found.`);
  return { ...thread, messages };
}
function findExecutionInThread2(thread, kind, executionId) {
  return findExecutionInThread(thread, {
    executionType: kind,
    executionId
  })?.execution || null;
}
async function createThread(agent, subscription, message, entry) {
  const identity = await currentIdentity(entry);
  return dataPlaneFetch(agent, subscription, "POST", "/api/v1/threads", {
    startMessage: { text: message, userId: identity.userId, displayName: identity.displayName }
  }, entry, { title: "create thread" });
}
async function sendMessage(agent, subscription, threadId2, message, entry) {
  const identity = await currentIdentity(entry);
  return dataPlaneFetch(agent, subscription, "POST", `/api/v1/threads/${encodeURIComponent(threadId2)}/messages`, {
    text: message,
    role: "User",
    displayName: identity.displayName,
    userId: identity.userId
  }, entry, { title: "send message" });
}
async function investigate(agent, subscription, message, _options = {}, entry) {
  return createThread(agent, subscription, message, entry);
}
async function runExecutionAction(agent, subscription, kind, threadId2, executionId, action, entry) {
  const identity = await currentIdentity(entry);
  return dataPlaneFetch(
    agent,
    subscription,
    "POST",
    `/api/v1/${encodeURIComponent(kind)}/${encodeURIComponent(threadId2)}/${encodeURIComponent(executionId)}/action`,
    { action, user: identity.userId || "sreagent-client" },
    entry,
    { title: `${action} execution (grant/OBO retry)` }
  );
}
async function authorizeExecutionSafely({
  listAttention,
  readThread,
  run,
  threadId: threadId2,
  executionId,
  executionType,
  expectedCommand
}) {
  const attention = await listAttention();
  const queued = attention.find((item) => item?.threadId === threadId2 && (!item.executionId || item.executionId === executionId) && (!item.executionType || item.executionType === executionType));
  if (!queued) throw new Error("This execution is no longer waiting for authorization.");
  const thread = await readThread(threadId2);
  const execution = findExecutionInThread2(thread, executionType, executionId);
  if (!execution || execution.status !== "PendingAuthorization") {
    throw new Error("This execution is no longer pending authorization.");
  }
  if (typeof expectedCommand !== "string" || execution.command !== expectedCommand) {
    throw new Error("The pending command changed. Reopen the thread and review the current command before authorizing it.");
  }
  return run();
}
var ROLE_DEFINITION_IDS = {
  Reader: "acdd72a7-3385-48ef-bd42-f606fba81ae7",
  Contributor: "b24988ac-6180-42a0-ab88-20f7382dd24c",
  "Website Contributor": "de139f84-1756-47ae-9be6-808fbbe84772",
  "Log Analytics Reader": "73c42c96-874c-492b-b04d-ab87d138a893",
  "Monitoring Reader": "43d0d8ad-25c7-4714-9337-8ba259a9fe05"
};
function scopesText(exec) {
  const raw = exec?.requiredScopes;
  if (Array.isArray(raw)) return raw.join(", ");
  return String(raw || "");
}
function guessRoleForExecution(exec) {
  const scopes = scopesText(exec).toLowerCase();
  const command = String(exec?.command || "").toLowerCase();
  const text = `${scopes} ${command}`;
  if (/(config appsettings list|config connection-string list|publishing-credentials|list-publishing|function keys list|deployment list-publishing-profiles)/.test(text)) return "Website Contributor";
  if (/log-analytics query|app-insights query|kusto|\blogs?\b/.test(text)) return "Log Analytics Reader";
  if (/metric|monitor/.test(text)) return "Monitoring Reader";
  if (/webapp|functionapp|site/.test(text) && /restart|config set|deploy|scale/.test(text)) return "Website Contributor";
  if (/write|delete|update|restart|scale|set|apply|deploy/.test(text)) return "Contributor";
  return "Reader";
}
async function grantDurableRoleAssignment(agent, subscription, { resourceId, role, principalId }, entry) {
  if (!principalId) {
    throw new Error("Could not resolve the SRE Agent's execution identity (properties.actionConfiguration.identity). Cannot create a role assignment without a principal.");
  }
  const roleDefinitionId = ROLE_DEFINITION_IDS[role] || ROLE_DEFINITION_IDS.Reader;
  const roleDefinitionResourceId = `/subscriptions/${subscription}/providers/Microsoft.Authorization/roleDefinitions/${roleDefinitionId}`;
  const seed = `${resourceId}|${principalId}|${roleDefinitionId}`;
  const assignmentName = await stableGuid(seed);
  const body = {
    properties: {
      roleDefinitionId: roleDefinitionResourceId,
      principalId,
      principalType: "ServicePrincipal"
    }
  };
  try {
    return await armPut(
      `${resourceId}/providers/Microsoft.Authorization/roleAssignments/${assignmentName}?api-version=2022-04-01`,
      body,
      subscription,
      entry,
      { title: `grant ${role} to SRE Agent identity`, purpose: `Create a durable RBAC role assignment (${role}) so ${agent.name}'s execution identity can run this class of command without OBO fallback.` }
    );
  } catch (err) {
    if (/RoleAssignmentExists|already exists/i.test(shortError(err))) return { alreadyExists: true };
    throw err;
  }
}
function extractResourceIdFromCommand(command) {
  const match = String(command || "").match(/\/subscriptions\/[^\s'"]+/);
  return match ? match[0].replace(/[)'"]+$/, "") : "";
}
function extractCliFlag(command, flag) {
  const match = String(command || "").match(new RegExp(`--${flag}\\s+("[^"]+"|'[^']+'|\\S+)`));
  if (!match) return "";
  return match[1].replace(/^['"]|['"]$/g, "");
}
async function resolveResourceIdFromCommand(command, subscription, entry) {
  const direct = extractResourceIdFromCommand(command);
  if (direct) return direct;
  const resourceGroup = extractCliFlag(command, "resource-group") || extractCliFlag(command, "resource-group-name");
  const name = extractCliFlag(command, "name");
  if (resourceGroup && !name) {
    return `/subscriptions/${subscription}/resourceGroups/${resourceGroup}`;
  }
  if (!name || !resourceGroup) return "";
  const cmd = String(command || "").toLowerCase();
  const typeGuess = cmd.includes("containerapp") ? "microsoft.app/containerapps" : "microsoft.web/sites";
  const query = `Resources | where resourceGroup =~ '${resourceGroup.replace(/'/g, "''")}' and name =~ '${name.replace(/'/g, "''")}' and type =~ '${typeGuess}' | project id`;
  const rows = await graphQuery(query, subscription, entry, { title: "resolve resource for durable grant", purpose: "Look up the exact resource ID for a --name/--resource-group az command so the RBAC grant can be scoped precisely." });
  if (rows?.[0]?.id) return rows[0].id;
  return `/subscriptions/${subscription}/resourceGroups/${resourceGroup}`;
}
async function stableGuid(seed) {
  const { createHash: createHash3 } = await import("node:crypto");
  const hash = createHash3("sha1").update(seed).digest("hex").slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
async function listActiveIncidents(agent, subscription, entry) {
  const data = await dataPlaneFetch(agent, subscription, "GET", "/api/v2/incidents", void 0, entry, { title: "list active incidents" });
  return data?.value || data || [];
}
async function createIncident(agent, subscription, { title, description, severity, services }, entry) {
  const text = `Incident: ${title}
Severity: ${severity || "unspecified"}
Services: ${(services || []).join(", ") || "unspecified"}

${description || ""}`.trim();
  return createThread(agent, subscription, text, entry);
}
async function listScheduledTasks(agent, subscription, entry) {
  const data = await dataPlaneFetch(agent, subscription, "GET", "/api/v1/scheduledtasks", void 0, entry, { title: "list scheduled tasks" });
  return data?.value || data || [];
}
async function createScheduledTask(agent, subscription, { name, cronExpression, message, description }, entry) {
  return dataPlaneFetch(agent, subscription, "POST", "/api/v1/scheduledtasks", {
    name,
    description,
    cron: cronExpression,
    startMessage: message,
    triggerType: "ScheduledTask",
    maxExecutions: null,
    notificationChannel: null,
    executionContext: {}
  }, entry, { title: "create scheduled task" });
}
async function pauseScheduledTask(agent, subscription, taskId, entry) {
  return dataPlaneFetch(agent, subscription, "POST", `/api/v1/scheduledtasks/${encodeURIComponent(taskId)}/pause`, void 0, entry, { title: "pause scheduled task" });
}
async function resumeScheduledTask(agent, subscription, taskId, entry) {
  return dataPlaneFetch(agent, subscription, "POST", `/api/v1/scheduledtasks/${encodeURIComponent(taskId)}/resume`, void 0, entry, { title: "resume scheduled task" });
}
async function searchMemories(agent, subscription, query, entry) {
  const data = await dataPlaneFetch(agent, subscription, "GET", `/api/v1/agentmemory/documents?q=${encodeURIComponent(query)}`, void 0, entry, { title: "search memories" });
  return data?.value || data || [];
}
async function addMemory(agent, subscription, { name, content }, entry) {
  return dataPlaneFetch(agent, subscription, "POST", "/api/v1/agentmemory/documents", { name, content }, entry, { title: "add memory" });
}
async function generateWorkflow(agent, subscription, { kind, name, description, modelOrType, tools, handoffs, connector }, entry) {
  return dataPlaneFetch(agent, subscription, "POST", "/api/v1/workflows", {
    kind,
    name,
    description,
    modelOrType,
    tools,
    handoffs,
    connector
  }, entry, { title: "generate workflow" });
}
async function resolveAppResource(subscription, resourceIdOrName, entry) {
  if (!resourceIdOrName) return null;
  const isId = resourceIdOrName.startsWith("/subscriptions/");
  const types = APP_RESOURCE_TYPES.map((t) => `'${t}'`).join(",");
  const query = isId ? `Resources | where id =~ '${resourceIdOrName.replace(/'/g, "''")}'` : `Resources | where (type in~ (${types}) or type contains 'sandbox') and name =~ '${resourceIdOrName.replace(/'/g, "''")}'`;
  const rows = await graphQuery(query, isId ? void 0 : subscription, entry, { title: "graph query (resolve app)", purpose: "Resolve the target app resource by id or name." });
  return rows[0] || null;
}
async function resourceHealthSummary(resourceId, subscription, entry) {
  const path2 = `${resourceId}/providers/Microsoft.ResourceHealth/availabilityStatuses/current`;
  const data = await armGet(withApiVersion(path2), subscription, entry, { title: "resource health", purpose: "Pull the current Resource Health status for the target app." }).catch((err) => ({ error: shortError(err) }));
  if (data?.error) return { availabilityState: "unknown", summary: data.error };
  return {
    availabilityState: data?.properties?.availabilityState || "unknown",
    summary: data?.properties?.title || data?.properties?.summary || "",
    reasonType: data?.properties?.reasonType || "",
    occurredTime: data?.properties?.occurredTime || ""
  };
}
var WORKSPACE_SCAN_FILE_CAP = 500;
var WORKSPACE_SCAN_FILE_SIZE_CAP = 200 * 1024;
var WORKSPACE_SCAN_SKIP_DIRS = /* @__PURE__ */ new Set(["node_modules", ".git", "bin", "obj", "dist", "build", ".venv", "__pycache__", ".next", "out"]);
var WORKSPACE_SCAN_EXTENSIONS = /* @__PURE__ */ new Set([".js", ".ts", ".jsx", ".tsx", ".cs", ".py", ".json", ".bicep", ".tf"]);
function workspaceRoot() {
  return process.cwd();
}
function collectWorkspaceFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length && files.length < WORKSPACE_SCAN_FILE_CAP) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const dirent of entries) {
      if (files.length >= WORKSPACE_SCAN_FILE_CAP) break;
      if (dirent.name.startsWith(".") && dirent.name !== ".env" && !dirent.name.startsWith(".env")) continue;
      const full = join(dir, dirent.name);
      if (dirent.isDirectory()) {
        if (!WORKSPACE_SCAN_SKIP_DIRS.has(dirent.name)) stack.push(full);
        continue;
      }
      const isDotEnv = dirent.name === ".env" || dirent.name.startsWith(".env.");
      const isSpecial = dirent.name === "local.settings.json" || dirent.name === "host.json";
      const ext = dirent.name.slice(dirent.name.lastIndexOf("."));
      if (isDotEnv || isSpecial || WORKSPACE_SCAN_EXTENSIONS.has(ext)) files.push(full);
    }
  }
  return files;
}
function scanFileForSettings(fileName, text) {
  const hits = [];
  const push = (settingName, line, kind) => {
    if (settingName) hits.push({ settingName, line, kind });
  };
  const lines = text.split("\n");
  if (fileName === "local.settings.json") {
    try {
      const parsed = JSON.parse(text);
      const values = parsed?.Values || {};
      for (const key of Object.keys(values)) {
        const lineIdx = lines.findIndex((l) => l.includes(`"${key}"`));
        push(key, lineIdx >= 0 ? lineIdx + 1 : 1, "local.settings.json");
      }
    } catch {
    }
    return hits;
  }
  if (fileName === ".env" || fileName.startsWith(".env.")) {
    lines.forEach((line, idx) => {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (m) push(m[1], idx + 1, ".env");
    });
    return hits;
  }
  if (fileName === "host.json") {
    lines.forEach((line, idx) => {
      const m = line.match(/"(?:connection|ConnectionString|[A-Za-z]*[Cc]onnection)"\s*:\s*"([A-Za-z_][A-Za-z0-9_]*)"/);
      if (m) push(m[1], idx + 1, "host.json");
    });
    return hits;
  }
  if (fileName.endsWith(".bicep") || fileName.endsWith(".tf")) {
    const appSettingsBlockRe = /appSettings\s*[:=]?\s*\[([\s\S]*?)\]/g;
    let blockMatch;
    while (blockMatch = appSettingsBlockRe.exec(text)) {
      const block = blockMatch[1];
      const nameRe = /name\s*[:=]\s*'([A-Za-z_][A-Za-z0-9_]*)'|name\s*[:=]\s*"([A-Za-z_][A-Za-z0-9_]*)"/g;
      let nameMatch;
      while (nameMatch = nameRe.exec(block)) {
        const settingName = nameMatch[1] || nameMatch[2];
        const offset = blockMatch.index + block.indexOf(nameMatch[0]);
        const lineIdx = text.slice(0, offset).split("\n").length;
        push(settingName, lineIdx, fileName.endsWith(".bicep") ? "bicep appSettings" : "terraform app_settings");
      }
    }
    return hits;
  }
  const patterns = [
    { re: /process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g, kind: "process.env" },
    { re: /process\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g, kind: "process.env" },
    { re: /Configuration\[\s*"([A-Za-z_][A-Za-z0-9_]*)"\s*\]/g, kind: "Configuration[]" },
    { re: /Environment\.GetEnvironmentVariable\(\s*"([A-Za-z_][A-Za-z0-9_]*)"\s*\)/g, kind: "GetEnvironmentVariable" },
    { re: /os\.environ\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g, kind: "os.environ" },
    { re: /os\.getenv\(\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g, kind: "os.getenv" }
  ];
  lines.forEach((line, idx) => {
    for (const { re, kind } of patterns) {
      re.lastIndex = 0;
      let m;
      while (m = re.exec(line)) push(m[1], idx + 1, kind);
    }
  });
  return hits;
}
function scanWorkspaceForAppSettings(root) {
  const files = collectWorkspaceFiles(root);
  const bySettingName = /* @__PURE__ */ new Map();
  for (const full of files) {
    let stat2;
    try {
      stat2 = statSync(full);
    } catch {
      continue;
    }
    if (!stat2.isFile() || stat2.size > WORKSPACE_SCAN_FILE_SIZE_CAP) continue;
    let text;
    try {
      text = readFileSync2(full, "utf8");
    } catch {
      continue;
    }
    const fileName = full.slice(full.lastIndexOf("/") + 1);
    const hits = scanFileForSettings(fileName, text);
    for (const hit of hits) {
      const key = hit.settingName.toLowerCase();
      if (!bySettingName.has(key)) bySettingName.set(key, { settingName: hit.settingName, sources: [] });
      bySettingName.get(key).sources.push({ file: relative(root, full), line: hit.line, kind: hit.kind });
    }
  }
  return [...bySettingName.values()];
}
async function fetchAzureAppSettings(resource, subscription, entry) {
  if (resource.type?.toLowerCase() === "microsoft.app/containerapps") {
    const data2 = await armGet(withApiVersion(resource.id), subscription, entry, {
      title: "get container app (env)",
      purpose: "Read container env vars from the Container App's revision template for the config drift check."
    }).catch((err) => ({ error: shortError(err) }));
    if (data2?.error) return { error: data2.error, names: [] };
    const containers = data2?.properties?.template?.containers || [];
    const names = /* @__PURE__ */ new Set();
    for (const c of containers) {
      for (const e of c.env || []) if (e?.name) names.add(e.name);
    }
    return { names: [...names] };
  }
  if (resource.type?.toLowerCase() !== "microsoft.web/sites") {
    return { error: `Workspace config drift check is not implemented for ${resource.type}.`, names: [] };
  }
  const isFunctionApp = /functionapp|kind":"functionapp/i.test(JSON.stringify(resource.kind || ""));
  const cliVerb = isFunctionApp ? "functionapp" : "webapp";
  const data = await azLogged(
    entry,
    [cliVerb, "config", "appsettings", "list", "--name", resource.name, "--resource-group", resource.resourceGroup, "-o", "json"],
    subscription,
    { title: "list app settings", purpose: "Read the live App Settings configured on this Web App / Function App for the config drift check." }
  ).catch((err) => ({ error: shortError(err) }));
  if (data?.error) return { error: data.error, names: [] };
  const list = Array.isArray(data) ? data : [];
  return { names: list.map((entryItem) => entryItem?.name).filter(Boolean) };
}
function diffAppSettings(workspaceSettings, azureNames) {
  const azureByLower = new Map(azureNames.map((n) => [n.toLowerCase(), n]));
  const workspaceByLower = new Map(workspaceSettings.map((s) => [s.settingName.toLowerCase(), s]));
  const missingInAzure = [];
  const matched = [];
  for (const [lower, ws] of workspaceByLower) {
    if (azureByLower.has(lower)) matched.push(ws.settingName);
    else missingInAzure.push(ws);
  }
  const unusedInWorkspace = azureNames.filter((n) => !workspaceByLower.has(n.toLowerCase()));
  return { missingInAzure, unusedInWorkspace, matchedCount: matched.length };
}
async function checkWorkspaceConfigDrift(resource, subscription, entry) {
  const workspaceSettings = scanWorkspaceForAppSettings(workspaceRoot());
  const azureResult = await fetchAzureAppSettings(resource, subscription, entry);
  if (azureResult.error) return { error: azureResult.error, workspaceSettings, missingInAzure: [], unusedInWorkspace: [], matchedCount: 0 };
  const diff = diffAppSettings(workspaceSettings, azureResult.names);
  return { workspaceSettings, ...diff };
}
var instances = /* @__PURE__ */ new Map();
var session;
var STICKY_STATE_DIR = join(homedir(), ".copilot", "azure-sre-agent");
var LEGACY_STICKY_STATE_FILE = join(homedir(), ".copilot", "sre-agent-studio", "last-selection.json");
var STICKY_STATE_FILE = join(STICKY_STATE_DIR, "last-selection.json");
function loadStickyState() {
  for (const file of [STICKY_STATE_FILE, LEGACY_STICKY_STATE_FILE]) {
    try {
      const parsed = JSON.parse(readFileSync2(file, "utf8"));
      return {
        subscription: typeof parsed.subscription === "string" ? parsed.subscription : "",
        agentName: typeof parsed.agentName === "string" ? parsed.agentName : "",
        agentResourceGroup: typeof parsed.agentResourceGroup === "string" ? parsed.agentResourceGroup : ""
      };
    } catch {
    }
  }
  return { subscription: "", agentName: "", agentResourceGroup: "" };
}
function saveStickyState(state) {
  try {
    mkdirSync(STICKY_STATE_DIR, { recursive: true });
    writeFileSync(STICKY_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
  }
}
function rememberSelection(entry) {
  saveStickyState({
    subscription: entry.subscription || "",
    agentName: entry.agent?.name || "",
    agentResourceGroup: entry.agent?.resourceGroup || ""
  });
}
function ensureEntry(instanceId) {
  let entry = instances.get(instanceId);
  if (!entry) {
    const sticky = loadStickyState();
    entry = {
      instanceId,
      server: null,
      url: "",
      clients: /* @__PURE__ */ new Set(),
      subscriptions: [],
      subscription: sticky.subscription,
      appSubscription: sticky.subscription,
      connectorSubscription: "",
      agents: [],
      agent: null,
      pendingAgentName: sticky.agentName,
      pendingAgentResourceGroup: sticky.agentResourceGroup,
      appResources: [],
      connectors: [],
      connectorGateways: [],
      connectorNamespaceMcps: [],
      kustoResources: [],
      connectorAccessInfo: {},
      threads: [],
      activeThread: null,
      focusedThreadId: "",
      focusedThreadTitle: "",
      incidents: [],
      needsAttention: [],
      executionGates: null,
      scheduledTasks: [],
      memoryResults: [],
      commands: [],
      configDrift: null,
      status: "Not connected. Run doctor or select a subscription to discover SRE Agents.",
      error: "",
      busy: false,
      selectionGeneration: 0,
      appGeneration: 0
    };
    instances.set(instanceId, entry);
  }
  return entry;
}
function snapshot(entry) {
  return {
    subscriptions: entry.subscriptions,
    subscription: entry.subscription,
    appSubscription: entry.appSubscription,
    connectorSubscription: entry.connectorSubscription,
    agents: entry.agents,
    agent: entry.agent,
    appResources: entry.appResources,
    connectors: entry.connectors,
    connectorGateways: entry.connectorGateways,
    connectorNamespaceMcps: entry.connectorNamespaceMcps,
    kustoResources: entry.kustoResources,
    connectorAccessInfo: entry.connectorAccessInfo || {},
    threads: entry.threads,
    activeThread: entry.activeThread,
    focusedThreadId: entry.focusedThreadId,
    focusedThreadTitle: entry.focusedThreadTitle,
    incidents: entry.incidents,
    needsAttention: entry.needsAttention,
    executionGates: entry.executionGates,
    scheduledTasks: entry.scheduledTasks,
    memoryResults: entry.memoryResults,
    commands: entry.commands,
    configDrift: entry.configDrift,
    status: entry.status,
    error: entry.error,
    busy: entry.busy
  };
}
function appendFocusContract(entry, result) {
  if (!entry.focusedThreadId || !result || typeof result !== "object" || Array.isArray(result)) return result;
  return {
    ...result,
    focus: {
      threadId: entry.focusedThreadId,
      title: entry.focusedThreadTitle,
      contract: FOCUS_CONTRACT
    }
  };
}
function clearThreadContext(entry) {
  entry.activeThread = null;
  entry.focusedThreadId = "";
  entry.focusedThreadTitle = "";
}
function agentContextKey(agent) {
  return String(agent?.id || `${agent?.resourceGroup || ""}/${agent?.name || ""}`).toLowerCase();
}
function isAgentContextSwitch(currentAgent, nextAgent) {
  return Boolean(currentAgent && agentContextKey(currentAgent) !== agentContextKey(nextAgent));
}
async function activateDefaultThread(entry, fetchThread) {
  entry.threads = sortThreadsByRecency(entry.threads);
  const activeId = threadId(entry.activeThread);
  if (activeId && entry.threads.some((thread2) => threadId(thread2) === activeId)) return false;
  if (activeId) entry.activeThread = null;
  if (!entry.threads.length) {
    entry.activeThread = null;
    return false;
  }
  const candidateId = threadId(entry.threads[0]);
  const agentKey = agentContextKey(entry.agent);
  const thread = await fetchThread(candidateId);
  if (entry.activeThread || agentContextKey(entry.agent) !== agentKey) return false;
  if (!entry.threads.some((candidate) => threadId(candidate) === candidateId)) return false;
  entry.activeThread = thread;
  return true;
}
async function waitForNewAgentReplies({
  getThread: fetchThread,
  seen,
  waitSeconds,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  const budgetMs = Math.max(0, waitSeconds * 1e3);
  const startedAt = now();
  let thread;
  let replies = [];
  let textualReplies = [];
  let completed = false;
  for (; ; ) {
    thread = await fetchThread();
    replies = (thread?.messages || []).filter((message) => {
      const role = message?.author?.role || message?.role || "";
      return message?.id && !seen.has(message.id) && String(role).toLowerCase() !== "user";
    });
    textualReplies = replies.filter((message) => typeof message?.text === "string" && message.text.trim());
    completed = textualReplies.length > 0 && textualReplies.at(-1)?.isComplete !== false;
    const elapsedMs = now() - startedAt;
    if (completed || elapsedMs >= budgetMs) break;
    await sleep(Math.min(3e3, budgetMs - elapsedMs));
  }
  return {
    thread,
    replies,
    textualReplies,
    completed,
    waitedSeconds: Math.round((now() - startedAt) / 1e3)
  };
}
function broadcast(entry, event, data) {
  const payload = `event: ${event}
data: ${JSON.stringify(data)}

`;
  for (const res of entry.clients) {
    try {
      res.write(payload);
    } catch {
    }
  }
}
async function withBusy(entry, statusMessage, fn) {
  entry.busy = true;
  entry.error = "";
  if (statusMessage) entry.status = statusMessage;
  broadcast(entry, "state", snapshot(entry));
  try {
    const result = await fn();
    return result;
  } catch (err) {
    entry.error = shortError(err);
    throw err;
  } finally {
    entry.busy = false;
    broadcast(entry, "state", snapshot(entry));
  }
}
async function initSubscriptions(entry) {
  entry.subscriptions = await listSubscriptions(false, entry);
  const stickyValid = entry.subscription && entry.subscriptions.some((s) => s.id === entry.subscription);
  entry.subscription = stickyValid ? entry.subscription : entry.subscriptions.find((s) => s.isDefault)?.id || entry.subscriptions[0]?.id || "";
  const appSubValid = entry.appSubscription && entry.subscriptions.some((s) => s.id === entry.appSubscription);
  entry.appSubscription = appSubValid ? entry.appSubscription : entry.subscription;
  entry.status = entry.subscription ? "Signed in. Select an SRE Agent to continue." : "Signed in, but no subscriptions were found.";
}
async function loadAgentsForSub(entry, { resetAgent = false } = {}) {
  const generation = ++entry.selectionGeneration;
  const subscription = entry.subscription;
  const agents = await listAgents(subscription, entry);
  if (generation !== entry.selectionGeneration || subscription !== entry.subscription) return false;
  entry.agents = agents;
  const wantedName = resetAgent ? "" : entry.agent?.name || entry.pendingAgentName || "";
  const stillPresent = wantedName && agents.find((a) => a.name === wantedName);
  if (resetAgent || !stillPresent) {
    entry.agent = null;
    entry.connectors = [];
    entry.kustoResources = [];
    entry.connectorAccessInfo = {};
    entry.threads = [];
    clearThreadContext(entry);
    entry.incidents = [];
    entry.needsAttention = [];
    entry.executionGates = null;
    entry.scheduledTasks = [];
  }
  entry.status = entry.agents.length ? `Found ${entry.agents.length} SRE Agent(s). Select one to continue.` : "No SRE Agent resources found in this subscription.";
  if (stillPresent && !resetAgent && (!entry.agent || entry.agent.name !== wantedName)) {
    await selectAgent(entry, stillPresent, { generation, subscription });
  }
  entry.pendingAgentName = "";
  entry.pendingAgentResourceGroup = "";
  return true;
}
async function loadAppsForSub(entry, subscription = entry.appSubscription || entry.subscription) {
  const generation = ++entry.appGeneration;
  entry.appSubscription = subscription;
  const resources = subscription ? await listAppResources(subscription, entry) : [];
  if (generation !== entry.appGeneration || subscription !== entry.appSubscription) return false;
  entry.appResources = resources;
  return true;
}
async function selectAgent(entry, agentRow, options = {}) {
  const generation = options.generation ?? ++entry.selectionGeneration;
  const subscription = options.subscription ?? entry.subscription;
  const activeThreadAtStart = entry.activeThread;
  const selectedAgent = await getAgent(agentRow.resourceGroup, agentRow.name, subscription, entry);
  dataPlaneEndpoint(selectedAgent);
  if (generation !== entry.selectionGeneration || subscription !== entry.subscription) return false;
  const [connectors, threads, incidents, needsAttention, scheduledTasks] = await Promise.all([
    listConnectors(selectedAgent, subscription, entry),
    listThreads(selectedAgent, subscription, entry),
    listActiveIncidents(selectedAgent, subscription, entry),
    listNeedsAttention(selectedAgent, subscription, entry),
    listScheduledTasks(selectedAgent, subscription, entry)
  ]);
  if (generation !== entry.selectionGeneration || subscription !== entry.subscription) return false;
  const changingAgent = isAgentContextSwitch(entry.agent, selectedAgent);
  const hydrated = {
    agent: selectedAgent,
    threads,
    activeThread: changingAgent ? null : activeThreadAtStart
  };
  await activateDefaultThread(
    hydrated,
    (threadId2) => getThread(selectedAgent, subscription, threadId2, entry)
  );
  if (generation !== entry.selectionGeneration || subscription !== entry.subscription) return false;
  entry.agent = selectedAgent;
  if (changingAgent) clearThreadContext(entry);
  entry.connectors = connectors;
  entry.threads = threads;
  if (!changingAgent && entry.activeThread !== activeThreadAtStart) {
    entry.threads = upsertThread(entry.threads, entry.activeThread);
  } else {
    entry.activeThread = hydrated.activeThread;
  }
  entry.incidents = incidents;
  entry.needsAttention = needsAttention;
  entry.executionGates = null;
  entry.scheduledTasks = scheduledTasks;
  entry.status = `Connected to ${entry.agent.name}.`;
  rememberSelection(entry);
  return true;
}
async function startServer(entry) {
  const server = createServer((req, res) => {
    handleRequest(entry, req, res).catch((err) => {
      try {
        responseJson(res, { ok: false, message: shortError(err) });
      } catch {
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  entry.server = server;
  entry.url = `http://127.0.0.1:${port}/`;
  return entry;
}
function azureDiscoveryFailure(error) {
  if (error?.code === "AZURE_CLI_NOT_FOUND") {
    return "Azure CLI executable was not found. Install Azure CLI or set AZURE_CLI_PATH to its absolute path, then reopen Azure SRE Agent.";
  }
  if (isAzureCliLoginRequiredError(error)) {
    return "Azure CLI is not signed in. Run `az login` in a terminal, then reopen Azure SRE Agent.";
  }
  return `Azure discovery failed: ${shortError(error)} Check the reported RBAC, network, or Azure API error; do not sign in again unless Azure CLI reports that authentication is required.`;
}
async function handleRequest(entry, req, res) {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderHtml());
    return;
  }
  if (url.pathname === "/auth/callback.html" && req.method === "GET") {
    const code = url.searchParams.get("code") || "";
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer"
    });
    if (!code || !entry.agent || !entry.pendingKustoConsent) {
      res.end('<!doctype html><meta charset="utf-8"><title>Azure Data Explorer sign-in</title><p>Sign-in returned without a pending Azure SRE Agent operation. Close this window and select Sign in &amp; create MCP again.</p>');
      return;
    }
    try {
      await withBusy(entry, "Completing Kusto sign-in and creating MCP...", async () => confirmDelegatedKustoConsent(entry.agent, code, entry.subscription, entry));
      res.end('<!doctype html><meta charset="utf-8"><title>Azure Data Explorer sign-in</title><p>Sign-in complete. The Kusto MCP was created and attached to your SRE Agent. You can close this window.</p><script>window.close()</script>');
    } catch (err) {
      entry.error = shortError(err);
      broadcast(entry, "state", snapshot(entry));
      res.end('<!doctype html><meta charset="utf-8"><title>Azure Data Explorer sign-in</title><p>Sign-in completed, but MCP attachment failed. Return to Azure SRE Agent for the exact error.</p>');
    }
    return;
  }
  if (url.pathname === "/events" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.write(`event: state
data: ${JSON.stringify(snapshot(entry))}

`);
    entry.clients.add(res);
    req.on("close", () => entry.clients.delete(res));
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(404).end();
    return;
  }
  const body = await readJsonBody(req);
  if (MUTATING_HTTP_ROUTES.has(url.pathname) && !WRITES_ENABLED) {
    throw new Error("This operation is unavailable in read-only mode. Restart with ALLOW_WRITES=true only after explicit approval.");
  }
  if (PRIVATE_CONNECTOR_HTTP_ROUTES.has(url.pathname) && !PRIVATE_CONNECTORS_ENABLED) {
    throw new Error("Private connector mutations are disabled for staging because verified per-invocation user and thread ownership is not available.");
  }
  const routes = {
    "/init": async () => withBusy(entry, "Discovering subscriptions...", async () => {
      await initSubscriptions(entry);
      if (entry.subscription) await loadAgentsForSub(entry);
      if (entry.appSubscription) await loadAppsForSub(entry);
    }),
    "/select-subscription": async () => withBusy(entry, "Loading SRE Agents...", async () => {
      const previousSubscription = entry.subscription;
      const changed = entry.subscription !== body.subscription;
      entry.subscription = body.subscription;
      await loadAgentsForSub(entry, { resetAgent: changed });
      if (!entry.appSubscription || entry.appSubscription === previousSubscription) {
        await loadAppsForSub(entry, entry.subscription);
      }
      if (changed) saveStickyState({ subscription: entry.subscription, agentName: "", agentResourceGroup: "" });
    }),
    "/select-app-subscription": async () => withBusy(entry, "Loading app resources...", async () => {
      await loadAppsForSub(entry, body.subscription);
    }),
    "/refresh-agents": async () => withBusy(entry, "Refreshing SRE Agents...", () => loadAgentsForSub(entry)),
    "/select-agent": async () => withBusy(entry, "Connecting to agent...", async () => {
      const row = entry.agents.find((a) => a.name === body.name);
      if (!row) throw new Error(`Agent not found: ${body.name}`);
      await selectAgent(entry, row);
    }),
    "/create-thread": async () => withBusy(entry, "Starting thread...", async () => {
      const result2 = await createThread(entry.agent, entry.subscription, body.message, entry);
      entry.activeThread = result2;
      entry.threads = upsertThread(entry.threads, result2);
      return result2;
    }),
    "/open-thread": async () => withBusy(entry, "Loading thread...", async () => {
      const thread = await getThread(entry.agent, entry.subscription, body.threadId, entry);
      const activeId = threadId(entry.activeThread);
      if (!body.poll || !activeId || activeId === body.threadId) entry.activeThread = thread;
      entry.threads = upsertThread(entry.threads, thread);
      return thread;
    }),
    "/focus-thread": async () => withBusy(entry, "Focusing thread...", async () => {
      const thread = await getThread(entry.agent, entry.subscription, body.threadId, entry, { strict: true });
      entry.activeThread = thread;
      entry.threads = upsertThread(entry.threads, thread);
      entry.focusedThreadId = threadId(thread);
      entry.focusedThreadTitle = thread.title || entry.focusedThreadId;
      entry.status = `Focused on "${entry.focusedThreadTitle}". Host-chat follow-ups now default to this thread.`;
      return thread;
    }),
    "/unfocus-thread": async () => {
      entry.focusedThreadId = "";
      entry.focusedThreadTitle = "";
      entry.status = "Focus mode off.";
      broadcast(entry, "state", snapshot(entry));
    },
    "/send-message": async () => withBusy(entry, "Sending message...", async () => {
      const result2 = await sendMessage(entry.agent, entry.subscription, body.threadId, body.message, entry);
      entry.activeThread = await getThread(entry.agent, entry.subscription, body.threadId, entry).catch(() => result2);
      entry.threads = upsertThread(entry.threads, entry.activeThread);
      return result2;
    }),
    "/investigate": async () => withBusy(entry, "Investigating...", async () => {
      const result2 = await investigate(entry.agent, entry.subscription, body.message, {
        yolo: Boolean(body.yolo),
        maxIterations: body.maxIterations,
        timeoutSeconds: body.timeoutSeconds
      }, entry);
      entry.activeThread = result2;
      entry.threads = await listThreads(entry.agent, entry.subscription, entry).catch(() => entry.threads);
      return result2;
    }),
    "/grant-execution": async () => withBusy(entry, "Granting permissions and re-running command...", async () => {
      const result2 = await authorizeExecutionSafely({
        listAttention: () => listNeedsAttention(entry.agent, entry.subscription, entry),
        readThread: (threadId2) => getThread(entry.agent, entry.subscription, threadId2, entry),
        run: () => runExecutionAction(entry.agent, entry.subscription, body.kind, body.threadId, body.executionId, "run", entry),
        threadId: body.threadId,
        executionId: body.executionId,
        executionType: body.kind,
        expectedCommand: body.expectedCommand
      });
      entry.activeThread = await getThread(entry.agent, entry.subscription, body.threadId, entry).catch(() => entry.activeThread);
      return result2;
    }),
    "/cancel-execution": async () => withBusy(entry, "Cancelling command...", async () => {
      const result2 = await authorizeExecutionSafely({
        listAttention: () => listNeedsAttention(entry.agent, entry.subscription, entry),
        readThread: (threadId2) => getThread(entry.agent, entry.subscription, threadId2, entry),
        run: () => runExecutionAction(entry.agent, entry.subscription, body.kind, body.threadId, body.executionId, "cancel", entry),
        threadId: body.threadId,
        executionId: body.executionId,
        executionType: body.kind,
        expectedCommand: body.expectedCommand
      });
      entry.activeThread = await getThread(entry.agent, entry.subscription, body.threadId, entry).catch(() => entry.activeThread);
      return result2;
    }),
    "/grant-durable-role": async () => withBusy(entry, "Creating durable role assignment for the agent's identity...", async () => {
      const thread = entry.activeThread && entry.activeThread.id === body.threadId ? entry.activeThread : await getThread(entry.agent, entry.subscription, body.threadId, entry);
      const exec = findExecutionInThread2(thread, body.kind, body.executionId);
      if (!exec) throw new Error("Could not find that command in the thread - try reopening it.");
      const resourceId = exec.resourceId || await resolveResourceIdFromCommand(exec.command, entry.subscription, entry);
      if (!resourceId) throw new Error("Could not determine which resource to scope the role assignment to from this command.");
      const role = body.role || guessRoleForExecution(exec);
      const result2 = await grantDurableRoleAssignment(
        entry.agent,
        entry.subscription,
        { resourceId, role, principalId: entry.agent.executionPrincipalId },
        entry
      );
      const resourceLabel = resourceId.split("/").pop();
      entry.status = result2?.alreadyExists ? `${entry.agent.name}'s identity already has ${role} on ${resourceLabel}. Retrying the pending command...` : `Granted ${role} to ${entry.agent.name}'s identity on ${resourceLabel}. Retrying the pending command...`;
      let retry = null;
      try {
        retry = await runExecutionAction(entry.agent, entry.subscription, body.kind, body.threadId, body.executionId, "run", entry);
        entry.status = `Granted ${role} to ${entry.agent.name}'s identity on ${resourceLabel} and resumed the pending command.`;
      } catch (err) {
        entry.status = `Granted ${role} to ${entry.agent.name}'s identity on ${resourceLabel}, but retrying the pending command failed: ${err?.message || err}. Try "Grant permissions (this run)" to retry manually.`;
      }
      entry.activeThread = await getThread(entry.agent, entry.subscription, body.threadId, entry).catch(() => entry.activeThread);
      return { ...result2, role, resourceId, retried: !!retry };
    }),
    "/create-incident": async () => withBusy(entry, "Creating incident...", async () => {
      const result2 = await createIncident(entry.agent, entry.subscription, body, entry);
      entry.incidents = await listActiveIncidents(entry.agent, entry.subscription, entry).catch(() => entry.incidents);
      return result2;
    }),
    "/diagnose-app": async () => withBusy(entry, "Resolving app resource...", async () => diagnoseApp(entry, body)),
    "/check-config-drift": async () => withBusy(entry, "Scanning workspace and comparing to Azure app settings...", async () => {
      const targetSubscription = body.appSubscription || entry.appSubscription || entry.subscription;
      const resource = await resolveAppResource(targetSubscription, body.resourceIdOrName, entry);
      if (!resource) throw new Error(`Could not resolve an app resource matching "${body.resourceIdOrName}".`);
      entry.configDrift = await checkWorkspaceConfigDrift(resource, targetSubscription, entry);
      return { resource, configDrift: entry.configDrift };
    }),
    "/correlate-ticket": async () => withBusy(entry, "Correlating ticket...", async () => correlateTicket(entry, body)),
    "/list-scheduled-tasks": async () => withBusy(entry, "Loading scheduled tasks...", async () => {
      entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry);
    }),
    "/create-scheduled-task": async () => withBusy(entry, "Creating scheduled task...", async () => {
      const result2 = await createScheduledTask(entry.agent, entry.subscription, body, entry);
      entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry).catch(() => entry.scheduledTasks);
      return result2;
    }),
    "/pause-scheduled-task": async () => withBusy(entry, "Pausing scheduled task...", async () => {
      await pauseScheduledTask(entry.agent, entry.subscription, body.taskId, entry);
      entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry).catch(() => entry.scheduledTasks);
    }),
    "/resume-scheduled-task": async () => withBusy(entry, "Resuming scheduled task...", async () => {
      await resumeScheduledTask(entry.agent, entry.subscription, body.taskId, entry);
      entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry).catch(() => entry.scheduledTasks);
    }),
    "/search-memories": async () => withBusy(entry, "Searching memories...", async () => {
      entry.memoryResults = await searchMemories(entry.agent, entry.subscription, body.query, entry);
    }),
    "/add-memory": async () => withBusy(entry, "Adding memory...", async () => addMemory(entry.agent, entry.subscription, body, entry)),
    "/discover-kusto-resources": async () => withBusy(entry, "Discovering Azure Data Explorer clusters...", async () => {
      entry.connectorSubscription = body.subscription || "";
      [entry.kustoResources, entry.connectorGateways] = await Promise.all([
        listKustoResources(entry.connectorSubscription || void 0, entry),
        listConnectorGateways(entry.connectorSubscription || entry.subscription, entry)
      ]);
      entry.connectorNamespaceMcps = await listConnectorNamespaceMcps(
        entry.connectorGateways,
        entry.connectorSubscription || entry.subscription,
        entry.connectors,
        entry
      );
      entry.status = entry.kustoResources.length ? `Found ${entry.kustoResources.length} Data Explorer cluster(s) and ${entry.connectorGateways.length} Connector Namespace(s).` : "No Data Explorer clusters found through Azure Resource Graph for that scope. Try All accessible subscriptions or enter cluster URL and database manually.";
      return entry.kustoResources;
    }),
    "/create-delegated-kusto-mcp": async () => withBusy(entry, "Creating delegated Kusto MCP...", async () => {
      if (!entry.agent) throw new Error("Select an SRE Agent first.");
      return createDelegatedKustoMcp(entry.agent, body, entry.subscription, entry);
    }),
    "/confirm-delegated-kusto-consent": async () => withBusy(entry, "Completing Kusto sign-in and creating MCP...", async () => {
      if (!entry.agent) throw new Error("Select an SRE Agent first.");
      return confirmDelegatedKustoConsent(entry.agent, body.code, entry.subscription, entry);
    }),
    "/attach-connector-namespace-mcp": async () => withBusy(entry, `Attaching Connector Namespace MCP ${body.name || ""}...`, async () => {
      if (!entry.agent) throw new Error("Select an SRE Agent first.");
      const mcp = (entry.connectorNamespaceMcps || []).find((item) => item.name === body.name);
      if (!mcp?.endpoint) throw new Error(`Connector Namespace MCP "${body.name || ""}" is unavailable or has no endpoint. Discover Data Explorer resources again.`);
      const identity = await currentIdentity(entry);
      if (!connectorNameOwnedBy(mcp.name, identity.objectId)) {
        throw new Error("Only Connector Namespace MCPs created for the signed-in owner can be attached.");
      }
      await requireConnectionUserAccess(mcp.connectionPath, identity, entry.subscription, entry);
      await grantMcpPrincipalAccess(mcp.mcpPath, entry.agent.executionPrincipalId, entry.agent.tenantId, entry.subscription, entry);
      const tokenScope = await discoverMcpTokenScope(mcp.endpoint);
      const result2 = await registerGenericMcp(entry.agent, mcp.name, mcp.endpoint, tokenScope, entry.subscription, entry);
      mcp.attached = true;
      mcp.attachmentStatus = "Attached to this SRE Agent.";
      entry.connectors = await listConnectors(entry.agent, entry.subscription, entry);
      entry.status = `Attached Connector Namespace MCP ${mcp.name}.`;
      return result2;
    }),
    "/detach-connector": async () => withBusy(entry, `Detaching connector ${body.name || ""}...`, async () => {
      if (!entry.agent) throw new Error("Select an SRE Agent first.");
      const connector = (entry.connectors || []).find((c) => c.name === body.name);
      if (!connector) throw new Error(`Connector not found: ${body.name}`);
      const result2 = await deleteConnector(entry.agent, connector.name, entry.subscription, entry);
      entry.connectors = await listConnectors(entry.agent, entry.subscription, entry).catch(() => entry.connectors.filter((c) => c.name !== connector.name));
      if (entry.connectorAccessInfo) delete entry.connectorAccessInfo[connector.name];
      const namespaceMcp = (entry.connectorNamespaceMcps || []).find((item) => item.name === connector.name);
      if (namespaceMcp) {
        namespaceMcp.attached = false;
        namespaceMcp.attachmentStatus = "Available to attach to this SRE Agent.";
      }
      entry.status = `Detached connector ${connector.name}.`;
      return result2;
    }),
    "/generate-workflow": async () => withBusy(entry, "Generating workflow...", async () => generateWorkflow(entry.agent, entry.subscription, body, entry))
  };
  const handler = routes[url.pathname];
  if (!handler) {
    res.writeHead(404).end();
    return;
  }
  const result = await handler();
  responseJson(res, { ok: true, result });
}
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => data += chunk);
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
async function ensureAgentSelected(entry) {
  if (entry.agent) return;
  const sticky = loadStickyState();
  if (!sticky.agentName) throw new Error("Select an SRE Agent first.");
  if (sticky.subscription && sticky.subscription !== entry.subscription) {
    entry.subscription = sticky.subscription;
    await loadAgentsForSub(entry);
  } else if (!entry.agents.length) {
    await loadAgentsForSub(entry);
  }
  const row = entry.agents.find((a) => a.name === sticky.agentName);
  if (!row) throw new Error("Select an SRE Agent first.");
  await selectAgent(entry, row);
}
async function diagnoseApp(entry, { resourceIdOrName, note, appSubscription }) {
  await ensureAgentSelected(entry);
  const targetSubscription = appSubscription || entry.appSubscription || entry.subscription;
  const resource = await resolveAppResource(targetSubscription, resourceIdOrName, entry);
  if (!resource) throw new Error(`Could not resolve an app resource matching "${resourceIdOrName}".`);
  const health = await resourceHealthSummary(resource.id, targetSubscription, entry);
  const drift = await checkWorkspaceConfigDrift(resource, targetSubscription, entry).catch((err) => ({ error: shortError(err) }));
  entry.configDrift = drift;
  const driftLines = [];
  if (!drift.error && drift.missingInAzure?.length) {
    const names = drift.missingInAzure.map((s) => s.settingName).join(", ");
    driftLines.push(
      `Local workspace analysis found ${drift.missingInAzure.length} app setting(s) referenced in source code that are NOT configured on this Azure resource: ${names}. This may be the root cause if related errors mention missing configuration.`
    );
  }
  const message = [
    `Investigate a failing app: ${resource.name} (${resource.type}).`,
    `Resource ID: ${resource.id}`,
    `Location: ${resource.location}`,
    `Resource Health: ${health.availabilityState}${health.summary ? ` - ${health.summary}` : ""}`,
    ...driftLines,
    note ? `Additional context from the user: ${note}` : "",
    "Please check recent deployments, restarts, and errors, and propose a root cause and remediation."
  ].filter(Boolean).join("\n");
  const result = await investigate(entry.agent, entry.subscription, message, { yolo: false }, entry);
  entry.activeThread = result;
  entry.threads = await listThreads(entry.agent, entry.subscription, entry).catch(() => entry.threads);
  entry.status = `Diagnosis started for ${resource.name}: thread "${result?.title || result?.id || "new investigation"}" opened below.`;
  return { resource, health, configDrift: drift, investigation: result };
}
async function correlateTicket(entry, { ticket, threadId: threadId2 }) {
  if (!entry.agent) throw new Error("Select an SRE Agent first.");
  if (!ticket) throw new Error("Provide an ICM or S360 ticket id, url, or description.");
  const memoryHits = await searchMemories(entry.agent, entry.subscription, ticket, entry);
  const message = [
    `Correlate this ticket with current and past incidents: ${ticket}`,
    memoryHits.length ? `Related knowledge base hits found: ${memoryHits.length}.` : "No related knowledge base hits found yet - search incident history directly.",
    "Report whether this matches an active incident, a known root cause, or a new issue, and recommend next steps."
  ].join("\n");
  const result = threadId2 ? await sendMessage(entry.agent, entry.subscription, threadId2, message, entry) : await investigate(entry.agent, entry.subscription, message, { yolo: false }, entry);
  entry.activeThread = threadId2 ? await getThread(entry.agent, entry.subscription, threadId2, entry).catch(() => result) : result;
  entry.threads = await listThreads(entry.agent, entry.subscription, entry).catch(() => entry.threads);
  entry.memoryResults = memoryHits;
  return { memoryHits, response: result };
}
var canvas = createCanvas({
  id: "azure-sre-agent",
  displayName: "Azure SRE Agent",
  description: "Discover Azure SRE Agents, investigate failing apps, correlate ICM/S360 tickets, and manage incidents, scheduled tasks, connectors, memories, and workflows on your SRE Agents. When a thread is focused, route operational follow-ups through ask_agent and use unfocus_thread to leave focus mode.",
  actions: [
    {
      name: "list_agents",
      description: "List Azure SRE Agent resources in the selected (or default) subscription.",
      inputSchema: { type: "object", properties: { subscription: { type: "string" } } },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        const changed = Boolean(input?.subscription && input.subscription !== entry.subscription);
        if (input?.subscription) entry.subscription = input.subscription;
        if (!entry.subscription) await initSubscriptions(entry);
        await loadAgentsForSub(entry, { resetAgent: changed });
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, agents: entry.agents, subscription: entry.subscription };
      }
    },
    {
      name: "select_agent",
      description: "Connect the canvas to a specific SRE Agent by name, loading its connectors, threads, and active incidents.",
      inputSchema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        const row = entry.agents.find((a) => a.name === input?.name);
        if (!row) return { ok: false, message: `Agent not found: ${input?.name}. Call list_agents first.` };
        await selectAgent(entry, row);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, agent: entry.agent };
      }
    },
    {
      ...GET_THREAD_CONTRACT,
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        if (!input?.threadId) return { ok: false, message: "get_thread needs a threadId." };
        const thread = await getThread(entry.agent, entry.subscription, input.threadId, entry, { strict: true });
        entry.activeThread = thread;
        entry.threads = upsertThread(entry.threads, thread);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, thread: projectThreadDetail(thread) };
      }
    },
    {
      ...FOCUS_THREAD_CONTRACT,
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        if (!input?.threadId) return { ok: false, message: "focus_thread needs a threadId." };
        const thread = await getThread(entry.agent, entry.subscription, input.threadId, entry, { strict: true });
        const focusedId = threadId(thread);
        const title = thread.title || focusedId;
        entry.activeThread = thread;
        entry.threads = upsertThread(entry.threads, thread);
        entry.focusedThreadId = focusedId;
        entry.focusedThreadTitle = title;
        entry.status = `Focused on "${title}".`;
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, focused: true, threadId: focusedId, title, thread: projectThreadDetail(thread), contract: FOCUS_CONTRACT };
      }
    },
    {
      ...UNFOCUS_THREAD_CONTRACT,
      async handler({ instanceId }) {
        const entry = ensureEntry(instanceId);
        const previous = entry.focusedThreadTitle || entry.focusedThreadId || null;
        entry.focusedThreadId = "";
        entry.focusedThreadTitle = "";
        entry.status = previous ? `Unfocused from "${previous}".` : "Not focused.";
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, focused: false, previous };
      }
    },
    {
      ...ASK_AGENT_CONTRACT,
      mutates: true,
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        const threadId2 = input?.threadId || entry.focusedThreadId;
        const message = typeof input?.message === "string" ? input.message.trim() : "";
        if (!threadId2) return { ok: false, message: "ask_agent needs a threadId, or focus_thread must be active." };
        if (!message) return { ok: false, message: "ask_agent needs a message to send." };
        const waitSeconds = Math.min(Math.max(Number.isFinite(input.waitSeconds) ? input.waitSeconds : 20, 0), 120);
        const before = await getThread(entry.agent, entry.subscription, threadId2, entry, { strict: true });
        const seen = new Set((before.messages || []).map((item) => item?.id).filter(Boolean));
        await sendMessage(entry.agent, entry.subscription, threadId2, message, entry);
        const { thread, replies, textualReplies, completed, waitedSeconds } = await waitForNewAgentReplies({
          getThread: () => getThread(entry.agent, entry.subscription, threadId2, entry, { strict: true }),
          seen,
          waitSeconds
        });
        entry.activeThread = thread;
        entry.threads = upsertThread(entry.threads, thread);
        entry.status = completed ? `Agent replied in thread ${threadId2}.` : `Question sent to thread ${threadId2}; ${textualReplies.length ? "reply is still incomplete" : "no reply yet"}.`;
        broadcast(entry, "state", snapshot(entry));
        return {
          ok: true,
          sent: true,
          replied: textualReplies.length > 0,
          completed,
          waitedSeconds,
          newMessages: replies.map((item) => projectMessage(item)).filter(Boolean),
          thread: projectThreadDetail(thread),
          hint: completed ? void 0 : textualReplies.length ? `The message was delivered and the agent began replying, but its newest message was still incomplete after ${waitedSeconds}s. Call get_thread with threadId "${threadId2}" to retrieve the completed reply.` : `The message was delivered; the agent had not answered after ${waitedSeconds}s. Call get_thread with threadId "${threadId2}" again in a minute, or call ask_agent with a larger waitSeconds (max 120).`
        };
      }
    },
    {
      name: "diagnose_app",
      mutates: true,
      description: "Diagnose a failing Azure App Service, Function App, or Container App: resolves the resource, pulls a Resource Health snapshot, and opens an SRE Agent investigation thread pre-seeded with that context.",
      inputSchema: {
        type: "object",
        properties: {
          resourceIdOrName: { type: "string", description: "Full resource ID or app name to diagnose." },
          note: { type: "string", description: "Optional extra context (symptoms, error messages, recent changes)." }
        },
        required: ["resourceIdOrName"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        const result = await diagnoseApp(entry, input || {});
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, ...result };
      }
    },
    {
      name: "correlate_ticket",
      mutates: true,
      description: "Correlate an ICM or S360 ticket (id, url, or free text) against the connected SRE Agent's memory and incident history, optionally continuing an existing investigation thread.",
      inputSchema: {
        type: "object",
        properties: {
          ticket: { type: "string", description: "ICM/S360 ticket id, url, or description." },
          threadId: { type: "string", description: "Optional existing thread id to continue instead of starting a new one." }
        },
        required: ["ticket"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        const result = await correlateTicket(entry, input || {});
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, ...result };
      }
    },
    {
      name: "investigate",
      mutates: true,
      description: "Send an investigation message to the connected SRE Agent and follow up automatically until it concludes.",
      inputSchema: {
        type: "object",
        properties: {
          message: { type: "string" },
          yolo: { type: "boolean", description: "Auto-approve all pending approval requests." },
          maxIterations: { type: "number" },
          timeoutSeconds: { type: "number" }
        },
        required: ["message"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        const result = await investigate(entry.agent, entry.subscription, input.message, {
          yolo: Boolean(input?.yolo),
          maxIterations: input?.maxIterations,
          timeoutSeconds: input?.timeoutSeconds
        }, entry);
        entry.activeThread = result;
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, result };
      }
    },
    {
      name: "list_incidents",
      description: "List active incidents tracked on the connected SRE Agent.",
      inputSchema: { type: "object", properties: {} },
      async handler({ instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        entry.incidents = await listActiveIncidents(entry.agent, entry.subscription, entry);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, incidents: entry.incidents };
      }
    },
    {
      ...LIST_NEEDS_ATTENTION_CONTRACT,
      async handler({ instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        entry.needsAttention = await listNeedsAttention(entry.agent, entry.subscription, entry);
        broadcast(entry, "state", snapshot(entry));
        return {
          ok: true,
          needsAttention: entry.needsAttention,
          threadCount: entry.needsAttention.length
        };
      }
    },
    {
      ...LIST_EXECUTION_GATES_CONTRACT,
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        entry.needsAttention = await listNeedsAttention(entry.agent, entry.subscription, entry);
        entry.executionGates = await listExecutionGates({
          listNeedsAttention: async () => entry.needsAttention,
          getThread: async (threadId2) => ({
            id: threadId2,
            messages: await getThreadMessages(entry.agent, entry.subscription, threadId2, entry)
          }),
          previousObservedKeys: entry.executionGates?.observedGateKeys || [],
          limit: input?.limit
        });
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, ...entry.executionGates };
      }
    },
    {
      name: "create_incident",
      mutates: true,
      description: "Create an incident investigation thread on the connected SRE Agent.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
          services: { type: "array", items: { type: "string" } }
        },
        required: ["title"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        const result = await createIncident(entry.agent, entry.subscription, input || {}, entry);
        entry.incidents = await listActiveIncidents(entry.agent, entry.subscription, entry).catch(() => entry.incidents);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, result };
      }
    },
    {
      name: "list_scheduled_tasks",
      description: "List scheduled tasks configured on the connected SRE Agent.",
      inputSchema: { type: "object", properties: {} },
      async handler({ instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, scheduledTasks: entry.scheduledTasks };
      }
    },
    {
      name: "create_scheduled_task",
      mutates: true,
      description: "Create a recurring scheduled task on the connected SRE Agent (cron expression + message).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
          cronExpression: { type: "string" },
          message: { type: "string" },
          description: { type: "string" }
        },
        required: ["name", "cronExpression", "message"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        const result = await createScheduledTask(entry.agent, entry.subscription, input, entry);
        entry.scheduledTasks = await listScheduledTasks(entry.agent, entry.subscription, entry).catch(() => entry.scheduledTasks);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, result };
      }
    },
    {
      name: "search_memories",
      description: "Semantically search the connected SRE Agent's knowledge base / memories.",
      inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        entry.memoryResults = await searchMemories(entry.agent, entry.subscription, input.query, entry);
        broadcast(entry, "state", snapshot(entry));
        return { ok: true, results: entry.memoryResults };
      }
    },
    {
      name: "generate_workflow",
      mutates: true,
      description: "Generate a validated YAML workflow (ExtendedAgent, KustoTool, or LinkTool) for the connected SRE Agent.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["agent", "tool"] },
          name: { type: "string" },
          description: { type: "string" },
          modelOrType: { type: "string" },
          tools: { type: "array", items: { type: "string" } },
          handoffs: { type: "array", items: { type: "string" } },
          connector: { type: "string" }
        },
        required: ["kind", "name"]
      },
      async handler({ input, instanceId }) {
        const entry = ensureEntry(instanceId);
        if (!entry.agent) return { ok: false, message: "Select an SRE Agent first." };
        const result = await generateWorkflow(entry.agent, entry.subscription, input, entry);
        return { ok: true, result };
      }
    }
  ].filter((action) => WRITES_ENABLED || !action.mutates).map((action) => ({
    ...action,
    async handler(args) {
      const result = await action.handler(args);
      return appendFocusContract(ensureEntry(args.instanceId), result);
    }
  })),
  async open({ instanceId }) {
    const entry = ensureEntry(instanceId);
    if (!entry.server) {
      await initSubscriptions(entry).catch((err) => {
        entry.status = azureDiscoveryFailure(err);
        entry.error = shortError(err);
      });
      if (entry.subscription) await loadAgentsForSub(entry).catch((err) => {
        entry.error = shortError(err);
      });
      await startServer(entry);
    }
    return { url: entry.url, title: "Azure SRE Agent", status: "ready" };
  },
  async onClose({ instanceId }) {
    const entry = instances.get(instanceId);
    if (!entry) return;
    for (const res of entry.clients) {
      try {
        res.end();
      } catch {
      }
    }
    entry.clients = /* @__PURE__ */ new Set();
    if (entry.server) {
      const server = entry.server;
      entry.server = null;
      entry.url = "";
      await new Promise((resolve) => server.close(() => resolve()));
    }
  }
});
if (process.env.AZURE_SRE_AGENT_TEST_NO_JOIN !== "true" && process.env.SRE_AGENT_STUDIO_TEST_NO_JOIN !== "true") {
  session = await joinSession({ canvases: [canvas] });
}
function renderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Azure SRE Agent</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffffff; --panel: #f7f6fb; --line: #e6e3f0; --ink: #1b1a24; --muted: #6a6775;
    --accent: #6b3fd6; --accent2: #7b52e0; --ok: #0f9d6e; --warn: #b45309; --err: #dc2626;
  }
  body {
    background: radial-gradient(1200px 600px at 10% -10%, rgba(107,63,214,.06), transparent), var(--bg);
    color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; padding: 1.5rem;
  }
  h1 { font-size: 1.1rem; display: flex; align-items: center; gap: .5rem; }
  h1 .doc { font-size: .72rem; color: var(--muted); font-weight: 400; text-decoration: none; margin-left: auto; }
  .sub { color: var(--muted); font-size: .82rem; margin: .3rem 0 1rem; }
  .hint { color: var(--muted); font-size: .78rem; margin: 0 0 .5rem; line-height: 1.35; }
  .field-label { display: block; color: var(--muted); font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin: .1rem 0 .25rem; }
  .panel, .thread-master { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
  .panel h2, .thread-master h2 { font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); margin-bottom: .6rem; }
  select, input, textarea, button { font: inherit; }
  select, input, textarea {
    width: 100%; background: #ffffff; color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
    padding: .5rem .6rem; font-size: .84rem; margin-bottom: .5rem;
  }
  textarea { min-height: 70px; resize: vertical; }
  button.btn {
    border: none; cursor: pointer; border-radius: 10px; padding: .5rem .9rem; font-size: .82rem; font-weight: 600;
    color: #ffffff; background: linear-gradient(135deg, var(--accent), var(--accent2)); margin-bottom: .5rem;
  }
  button.btn.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
  button.btn.danger { background: transparent; color: var(--err); border: 1px solid #f1b9b9; }
  button.btn.mini { padding: .3rem .6rem; font-size: .74rem; margin-bottom: 0; }
  button.btn:disabled { opacity: .5; cursor: default; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin-bottom: .6rem; }
  .panel-head h2 { margin-bottom: 0; }
  .head-actions { display: flex; align-items: center; gap: .4rem; }
  .row-actions { display: flex; gap: .5rem; }
  .row-actions .btn { flex: 1; }
  .connection-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .35rem .75rem; margin-top: .5rem; }
  .connection-item { min-width: 0; color: var(--muted); font-size: .72rem; }
  .connection-item strong { display: block; color: var(--ink); font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .agent-picker { position: relative; margin-bottom: .5rem; }
  .agent-picker-trigger {
    position: relative; width: 100%; background: #fff; color: var(--ink);
    border: 1px solid var(--line); border-radius: 8px; padding: .5rem 1.5rem .5rem .6rem;
    font-size: .84rem; cursor: pointer; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .agent-picker-trigger::after {
    content: ""; position: absolute; top: 50%; right: .5rem; width: 0; height: 0;
    border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--ink);
    transform: translateY(-25%);
  }
  .agent-picker-trigger:disabled { color: var(--muted); cursor: default; }
  .agent-picker-trigger:focus-visible, .agent-option:focus-visible { outline: 2px solid var(--color-focus-outline, var(--accent)); outline-offset: 2px; }
  .agent-options {
    position: absolute; z-index: 20; top: calc(100% + 2px); left: 0; right: 0; padding: .15rem;
    background: #fff; border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 6px 16px rgba(27,26,36,.14);
    max-height: 240px; overflow-y: auto;
  }
  .agent-option { width: 100%; border: 0; border-radius: 6px; padding: .35rem .45rem; background: #fff; color: var(--ink); cursor: pointer; text-align: left; font-size: .84rem; }
  .agent-option:hover, .agent-option:focus { background: rgba(107,63,214,.08); outline: none; }
  .agent-option[aria-selected="true"] { font-weight: 600; color: var(--accent); }
  .provider-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: .75rem; }
  .provider-card { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: .75rem; }
  .provider-card h3 { font-size: .86rem; margin-bottom: .35rem; }
  .provider-card.disabled { opacity: .72; }
  .row-list { display: flex; flex-direction: column; gap: .35rem; max-height: 220px; overflow-y: auto; }
  .row-item {
    border: 1px solid var(--line); border-radius: 8px; padding: .5rem .6rem; font-size: .8rem; cursor: pointer;
    display: flex; justify-content: space-between; gap: .5rem; background: #fff;
  }
  .row-main { min-width: 0; display: flex; align-items: center; gap: .45rem; overflow: hidden; }
  .row-main span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-item:hover { border-color: var(--accent2); }
  .row-item.active { border-color: var(--accent); background: rgba(107,63,214,.08); }
  .tag { font-size: .68rem; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; }
  .focus-badge { font: inherit; font-size: .68rem; color: #fff; background: var(--accent); border: 0; border-radius: 999px; padding: 2px 8px; cursor: pointer; }
  .status { font-size: .78rem; color: var(--muted); min-height: 1.2em; }
  .status.err { color: var(--err); }
  .thread-log { background: #fbfaff; border: 1px solid var(--line); border-radius: 8px; padding: .7rem; max-height: 320px; overflow-y: auto; font-size: .8rem; white-space: pre-wrap; }
  .tabs { display: flex; gap: .4rem; margin-bottom: .8rem; flex-wrap: wrap; }
  .tab { font-size: .78rem; padding: .35rem .7rem; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); cursor: pointer; display: inline-flex; align-items: center; gap: .3rem; }
  .tab.active { color: var(--ink); border-color: var(--accent); background: rgba(107,63,214,.08); }
  .tabpage { display: none; }
  .tabpage.active { display: block; }
  code { background: #f0eef8; border-radius: 4px; padding: 1px 5px; font-size: .78rem; }
  ${COMMAND_CSS}
  details.cmdlog { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: .8rem 1rem; margin-bottom: 1rem; }
  details.cmdlog summary { cursor: pointer; font-size: .82rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
  .cmd-list { display: flex; flex-direction: column; gap: .4rem; max-height: 260px; overflow-y: auto; margin-top: .6rem; }
  .cmd-row { border: 1px solid var(--line); border-radius: 8px; padding: .5rem .6rem; background: #fff; font-size: .76rem; }
  .cmd-row .cmd-head { display: flex; align-items: center; gap: .5rem; margin-bottom: .3rem; }
  .cmd-kind { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; padding: 1px 6px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
  .cmd-kind.az { color: #0969da; border-color: #b6d4f5; background: #eef6ff; }
  .cmd-kind.rest { color: var(--accent); border-color: #ddd0f7; background: #f4f0fd; }
  .cmd-status { font-size: .68rem; font-weight: 600; padding: 1px 7px; border-radius: 999px; }
  .cmd-status.run { color: var(--warn); background: #fdf0d8; animation: cmdpulse 1.1s ease-in-out infinite; }
  .cmd-status.ok { color: var(--ok); background: #e4f7ef; }
  .cmd-status.err { color: var(--err); background: #fde6e6; }
  .cmd-time { color: var(--muted); font-size: .68rem; margin-left: auto; }
  .cmd-ms { color: var(--muted); font-size: .68rem; }
  .cmd-text { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; color: var(--ink); word-break: break-all; }
  .cmd-note { color: var(--muted); margin-top: .2rem; }
  @keyframes cmdpulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
  @keyframes typingBounce { 0%, 80%, 100% { transform: translateY(0); opacity: .4; } 40% { transform: translateY(-4px); opacity: 1; } }
  .typing-dots { display: inline-flex; align-items: center; gap: .22rem; padding: .1rem 0; }
  .typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: typingBounce 1.2s infinite ease-in-out; }
  .typing-dots span:nth-child(2) { animation-delay: .15s; }
  .typing-dots span:nth-child(3) { animation-delay: .3s; }
  /* Chat transcript, styled after the SRE Agent portal's own thread view. */
  .chat-log { background: #fbfaff; border: 1px solid var(--line); border-radius: 8px; padding: .8rem; max-height: 460px; overflow-y: auto; display: flex; flex-direction: column; gap: .6rem; }
  .threads-layout { display: grid; grid-template-columns: minmax(220px, .8fr) minmax(0, 1.7fr); gap: 1rem; align-items: start; }
  .thread-master { min-width: 0; }
  .thread-master .row-list { max-height: min(58vh, 520px); }
  .thread-detail { min-width: 0; outline: none; }
  .thread-detail:focus-visible { outline: 2px solid var(--color-focus-outline, var(--accent)); outline-offset: 4px; border-radius: 8px; }
  .thread-detail h3 { font-size: .86rem; margin-bottom: .5rem; }
  .transcript-notice { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding: .45rem .6rem; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--muted); font-size: .75rem; }
  @media (max-width: 760px) {
    body { padding: 1rem; }
    .threads-layout { grid-template-columns: 1fr; }
    .thread-master .row-list { max-height: 240px; }
  }
  .chat-msg { display: flex; flex-direction: column; gap: .3rem; }
  .chat-msg .who { font-size: .72rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .03em; }
  .chat-bubble { border-radius: 10px; padding: .55rem .7rem; font-size: .84rem; line-height: 1.4; }
  .chat-msg.user .chat-bubble { background: #eef0ff; align-self: flex-end; max-width: 85%; }
  .chat-msg.agent .chat-bubble { background: #ffffff; border: 1px solid var(--line); max-width: 92%; }
  .chat-msg.user { align-items: flex-end; }
  /* Markdown rendering inside chat bubbles (SRE Agent replies often contain GFM tables). */
  .chat-bubble p { margin: 0 0 .5rem; white-space: pre-wrap; }
  .chat-bubble p:last-child { margin-bottom: 0; }
  .chat-bubble h1, .chat-bubble h2, .chat-bubble h3 { margin: .4rem 0 .35rem; line-height: 1.3; }
  .chat-bubble h1 { font-size: 1.05rem; }
  .chat-bubble h2 { font-size: .98rem; }
  .chat-bubble h3 { font-size: .9rem; }
  .chat-bubble ul { margin: 0 0 .5rem 1.1rem; padding: 0; }
  .chat-bubble li { margin: .1rem 0; }
  .chat-bubble code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; background: #f0eef8; border-radius: 4px; padding: 1px 5px; font-size: .82em; }
  .chat-bubble table { border-collapse: collapse; width: 100%; margin: .3rem 0 .6rem; font-size: .8rem; }
  .chat-bubble table th, .chat-bubble table td { border: 1px solid var(--line); padding: .3rem .5rem; text-align: left; vertical-align: top; }
  .chat-bubble table th { background: var(--panel); color: var(--muted); font-weight: 600; }
  .chat-bubble table tr:nth-child(even) td { background: #fbfaff; }
  .tool-card { border: 1px solid var(--line); border-radius: 10px; padding: .55rem .7rem; background: #ffffff; font-size: .78rem; }
  .tool-card .tool-head { display: flex; align-items: center; gap: .5rem; margin-bottom: .35rem; }
  .tool-card .tool-title { font-weight: 600; }
  .tool-badge { font-size: .64rem; font-weight: 700; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
  .tool-badge.safe { color: var(--ok); border-color: #bfe9d6; background: #e4f7ef; }
  .tool-badge.risk { color: var(--warn); border-color: #f2ddb0; background: #fdf0d8; }
  .tool-badge.done { color: var(--muted); }
  .tool-cmd { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; background: #f0eef8; border-radius: 6px; padding: .35rem .5rem; word-break: break-all; }
  .tool-output { margin-top: .35rem; color: var(--muted); white-space: pre-wrap; max-height: 160px; overflow-y: auto; }
  .spinner { display: inline-block; width: 10px; height: 10px; border: 2px solid var(--line); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .copy-cmd { font-size: .68rem; padding: 1px 6px; border-radius: 5px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
  .tool-auth-notice { margin-top: .45rem; padding: .5rem .6rem; background: #f5f5fa; border: 1px solid var(--line); border-radius: 8px; color: var(--muted); font-size: .76rem; }
  .tool-auth-actions { margin-top: .5rem; display: flex; gap: .5rem; }
  .tool-auth-actions .btn { padding: .35rem .9rem; font-size: .78rem; }
  .build-stamp { margin-top: 1rem; color: var(--muted); font: 10px/1.2 ui-monospace, "SFMono-Regular", Menlo, monospace; text-align: right; opacity: .7; }
</style>
</head>
<body>
  <h1>Azure SRE Agent <a class="doc" href="${DOC_URL}" target="_blank" rel="noreferrer">docs &#8599;</a></h1>
  <p class="sub">Discover Azure SRE Agents, investigate failing apps, correlate ICM/S360 tickets, and manage incidents, scheduled tasks, connectors, and memories.</p>
  <p class="hint"><strong>${WRITES_ENABLED ? "Write mode enabled." : "Read-only mode."}</strong> ${WRITES_ENABLED ? "Mutating operations require an explicit user action." : "Mutating actions are not registered and panel write requests are rejected unless ALLOW_WRITES=true."}</p>
  <div id="status" class="status"></div>

  <details class="cmdlog" id="azure-config-card" open style="margin-bottom:1rem">
    <summary>Azure Configuration</summary>
    <div class="panel" style="margin-top:8px">
      <h2 style="font-size:.85rem">Subscription &amp; agent</h2>
      <select id="sub-select" aria-label="Azure subscription"></select>
      <div class="agent-picker">
        <button type="button" id="agent-select" class="agent-picker-trigger" aria-haspopup="listbox" aria-expanded="false">No SRE Agents found</button>
        <div id="agent-options" class="agent-options" role="listbox" aria-label="SRE Agents" hidden></div>
      </div>
      <button class="btn ghost" id="refresh-agents">Refresh agents</button>
      <div id="agent-summary"></div>
      <div id="config-drift-result"></div>
    </div>
  </details>

  <div id="main-grid">
    <div class="tabs">
      <div class="tab active" data-tab="threads">Threads</div>
      <div class="tab" data-tab="apps">Apps</div>
      <div class="tab" data-tab="connectors">Connectors</div>
      <div class="tab" title="Coming soon">Operations Hub</div>
      <div class="tab" data-tab="incidents">Incidents</div>
      <div class="tab" title="Coming soon">Automation</div>
      <div class="tab" title="Coming soon">Live Reports</div>
      <div class="tab" title="Coming soon">Releases</div>
      <div class="tab" title="Coming soon">S360</div>
    </div>

    <div class="tabpage active" data-page="threads">
      <div class="threads-layout">
        <aside class="thread-master" aria-label="Thread navigation">
          <div class="panel-head">
            <h2>Threads</h2>
            <div class="head-actions">
              <button class="btn ghost mini" id="new-thread"${WRITES_ENABLED ? "" : " disabled"}>New Thread</button>
              <button class="btn ghost mini" id="search-threads">&#128269; Search Threads</button>
            </div>
          </div>
          <div id="thread-list" class="row-list" role="listbox" aria-label="Threads"></div>
        </aside>
        <section id="thread-detail" class="panel thread-detail" aria-label="Active thread" tabindex="-1">
          <div class="panel-head">
            <h2>Active thread</h2>
            <button type="button" id="focus-badge" class="focus-badge" title="Open the focused thread" hidden></button>
          </div>
          <div id="thread-log" class="chat-log" aria-live="polite">No thread selected.</div>
          <textarea id="reply-msg" aria-label="Thread message" placeholder="Ask the SRE Agent for a diagnosis or reply to the selected thread..."></textarea>
          <div class="row-actions">
            <button class="btn ghost" id="focus-thread" hidden>Focus this thread</button>
            <button class="btn ghost" id="send-reply"${WRITES_ENABLED ? "" : " disabled"}>Send</button>
            <button class="btn ghost" id="open-in-portal">Open in Portal &#8599;</button>
          </div>
        </section>
      </div>
    </div>

    <div class="tabpage" data-page="apps">
        <div class="panel">
          <h2>Quick diagnose a failing app</h2>
          <label class="field-label" for="app-sub-select">App subscription</label>
          <select id="app-sub-select"></select>
          <select id="app-resource-select"></select>
          <input id="app-resource" placeholder="Or enter a resource ID / name" />
          <textarea id="app-note" placeholder="Optional: symptoms, error messages, recent changes"></textarea>
          <button class="btn" id="diagnose-app"${WRITES_ENABLED ? "" : " disabled"}>Diagnose with SRE Agent</button>
          <button class="btn ghost" id="check-config-drift">Check workspace &lt;-&gt; Azure config</button>
        </div>
      </div>

      <div class="tabpage" data-page="connectors">
        <div class="panel">
          <h2>Connectors attached to this SRE Agent</h2>
          <div id="connector-list" class="row-list"></div>
        </div>
        <div class="panel">
          <h2>Connect Azure Data Explorer</h2>
          <p class="hint">Choose the Kusto cluster and database you can already access. Select <strong>Configure Kusto DB &amp; attach</strong>; general Connector Namespace v2 stores your delegated sign-in, wraps the Kusto query as an authenticated MCP, and registers that endpoint with SRE Agent as a normal remote MCP. If the subscription has no Connector Namespace, the canvas creates one in the SRE Agent resource group.</p>
          <label class="field-label" for="connector-sub-select">Discovery subscription</label>
          <select id="connector-sub-select"></select>
          <button class="btn ghost" id="discover-kusto">Discover Data Explorer resources</button>
          <label class="field-label" for="kusto-cluster-select">Kusto cluster</label>
          <select id="kusto-cluster-select"></select>
          <label class="field-label" for="kusto-database-select">Kusto database</label>
          <select id="kusto-database-select"></select>
          <input id="kusto-cluster-url" placeholder="Or enter cluster URL, e.g. https://help.kusto.windows.net" />
          <input id="kusto-database" placeholder="Or enter database name" />
          <button class="btn" id="create-delegated-kusto-mcp"${PRIVATE_CONNECTORS_ENABLED ? "" : " disabled"}>Configure Kusto DB &amp; attach</button>
          <p class="hint" style="margin-top:.6rem"><strong>Staging safety gate:</strong> delegated connector creation, attachment, consent completion, and detachment are disabled unless both <code>ALLOW_WRITES=true</code> and <code>ALLOW_PRIVATE_CONNECTORS=true</code>. The SRE runtime does not yet provide signed per-invocation user and thread ownership proof, so this surface is not generally available.</p>
        </div>
      </div>

      <div class="tabpage" data-page="incidents">
        <div class="panel">
          <h2>Create incident</h2>
          <input id="incident-title" placeholder="Title" />
          <select id="incident-severity">
            <option value="critical">Critical</option>
            <option value="high" selected>High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <textarea id="incident-desc" placeholder="Description (ICM/S360 reference, symptoms, etc.)"></textarea>
          <input id="incident-services" placeholder="Affected services (comma separated)" />
          <button class="btn" id="create-incident"${WRITES_ENABLED ? "" : " disabled"}>Create incident</button>
        </div>
        <div class="panel">
          <h2>Active incidents</h2>
          <div id="incident-list" class="row-list"></div>
        </div>
      </div>
  </div>

  <details class="cmdlog" id="cmdlog">
    <summary>Command activity (az CLI / REST calls)</summary>
    <div class="cmd-list" id="cmd-list"></div>
  </details>
  <div class="build-stamp">Azure SRE Agent v${STUDIO_VERSION} &middot; rev ${STUDIO_REVISION}</div>

<script>
(function () {
  ${THREAD_CLIENT_HELPERS}
  var state = { agents: [], threads: [], incidents: [], scheduledTasks: [], memoryResults: [], connectors: [], connectorGateways: [], connectorNamespaceMcps: [], kustoResources: [] };
  var draftThread = null;
  var lastTranscriptKey = '';
  var NEW_THREAD_TEMPLATE = 'Investigate a failing app or service:\\n\\nResource / service:\\nSymptoms:\\nWhen it started:\\nRecent changes or deployments:\\nWhat I already checked:';

  function postJson(url, payload) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok || (data && data.ok === false)) throw new Error(data && data.message || 'Request failed (' + r.status + ').');
          return data;
        });
      })
      .catch(function (err) {
        setStatus(err && err.message || String(err), true);
        throw err;
      });
  }
  function setStatus(text, isError) {
    var el = document.getElementById('status');
    el.textContent = text || '';
    el.className = 'status' + (isError ? ' err' : '');
  }

  document.querySelectorAll('.tab').forEach(function (tab) {
    if (!tab.dataset.tab) {
      tab.addEventListener('click', function () { setStatus((tab.textContent || '').trim() + ' - coming soon.'); });
      return;
    }
    tab.addEventListener('click', function () { activateTab(tab.dataset.tab); });
  });
  var searchThreads = document.getElementById('search-threads');
  if (searchThreads) {
    searchThreads.addEventListener('click', function () {
      activateTab('threads');
      setStatus('Thread search coming soon - showing all threads for now.');
    });
  }
  function activateTab(name) {
    document.querySelectorAll('.tab[data-tab]').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === name); });
    document.querySelectorAll('.tabpage').forEach(function (p) { p.classList.toggle('active', p.dataset.page === name); });
  }

  // Threads returned by GET /api/v1/threads sometimes carry title/startMessage/
  // lastMessage as nested message objects (e.g. { text, author, timeStamp, ... }) rather
  // than plain strings, depending on the SRE Agent API version. Concatenating one of those
  // objects straight into a template string stringifies it as the literal text
  // "[object Object]" - extract the actual text field defensively so the thread list always
  // shows a readable label.
  function textOf(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value.text || value.content || value.message || '';
    return String(value);
  }
  function threadLabel(t) {
    return textOf(t.title) || textOf(t.startMessage) || textOf(t.lastMessage) || t.id || t.threadId || 'thread';
  }
  // Thread "status" isn't always a plain string - the SRE Agent data-plane API
  // can return a nested { actionsStatus: {...}, incidentStatus: { status, ... } }
  // object instead, which used to render as literal "[object Object]" next to
  // every thread. Pull a sensible string out of either shape.
  function threadStatusLabel(t) {
    var s = t && t.status;
    if (s == null) return '';
    if (typeof s === 'string') return s;
    if (typeof s === 'object') {
      var incident = (s.incidentStatus && s.incidentStatus.status) || '';
      if (incident) return incident;
      if (s.actionsStatus && s.actionsStatus.hasCriticalActions) return 'action needed';
      if (s.actionsStatus && s.actionsStatus.hasWarningActions) return 'warning';
      return '';
    }
    return String(s);
  }

  function renderRowList(el, items, labelFn, onClick, activeId) {
    var focusedId = el.contains(document.activeElement) && document.activeElement.getAttribute('data-item-id');
    el.innerHTML = '';
    if (!items || !items.length) {
      el.innerHTML = '<div class="status">Nothing here yet.</div>';
      return;
    }
    var activeRow = null;
    items.forEach(function (item, index) {
      var row = document.createElement('div');
      var itemId = item.id || item.threadId || '';
      var isActive = Boolean(activeId && itemId === activeId);
      row.className = 'row-item' + (isActive ? ' active' : '');
      row.innerHTML = labelFn(item);
      if (onClick) {
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(isActive));
        row.setAttribute('data-item-id', itemId);
        row.tabIndex = isActive || (!activeId && index === 0) ? 0 : -1;
        row.addEventListener('click', function () { onClick(item); });
        row.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick(item);
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            var options = Array.from(el.querySelectorAll('[role="option"]'));
            var current = options.indexOf(row);
            var next = event.key === 'Home' ? 0
              : event.key === 'End' ? options.length - 1
              : event.key === 'ArrowDown' ? Math.min(options.length - 1, current + 1)
              : Math.max(0, current - 1);
            options.forEach(function (option, optionIndex) { option.tabIndex = optionIndex === next ? 0 : -1; });
            options[next].focus();
          }
        });
      }
      if (isActive) activeRow = row;
      el.appendChild(row);
    });
    if (focusedId) {
      var restored = Array.from(el.querySelectorAll('[role="option"]')).find(function (row) {
        return row.getAttribute('data-item-id') === focusedId;
      });
      if (restored) {
        Array.from(el.querySelectorAll('[role="option"]')).forEach(function (row) { row.tabIndex = row === restored ? 0 : -1; });
        restored.focus({ preventScroll: true });
      }
    }
    if (activeRow) activeRow.scrollIntoView({ block: 'nearest' });
  }

  function render(s) {
    state = s;
    setStatus(s.status, Boolean(s.error));
    if (s.error) setStatus(s.error, true);
    // Guard the whole render body: if any one section throws on an unexpected
    // message/thread shape, we must still reach scheduleThreadPoll() below or
    // the poll loop silently dies and the active thread pane looks "stuck"
    // forever even though the agent keeps working server-side.
    try {
      renderBody(s);
    } catch (err) {
      console.error('render() failed', err);
      setStatus('UI render error: ' + (err && err.message || err), true);
    } finally {
      scheduleThreadPoll(displayedActiveThread(s, draftThread));
    }
  }
  function renderBody(s) {

    var subSelect = document.getElementById('sub-select');
    subSelect.innerHTML = (s.subscriptions || []).map(function (sub) {
      return '<option value="' + sub.id + '"' + (sub.id === s.subscription ? ' selected' : '') + '>' + sub.name + '</option>';
    }).join('') || '<option value="">No subscriptions</option>';

    var agents = s.agents || [];
    var selectedAgent = s.agent && agents.find(function (a) { return a.name === s.agent.name; });
    var agentSelect = document.getElementById('agent-select');
    agentSelect.textContent = selectedAgent
      ? selectedAgent.name + ' (' + selectedAgent.resourceGroup + ')'
      : (agents.length ? 'Select an SRE Agent' : 'No SRE Agents found');
    agentSelect.disabled = !agents.length;
    agentSelect.dataset.value = selectedAgent ? selectedAgent.name : '';
    document.getElementById('agent-options').innerHTML = agents.map(function (a) {
      var selected = selectedAgent && selectedAgent.name === a.name;
      return '<button type="button" class="agent-option" role="option" data-agent-name="' + escapeHtml(a.name) +
        '" aria-selected="' + (selected ? 'true' : 'false') + '">' +
        escapeHtml(a.name + ' (' + a.resourceGroup + ')') + '</button>';
    }).join('');
    renderAgentSummary(s);

    var appSubSelect = document.getElementById('app-sub-select');
    appSubSelect.innerHTML = (s.subscriptions || []).map(function (sub) {
      return '<option value="' + sub.id + '"' + (sub.id === (s.appSubscription || s.subscription) ? ' selected' : '') + '>' + sub.name + '</option>';
    }).join('') || '<option value="">No subscriptions</option>';

    var appSelect = document.getElementById('app-resource-select');
    var appPrevValue = appSelect.value;
    var appOptions = (s.appResources || []).map(function (r) {
      return '<option value="' + r.id + '">' + r.name + ' (' + r.kind + ', ' + r.resourceGroup + ')</option>';
    }).join('');
    appSelect.innerHTML = (appOptions
      ? '<option value="">Pick an app / cluster / sandbox in this subscription&hellip;</option>' + appOptions
      : '<option value="">No supported app resources found in this subscription</option>');
    // render() is called on every state broadcast (opening a thread, polling, sending a
    // message, etc.) - rebuilding this <select>'s options must not silently drop whatever
    // app the user already picked, or the "Diagnose a failing app" context looks like it
    // reset every time they click around Threads/Incidents/etc.
    if (appPrevValue && appSelect.querySelector('option[value="' + CSS.escape(appPrevValue) + '"]')) {
      appSelect.value = appPrevValue;
    }

    renderCmdLog(s.commands || []);

    var displayedThreads = draftThread ? [draftThread].concat(sortThreads(s.threads || [])) : sortThreads(s.threads || []);
    var activeThread = displayedActiveThread(s, draftThread);
    renderRowList(document.getElementById('thread-list'), displayedThreads, function (t) {
      return '<span>' + escapeHtml(threadLabel(t)) + '</span><span class="tag">' + escapeHtml(threadStatusLabel(t)) + '</span>';
    }, function (t) { openThread(t.id || t.threadId); }, activeThread && (activeThread.id || activeThread.threadId));

    var log = document.getElementById('thread-log');
    var transcriptKey = transcriptRenderKey(activeThread);
    if (transcriptKey !== lastTranscriptKey) {
      renderChatLog(log, activeThread);
      lastTranscriptKey = transcriptKey;
    }
    var activeThreadId = threadId(activeThread);
    var focusedHere = Boolean(activeThreadId && s.focusedThreadId === activeThreadId);
    var focusButton = document.getElementById('focus-thread');
    focusButton.hidden = !activeThreadId || Boolean(activeThread && activeThread.draft);
    focusButton.textContent = focusedHere ? 'Unfocus' : 'Focus this thread';
    var focusBadge = document.getElementById('focus-badge');
    focusBadge.hidden = !s.focusedThreadId;
    focusBadge.textContent = s.focusedThreadId ? 'Focused: ' + (s.focusedThreadTitle || s.focusedThreadId) : '';

    renderRowList(document.getElementById('incident-list'), s.incidents, function (i) {
      return '<span>' + escapeHtml(textOf(i.title) || i.id || '') + '</span><span class="tag">' + escapeHtml(textOf(i.severity) || textOf(i.status) || '') + '</span>';
    });

    renderConnectors(s);
    renderConfigDrift(s.configDrift);
  }

  function renderAgentSummary(s) {
    var summary = document.getElementById('agent-summary');
    if (!summary) return;
    if (!s.agent) {
      summary.innerHTML = '<div class="hint">Select an SRE Agent to see connection details.</div>';
      return;
    }
    var items = [
      ['Endpoint', s.agent.endpoint || 'unknown'],
      ['Resource group', s.agent.resourceGroup || 'unknown'],
      ['Provisioning', s.agent.provisioningState || 'unknown'],
      ['Connectors', String((s.connectors || []).length)],
      ['Subscription', s.subscription || 'unknown'],
    ];
    summary.innerHTML = '<div class="connection-grid">' + items.map(function (item) {
      return '<div class="connection-item"><span>' + item[0] + '</span><strong title="' + escapeHtml(item[1]) + '">' + escapeHtml(item[1]) + '</strong></div>';
    }).join('') + '</div>';
  }

  function renderConnectors(s) {
    var list = document.getElementById('connector-list');
    if (list) {
      var items = s.connectors || [];
      var namespaceMcps = s.connectorNamespaceMcps || [];
      if (!items.length && !namespaceMcps.length) {
        list.innerHTML = '<div class="status">Nothing here yet.</div>';
      } else {
        var attachedHtml = items.map(function (c) {
          var policy = c.extendedProperties && c.extendedProperties.privateConnectorPolicy;
          var notice = '';
          if (policy) {
            notice = '<div class="hint" style="margin-top:.35rem">' +
              'Private-connector guardrail metadata is present. Invocation still requires verified signed user and thread claims.' +
              '</div>';
          }
          return '<div class="row-item" style="flex-direction:column;align-items:stretch;cursor:default">' +
            '<div style="display:flex;justify-content:space-between;gap:.5rem;align-items:center">' +
            '<div class="row-main"><span>' + escapeHtml(c.name || '') + '</span><span class="tag">' + escapeHtml(c.kind || 'connector') + '</span></div>' +
            '<div class="row-actions" style="flex:0 0 auto">' +
            (${PRIVATE_CONNECTORS_ENABLED ? "true" : "false"} && !c.isRemoteMcp ? '<button class="btn danger mini detach-connector" data-name="' + escapeHtml(c.name || '') + '">Detach</button>' : '') +
            '</div></div>' +
            notice +
            '</div>';
        }).join('');
        var namespaceHtml = namespaceMcps.map(function (mcp) {
          return '<div class="row-item" style="flex-direction:column;align-items:stretch;cursor:default">' +
            '<div class="row-main"><span>' + escapeHtml(mcp.name || '') + '</span>' +
            '<span class="tag">' + (mcp.attached ? 'MCP attached' : 'MCP available') + '</span></div>' +
            '<div class="hint" style="margin-top:.35rem">' + escapeHtml(mcp.attachmentStatus || '') + '</div>' +
            (${PRIVATE_CONNECTORS_ENABLED ? "true" : "false"} && !mcp.attached && mcp.endpoint
              ? '<button class="btn mini attach-namespace-mcp" data-name="' + escapeHtml(mcp.name || '') + '">Attach</button>'
              : '') +
            '</div>';
        }).join('');
        list.innerHTML = attachedHtml + namespaceHtml;
      }
    }
    var connectorSubSelect = document.getElementById('connector-sub-select');
    if (connectorSubSelect) {
      var selectedConnectorSub = connectorSubSelect.value || s.connectorSubscription || '';
      connectorSubSelect.innerHTML = '<option value="">All accessible subscriptions</option>' + (s.subscriptions || []).map(function (sub) {
        return '<option value="' + sub.id + '"' + (sub.id === selectedConnectorSub ? ' selected' : '') + '>' + escapeHtml(sub.name) + '</option>';
      }).join('');
    }
    var clusterSelect = document.getElementById('kusto-cluster-select');
    var currentCluster = clusterSelect.value;
    clusterSelect.innerHTML = '<option value="">Pick a discovered cluster...</option>' + (s.kustoResources || []).map(function (c) {
      return '<option value="' + escapeHtml(c.id || '') + '">' + escapeHtml((c.name || c.clusterUrl || '') + ' (' + (c.resourceGroup || '') + ')') + '</option>';
    }).join('');
    if (currentCluster && clusterSelect.querySelector('option[value="' + CSS.escape(currentCluster) + '"]')) clusterSelect.value = currentCluster;
    fillKustoDatabases();
  }

  function selectedKustoCluster() {
    var clusterId = document.getElementById('kusto-cluster-select').value;
    return (state.kustoResources || []).find(function (c) { return c.id === clusterId; }) || null;
  }

  function fillKustoDatabases() {
    var cluster = selectedKustoCluster();
    var dbSelect = document.getElementById('kusto-database-select');
    var currentDb = dbSelect.value;
    var dbs = (cluster && cluster.databases) || [];
    dbSelect.innerHTML = '<option value="">Pick a discovered database...</option>' + dbs.map(function (d) {
      return '<option value="' + escapeHtml(d.name || '') + '">' + escapeHtml(d.name || '') + '</option>';
    }).join('');
    if (currentDb && dbSelect.querySelector('option[value="' + CSS.escape(currentDb) + '"]')) dbSelect.value = currentDb;
    if (cluster && cluster.clusterUrl) document.getElementById('kusto-cluster-url').value = cluster.clusterUrl;
  }

  function detachConnector(name) {
    if (!name) return;
    if (!confirm('Detach connector "' + name + '" from this SRE Agent?')) return;
    postJson('/detach-connector', { name: name });
  }

  // "Workspace <-> Azure config check": renders as soon as the diff comes
  // back (either from the standalone check button or as a side effect of
  // diagnoseApp), so this is an instant signal even before an investigation
  // thread exists - the user doesn't have to open the thread to see it.
  function renderConfigDrift(drift) {
    var el = document.getElementById('config-drift-result');
    if (!drift) { el.innerHTML = ''; return; }
    if (drift.error) {
      el.innerHTML = '<div class="tool-badge risk">Config check failed: ' + escapeHtml(drift.error) + '</div>';
      return;
    }
    var missing = drift.missingInAzure || [];
    var unused = drift.unusedInWorkspace || [];
    var html = '<div class="panel" style="margin-top:8px">';
    if (missing.length) {
      html += '<div class="tool-badge risk">' + missing.length + ' setting(s) missing in Azure</div>' +
        '<ul style="margin:6px 0 0 18px;padding:0;font-size:.8rem">' + missing.map(function (m) {
          var srcs = (m.sources || []).slice(0, 3).map(function (s) {
            return escapeHtml(s.file) + ':' + s.line;
          }).join(', ');
          return '<li><code>' + escapeHtml(m.settingName) + '</code> &mdash; referenced at ' + srcs + '</li>';
        }).join('') + '</ul>';
    } else {
      html += '<div class="tool-badge safe">No missing app settings found</div>';
    }
    if (unused.length) {
      html += '<div class="tool-badge done" style="margin-top:6px">' + unused.length + ' Azure setting(s) unused in workspace</div>';
    }
    html += '<div class="tool-badge done" style="margin-top:6px">' + (drift.matchedCount || 0) + ' matched</div>';
    html += '</div>';
    el.innerHTML = html;
  }

  function openThread(threadId) {
    if (!threadId) return;
    if (draftThread && threadId === draftThread.id) {
      draftThread.active = true;
      state.activeThread = draftThread;
      activateTab('threads');
      renderBody(state);
      return;
    }
    draftThread = null;
    postJson('/open-thread', { threadId: threadId });
  }

  // Poll the active thread while it looks like the agent is still working -
  // either an az/kubectl/psql/approval execution is in-flight, OR the thread's
  // message count / last-message id has changed since our last poll (the agent
  // is still writing turns of plain reasoning/text with no tool-execution card
  // at all, which used to make the UI freeze on the very first snapshot even
  // though the agent kept going for minutes). Stop once two consecutive polls
  // see no growth and nothing in-flight.
  var IN_FLIGHT_STATUSES = ['running', 'pending', 'pendingauthorization', 'queued', 'inprogress'];
  var threadPollTimer = null;
  var threadPollId = null;
  var threadPollLastKey = null;
  var threadPollStaleCount = 0;
  function threadHasInFlightWork(thread) {
    if (!thread) return false;
    var msgs = thread.messages || [];
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      var exec = m.azCliExecution || m.kubectlExecution || m.psqlExecution || m.approval;
      if (exec && exec.status && IN_FLIGHT_STATUSES.indexOf(String(exec.status).toLowerCase()) !== -1) return true;
    }
    return false;
  }
  function threadProgressKey(thread) {
    var msgs = (thread && thread.messages) || [];
    var last = msgs[msgs.length - 1];
    return msgs.length + '|' + (last && (last.id || last.timeStamp) || '');
  }
  function scheduleThreadPoll(thread) {
    var id = thread && (thread.id || thread.threadId);
    if (threadPollTimer) { clearTimeout(threadPollTimer); threadPollTimer = null; }
    if (thread && thread.draft) return;
    if (!id) { threadPollId = null; threadPollLastKey = null; threadPollStaleCount = 0; return; }
    var key = threadProgressKey(thread);
    if (id !== threadPollId) {
      // Switched to a different thread - reset progress tracking.
      threadPollId = id;
      threadPollLastKey = key;
      threadPollStaleCount = 0;
    } else if (key !== threadPollLastKey) {
      threadPollLastKey = key;
      threadPollStaleCount = 0;
    } else if (threadPollStaleCount < 10) {
      threadPollStaleCount++;
    }
    var inFlight = threadHasInFlightWork(thread);
    // NOTE: never fully stop polling an open thread. The real SRE Agent can go
    // quiet for a long stretch (thinking, waiting on a slow tool call, etc.)
    // with no in-flight exec visible in our snapshot in between - if we stop
    // polling here the active thread pane silently "falls behind" forever
    // even though the agent keeps advancing server-side (only a manual
    // reselect of the thread would resume updates). Instead, back off to a
    // slower cadence the longer nothing changes, but keep polling for as
    // long as this thread stays open/active.
    var delay = inFlight ? 3000
      : threadPollStaleCount >= 10 ? 15000
      : threadPollStaleCount >= 3 ? 7000
      : 3000;
    threadPollTimer = setTimeout(function () {
      if (threadPollId === id) postJson('/open-thread', { threadId: id, poll: true });
    }, delay);
  }

  function toggleTask(task) {
    var paused = (task.status || '').toLowerCase() === 'paused';
    postJson(paused ? '/resume-scheduled-task' : '/pause-scheduled-task', { taskId: task.id || task.name });
  }

  function renderCmdLog(commands) {
    var list = document.getElementById('cmd-list');
    if (!commands.length) {
      list.innerHTML = '<div class="status">No commands run yet.</div>';
      return;
    }
    list.innerHTML = commands.map(function (c) {
      var statusLabel = c.status === 'run' ? 'running' : c.status === 'err' ? 'error' : 'ok';
      var ms = c.ms != null ? Math.round(c.ms) + 'ms' : '';
      // c.ts is epoch ms (server clock) - render as simple local wall-clock time
      // (e.g. "5:14:02 PM") so Command Activity reads like a timestamped log,
      // not just relative durations.
      var time = c.ts ? new Date(c.ts).toLocaleTimeString() : '';
      return '<div class="cmd-row">' +
        '<div class="cmd-head">' +
          '<span class="cmd-kind ' + c.kind + '">' + c.kind + '</span>' +
          '<span>' + (c.title || '') + '</span>' +
          '<span class="cmd-status ' + c.status + '">' + statusLabel + '</span>' +
          '<span class="cmd-time">' + time + '</span>' +
          '<span class="cmd-ms">' + ms + '</span>' +
        '</div>' +
        '<div class="cmd-text">' + escapeHtml(c.cmd || '') + '</div>' +
        (c.note ? '<div class="cmd-note">' + escapeHtml(c.note) + '</div>' : '') +
      '</div>';
    }).join('');
  }
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // Renders the active thread as a chat transcript, mirroring the real SRE Agent portal:
  // user/agent bubbles plus expandable tool-execution cards (az CLI / kubectl / psql).
  var TOOL_FIELDS = [
    { key: 'azCliExecution', label: 'az CLI' },
    { key: 'kubectlExecution', label: 'kubectl' },
    { key: 'psqlExecution', label: 'psql' },
    { key: 'genevaActionExecution', label: 'Geneva action' },
    { key: 'terminalResult', label: 'Terminal' },
  ];
  // requiredScopes comes back as a comma-separated string on real executions, not an array -
  // normalize defensively (mirrors scopesText() on the server side).
  function scopesText(exec) {
    var raw = exec && exec.requiredScopes;
    if (Array.isArray(raw)) return raw.join(', ');
    return String(raw || '');
  }
  function toolBadge(exec) {
    var status = String(exec.status || '').toLowerCase();
    if (status.indexOf('pendingauthorization') !== -1) {
      return '<span class="tool-badge risk">Needs permission</span>';
    }
    if (status.indexOf('pending') !== -1 || status === 'running') {
      return '<span class="tool-badge risk">Running&hellip;</span>';
    }
    if (status.indexOf('complete') !== -1 || status === 'completed') {
      return '<span class="tool-badge done">Completed</span>';
    }
    if (status === 'failed') {
      return '<span class="tool-badge risk">Failed</span>';
    }
    if (status === 'cancelled') {
      return '<span class="tool-badge done">Cancelled</span>';
    }
    var scopes = scopesText(exec).toLowerCase();
    if (/write|delete|update|restart|scale|set|apply/.test(scopes) || /--set|restart|delete|scale|update/.test(exec.command || '')) {
      return '<span class="tool-badge risk">Medium risk</span>';
    }
    return '<span class="tool-badge safe">Safe</span>';
  }
  // Mirrors the real SRE Agent portal: when the agent's managed identity is denied by RBAC
  // (status === PendingAuthorization), it shows a "Grant permissions" notice/button that
  // re-runs the same command on-behalf-of the signed-in user instead of the agent identity.
  function renderToolCard(field, exec, threadId) {
    var status = String(exec.status || '').toLowerCase();
    var pending = status.indexOf('pending') !== -1;
    var needsAuth = status.indexOf('pendingauthorization') !== -1;
    var scopes = scopesText(exec);
    var boundedCommand = truncateTranscriptText(exec.command, MAX_COMMAND_CHARS);
    return '<div class="tool-card">' +
      '<div class="tool-head">' +
        '<span class="tool-title">' + escapeHtml(exec.description || field.label) + '</span>' +
        toolBadge(exec) +
        (pending && !needsAuth ? '<span class="spinner"></span>' : '') +
      '</div>' +
      (exec.command ? '<div class="tool-cmd">' + escapeHtml(boundedCommand) + ' <button class="copy-cmd" data-cmd="' + escapeHtml(boundedCommand).replace(/"/g, '&quot;') + '" style="float:right">Copy</button></div>' : '') +
      (needsAuth ? (
        '<div class="tool-auth-notice">The agent tried to execute this command using its managed identity but received an authorization error.' +
        (scopes ? ' If you grant permissions, the command will be re-executed using your credentials (OBO) with scope: <b>' + escapeHtml(scopes) + '</b>.' : ' Grant permissions to re-run this command using your own credentials (OBO).') +
        '</div>' +
        '<div class="tool-auth-actions">' +
          (${WRITES_ENABLED ? "true" : "false"} ? '<button class="btn grant-exec" data-kind="' + field.key + '" data-thread="' + escapeHtml(threadId || '') + '" data-exec="' + escapeHtml(exec.id || '') + '" data-command="' + encodeURIComponent(String(exec.command || '')) + '">Grant permissions (this run)</button>' : '') +
          (${WRITES_ENABLED ? "true" : "false"} ? '<button class="btn grant-role" data-kind="' + field.key + '" data-thread="' + escapeHtml(threadId || '') + '" data-exec="' + escapeHtml(exec.id || '') + '" title="Create a real RBAC role assignment for the agent&#39;s own identity, so it stops needing OBO for this resource.">Grant durable access &#8635;</button>' : '') +
          (${WRITES_ENABLED ? "true" : "false"} ? '<button class="btn ghost cancel-exec" data-kind="' + field.key + '" data-thread="' + escapeHtml(threadId || '') + '" data-exec="' + escapeHtml(exec.id || '') + '" data-command="' + encodeURIComponent(String(exec.command || '')) + '">Cancel</button>' : '') +
        '</div>'
      ) : '') +
      (exec.output ? '<div class="tool-output">' + escapeHtml(truncateTranscriptText(exec.output, MAX_TOOL_OUTPUT_CHARS)) + '</div>' : '') +
      (exec.error ? '<div class="tool-output" style="color:var(--err)">' + escapeHtml(truncateTranscriptText(exec.error, MAX_ERROR_CHARS)) + '</div>' : '') +
    '</div>';
  }
  // Small, dependency-free GFM-ish markdown renderer for SRE Agent chat/thread message
  // text. Input is escaped via escapeHtml() FIRST (so no raw HTML/script can ever reach
  // innerHTML), and markdown tokens are then matched against the escaped text - none of
  // the patterns below target the escaped entities themselves (&amp; &lt; &gt; &quot; &#39;),
  // only plain characters like |, #, *, backtick, - which escapeHtml() never touches.
  // Note: this whole file is itself one big JS template literal, so regex escapes here
  // must be doubled (\\s, \\|, \\* etc.) to survive being embedded literally.
  function renderInlineMarkdown(escaped) {
    return escaped
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  }
  function splitTableRow(line) {
    var trimmed = line.trim().replace(/^\\|/, '').replace(/\\|$/, '');
    return trimmed.split('|').map(function (c) { return c.trim(); });
  }
  function renderMarkdownTable(lines) {
    var header = splitTableRow(lines[0]);
    var rows = lines.slice(2).map(splitTableRow);
    var html = '<table><thead><tr>' + header.map(function (c) {
      return '<th>' + renderInlineMarkdown(c) + '</th>';
    }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr>' + r.map(function (c) { return '<td>' + renderInlineMarkdown(c) + '</td>'; }).join('') + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }
  function isTableSeparatorLine(line) {
    return /^\\s*\\|?\\s*:?-{2,}:?\\s*(\\|\\s*:?-{2,}:?\\s*)*\\|?\\s*$/.test(line);
  }
  function renderMarkdown(text) {
    var escaped = escapeHtml(String(text == null ? '' : text));
    var lines = escaped.split('\\n');
    var html = '';
    var i = 0;
    var listBuf = [];
    function flushList() {
      if (listBuf.length) {
        html += '<ul>' + listBuf.map(function (li) { return '<li>' + renderInlineMarkdown(li) + '</li>'; }).join('') + '</ul>';
        listBuf = [];
      }
    }
    var paraBuf = [];
    function flushPara() {
      if (paraBuf.length) {
        html += '<p>' + paraBuf.map(renderInlineMarkdown).join('<br>') + '</p>';
        paraBuf = [];
      }
    }
    while (i < lines.length) {
      var line = lines[i];
      // GFM table: header row followed by a |---|---| separator row.
      if (line.indexOf('|') !== -1 && lines[i + 1] && isTableSeparatorLine(lines[i + 1])) {
        flushPara(); flushList();
        var tableLines = [line, lines[i + 1]];
        var j = i + 2;
        while (j < lines.length && lines[j].indexOf('|') !== -1 && lines[j].trim() !== '') {
          tableLines.push(lines[j]);
          j++;
        }
        html += renderMarkdownTable(tableLines);
        i = j;
        continue;
      }
      var headerMatch = /^(#{1,3})\\s+(.*)$/.exec(line);
      if (headerMatch) {
        flushPara(); flushList();
        var level = headerMatch[1].length;
        html += '<h' + level + '>' + renderInlineMarkdown(headerMatch[2]) + '</h' + level + '>';
        i++;
        continue;
      }
      var bulletMatch = /^\\s*[-*]\\s+(.*)$/.exec(line);
      if (bulletMatch) {
        flushPara();
        listBuf.push(bulletMatch[1]);
        i++;
        continue;
      }
      if (line.trim() === '') {
        flushList(); flushPara();
        i++;
        continue;
      }
      flushList();
      paraBuf.push(line);
      i++;
    }
    flushList(); flushPara();
    return html;
  }
  function renderChatMessage(m, threadId) {
    var role = (m.author && m.author.role) || m.role || 'Agent';
    var isUser = String(role).toLowerCase() === 'user';
    var text = m.text || m.content || m.message || '';
    var who = isUser ? ((m.author && m.author.displayName) || 'You') : 'SRE Agent';
    var parts = [];
    if (text) parts.push('<div class="chat-bubble">' + renderMarkdown(text) + '</div>');
    TOOL_FIELDS.forEach(function (field) {
      var exec = m[field.key];
      if (exec) parts.push(renderToolCard(field, exec, threadId));
    });
    if (!parts.length) parts.push('<div class="chat-bubble">' + escapeHtml(truncateTranscriptText(JSON.stringify(m), MAX_ERROR_CHARS)) + '</div>');
    return '<div class="chat-msg ' + (isUser ? 'user' : 'agent') + '">' +
      '<span class="who">' + escapeHtml(who) + '</span>' + parts.join('') +
    '</div>';
  }
  function threadIsAwaitingAgent(thread) {
    // Show a "thinking" indicator whenever the agent still owes the user a
    // reply: either there's an in-flight tool execution, or the most recent
    // message in the thread is from the user (i.e. no agent turn yet).
    if (!thread) return false;
    if (threadHasInFlightWork(thread)) return true;
    var msgs = thread.messages || thread.value || [];
    if (!msgs.length) return false;
    var last = msgs[msgs.length - 1];
    var role = (last.author && last.author.role) || last.role || '';
    return String(role).toLowerCase() === 'user';
  }
  var TYPING_INDICATOR_HTML = '<div class="chat-msg agent"><span class="who">SRE Agent</span>' +
    '<div class="chat-bubble typing-dots"><span></span><span></span><span></span></div></div>';
  function renderChatLog(el, thread) {
    if (!thread) { el.textContent = 'No thread selected.'; return; }
    if (thread.draft) {
      el.innerHTML = '<div class="status">New draft thread. Review or edit the template below, then click Send to start the SRE Agent thread.</div>';
      return;
    }
    var threadId = thread.id || thread.threadId || '';
    var allMessages = thread.messages || thread.value || [];
    var messages = boundedTranscriptMessages(thread);
    var hiddenCount = Math.max(0, allMessages.length - messages.length);
    var showTyping = threadIsAwaitingAgent(thread);
    if (!messages.length) {
      el.innerHTML = (thread.startMessage ? renderChatMessage(thread.startMessage, threadId) : '<div class="status">No messages yet.</div>') +
        (showTyping ? TYPING_INDICATOR_HTML : '');
      el.scrollTop = el.scrollHeight;
      return;
    }
    el.innerHTML = (hiddenCount ? '<div class="transcript-notice"><span>Showing the latest ' + messages.length + ' of ' + allMessages.length + ' messages.</span><button class="btn ghost mini portal-full-transcript">Open full transcript in Portal &#8599;</button></div>' : '') + messages.map(function (m) {
      try {
        return renderChatMessage(m, threadId);
      } catch (err) {
        console.error('renderChatMessage failed for message', m, err);
        return '<div class="chat-msg agent"><span class="who">SRE Agent</span><div class="chat-bubble" style="color:var(--err)">(Could not render this message: ' + escapeHtml(err && err.message || String(err)) + ')</div></div>';
      }
    }).join('') + (showTyping ? TYPING_INDICATOR_HTML : '');
    el.scrollTop = el.scrollHeight;
  }

  document.getElementById('thread-log').addEventListener('click', function (e) {
    if (e.target && e.target.classList.contains('portal-full-transcript')) {
      openSelectedThreadInPortal();
      return;
    }
    if (e.target && e.target.classList.contains('copy-cmd')) {
      var cmd = e.target.getAttribute('data-cmd') || '';
      navigator.clipboard && navigator.clipboard.writeText(cmd);
      e.target.textContent = 'Copied!';
      setTimeout(function () { e.target.textContent = 'Copy'; }, 1200);
      return;
    }
    if (e.target && e.target.classList.contains('grant-exec')) {
      e.target.disabled = true;
      e.target.textContent = 'Granting...';
      postJson('/grant-execution', {
        kind: e.target.getAttribute('data-kind'),
        threadId: e.target.getAttribute('data-thread'),
        executionId: e.target.getAttribute('data-exec'),
        expectedCommand: decodeURIComponent(e.target.getAttribute('data-command') || ''),
      });
      return;
    }
    if (e.target && e.target.classList.contains('grant-role')) {
      e.target.disabled = true;
      e.target.textContent = 'Creating role assignment...';
      postJson('/grant-durable-role', {
        kind: e.target.getAttribute('data-kind'),
        threadId: e.target.getAttribute('data-thread'),
        executionId: e.target.getAttribute('data-exec'),
      }).catch(function () {
        e.target.disabled = false;
        e.target.textContent = 'Grant durable access \u21BB';
      });
      return;
    }
    if (e.target && e.target.classList.contains('cancel-exec')) {
      e.target.disabled = true;
      e.target.textContent = 'Cancelling...';
      postJson('/cancel-execution', {
        kind: e.target.getAttribute('data-kind'),
        threadId: e.target.getAttribute('data-thread'),
        executionId: e.target.getAttribute('data-exec'),
        expectedCommand: decodeURIComponent(e.target.getAttribute('data-command') || ''),
      });
    }
  });

  document.getElementById('sub-select').addEventListener('change', function (e) {
    postJson('/select-subscription', { subscription: e.target.value });
  });
  document.getElementById('agent-select').addEventListener('click', function (e) {
    var options = document.getElementById('agent-options');
    var open = options.hidden;
    options.hidden = !open;
    e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      var first = options.querySelector('.agent-option[aria-selected="true"]') || options.querySelector('.agent-option');
      if (first) first.focus();
    }
  });
  document.getElementById('agent-select').addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var options = document.getElementById('agent-options');
    options.hidden = true;
    e.currentTarget.setAttribute('aria-expanded', 'false');
  });
  document.getElementById('agent-options').addEventListener('click', function (e) {
    var option = e.target.closest('.agent-option');
    if (!option) return;
    postJson('/select-agent', { name: option.dataset.agentName });
    e.currentTarget.hidden = true;
    document.getElementById('agent-select').setAttribute('aria-expanded', 'false');
    // Collapse Azure Configuration only once an agent is actually chosen - merely
    // opening the picker must leave the card open.
    var configCard = document.getElementById('azure-config-card');
    if (configCard) configCard.open = false;
  });
  document.getElementById('agent-options').addEventListener('keydown', function (e) {
    var option = e.target.closest('.agent-option');
    if (!option) return;
    var options = Array.from(e.currentTarget.querySelectorAll('.agent-option'));
    var current = options.indexOf(option);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.hidden = true;
      var trigger = document.getElementById('agent-select');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    var next = e.key === 'Home' ? 0
      : e.key === 'End' ? options.length - 1
      : e.key === 'ArrowDown' ? Math.min(options.length - 1, current + 1)
      : Math.max(0, current - 1);
    if (options[next]) options[next].focus();
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.agent-picker')) return;
    var options = document.getElementById('agent-options');
    if (!options || options.hidden) return;
    options.hidden = true;
    document.getElementById('agent-select').setAttribute('aria-expanded', 'false');
  });
  document.getElementById('refresh-agents').addEventListener('click', function () {
    postJson('/refresh-agents');
    var configCard = document.getElementById('azure-config-card');
    if (configCard) configCard.open = false;
  });

  document.getElementById('app-sub-select').addEventListener('change', function (e) {
    postJson('/select-app-subscription', { subscription: e.target.value });
  });

  document.getElementById('app-resource-select').addEventListener('change', function (e) {
    if (e.target.value) document.getElementById('app-resource').value = e.target.value;
  });

  document.getElementById('diagnose-app').addEventListener('click', function () {
    var picked = document.getElementById('app-resource-select').value;
    var typed = document.getElementById('app-resource').value;
    postJson('/diagnose-app', {
      resourceIdOrName: typed || picked,
      note: document.getElementById('app-note').value,
      appSubscription: document.getElementById('app-sub-select').value,
    }).then(function () {
      activateTab('threads');
    });
    var configCard = document.getElementById('azure-config-card');
    if (configCard) configCard.open = false;
    var cmdCard = document.getElementById('cmdlog');
    if (cmdCard) cmdCard.open = true;
  });
  document.getElementById('check-config-drift').addEventListener('click', function () {
    var picked = document.getElementById('app-resource-select').value;
    var typed = document.getElementById('app-resource').value;
    var target = typed || picked;
    if (!target) { setStatus('Pick or enter an app resource first.', true); return; }
    postJson('/check-config-drift', { resourceIdOrName: target, appSubscription: document.getElementById('app-sub-select').value });
  });
  document.getElementById('discover-kusto').addEventListener('click', function () {
    postJson('/discover-kusto-resources', { subscription: document.getElementById('connector-sub-select').value });
  });
  document.getElementById('connector-list').addEventListener('click', function (e) {
    var detachBtn = e.target.closest('.detach-connector');
    if (detachBtn) {
      e.preventDefault();
      e.stopPropagation();
      detachConnector(detachBtn.dataset.name || '');
      return;
    }
    var attachBtn = e.target.closest('.attach-namespace-mcp');
    if (attachBtn) {
      e.preventDefault();
      e.stopPropagation();
      postJson('/attach-connector-namespace-mcp', { name: attachBtn.dataset.name || '' });
      return;
    }
    var copyBtn = e.target.closest('.copy-cmd');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      var cmd = copyBtn.getAttribute('data-cmd') || '';
      navigator.clipboard && navigator.clipboard.writeText(cmd);
      copyBtn.textContent = 'Copied!';
      setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1200);
    }
  });
  document.getElementById('kusto-cluster-select').addEventListener('change', function () {
    var cluster = selectedKustoCluster();
    if (cluster && cluster.clusterUrl) document.getElementById('kusto-cluster-url').value = cluster.clusterUrl;
    fillKustoDatabases();
  });
  document.getElementById('kusto-database-select').addEventListener('change', function (e) {
    if (e.target.value) document.getElementById('kusto-database').value = e.target.value;
  });
  document.getElementById('create-delegated-kusto-mcp').addEventListener('click', function () {
    postJson('/create-delegated-kusto-mcp', {
      clusterUrl: document.getElementById('kusto-cluster-url').value.trim(),
      database: document.getElementById('kusto-database').value.trim() || document.getElementById('kusto-database-select').value,
    }).then(function (r) {
      var result = r && r.result;
      if (result && result.signInRequired) {
        if (result.signInUrl) window.open(result.signInUrl, 'connector-namespace-consent', 'popup,width=720,height=760');
        setStatus('Complete the Azure Data Explorer sign-in. Azure SRE Agent will continue automatically.');
      }
    });
  });
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !event.data || event.data.type !== 'connector-namespace-consent') return;
    postJson('/confirm-delegated-kusto-consent', { code: event.data.code });
  });
  function sendComposerMessage(forceNewThread) {
    var activeThread = displayedActiveThread(state, draftThread);
    var activeId = threadId(activeThread);
    var input = document.getElementById('reply-msg');
    var message = input.value.trim();
    if (!message) { setStatus('Type a message for the SRE Agent first.', true); return; }
    if (shouldCreateThread(state, draftThread, forceNewThread)) {
      postJson('/create-thread', { message: message }).then(function (response) {
        var created = response && response.result;
        draftThread = null;
        state.activeThread = created;
        state.threads = upsertThread(state.threads, created);
        input.value = '';
        activateTab('threads');
        renderBody(state);
        requestAnimationFrame(function () {
          var detail = document.getElementById('thread-detail');
          detail.scrollIntoView({ block: 'nearest' });
          detail.focus({ preventScroll: true });
        });
        if (threadId(created)) postJson('/open-thread', { threadId: threadId(created) });
      });
      return;
    }
    postJson('/send-message', { threadId: activeId, message: message }).then(function () {
      input.value = '';
    });
  }
  document.getElementById('new-thread').addEventListener('click', function () {
    draftThread = {
      id: '__draft_thread__',
      title: 'New thread draft',
      status: 'draft',
      draft: true,
      active: true,
      messages: [],
    };
    state.activeThread = draftThread;
    document.getElementById('reply-msg').value = NEW_THREAD_TEMPLATE;
    activateTab('threads');
    renderBody(state);
    setStatus('New draft thread ready. Edit the template, then click Send.');
  });
  document.getElementById('send-reply').addEventListener('click', function () {
    sendComposerMessage(false);
  });
  document.getElementById('focus-thread').addEventListener('click', function () {
    var activeId = threadId(displayedActiveThread(state, draftThread));
    if (!activeId) { setStatus('Select a thread first.', true); return; }
    postJson(state.focusedThreadId === activeId ? '/unfocus-thread' : '/focus-thread', { threadId: activeId });
  });
  document.getElementById('focus-badge').addEventListener('click', function () {
    if (!state.focusedThreadId) return;
    openThread(state.focusedThreadId);
  });
  function openSelectedThreadInPortal() {
    if (!state.agent || !state.subscription) { setStatus('Select an SRE Agent first.', true); return; }
    var activeThread = displayedActiveThread(state, draftThread);
    var activeId = activeThread && !activeThread.draft ? threadId(activeThread) : '';
    var url = 'https://sre.azure.com/agents/subscriptions/' + encodeURIComponent(state.subscription) +
      '/resourceGroups/' + encodeURIComponent(state.agent.resourceGroup) +
      '/providers/Microsoft.App/agents/' + encodeURIComponent(state.agent.name);
    if (activeId) url += '/views/thread/' + encodeURIComponent(activeId);
    window.open(url, '_blank', 'noopener');
  }
  document.getElementById('open-in-portal').addEventListener('click', function () {
    openSelectedThreadInPortal();
  });

  document.getElementById('create-incident').addEventListener('click', function () {
    postJson('/create-incident', {
      title: document.getElementById('incident-title').value,
      severity: document.getElementById('incident-severity').value,
      description: document.getElementById('incident-desc').value,
      services: document.getElementById('incident-services').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
    });
  });

  var es = new EventSource('/events');
  var esGotFirstMessage = false;
  es.addEventListener('state', function (e) { esGotFirstMessage = true; render(JSON.parse(e.data)); });
  // Each time this extension is reloaded, the canvas server restarts on a fresh port and
  // this panel's live connection dies for good (EventSource can't reconnect across a port
  // change). Without this, the UI just silently freezes on stale data forever - surface it
  // instead so it's obvious a reopen/reload of the canvas panel is needed.
  es.addEventListener('error', function () {
    if (es.readyState === EventSource.CLOSED) {
      setStatus('Lost connection to the canvas server (likely reloaded on a new port) - reopen this canvas panel to reconnect.', true);
    }
  });
  postJson('/init');
})();
</script>
</body>
</html>`;
}
export {
  activateDefaultThread,
  appendFocusContract,
  authorizeExecutionSafely,
  azureDiscoveryFailure,
  canvas,
  clearThreadContext,
  connectorNameOwnedBy,
  connectorOwnerKey,
  isAgentContextSwitch,
  renderHtml,
  waitForNewAgentReplies
};
