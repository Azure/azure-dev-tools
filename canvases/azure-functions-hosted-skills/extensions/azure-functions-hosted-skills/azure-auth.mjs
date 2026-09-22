import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// packages/canvas-toolkit/src/internal/auth-errors.mjs
function cancelledError() {
  return new AuthError("cancelled", "The authentication operation was cancelled.");
}
function throwIfAborted(signal) {
  if (signal?.aborted) throw cancelledError();
}
function safeAuthError(error, fallback = "authentication-failed") {
  if (error instanceof AuthError) return error;
  if (error?.name === "AbortError" || error?.code === "ABORT_ERR") return cancelledError();
  return new AuthError(fallback, "Azure authentication could not complete.", "Check your sign-in and try again.");
}
function reportAuthDiagnostic(kind) {
  process.emitWarning(diagnostics[kind], { code: `AZURE_CANVAS_AUTH_${kind.toUpperCase()}_FAILED` });
}
var AuthError, diagnostics;
var init_auth_errors = __esm({
  "packages/canvas-toolkit/src/internal/auth-errors.mjs"() {
    AuthError = class extends Error {
      constructor(code, message, remedy) {
        super(message);
        this.name = "AuthError";
        this.code = code;
        if (remedy !== void 0) this.remedy = remedy;
      }
      toJSON() {
        return { code: this.code, message: this.message, ...this.remedy ? { remedy: this.remedy } : {} };
      }
    };
    diagnostics = {
      listener: "An Azure authentication state listener failed.",
      progress: "An Azure authentication progress listener failed.",
      cleanup: "An Azure authentication source could not complete cleanup."
    };
  }
});

// node_modules/@azure/identity/dist/esm/constants.js
var SDK_VERSION, AzureAuthorityHosts, DefaultAuthorityHost, ALL_TENANTS;
var init_constants = __esm({
  "node_modules/@azure/identity/dist/esm/constants.js"() {
    SDK_VERSION = `4.13.3`;
    (function(AzureAuthorityHosts2) {
      AzureAuthorityHosts2["AzureChina"] = "https://login.chinacloudapi.cn";
      AzureAuthorityHosts2["AzureGermany"] = "https://login.microsoftonline.de";
      AzureAuthorityHosts2["AzureGovernment"] = "https://login.microsoftonline.us";
      AzureAuthorityHosts2["AzurePublicCloud"] = "https://login.microsoftonline.com";
    })(AzureAuthorityHosts || (AzureAuthorityHosts = {}));
    DefaultAuthorityHost = AzureAuthorityHosts.AzurePublicCloud;
    ALL_TENANTS = ["*"];
  }
});

// node_modules/@azure/identity/dist/esm/msal/nodeFlows/msalPlugins.js
var init_msalPlugins = __esm({
  "node_modules/@azure/identity/dist/esm/msal/nodeFlows/msalPlugins.js"() {
    init_constants();
  }
});

// node_modules/@azure/identity/dist/esm/plugins/consumer.js
var init_consumer = __esm({
  "node_modules/@azure/identity/dist/esm/plugins/consumer.js"() {
    init_msalPlugins();
  }
});

// node_modules/@azure/identity/dist/esm/errors.js
var CredentialUnavailableErrorName, CredentialUnavailableError;
var init_errors = __esm({
  "node_modules/@azure/identity/dist/esm/errors.js"() {
    CredentialUnavailableErrorName = "CredentialUnavailableError";
    CredentialUnavailableError = class extends Error {
      constructor(message, options) {
        super(message, options);
        this.name = CredentialUnavailableErrorName;
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/logger/log.js
import { EOL } from "node:os";
import util from "node:util";
import process2 from "node:process";
function log(message, ...args) {
  process2.stderr.write(`${util.format(message, ...args)}${EOL}`);
}
var init_log = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/logger/log.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/env.js
import process3 from "node:process";
function getEnvironmentVariable(name2) {
  return process3.env[name2];
}
var isDeno, isBun;
var init_env = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/env.js"() {
    isDeno = typeof process3.versions.deno === "string" && process3.versions.deno.length > 0;
    isBun = typeof process3.versions.bun === "string" && process3.versions.bun.length > 0;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/logger/debug.js
function enable(namespaces) {
  enabledString = namespaces;
  enabledNamespaces = [];
  skippedNamespaces = [];
  const namespaceList = namespaces.split(",").map((ns) => ns.trim());
  for (const ns of namespaceList) {
    if (ns.startsWith("-")) {
      skippedNamespaces.push(ns.substring(1));
    } else {
      enabledNamespaces.push(ns);
    }
  }
  for (const instance of debuggers) {
    instance.enabled = enabled(instance.namespace);
  }
}
function enabled(namespace) {
  if (namespace.endsWith("*")) {
    return true;
  }
  for (const skipped of skippedNamespaces) {
    if (namespaceMatches(namespace, skipped)) {
      return false;
    }
  }
  for (const enabledNamespace of enabledNamespaces) {
    if (namespaceMatches(namespace, enabledNamespace)) {
      return true;
    }
  }
  return false;
}
function namespaceMatches(namespace, patternToMatch) {
  if (patternToMatch.indexOf("*") === -1) {
    return namespace === patternToMatch;
  }
  let pattern = patternToMatch;
  if (patternToMatch.indexOf("**") !== -1) {
    const patternParts = [];
    let lastCharacter = "";
    for (const character of patternToMatch) {
      if (character === "*" && lastCharacter === "*") {
        continue;
      } else {
        lastCharacter = character;
        patternParts.push(character);
      }
    }
    pattern = patternParts.join("");
  }
  let namespaceIndex = 0;
  let patternIndex = 0;
  const patternLength = pattern.length;
  const namespaceLength = namespace.length;
  let lastWildcard = -1;
  let lastWildcardNamespace = -1;
  while (namespaceIndex < namespaceLength && patternIndex < patternLength) {
    if (pattern[patternIndex] === "*") {
      lastWildcard = patternIndex;
      patternIndex++;
      if (patternIndex === patternLength) {
        return true;
      }
      while (namespace[namespaceIndex] !== pattern[patternIndex]) {
        namespaceIndex++;
        if (namespaceIndex === namespaceLength) {
          return false;
        }
      }
      lastWildcardNamespace = namespaceIndex;
      namespaceIndex++;
      patternIndex++;
      continue;
    } else if (pattern[patternIndex] === namespace[namespaceIndex]) {
      patternIndex++;
      namespaceIndex++;
    } else if (lastWildcard >= 0) {
      patternIndex = lastWildcard + 1;
      namespaceIndex = lastWildcardNamespace + 1;
      if (namespaceIndex === namespaceLength) {
        return false;
      }
      while (namespace[namespaceIndex] !== pattern[patternIndex]) {
        namespaceIndex++;
        if (namespaceIndex === namespaceLength) {
          return false;
        }
      }
      lastWildcardNamespace = namespaceIndex;
      namespaceIndex++;
      patternIndex++;
      continue;
    } else {
      return false;
    }
  }
  const namespaceDone = namespaceIndex === namespace.length;
  const patternDone = patternIndex === pattern.length;
  const trailingWildCard = patternIndex === pattern.length - 1 && pattern[patternIndex] === "*";
  return namespaceDone && (patternDone || trailingWildCard);
}
function disable() {
  const result = enabledString || "";
  enable("");
  return result;
}
function createDebugger(namespace) {
  const newDebugger = Object.assign(debug, {
    enabled: enabled(namespace),
    destroy,
    log: debugObj.log,
    namespace,
    extend
  });
  function debug(...args) {
    if (!newDebugger.enabled) {
      return;
    }
    if (args.length > 0) {
      args[0] = `${namespace} ${args[0]}`;
    }
    newDebugger.log(...args);
  }
  debuggers.push(newDebugger);
  return newDebugger;
}
function destroy() {
  const index = debuggers.indexOf(this);
  if (index >= 0) {
    debuggers.splice(index, 1);
    return true;
  }
  return false;
}
function extend(namespace) {
  const newDebugger = createDebugger(`${this.namespace}:${namespace}`);
  newDebugger.log = this.log;
  return newDebugger;
}
var debugEnvVariable, enabledString, enabledNamespaces, skippedNamespaces, debuggers, debugObj, debug_default;
var init_debug = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/logger/debug.js"() {
    init_log();
    init_env();
    debugEnvVariable = getEnvironmentVariable("DEBUG");
    enabledNamespaces = [];
    skippedNamespaces = [];
    debuggers = [];
    if (debugEnvVariable) {
      enable(debugEnvVariable);
    }
    debugObj = Object.assign((namespace) => {
      return createDebugger(namespace);
    }, {
      enable,
      enabled,
      disable,
      log
    });
    debug_default = debugObj;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/logger/logger.js
function patchLogMethod(parent, child) {
  child.log = (...args) => {
    parent.log(...args);
  };
}
function isTypeSpecRuntimeLogLevel(level) {
  return TYPESPEC_RUNTIME_LOG_LEVELS.includes(level);
}
function createLoggerContext(options) {
  const registeredLoggers = /* @__PURE__ */ new Set();
  const logLevelFromEnv = getEnvironmentVariable(options.logLevelEnvVarName);
  let logLevel;
  const clientLogger = debug_default(options.namespace);
  clientLogger.log = (...args) => {
    debug_default.log(...args);
  };
  function contextSetLogLevel(level) {
    if (level && !isTypeSpecRuntimeLogLevel(level)) {
      throw new Error(`Unknown log level '${level}'. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(",")}`);
    }
    logLevel = level;
    const enabledNamespaces2 = [];
    for (const logger27 of registeredLoggers) {
      if (shouldEnable(logger27)) {
        enabledNamespaces2.push(logger27.namespace);
      }
    }
    debug_default.enable(enabledNamespaces2.join(","));
  }
  if (logLevelFromEnv) {
    if (isTypeSpecRuntimeLogLevel(logLevelFromEnv)) {
      contextSetLogLevel(logLevelFromEnv);
    } else {
      console.error(`${options.logLevelEnvVarName} set to unknown log level '${logLevelFromEnv}'; logging is not enabled. Acceptable values: ${TYPESPEC_RUNTIME_LOG_LEVELS.join(", ")}.`);
    }
  }
  function shouldEnable(logger27) {
    return Boolean(logLevel && levelMap[logger27.level] <= levelMap[logLevel]);
  }
  function createLogger(parent, level) {
    const logger27 = Object.assign(parent.extend(level), {
      level
    });
    patchLogMethod(parent, logger27);
    if (shouldEnable(logger27)) {
      const enabledNamespaces2 = debug_default.disable();
      debug_default.enable(enabledNamespaces2 + "," + logger27.namespace);
    }
    registeredLoggers.add(logger27);
    return logger27;
  }
  function contextGetLogLevel() {
    return logLevel;
  }
  function contextCreateClientLogger(namespace) {
    const clientRootLogger = clientLogger.extend(namespace);
    patchLogMethod(clientLogger, clientRootLogger);
    return {
      error: createLogger(clientRootLogger, "error"),
      warning: createLogger(clientRootLogger, "warning"),
      info: createLogger(clientRootLogger, "info"),
      verbose: createLogger(clientRootLogger, "verbose")
    };
  }
  return {
    setLogLevel: contextSetLogLevel,
    getLogLevel: contextGetLogLevel,
    createClientLogger: contextCreateClientLogger,
    logger: clientLogger
  };
}
function createClientLogger(namespace) {
  return context.createClientLogger(namespace);
}
var TYPESPEC_RUNTIME_LOG_LEVELS, levelMap, context, TypeSpecRuntimeLogger;
var init_logger = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/logger/logger.js"() {
    init_debug();
    init_env();
    TYPESPEC_RUNTIME_LOG_LEVELS = ["verbose", "info", "warning", "error"];
    levelMap = {
      verbose: 400,
      info: 300,
      warning: 200,
      error: 100
    };
    context = createLoggerContext({
      logLevelEnvVarName: "TYPESPEC_RUNTIME_LOG_LEVEL",
      namespace: "typeSpecRuntime"
    });
    TypeSpecRuntimeLogger = context.logger;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/logger/internal.js
var init_internal = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/logger/internal.js"() {
    init_logger();
  }
});

// node_modules/@azure/logger/dist/esm/index.js
function createClientLogger2(namespace) {
  return context2.createClientLogger(namespace);
}
var context2, AzureLogger;
var init_esm = __esm({
  "node_modules/@azure/logger/dist/esm/index.js"() {
    init_internal();
    context2 = createLoggerContext({
      logLevelEnvVarName: "AZURE_LOG_LEVEL",
      namespace: "azure"
    });
    AzureLogger = context2.logger;
  }
});

// node_modules/@azure/identity/dist/esm/util/logging.js
function formatSuccess(scope) {
  return `SUCCESS. Scopes: ${Array.isArray(scope) ? scope.join(", ") : scope}.`;
}
function formatError(scope, error) {
  let message = "ERROR.";
  if (scope?.length) {
    message += ` Scopes: ${Array.isArray(scope) ? scope.join(", ") : scope}.`;
  }
  return `${message} Error message: ${typeof error === "string" ? error : error.message}.`;
}
function credentialLoggerInstance(title, parent, log2 = logger) {
  const fullTitle = parent ? `${parent.fullTitle} ${title}` : title;
  function info(message) {
    log2.info(`${fullTitle} =>`, message);
  }
  function warning(message) {
    log2.warning(`${fullTitle} =>`, message);
  }
  function verbose(message) {
    log2.verbose(`${fullTitle} =>`, message);
  }
  function error(message) {
    log2.error(`${fullTitle} =>`, message);
  }
  return {
    title,
    fullTitle,
    info,
    warning,
    verbose,
    error
  };
}
function credentialLogger(title, log2 = logger) {
  const credLogger = credentialLoggerInstance(title, void 0, log2);
  return {
    ...credLogger,
    parent: log2,
    getToken: credentialLoggerInstance("=> getToken()", credLogger, log2)
  };
}
var logger;
var init_logging = __esm({
  "node_modules/@azure/identity/dist/esm/util/logging.js"() {
    init_esm();
    logger = createClientLogger2("identity");
  }
});

// node_modules/@azure/core-tracing/dist/esm/tracingContext.js
function createTracingContext(options = {}) {
  let context3 = new TracingContextImpl(options.parentContext);
  if (options.span) {
    context3 = context3.setValue(knownContextKeys.span, options.span);
  }
  if (options.namespace) {
    context3 = context3.setValue(knownContextKeys.namespace, options.namespace);
  }
  return context3;
}
var knownContextKeys, TracingContextImpl;
var init_tracingContext = __esm({
  "node_modules/@azure/core-tracing/dist/esm/tracingContext.js"() {
    knownContextKeys = {
      span: Symbol.for("@azure/core-tracing span"),
      namespace: Symbol.for("@azure/core-tracing namespace")
    };
    TracingContextImpl = class _TracingContextImpl {
      _contextMap;
      constructor(initialContext) {
        this._contextMap = initialContext instanceof _TracingContextImpl ? new Map(initialContext._contextMap) : /* @__PURE__ */ new Map();
      }
      setValue(key, value) {
        const newContext = new _TracingContextImpl(this);
        newContext._contextMap.set(key, value);
        return newContext;
      }
      getValue(key) {
        return this._contextMap.get(key);
      }
      deleteValue(key) {
        const newContext = new _TracingContextImpl(this);
        newContext._contextMap.delete(key);
        return newContext;
      }
    };
  }
});

// node_modules/@azure/core-tracing/dist/commonjs/state-cjs.js
var require_state_cjs = __commonJS({
  "node_modules/@azure/core-tracing/dist/commonjs/state-cjs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.state = void 0;
    exports.state = {
      instrumenterImplementation: void 0
    };
  }
});

// node_modules/@azure/core-tracing/dist/esm/state.js
var import_state_cjs, state;
var init_state = __esm({
  "node_modules/@azure/core-tracing/dist/esm/state.js"() {
    import_state_cjs = __toESM(require_state_cjs(), 1);
    state = import_state_cjs.state;
  }
});

// node_modules/@azure/core-tracing/dist/esm/instrumenter.js
function createDefaultTracingSpan() {
  return {
    end: () => {
    },
    isRecording: () => false,
    recordException: () => {
    },
    setAttribute: () => {
    },
    setStatus: () => {
    },
    addEvent: () => {
    }
  };
}
function createDefaultInstrumenter() {
  return {
    createRequestHeaders: () => {
      return {};
    },
    parseTraceparentHeader: () => {
      return void 0;
    },
    startSpan: (_name, spanOptions) => {
      return {
        span: createDefaultTracingSpan(),
        tracingContext: createTracingContext({ parentContext: spanOptions.tracingContext })
      };
    },
    withContext(_context, callback, ...callbackArgs) {
      return callback(...callbackArgs);
    }
  };
}
function getInstrumenter() {
  if (!state.instrumenterImplementation) {
    state.instrumenterImplementation = createDefaultInstrumenter();
  }
  return state.instrumenterImplementation;
}
var init_instrumenter = __esm({
  "node_modules/@azure/core-tracing/dist/esm/instrumenter.js"() {
    init_tracingContext();
    init_state();
  }
});

// node_modules/@azure/core-tracing/dist/esm/tracingClient.js
function createTracingClient(options) {
  const { namespace, packageName, packageVersion } = options;
  function startSpan(name2, operationOptions, spanOptions) {
    const startSpanResult = getInstrumenter().startSpan(name2, {
      ...spanOptions,
      packageName,
      packageVersion,
      tracingContext: operationOptions?.tracingOptions?.tracingContext
    });
    let tracingContext = startSpanResult.tracingContext;
    const span = startSpanResult.span;
    if (!tracingContext.getValue(knownContextKeys.namespace)) {
      tracingContext = tracingContext.setValue(knownContextKeys.namespace, namespace);
    }
    span.setAttribute("az.namespace", tracingContext.getValue(knownContextKeys.namespace));
    const updatedOptions = Object.assign({}, operationOptions, {
      tracingOptions: { ...operationOptions?.tracingOptions, tracingContext }
    });
    return {
      span,
      updatedOptions
    };
  }
  async function withSpan(name2, operationOptions, callback, spanOptions) {
    const { span, updatedOptions } = startSpan(name2, operationOptions, spanOptions);
    try {
      const result = await withContext(updatedOptions.tracingOptions.tracingContext, () => callback(updatedOptions, span));
      span.setStatus({ status: "success" });
      return result;
    } catch (err) {
      span.setStatus({ status: "error", error: err });
      throw err;
    } finally {
      span.end();
    }
  }
  function withContext(context3, callback, ...callbackArgs) {
    return getInstrumenter().withContext(context3, callback, ...callbackArgs);
  }
  function parseTraceparentHeader(traceparentHeader) {
    return getInstrumenter().parseTraceparentHeader(traceparentHeader);
  }
  function createRequestHeaders(tracingContext) {
    return getInstrumenter().createRequestHeaders(tracingContext);
  }
  return {
    startSpan,
    withSpan,
    withContext,
    parseTraceparentHeader,
    createRequestHeaders
  };
}
var init_tracingClient = __esm({
  "node_modules/@azure/core-tracing/dist/esm/tracingClient.js"() {
    init_instrumenter();
    init_tracingContext();
  }
});

// node_modules/@azure/core-tracing/dist/esm/index.js
var init_esm2 = __esm({
  "node_modules/@azure/core-tracing/dist/esm/index.js"() {
    init_instrumenter();
    init_tracingClient();
  }
});

// node_modules/@azure/identity/dist/esm/util/tracing.js
var tracingClient;
var init_tracing = __esm({
  "node_modules/@azure/identity/dist/esm/util/tracing.js"() {
    init_constants();
    init_esm2();
    tracingClient = createTracingClient({
      namespace: "Microsoft.AAD",
      packageName: "@azure/identity",
      packageVersion: SDK_VERSION
    });
  }
});

// node_modules/@azure/identity/dist/esm/credentials/chainedTokenCredential.js
var logger2;
var init_chainedTokenCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/chainedTokenCredential.js"() {
    init_errors();
    init_logging();
    init_tracing();
    logger2 = credentialLogger("ChainedTokenCredential");
  }
});

// node_modules/@azure/msal-node/dist/cache/serializer/Serializer.mjs
var init_Serializer = __esm({
  "node_modules/@azure/msal-node/dist/cache/serializer/Serializer.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-common/dist/constants/AADServerParamKeys.mjs
var AADServerParamKeys_exports = {};
__export(AADServerParamKeys_exports, {
  ACCESS_TOKEN: () => ACCESS_TOKEN,
  ATTRIBUTE_TOKENS: () => ATTRIBUTE_TOKENS,
  BROKER_CLIENT_ID: () => BROKER_CLIENT_ID,
  BROKER_REDIRECT_URI: () => BROKER_REDIRECT_URI,
  CCS_HEADER: () => CCS_HEADER,
  CLAIMS: () => CLAIMS,
  CLIENT_ASSERTION: () => CLIENT_ASSERTION,
  CLIENT_ASSERTION_TYPE: () => CLIENT_ASSERTION_TYPE,
  CLIENT_ID: () => CLIENT_ID,
  CLIENT_INFO: () => CLIENT_INFO,
  CLIENT_REQUEST_ID: () => CLIENT_REQUEST_ID,
  CLIENT_SECRET: () => CLIENT_SECRET,
  CLI_DATA: () => CLI_DATA,
  CODE: () => CODE,
  CODE_CHALLENGE: () => CODE_CHALLENGE,
  CODE_CHALLENGE_METHOD: () => CODE_CHALLENGE_METHOD,
  CODE_VERIFIER: () => CODE_VERIFIER,
  DEVICE_CODE: () => DEVICE_CODE,
  DOMAIN_HINT: () => DOMAIN_HINT,
  DPOP_JKT: () => DPOP_JKT,
  EAR_JWE_CRYPTO: () => EAR_JWE_CRYPTO,
  EAR_JWK: () => EAR_JWK,
  ERROR: () => ERROR,
  ERROR_DESCRIPTION: () => ERROR_DESCRIPTION,
  EXPIRES_IN: () => EXPIRES_IN,
  FMI_PATH: () => FMI_PATH,
  FOCI: () => FOCI,
  GRANT_TYPE: () => GRANT_TYPE,
  ID_TOKEN: () => ID_TOKEN,
  ID_TOKEN_HINT: () => ID_TOKEN_HINT,
  INSTANCE_AWARE: () => INSTANCE_AWARE,
  LOGIN_HINT: () => LOGIN_HINT,
  LOGOUT_HINT: () => LOGOUT_HINT,
  NATIVE_BROKER: () => NATIVE_BROKER,
  NONCE: () => NONCE,
  OBO_ASSERTION: () => OBO_ASSERTION,
  ON_BEHALF_OF: () => ON_BEHALF_OF,
  POST_LOGOUT_URI: () => POST_LOGOUT_URI,
  PROMPT: () => PROMPT,
  REDIRECT_URI: () => REDIRECT_URI,
  REFRESH_TOKEN: () => REFRESH_TOKEN,
  REFRESH_TOKEN_EXPIRES_IN: () => REFRESH_TOKEN_EXPIRES_IN,
  REQUESTED_TOKEN_USE: () => REQUESTED_TOKEN_USE,
  REQ_CNF: () => REQ_CNF,
  RESOURCE: () => RESOURCE,
  RESPONSE_MODE: () => RESPONSE_MODE,
  RESPONSE_TYPE: () => RESPONSE_TYPE,
  RETURN_SPA_CODE: () => RETURN_SPA_CODE,
  SCOPE: () => SCOPE,
  SESSION_STATE: () => SESSION_STATE,
  SID: () => SID,
  STATE: () => STATE,
  TOKEN_TYPE: () => TOKEN_TYPE,
  USERNAME: () => USERNAME,
  USER_FEDERATED_IDENTITY_CREDENTIAL: () => USER_FEDERATED_IDENTITY_CREDENTIAL,
  USER_ID: () => USER_ID,
  X_APP_NAME: () => X_APP_NAME,
  X_APP_VER: () => X_APP_VER,
  X_CLIENT_CPU: () => X_CLIENT_CPU,
  X_CLIENT_CURR_TELEM: () => X_CLIENT_CURR_TELEM,
  X_CLIENT_EXTRA_SKU: () => X_CLIENT_EXTRA_SKU,
  X_CLIENT_LAST_TELEM: () => X_CLIENT_LAST_TELEM,
  X_CLIENT_OS: () => X_CLIENT_OS,
  X_CLIENT_SKU: () => X_CLIENT_SKU,
  X_CLIENT_VER: () => X_CLIENT_VER,
  X_MS_LIB_CAPABILITY: () => X_MS_LIB_CAPABILITY
});
var CLIENT_ID, REDIRECT_URI, RESPONSE_TYPE, RESPONSE_MODE, GRANT_TYPE, CLAIMS, SCOPE, ERROR, ERROR_DESCRIPTION, ACCESS_TOKEN, ID_TOKEN, REFRESH_TOKEN, EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, STATE, NONCE, PROMPT, SESSION_STATE, CLIENT_INFO, CODE, CODE_CHALLENGE, CODE_CHALLENGE_METHOD, CODE_VERIFIER, CLIENT_REQUEST_ID, X_CLIENT_SKU, X_CLIENT_VER, X_CLIENT_OS, X_CLIENT_CPU, X_CLIENT_CURR_TELEM, X_CLIENT_LAST_TELEM, X_MS_LIB_CAPABILITY, X_APP_NAME, X_APP_VER, POST_LOGOUT_URI, ID_TOKEN_HINT, DEVICE_CODE, CLIENT_SECRET, CLIENT_ASSERTION, CLIENT_ASSERTION_TYPE, TOKEN_TYPE, REQ_CNF, DPOP_JKT, OBO_ASSERTION, REQUESTED_TOKEN_USE, ON_BEHALF_OF, FOCI, CCS_HEADER, RETURN_SPA_CODE, NATIVE_BROKER, LOGOUT_HINT, SID, LOGIN_HINT, DOMAIN_HINT, X_CLIENT_EXTRA_SKU, BROKER_CLIENT_ID, BROKER_REDIRECT_URI, INSTANCE_AWARE, EAR_JWK, EAR_JWE_CRYPTO, RESOURCE, CLI_DATA, USER_FEDERATED_IDENTITY_CREDENTIAL, USERNAME, USER_ID, FMI_PATH, ATTRIBUTE_TOKENS;
var init_AADServerParamKeys = __esm({
  "node_modules/@azure/msal-common/dist/constants/AADServerParamKeys.mjs"() {
    "use strict";
    CLIENT_ID = "client_id";
    REDIRECT_URI = "redirect_uri";
    RESPONSE_TYPE = "response_type";
    RESPONSE_MODE = "response_mode";
    GRANT_TYPE = "grant_type";
    CLAIMS = "claims";
    SCOPE = "scope";
    ERROR = "error";
    ERROR_DESCRIPTION = "error_description";
    ACCESS_TOKEN = "access_token";
    ID_TOKEN = "id_token";
    REFRESH_TOKEN = "refresh_token";
    EXPIRES_IN = "expires_in";
    REFRESH_TOKEN_EXPIRES_IN = "refresh_token_expires_in";
    STATE = "state";
    NONCE = "nonce";
    PROMPT = "prompt";
    SESSION_STATE = "session_state";
    CLIENT_INFO = "client_info";
    CODE = "code";
    CODE_CHALLENGE = "code_challenge";
    CODE_CHALLENGE_METHOD = "code_challenge_method";
    CODE_VERIFIER = "code_verifier";
    CLIENT_REQUEST_ID = "client-request-id";
    X_CLIENT_SKU = "x-client-SKU";
    X_CLIENT_VER = "x-client-VER";
    X_CLIENT_OS = "x-client-OS";
    X_CLIENT_CPU = "x-client-CPU";
    X_CLIENT_CURR_TELEM = "x-client-current-telemetry";
    X_CLIENT_LAST_TELEM = "x-client-last-telemetry";
    X_MS_LIB_CAPABILITY = "x-ms-lib-capability";
    X_APP_NAME = "x-app-name";
    X_APP_VER = "x-app-ver";
    POST_LOGOUT_URI = "post_logout_redirect_uri";
    ID_TOKEN_HINT = "id_token_hint";
    DEVICE_CODE = "device_code";
    CLIENT_SECRET = "client_secret";
    CLIENT_ASSERTION = "client_assertion";
    CLIENT_ASSERTION_TYPE = "client_assertion_type";
    TOKEN_TYPE = "token_type";
    REQ_CNF = "req_cnf";
    DPOP_JKT = "dpop_jkt";
    OBO_ASSERTION = "assertion";
    REQUESTED_TOKEN_USE = "requested_token_use";
    ON_BEHALF_OF = "on_behalf_of";
    FOCI = "foci";
    CCS_HEADER = "X-AnchorMailbox";
    RETURN_SPA_CODE = "return_spa_code";
    NATIVE_BROKER = "nativebroker";
    LOGOUT_HINT = "logout_hint";
    SID = "sid";
    LOGIN_HINT = "login_hint";
    DOMAIN_HINT = "domain_hint";
    X_CLIENT_EXTRA_SKU = "x-client-xtra-sku";
    BROKER_CLIENT_ID = "brk_client_id";
    BROKER_REDIRECT_URI = "brk_redirect_uri";
    INSTANCE_AWARE = "instance_aware";
    EAR_JWK = "ear_jwk";
    EAR_JWE_CRYPTO = "ear_jwe_crypto";
    RESOURCE = "resource";
    CLI_DATA = "clidata";
    USER_FEDERATED_IDENTITY_CREDENTIAL = "user_federated_identity_credential";
    USERNAME = "username";
    USER_ID = "user_id";
    FMI_PATH = "fmi_path";
    ATTRIBUTE_TOKENS = "attribute_tokens";
  }
});

// node_modules/@azure/msal-common/dist/utils/Constants.mjs
var Constants_exports = {};
__export(Constants_exports, {
  AADAuthority: () => AADAuthority,
  AAD_INSTANCE_DISCOVERY_ENDPT: () => AAD_INSTANCE_DISCOVERY_ENDPT,
  AAD_TENANT_DOMAIN_SUFFIX: () => AAD_TENANT_DOMAIN_SUFFIX,
  ADFS: () => ADFS,
  APP_METADATA: () => APP_METADATA,
  AUTHORITY_METADATA_CACHE_KEY: () => AUTHORITY_METADATA_CACHE_KEY,
  AUTHORITY_METADATA_REFRESH_TIME_SECONDS: () => AUTHORITY_METADATA_REFRESH_TIME_SECONDS,
  AUTHORIZATION_PENDING: () => AUTHORIZATION_PENDING,
  AZURE_REGION_AUTO_DISCOVER_FLAG: () => AZURE_REGION_AUTO_DISCOVER_FLAG,
  AuthenticationScheme: () => AuthenticationScheme,
  AuthorityMetadataSource: () => AuthorityMetadataSource,
  CACHE_ACCOUNT_TYPE_ADFS: () => CACHE_ACCOUNT_TYPE_ADFS,
  CACHE_ACCOUNT_TYPE_GENERIC: () => CACHE_ACCOUNT_TYPE_GENERIC,
  CACHE_ACCOUNT_TYPE_MSAV1: () => CACHE_ACCOUNT_TYPE_MSAV1,
  CACHE_ACCOUNT_TYPE_MSSTS: () => CACHE_ACCOUNT_TYPE_MSSTS,
  CACHE_KEY_SEPARATOR: () => CACHE_KEY_SEPARATOR,
  CIAM_AUTH_URL: () => CIAM_AUTH_URL,
  CLIENT_INFO: () => CLIENT_INFO2,
  CLIENT_INFO_SEPARATOR: () => CLIENT_INFO_SEPARATOR,
  CLIENT_MISMATCH_ERROR: () => CLIENT_MISMATCH_ERROR,
  CODE_GRANT_TYPE: () => CODE_GRANT_TYPE,
  CONSUMER_UTID: () => CONSUMER_UTID,
  CacheOutcome: () => CacheOutcome,
  CacheType: () => CacheType,
  ClaimsRequestKeys: () => ClaimsRequestKeys,
  CodeChallengeMethodValues: () => CodeChallengeMethodValues,
  CredentialType: () => CredentialType,
  DEFAULT_AUTHORITY: () => DEFAULT_AUTHORITY,
  DEFAULT_AUTHORITY_HOST: () => DEFAULT_AUTHORITY_HOST,
  DEFAULT_COMMON_TENANT: () => DEFAULT_COMMON_TENANT,
  DEFAULT_MAX_THROTTLE_TIME_SECONDS: () => DEFAULT_MAX_THROTTLE_TIME_SECONDS,
  DEFAULT_THROTTLE_TIME_SECONDS: () => DEFAULT_THROTTLE_TIME_SECONDS,
  DEFAULT_TOKEN_RENEWAL_OFFSET_SEC: () => DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
  EMAIL_SCOPE: () => EMAIL_SCOPE,
  EncodingTypes: () => EncodingTypes,
  FORWARD_SLASH: () => FORWARD_SLASH,
  GrantType: () => GrantType,
  HTTP_BAD_REQUEST: () => HTTP_BAD_REQUEST,
  HTTP_CLIENT_ERROR: () => HTTP_CLIENT_ERROR,
  HTTP_CLIENT_ERROR_RANGE_END: () => HTTP_CLIENT_ERROR_RANGE_END,
  HTTP_CLIENT_ERROR_RANGE_START: () => HTTP_CLIENT_ERROR_RANGE_START,
  HTTP_GATEWAY_TIMEOUT: () => HTTP_GATEWAY_TIMEOUT,
  HTTP_GONE: () => HTTP_GONE,
  HTTP_MULTI_SIDED_ERROR: () => HTTP_MULTI_SIDED_ERROR,
  HTTP_NOT_FOUND: () => HTTP_NOT_FOUND,
  HTTP_REDIRECT: () => HTTP_REDIRECT,
  HTTP_REQUEST_TIMEOUT: () => HTTP_REQUEST_TIMEOUT,
  HTTP_SERVER_ERROR: () => HTTP_SERVER_ERROR,
  HTTP_SERVER_ERROR_RANGE_END: () => HTTP_SERVER_ERROR_RANGE_END,
  HTTP_SERVER_ERROR_RANGE_START: () => HTTP_SERVER_ERROR_RANGE_START,
  HTTP_SERVICE_UNAVAILABLE: () => HTTP_SERVICE_UNAVAILABLE,
  HTTP_SUCCESS: () => HTTP_SUCCESS,
  HTTP_SUCCESS_RANGE_END: () => HTTP_SUCCESS_RANGE_END,
  HTTP_SUCCESS_RANGE_START: () => HTTP_SUCCESS_RANGE_START,
  HTTP_TOO_MANY_REQUESTS: () => HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED: () => HTTP_UNAUTHORIZED,
  HeaderNames: () => HeaderNames,
  HttpMethod: () => HttpMethod,
  IMDS_ENDPOINT: () => IMDS_ENDPOINT,
  IMDS_TIMEOUT: () => IMDS_TIMEOUT,
  IMDS_VERSION: () => IMDS_VERSION,
  INVALID_GRANT_ERROR: () => INVALID_GRANT_ERROR,
  INVALID_INSTANCE: () => INVALID_INSTANCE,
  JsonWebTokenTypes: () => JsonWebTokenTypes,
  KNOWN_PUBLIC_CLOUDS: () => KNOWN_PUBLIC_CLOUDS,
  NOT_APPLICABLE: () => NOT_APPLICABLE,
  NOT_AVAILABLE: () => NOT_AVAILABLE,
  OAuthResponseType: () => OAuthResponseType,
  OFFLINE_ACCESS_SCOPE: () => OFFLINE_ACCESS_SCOPE,
  OIDC_DEFAULT_SCOPES: () => OIDC_DEFAULT_SCOPES,
  OIDC_SCOPES: () => OIDC_SCOPES,
  ONE_DAY_IN_MS: () => ONE_DAY_IN_MS,
  OPENID_SCOPE: () => OPENID_SCOPE,
  PROFILE_SCOPE: () => PROFILE_SCOPE,
  PasswordGrantConstants: () => PasswordGrantConstants,
  PersistentCacheKeys: () => PersistentCacheKeys,
  PromptValue: () => PromptValue,
  REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX: () => REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX,
  RESOURCE_DELIM: () => RESOURCE_DELIM,
  RegionDiscoveryOutcomes: () => RegionDiscoveryOutcomes,
  RegionDiscoverySources: () => RegionDiscoverySources,
  ResponseMode: () => ResponseMode,
  S256_CODE_CHALLENGE_METHOD: () => S256_CODE_CHALLENGE_METHOD,
  SERVER_TELEM_CACHE_KEY: () => SERVER_TELEM_CACHE_KEY,
  SERVER_TELEM_CATEGORY_SEPARATOR: () => SERVER_TELEM_CATEGORY_SEPARATOR,
  SERVER_TELEM_MAX_CACHED_ERRORS: () => SERVER_TELEM_MAX_CACHED_ERRORS,
  SERVER_TELEM_MAX_CUR_HEADER_BYTES: () => SERVER_TELEM_MAX_CUR_HEADER_BYTES,
  SERVER_TELEM_MAX_LAST_HEADER_BYTES: () => SERVER_TELEM_MAX_LAST_HEADER_BYTES,
  SERVER_TELEM_OVERFLOW_FALSE: () => SERVER_TELEM_OVERFLOW_FALSE,
  SERVER_TELEM_OVERFLOW_TRUE: () => SERVER_TELEM_OVERFLOW_TRUE,
  SERVER_TELEM_SCHEMA_VERSION: () => SERVER_TELEM_SCHEMA_VERSION,
  SERVER_TELEM_UNKNOWN_ERROR: () => SERVER_TELEM_UNKNOWN_ERROR,
  SERVER_TELEM_VALUE_SEPARATOR: () => SERVER_TELEM_VALUE_SEPARATOR,
  SHR_NONCE_VALIDITY: () => SHR_NONCE_VALIDITY,
  SKU: () => SKU,
  THE_FAMILY_ID: () => THE_FAMILY_ID,
  THROTTLING_PREFIX: () => THROTTLING_PREFIX,
  URL_FORM_CONTENT_TYPE: () => URL_FORM_CONTENT_TYPE,
  X_MS_LIB_CAPABILITY_VALUE: () => X_MS_LIB_CAPABILITY_VALUE
});
var SKU, DEFAULT_AUTHORITY, DEFAULT_AUTHORITY_HOST, DEFAULT_COMMON_TENANT, ADFS, AAD_INSTANCE_DISCOVERY_ENDPT, CIAM_AUTH_URL, AAD_TENANT_DOMAIN_SUFFIX, RESOURCE_DELIM, CONSUMER_UTID, OPENID_SCOPE, PROFILE_SCOPE, OFFLINE_ACCESS_SCOPE, EMAIL_SCOPE, CODE_GRANT_TYPE, S256_CODE_CHALLENGE_METHOD, URL_FORM_CONTENT_TYPE, AUTHORIZATION_PENDING, NOT_APPLICABLE, NOT_AVAILABLE, FORWARD_SLASH, IMDS_ENDPOINT, IMDS_VERSION, IMDS_TIMEOUT, AZURE_REGION_AUTO_DISCOVER_FLAG, REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX, KNOWN_PUBLIC_CLOUDS, SHR_NONCE_VALIDITY, INVALID_INSTANCE, HTTP_SUCCESS, HTTP_SUCCESS_RANGE_START, HTTP_SUCCESS_RANGE_END, HTTP_REDIRECT, HTTP_CLIENT_ERROR, HTTP_CLIENT_ERROR_RANGE_START, HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED, HTTP_NOT_FOUND, HTTP_REQUEST_TIMEOUT, HTTP_GONE, HTTP_TOO_MANY_REQUESTS, HTTP_CLIENT_ERROR_RANGE_END, HTTP_SERVER_ERROR, HTTP_SERVER_ERROR_RANGE_START, HTTP_SERVICE_UNAVAILABLE, HTTP_GATEWAY_TIMEOUT, HTTP_SERVER_ERROR_RANGE_END, HTTP_MULTI_SIDED_ERROR, HttpMethod, OIDC_DEFAULT_SCOPES, OIDC_SCOPES, HeaderNames, PersistentCacheKeys, AADAuthority, ClaimsRequestKeys, PromptValue, CodeChallengeMethodValues, OAuthResponseType, ResponseMode, GrantType, CACHE_ACCOUNT_TYPE_MSSTS, CACHE_ACCOUNT_TYPE_ADFS, CACHE_ACCOUNT_TYPE_MSAV1, CACHE_ACCOUNT_TYPE_GENERIC, CACHE_KEY_SEPARATOR, CLIENT_INFO_SEPARATOR, CredentialType, CacheType, APP_METADATA, CLIENT_INFO2, THE_FAMILY_ID, AUTHORITY_METADATA_CACHE_KEY, AUTHORITY_METADATA_REFRESH_TIME_SECONDS, AuthorityMetadataSource, SERVER_TELEM_SCHEMA_VERSION, SERVER_TELEM_MAX_CUR_HEADER_BYTES, SERVER_TELEM_MAX_LAST_HEADER_BYTES, SERVER_TELEM_MAX_CACHED_ERRORS, SERVER_TELEM_CACHE_KEY, SERVER_TELEM_CATEGORY_SEPARATOR, SERVER_TELEM_VALUE_SEPARATOR, SERVER_TELEM_OVERFLOW_TRUE, SERVER_TELEM_OVERFLOW_FALSE, SERVER_TELEM_UNKNOWN_ERROR, AuthenticationScheme, DEFAULT_THROTTLE_TIME_SECONDS, DEFAULT_MAX_THROTTLE_TIME_SECONDS, THROTTLING_PREFIX, X_MS_LIB_CAPABILITY_VALUE, INVALID_GRANT_ERROR, CLIENT_MISMATCH_ERROR, PasswordGrantConstants, RegionDiscoverySources, RegionDiscoveryOutcomes, CacheOutcome, JsonWebTokenTypes, ONE_DAY_IN_MS, DEFAULT_TOKEN_RENEWAL_OFFSET_SEC, EncodingTypes;
var init_Constants = __esm({
  "node_modules/@azure/msal-common/dist/utils/Constants.mjs"() {
    "use strict";
    SKU = "msal.js.common";
    DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common/";
    DEFAULT_AUTHORITY_HOST = "login.microsoftonline.com";
    DEFAULT_COMMON_TENANT = "common";
    ADFS = "adfs";
    AAD_INSTANCE_DISCOVERY_ENDPT = `${DEFAULT_AUTHORITY}discovery/instance?api-version=1.1&authorization_endpoint=`;
    CIAM_AUTH_URL = ".ciamlogin.com";
    AAD_TENANT_DOMAIN_SUFFIX = ".onmicrosoft.com";
    RESOURCE_DELIM = "|";
    CONSUMER_UTID = "9188040d-6c67-4c5b-b112-36a304b66dad";
    OPENID_SCOPE = "openid";
    PROFILE_SCOPE = "profile";
    OFFLINE_ACCESS_SCOPE = "offline_access";
    EMAIL_SCOPE = "email";
    CODE_GRANT_TYPE = "authorization_code";
    S256_CODE_CHALLENGE_METHOD = "S256";
    URL_FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
    AUTHORIZATION_PENDING = "authorization_pending";
    NOT_APPLICABLE = "N/A";
    NOT_AVAILABLE = "Not Available";
    FORWARD_SLASH = "/";
    IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute";
    IMDS_VERSION = "2021-02-01";
    IMDS_TIMEOUT = 2e3;
    AZURE_REGION_AUTO_DISCOVER_FLAG = "TryAutoDetect";
    REGIONAL_AUTH_PUBLIC_CLOUD_SUFFIX = "login.microsoft.com";
    KNOWN_PUBLIC_CLOUDS = [
      "login.microsoftonline.com",
      "login.windows.net",
      "login.microsoft.com",
      "sts.windows.net"
    ];
    SHR_NONCE_VALIDITY = 240;
    INVALID_INSTANCE = "invalid_instance";
    HTTP_SUCCESS = 200;
    HTTP_SUCCESS_RANGE_START = 200;
    HTTP_SUCCESS_RANGE_END = 299;
    HTTP_REDIRECT = 302;
    HTTP_CLIENT_ERROR = 400;
    HTTP_CLIENT_ERROR_RANGE_START = 400;
    HTTP_BAD_REQUEST = 400;
    HTTP_UNAUTHORIZED = 401;
    HTTP_NOT_FOUND = 404;
    HTTP_REQUEST_TIMEOUT = 408;
    HTTP_GONE = 410;
    HTTP_TOO_MANY_REQUESTS = 429;
    HTTP_CLIENT_ERROR_RANGE_END = 499;
    HTTP_SERVER_ERROR = 500;
    HTTP_SERVER_ERROR_RANGE_START = 500;
    HTTP_SERVICE_UNAVAILABLE = 503;
    HTTP_GATEWAY_TIMEOUT = 504;
    HTTP_SERVER_ERROR_RANGE_END = 599;
    HTTP_MULTI_SIDED_ERROR = 600;
    HttpMethod = {
      GET: "GET",
      POST: "POST"
    };
    OIDC_DEFAULT_SCOPES = [
      OPENID_SCOPE,
      PROFILE_SCOPE,
      OFFLINE_ACCESS_SCOPE
    ];
    OIDC_SCOPES = [...OIDC_DEFAULT_SCOPES, EMAIL_SCOPE];
    HeaderNames = {
      CONTENT_TYPE: "Content-Type",
      CONTENT_LENGTH: "Content-Length",
      DPOP: "DPoP",
      RETRY_AFTER: "Retry-After",
      CCS_HEADER: "X-AnchorMailbox",
      WWWAuthenticate: "WWW-Authenticate",
      AuthenticationInfo: "Authentication-Info",
      X_MS_REQUEST_ID: "x-ms-request-id",
      X_MS_HTTP_VERSION: "x-ms-httpver"
    };
    PersistentCacheKeys = {
      ACTIVE_ACCOUNT_FILTERS: "active-account-filters"
      // new cache entry for active_account for a more robust version for browser
    };
    AADAuthority = {
      COMMON: "common",
      ORGANIZATIONS: "organizations",
      CONSUMERS: "consumers"
    };
    ClaimsRequestKeys = {
      ACCESS_TOKEN: "access_token",
      XMS_CC: "xms_cc",
      ID_TOKEN: "id_token",
      SIGNIN_STATE: "signin_state",
      LOGIN_HINT: "login_hint",
      TENANT_REGION_SUB_SCOPE: "tenant_region_sub_scope"
    };
    PromptValue = {
      LOGIN: "login",
      SELECT_ACCOUNT: "select_account",
      CONSENT: "consent",
      NONE: "none",
      CREATE: "create",
      NO_SESSION: "no_session"
    };
    CodeChallengeMethodValues = {
      PLAIN: "plain",
      S256: "S256"
    };
    OAuthResponseType = {
      CODE: "code",
      IDTOKEN_TOKEN: "id_token token",
      IDTOKEN_TOKEN_REFRESHTOKEN: "id_token token refresh_token"
    };
    ResponseMode = {
      QUERY: "query",
      FRAGMENT: "fragment",
      FORM_POST: "form_post"
    };
    GrantType = {
      IMPLICIT_GRANT: "implicit",
      AUTHORIZATION_CODE_GRANT: "authorization_code",
      CLIENT_CREDENTIALS_GRANT: "client_credentials",
      RESOURCE_OWNER_PASSWORD_GRANT: "password",
      REFRESH_TOKEN_GRANT: "refresh_token",
      DEVICE_CODE_GRANT: "device_code",
      JWT_BEARER: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      USER_FIC: "user_fic"
    };
    CACHE_ACCOUNT_TYPE_MSSTS = "MSSTS";
    CACHE_ACCOUNT_TYPE_ADFS = "ADFS";
    CACHE_ACCOUNT_TYPE_MSAV1 = "MSA";
    CACHE_ACCOUNT_TYPE_GENERIC = "Generic";
    CACHE_KEY_SEPARATOR = "-";
    CLIENT_INFO_SEPARATOR = ".";
    CredentialType = {
      ID_TOKEN: "IdToken",
      ACCESS_TOKEN: "AccessToken",
      ACCESS_TOKEN_WITH_AUTH_SCHEME: "AccessToken_With_AuthScheme",
      REFRESH_TOKEN: "RefreshToken"
    };
    CacheType = {
      ADFS: 1001,
      MSA: 1002,
      MSSTS: 1003,
      GENERIC: 1004,
      ACCESS_TOKEN: 2001,
      REFRESH_TOKEN: 2002,
      ID_TOKEN: 2003,
      APP_METADATA: 3001,
      UNDEFINED: 9999
    };
    APP_METADATA = "appmetadata";
    CLIENT_INFO2 = "client_info";
    THE_FAMILY_ID = "1";
    AUTHORITY_METADATA_CACHE_KEY = "authority-metadata";
    AUTHORITY_METADATA_REFRESH_TIME_SECONDS = 3600 * 24;
    AuthorityMetadataSource = {
      CONFIG: "config",
      CACHE: "cache",
      NETWORK: "network",
      HARDCODED_VALUES: "hardcoded_values"
    };
    SERVER_TELEM_SCHEMA_VERSION = 5;
    SERVER_TELEM_MAX_CUR_HEADER_BYTES = 80;
    SERVER_TELEM_MAX_LAST_HEADER_BYTES = 330;
    SERVER_TELEM_MAX_CACHED_ERRORS = 50;
    SERVER_TELEM_CACHE_KEY = "server-telemetry";
    SERVER_TELEM_CATEGORY_SEPARATOR = "|";
    SERVER_TELEM_VALUE_SEPARATOR = ",";
    SERVER_TELEM_OVERFLOW_TRUE = "1";
    SERVER_TELEM_OVERFLOW_FALSE = "0";
    SERVER_TELEM_UNKNOWN_ERROR = "unknown_error";
    AuthenticationScheme = {
      BEARER: "Bearer",
      POP: "pop",
      DPOP: "DPoP",
      SSH: "ssh-cert"
    };
    DEFAULT_THROTTLE_TIME_SECONDS = 60;
    DEFAULT_MAX_THROTTLE_TIME_SECONDS = 3600;
    THROTTLING_PREFIX = "throttling";
    X_MS_LIB_CAPABILITY_VALUE = "retry-after, h429";
    INVALID_GRANT_ERROR = "invalid_grant";
    CLIENT_MISMATCH_ERROR = "client_mismatch";
    PasswordGrantConstants = {
      username: "username",
      password: "password"
    };
    RegionDiscoverySources = {
      FAILED_AUTO_DETECTION: "1",
      INTERNAL_CACHE: "2",
      ENVIRONMENT_VARIABLE: "3",
      IMDS: "4"
    };
    RegionDiscoveryOutcomes = {
      CONFIGURED_MATCHES_DETECTED: "1",
      CONFIGURED_NO_AUTO_DETECTION: "2",
      CONFIGURED_NOT_DETECTED: "3",
      AUTO_DETECTION_REQUESTED_SUCCESSFUL: "4",
      AUTO_DETECTION_REQUESTED_FAILED: "5"
    };
    CacheOutcome = {
      // When a token is found in the cache or the cache is not supposed to be hit when making the request
      NOT_APPLICABLE: "0",
      // When the token request goes to the identity provider because force_refresh was set to true. Also occurs if claims were requested
      FORCE_REFRESH_OR_CLAIMS: "1",
      // When the token request goes to the identity provider because no cached access token exists
      NO_CACHED_ACCESS_TOKEN: "2",
      // When the token request goes to the identity provider because cached access token expired
      CACHED_ACCESS_TOKEN_EXPIRED: "3",
      // When the token request goes to the identity provider because refresh_in was used and the existing token needs to be refreshed
      PROACTIVELY_REFRESHED: "4"
    };
    JsonWebTokenTypes = {
      Jwt: "JWT",
      Jwk: "JWK",
      Pop: "pop",
      Dpop: "dpop+jwt"
    };
    ONE_DAY_IN_MS = 864e5;
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = 300;
    EncodingTypes = {
      BASE64: "base64",
      HEX: "hex",
      UTF8: "utf-8"
    };
  }
});

// node_modules/@azure/msal-common/dist/error/AuthError.mjs
function getDefaultErrorMessage(code) {
  return `See https://aka.ms/msal.js.errors#${code} for details`;
}
function createAuthError(code, correlationId, additionalMessage) {
  return new AuthError2(code, correlationId, additionalMessage || getDefaultErrorMessage(code));
}
var AuthError2;
var init_AuthError = __esm({
  "node_modules/@azure/msal-common/dist/error/AuthError.mjs"() {
    "use strict";
    AuthError2 = class _AuthError extends Error {
      constructor(errorCode, correlationId, errorMessage, suberror) {
        const message = errorMessage || (errorCode ? getDefaultErrorMessage(errorCode) : "");
        const errorString = message ? `${errorCode}: ${message}` : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, _AuthError.prototype);
        this.errorCode = errorCode || "";
        this.errorMessage = message || "";
        this.subError = suberror || "";
        this.correlationId = correlationId;
        this.name = "AuthError";
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/ClientAuthError.mjs
function createClientAuthError(errorCode, correlationId, additionalMessage) {
  return new ClientAuthError(errorCode, correlationId, additionalMessage);
}
var ClientAuthError;
var init_ClientAuthError = __esm({
  "node_modules/@azure/msal-common/dist/error/ClientAuthError.mjs"() {
    "use strict";
    init_AuthError();
    ClientAuthError = class _ClientAuthError extends AuthError2 {
      constructor(errorCode, correlationId, additionalMessage) {
        super(errorCode, correlationId, additionalMessage);
        this.name = "ClientAuthError";
        Object.setPrototypeOf(this, _ClientAuthError.prototype);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/ClientAuthErrorCodes.mjs
var ClientAuthErrorCodes_exports = {};
__export(ClientAuthErrorCodes_exports, {
  authorizationCodeMissingFromServerResponse: () => authorizationCodeMissingFromServerResponse,
  bindingKeyNotRemoved: () => bindingKeyNotRemoved,
  cannotAppendScopeSet: () => cannotAppendScopeSet,
  cannotRemoveEmptyScope: () => cannotRemoveEmptyScope,
  clientInfoDecodingError: () => clientInfoDecodingError,
  clientInfoEmptyError: () => clientInfoEmptyError,
  dpopTokenTypeMismatch: () => dpopTokenTypeMismatch,
  emptyInputScopeSet: () => emptyInputScopeSet,
  endSessionEndpointNotSupported: () => endSessionEndpointNotSupported,
  endpointResolutionError: () => endpointResolutionError,
  hashNotDeserialized: () => hashNotDeserialized,
  invalidCacheEnvironment: () => invalidCacheEnvironment,
  invalidCacheRecord: () => invalidCacheRecord,
  invalidState: () => invalidState,
  keyIdMissing: () => keyIdMissing,
  methodNotImplemented: () => methodNotImplemented,
  misplacedResourceParam: () => misplacedResourceParam,
  multipleMatchingAppMetadata: () => multipleMatchingAppMetadata,
  multipleMatchingTokens: () => multipleMatchingTokens,
  nestedAppAuthBridgeDisabled: () => nestedAppAuthBridgeDisabled,
  networkError: () => networkError,
  noAccountFound: () => noAccountFound,
  noAccountInSilentRequest: () => noAccountInSilentRequest,
  noCryptoObject: () => noCryptoObject,
  noNetworkConnectivity: () => noNetworkConnectivity,
  nonceMismatch: () => nonceMismatch,
  nullOrEmptyToken: () => nullOrEmptyToken,
  openIdConfigError: () => openIdConfigError,
  platformBrokerError: () => platformBrokerError,
  requestCannotBeMade: () => requestCannotBeMade,
  resourceParameterRequired: () => resourceParameterRequired,
  stateMismatch: () => stateMismatch,
  stateNotFound: () => stateNotFound,
  tokenClaimsCnfRequiredForSignedJwt: () => tokenClaimsCnfRequiredForSignedJwt,
  tokenParsingError: () => tokenParsingError,
  tokenRefreshRequired: () => tokenRefreshRequired,
  unexpectedCredentialType: () => unexpectedCredentialType,
  userCanceled: () => userCanceled
});
var clientInfoDecodingError, clientInfoEmptyError, tokenParsingError, nullOrEmptyToken, endpointResolutionError, networkError, openIdConfigError, hashNotDeserialized, invalidState, stateMismatch, stateNotFound, nonceMismatch, multipleMatchingTokens, multipleMatchingAppMetadata, requestCannotBeMade, cannotRemoveEmptyScope, cannotAppendScopeSet, emptyInputScopeSet, noAccountInSilentRequest, invalidCacheRecord, invalidCacheEnvironment, noAccountFound, noCryptoObject, unexpectedCredentialType, dpopTokenTypeMismatch, tokenRefreshRequired, tokenClaimsCnfRequiredForSignedJwt, authorizationCodeMissingFromServerResponse, bindingKeyNotRemoved, endSessionEndpointNotSupported, keyIdMissing, noNetworkConnectivity, userCanceled, methodNotImplemented, nestedAppAuthBridgeDisabled, platformBrokerError, resourceParameterRequired, misplacedResourceParam;
var init_ClientAuthErrorCodes = __esm({
  "node_modules/@azure/msal-common/dist/error/ClientAuthErrorCodes.mjs"() {
    "use strict";
    clientInfoDecodingError = "client_info_decoding_error";
    clientInfoEmptyError = "client_info_empty_error";
    tokenParsingError = "token_parsing_error";
    nullOrEmptyToken = "null_or_empty_token";
    endpointResolutionError = "endpoints_resolution_error";
    networkError = "network_error";
    openIdConfigError = "openid_config_error";
    hashNotDeserialized = "hash_not_deserialized";
    invalidState = "invalid_state";
    stateMismatch = "state_mismatch";
    stateNotFound = "state_not_found";
    nonceMismatch = "nonce_mismatch";
    multipleMatchingTokens = "multiple_matching_tokens";
    multipleMatchingAppMetadata = "multiple_matching_appMetadata";
    requestCannotBeMade = "request_cannot_be_made";
    cannotRemoveEmptyScope = "cannot_remove_empty_scope";
    cannotAppendScopeSet = "cannot_append_scopeset";
    emptyInputScopeSet = "empty_input_scopeset";
    noAccountInSilentRequest = "no_account_in_silent_request";
    invalidCacheRecord = "invalid_cache_record";
    invalidCacheEnvironment = "invalid_cache_environment";
    noAccountFound = "no_account_found";
    noCryptoObject = "no_crypto_object";
    unexpectedCredentialType = "unexpected_credential_type";
    dpopTokenTypeMismatch = "dpop_token_type_mismatch";
    tokenRefreshRequired = "token_refresh_required";
    tokenClaimsCnfRequiredForSignedJwt = "token_claims_cnf_required_for_signedjwt";
    authorizationCodeMissingFromServerResponse = "authorization_code_missing_from_server_response";
    bindingKeyNotRemoved = "binding_key_not_removed";
    endSessionEndpointNotSupported = "end_session_endpoint_not_supported";
    keyIdMissing = "key_id_missing";
    noNetworkConnectivity = "no_network_connectivity";
    userCanceled = "user_canceled";
    methodNotImplemented = "method_not_implemented";
    nestedAppAuthBridgeDisabled = "nested_app_auth_bridge_disabled";
    platformBrokerError = "platform_broker_error";
    resourceParameterRequired = "resource_parameter_required";
    misplacedResourceParam = "misplaced_resource_parameter";
  }
});

// node_modules/@azure/msal-common/dist/account/ClientInfo.mjs
function buildClientInfo(rawClientInfo, base64Decode) {
  if (!rawClientInfo) {
    throw createClientAuthError(clientInfoEmptyError, "");
  }
  try {
    const decodedClientInfo = base64Decode(rawClientInfo);
    return JSON.parse(decodedClientInfo);
  } catch (e) {
    throw createClientAuthError(clientInfoDecodingError, "");
  }
}
var init_ClientInfo = __esm({
  "node_modules/@azure/msal-common/dist/account/ClientInfo.mjs"() {
    "use strict";
    init_ClientAuthError();
    init_ClientAuthErrorCodes();
  }
});

// node_modules/@azure/msal-common/dist/account/AuthToken.mjs
function extractTokenClaims(encodedToken, base64Decode, correlationId) {
  const jswPayload = getJWSPayload(encodedToken, correlationId);
  try {
    const base64Decoded = base64Decode(jswPayload);
    return JSON.parse(base64Decoded);
  } catch (err) {
    throw createClientAuthError(tokenParsingError, correlationId);
  }
}
function isKmsi(idTokenClaims) {
  if (!idTokenClaims.signin_state) {
    return false;
  }
  const kmsiClaims = ["kmsi", "dvc_dmjd"];
  return idTokenClaims.signin_state.some((value) => kmsiClaims.includes(value.trim().toLowerCase()));
}
function getJWSPayload(authToken, correlationId) {
  if (!authToken) {
    throw createClientAuthError(nullOrEmptyToken, correlationId);
  }
  const tokenPartsRegex = /^([^\.\s]*)\.([^\.\s]+)\.([^\.\s]*)$/;
  const matches = tokenPartsRegex.exec(authToken);
  if (!matches || matches.length < 4) {
    throw createClientAuthError(tokenParsingError, correlationId);
  }
  return matches[2];
}
var init_AuthToken = __esm({
  "node_modules/@azure/msal-common/dist/account/AuthToken.mjs"() {
    "use strict";
    init_ClientAuthError();
    init_ClientAuthErrorCodes();
  }
});

// node_modules/@azure/msal-common/dist/account/AccountInfo.mjs
function tenantIdMatchesHomeTenant(tenantId, homeAccountId) {
  return !!tenantId && !!homeAccountId && tenantId === homeAccountId.split(".")[1];
}
function buildTenantProfile(homeAccountId, localAccountId, tenantId, nativeAccountId, idTokenClaims) {
  if (idTokenClaims) {
    const { oid, sub, tid, name: name2, tfp, acr, preferred_username, upn, login_hint } = idTokenClaims;
    const tenantId2 = tid || tfp || acr || "";
    return {
      tenantId: tenantId2,
      localAccountId: oid || sub || "",
      name: name2,
      username: preferred_username || upn || "",
      loginHint: login_hint,
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId2, homeAccountId),
      upn,
      ...nativeAccountId && { nativeAccountId }
    };
  } else {
    return {
      tenantId,
      localAccountId,
      username: "",
      isHomeTenant: tenantIdMatchesHomeTenant(tenantId, homeAccountId),
      ...nativeAccountId && { nativeAccountId }
    };
  }
}
function updateAccountTenantProfileData(baseAccountInfo, tenantProfile, idTokenClaims, idTokenSecret) {
  let updatedAccountInfo = baseAccountInfo;
  if (tenantProfile) {
    const { isHomeTenant, ...tenantProfileOverride } = tenantProfile;
    updatedAccountInfo = { ...baseAccountInfo, ...tenantProfileOverride };
  }
  if (idTokenClaims) {
    const { isHomeTenant, ...claimsSourcedTenantProfile } = buildTenantProfile(baseAccountInfo.homeAccountId, baseAccountInfo.localAccountId, baseAccountInfo.tenantId, updatedAccountInfo.nativeAccountId, idTokenClaims);
    updatedAccountInfo = {
      ...updatedAccountInfo,
      ...claimsSourcedTenantProfile,
      idTokenClaims,
      idToken: idTokenSecret,
      kmsi: isKmsi(idTokenClaims)
    };
    return updatedAccountInfo;
  }
  return updatedAccountInfo;
}
var init_AccountInfo = __esm({
  "node_modules/@azure/msal-common/dist/account/AccountInfo.mjs"() {
    "use strict";
    init_AuthToken();
  }
});

// node_modules/@azure/msal-common/dist/authority/AuthorityType.mjs
var AuthorityType;
var init_AuthorityType = __esm({
  "node_modules/@azure/msal-common/dist/authority/AuthorityType.mjs"() {
    "use strict";
    AuthorityType = {
      Default: 0,
      Adfs: 1,
      Ciam: 3
    };
  }
});

// node_modules/@azure/msal-common/dist/account/TokenClaims.mjs
function getTenantIdFromIdTokenClaims(idTokenClaims) {
  if (idTokenClaims) {
    const tenantId = idTokenClaims.tid || idTokenClaims.tfp || idTokenClaims.acr;
    return tenantId || null;
  }
  return null;
}
var init_TokenClaims = __esm({
  "node_modules/@azure/msal-common/dist/account/TokenClaims.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-common/dist/authority/ProtocolMode.mjs
var ProtocolMode;
var init_ProtocolMode = __esm({
  "node_modules/@azure/msal-common/dist/authority/ProtocolMode.mjs"() {
    "use strict";
    ProtocolMode = {
      /**
       * Auth Code + PKCE with Entra ID (formerly AAD) specific optimizations and features
       */
      AAD: "AAD",
      /**
       * Auth Code + PKCE without Entra ID specific optimizations and features. For use only with non-Microsoft owned authorities.
       * Support is limited for this mode.
       */
      OIDC: "OIDC",
      /**
       * Encrypted Authorize Response (EAR) with Entra ID specific optimizations and features
       */
      EAR: "EAR"
    };
  }
});

// node_modules/@azure/msal-common/dist/cache/utils/AccountEntityUtils.mjs
function getAccountInfo(accountEntity) {
  const tenantProfiles = accountEntity.tenantProfiles || [];
  if (tenantProfiles.length === 0 && accountEntity.realm && accountEntity.localAccountId) {
    tenantProfiles.push(buildTenantProfile(accountEntity.homeAccountId, accountEntity.localAccountId, accountEntity.realm, accountEntity.nativeAccountId));
  }
  const homeTenantProfile = tenantProfiles.find((tp) => tp.tenantId === accountEntity.realm);
  const nativeAccountId = homeTenantProfile?.nativeAccountId || accountEntity.nativeAccountId;
  return {
    homeAccountId: accountEntity.homeAccountId,
    environment: accountEntity.environment,
    tenantId: accountEntity.realm,
    username: accountEntity.username,
    localAccountId: accountEntity.localAccountId,
    loginHint: accountEntity.loginHint,
    name: accountEntity.name,
    nativeAccountId,
    authorityType: accountEntity.authorityType,
    // Deserialize tenant profiles array into a Map
    tenantProfiles: new Map(tenantProfiles.map((tenantProfile) => {
      return [tenantProfile.tenantId, tenantProfile];
    })),
    dataBoundary: accountEntity.dataBoundary
  };
}
function createAccountEntity(accountDetails, authority, correlationId, base64Decode) {
  let authorityType;
  if (authority.authorityType === AuthorityType.Adfs) {
    authorityType = CACHE_ACCOUNT_TYPE_ADFS;
  } else if (authority.protocolMode === ProtocolMode.OIDC) {
    authorityType = CACHE_ACCOUNT_TYPE_GENERIC;
  } else {
    authorityType = CACHE_ACCOUNT_TYPE_MSSTS;
  }
  let clientInfo;
  let dataBoundary;
  if (accountDetails.clientInfo && base64Decode) {
    clientInfo = buildClientInfo(accountDetails.clientInfo, base64Decode);
    if (clientInfo.xms_tdbr) {
      dataBoundary = clientInfo.xms_tdbr === "EU" ? "EU" : "None";
    }
  }
  const env = accountDetails.environment || authority && authority.getPreferredCache();
  if (!env) {
    throw createClientAuthError(invalidCacheEnvironment, correlationId);
  }
  const preferredUsername = accountDetails.idTokenClaims?.preferred_username || accountDetails.idTokenClaims?.upn;
  const email = accountDetails.idTokenClaims?.emails ? accountDetails.idTokenClaims.emails[0] : null;
  const username = preferredUsername || email || "";
  const loginHint = accountDetails.idTokenClaims?.login_hint;
  const realm = clientInfo?.utid || getTenantIdFromIdTokenClaims(accountDetails.idTokenClaims) || "";
  const localAccountId = clientInfo?.uid || accountDetails.idTokenClaims?.oid || accountDetails.idTokenClaims?.sub || "";
  let tenantProfiles;
  if (accountDetails.tenantProfiles) {
    tenantProfiles = accountDetails.tenantProfiles;
  } else {
    const tenantProfile = buildTenantProfile(accountDetails.homeAccountId, localAccountId, realm, accountDetails.nativeAccountId, accountDetails.idTokenClaims);
    tenantProfiles = [tenantProfile];
  }
  return {
    homeAccountId: accountDetails.homeAccountId,
    environment: env,
    realm,
    localAccountId,
    username,
    authorityType,
    loginHint,
    clientInfo: accountDetails.clientInfo,
    name: accountDetails.idTokenClaims?.name || "",
    lastModificationTime: void 0,
    lastModificationApp: void 0,
    cloudGraphHostName: accountDetails.cloudGraphHostName,
    msGraphHost: accountDetails.msGraphHost,
    nativeAccountId: accountDetails.nativeAccountId,
    tenantProfiles,
    dataBoundary
  };
}
function generateHomeAccountId(serverClientInfo, authType, logger27, cryptoObj, correlationId, idTokenClaims) {
  if (authType !== AuthorityType.Adfs) {
    if (serverClientInfo) {
      try {
        const clientInfo = buildClientInfo(serverClientInfo, cryptoObj.base64Decode);
        if (clientInfo.uid && clientInfo.utid) {
          return `${clientInfo.uid}.${clientInfo.utid}`;
        }
      } catch (e) {
      }
    }
    logger27.warning("No client info in response", correlationId);
  }
  return idTokenClaims?.sub || "";
}
var init_AccountEntityUtils = __esm({
  "node_modules/@azure/msal-common/dist/cache/utils/AccountEntityUtils.mjs"() {
    "use strict";
    init_Constants();
    init_ClientInfo();
    init_AccountInfo();
    init_ClientAuthError();
    init_AuthorityType();
    init_TokenClaims();
    init_ProtocolMode();
    init_ClientAuthErrorCodes();
  }
});

// node_modules/@azure/msal-common/dist/error/ClientConfigurationError.mjs
function createClientConfigurationError(errorCode, correlationId) {
  return new ClientConfigurationError(errorCode, correlationId);
}
var ClientConfigurationError;
var init_ClientConfigurationError = __esm({
  "node_modules/@azure/msal-common/dist/error/ClientConfigurationError.mjs"() {
    "use strict";
    init_AuthError();
    ClientConfigurationError = class _ClientConfigurationError extends AuthError2 {
      constructor(errorCode, correlationId) {
        super(errorCode, correlationId);
        this.name = "ClientConfigurationError";
        Object.setPrototypeOf(this, _ClientConfigurationError.prototype);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/ClientConfigurationErrorCodes.mjs
var authorityUriInsecure, urlParseError, urlEmptyError, emptyInputScopesError, invalidDpopHtm, invalidDpopHtu, invalidDpopNonce, dpopMissingResourceContext;
var init_ClientConfigurationErrorCodes = __esm({
  "node_modules/@azure/msal-common/dist/error/ClientConfigurationErrorCodes.mjs"() {
    "use strict";
    authorityUriInsecure = "authority_uri_insecure";
    urlParseError = "url_parse_error";
    urlEmptyError = "empty_url_error";
    emptyInputScopesError = "empty_input_scopes_error";
    invalidDpopHtm = "invalid_dpop_htm";
    invalidDpopHtu = "invalid_dpop_htu";
    invalidDpopNonce = "invalid_dpop_nonce";
    dpopMissingResourceContext = "dpop_missing_resource_context";
  }
});

// node_modules/@azure/msal-common/dist/utils/StringUtils.mjs
var StringUtils;
var init_StringUtils = __esm({
  "node_modules/@azure/msal-common/dist/utils/StringUtils.mjs"() {
    "use strict";
    StringUtils = class {
      /**
       * Check if stringified object is empty
       * @param strObj
       */
      static isEmptyObj(strObj) {
        if (strObj) {
          try {
            const obj = JSON.parse(strObj);
            return Object.keys(obj).length === 0;
          } catch (e) {
          }
        }
        return true;
      }
      static startsWith(str, search) {
        return str.indexOf(search) === 0;
      }
      static endsWith(str, search) {
        return str.length >= search.length && str.lastIndexOf(search) === str.length - search.length;
      }
      /**
       * Parses string into an object.
       *
       * @param query
       */
      static queryStringToObject(query) {
        const obj = {};
        const params = query.split("&");
        const decode = (s) => decodeURIComponent(s.replace(/\+/g, " "));
        params.forEach((pair) => {
          if (pair.trim()) {
            const [key, value] = pair.split(/=(.+)/g, 2);
            if (key && value) {
              obj[decode(key)] = decode(value);
            }
          }
        });
        return obj;
      }
      /**
       * Trims entries in an array.
       *
       * @param arr
       */
      static trimArrayEntries(arr) {
        return arr.map((entry) => entry.trim());
      }
      /**
       * Removes empty strings from array
       * @param arr
       */
      static removeEmptyStringsFromArray(arr) {
        return arr.filter((entry) => {
          return !!entry;
        });
      }
      /**
       * Attempts to parse a string into JSON
       * @param str
       */
      static jsonParseHelper(str) {
        try {
          return JSON.parse(str);
        } catch (e) {
          return null;
        }
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/url/UrlString.mjs
var UrlString;
var init_UrlString = __esm({
  "node_modules/@azure/msal-common/dist/url/UrlString.mjs"() {
    "use strict";
    init_ClientConfigurationError();
    init_StringUtils();
    init_Constants();
    init_ClientConfigurationErrorCodes();
    UrlString = class _UrlString {
      get urlString() {
        return this._urlString;
      }
      constructor(url, correlationId) {
        this._urlString = url;
        this.correlationId = correlationId;
        if (!this._urlString) {
          throw createClientConfigurationError(urlEmptyError, correlationId);
        }
        if (!url.includes("#")) {
          this._urlString = _UrlString.canonicalizeUri(url);
        }
      }
      /**
       * Ensure urls are lower case and end with a / character.
       * @param url
       */
      static canonicalizeUri(url) {
        if (url) {
          let lowerCaseUrl = url.toLowerCase();
          if (StringUtils.endsWith(lowerCaseUrl, "?")) {
            lowerCaseUrl = lowerCaseUrl.slice(0, -1);
          } else if (StringUtils.endsWith(lowerCaseUrl, "?/")) {
            lowerCaseUrl = lowerCaseUrl.slice(0, -2);
          }
          if (!StringUtils.endsWith(lowerCaseUrl, "/")) {
            lowerCaseUrl += "/";
          }
          return lowerCaseUrl;
        }
        return url;
      }
      /**
       * Throws if urlString passed is not a valid authority URI string.
       */
      validateAsUri() {
        let components;
        try {
          components = this.getUrlComponents();
        } catch (e) {
          throw createClientConfigurationError(urlParseError, this.correlationId);
        }
        if (!components.HostNameAndPort || !components.PathSegments) {
          throw createClientConfigurationError(urlParseError, this.correlationId);
        }
        if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
          throw createClientConfigurationError(authorityUriInsecure, this.correlationId);
        }
      }
      /**
       * Given a url and a query string return the url with provided query string appended
       * @param url
       * @param queryString
       */
      static appendQueryString(url, queryString) {
        if (!queryString) {
          return url;
        }
        return url.indexOf("?") < 0 ? `${url}?${queryString}` : `${url}&${queryString}`;
      }
      /**
       * Returns a url with the hash removed
       * @param url
       */
      static removeHashFromUrl(url) {
        return _UrlString.canonicalizeUri(url.split("#")[0]);
      }
      /**
       * Given a url like https://a:b/common/d?e=f#g, and a tenantId, returns https://a:b/tenantId/d
       * @param href The url
       * @param tenantId The tenant id to replace
       */
      replaceTenantPath(tenantId) {
        const urlObject = this.getUrlComponents();
        const pathArray = urlObject.PathSegments;
        if (tenantId && pathArray.length !== 0 && (pathArray[0] === AADAuthority.COMMON || pathArray[0] === AADAuthority.ORGANIZATIONS)) {
          pathArray[0] = tenantId;
        }
        return _UrlString.constructAuthorityUriFromObject(urlObject, this.correlationId);
      }
      /**
       * Parses out the components from a url string.
       * @returns An object with the various components. Please cache this value insted of calling this multiple times on the same url.
       */
      getUrlComponents() {
        const regEx = RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?");
        const match = this.urlString.match(regEx);
        if (!match) {
          throw createClientConfigurationError(urlParseError, this.correlationId);
        }
        const urlComponents = {
          Protocol: match[1],
          HostNameAndPort: match[4],
          AbsolutePath: match[5],
          QueryString: match[7]
        };
        let pathSegments = urlComponents.AbsolutePath.split("/");
        pathSegments = pathSegments.filter((val) => val && val.length > 0);
        urlComponents.PathSegments = pathSegments;
        if (urlComponents.QueryString && urlComponents.QueryString.endsWith("/")) {
          urlComponents.QueryString = urlComponents.QueryString.substring(0, urlComponents.QueryString.length - 1);
        }
        return urlComponents;
      }
      static getDomainFromUrl(url, correlationId) {
        const regEx = RegExp("^([^:/?#]+://)?([^/?#]*)");
        const match = url.match(regEx);
        if (!match) {
          throw createClientConfigurationError(urlParseError, correlationId);
        }
        return match[2];
      }
      static getAbsoluteUrl(relativeUrl, baseUrl, correlationId) {
        if (relativeUrl[0] === FORWARD_SLASH) {
          const url = new _UrlString(baseUrl, correlationId);
          const baseComponents = url.getUrlComponents();
          return baseComponents.Protocol + "//" + baseComponents.HostNameAndPort + relativeUrl;
        }
        return relativeUrl;
      }
      static constructAuthorityUriFromObject(urlObject, correlationId) {
        return new _UrlString(urlObject.Protocol + "//" + urlObject.HostNameAndPort + "/" + urlObject.PathSegments.join("/"), correlationId);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/authority/AuthorityOptions.mjs
var AzureCloudInstance;
var init_AuthorityOptions = __esm({
  "node_modules/@azure/msal-common/dist/authority/AuthorityOptions.mjs"() {
    "use strict";
    AzureCloudInstance = {
      // AzureCloudInstance is not specified.
      None: "none",
      // Microsoft Azure public cloud
      AzurePublic: "https://login.microsoftonline.com",
      // Microsoft Chinese national/regional cloud
      AzureChina: "https://login.chinacloudapi.cn",
      // Microsoft German national/regional cloud ("Black Forest")
      AzureGermany: "https://login.microsoftonline.de",
      // US Government cloud
      AzureUsGovernment: "https://login.microsoftonline.us"
    };
  }
});

// node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvents.mjs
var PopTokenGenerateCnf;
var init_PerformanceEvents = __esm({
  "node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvents.mjs"() {
    "use strict";
    PopTokenGenerateCnf = "popTokenGenerateCnf";
  }
});

// node_modules/@azure/msal-common/dist/utils/FunctionWrappers.mjs
var invokeAsync;
var init_FunctionWrappers = __esm({
  "node_modules/@azure/msal-common/dist/utils/FunctionWrappers.mjs"() {
    "use strict";
    invokeAsync = (callback, eventName, logger27, telemetryClient, correlationId) => {
      return (...args) => {
        logger27.trace(`Executing function '${eventName}'`, correlationId);
        const inProgressEvent = telemetryClient.startMeasurement(eventName, correlationId);
        if (correlationId) {
          telemetryClient.incrementFields({ [`ext.${eventName}CallCount`]: 1 }, correlationId);
        }
        return callback(...args).then((response) => {
          logger27.trace(`Returning result from '${eventName}'`, correlationId);
          inProgressEvent.end({
            success: true
          });
          return response;
        }).catch((e) => {
          logger27.trace(`Error occurred in '${eventName}'`, correlationId);
          try {
            logger27.trace(JSON.stringify(e), correlationId);
          } catch (e2) {
            logger27.trace("Unable to print error message.", correlationId);
          }
          inProgressEvent.end({
            success: false
          }, e);
          throw e;
        });
      };
    };
  }
});

// node_modules/@azure/msal-common/dist/utils/TimeUtils.mjs
var TimeUtils_exports = {};
__export(TimeUtils_exports, {
  delay: () => delay,
  isCacheExpired: () => isCacheExpired,
  isTokenExpired: () => isTokenExpired,
  nowSeconds: () => nowSeconds,
  toDateFromSeconds: () => toDateFromSeconds,
  toSecondsFromDate: () => toSecondsFromDate,
  wasClockTurnedBack: () => wasClockTurnedBack
});
function nowSeconds() {
  return Math.round((/* @__PURE__ */ new Date()).getTime() / 1e3);
}
function toSecondsFromDate(date) {
  return date.getTime() / 1e3;
}
function toDateFromSeconds(seconds) {
  if (seconds) {
    return new Date(Number(seconds) * 1e3);
  }
  return /* @__PURE__ */ new Date();
}
function isTokenExpired(expiresOn, offset) {
  const expirationSec = Number(expiresOn) || 0;
  const offsetCurrentTimeSec = nowSeconds() + offset;
  return offsetCurrentTimeSec > expirationSec;
}
function isCacheExpired(lastUpdatedAt, cacheRetentionDays) {
  const cacheExpirationTimestamp = Number(lastUpdatedAt) + cacheRetentionDays * 24 * 60 * 60 * 1e3;
  return Date.now() > cacheExpirationTimestamp;
}
function wasClockTurnedBack(cachedAt) {
  const cachedAtSec = Number(cachedAt);
  return cachedAtSec > nowSeconds();
}
function delay(t, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), t));
}
var init_TimeUtils = __esm({
  "node_modules/@azure/msal-common/dist/utils/TimeUtils.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-common/dist/cache/utils/CacheHelpers.mjs
function createIdTokenEntity(homeAccountId, environment, idToken, clientId, tenantId) {
  const idTokenEntity = {
    credentialType: CredentialType.ID_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: idToken,
    realm: tenantId,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  return idTokenEntity;
}
function createAccessTokenEntity(homeAccountId, environment, accessToken, clientId, tenantId, scopes, expiresOn, extExpiresOn, base64Decode, correlationId, refreshOn, tokenType, userAssertionHash, keyId, additionalCacheKeyComponents) {
  const atEntity = {
    homeAccountId,
    credentialType: CredentialType.ACCESS_TOKEN,
    secret: accessToken,
    cachedAt: nowSeconds().toString(),
    expiresOn: expiresOn.toString(),
    extendedExpiresOn: extExpiresOn.toString(),
    environment,
    clientId,
    realm: tenantId,
    target: scopes,
    tokenType: tokenType || AuthenticationScheme.BEARER,
    lastUpdatedAt: Date.now().toString()
    // Set the last updated time to now
  };
  if (userAssertionHash) {
    atEntity.userAssertionHash = userAssertionHash;
  }
  if (refreshOn) {
    atEntity.refreshOn = refreshOn.toString();
  }
  const normalizedTokenType = atEntity.tokenType?.toLowerCase();
  if (atEntity.tokenType?.toLowerCase() !== AuthenticationScheme.BEARER.toLowerCase()) {
    atEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
    switch (normalizedTokenType) {
      case AuthenticationScheme.POP:
        const tokenClaims = extractTokenClaims(accessToken, base64Decode, correlationId);
        if (!tokenClaims?.cnf?.kid) {
          throw createClientAuthError(tokenClaimsCnfRequiredForSignedJwt, correlationId);
        }
        atEntity.keyId = tokenClaims.cnf.kid;
        break;
      case "dpop":
        if (!keyId) {
          throw createClientAuthError(keyIdMissing, correlationId);
        }
        atEntity.keyId = keyId;
        break;
      case AuthenticationScheme.SSH:
        atEntity.keyId = keyId;
    }
  }
  if (additionalCacheKeyComponents && Object.keys(additionalCacheKeyComponents).length > 0) {
    atEntity.additionalCacheKeyComponents = additionalCacheKeyComponents;
  }
  return atEntity;
}
function createRefreshTokenEntity(homeAccountId, environment, refreshToken, clientId, familyId, userAssertionHash, expiresOn) {
  const rtEntity = {
    credentialType: CredentialType.REFRESH_TOKEN,
    homeAccountId,
    environment,
    clientId,
    secret: refreshToken,
    lastUpdatedAt: Date.now().toString()
  };
  if (userAssertionHash) {
    rtEntity.userAssertionHash = userAssertionHash;
  }
  if (familyId) {
    rtEntity.familyId = familyId;
  }
  if (expiresOn) {
    rtEntity.expiresOn = expiresOn.toString();
  }
  return rtEntity;
}
function serializeAttributeTokens(attributeTokens) {
  if (!attributeTokens || attributeTokens.length === 0) {
    return void 0;
  }
  return [...attributeTokens].sort().join(" ");
}
var init_CacheHelpers = __esm({
  "node_modules/@azure/msal-common/dist/cache/utils/CacheHelpers.mjs"() {
    "use strict";
    init_AuthToken();
    init_ClientAuthError();
    init_Constants();
    init_TimeUtils();
    init_ClientAuthErrorCodes();
  }
});

// node_modules/@azure/msal-common/dist/request/ScopeSet.mjs
var ScopeSet;
var init_ScopeSet = __esm({
  "node_modules/@azure/msal-common/dist/request/ScopeSet.mjs"() {
    "use strict";
    init_ClientConfigurationError();
    init_StringUtils();
    init_ClientAuthError();
    init_Constants();
    init_ClientConfigurationErrorCodes();
    init_ClientAuthErrorCodes();
    ScopeSet = class _ScopeSet {
      constructor(inputScopes, correlationId) {
        this.correlationId = correlationId;
        const scopeArr = inputScopes ? StringUtils.trimArrayEntries([...inputScopes]) : [];
        const filteredInput = scopeArr ? StringUtils.removeEmptyStringsFromArray(scopeArr) : [];
        if (!filteredInput || !filteredInput.length) {
          throw createClientConfigurationError(emptyInputScopesError, correlationId);
        }
        this.scopes = /* @__PURE__ */ new Set();
        filteredInput.forEach((scope) => this.scopes.add(scope));
      }
      /**
       * Factory method to create ScopeSet from space-delimited string
       * @param inputScopeString
       * @param appClientId
       * @param scopesRequired
       */
      static fromString(inputScopeString, correlationId) {
        const scopeString = inputScopeString || "";
        const inputScopes = scopeString.split(" ");
        return new _ScopeSet(inputScopes, correlationId);
      }
      /**
       * Creates the set of scopes to search for in cache lookups
       * @param inputScopeString
       * @returns
       */
      static createSearchScopes(inputScopeString, correlationId) {
        const scopesToUse = inputScopeString && inputScopeString.length > 0 ? inputScopeString : [...OIDC_DEFAULT_SCOPES];
        const scopeSet = new _ScopeSet(scopesToUse, correlationId);
        if (!scopeSet.containsOnlyOIDCScopes()) {
          scopeSet.removeOIDCScopes();
        } else {
          scopeSet.removeScope(OFFLINE_ACCESS_SCOPE);
        }
        return scopeSet;
      }
      /**
       * Check if a given scope is present in this set of scopes.
       * @param scope
       */
      containsScope(scope) {
        const lowerCaseScopes = this.printScopesLowerCase().split(" ");
        const lowerCaseScopesSet = new _ScopeSet(lowerCaseScopes, this.correlationId);
        return scope ? lowerCaseScopesSet.scopes.has(scope.toLowerCase()) : false;
      }
      /**
       * Check if a set of scopes is present in this set of scopes.
       * @param scopeSet
       */
      containsScopeSet(scopeSet) {
        if (!scopeSet || scopeSet.scopes.size <= 0) {
          return false;
        }
        return this.scopes.size >= scopeSet.scopes.size && scopeSet.asArray().every((scope) => this.containsScope(scope));
      }
      /**
       * Check if set of scopes contains only the defaults
       */
      containsOnlyOIDCScopes() {
        let defaultScopeCount = 0;
        OIDC_SCOPES.forEach((defaultScope) => {
          if (this.containsScope(defaultScope)) {
            defaultScopeCount += 1;
          }
        });
        return this.scopes.size === defaultScopeCount;
      }
      /**
       * Appends single scope if passed
       * @param newScope
       */
      appendScope(newScope) {
        if (newScope) {
          this.scopes.add(newScope.trim());
        }
      }
      /**
       * Appends multiple scopes if passed
       * @param newScopes
       */
      appendScopes(newScopes) {
        try {
          newScopes.forEach((newScope) => this.appendScope(newScope));
        } catch (e) {
          throw createClientAuthError(cannotAppendScopeSet, this.correlationId);
        }
      }
      /**
       * Removes element from set of scopes.
       * @param scope
       */
      removeScope(scope) {
        if (!scope) {
          throw createClientAuthError(cannotRemoveEmptyScope, this.correlationId);
        }
        this.scopes.delete(scope.trim());
      }
      /**
       * Removes default scopes from set of scopes
       * Primarily used to prevent cache misses if the default scopes are not returned from the server
       */
      removeOIDCScopes() {
        OIDC_SCOPES.forEach((defaultScope) => {
          this.scopes.delete(defaultScope);
        });
      }
      /**
       * Combines an array of scopes with the current set of scopes.
       * @param otherScopes
       */
      unionScopeSets(otherScopes) {
        if (!otherScopes) {
          throw createClientAuthError(emptyInputScopeSet, this.correlationId);
        }
        const unionScopes = /* @__PURE__ */ new Set();
        otherScopes.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
        this.scopes.forEach((scope) => unionScopes.add(scope.toLowerCase()));
        return unionScopes;
      }
      /**
       * Check if scopes intersect between this set and another.
       * @param otherScopes
       */
      intersectingScopeSets(otherScopes) {
        if (!otherScopes) {
          throw createClientAuthError(emptyInputScopeSet, this.correlationId);
        }
        if (!otherScopes.containsOnlyOIDCScopes()) {
          otherScopes.removeOIDCScopes();
        }
        const unionScopes = this.unionScopeSets(otherScopes);
        const sizeOtherScopes = otherScopes.getScopeCount();
        const sizeThisScopes = this.getScopeCount();
        const sizeUnionScopes = unionScopes.size;
        return sizeUnionScopes < sizeThisScopes + sizeOtherScopes;
      }
      /**
       * Returns size of set of scopes.
       */
      getScopeCount() {
        return this.scopes.size;
      }
      /**
       * Returns the scopes as an array of string values
       */
      asArray() {
        const array = [];
        this.scopes.forEach((val) => array.push(val));
        return array;
      }
      /**
       * Prints scopes into a space-delimited string
       */
      printScopes() {
        if (this.scopes) {
          const scopeArr = this.asArray();
          return scopeArr.join(" ");
        }
        return "";
      }
      /**
       * Prints scopes into a space-delimited lower-case string (used for caching)
       */
      printScopesLowerCase() {
        return this.printScopes().toLowerCase();
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/crypto/ICrypto.mjs
var JsonWebTokenAlgorithms;
var init_ICrypto = __esm({
  "node_modules/@azure/msal-common/dist/crypto/ICrypto.mjs"() {
    "use strict";
    JsonWebTokenAlgorithms = {
      ES256: "ES256",
      RS256: "RS256"
    };
  }
});

// node_modules/@azure/msal-common/dist/crypto/ITokenBindingKeyManager.mjs
var DEFAULT_TOKEN_BINDING_KEY_MANAGER;
var init_ITokenBindingKeyManager = __esm({
  "node_modules/@azure/msal-common/dist/crypto/ITokenBindingKeyManager.mjs"() {
    "use strict";
    init_ClientAuthError();
    init_ClientAuthErrorCodes();
    DEFAULT_TOKEN_BINDING_KEY_MANAGER = {
      async provisionTokenBindingKey(request) {
        throw createClientAuthError(methodNotImplemented, request.correlationId);
      },
      async removeTokenBindingKey(_kid, correlationId) {
        throw createClientAuthError(methodNotImplemented, correlationId);
      },
      async getTokenBindingPublicKeyJwk(_kid, correlationId) {
        throw createClientAuthError(methodNotImplemented, correlationId);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/logger/Logger.mjs
var LogLevel;
var init_Logger = __esm({
  "node_modules/@azure/msal-common/dist/logger/Logger.mjs"() {
    "use strict";
    (function(LogLevel2) {
      LogLevel2[LogLevel2["Error"] = 0] = "Error";
      LogLevel2[LogLevel2["Warning"] = 1] = "Warning";
      LogLevel2[LogLevel2["Info"] = 2] = "Info";
      LogLevel2[LogLevel2["Verbose"] = 3] = "Verbose";
      LogLevel2[LogLevel2["Trace"] = 4] = "Trace";
    })(LogLevel || (LogLevel = {}));
  }
});

// node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvent.mjs
var PerformanceEventStatus;
var init_PerformanceEvent = __esm({
  "node_modules/@azure/msal-common/dist/telemetry/performance/PerformanceEvent.mjs"() {
    "use strict";
    PerformanceEventStatus = {
      NotStarted: 0,
      InProgress: 1,
      Completed: 2
    };
  }
});

// node_modules/@azure/msal-common/dist/telemetry/performance/StubPerformanceClient.mjs
var StubPerformanceClient;
var init_StubPerformanceClient = __esm({
  "node_modules/@azure/msal-common/dist/telemetry/performance/StubPerformanceClient.mjs"() {
    "use strict";
    init_PerformanceEvent();
    StubPerformanceClient = class {
      generateId() {
        return "callback-id";
      }
      startMeasurement(measureName, correlationId) {
        return {
          end: () => null,
          discard: () => {
          },
          add: () => {
          },
          increment: () => {
          },
          event: {
            eventId: this.generateId(),
            status: PerformanceEventStatus.InProgress,
            authority: "",
            libraryName: "",
            libraryVersion: "",
            clientId: "",
            name: measureName,
            startTimeMs: Date.now(),
            correlationId: correlationId || ""
          }
        };
      }
      endMeasurement() {
        return null;
      }
      discardMeasurements() {
        return;
      }
      removePerformanceCallback() {
        return true;
      }
      addPerformanceCallback() {
        return "";
      }
      emitEvents() {
        return;
      }
      addFields() {
        return;
      }
      addGlobalFields() {
        return;
      }
      incrementFields() {
        return;
      }
      cacheEventByCorrelationId() {
        return;
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/cache/persistence/TokenCacheContext.mjs
var TokenCacheContext;
var init_TokenCacheContext = __esm({
  "node_modules/@azure/msal-common/dist/cache/persistence/TokenCacheContext.mjs"() {
    "use strict";
    TokenCacheContext = class {
      constructor(tokenCache, hasChanged) {
        this.cache = tokenCache;
        this.hasChanged = hasChanged;
      }
      /**
       * boolean which indicates the changes in cache
       */
      get cacheHasChanged() {
        return this.hasChanged;
      }
      /**
       * function to retrieve the token cache
       */
      get tokenCache() {
        return this.cache;
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/JoseHeaderError.mjs
function createJoseHeaderError(code, correlationId) {
  return new JoseHeaderError(code, correlationId);
}
var JoseHeaderError;
var init_JoseHeaderError = __esm({
  "node_modules/@azure/msal-common/dist/error/JoseHeaderError.mjs"() {
    "use strict";
    init_AuthError();
    JoseHeaderError = class _JoseHeaderError extends AuthError2 {
      constructor(errorCode, correlationId, errorMessage) {
        super(errorCode, correlationId, errorMessage);
        this.name = "JoseHeaderError";
        Object.setPrototypeOf(this, _JoseHeaderError.prototype);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/utils/ObjectUtils.mjs
function isPlainObject(value) {
  if (typeof value !== "object" || value === null || Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(value) === null) {
    return true;
  }
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
}
var init_ObjectUtils = __esm({
  "node_modules/@azure/msal-common/dist/utils/ObjectUtils.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-common/dist/error/JoseHeaderErrorCodes.mjs
var missingKidError, missingAlgError, missingJwkError, invalidJwkError;
var init_JoseHeaderErrorCodes = __esm({
  "node_modules/@azure/msal-common/dist/error/JoseHeaderErrorCodes.mjs"() {
    "use strict";
    missingKidError = "missing_kid_error";
    missingAlgError = "missing_alg_error";
    missingJwkError = "missing_jwk_error";
    invalidJwkError = "invalid_jwk_error";
  }
});

// node_modules/@azure/msal-common/dist/crypto/JoseHeader.mjs
var JoseHeader;
var init_JoseHeader = __esm({
  "node_modules/@azure/msal-common/dist/crypto/JoseHeader.mjs"() {
    "use strict";
    init_JoseHeaderError();
    init_ObjectUtils();
    init_Constants();
    init_JoseHeaderErrorCodes();
    JoseHeader = class _JoseHeader {
      constructor(options, correlationId) {
        if (typeof options.alg !== "string" || !options.alg) {
          throw createJoseHeaderError(missingAlgError, correlationId);
        }
        this.typ = options.typ;
        this.alg = options.alg;
        this.kid = options.kid;
        this.jwk = options.jwk;
      }
      /**
       * Builds SignedHttpRequest formatted JOSE Header from the
       * JOSE Header options provided or previously set on the object.
       * Throws if keyId or algorithm aren't provided since they are required for Access Token Binding.
       * @param shrHeaderOptions
       * @param correlationId
       * @returns
       */
      static getShrHeader(shrHeaderOptions, correlationId) {
        if (!shrHeaderOptions.kid) {
          throw createJoseHeaderError(missingKidError, correlationId);
        }
        if (!shrHeaderOptions.alg) {
          throw createJoseHeaderError(missingAlgError, correlationId);
        }
        return new _JoseHeader({
          // Access Token PoP headers must have type pop, but the type header can be overriden for special cases
          typ: shrHeaderOptions.typ || JsonWebTokenTypes.Pop,
          kid: shrHeaderOptions.kid,
          alg: shrHeaderOptions.alg
        }, correlationId);
      }
      /**
       * Builds a DPoP formatted JOSE Header from the JOSE Header options provided.
       * Throws if public JWK or algorithm aren't provided since they are required for DPoP.
       * @param dpopHeaderOptions
       * @param correlationId
       * @returns
       */
      static getDpopHeader(dpopHeaderOptions, correlationId) {
        if (!isPlainObject(dpopHeaderOptions.jwk)) {
          throw createJoseHeaderError(missingJwkError, correlationId);
        }
        if (!dpopHeaderOptions.alg) {
          throw createJoseHeaderError(missingAlgError, correlationId);
        }
        if (Object.keys(dpopHeaderOptions.jwk).length === 0) {
          throw createJoseHeaderError(invalidJwkError, correlationId);
        }
        return new _JoseHeader({
          typ: JsonWebTokenTypes.Dpop,
          alg: dpopHeaderOptions.alg,
          jwk: dpopHeaderOptions.jwk
        }, correlationId);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/crypto/PopTokenGenerator.mjs
var KeyLocation, SHR_TOKEN_BINDING_KEY_TYPE, SHR_TOKEN_BINDING_KEY_ALGORITHM, PopTokenGenerator;
var init_PopTokenGenerator = __esm({
  "node_modules/@azure/msal-common/dist/crypto/PopTokenGenerator.mjs"() {
    "use strict";
    init_ICrypto();
    init_TimeUtils();
    init_UrlString();
    init_PerformanceEvents();
    init_FunctionWrappers();
    init_JoseHeader();
    KeyLocation = {
      SW: "sw"
    };
    SHR_TOKEN_BINDING_KEY_TYPE = "shr";
    SHR_TOKEN_BINDING_KEY_ALGORITHM = JsonWebTokenAlgorithms.RS256;
    PopTokenGenerator = class {
      constructor(cryptoUtils, tokenBindingKeyManager, performanceClient) {
        this.cryptoUtils = cryptoUtils;
        this.tokenBindingKeyManager = tokenBindingKeyManager;
        this.performanceClient = performanceClient;
      }
      /**
       * Generates the req_cnf validated at the RP in the POP protocol for SHR parameters
       * and returns an object containing the keyid, the full req_cnf string and the req_cnf string hash
       * @param request
       * @returns
       */
      async generateCnf(request, logger27) {
        const reqCnf = await invokeAsync(this.generateKid.bind(this), PopTokenGenerateCnf, logger27, this.performanceClient, request.correlationId)(request);
        const reqCnfString = this.cryptoUtils.base64UrlEncode(JSON.stringify(reqCnf));
        return {
          kid: reqCnf.kid,
          reqCnfString
        };
      }
      /**
       * Generates key_id for a SHR token request
       * @param request
       * @returns
       */
      async generateKid(request) {
        const kidThumbprint = await this.tokenBindingKeyManager.provisionTokenBindingKey({
          correlationId: request.correlationId,
          tokenBindingKeyType: SHR_TOKEN_BINDING_KEY_TYPE,
          tokenBindingKeyAlgorithm: SHR_TOKEN_BINDING_KEY_ALGORITHM
        });
        return {
          kid: kidThumbprint,
          xms_ksl: KeyLocation.SW
        };
      }
      /**
       * Signs the POP access_token with the local generated key-pair
       * @param accessToken
       * @param request
       * @returns
       */
      async signPopToken(accessToken, keyId, request) {
        return this.signPayload(accessToken, keyId, request);
      }
      /**
       * Utility function to generate the signed JWT for an access_token
       * @param payload
       * @param kid
       * @param request
       * @param claims
       * @returns
       */
      async signPayload(payload, keyId, request, claims) {
        const { resourceRequestMethod, resourceRequestUri, shrClaims, shrNonce, shrOptions } = request;
        const resourceUrlString = resourceRequestUri ? new UrlString(resourceRequestUri, request.correlationId) : void 0;
        const resourceUrlComponents = resourceUrlString?.getUrlComponents();
        const publicKeyJwk = await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(keyId, request.correlationId);
        const encodedKeyIdThumbprint = this.cryptoUtils.base64UrlEncode(JSON.stringify({ kid: keyId }));
        const shrAlgorithm = shrOptions?.header?.alg || publicKeyJwk.alg || SHR_TOKEN_BINDING_KEY_ALGORITHM;
        const shrHeader = JoseHeader.getShrHeader({
          ...shrOptions?.header,
          alg: shrAlgorithm,
          kid: encodedKeyIdThumbprint
        }, request.correlationId);
        const shrPayload = {
          at: payload,
          ts: nowSeconds(),
          m: resourceRequestMethod?.toUpperCase(),
          u: resourceUrlComponents?.HostNameAndPort,
          nonce: shrNonce || this.cryptoUtils.createNewGuid(),
          p: resourceUrlComponents?.AbsolutePath,
          q: resourceUrlComponents?.QueryString ? [[], resourceUrlComponents.QueryString] : void 0,
          client_claims: shrClaims || void 0,
          ...claims,
          cnf: {
            jwk: publicKeyJwk
          }
        };
        return this.cryptoUtils.signTokenBindingJwt(shrHeader, shrPayload, keyId, request.correlationId);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/crypto/DpopProofGenerator.mjs
function buildProofHeader(publicJwk, correlationId) {
  return JoseHeader.getDpopHeader({
    alg: DPOP_JWT_HEADER_ALGORITHM,
    jwk: publicJwk
  }, correlationId);
}
function normalizeHtm(htm, correlationId) {
  if (typeof htm !== "string" || !DPOP_HTM_REGEX.test(htm)) {
    throw createClientConfigurationError(invalidDpopHtm, correlationId);
  }
  return htm.toUpperCase();
}
function normalizeHtu(url, correlationId) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw createClientConfigurationError(urlParseError, correlationId);
  }
  if (!/^https:\/\//i.test(url) || parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw createClientConfigurationError(invalidDpopHtu, correlationId);
  }
  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.href;
}
function validateDpopNonce(nonce, correlationId) {
  if (nonce !== void 0 && nonce.trim().length === 0) {
    throw createClientConfigurationError(invalidDpopNonce, correlationId);
  }
}
var DPOP_HTM_REGEX, DPOP_TOKEN_BINDING_KEY_TYPE, DPOP_JWT_HEADER_ALGORITHM, DpopProofGenerator;
var init_DpopProofGenerator = __esm({
  "node_modules/@azure/msal-common/dist/crypto/DpopProofGenerator.mjs"() {
    "use strict";
    init_ICrypto();
    init_TimeUtils();
    init_ClientConfigurationError();
    init_JoseHeader();
    init_ClientConfigurationErrorCodes();
    DPOP_HTM_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
    DPOP_TOKEN_BINDING_KEY_TYPE = "dpop";
    DPOP_JWT_HEADER_ALGORITHM = JsonWebTokenAlgorithms.ES256;
    DpopProofGenerator = class {
      constructor(cryptoUtils, tokenBindingKeyManager) {
        this.cryptoUtils = cryptoUtils;
        this.tokenBindingKeyManager = tokenBindingKeyManager;
      }
      /**
       * Provisions a fresh DPoP key and returns the RFC 7638 JWK thumbprint used
       * as `dpop_jkt`.
       */
      async generateJkt(correlationId = "") {
        return this.tokenBindingKeyManager.provisionTokenBindingKey({
          tokenBindingKeyType: DPOP_TOKEN_BINDING_KEY_TYPE,
          tokenBindingKeyAlgorithm: DPOP_JWT_HEADER_ALGORITHM,
          correlationId
        });
      }
      /**
       * Builds RFC 9449 claims for a token-endpoint DPoP proof.
       * - htm is always "POST" because token endpoint requests use HTTP POST (RFC 9449 §5).
       * - htu is the normalized token endpoint URI (query and fragment stripped).
       * - jti is a fresh CSPRNG-backed unique identifier for every proof.
       */
      buildTokenProofClaims(params, correlationId = "") {
        validateDpopNonce(params.nonce, correlationId);
        const claims = {
          jti: this.cryptoUtils.createNewGuid(),
          htm: "POST",
          htu: normalizeHtu(params.tokenEndpoint, correlationId),
          iat: nowSeconds()
        };
        if (params.nonce !== void 0) {
          claims.nonce = params.nonce;
        }
        return claims;
      }
      /**
       * Builds and signs a compact DPoP proof JWT for a token-endpoint request.
       */
      async generateTokenProof(params, keyId, correlationId = "") {
        return this.generateProof(this.buildTokenProofClaims(params, correlationId), keyId, correlationId);
      }
      /**
       * Builds RFC 9449 claims for a resource-endpoint DPoP proof.
       * - htm is uppercased per RFC 9449 §4.2.
       * - htu is the normalized resource URI (query and fragment stripped).
       * - ath is the base64url-encoded SHA-256 hash of the ASCII access token.
       * - jti is a fresh CSPRNG-backed unique identifier for every proof.
       */
      buildResourceProofClaims(params, correlationId = "") {
        validateDpopNonce(params.nonce, correlationId);
        const claims = {
          jti: this.cryptoUtils.createNewGuid(),
          htm: normalizeHtm(params.htm, correlationId),
          htu: normalizeHtu(params.htu, correlationId),
          ath: params.ath,
          iat: nowSeconds()
        };
        if (params.nonce !== void 0) {
          claims.nonce = params.nonce;
        }
        return claims;
      }
      /**
       * Builds and signs a compact DPoP proof JWT for a resource request.
       */
      async generateResourceProof(params, keyId, correlationId = "") {
        const { htu, htm, nonce } = params;
        if (!htu || !htm) {
          throw createClientConfigurationError(dpopMissingResourceContext, correlationId);
        }
        const ath = await this.cryptoUtils.hashString(params.accessToken);
        return this.generateProof(this.buildResourceProofClaims({
          htu,
          htm,
          ath,
          nonce
        }, correlationId), keyId, correlationId);
      }
      async generateProof(claims, keyId, correlationId) {
        const publicJwk = await this.tokenBindingKeyManager.getTokenBindingPublicKeyJwk(keyId, correlationId);
        return this.cryptoUtils.signTokenBindingJwt(buildProofHeader(publicJwk, correlationId), claims, keyId, correlationId);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthErrorCodes.mjs
var uiNotAllowed, interactionRequired, consentRequired, loginRequired, badToken, interruptedUser;
var init_InteractionRequiredAuthErrorCodes = __esm({
  "node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthErrorCodes.mjs"() {
    "use strict";
    uiNotAllowed = "ui_not_allowed";
    interactionRequired = "interaction_required";
    consentRequired = "consent_required";
    loginRequired = "login_required";
    badToken = "bad_token";
    interruptedUser = "interrupted_user";
  }
});

// node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthError.mjs
function isInteractionRequiredError(errorCode, errorString, subError) {
  const isInteractionRequiredErrorCode = !!errorCode && InteractionRequiredServerErrorMessage.indexOf(errorCode) > -1;
  const isInteractionRequiredSubError = !!subError && InteractionRequiredAuthSubErrorMessage.indexOf(subError) > -1;
  const isInteractionRequiredErrorDesc = !!errorString && InteractionRequiredServerErrorMessage.some((irErrorCode) => {
    return errorString.indexOf(irErrorCode) > -1;
  });
  return isInteractionRequiredErrorCode || isInteractionRequiredErrorDesc || isInteractionRequiredSubError;
}
var InteractionRequiredServerErrorMessage, InteractionRequiredAuthSubErrorMessage, InteractionRequiredAuthError;
var init_InteractionRequiredAuthError = __esm({
  "node_modules/@azure/msal-common/dist/error/InteractionRequiredAuthError.mjs"() {
    "use strict";
    init_AuthError();
    init_InteractionRequiredAuthErrorCodes();
    InteractionRequiredServerErrorMessage = [
      interactionRequired,
      consentRequired,
      loginRequired,
      badToken,
      uiNotAllowed,
      interruptedUser
    ];
    InteractionRequiredAuthSubErrorMessage = [
      "message_only",
      "additional_action",
      "basic_action",
      "user_password_expired",
      "consent_required",
      "bad_token",
      "ui_not_allowed",
      "interrupted_user"
    ];
    InteractionRequiredAuthError = class _InteractionRequiredAuthError extends AuthError2 {
      constructor(errorCode, correlationId, errorMessage, subError, timestamp, traceId, claims, errorNo) {
        super(errorCode, correlationId, errorMessage, subError);
        Object.setPrototypeOf(this, _InteractionRequiredAuthError.prototype);
        this.timestamp = timestamp || "";
        this.traceId = traceId || "";
        this.claims = claims || "";
        this.name = "InteractionRequiredAuthError";
        this.errorNo = errorNo;
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/ServerError.mjs
var ServerError;
var init_ServerError = __esm({
  "node_modules/@azure/msal-common/dist/error/ServerError.mjs"() {
    "use strict";
    init_AuthError();
    ServerError = class _ServerError extends AuthError2 {
      constructor(errorCode, correlationId, errorMessage, subError, errorNo, status) {
        super(errorCode, correlationId, errorMessage, subError);
        this.name = "ServerError";
        this.errorNo = errorNo;
        this.status = status;
        Object.setPrototypeOf(this, _ServerError.prototype);
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/utils/ProtocolUtils.mjs
function parseRequestState(base64Decode, state3, correlationId) {
  if (!base64Decode) {
    throw createClientAuthError(noCryptoObject, correlationId);
  }
  if (!state3) {
    throw createClientAuthError(invalidState, correlationId);
  }
  try {
    const splitState = state3.split(RESOURCE_DELIM);
    const libraryState = splitState[0];
    const userState = splitState.length > 1 ? splitState.slice(1).join(RESOURCE_DELIM) : "";
    const libraryStateString = base64Decode(libraryState);
    const libraryStateObj = JSON.parse(libraryStateString);
    return {
      userRequestState: userState || "",
      libraryState: libraryStateObj
    };
  } catch (e) {
    throw createClientAuthError(invalidState, correlationId);
  }
}
var init_ProtocolUtils = __esm({
  "node_modules/@azure/msal-common/dist/utils/ProtocolUtils.mjs"() {
    "use strict";
    init_Constants();
    init_ClientAuthError();
    init_ClientAuthErrorCodes();
  }
});

// node_modules/@azure/msal-common/dist/response/ResponseHandler.mjs
function buildAccountToCache(cacheStorage, authority, homeAccountId, base64Decode, correlationId, idTokenClaims, clientInfo, environment, claimsTenantId, authCodePayload, nativeAccountId, logger27, performanceClient) {
  logger27?.verbose("setCachedAccount called", correlationId);
  const accountEnvironment = environment || authority.getPreferredCache();
  const matchedAccounts = cacheStorage.getAccountsFilteredBy({ homeAccountId, environment: accountEnvironment }, correlationId);
  performanceClient?.addFields({ cacheMatchedAccounts: matchedAccounts.length }, correlationId);
  if (matchedAccounts.length > 1) {
    logger27?.warning("Multiple base accounts matched homeAccountId. Ignoring cached account and creating a new base account.", correlationId);
  }
  const cachedAccount = matchedAccounts.length === 1 ? matchedAccounts[0] : null;
  const baseAccount = cachedAccount || createAccountEntity({
    homeAccountId,
    idTokenClaims,
    clientInfo,
    environment,
    cloudGraphHostName: authCodePayload?.cloud_graph_host_name,
    msGraphHost: authCodePayload?.msgraph_host,
    nativeAccountId
  }, authority, correlationId, base64Decode);
  const tenantProfiles = baseAccount.tenantProfiles || [];
  const tenantId = claimsTenantId || baseAccount.realm;
  if (tenantId && !tenantProfiles.find((tenantProfile) => {
    return tenantProfile.tenantId === tenantId;
  })) {
    const newTenantProfile = buildTenantProfile(homeAccountId, baseAccount.localAccountId, tenantId, nativeAccountId, idTokenClaims);
    tenantProfiles.push(newTenantProfile);
  }
  baseAccount.tenantProfiles = tenantProfiles;
  return baseAccount;
}
var ResponseHandler;
var init_ResponseHandler = __esm({
  "node_modules/@azure/msal-common/dist/response/ResponseHandler.mjs"() {
    "use strict";
    init_AccountInfo();
    init_AuthToken();
    init_TokenClaims();
    init_TokenCacheContext();
    init_AccountEntityUtils();
    init_CacheHelpers();
    init_PopTokenGenerator();
    init_DpopProofGenerator();
    init_ITokenBindingKeyManager();
    init_ClientAuthError();
    init_InteractionRequiredAuthError();
    init_ServerError();
    init_ScopeSet();
    init_Constants();
    init_ProtocolUtils();
    init_TimeUtils();
    init_ClientAuthErrorCodes();
    ResponseHandler = class _ResponseHandler {
      constructor(clientId, cacheStorage, cryptoObj, logger27, performanceClient, serializableCache, persistencePlugin, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER) {
        this.clientId = clientId;
        this.cacheStorage = cacheStorage;
        this.cryptoObj = cryptoObj;
        this.tokenBindingKeyManager = tokenBindingKeyManager;
        this.logger = logger27;
        this.performanceClient = performanceClient;
        this.serializableCache = serializableCache;
        this.persistencePlugin = persistencePlugin;
      }
      /**
       * Function which validates server authorization token response.
       * @param serverResponse
       * @param correlationId
       * @param refreshAccessToken
       */
      validateTokenResponse(serverResponse, correlationId, refreshAccessToken) {
        if (serverResponse.error || serverResponse.error_description || serverResponse.suberror) {
          const errString = `Error(s): ${serverResponse.error_codes || NOT_AVAILABLE} - Timestamp: ${serverResponse.timestamp || NOT_AVAILABLE} - Description: ${serverResponse.error_description || NOT_AVAILABLE} - Correlation ID: ${serverResponse.correlation_id || NOT_AVAILABLE} - Trace ID: ${serverResponse.trace_id || NOT_AVAILABLE}`;
          const serverErrorNo = serverResponse.error_codes?.length ? serverResponse.error_codes[0] : void 0;
          const serverError = new ServerError(serverResponse.error || "", serverResponse.correlation_id || "", errString, serverResponse.suberror, serverErrorNo, serverResponse.status);
          if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_SERVER_ERROR_RANGE_START && serverResponse.status <= HTTP_SERVER_ERROR_RANGE_END) {
            this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently unavailable and the access token is unable to be refreshed.
${serverError}`, correlationId);
            return;
          } else if (refreshAccessToken && serverResponse.status && serverResponse.status >= HTTP_CLIENT_ERROR_RANGE_START && serverResponse.status <= HTTP_CLIENT_ERROR_RANGE_END) {
            this.logger.warning(`executeTokenRequest:validateTokenResponse - AAD is currently available but is unable to refresh the access token.
${serverError}`, correlationId);
            return;
          }
          if (isInteractionRequiredError(serverResponse.error, serverResponse.error_description, serverResponse.suberror)) {
            throw new InteractionRequiredAuthError(serverResponse.error || "", serverResponse.correlation_id || "", serverResponse.error_description, serverResponse.suberror, serverResponse.timestamp || "", serverResponse.trace_id || "", serverResponse.claims || "", serverErrorNo);
          }
          throw serverError;
        }
      }
      /**
       * Returns a constructed token response based on given string. Also manages the cache updates and cleanups.
       * @param serverTokenResponse
       * @param authority
       */
      async handleServerTokenResponse(serverTokenResponse, authority, reqTimestamp, request, apiId, authCodePayload, userAssertionHash, handlingRefreshTokenResponse, forceCacheRefreshTokenResponse, serverRequestId, additionalCacheKeyComponents) {
        let idTokenClaims;
        if (serverTokenResponse.id_token) {
          idTokenClaims = extractTokenClaims(serverTokenResponse.id_token || "", this.cryptoObj.base64Decode, request.correlationId);
        }
        if (authCodePayload && Object.prototype.hasOwnProperty.call(authCodePayload, "nonce")) {
          const expectedNonce = authCodePayload.nonce;
          const tokenNonce = idTokenClaims?.nonce;
          if (tokenNonce !== void 0 && expectedNonce === void 0) {
            this.logger.warning("Authorization code response contains an ID Token nonce, but no expected nonce was supplied. Rejecting the response.", request.correlationId);
            throw createClientAuthError(nonceMismatch, request.correlationId);
          }
          if (expectedNonce !== void 0 && (typeof expectedNonce !== "string" || typeof tokenNonce !== "string" || expectedNonce !== tokenNonce)) {
            throw createClientAuthError(nonceMismatch, request.correlationId);
          }
        }
        this.homeAccountIdentifier = generateHomeAccountId(serverTokenResponse.client_info || "", authority.authorityType, this.logger, this.cryptoObj, request.correlationId, idTokenClaims);
        let requestStateObj;
        if (!!authCodePayload && !!authCodePayload.state) {
          requestStateObj = parseRequestState(this.cryptoObj.base64Decode, authCodePayload.state, request.correlationId);
        }
        serverTokenResponse.key_id = serverTokenResponse.key_id || request.dpopJkt || request.sshKid || void 0;
        if (request.authenticationScheme === AuthenticationScheme.DPOP) {
          if (serverTokenResponse.token_type?.toLowerCase() !== AuthenticationScheme.DPOP.toLowerCase()) {
            this.performanceClient?.addFields({
              dpopTokenTypeMismatch: serverTokenResponse.token_type
            }, request.correlationId);
            throw createClientAuthError(dpopTokenTypeMismatch, request.correlationId);
          }
          serverTokenResponse.token_type = AuthenticationScheme.DPOP;
        }
        const attributeTokenPartition = serializeAttributeTokens(request.attributeTokens);
        const cacheKeyComponents = additionalCacheKeyComponents ?? (attributeTokenPartition ? {
          attribute_tokens: attributeTokenPartition
        } : void 0);
        const cacheRecord = this.generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload, cacheKeyComponents);
        let cacheContext;
        try {
          if (this.persistencePlugin && this.serializableCache) {
            this.logger.verbose("Persistence enabled, calling beforeCacheAccess", request.correlationId);
            cacheContext = new TokenCacheContext(this.serializableCache, true);
            await this.persistencePlugin.beforeCacheAccess(cacheContext);
          }
          if (handlingRefreshTokenResponse && !forceCacheRefreshTokenResponse && cacheRecord.account) {
            const cachedAccounts = this.cacheStorage.getAllAccounts({
              homeAccountId: cacheRecord.account.homeAccountId,
              environment: cacheRecord.account.environment
            }, request.correlationId);
            if (cachedAccounts.length < 1) {
              this.logger.warning("Account used to refresh tokens not in persistence, refreshed tokens will not be stored in the cache", request.correlationId);
              this.performanceClient?.addFields({
                acntLoggedOut: true
              }, request.correlationId);
              return await _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, {
                idTokenClaims,
                requestState: requestStateObj,
                requestId: serverRequestId,
                tokenBindingKeyManager: this.tokenBindingKeyManager
              });
            }
          }
          await this.cacheStorage.saveCacheRecord(cacheRecord, request.correlationId, isKmsi(idTokenClaims || {}), apiId, request.storeInCache);
        } finally {
          if (this.persistencePlugin && this.serializableCache && cacheContext) {
            this.logger.verbose("Persistence enabled, calling afterCacheAccess", request.correlationId);
            await this.persistencePlugin.afterCacheAccess(cacheContext);
          }
        }
        return _ResponseHandler.generateAuthenticationResult(this.cryptoObj, authority, cacheRecord, false, request, this.performanceClient, {
          idTokenClaims,
          requestState: requestStateObj,
          serverTokenResponse,
          requestId: serverRequestId,
          tokenBindingKeyManager: this.tokenBindingKeyManager
        });
      }
      /**
       * Generates CacheRecord
       * @param serverTokenResponse
       * @param idTokenObj
       * @param authority
       */
      generateCacheRecord(serverTokenResponse, authority, reqTimestamp, request, idTokenClaims, userAssertionHash, authCodePayload, additionalCacheKeyComponents) {
        const env = authority.getPreferredCache();
        if (!env) {
          throw createClientAuthError(invalidCacheEnvironment, request.correlationId);
        }
        const claimsTenantId = getTenantIdFromIdTokenClaims(idTokenClaims);
        let cachedIdToken;
        let cachedAccount;
        if (serverTokenResponse.id_token && !!idTokenClaims) {
          cachedIdToken = createIdTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.id_token, this.clientId, claimsTenantId || "");
          cachedAccount = buildAccountToCache(
            this.cacheStorage,
            authority,
            this.homeAccountIdentifier,
            this.cryptoObj.base64Decode,
            request.correlationId,
            idTokenClaims,
            serverTokenResponse.client_info,
            env,
            claimsTenantId,
            authCodePayload,
            void 0,
            // nativeAccountId
            this.logger,
            this.performanceClient
          );
        }
        let cachedAccessToken = null;
        if (serverTokenResponse.access_token) {
          const responseScopes = serverTokenResponse.scope ? ScopeSet.fromString(serverTokenResponse.scope, request.correlationId) : new ScopeSet(request.scopes || [], request.correlationId);
          const expiresIn = (typeof serverTokenResponse.expires_in === "string" ? parseInt(serverTokenResponse.expires_in, 10) : serverTokenResponse.expires_in) || 0;
          const extExpiresIn = (typeof serverTokenResponse.ext_expires_in === "string" ? parseInt(serverTokenResponse.ext_expires_in, 10) : serverTokenResponse.ext_expires_in) || 0;
          const refreshIn = (typeof serverTokenResponse.refresh_in === "string" ? parseInt(serverTokenResponse.refresh_in, 10) : serverTokenResponse.refresh_in) || void 0;
          const tokenExpirationSeconds = reqTimestamp + expiresIn;
          const extendedTokenExpirationSeconds = tokenExpirationSeconds + extExpiresIn;
          const refreshOnSeconds = refreshIn && refreshIn > 0 ? reqTimestamp + refreshIn : void 0;
          cachedAccessToken = createAccessTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.access_token, this.clientId, claimsTenantId || authority.tenant || "", responseScopes.printScopes(), tokenExpirationSeconds, extendedTokenExpirationSeconds, this.cryptoObj.base64Decode, request.correlationId, refreshOnSeconds, serverTokenResponse.token_type, userAssertionHash, serverTokenResponse.key_id, additionalCacheKeyComponents);
          const resource = request.resource || null;
          if (resource) {
            cachedAccessToken.resource = resource;
          }
        }
        let cachedRefreshToken = null;
        if (serverTokenResponse.refresh_token) {
          let rtExpiresOn;
          if (serverTokenResponse.refresh_token_expires_in) {
            const rtExpiresIn = typeof serverTokenResponse.refresh_token_expires_in === "string" ? parseInt(serverTokenResponse.refresh_token_expires_in, 10) : serverTokenResponse.refresh_token_expires_in;
            rtExpiresOn = reqTimestamp + rtExpiresIn;
            this.performanceClient?.addFields({ ntwkRtExpiresOnSeconds: rtExpiresOn }, request.correlationId);
          }
          cachedRefreshToken = createRefreshTokenEntity(this.homeAccountIdentifier, env, serverTokenResponse.refresh_token, this.clientId, serverTokenResponse.foci, userAssertionHash, rtExpiresOn);
        }
        let cachedAppMetadata = null;
        if (serverTokenResponse.foci) {
          cachedAppMetadata = {
            clientId: this.clientId,
            environment: env,
            familyId: serverTokenResponse.foci
          };
        }
        return {
          account: cachedAccount,
          idToken: cachedIdToken,
          accessToken: cachedAccessToken,
          refreshToken: cachedRefreshToken,
          appMetadata: cachedAppMetadata
        };
      }
      /**
       * Creates an @AuthenticationResult from @CacheRecord , @IdToken , and a boolean that states whether or not the result is from cache.
       *
       * Optionally takes a state string that is set as-is in the response.
       *
       * @param cacheRecord
       * @param idTokenObj
       * @param fromTokenCache
       * @param stateString
       */
      static async generateAuthenticationResult(cryptoObj, authority, cacheRecord, fromTokenCache, request, performanceClient, options = {}) {
        const { idTokenClaims, requestState, serverTokenResponse, requestId, tokenBindingKeyManager = DEFAULT_TOKEN_BINDING_KEY_MANAGER } = options;
        let accessToken = "";
        let responseScopes = [];
        let expiresOn = null;
        let extExpiresOn;
        let refreshOn;
        let familyId = "";
        let dpopProof;
        if (cacheRecord.accessToken) {
          const accessTokenType = cacheRecord.accessToken.tokenType?.toLowerCase();
          if (cacheRecord.accessToken.tokenType === AuthenticationScheme.POP && !request.popKid) {
            const popTokenGenerator = new PopTokenGenerator(cryptoObj, tokenBindingKeyManager, performanceClient);
            const { secret, keyId } = cacheRecord.accessToken;
            if (!keyId) {
              throw createClientAuthError(keyIdMissing, request.correlationId);
            }
            accessToken = await popTokenGenerator.signPopToken(secret, keyId, request);
          } else {
            accessToken = cacheRecord.accessToken.secret;
          }
          if (accessTokenType === AuthenticationScheme.DPOP.toLowerCase()) {
            if (!cacheRecord.accessToken.keyId) {
              throw createClientAuthError(keyIdMissing, request.correlationId);
            }
            const dpopProofGenerator = new DpopProofGenerator(cryptoObj, tokenBindingKeyManager);
            dpopProof = await dpopProofGenerator.generateResourceProof({
              htu: request.resourceRequestUri,
              htm: request.resourceRequestMethod,
              accessToken: cacheRecord.accessToken.secret
            }, cacheRecord.accessToken.keyId, request.correlationId);
          }
          responseScopes = ScopeSet.fromString(cacheRecord.accessToken.target, request.correlationId).asArray();
          expiresOn = toDateFromSeconds(cacheRecord.accessToken.expiresOn);
          extExpiresOn = toDateFromSeconds(cacheRecord.accessToken.extendedExpiresOn);
          if (cacheRecord.accessToken.refreshOn) {
            refreshOn = toDateFromSeconds(cacheRecord.accessToken.refreshOn);
          }
        }
        if (cacheRecord.appMetadata) {
          familyId = cacheRecord.appMetadata.familyId === THE_FAMILY_ID ? THE_FAMILY_ID : "";
        }
        const uid = idTokenClaims?.oid || idTokenClaims?.sub || "";
        const tid = idTokenClaims?.tid || "";
        const regionSubScope = idTokenClaims?.tenant_region_sub_scope;
        if (typeof regionSubScope === "string") {
          performanceClient?.addFields({ regionSubScope }, request.correlationId);
        }
        if (serverTokenResponse?.spa_accountid && !!cacheRecord.account) {
          cacheRecord.account.nativeAccountId = serverTokenResponse?.spa_accountid;
          const targetTenantId = tid || cacheRecord.account.realm;
          if (cacheRecord.account.tenantProfiles) {
            const matchingProfile = cacheRecord.account.tenantProfiles.find((tp) => tp.tenantId === targetTenantId);
            if (matchingProfile) {
              matchingProfile.nativeAccountId = serverTokenResponse.spa_accountid;
            }
          }
        }
        const accountInfo = cacheRecord.account ? updateAccountTenantProfileData(
          getAccountInfo(cacheRecord.account),
          void 0,
          // tenantProfile optional
          idTokenClaims,
          cacheRecord.idToken?.secret
        ) : null;
        return {
          authority: authority.canonicalAuthority,
          uniqueId: uid,
          tenantId: tid,
          scopes: responseScopes,
          account: accountInfo,
          idToken: cacheRecord?.idToken?.secret || "",
          idTokenClaims: idTokenClaims || {},
          accessToken,
          dpopProof,
          fromCache: fromTokenCache,
          expiresOn,
          extExpiresOn,
          refreshOn,
          correlationId: request.correlationId,
          requestId: requestId || "",
          familyId,
          tokenType: cacheRecord.accessToken?.tokenType?.toLowerCase() === AuthenticationScheme.DPOP.toLowerCase() ? AuthenticationScheme.DPOP : cacheRecord.accessToken?.tokenType || "",
          state: requestState ? requestState.userRequestState : "",
          cloudGraphHostName: cacheRecord.account?.cloudGraphHostName || "",
          msGraphHost: cacheRecord.account?.msGraphHost || "",
          code: serverTokenResponse?.spa_code,
          fromPlatformBroker: false
        };
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/error/NetworkError.mjs
function createNetworkError(error, httpStatus, responseHeaders, additionalError) {
  error.errorMessage = `${error.errorMessage}, additionalErrorInfo: error.name:${additionalError?.name}, error.message:${additionalError?.message}`;
  return new NetworkError(error, httpStatus, responseHeaders);
}
var NetworkError;
var init_NetworkError = __esm({
  "node_modules/@azure/msal-common/dist/error/NetworkError.mjs"() {
    "use strict";
    init_AuthError();
    NetworkError = class _NetworkError extends AuthError2 {
      constructor(error, httpStatus, responseHeaders) {
        super(error.errorCode, error.correlationId, error.errorMessage, error.subError);
        Object.setPrototypeOf(this, _NetworkError.prototype);
        this.name = "NetworkError";
        this.error = error;
        this.httpStatus = httpStatus;
        this.responseHeaders = responseHeaders;
      }
    };
  }
});

// node_modules/@azure/msal-common/dist/index-node.mjs
var init_index_node = __esm({
  "node_modules/@azure/msal-common/dist/index-node.mjs"() {
    "use strict";
    init_AADServerParamKeys();
    init_AuthError();
    init_AuthorityOptions();
    init_ClientAuthError();
    init_ClientAuthErrorCodes();
    init_Constants();
    init_Logger();
    init_NetworkError();
    init_ProtocolMode();
    init_ResponseHandler();
    init_StubPerformanceClient();
    init_TimeUtils();
    init_UrlString();
  }
});

// node_modules/@azure/msal-node/dist/cache/serializer/Deserializer.mjs
var init_Deserializer = __esm({
  "node_modules/@azure/msal-node/dist/cache/serializer/Deserializer.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/internals.mjs
var init_internals = __esm({
  "node_modules/@azure/msal-node/dist/internals.mjs"() {
    "use strict";
    init_Serializer();
    init_Deserializer();
  }
});

// node_modules/@azure/msal-node/dist/utils/Constants.mjs
var MANAGED_IDENTITY_DEFAULT_TENANT, DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY, ManagedIdentityHeaders, ManagedIdentityQueryParameters, ManagedIdentityEnvironmentVariableNames, ManagedIdentitySourceNames, ManagedIdentityIdType, HttpMethod2, ApiId;
var init_Constants2 = __esm({
  "node_modules/@azure/msal-node/dist/utils/Constants.mjs"() {
    "use strict";
    init_index_node();
    MANAGED_IDENTITY_DEFAULT_TENANT = "managed_identity";
    DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY = `https://login.microsoftonline.com/${MANAGED_IDENTITY_DEFAULT_TENANT}/`;
    ManagedIdentityHeaders = {
      AUTHORIZATION_HEADER_NAME: "Authorization",
      METADATA_HEADER_NAME: "Metadata",
      APP_SERVICE_SECRET_HEADER_NAME: "X-IDENTITY-HEADER",
      ML_AND_SF_SECRET_HEADER_NAME: "secret",
      CLIENT_SKU: AADServerParamKeys_exports.X_CLIENT_SKU,
      CLIENT_VER: AADServerParamKeys_exports.X_CLIENT_VER,
      CLIENT_REQUEST_ID: "x-ms-client-request-id"
    };
    ManagedIdentityQueryParameters = {
      API_VERSION: "api-version",
      RESOURCE: "resource",
      SHA256_TOKEN_TO_REFRESH: "token_sha256_to_refresh",
      XMS_CC: "xms_cc"
    };
    ManagedIdentityEnvironmentVariableNames = {
      AZURE_POD_IDENTITY_AUTHORITY_HOST: "AZURE_POD_IDENTITY_AUTHORITY_HOST",
      DEFAULT_IDENTITY_CLIENT_ID: "DEFAULT_IDENTITY_CLIENT_ID",
      IDENTITY_ENDPOINT: "IDENTITY_ENDPOINT",
      IDENTITY_HEADER: "IDENTITY_HEADER",
      IDENTITY_SERVER_THUMBPRINT: "IDENTITY_SERVER_THUMBPRINT",
      IMDS_ENDPOINT: "IMDS_ENDPOINT",
      MSI_ENDPOINT: "MSI_ENDPOINT",
      MSI_SECRET: "MSI_SECRET"
    };
    ManagedIdentitySourceNames = {
      APP_SERVICE: "AppService",
      AZURE_ARC: "AzureArc",
      CLOUD_SHELL: "CloudShell",
      DEFAULT_TO_IMDS: "DefaultToImds",
      IMDS: "Imds",
      MACHINE_LEARNING: "MachineLearning",
      SERVICE_FABRIC: "ServiceFabric"
    };
    ManagedIdentityIdType = {
      SYSTEM_ASSIGNED: "system-assigned",
      USER_ASSIGNED_CLIENT_ID: "user-assigned-client-id",
      USER_ASSIGNED_RESOURCE_ID: "user-assigned-resource-id",
      USER_ASSIGNED_OBJECT_ID: "user-assigned-object-id"
    };
    HttpMethod2 = {
      GET: "GET",
      POST: "POST"
    };
    ApiId = {
      acquireTokenSilent: 62,
      acquireTokenByUsernamePassword: 371,
      acquireTokenByDeviceCode: 671,
      acquireTokenByClientCredential: 771,
      acquireTokenByOBO: 772,
      acquireTokenWithManagedIdentity: 773,
      acquireTokenByUserFederatedIdentityCredential: 774,
      acquireTokenByCode: 871,
      acquireTokenByRefreshToken: 872
    };
  }
});

// node_modules/@azure/msal-node/dist/network/HttpClient.mjs
function getHeaderDict(headers) {
  const headerDict = {};
  headers.forEach((value, key) => {
    headerDict[key] = value;
  });
  return headerDict;
}
function getFetchHeaders(options) {
  const headers = new Headers();
  if (!(options && options.headers)) {
    return headers;
  }
  Object.entries(options.headers).forEach(([key, value]) => {
    headers.append(key, value);
  });
  return headers;
}
var HttpClient;
var init_HttpClient = __esm({
  "node_modules/@azure/msal-node/dist/network/HttpClient.mjs"() {
    "use strict";
    init_index_node();
    init_Constants2();
    HttpClient = class {
      /**
       * Sends an HTTP GET request to the specified URL.
       *
       * This method handles GET requests with optional timeout support. The timeout
       * is implemented using AbortController, which provides a clean way to cancel
       * fetch requests that take too long to complete.
       *
       * @param url - The target URL for the GET request
       * @param options - Optional request configuration including headers
       * @param timeout - Optional timeout in milliseconds. If specified, the request
       *                  will be aborted if it doesn't complete within this time
       * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
       * @throws {AuthError} When the request times out or response parsing fails
       * @throws {NetworkError} When the network request fails
       */
      async sendGetRequestAsync(url, options, timeout) {
        return this.sendRequest(url, HttpMethod2.GET, options, timeout);
      }
      /**
       * Sends an HTTP POST request to the specified URL.
       *
       * This method handles POST requests with request body support. Currently,
       * timeout functionality is not exposed for POST requests, but the underlying
       * implementation supports it through the shared sendRequest method.
       *
       * @param url - The target URL for the POST request
       * @param options - Optional request configuration including headers and body
       * @returns Promise that resolves to a NetworkResponse containing headers, body, and status
       * @throws {AuthError} When the request times out or response parsing fails
       * @throws {NetworkError} When the network request fails
       */
      async sendPostRequestAsync(url, options) {
        return this.sendRequest(url, HttpMethod2.POST, options);
      }
      /**
       * Core HTTP request implementation using native fetch API.
       *
       * This method handles GET and POST HTTP requests with comprehensive
       * timeout support and error handling. The timeout mechanism works as follows:
       *
       * 1. An AbortController is created for each request
       * 2. If a timeout is specified, setTimeout is used to call abort() after the delay
       * 3. The abort signal is passed to fetch, which will reject the promise if aborted
       * 4. Cleanup occurs in both success and error cases to prevent timer leaks
       *
       * Error handling priority:
       * 1. Timeout errors (AbortError) are converted to "Request timeout" messages
       * 2. Network/connection errors are wrapped with "Network request failed" prefix
       * 3. JSON parsing errors are wrapped with "Failed to parse response" prefix
       *
       * @param url - The target URL for the request
       * @param method - HTTP method (GET or POST)
       * @param options - Optional request configuration (headers, body)
       * @param timeout - Optional timeout in milliseconds for request cancellation
       * @returns Promise resolving to NetworkResponse with parsed JSON body
       * @throws {AuthError} For timeouts or JSON parsing errors
       * @throws {NetworkError} For network failures
       */
      async sendRequest(url, method, options, timeout) {
        const controller2 = new AbortController();
        let timeoutId;
        if (timeout) {
          timeoutId = setTimeout(() => {
            controller2.abort();
          }, timeout);
        }
        const fetchOptions = {
          method,
          headers: getFetchHeaders(options),
          signal: controller2.signal
          // Enable cancellation via AbortController
        };
        if (method === HttpMethod2.POST) {
          fetchOptions.body = options?.body || "";
        }
        let response;
        try {
          response = await fetch(url, fetchOptions);
        } catch (error) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (error instanceof Error && error.name === "AbortError") {
            throw createAuthError(ClientAuthErrorCodes_exports.networkError, "", "Request timeout");
          }
          const baseAuthError = createAuthError(ClientAuthErrorCodes_exports.networkError, "", `Network request failed: ${error instanceof Error ? error.message : "unknown"}`);
          throw createNetworkError(baseAuthError, void 0, void 0, error instanceof Error ? error : void 0);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        try {
          return {
            headers: getHeaderDict(response.headers),
            body: await response.json(),
            status: response.status
          };
        } catch (error) {
          throw createAuthError(ClientAuthErrorCodes_exports.tokenParsingError, "", `Failed to parse response: ${error instanceof Error ? error.message : "unknown"}`);
        }
      }
    };
  }
});

// node_modules/@azure/msal-node/dist/error/ManagedIdentityErrorCodes.mjs
var invalidFileExtension, invalidFilePath, invalidManagedIdentityIdType, invalidSecret, missingId, networkUnavailable, platformNotSupported, unableToCreateAzureArc, unableToCreateCloudShell, unableToCreateSource, unableToReadSecretFile, userAssignedNotAvailableAtRuntime, userAssignedManagedIdentityNotConfirmed, wwwAuthenticateHeaderMissing, wwwAuthenticateHeaderUnsupportedFormat, MsiEnvironmentVariableUrlMalformedErrorCodes;
var init_ManagedIdentityErrorCodes = __esm({
  "node_modules/@azure/msal-node/dist/error/ManagedIdentityErrorCodes.mjs"() {
    "use strict";
    init_Constants2();
    invalidFileExtension = "invalid_file_extension";
    invalidFilePath = "invalid_file_path";
    invalidManagedIdentityIdType = "invalid_managed_identity_id_type";
    invalidSecret = "invalid_secret";
    missingId = "missing_client_id";
    networkUnavailable = "network_unavailable";
    platformNotSupported = "platform_not_supported";
    unableToCreateAzureArc = "unable_to_create_azure_arc";
    unableToCreateCloudShell = "unable_to_create_cloud_shell";
    unableToCreateSource = "unable_to_create_source";
    unableToReadSecretFile = "unable_to_read_secret_file";
    userAssignedNotAvailableAtRuntime = "user_assigned_not_available_at_runtime";
    userAssignedManagedIdentityNotConfirmed = "user_assigned_managed_identity_not_confirmed";
    wwwAuthenticateHeaderMissing = "www_authenticate_header_missing";
    wwwAuthenticateHeaderUnsupportedFormat = "www_authenticate_header_unsupported_format";
    MsiEnvironmentVariableUrlMalformedErrorCodes = {
      [ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST]: "azure_pod_identity_authority_host_url_malformed",
      [ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT]: "identity_endpoint_url_malformed",
      [ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT]: "imds_endpoint_url_malformed",
      [ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT]: "msi_endpoint_url_malformed"
    };
  }
});

// node_modules/@azure/msal-node/dist/error/ManagedIdentityError.mjs
function createManagedIdentityError(errorCode, correlationId) {
  return new ManagedIdentityError(errorCode, correlationId);
}
var ManagedIdentityErrorMessages, ManagedIdentityError;
var init_ManagedIdentityError = __esm({
  "node_modules/@azure/msal-node/dist/error/ManagedIdentityError.mjs"() {
    "use strict";
    init_index_node();
    init_ManagedIdentityErrorCodes();
    init_Constants2();
    ManagedIdentityErrorMessages = {
      [invalidFileExtension]: "The file path in the WWW-Authenticate header does not contain a .key file.",
      [invalidFilePath]: "The file path in the WWW-Authenticate header is not in a valid Windows or Linux Format.",
      [invalidManagedIdentityIdType]: "More than one ManagedIdentityIdType was provided.",
      [invalidSecret]: "The secret in the file on the file path in the WWW-Authenticate header is greater than 4096 bytes.",
      [platformNotSupported]: "The platform is not supported by Azure Arc. Azure Arc only supports Windows and Linux.",
      [missingId]: "A ManagedIdentityId id was not provided.",
      [MsiEnvironmentVariableUrlMalformedErrorCodes.AZURE_POD_IDENTITY_AUTHORITY_HOST]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST}' environment variable is malformed.`,
      [MsiEnvironmentVariableUrlMalformedErrorCodes.IDENTITY_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' environment variable is malformed.`,
      [MsiEnvironmentVariableUrlMalformedErrorCodes.IMDS_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' environment variable is malformed.`,
      [MsiEnvironmentVariableUrlMalformedErrorCodes.MSI_ENDPOINT]: `The Managed Identity's '${ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT}' environment variable is malformed.`,
      [networkUnavailable]: "Authentication unavailable. The request to the managed identity endpoint timed out.",
      [unableToCreateAzureArc]: "Azure Arc Managed Identities can only be system assigned.",
      [unableToCreateCloudShell]: "Cloud Shell Managed Identities can only be system assigned.",
      [unableToCreateSource]: "Unable to create a Managed Identity source based on environment variables.",
      [unableToReadSecretFile]: "Unable to read the secret file.",
      [userAssignedNotAvailableAtRuntime]: "Service Fabric user assigned managed identity ClientId or ResourceId is not configurable at runtime.",
      [userAssignedManagedIdentityNotConfirmed]: "Azure Arc did not confirm the requested user-assigned managed identity in the token response. The agent likely does not support user-assigned managed identity and returned the system-assigned identity.",
      [wwwAuthenticateHeaderMissing]: "A 401 response was received from the Azure Arc Managed Identity, but the www-authenticate header is missing.",
      [wwwAuthenticateHeaderUnsupportedFormat]: "A 401 response was received from the Azure Arc Managed Identity, but the www-authenticate header is in an unsupported format."
    };
    ManagedIdentityError = class _ManagedIdentityError extends AuthError2 {
      constructor(errorCode, correlationId) {
        super(errorCode, correlationId, ManagedIdentityErrorMessages[errorCode]);
        this.name = "ManagedIdentityError";
        Object.setPrototypeOf(this, _ManagedIdentityError.prototype);
      }
    };
  }
});

// node_modules/@azure/msal-node/dist/config/ManagedIdentityId.mjs
var init_ManagedIdentityId = __esm({
  "node_modules/@azure/msal-node/dist/config/ManagedIdentityId.mjs"() {
    "use strict";
    init_ManagedIdentityError();
    init_Constants2();
    init_ManagedIdentityErrorCodes();
  }
});

// node_modules/@azure/msal-node/dist/error/NodeAuthError.mjs
var init_NodeAuthError = __esm({
  "node_modules/@azure/msal-node/dist/error/NodeAuthError.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/config/Configuration.mjs
var DEFAULT_AUTH_OPTIONS, DEFAULT_LOGGER_OPTIONS, DEFAULT_SYSTEM_OPTIONS;
var init_Configuration = __esm({
  "node_modules/@azure/msal-node/dist/config/Configuration.mjs"() {
    "use strict";
    init_index_node();
    init_HttpClient();
    init_ManagedIdentityId();
    init_NodeAuthError();
    DEFAULT_AUTH_OPTIONS = {
      clientId: "",
      authority: Constants_exports.DEFAULT_AUTHORITY,
      clientSecret: "",
      clientAssertion: "",
      clientCertificate: {
        thumbprint: "",
        thumbprintSha256: "",
        privateKey: "",
        x5c: ""
      },
      knownAuthorities: [],
      cloudDiscoveryMetadata: "",
      authorityMetadata: "",
      clientCapabilities: [],
      azureCloudOptions: {
        azureCloudInstance: AzureCloudInstance.None,
        tenant: ""
      },
      isMcp: false
    };
    DEFAULT_LOGGER_OPTIONS = {
      loggerCallback: () => {
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Info
    };
    DEFAULT_SYSTEM_OPTIONS = {
      loggerOptions: DEFAULT_LOGGER_OPTIONS,
      networkClient: new HttpClient(),
      disableInternalRetries: false,
      protocolMode: ProtocolMode.AAD
    };
  }
});

// node_modules/@azure/msal-node/dist/crypto/GuidGenerator.mjs
import { randomUUID } from "node:crypto";
var init_GuidGenerator = __esm({
  "node_modules/@azure/msal-node/dist/crypto/GuidGenerator.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/utils/EncodingUtils.mjs
var init_EncodingUtils = __esm({
  "node_modules/@azure/msal-node/dist/utils/EncodingUtils.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/crypto/HashUtils.mjs
import crypto from "node:crypto";
var init_HashUtils = __esm({
  "node_modules/@azure/msal-node/dist/crypto/HashUtils.mjs"() {
    "use strict";
    init_Constants2();
  }
});

// node_modules/@azure/msal-node/dist/crypto/PkceGenerator.mjs
import crypto2 from "node:crypto";
var init_PkceGenerator = __esm({
  "node_modules/@azure/msal-node/dist/crypto/PkceGenerator.mjs"() {
    "use strict";
    init_Constants2();
    init_EncodingUtils();
    init_HashUtils();
  }
});

// node_modules/@azure/msal-node/dist/crypto/CryptoProvider.mjs
var init_CryptoProvider = __esm({
  "node_modules/@azure/msal-node/dist/crypto/CryptoProvider.mjs"() {
    "use strict";
    init_GuidGenerator();
    init_EncodingUtils();
    init_PkceGenerator();
    init_HashUtils();
  }
});

// node_modules/@azure/msal-node/dist/cache/CacheHelpers.mjs
import { createHash } from "node:crypto";
var init_CacheHelpers2 = __esm({
  "node_modules/@azure/msal-node/dist/cache/CacheHelpers.mjs"() {
    "use strict";
    init_Constants2();
  }
});

// node_modules/@azure/msal-node/dist/cache/NodeStorage.mjs
var init_NodeStorage = __esm({
  "node_modules/@azure/msal-node/dist/cache/NodeStorage.mjs"() {
    "use strict";
    init_Deserializer();
    init_Serializer();
    init_CacheHelpers2();
  }
});

// node_modules/@azure/msal-node/dist/cache/TokenCache.mjs
var init_TokenCache = __esm({
  "node_modules/@azure/msal-node/dist/cache/TokenCache.mjs"() {
    "use strict";
    init_NodeStorage();
    init_Deserializer();
    init_Serializer();
    init_GuidGenerator();
    init_CryptoProvider();
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("node:buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = __require("node:stream");
    var util2 = __require("node:util");
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer2.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer2.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick(function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }.bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util2.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer2.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer2 = __require("node:buffer").Buffer;
    var SlowBuffer = __require("node:buffer").SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/jwa/index.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto3 = __require("node:crypto");
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util2 = __require("node:util");
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto3.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util2.format.bind(util2, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto3.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual = "timingSafeEqual" in crypto3 ? function timingSafeEqual2(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto3.timingSafeEqual(a, b);
    } : function timingSafeEqual2(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto3.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto3.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto3.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto3.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase();
      var bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer2 = __require("node:buffer").Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer2.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("node:stream");
    var toString = require_tostring();
    var util2 = __require("node:util");
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util2.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util2.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      secret = secret == null ? opts.privateKey : secret;
      secret = secret == null ? opts.key : secret;
      if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }.bind(this));
      this.payload.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }.bind(this));
    }
    util2.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("node:stream");
    var toString = require_tostring();
    var util2 = __require("node:util");
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject2(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject2(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
      secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
      if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }.bind(this));
      this.signature.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }.bind(this));
    }
    util2.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/jsonwebtoken/decode.js
var require_decode = __commonJS({
  "node_modules/jsonwebtoken/decode.js"(exports, module) {
    var jws = require_jws();
    module.exports = function(jwt2, options) {
      options = options || {};
      var decoded = jws.decode(jwt2, options);
      if (!decoded) {
        return null;
      }
      var payload = decoded.payload;
      if (typeof payload === "string") {
        try {
          var obj = JSON.parse(payload);
          if (obj !== null && typeof obj === "object") {
            payload = obj;
          }
        } catch (e) {
        }
      }
      if (options.complete === true) {
        return {
          header: decoded.header,
          payload,
          signature: decoded.signature
        };
      }
      return payload;
    };
  }
});

// node_modules/jsonwebtoken/lib/JsonWebTokenError.js
var require_JsonWebTokenError = __commonJS({
  "node_modules/jsonwebtoken/lib/JsonWebTokenError.js"(exports, module) {
    var JsonWebTokenError = function(message, error) {
      Error.call(this, message);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
      this.name = "JsonWebTokenError";
      this.message = message;
      if (error) this.inner = error;
    };
    JsonWebTokenError.prototype = Object.create(Error.prototype);
    JsonWebTokenError.prototype.constructor = JsonWebTokenError;
    module.exports = JsonWebTokenError;
  }
});

// node_modules/jsonwebtoken/lib/NotBeforeError.js
var require_NotBeforeError = __commonJS({
  "node_modules/jsonwebtoken/lib/NotBeforeError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = function(message, date) {
      JsonWebTokenError.call(this, message);
      this.name = "NotBeforeError";
      this.date = date;
    };
    NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype);
    NotBeforeError.prototype.constructor = NotBeforeError;
    module.exports = NotBeforeError;
  }
});

// node_modules/jsonwebtoken/lib/TokenExpiredError.js
var require_TokenExpiredError = __commonJS({
  "node_modules/jsonwebtoken/lib/TokenExpiredError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var TokenExpiredError = function(message, expiredAt) {
      JsonWebTokenError.call(this, message);
      this.name = "TokenExpiredError";
      this.expiredAt = expiredAt;
    };
    TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);
    TokenExpiredError.prototype.constructor = TokenExpiredError;
    module.exports = TokenExpiredError;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name2) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name2 + (isPlural ? "s" : "");
    }
  }
});

// node_modules/jsonwebtoken/lib/timespan.js
var require_timespan = __commonJS({
  "node_modules/jsonwebtoken/lib/timespan.js"(exports, module) {
    var ms = require_ms();
    module.exports = function(time, iat) {
      var timestamp = iat || Math.floor(Date.now() / 1e3);
      if (typeof time === "string") {
        var milliseconds = ms(time);
        if (typeof milliseconds === "undefined") {
          return;
        }
        return Math.floor(timestamp + milliseconds / 1e3);
      } else if (typeof time === "number") {
        return timestamp + time;
      } else {
        return;
      }
    };
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports, module) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports, module) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports, module) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t = exports.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name2, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name2, index, value);
      t[name2] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports, module) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports, module) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports, module) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version2, options) {
        options = parseOptions(options);
        if (version2 instanceof _SemVer) {
          if (version2.loose === !!options.loose && version2.includePrerelease === !!options.includePrerelease) {
            return version2;
          } else {
            version2 = version2.version;
          }
        } else if (typeof version2 !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version2}".`);
        }
        if (version2.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version2, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version2.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version2}`);
        }
        this.raw = version2;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version2, options, throwErrors = false) => {
      if (version2 instanceof SemVer) {
        return version2;
      }
      try {
        return new SemVer(version2, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var valid = (version2, options) => {
      const v = parse(version2, options);
      return v ? v.version : null;
    };
    module.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var clean = (version2, options) => {
      const s = parse(version2.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version2, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version2 instanceof SemVer ? version2.version : version2,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version2, options) => {
      const parsed = parse(version2, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports, module) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version2, options) => {
      if (version2 instanceof SemVer) {
        return version2;
      }
      if (typeof version2 === "number") {
        version2 = String(version2);
      }
      if (typeof version2 !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version2.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version2)) && (!match || match.index + match[0].length !== version2.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module.exports = coerce;
  }
});

// node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/semver/functions/truncate.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var constants4 = require_constants();
    var SemVer = require_semver();
    var truncate = (version2, truncation, options) => {
      if (!constants4.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version2, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version2, options) => {
      const versionStringToParse = version2 instanceof SemVer ? version2.version : version2;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version2, truncation) => {
      if (isPrerelease(truncation)) {
        return version2.version;
      }
      version2.prerelease = [];
      switch (truncation) {
        case "major":
          version2.minor = 0;
          version2.patch = 0;
          break;
        case "minor":
          version2.patch = 0;
          break;
      }
      return version2.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module.exports = truncate;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports, module) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports, module) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version2) {
        if (!version2) {
          return false;
        }
        if (typeof version2 === "string") {
          try {
            version2 = new SemVer(version2, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version2, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version2, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version2)) {
          return false;
        }
      }
      if (version2.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version2.major && allowed.minor === version2.minor && allowed.patch === version2.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports, module) {
    "use strict";
    var ANY = Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version2) {
        debug("Comparator.test", version2, this.options.loose);
        if (this.semver === ANY || version2 === ANY) {
          return true;
        }
        if (typeof version2 === "string") {
          try {
            version2 = new SemVer(version2, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version2, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var satisfies = (version2, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version2);
    };
    module.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version2, range, hilo, options) => {
      version2 = new SemVer(version2, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version2, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version2, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version2, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var gtr = (version2, range, options) => outside(version2, range, ">", options);
    module.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var ltr = (version2, range, options) => outside(version2, range, "<", options);
    module.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports, module) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version2 of v) {
        const included = satisfies(version2, range, options);
        if (included) {
          prev = version2;
          if (!first) {
            first = version2;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower3;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower3 = lowerLT(lt, c, options);
            if (lower3 === c && lower3 !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports, module) {
    "use strict";
    var internalRe = require_re();
    var constants4 = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants4.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants4.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
var require_asymmetricKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=15.7.0");
  }
});

// node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
var require_rsaPssKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=16.9.0");
  }
});

// node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
var require_validateAsymmetricKey = __commonJS({
  "node_modules/jsonwebtoken/lib/validateAsymmetricKey.js"(exports, module) {
    var ASYMMETRIC_KEY_DETAILS_SUPPORTED = require_asymmetricKeyDetailsSupported();
    var RSA_PSS_KEY_DETAILS_SUPPORTED = require_rsaPssKeyDetailsSupported();
    var allowedAlgorithmsForKeys = {
      "ec": ["ES256", "ES384", "ES512"],
      "rsa": ["RS256", "PS256", "RS384", "PS384", "RS512", "PS512"],
      "rsa-pss": ["PS256", "PS384", "PS512"]
    };
    var allowedCurves = {
      ES256: "prime256v1",
      ES384: "secp384r1",
      ES512: "secp521r1"
    };
    module.exports = function(algorithm, key) {
      if (!algorithm || !key) return;
      const keyType = key.asymmetricKeyType;
      if (!keyType) return;
      const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
      if (!allowedAlgorithms) {
        throw new Error(`Unknown key type "${keyType}".`);
      }
      if (!allowedAlgorithms.includes(algorithm)) {
        throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(", ")}.`);
      }
      if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
        switch (keyType) {
          case "ec":
            const keyCurve = key.asymmetricKeyDetails.namedCurve;
            const allowedCurve = allowedCurves[algorithm];
            if (keyCurve !== allowedCurve) {
              throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
            }
            break;
          case "rsa-pss":
            if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
              const length = parseInt(algorithm.slice(-3), 10);
              const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;
              if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
              }
              if (saltLength !== void 0 && saltLength > length >> 3) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
              }
            }
            break;
        }
      }
    };
  }
});

// node_modules/jsonwebtoken/lib/psSupported.js
var require_psSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/psSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, "^6.12.0 || >=8.0.0");
  }
});

// node_modules/jsonwebtoken/verify.js
var require_verify = __commonJS({
  "node_modules/jsonwebtoken/verify.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = require_NotBeforeError();
    var TokenExpiredError = require_TokenExpiredError();
    var decode = require_decode();
    var timespan = require_timespan();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var PS_SUPPORTED = require_psSupported();
    var jws = require_jws();
    var { KeyObject, createSecretKey, createPublicKey } = __require("node:crypto");
    var PUB_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var EC_KEY_ALGS = ["ES256", "ES384", "ES512"];
    var RSA_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var HS_ALGS = ["HS256", "HS384", "HS512"];
    if (PS_SUPPORTED) {
      PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
      RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
    }
    module.exports = function(jwtString, secretOrPublicKey, options, callback) {
      if (typeof options === "function" && !callback) {
        callback = options;
        options = {};
      }
      if (!options) {
        options = {};
      }
      options = Object.assign({}, options);
      let done;
      if (callback) {
        done = callback;
      } else {
        done = function(err, data) {
          if (err) throw err;
          return data;
        };
      }
      if (options.clockTimestamp && typeof options.clockTimestamp !== "number") {
        return done(new JsonWebTokenError("clockTimestamp must be a number"));
      }
      if (options.nonce !== void 0 && (typeof options.nonce !== "string" || options.nonce.trim() === "")) {
        return done(new JsonWebTokenError("nonce must be a non-empty string"));
      }
      if (options.allowInvalidAsymmetricKeyTypes !== void 0 && typeof options.allowInvalidAsymmetricKeyTypes !== "boolean") {
        return done(new JsonWebTokenError("allowInvalidAsymmetricKeyTypes must be a boolean"));
      }
      const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1e3);
      if (!jwtString) {
        return done(new JsonWebTokenError("jwt must be provided"));
      }
      if (typeof jwtString !== "string") {
        return done(new JsonWebTokenError("jwt must be a string"));
      }
      const parts = jwtString.split(".");
      if (parts.length !== 3) {
        return done(new JsonWebTokenError("jwt malformed"));
      }
      let decodedToken;
      try {
        decodedToken = decode(jwtString, { complete: true });
      } catch (err) {
        return done(err);
      }
      if (!decodedToken) {
        return done(new JsonWebTokenError("invalid token"));
      }
      const header = decodedToken.header;
      let getSecret;
      if (typeof secretOrPublicKey === "function") {
        if (!callback) {
          return done(new JsonWebTokenError("verify must be called asynchronous if secret or public key is provided as a callback"));
        }
        getSecret = secretOrPublicKey;
      } else {
        getSecret = function(header2, secretCallback) {
          return secretCallback(null, secretOrPublicKey);
        };
      }
      return getSecret(header, function(err, secretOrPublicKey2) {
        if (err) {
          return done(new JsonWebTokenError("error in secret or public key callback: " + err.message));
        }
        const hasSignature = parts[2].trim() !== "";
        if (!hasSignature && secretOrPublicKey2) {
          return done(new JsonWebTokenError("jwt signature is required"));
        }
        if (hasSignature && !secretOrPublicKey2) {
          return done(new JsonWebTokenError("secret or public key must be provided"));
        }
        if (!hasSignature && !options.algorithms) {
          return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
        }
        if (secretOrPublicKey2 != null && !(secretOrPublicKey2 instanceof KeyObject)) {
          try {
            secretOrPublicKey2 = createPublicKey(secretOrPublicKey2);
          } catch (_) {
            try {
              secretOrPublicKey2 = createSecretKey(typeof secretOrPublicKey2 === "string" ? Buffer.from(secretOrPublicKey2) : secretOrPublicKey2);
            } catch (_2) {
              return done(new JsonWebTokenError("secretOrPublicKey is not valid key material"));
            }
          }
        }
        if (!options.algorithms) {
          if (secretOrPublicKey2.type === "secret") {
            options.algorithms = HS_ALGS;
          } else if (["rsa", "rsa-pss"].includes(secretOrPublicKey2.asymmetricKeyType)) {
            options.algorithms = RSA_KEY_ALGS;
          } else if (secretOrPublicKey2.asymmetricKeyType === "ec") {
            options.algorithms = EC_KEY_ALGS;
          } else {
            options.algorithms = PUB_KEY_ALGS;
          }
        }
        if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
          return done(new JsonWebTokenError("invalid algorithm"));
        }
        if (header.alg.startsWith("HS") && secretOrPublicKey2.type !== "secret") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
        } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey2.type !== "public") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInvalidAsymmetricKeyTypes) {
          try {
            validateAsymmetricKey(header.alg, secretOrPublicKey2);
          } catch (e) {
            return done(e);
          }
        }
        let valid;
        try {
          valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey2);
        } catch (e) {
          return done(e);
        }
        if (!valid) {
          return done(new JsonWebTokenError("invalid signature"));
        }
        const payload = decodedToken.payload;
        if (typeof payload.nbf !== "undefined" && !options.ignoreNotBefore) {
          if (typeof payload.nbf !== "number") {
            return done(new JsonWebTokenError("invalid nbf value"));
          }
          if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
            return done(new NotBeforeError("jwt not active", new Date(payload.nbf * 1e3)));
          }
        }
        if (typeof payload.exp !== "undefined" && !options.ignoreExpiration) {
          if (typeof payload.exp !== "number") {
            return done(new JsonWebTokenError("invalid exp value"));
          }
          if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("jwt expired", new Date(payload.exp * 1e3)));
          }
        }
        if (options.audience) {
          const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
          const target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
          const match = target.some(function(targetAudience) {
            return audiences.some(function(audience) {
              return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
            });
          });
          if (!match) {
            return done(new JsonWebTokenError("jwt audience invalid. expected: " + audiences.join(" or ")));
          }
        }
        if (options.issuer) {
          const invalid_issuer = typeof options.issuer === "string" && payload.iss !== options.issuer || Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1;
          if (invalid_issuer) {
            return done(new JsonWebTokenError("jwt issuer invalid. expected: " + options.issuer));
          }
        }
        if (options.subject) {
          if (payload.sub !== options.subject) {
            return done(new JsonWebTokenError("jwt subject invalid. expected: " + options.subject));
          }
        }
        if (options.jwtid) {
          if (payload.jti !== options.jwtid) {
            return done(new JsonWebTokenError("jwt jwtid invalid. expected: " + options.jwtid));
          }
        }
        if (options.nonce) {
          if (payload.nonce !== options.nonce) {
            return done(new JsonWebTokenError("jwt nonce invalid. expected: " + options.nonce));
          }
        }
        if (options.maxAge) {
          if (typeof payload.iat !== "number") {
            return done(new JsonWebTokenError("iat required when maxAge is specified"));
          }
          const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
          if (typeof maxAgeTimestamp === "undefined") {
            return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
          }
          if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("maxAge exceeded", new Date(maxAgeTimestamp * 1e3)));
          }
        }
        if (options.complete === true) {
          const signature = decodedToken.signature;
          return done(null, {
            header,
            payload,
            signature
          });
        }
        return done(null, payload);
      });
    };
  }
});

// node_modules/lodash.includes/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.includes/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var argsTag = "[object Arguments]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var freeParseInt = parseInt;
    function arrayMap(array, iteratee) {
      var index = -1, length = array ? array.length : 0, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeKeys = overArg(Object.keys, Object);
    var nativeMax = Math.max;
    function arrayLikeKeys(value, inherited) {
      var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
      var length = result.length, skipIndexes = !!length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
    }
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    function isFunction(value) {
      var tag = isObject2(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject2(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject2(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject2(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    function values(object) {
      return object ? baseValues(object, keys(object)) : [];
    }
    module.exports = includes;
  }
});

// node_modules/lodash.isboolean/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.isboolean/index.js"(exports, module) {
    var boolTag = "[object Boolean]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isBoolean(value) {
      return value === true || value === false || isObjectLike(value) && objectToString.call(value) == boolTag;
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    module.exports = isBoolean;
  }
});

// node_modules/lodash.isinteger/index.js
var require_lodash3 = __commonJS({
  "node_modules/lodash.isinteger/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isInteger(value) {
      return typeof value == "number" && value == toInteger(value);
    }
    function isObject2(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject2(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject2(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = isInteger;
  }
});

// node_modules/lodash.isnumber/index.js
var require_lodash4 = __commonJS({
  "node_modules/lodash.isnumber/index.js"(exports, module) {
    var numberTag = "[object Number]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isNumber(value) {
      return typeof value == "number" || isObjectLike(value) && objectToString.call(value) == numberTag;
    }
    module.exports = isNumber;
  }
});

// node_modules/lodash.isplainobject/index.js
var require_lodash5 = __commonJS({
  "node_modules/lodash.isplainobject/index.js"(exports, module) {
    var objectTag = "[object Object]";
    function isHostObject(value) {
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {
        }
      }
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    var objectToString = objectProto.toString;
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isPlainObject2(value) {
      if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    module.exports = isPlainObject2;
  }
});

// node_modules/lodash.isstring/index.js
var require_lodash6 = __commonJS({
  "node_modules/lodash.isstring/index.js"(exports, module) {
    var stringTag = "[object String]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var isArray = Array.isArray;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    module.exports = isString;
  }
});

// node_modules/lodash.once/index.js
var require_lodash7 = __commonJS({
  "node_modules/lodash.once/index.js"(exports, module) {
    var FUNC_ERROR_TEXT = "Expected a function";
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function before(n, func) {
      var result;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = void 0;
        }
        return result;
      };
    }
    function once(func) {
      return before(2, func);
    }
    function isObject2(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject2(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject2(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = once;
  }
});

// node_modules/jsonwebtoken/sign.js
var require_sign = __commonJS({
  "node_modules/jsonwebtoken/sign.js"(exports, module) {
    var timespan = require_timespan();
    var PS_SUPPORTED = require_psSupported();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var jws = require_jws();
    var includes = require_lodash();
    var isBoolean = require_lodash2();
    var isInteger = require_lodash3();
    var isNumber = require_lodash4();
    var isPlainObject2 = require_lodash5();
    var isString = require_lodash6();
    var once = require_lodash7();
    var { KeyObject, createSecretKey, createPrivateKey: createPrivateKey2 } = __require("node:crypto");
    var SUPPORTED_ALGS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "HS256", "HS384", "HS512", "none"];
    if (PS_SUPPORTED) {
      SUPPORTED_ALGS.splice(3, 0, "PS256", "PS384", "PS512");
    }
    var sign_options_schema = {
      expiresIn: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"expiresIn" should be a number of seconds or string representing a timespan' },
      notBefore: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"notBefore" should be a number of seconds or string representing a timespan' },
      audience: { isValid: function(value) {
        return isString(value) || Array.isArray(value);
      }, message: '"audience" must be a string or array' },
      algorithm: { isValid: includes.bind(null, SUPPORTED_ALGS), message: '"algorithm" must be a valid string enum value' },
      header: { isValid: isPlainObject2, message: '"header" must be an object' },
      encoding: { isValid: isString, message: '"encoding" must be a string' },
      issuer: { isValid: isString, message: '"issuer" must be a string' },
      subject: { isValid: isString, message: '"subject" must be a string' },
      jwtid: { isValid: isString, message: '"jwtid" must be a string' },
      noTimestamp: { isValid: isBoolean, message: '"noTimestamp" must be a boolean' },
      keyid: { isValid: isString, message: '"keyid" must be a string' },
      mutatePayload: { isValid: isBoolean, message: '"mutatePayload" must be a boolean' },
      allowInsecureKeySizes: { isValid: isBoolean, message: '"allowInsecureKeySizes" must be a boolean' },
      allowInvalidAsymmetricKeyTypes: { isValid: isBoolean, message: '"allowInvalidAsymmetricKeyTypes" must be a boolean' }
    };
    var registered_claims_schema = {
      iat: { isValid: isNumber, message: '"iat" should be a number of seconds' },
      exp: { isValid: isNumber, message: '"exp" should be a number of seconds' },
      nbf: { isValid: isNumber, message: '"nbf" should be a number of seconds' }
    };
    function validate(schema, allowUnknown, object, parameterName) {
      if (!isPlainObject2(object)) {
        throw new Error('Expected "' + parameterName + '" to be a plain object.');
      }
      Object.keys(object).forEach(function(key) {
        const validator = schema[key];
        if (!validator) {
          if (!allowUnknown) {
            throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
          }
          return;
        }
        if (!validator.isValid(object[key])) {
          throw new Error(validator.message);
        }
      });
    }
    function validateOptions(options) {
      return validate(sign_options_schema, false, options, "options");
    }
    function validatePayload(payload) {
      return validate(registered_claims_schema, true, payload, "payload");
    }
    var options_to_payload = {
      "audience": "aud",
      "issuer": "iss",
      "subject": "sub",
      "jwtid": "jti"
    };
    var options_for_objects = [
      "expiresIn",
      "notBefore",
      "noTimestamp",
      "audience",
      "issuer",
      "subject",
      "jwtid"
    ];
    module.exports = function(payload, secretOrPrivateKey, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      } else {
        options = options || {};
      }
      const isObjectPayload = typeof payload === "object" && !Buffer.isBuffer(payload);
      const header = Object.assign({
        alg: options.algorithm || "HS256",
        typ: isObjectPayload ? "JWT" : void 0,
        kid: options.keyid
      }, options.header);
      function failure2(err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (!secretOrPrivateKey && options.algorithm !== "none") {
        return failure2(new Error("secretOrPrivateKey must have a value"));
      }
      if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
        try {
          secretOrPrivateKey = createPrivateKey2(secretOrPrivateKey);
        } catch (_) {
          try {
            secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === "string" ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
          } catch (_2) {
            return failure2(new Error("secretOrPrivateKey is not valid key material"));
          }
        }
      }
      if (header.alg.startsWith("HS") && secretOrPrivateKey.type !== "secret") {
        return failure2(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
      } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
        if (secretOrPrivateKey.type !== "private") {
          return failure2(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInsecureKeySizes && !header.alg.startsWith("ES") && secretOrPrivateKey.asymmetricKeyDetails !== void 0 && //KeyObject.asymmetricKeyDetails is supported in Node 15+
        secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
          return failure2(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
        }
      }
      if (typeof payload === "undefined") {
        return failure2(new Error("payload is required"));
      } else if (isObjectPayload) {
        try {
          validatePayload(payload);
        } catch (error) {
          return failure2(error);
        }
        if (!options.mutatePayload) {
          payload = Object.assign({}, payload);
        }
      } else {
        const invalid_options = options_for_objects.filter(function(opt) {
          return typeof options[opt] !== "undefined";
        });
        if (invalid_options.length > 0) {
          return failure2(new Error("invalid " + invalid_options.join(",") + " option for " + typeof payload + " payload"));
        }
      }
      if (typeof payload.exp !== "undefined" && typeof options.expiresIn !== "undefined") {
        return failure2(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
      }
      if (typeof payload.nbf !== "undefined" && typeof options.notBefore !== "undefined") {
        return failure2(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
      }
      try {
        validateOptions(options);
      } catch (error) {
        return failure2(error);
      }
      if (!options.allowInvalidAsymmetricKeyTypes) {
        try {
          validateAsymmetricKey(header.alg, secretOrPrivateKey);
        } catch (error) {
          return failure2(error);
        }
      }
      const timestamp = payload.iat || Math.floor(Date.now() / 1e3);
      if (options.noTimestamp) {
        delete payload.iat;
      } else if (isObjectPayload) {
        payload.iat = timestamp;
      }
      if (typeof options.notBefore !== "undefined") {
        try {
          payload.nbf = timespan(options.notBefore, timestamp);
        } catch (err) {
          return failure2(err);
        }
        if (typeof payload.nbf === "undefined") {
          return failure2(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      if (typeof options.expiresIn !== "undefined" && typeof payload === "object") {
        try {
          payload.exp = timespan(options.expiresIn, timestamp);
        } catch (err) {
          return failure2(err);
        }
        if (typeof payload.exp === "undefined") {
          return failure2(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      Object.keys(options_to_payload).forEach(function(key) {
        const claim = options_to_payload[key];
        if (typeof options[key] !== "undefined") {
          if (typeof payload[claim] !== "undefined") {
            return failure2(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
          }
          payload[claim] = options[key];
        }
      });
      const encoding = options.encoding || "utf8";
      if (typeof callback === "function") {
        callback = callback && once(callback);
        jws.createSign({
          header,
          privateKey: secretOrPrivateKey,
          payload,
          encoding
        }).once("error", callback).once("done", function(signature) {
          if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
            return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
          }
          callback(null, signature);
        });
      } else {
        let signature = jws.sign({ header, payload, secret: secretOrPrivateKey, encoding });
        if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
          throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
        }
        return signature;
      }
    };
  }
});

// node_modules/jsonwebtoken/index.js
var require_jsonwebtoken = __commonJS({
  "node_modules/jsonwebtoken/index.js"(exports, module) {
    module.exports = {
      decode: require_decode(),
      verify: require_verify(),
      sign: require_sign(),
      JsonWebTokenError: require_JsonWebTokenError(),
      NotBeforeError: require_NotBeforeError(),
      TokenExpiredError: require_TokenExpiredError()
    };
  }
});

// node_modules/@azure/msal-node/dist/error/ClientAuthErrorCodes.mjs
var init_ClientAuthErrorCodes2 = __esm({
  "node_modules/@azure/msal-node/dist/error/ClientAuthErrorCodes.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/client/ClientAssertion.mjs
var import_jsonwebtoken;
var init_ClientAssertion = __esm({
  "node_modules/@azure/msal-node/dist/client/ClientAssertion.mjs"() {
    "use strict";
    import_jsonwebtoken = __toESM(require_jsonwebtoken(), 1);
    init_EncodingUtils();
    init_Constants2();
    init_ClientAuthErrorCodes2();
  }
});

// node_modules/@azure/msal-node/dist/packageMetadata.mjs
var init_packageMetadata = __esm({
  "node_modules/@azure/msal-node/dist/packageMetadata.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/client/BaseClient.mjs
var init_BaseClient = __esm({
  "node_modules/@azure/msal-node/dist/client/BaseClient.mjs"() {
    "use strict";
    init_packageMetadata();
  }
});

// node_modules/@azure/msal-node/dist/client/UsernamePasswordClient.mjs
var init_UsernamePasswordClient = __esm({
  "node_modules/@azure/msal-node/dist/client/UsernamePasswordClient.mjs"() {
    "use strict";
    init_Constants2();
    init_BaseClient();
  }
});

// node_modules/@azure/msal-node/dist/protocol/Authorize.mjs
var init_Authorize = __esm({
  "node_modules/@azure/msal-node/dist/protocol/Authorize.mjs"() {
    "use strict";
    init_Constants2();
    init_packageMetadata();
  }
});

// node_modules/@azure/msal-node/dist/client/ClientApplication.mjs
var init_ClientApplication = __esm({
  "node_modules/@azure/msal-node/dist/client/ClientApplication.mjs"() {
    "use strict";
    init_Configuration();
    init_CryptoProvider();
    init_NodeStorage();
    init_Constants2();
    init_TokenCache();
    init_ClientAssertion();
    init_packageMetadata();
    init_NodeAuthError();
    init_UsernamePasswordClient();
    init_Authorize();
  }
});

// node_modules/@azure/msal-node/dist/network/LoopbackClient.mjs
import http from "node:http";
var init_LoopbackClient = __esm({
  "node_modules/@azure/msal-node/dist/network/LoopbackClient.mjs"() {
    "use strict";
    init_NodeAuthError();
    init_Constants2();
  }
});

// node_modules/@azure/msal-node/dist/client/DeviceCodeClient.mjs
var init_DeviceCodeClient = __esm({
  "node_modules/@azure/msal-node/dist/client/DeviceCodeClient.mjs"() {
    "use strict";
    init_Constants2();
    init_ClientAuthErrorCodes2();
    init_BaseClient();
  }
});

// node_modules/@azure/msal-node/dist/client/PublicClientApplication.mjs
var init_PublicClientApplication = __esm({
  "node_modules/@azure/msal-node/dist/client/PublicClientApplication.mjs"() {
    "use strict";
    init_Constants2();
    init_ClientApplication();
    init_NodeAuthError();
    init_LoopbackClient();
    init_DeviceCodeClient();
    init_packageMetadata();
  }
});

// node_modules/@azure/msal-node/dist/client/ClientCredentialClient.mjs
var init_ClientCredentialClient = __esm({
  "node_modules/@azure/msal-node/dist/client/ClientCredentialClient.mjs"() {
    "use strict";
    init_Constants2();
    init_BaseClient();
  }
});

// node_modules/@azure/msal-node/dist/client/OnBehalfOfClient.mjs
var init_OnBehalfOfClient = __esm({
  "node_modules/@azure/msal-node/dist/client/OnBehalfOfClient.mjs"() {
    "use strict";
    init_Constants2();
    init_EncodingUtils();
    init_BaseClient();
  }
});

// node_modules/@azure/msal-node/dist/client/UserFederatedIdentityCredentialClient.mjs
var init_UserFederatedIdentityCredentialClient = __esm({
  "node_modules/@azure/msal-node/dist/client/UserFederatedIdentityCredentialClient.mjs"() {
    "use strict";
    init_Constants2();
    init_BaseClient();
  }
});

// node_modules/@azure/msal-node/dist/client/ConfidentialClientApplication.mjs
var init_ConfidentialClientApplication = __esm({
  "node_modules/@azure/msal-node/dist/client/ConfidentialClientApplication.mjs"() {
    "use strict";
    init_ClientApplication();
    init_ClientAssertion();
    init_Constants2();
    init_ClientCredentialClient();
    init_OnBehalfOfClient();
    init_UserFederatedIdentityCredentialClient();
    init_ClientAuthErrorCodes2();
  }
});

// node_modules/@azure/msal-node/dist/utils/TimeUtils.mjs
function isIso8601(dateString) {
  if (typeof dateString !== "string") {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString() === dateString;
}
var init_TimeUtils2 = __esm({
  "node_modules/@azure/msal-node/dist/utils/TimeUtils.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/network/HttpClientWithRetries.mjs
var HttpClientWithRetries;
var init_HttpClientWithRetries = __esm({
  "node_modules/@azure/msal-node/dist/network/HttpClientWithRetries.mjs"() {
    "use strict";
    init_index_node();
    init_Constants2();
    HttpClientWithRetries = class {
      constructor(httpClientNoRetries, retryPolicy3, logger27) {
        this.httpClientNoRetries = httpClientNoRetries;
        this.retryPolicy = retryPolicy3;
        this.logger = logger27;
      }
      async sendNetworkRequestAsyncHelper(httpMethod, url, options) {
        if (httpMethod === HttpMethod2.GET) {
          return this.httpClientNoRetries.sendGetRequestAsync(url, options);
        } else {
          return this.httpClientNoRetries.sendPostRequestAsync(url, options);
        }
      }
      async sendNetworkRequestAsync(httpMethod, url, options) {
        let response = await this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
        if ("isNewRequest" in this.retryPolicy) {
          this.retryPolicy.isNewRequest = true;
        }
        let currentRetry = 0;
        while (await this.retryPolicy.pauseForRetry(response.status, currentRetry, this.logger, response.headers[Constants_exports.HeaderNames.RETRY_AFTER])) {
          response = await this.sendNetworkRequestAsyncHelper(httpMethod, url, options);
          currentRetry++;
        }
        return response;
      }
      async sendGetRequestAsync(url, options) {
        return this.sendNetworkRequestAsync(HttpMethod2.GET, url, options);
      }
      async sendPostRequestAsync(url, options) {
        return this.sendNetworkRequestAsync(HttpMethod2.POST, url, options);
      }
    };
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/BaseManagedIdentitySource.mjs
var ManagedIdentityUserAssignedIdQueryParameterNames, BaseManagedIdentitySource;
var init_BaseManagedIdentitySource = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/BaseManagedIdentitySource.mjs"() {
    "use strict";
    init_index_node();
    init_Constants2();
    init_ManagedIdentityError();
    init_TimeUtils2();
    init_HttpClientWithRetries();
    init_ManagedIdentityErrorCodes();
    ManagedIdentityUserAssignedIdQueryParameterNames = {
      MANAGED_IDENTITY_CLIENT_ID_2017: "clientid",
      MANAGED_IDENTITY_CLIENT_ID: "client_id",
      MANAGED_IDENTITY_OBJECT_ID: "object_id",
      MANAGED_IDENTITY_RESOURCE_ID_IMDS: "msi_res_id",
      MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS: "mi_res_id"
    };
    BaseManagedIdentitySource = class {
      /**
       * Creates an instance of BaseManagedIdentitySource.
       *
       * @param logger - Logger instance for diagnostic information
       * @param nodeStorage - Storage interface for caching tokens
       * @param networkClient - Network client for making HTTP requests
       * @param cryptoProvider - Cryptographic provider for token operations
       * @param disableInternalRetries - Whether to disable automatic retry logic
       */
      constructor(logger27, nodeStorage, networkClient, cryptoProvider, disableInternalRetries) {
        this.logger = logger27;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
        this.disableInternalRetries = disableInternalRetries;
      }
      /**
       * Generates a new correlation ID for request tracing.
       *
       * @returns A new GUID string for use as a correlation or request ID
       */
      createCorrelationId() {
        return this.cryptoProvider.createNewGuid();
      }
      /**
       * Processes the network response and converts it to a standardized server token response.
       * This async version allows for source-specific response processing logic while maintaining
       * backward compatibility with the synchronous version.
       *
       * @param response - The network response containing the managed identity token
       * @param _networkClient - Network client used for the request (unused in base implementation)
       * @param _networkRequest - The original network request parameters (unused in base implementation)
       * @param _networkRequestOptions - The network request options (unused in base implementation)
       *
       * @returns Promise resolving to a standardized server authorization token response
       */
      async getServerTokenResponseAsync(response, _networkClient, _networkRequest, _networkRequestOptions) {
        return this.getServerTokenResponse(response);
      }
      /**
       * Converts a managed identity token response to a standardized server authorization token response.
       * Handles time format conversion, expiration calculation, and error mapping to ensure
       * compatibility with the MSAL response handling pipeline.
       *
       * @param response - The network response containing the managed identity token
       *
       * @returns Standardized server authorization token response with normalized fields
       */
      getServerTokenResponse(response) {
        let refreshIn, expiresIn;
        if (response.body.expires_on) {
          if (isIso8601(response.body.expires_on)) {
            response.body.expires_on = new Date(response.body.expires_on).getTime() / 1e3;
          }
          expiresIn = response.body.expires_on - TimeUtils_exports.nowSeconds();
          if (expiresIn > 2 * 3600) {
            refreshIn = expiresIn / 2;
          }
        }
        const serverTokenResponse = {
          status: response.status,
          // success
          access_token: response.body.access_token,
          expires_in: expiresIn,
          scope: response.body.resource,
          token_type: response.body.token_type,
          refresh_in: refreshIn,
          // error
          correlation_id: response.body.correlation_id || response.body.correlationId,
          error: typeof response.body.error === "string" ? response.body.error : response.body.error?.code,
          error_description: response.body.message || (typeof response.body.error === "string" ? response.body.error_description : response.body.error?.message),
          error_codes: response.body.error_codes,
          timestamp: response.body.timestamp,
          trace_id: response.body.trace_id
        };
        return serverTokenResponse;
      }
      /**
       * Acquires an access token using the managed identity endpoint for the specified resource.
       * This is the primary method for token acquisition, handling the complete flow from
       * request creation through response processing and token caching.
       *
       * @param managedIdentityRequest - The managed identity request containing resource and optional parameters
       * @param managedIdentityId - The managed identity configuration (system or user-assigned)
       * @param fakeAuthority - Authority instance used for token caching (managed identity uses a placeholder authority)
       * @param refreshAccessToken - Whether this is a token refresh operation
       *
       * @returns Promise resolving to an authentication result containing the access token and metadata
       *
       * @throws {AuthError} When network requests fail or token validation fails
       * @throws {ClientAuthError} When network errors occur during the request
       */
      async acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
        const networkRequest = this.createRequest(managedIdentityRequest.resource, managedIdentityId);
        if (managedIdentityRequest.revokedTokenSha256Hash) {
          this.logger.info(`[Managed Identity] The following claims are present in the request: ${managedIdentityRequest.claims}`, "");
          networkRequest.queryParameters[ManagedIdentityQueryParameters.SHA256_TOKEN_TO_REFRESH] = managedIdentityRequest.revokedTokenSha256Hash;
        }
        if (managedIdentityRequest.clientCapabilities?.length) {
          const clientCapabilities = managedIdentityRequest.clientCapabilities.toString();
          this.logger.info(`[Managed Identity] The following client capabilities are present in the request: ${clientCapabilities}`, "");
          networkRequest.queryParameters[ManagedIdentityQueryParameters.XMS_CC] = clientCapabilities;
        }
        const headers = networkRequest.headers;
        headers[Constants_exports.HeaderNames.CONTENT_TYPE] = Constants_exports.URL_FORM_CONTENT_TYPE;
        const networkRequestOptions = { headers };
        if (Object.keys(networkRequest.bodyParameters).length) {
          networkRequestOptions.body = networkRequest.computeParametersBodyString();
        }
        const networkClientHelper = this.disableInternalRetries ? this.networkClient : new HttpClientWithRetries(this.networkClient, networkRequest.retryPolicy, this.logger);
        const reqTimestamp = TimeUtils_exports.nowSeconds();
        let response;
        try {
          if (networkRequest.httpMethod === HttpMethod2.POST) {
            response = await networkClientHelper.sendPostRequestAsync(networkRequest.computeUri(), networkRequestOptions);
          } else {
            response = await networkClientHelper.sendGetRequestAsync(networkRequest.computeUri(), networkRequestOptions);
          }
        } catch (error) {
          if (error instanceof AuthError2) {
            throw error;
          } else {
            throw createClientAuthError(ClientAuthErrorCodes_exports.networkError, managedIdentityRequest.correlationId);
          }
        }
        const responseHandler = new ResponseHandler(managedIdentityId.id, this.nodeStorage, this.cryptoProvider, this.logger, new StubPerformanceClient(), null, null);
        const serverTokenResponse = await this.getServerTokenResponseAsync(response, networkClientHelper, networkRequest, networkRequestOptions);
        responseHandler.validateTokenResponse(serverTokenResponse, serverTokenResponse.correlation_id || "", refreshAccessToken);
        return responseHandler.handleServerTokenResponse(serverTokenResponse, fakeAuthority, reqTimestamp, managedIdentityRequest, ApiId.acquireTokenWithManagedIdentity);
      }
      /**
       * Determines the appropriate query parameter name for user-assigned managed identity
       * based on the identity type, API version, and endpoint characteristics.
       * Different Azure services and API versions use different parameter names for the same identity types.
       *
       * @param managedIdentityIdType - The type of user-assigned managed identity (client ID, object ID, or resource ID)
       * @param isImds - Whether the request is being made to the IMDS (Instance Metadata Service) endpoint
       * @param usesApi2017 - Whether the endpoint uses the 2017-09-01 API version (affects client ID parameter name)
       *
       * @returns The correct query parameter name for the specified identity type and endpoint
       *
       * @throws {ManagedIdentityError} When an invalid managed identity ID type is provided
       */
      getManagedIdentityUserAssignedIdQueryParameterKey(managedIdentityIdType, isImds, usesApi2017) {
        switch (managedIdentityIdType) {
          case ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
            this.logger.info(`[Managed Identity] [API version ${usesApi2017 ? "2017+" : "2019+"}] Adding user assigned client id to the request.`, "");
            return usesApi2017 ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID_2017 : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;
          case ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
            this.logger.info("[Managed Identity] Adding user assigned resource id to the request.", "");
            return isImds ? ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_IMDS : ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID_NON_IMDS;
          case ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
            this.logger.info("[Managed Identity] Adding user assigned object id to the request.", "");
            return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
          default:
            throw createManagedIdentityError(invalidManagedIdentityIdType, "");
        }
      }
    };
    BaseManagedIdentitySource.getValidatedEnvVariableUrlString = (envVariableStringName, envVariable, sourceName, logger27) => {
      try {
        return new UrlString(envVariable, "").urlString;
      } catch (error) {
        logger27.info(`[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`, "");
        throw createManagedIdentityError(MsiEnvironmentVariableUrlMalformedErrorCodes[envVariableStringName], "");
      }
    };
  }
});

// node_modules/@azure/msal-node/dist/retry/LinearRetryStrategy.mjs
var init_LinearRetryStrategy = __esm({
  "node_modules/@azure/msal-node/dist/retry/LinearRetryStrategy.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/retry/DefaultManagedIdentityRetryPolicy.mjs
var DEFAULT_MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON;
var init_DefaultManagedIdentityRetryPolicy = __esm({
  "node_modules/@azure/msal-node/dist/retry/DefaultManagedIdentityRetryPolicy.mjs"() {
    "use strict";
    init_index_node();
    init_LinearRetryStrategy();
    DEFAULT_MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON = [
      Constants_exports.HTTP_NOT_FOUND,
      Constants_exports.HTTP_REQUEST_TIMEOUT,
      Constants_exports.HTTP_TOO_MANY_REQUESTS,
      Constants_exports.HTTP_SERVER_ERROR,
      Constants_exports.HTTP_SERVICE_UNAVAILABLE,
      Constants_exports.HTTP_GATEWAY_TIMEOUT
    ];
  }
});

// node_modules/@azure/msal-node/dist/config/ManagedIdentityRequestParameters.mjs
var init_ManagedIdentityRequestParameters = __esm({
  "node_modules/@azure/msal-node/dist/config/ManagedIdentityRequestParameters.mjs"() {
    "use strict";
    init_DefaultManagedIdentityRetryPolicy();
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/AppService.mjs
var init_AppService = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/AppService.mjs"() {
    "use strict";
    init_BaseManagedIdentitySource();
    init_Constants2();
    init_ManagedIdentityRequestParameters();
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/AzureArc.mjs
import { accessSync, constants, statSync, readFileSync } from "node:fs";
import path from "node:path";
var SUPPORTED_AZURE_ARC_PLATFORMS, AZURE_ARC_FILE_DETECTION;
var init_AzureArc = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/AzureArc.mjs"() {
    "use strict";
    init_ManagedIdentityRequestParameters();
    init_BaseManagedIdentitySource();
    init_ManagedIdentityError();
    init_Constants2();
    init_ManagedIdentityErrorCodes();
    SUPPORTED_AZURE_ARC_PLATFORMS = {
      win32: `${process.env["ProgramData"]}\\AzureConnectedMachineAgent\\Tokens\\`,
      linux: "/var/opt/azcmagent/tokens/"
    };
    AZURE_ARC_FILE_DETECTION = {
      win32: `${process.env["ProgramFiles"]}\\AzureConnectedMachineAgent\\himds.exe`,
      linux: "/opt/azcmagent/bin/himds"
    };
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/CloudShell.mjs
var init_CloudShell = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/CloudShell.mjs"() {
    "use strict";
    init_ManagedIdentityRequestParameters();
    init_BaseManagedIdentitySource();
    init_Constants2();
    init_ManagedIdentityError();
    init_ManagedIdentityErrorCodes();
  }
});

// node_modules/@azure/msal-node/dist/retry/ExponentialRetryStrategy.mjs
var init_ExponentialRetryStrategy = __esm({
  "node_modules/@azure/msal-node/dist/retry/ExponentialRetryStrategy.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/retry/ImdsRetryPolicy.mjs
var HTTP_STATUS_400_CODES_FOR_EXPONENTIAL_STRATEGY, HTTP_STATUS_GONE_RETRY_AFTER_MS;
var init_ImdsRetryPolicy = __esm({
  "node_modules/@azure/msal-node/dist/retry/ImdsRetryPolicy.mjs"() {
    "use strict";
    init_index_node();
    init_ExponentialRetryStrategy();
    HTTP_STATUS_400_CODES_FOR_EXPONENTIAL_STRATEGY = [
      Constants_exports.HTTP_NOT_FOUND,
      Constants_exports.HTTP_REQUEST_TIMEOUT,
      Constants_exports.HTTP_GONE,
      Constants_exports.HTTP_TOO_MANY_REQUESTS
    ];
    HTTP_STATUS_GONE_RETRY_AFTER_MS = 10 * 1e3;
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/Imds.mjs
var IMDS_TOKEN_PATH, DEFAULT_IMDS_ENDPOINT;
var init_Imds = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/Imds.mjs"() {
    "use strict";
    init_ManagedIdentityRequestParameters();
    init_BaseManagedIdentitySource();
    init_Constants2();
    init_ImdsRetryPolicy();
    init_packageMetadata();
    IMDS_TOKEN_PATH = "/metadata/identity/oauth2/token";
    DEFAULT_IMDS_ENDPOINT = `http://169.254.169.254${IMDS_TOKEN_PATH}`;
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/ServiceFabric.mjs
var init_ServiceFabric = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/ServiceFabric.mjs"() {
    "use strict";
    init_ManagedIdentityRequestParameters();
    init_BaseManagedIdentitySource();
    init_Constants2();
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/MachineLearning.mjs
var MANAGED_IDENTITY_MACHINE_LEARNING_UNSUPPORTED_ID_TYPE_ERROR;
var init_MachineLearning = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentitySources/MachineLearning.mjs"() {
    "use strict";
    init_BaseManagedIdentitySource();
    init_Constants2();
    init_ManagedIdentityRequestParameters();
    MANAGED_IDENTITY_MACHINE_LEARNING_UNSUPPORTED_ID_TYPE_ERROR = `Only client id is supported for user-assigned managed identity in ${ManagedIdentitySourceNames.MACHINE_LEARNING}.`;
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentityClient.mjs
var init_ManagedIdentityClient = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentityClient.mjs"() {
    "use strict";
    init_AppService();
    init_AzureArc();
    init_CloudShell();
    init_Imds();
    init_ServiceFabric();
    init_ManagedIdentityError();
    init_Constants2();
    init_MachineLearning();
    init_ManagedIdentityErrorCodes();
  }
});

// node_modules/@azure/msal-node/dist/client/ManagedIdentityApplication.mjs
var SOURCES_THAT_SUPPORT_TOKEN_REVOCATION;
var init_ManagedIdentityApplication = __esm({
  "node_modules/@azure/msal-node/dist/client/ManagedIdentityApplication.mjs"() {
    "use strict";
    init_Configuration();
    init_packageMetadata();
    init_CryptoProvider();
    init_ClientCredentialClient();
    init_ManagedIdentityClient();
    init_NodeStorage();
    init_Constants2();
    init_HashUtils();
    SOURCES_THAT_SUPPORT_TOKEN_REVOCATION = [ManagedIdentitySourceNames.SERVICE_FABRIC];
  }
});

// node_modules/@azure/msal-node/dist/cache/distributed/DistributedCachePlugin.mjs
var init_DistributedCachePlugin = __esm({
  "node_modules/@azure/msal-node/dist/cache/distributed/DistributedCachePlugin.mjs"() {
    "use strict";
  }
});

// node_modules/@azure/msal-node/dist/index.mjs
var PromptValue2, ResponseMode2;
var init_dist = __esm({
  "node_modules/@azure/msal-node/dist/index.mjs"() {
    "use strict";
    init_internals();
    init_index_node();
    init_PublicClientApplication();
    init_ConfidentialClientApplication();
    init_ManagedIdentityApplication();
    init_ClientAssertion();
    init_TokenCache();
    init_DistributedCachePlugin();
    init_Constants2();
    init_CryptoProvider();
    init_packageMetadata();
    PromptValue2 = Constants_exports.PromptValue;
    ResponseMode2 = Constants_exports.ResponseMode;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/random.js
var init_random = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/random.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/delay.js
var init_delay = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/delay.js"() {
    init_random();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/object.js
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input) && !(input instanceof RegExp) && !(input instanceof Date);
}
var init_object = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/object.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/error.js
function isError(e) {
  if (isObject(e)) {
    const hasName = typeof e.name === "string";
    const hasMessage = typeof e.message === "string";
    return hasName && hasMessage;
  }
  return false;
}
var init_error = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/error.js"() {
    init_object();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/sha256.js
import { createHash as createHash2, createHmac } from "node:crypto";
var init_sha256 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/sha256.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/uuidUtils.js
function randomUUID2() {
  return globalThis.crypto.randomUUID();
}
var init_uuidUtils = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/uuidUtils.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/bytesEncoding.js
var init_bytesEncoding = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/bytesEncoding.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/sanitizer.js
var RedactedString, defaultAllowedHeaderNames, defaultAllowedQueryParameters, Sanitizer;
var init_sanitizer = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/sanitizer.js"() {
    init_object();
    RedactedString = "REDACTED";
    defaultAllowedHeaderNames = [
      "x-ms-client-request-id",
      "x-ms-return-client-request-id",
      "x-ms-useragent",
      "x-ms-correlation-request-id",
      "x-ms-request-id",
      "client-request-id",
      "ms-cv",
      "return-client-request-id",
      "traceparent",
      "Access-Control-Allow-Credentials",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Origin",
      "Access-Control-Expose-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Request-Headers",
      "Access-Control-Request-Method",
      "Origin",
      "Accept",
      "Accept-Encoding",
      "Cache-Control",
      "Connection",
      "Content-Length",
      "Content-Type",
      "Date",
      "ETag",
      "Expires",
      "If-Match",
      "If-Modified-Since",
      "If-None-Match",
      "If-Unmodified-Since",
      "Last-Modified",
      "Pragma",
      "Request-Id",
      "Retry-After",
      "Server",
      "Transfer-Encoding",
      "User-Agent",
      "WWW-Authenticate"
    ];
    defaultAllowedQueryParameters = ["api-version"];
    Sanitizer = class {
      allowedHeaderNames;
      allowedQueryParameters;
      constructor({ additionalAllowedHeaderNames: allowedHeaderNames = [], additionalAllowedQueryParameters: allowedQueryParameters = [] } = {}) {
        allowedHeaderNames = defaultAllowedHeaderNames.concat(allowedHeaderNames);
        allowedQueryParameters = defaultAllowedQueryParameters.concat(allowedQueryParameters);
        this.allowedHeaderNames = new Set(allowedHeaderNames.map((n) => n.toLowerCase()));
        this.allowedQueryParameters = new Set(allowedQueryParameters.map((p) => p.toLowerCase()));
      }
      /**
       * Sanitizes an object for logging.
       * @param obj - The object to sanitize
       * @returns - The sanitized object as a string
       */
      sanitize(obj) {
        const seen = /* @__PURE__ */ new Set();
        return JSON.stringify(obj, (key, value) => {
          if (value instanceof Error) {
            return {
              ...value,
              name: value.name,
              message: value.message
            };
          }
          if (key === "headers" && isObject(value)) {
            return this.sanitizeHeaders(value);
          } else if (key === "url" && typeof value === "string") {
            return this.sanitizeUrl(value);
          } else if (key === "query" && isObject(value)) {
            return this.sanitizeQuery(value);
          } else if (key === "body") {
            return void 0;
          } else if (key === "response") {
            return void 0;
          } else if (key === "operationSpec") {
            return void 0;
          } else if (Array.isArray(value) || isObject(value)) {
            if (seen.has(value)) {
              return "[Circular]";
            }
            seen.add(value);
          }
          return value;
        }, 2);
      }
      /**
       * Sanitizes a URL for logging.
       * @param value - The URL to sanitize
       * @returns - The sanitized URL as a string
       */
      sanitizeUrl(value) {
        if (typeof value !== "string" || value === null || value === "") {
          return value;
        }
        const url = new URL(value);
        if (!url.search) {
          return value;
        }
        for (const [key] of url.searchParams) {
          if (!this.allowedQueryParameters.has(key.toLowerCase())) {
            url.searchParams.set(key, RedactedString);
          }
        }
        return url.toString();
      }
      sanitizeHeaders(obj) {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
          if (this.allowedHeaderNames.has(key.toLowerCase())) {
            sanitized[key] = obj[key];
          } else {
            sanitized[key] = RedactedString;
          }
        }
        return sanitized;
      }
      sanitizeQuery(value) {
        if (typeof value !== "object" || value === null) {
          return value;
        }
        const sanitized = {};
        for (const k of Object.keys(value)) {
          if (this.allowedQueryParameters.has(k.toLowerCase())) {
            sanitized[k] = value[k];
          } else {
            sanitized[k] = RedactedString;
          }
        }
        return sanitized;
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/internal.js
var init_internal2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/internal.js"() {
    init_delay();
    init_random();
    init_object();
    init_error();
    init_sha256();
    init_uuidUtils();
    init_env();
    init_bytesEncoding();
    init_sanitizer();
  }
});

// node_modules/@azure/core-util/dist/esm/aborterUtils.js
var init_aborterUtils = __esm({
  "node_modules/@azure/core-util/dist/esm/aborterUtils.js"() {
  }
});

// node_modules/@azure/abort-controller/dist/esm/AbortError.js
var AbortError;
var init_AbortError = __esm({
  "node_modules/@azure/abort-controller/dist/esm/AbortError.js"() {
    AbortError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "AbortError";
      }
    };
  }
});

// node_modules/@azure/abort-controller/dist/esm/index.js
var init_esm3 = __esm({
  "node_modules/@azure/abort-controller/dist/esm/index.js"() {
    init_AbortError();
  }
});

// node_modules/@azure/core-util/dist/esm/createAbortablePromise.js
function createAbortablePromise(buildPromise, options) {
  const { cleanupBeforeAbort, abortSignal, abortErrorMsg } = options ?? {};
  return new Promise((resolve, reject) => {
    function rejectOnAbort() {
      reject(new AbortError(abortErrorMsg ?? "The operation was aborted."));
    }
    function removeListeners() {
      abortSignal?.removeEventListener("abort", onAbort);
    }
    function onAbort() {
      cleanupBeforeAbort?.();
      removeListeners();
      rejectOnAbort();
    }
    if (abortSignal?.aborted) {
      return rejectOnAbort();
    }
    try {
      buildPromise((x) => {
        removeListeners();
        resolve(x);
      }, (x) => {
        removeListeners();
        reject(x);
      });
    } catch (err) {
      reject(err);
    }
    abortSignal?.addEventListener("abort", onAbort);
  });
}
var init_createAbortablePromise = __esm({
  "node_modules/@azure/core-util/dist/esm/createAbortablePromise.js"() {
    init_esm3();
  }
});

// node_modules/@azure/core-util/dist/esm/delay.js
function delay2(timeInMs, options) {
  let token;
  const { abortSignal, abortErrorMsg } = options ?? {};
  return createAbortablePromise((resolve) => {
    token = setTimeout(resolve, timeInMs);
  }, {
    cleanupBeforeAbort: () => clearTimeout(token),
    abortSignal,
    abortErrorMsg: abortErrorMsg ?? StandardAbortMessage
  });
}
var StandardAbortMessage;
var init_delay2 = __esm({
  "node_modules/@azure/core-util/dist/esm/delay.js"() {
    init_createAbortablePromise();
    StandardAbortMessage = "The delay was aborted.";
  }
});

// node_modules/@azure/core-util/dist/esm/error.js
var init_error2 = __esm({
  "node_modules/@azure/core-util/dist/esm/error.js"() {
    init_internal2();
  }
});

// node_modules/@azure/core-util/dist/esm/typeGuards.js
var init_typeGuards = __esm({
  "node_modules/@azure/core-util/dist/esm/typeGuards.js"() {
  }
});

// node_modules/@azure/core-util/dist/esm/index.js
var init_esm4 = __esm({
  "node_modules/@azure/core-util/dist/esm/index.js"() {
    init_internal2();
    init_aborterUtils();
    init_createAbortablePromise();
    init_delay2();
    init_error2();
    init_typeGuards();
  }
});

// node_modules/@azure/identity/dist/esm/msal/msal.js
var init_msal = __esm({
  "node_modules/@azure/identity/dist/esm/msal/msal.js"() {
    init_dist();
  }
});

// node_modules/@azure/identity/dist/esm/msal/utils.js
var logger3;
var init_utils = __esm({
  "node_modules/@azure/identity/dist/esm/msal/utils.js"() {
    init_errors();
    init_logging();
    init_constants();
    init_esm4();
    init_esm3();
    init_msal();
    logger3 = credentialLogger("IdentityUtils");
  }
});

// node_modules/@azure/core-client/dist/esm/base64.js
var init_base64 = __esm({
  "node_modules/@azure/core-client/dist/esm/base64.js"() {
    init_esm4();
  }
});

// node_modules/@azure/core-client/dist/esm/interfaces.js
var init_interfaces = __esm({
  "node_modules/@azure/core-client/dist/esm/interfaces.js"() {
  }
});

// node_modules/@azure/core-client/dist/esm/utils.js
var init_utils2 = __esm({
  "node_modules/@azure/core-client/dist/esm/utils.js"() {
  }
});

// node_modules/@azure/core-client/dist/esm/serializer.js
var init_serializer = __esm({
  "node_modules/@azure/core-client/dist/esm/serializer.js"() {
    init_base64();
    init_interfaces();
    init_utils2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/abort-controller/AbortError.js
var init_AbortError2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/abort-controller/AbortError.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/httpHeaders.js
function normalizeName(name2) {
  return name2.toLowerCase();
}
function normalizeValue(value) {
  return String(value).trim().replace(/[\r\n]/g, "");
}
function* headerIterator(map) {
  for (const entry of map.values()) {
    yield [entry.name, entry.value];
  }
}
function createHttpHeaders(rawHeaders) {
  return new HttpHeadersImpl(rawHeaders);
}
var HttpHeadersImpl;
var init_httpHeaders = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/httpHeaders.js"() {
    HttpHeadersImpl = class {
      _headersMap;
      constructor(rawHeaders) {
        this._headersMap = /* @__PURE__ */ new Map();
        if (rawHeaders) {
          for (const headerName of Object.keys(rawHeaders)) {
            this.set(headerName, rawHeaders[headerName]);
          }
        }
      }
      /**
       * Set a header in this collection with the provided name and value. The name is
       * case-insensitive.
       * @param name - The name of the header to set. This value is case-insensitive.
       * @param value - The value of the header to set.
       */
      set(name2, value) {
        this._headersMap.set(normalizeName(name2), { name: name2, value: normalizeValue(value) });
      }
      /**
       * Get the header value for the provided header name, or undefined if no header exists in this
       * collection with the provided name.
       * @param name - The name of the header. This value is case-insensitive.
       */
      get(name2) {
        return this._headersMap.get(normalizeName(name2))?.value;
      }
      /**
       * Get whether or not this header collection contains a header entry for the provided header name.
       * @param name - The name of the header to set. This value is case-insensitive.
       */
      has(name2) {
        return this._headersMap.has(normalizeName(name2));
      }
      /**
       * Remove the header with the provided headerName.
       * @param name - The name of the header to remove.
       */
      delete(name2) {
        this._headersMap.delete(normalizeName(name2));
      }
      /**
       * Get the JSON object representation of this HTTP header collection.
       */
      toJSON(options = {}) {
        const result = {};
        if (options.preserveCase) {
          for (const entry of this._headersMap.values()) {
            result[entry.name] = entry.value;
          }
        } else {
          for (const [normalizedName, entry] of this._headersMap) {
            result[normalizedName] = entry.value;
          }
        }
        return result;
      }
      /**
       * Get the string representation of this HTTP header collection.
       */
      toString() {
        return JSON.stringify(this.toJSON({ preserveCase: true }));
      }
      /**
       * Iterate over tuples of header [name, value] pairs.
       */
      [Symbol.iterator]() {
        return headerIterator(this._headersMap);
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/pipelineRequest.js
function createPipelineRequest(options) {
  return new PipelineRequestImpl(options);
}
var PipelineRequestImpl;
var init_pipelineRequest = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/pipelineRequest.js"() {
    init_httpHeaders();
    init_uuidUtils();
    PipelineRequestImpl = class {
      url;
      method;
      headers;
      timeout;
      withCredentials;
      body;
      multipartBody;
      formData;
      streamResponseStatusCodes;
      enableBrowserStreams;
      proxySettings;
      disableKeepAlive;
      abortSignal;
      requestId;
      allowInsecureConnection;
      onUploadProgress;
      onDownloadProgress;
      requestOverrides;
      authSchemes;
      constructor(options) {
        this.url = options.url;
        this.body = options.body;
        this.headers = options.headers ?? createHttpHeaders();
        this.method = options.method ?? "GET";
        this.timeout = options.timeout ?? 0;
        this.multipartBody = options.multipartBody;
        this.formData = options.formData;
        this.disableKeepAlive = options.disableKeepAlive ?? false;
        this.proxySettings = options.proxySettings;
        this.streamResponseStatusCodes = options.streamResponseStatusCodes;
        this.withCredentials = options.withCredentials ?? false;
        this.abortSignal = options.abortSignal;
        this.onUploadProgress = options.onUploadProgress;
        this.onDownloadProgress = options.onDownloadProgress;
        this.requestId = options.requestId || randomUUID2();
        this.allowInsecureConnection = options.allowInsecureConnection ?? false;
        this.enableBrowserStreams = options.enableBrowserStreams ?? false;
        this.requestOverrides = options.requestOverrides;
        this.authSchemes = options.authSchemes;
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/pipeline.js
function createEmptyPipeline() {
  return HttpPipeline.create();
}
var ValidPhaseNames, HttpPipeline;
var init_pipeline = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/pipeline.js"() {
    ValidPhaseNames = /* @__PURE__ */ new Set(["Deserialize", "Serialize", "Retry", "Sign"]);
    HttpPipeline = class _HttpPipeline {
      _policies = [];
      _orderedPolicies;
      constructor(policies) {
        this._policies = policies?.slice(0) ?? [];
        this._orderedPolicies = void 0;
      }
      addPolicy(policy, options = {}) {
        if (options.phase && options.afterPhase) {
          throw new Error("Policies inside a phase cannot specify afterPhase.");
        }
        if (options.phase && !ValidPhaseNames.has(options.phase)) {
          throw new Error(`Invalid phase name: ${options.phase}`);
        }
        if (options.afterPhase && !ValidPhaseNames.has(options.afterPhase)) {
          throw new Error(`Invalid afterPhase name: ${options.afterPhase}`);
        }
        this._policies.push({
          policy,
          options
        });
        this._orderedPolicies = void 0;
      }
      removePolicy(options) {
        const removedPolicies = [];
        this._policies = this._policies.filter((policyDescriptor) => {
          if (options.name && policyDescriptor.policy.name === options.name || options.phase && policyDescriptor.options.phase === options.phase) {
            removedPolicies.push(policyDescriptor.policy);
            return false;
          } else {
            return true;
          }
        });
        this._orderedPolicies = void 0;
        return removedPolicies;
      }
      sendRequest(httpClient, request) {
        const policies = this.getOrderedPolicies();
        const pipeline = policies.reduceRight((next, policy) => {
          return (req) => {
            return policy.sendRequest(req, next);
          };
        }, (req) => httpClient.sendRequest(req));
        return pipeline(request);
      }
      getOrderedPolicies() {
        if (!this._orderedPolicies) {
          this._orderedPolicies = this.orderPolicies();
        }
        return this._orderedPolicies;
      }
      clone() {
        return new _HttpPipeline(this._policies);
      }
      static create() {
        return new _HttpPipeline();
      }
      orderPolicies() {
        const result = [];
        const policyMap = /* @__PURE__ */ new Map();
        function createPhase(name2) {
          return {
            name: name2,
            policies: /* @__PURE__ */ new Set(),
            hasRun: false,
            hasAfterPolicies: false
          };
        }
        const serializePhase = createPhase("Serialize");
        const noPhase = createPhase("None");
        const deserializePhase = createPhase("Deserialize");
        const retryPhase = createPhase("Retry");
        const signPhase = createPhase("Sign");
        const orderedPhases = [serializePhase, noPhase, deserializePhase, retryPhase, signPhase];
        function getPhase(phase) {
          if (phase === "Retry") {
            return retryPhase;
          } else if (phase === "Serialize") {
            return serializePhase;
          } else if (phase === "Deserialize") {
            return deserializePhase;
          } else if (phase === "Sign") {
            return signPhase;
          } else {
            return noPhase;
          }
        }
        for (const descriptor of this._policies) {
          const policy = descriptor.policy;
          const options = descriptor.options;
          const policyName = policy.name;
          if (policyMap.has(policyName)) {
            throw new Error("Duplicate policy names not allowed in pipeline");
          }
          const node = {
            policy,
            dependsOn: /* @__PURE__ */ new Set(),
            dependants: /* @__PURE__ */ new Set()
          };
          if (options.afterPhase) {
            node.afterPhase = getPhase(options.afterPhase);
            node.afterPhase.hasAfterPolicies = true;
          }
          policyMap.set(policyName, node);
          const phase = getPhase(options.phase);
          phase.policies.add(node);
        }
        for (const descriptor of this._policies) {
          const { policy, options } = descriptor;
          const policyName = policy.name;
          const node = policyMap.get(policyName);
          if (!node) {
            throw new Error(`Missing node for policy ${policyName}`);
          }
          if (options.afterPolicies) {
            for (const afterPolicyName of options.afterPolicies) {
              const afterNode = policyMap.get(afterPolicyName);
              if (afterNode) {
                node.dependsOn.add(afterNode);
                afterNode.dependants.add(node);
              }
            }
          }
          if (options.beforePolicies) {
            for (const beforePolicyName of options.beforePolicies) {
              const beforeNode = policyMap.get(beforePolicyName);
              if (beforeNode) {
                beforeNode.dependsOn.add(node);
                node.dependants.add(beforeNode);
              }
            }
          }
        }
        function walkPhase(phase) {
          phase.hasRun = true;
          for (const node of phase.policies) {
            if (node.afterPhase && (!node.afterPhase.hasRun || node.afterPhase.policies.size)) {
              continue;
            }
            if (node.dependsOn.size === 0) {
              result.push(node.policy);
              for (const dependant of node.dependants) {
                dependant.dependsOn.delete(node);
              }
              policyMap.delete(node.policy.name);
              phase.policies.delete(node);
            }
          }
        }
        function walkPhases() {
          for (const phase of orderedPhases) {
            walkPhase(phase);
            if (phase.policies.size > 0 && phase !== noPhase) {
              if (!noPhase.hasRun) {
                walkPhase(noPhase);
              }
              return;
            }
            if (phase.hasAfterPolicies) {
              walkPhase(noPhase);
            }
          }
        }
        let iteration = 0;
        while (policyMap.size > 0) {
          iteration++;
          const initialResultLength = result.length;
          walkPhases();
          if (result.length <= initialResultLength && iteration > 1) {
            throw new Error("Cannot satisfy policy dependencies due to requirements cycle.");
          }
        }
        return result;
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/inspect.js
import { inspect } from "node:util";
var custom;
var init_inspect = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/inspect.js"() {
    custom = inspect.custom;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/restError.js
function isRestError(e) {
  if (e instanceof RestError) {
    return true;
  }
  return isError(e) && e.name === "RestError";
}
var errorSanitizer, RestError;
var init_restError = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/restError.js"() {
    init_error();
    init_inspect();
    init_sanitizer();
    errorSanitizer = new Sanitizer();
    RestError = class _RestError extends Error {
      /**
       * Something went wrong when making the request.
       * This means the actual request failed for some reason,
       * such as a DNS issue or the connection being lost.
       */
      static REQUEST_SEND_ERROR = "REQUEST_SEND_ERROR";
      /**
       * This means that parsing the response from the server failed.
       * It may have been malformed.
       */
      static PARSE_ERROR = "PARSE_ERROR";
      /**
       * The code of the error itself (use statics on RestError if possible.)
       */
      code;
      /**
       * The HTTP status code of the request (if applicable.)
       */
      statusCode;
      /**
       * The request that was made.
       * This property is non-enumerable.
       */
      request;
      /**
       * The response received (if any.)
       * This property is non-enumerable.
       */
      response;
      /**
       * Bonus property set by the throw site.
       */
      details;
      constructor(message, options = {}) {
        super(message);
        this.name = "RestError";
        this.code = options.code;
        this.statusCode = options.statusCode;
        Object.defineProperty(this, "request", { value: options.request, enumerable: false });
        Object.defineProperty(this, "response", { value: options.response, enumerable: false });
        const agent = this.request?.agent ? {
          maxFreeSockets: this.request.agent.maxFreeSockets,
          maxSockets: this.request.agent.maxSockets
        } : void 0;
        Object.defineProperty(this, custom, {
          value: () => {
            return `RestError: ${this.message} 
 ${errorSanitizer.sanitize({
              ...this,
              request: { ...this.request, agent },
              response: this.response
            })}`;
          },
          enumerable: false
        });
        Object.setPrototypeOf(this, _RestError.prototype);
      }
    };
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/log.js
var logger4;
var init_log2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/log.js"() {
    init_logger();
    logger4 = createClientLogger("ts-http-runtime");
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/nodeHttpClient.js
import http2 from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import { Transform } from "node:stream";
var init_nodeHttpClient = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/nodeHttpClient.js"() {
    init_AbortError2();
    init_httpHeaders();
    init_restError();
    init_log2();
    init_sanitizer();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/defaultHttpClient.js
var init_defaultHttpClient = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/defaultHttpClient.js"() {
    init_nodeHttpClient();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/logPolicy.js
var init_logPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/logPolicy.js"() {
    init_log2();
    init_sanitizer();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/userAgentPlatform.js
import os from "node:os";
import process4 from "node:process";
function getHeaderName() {
  return "User-Agent";
}
var init_userAgentPlatform = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/userAgentPlatform.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/constants.js
var init_constants2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/constants.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/userAgent.js
function getUserAgentHeaderName() {
  return getHeaderName();
}
var init_userAgent = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/userAgent.js"() {
    init_userAgentPlatform();
    init_constants2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/userAgentPolicy.js
var UserAgentHeaderName;
var init_userAgentPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/userAgentPolicy.js"() {
    init_userAgent();
    UserAgentHeaderName = getUserAgentHeaderName();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/helpers.js
var init_helpers = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/helpers.js"() {
    init_AbortError2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/retryStrategies/throttlingRetryStrategy.js
var init_throttlingRetryStrategy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/retryStrategies/throttlingRetryStrategy.js"() {
    init_helpers();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/retryStrategies/exponentialRetryStrategy.js
var DEFAULT_CLIENT_MAX_RETRY_INTERVAL;
var init_exponentialRetryStrategy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/retryStrategies/exponentialRetryStrategy.js"() {
    init_delay();
    init_throttlingRetryStrategy();
    DEFAULT_CLIENT_MAX_RETRY_INTERVAL = 1e3 * 64;
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/retryPolicy.js
var retryPolicyLogger;
var init_retryPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/retryPolicy.js"() {
    init_helpers();
    init_restError();
    init_AbortError2();
    init_logger();
    init_constants2();
    retryPolicyLogger = createClientLogger("ts-http-runtime retryPolicy");
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/defaultRetryPolicy.js
var init_defaultRetryPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/defaultRetryPolicy.js"() {
    init_exponentialRetryStrategy();
    init_throttlingRetryStrategy();
    init_retryPolicy();
    init_constants2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/formData.js
var init_formData = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/formData.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/formDataPolicy.js
var init_formDataPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/formDataPolicy.js"() {
    init_bytesEncoding();
    init_formData();
    init_httpHeaders();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/agentPolicy.js
var init_agentPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/agentPolicy.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/tlsPolicy.js
var init_tlsPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/tlsPolicy.js"() {
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports, module) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable2;
      createDebug.enable = enable2;
      createDebug.enabled = enabled2;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy2;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend2;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend2(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable2(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable2() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled2(name2) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name2, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name2, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy2() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports, module) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports, module) {
    "use strict";
    module.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports, module) {
    "use strict";
    var os4 = __require("node:os");
    var tty = __require("node:tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os4.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version2 = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version2 >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("node:tty");
    var util2 = __require("node:util");
    exports.init = init;
    exports.log = log2;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name2, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name2} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name2 + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log2(...args) {
      return process.stderr.write(util2.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/agent-base/dist/helpers.js
var require_helpers = __commonJS({
  "node_modules/agent-base/dist/helpers.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.req = exports.json = exports.toBuffer = void 0;
    var http3 = __importStar(__require("node:http"));
    var https2 = __importStar(__require("node:https"));
    async function toBuffer(stream) {
      let length = 0;
      const chunks = [];
      for await (const chunk of stream) {
        length += chunk.length;
        chunks.push(chunk);
      }
      return Buffer.concat(chunks, length);
    }
    exports.toBuffer = toBuffer;
    async function json(stream) {
      const buf = await toBuffer(stream);
      const str = buf.toString("utf8");
      try {
        return JSON.parse(str);
      } catch (_err) {
        const err = _err;
        err.message += ` (input: ${str})`;
        throw err;
      }
    }
    exports.json = json;
    function req(url, opts = {}) {
      const href = typeof url === "string" ? url : url.href;
      const req2 = (href.startsWith("https:") ? https2 : http3).request(url, opts);
      const promise = new Promise((resolve, reject) => {
        req2.once("response", resolve).once("error", reject).end();
      });
      req2.then = promise.then.bind(promise);
      return req2;
    }
    exports.req = req;
  }
});

// node_modules/agent-base/dist/index.js
var require_dist = __commonJS({
  "node_modules/agent-base/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Agent = void 0;
    var net = __importStar(__require("node:net"));
    var http3 = __importStar(__require("node:http"));
    var https_1 = __require("node:https");
    __exportStar(require_helpers(), exports);
    var INTERNAL = Symbol("AgentBaseInternalState");
    var Agent = class extends http3.Agent {
      constructor(opts) {
        super(opts);
        this[INTERNAL] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(options) {
        if (options) {
          if (typeof options.secureEndpoint === "boolean") {
            return options.secureEndpoint;
          }
          if (typeof options.protocol === "string") {
            return options.protocol === "https:";
          }
        }
        const { stack } = new Error();
        if (typeof stack !== "string")
          return false;
        return stack.split("\n").some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(name2) {
        if (this.maxSockets === Infinity && this.maxTotalSockets === Infinity) {
          return null;
        }
        if (!this.sockets[name2]) {
          this.sockets[name2] = [];
        }
        const fakeSocket = new net.Socket({ writable: false });
        this.sockets[name2].push(fakeSocket);
        this.totalSocketCount++;
        return fakeSocket;
      }
      decrementSockets(name2, socket) {
        if (!this.sockets[name2] || socket === null) {
          return;
        }
        const sockets = this.sockets[name2];
        const index = sockets.indexOf(socket);
        if (index !== -1) {
          sockets.splice(index, 1);
          this.totalSocketCount--;
          if (sockets.length === 0) {
            delete this.sockets[name2];
          }
        }
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(options) {
        const secureEndpoint = this.isSecureEndpoint(options);
        if (secureEndpoint) {
          return https_1.Agent.prototype.getName.call(this, options);
        }
        return super.getName(options);
      }
      createSocket(req, options, cb) {
        const connectOpts = {
          ...options,
          secureEndpoint: this.isSecureEndpoint(options)
        };
        const name2 = this.getName(connectOpts);
        const fakeSocket = this.incrementSockets(name2);
        Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
          this.decrementSockets(name2, fakeSocket);
          if (socket instanceof http3.Agent) {
            try {
              return socket.addRequest(req, connectOpts);
            } catch (err) {
              return cb(err);
            }
          }
          this[INTERNAL].currentSocket = socket;
          super.createSocket(req, options, cb);
        }, (err) => {
          this.decrementSockets(name2, fakeSocket);
          cb(err);
        });
      }
      createConnection() {
        const socket = this[INTERNAL].currentSocket;
        this[INTERNAL].currentSocket = void 0;
        if (!socket) {
          throw new Error("No socket was returned in the `connect()` function");
        }
        return socket;
      }
      get defaultPort() {
        return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].defaultPort = v;
        }
      }
      get protocol() {
        return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(v) {
        if (this[INTERNAL]) {
          this[INTERNAL].protocol = v;
        }
      }
    };
    exports.Agent = Agent;
  }
});

// node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseProxyResponse = void 0;
    var debug_1 = __importDefault(require_src());
    var debug = (0, debug_1.default)("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0;
        const buffers = [];
        function read() {
          const b = socket.read();
          if (b)
            ondata(b);
          else
            socket.once("readable", read);
        }
        function cleanup() {
          socket.removeListener("end", onend);
          socket.removeListener("error", onerror);
          socket.removeListener("readable", read);
        }
        function onend() {
          cleanup();
          debug("onend");
          reject(new Error("Proxy connection ended before receiving CONNECT response"));
        }
        function onerror(err) {
          cleanup();
          debug("onerror %o", err);
          reject(err);
        }
        function ondata(b) {
          buffers.push(b);
          buffersLength += b.length;
          const buffered = Buffer.concat(buffers, buffersLength);
          const endOfHeaders = buffered.indexOf("\r\n\r\n");
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet...");
            read();
            return;
          }
          const headerParts = buffered.slice(0, endOfHeaders).toString("ascii").split("\r\n");
          const firstLine = headerParts.shift();
          if (!firstLine) {
            socket.destroy();
            return reject(new Error("No header received from proxy CONNECT response"));
          }
          const firstLineParts = firstLine.split(" ");
          const statusCode = +firstLineParts[1];
          const statusText = firstLineParts.slice(2).join(" ");
          const headers = {};
          for (const header of headerParts) {
            if (!header)
              continue;
            const firstColon = header.indexOf(":");
            if (firstColon === -1) {
              socket.destroy();
              return reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
            }
            const key = header.slice(0, firstColon).toLowerCase();
            const value = header.slice(firstColon + 1).trimStart();
            const current = headers[key];
            if (typeof current === "string") {
              headers[key] = [current, value];
            } else if (Array.isArray(current)) {
              current.push(value);
            } else {
              headers[key] = value;
            }
          }
          debug("got proxy server response: %o %o", firstLine, headers);
          cleanup();
          resolve({
            connect: {
              statusCode,
              statusText,
              headers
            },
            buffered
          });
        }
        socket.on("error", onerror);
        socket.on("end", onend);
        read();
      });
    }
    exports.parseProxyResponse = parseProxyResponse;
  }
});

// node_modules/https-proxy-agent/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/https-proxy-agent/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpsProxyAgent = void 0;
    var net = __importStar(__require("node:net"));
    var tls = __importStar(__require("node:tls"));
    var assert_1 = __importDefault(__require("node:assert"));
    var debug_1 = __importDefault(require_src());
    var agent_base_1 = require_dist();
    var url_1 = __require("node:url");
    var parse_proxy_response_1 = require_parse_proxy_response();
    var debug = (0, debug_1.default)("https-proxy-agent");
    var setServernameFromNonIpHost = (options) => {
      if (options.servername === void 0 && options.host && !net.isIP(options.host)) {
        return {
          ...options,
          servername: options.host
        };
      }
      return options;
    };
    var HttpsProxyAgent2 = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts);
        this.options = { path: void 0 };
        this.proxy = typeof proxy === "string" ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
        const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          // Attempt to negotiate http/1.1 for proxy servers that support http/2
          ALPNProtocols: ["http/1.1"],
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       */
      async connect(req, opts) {
        const { proxy } = this;
        if (!opts.host) {
          throw new TypeError('No "host" provided');
        }
        let socket;
        if (proxy.protocol === "https:") {
          debug("Creating `tls.Socket`: %o", this.connectOpts);
          socket = tls.connect(setServernameFromNonIpHost(this.connectOpts));
        } else {
          debug("Creating `net.Socket`: %o", this.connectOpts);
          socket = net.connect(this.connectOpts);
        }
        const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
        const host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host;
        let payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
        if (proxy.username || proxy.password) {
          const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        headers.Host = `${host}:${opts.port}`;
        if (!headers["Proxy-Connection"]) {
          headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
        }
        for (const name2 of Object.keys(headers)) {
          payload += `${name2}: ${headers[name2]}\r
`;
        }
        const proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r
`);
        const { connect, buffered } = await proxyResponsePromise;
        req.emit("proxyConnect", connect);
        this.emit("proxyConnect", connect, req);
        if (connect.statusCode === 200) {
          req.once("socket", resume);
          if (opts.secureEndpoint) {
            debug("Upgrading socket connection to TLS");
            return tls.connect({
              ...omit(setServernameFromNonIpHost(opts), "host", "path", "port"),
              socket
            });
          }
          return socket;
        }
        socket.destroy();
        const fakeSocket = new net.Socket({ writable: false });
        fakeSocket.readable = true;
        req.once("socket", (s) => {
          debug("Replaying proxy buffer for failed request");
          (0, assert_1.default)(s.listenerCount("data") > 0);
          s.push(buffered);
          s.push(null);
        });
        return fakeSocket;
      }
    };
    HttpsProxyAgent2.protocols = ["http", "https"];
    exports.HttpsProxyAgent = HttpsProxyAgent2;
    function resume(socket) {
      socket.resume();
    }
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// node_modules/http-proxy-agent/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/http-proxy-agent/dist/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpProxyAgent = void 0;
    var net = __importStar(__require("node:net"));
    var tls = __importStar(__require("node:tls"));
    var debug_1 = __importDefault(require_src());
    var events_1 = __require("node:events");
    var agent_base_1 = require_dist();
    var url_1 = __require("node:url");
    var debug = (0, debug_1.default)("http-proxy-agent");
    var HttpProxyAgent2 = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts);
        this.proxy = typeof proxy === "string" ? new url_1.URL(proxy) : proxy;
        this.proxyHeaders = opts?.headers ?? {};
        debug("Creating new HttpProxyAgent instance: %o", this.proxy.href);
        const host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, "");
        const port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      addRequest(req, opts) {
        req._header = null;
        this.setRequestProps(req, opts);
        super.addRequest(req, opts);
      }
      setRequestProps(req, opts) {
        const { proxy } = this;
        const protocol = opts.secureEndpoint ? "https:" : "http:";
        const hostname = req.getHeader("host") || "localhost";
        const base = `${protocol}//${hostname}`;
        const url = new url_1.URL(req.path, base);
        if (opts.port !== 80) {
          url.port = String(opts.port);
        }
        req.path = String(url);
        const headers = typeof this.proxyHeaders === "function" ? this.proxyHeaders() : { ...this.proxyHeaders };
        if (proxy.username || proxy.password) {
          const auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        if (!headers["Proxy-Connection"]) {
          headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close";
        }
        for (const name2 of Object.keys(headers)) {
          const value = headers[name2];
          if (value) {
            req.setHeader(name2, value);
          }
        }
      }
      async connect(req, opts) {
        req._header = null;
        if (!req.path.includes("://")) {
          this.setRequestProps(req, opts);
        }
        let first;
        let endOfHeaders;
        debug("Regenerating stored HTTP header string for request");
        req._implicitHeader();
        if (req.outputData && req.outputData.length > 0) {
          debug("Patching connection write() output buffer with updated header");
          first = req.outputData[0].data;
          endOfHeaders = first.indexOf("\r\n\r\n") + 4;
          req.outputData[0].data = req._header + first.substring(endOfHeaders);
          debug("Output buffer: %o", req.outputData[0].data);
        }
        let socket;
        if (this.proxy.protocol === "https:") {
          debug("Creating `tls.Socket`: %o", this.connectOpts);
          socket = tls.connect(this.connectOpts);
        } else {
          debug("Creating `net.Socket`: %o", this.connectOpts);
          socket = net.connect(this.connectOpts);
        }
        await (0, events_1.once)(socket, "connect");
        return socket;
      }
    };
    HttpProxyAgent2.protocols = ["http", "https"];
    exports.HttpProxyAgent = HttpProxyAgent2;
    function omit(obj, ...keys) {
      const ret = {};
      let key;
      for (key in obj) {
        if (!keys.includes(key)) {
          ret[key] = obj[key];
        }
      }
      return ret;
    }
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/proxyPolicy.js
var import_https_proxy_agent, import_http_proxy_agent;
var init_proxyPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/proxyPolicy.js"() {
    import_https_proxy_agent = __toESM(require_dist2(), 1);
    import_http_proxy_agent = __toESM(require_dist3(), 1);
    init_log2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/decompressResponsePolicy.js
var init_decompressResponsePolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/decompressResponsePolicy.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/redirectPolicy.js
var init_redirectPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/redirectPolicy.js"() {
    init_log2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/platformPolicies.js
var init_platformPolicies = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/platformPolicies.js"() {
    init_agentPolicy();
    init_tlsPolicy();
    init_proxyPolicy();
    init_decompressResponsePolicy();
    init_redirectPolicy();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/typeGuards-node.js
import { Readable } from "node:stream";
var init_typeGuards_node = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/typeGuards-node.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/typeGuards.js
var init_typeGuards2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/typeGuards.js"() {
    init_typeGuards_node();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/util/concat.js
import { Readable as Readable2 } from "node:stream";
var init_concat = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/util/concat.js"() {
    init_typeGuards2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/multipartPolicy.js
var validBoundaryCharacters;
var init_multipartPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/multipartPolicy.js"() {
    init_bytesEncoding();
    init_typeGuards2();
    init_uuidUtils();
    init_concat();
    validBoundaryCharacters = new Set(`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'()+,-./:=?`);
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/createPipelineFromOptions.js
var init_createPipelineFromOptions = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/createPipelineFromOptions.js"() {
    init_logPolicy();
    init_pipeline();
    init_userAgentPolicy();
    init_defaultRetryPolicy();
    init_formDataPolicy();
    init_platformPolicies();
    init_multipartPolicy();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/apiVersionPolicy.js
var init_apiVersionPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/apiVersionPolicy.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/auth/credentials.js
var init_credentials = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/auth/credentials.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/checkInsecureConnection.js
var init_checkInsecureConnection = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/checkInsecureConnection.js"() {
    init_log2();
    init_env();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/apiKeyAuthenticationPolicy.js
var init_apiKeyAuthenticationPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/apiKeyAuthenticationPolicy.js"() {
    init_checkInsecureConnection();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/basicAuthenticationPolicy.js
var init_basicAuthenticationPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/basicAuthenticationPolicy.js"() {
    init_bytesEncoding();
    init_checkInsecureConnection();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/bearerAuthenticationPolicy.js
var init_bearerAuthenticationPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/bearerAuthenticationPolicy.js"() {
    init_checkInsecureConnection();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/oauth2AuthenticationPolicy.js
var init_oauth2AuthenticationPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/auth/oauth2AuthenticationPolicy.js"() {
    init_checkInsecureConnection();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/clientHelpers.js
var init_clientHelpers = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/clientHelpers.js"() {
    init_defaultHttpClient();
    init_createPipelineFromOptions();
    init_apiVersionPolicy();
    init_credentials();
    init_apiKeyAuthenticationPolicy();
    init_basicAuthenticationPolicy();
    init_bearerAuthenticationPolicy();
    init_oauth2AuthenticationPolicy();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/multipart.js
var init_multipart = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/multipart.js"() {
    init_restError();
    init_httpHeaders();
    init_bytesEncoding();
    init_typeGuards2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/sendRequest.js
var init_sendRequest = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/sendRequest.js"() {
    init_restError();
    init_httpHeaders();
    init_pipelineRequest();
    init_clientHelpers();
    init_typeGuards2();
    init_multipart();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/urlHelpers.js
var init_urlHelpers = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/urlHelpers.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/getClient.js
var init_getClient = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/getClient.js"() {
    init_clientHelpers();
    init_sendRequest();
    init_urlHelpers();
    init_env();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/operationOptionHelpers.js
var init_operationOptionHelpers = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/operationOptionHelpers.js"() {
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/client/restError.js
var init_restError2 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/client/restError.js"() {
    init_restError();
    init_httpHeaders();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/index.js
var init_esm5 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/index.js"() {
    init_AbortError2();
    init_logger();
    init_httpHeaders();
    init_pipelineRequest();
    init_pipeline();
    init_restError();
    init_bytesEncoding();
    init_defaultHttpClient();
    init_getClient();
    init_operationOptionHelpers();
    init_restError2();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/pipeline.js
function createEmptyPipeline2() {
  return createEmptyPipeline();
}
var init_pipeline2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/pipeline.js"() {
    init_esm5();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/log.js
var logger5;
var init_log3 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/log.js"() {
    init_esm();
    logger5 = createClientLogger2("core-rest-pipeline");
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/exponentialRetryPolicy.js
var init_exponentialRetryPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/exponentialRetryPolicy.js"() {
    init_exponentialRetryStrategy();
    init_retryPolicy();
    init_constants2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/systemErrorRetryPolicy.js
var init_systemErrorRetryPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/systemErrorRetryPolicy.js"() {
    init_exponentialRetryStrategy();
    init_retryPolicy();
    init_constants2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/throttlingRetryPolicy.js
var init_throttlingRetryPolicy = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/throttlingRetryPolicy.js"() {
    init_throttlingRetryStrategy();
    init_retryPolicy();
    init_constants2();
  }
});

// node_modules/@typespec/ts-http-runtime/dist/esm/policies/internal.js
var init_internal3 = __esm({
  "node_modules/@typespec/ts-http-runtime/dist/esm/policies/internal.js"() {
    init_agentPolicy();
    init_decompressResponsePolicy();
    init_defaultRetryPolicy();
    init_exponentialRetryPolicy();
    init_retryPolicy();
    init_systemErrorRetryPolicy();
    init_throttlingRetryPolicy();
    init_formDataPolicy();
    init_logPolicy();
    init_multipartPolicy();
    init_proxyPolicy();
    init_redirectPolicy();
    init_tlsPolicy();
    init_userAgentPolicy();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/logPolicy.js
var init_logPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/logPolicy.js"() {
    init_log3();
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/redirectPolicy.js
var init_redirectPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/redirectPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/userAgentPlatform.js
import os2 from "node:os";
import process5 from "node:process";
function getHeaderName2() {
  return "User-Agent";
}
var init_userAgentPlatform2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/userAgentPlatform.js"() {
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/constants.js
var init_constants3 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/constants.js"() {
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/userAgent.js
function getUserAgentHeaderName2() {
  return getHeaderName2();
}
var init_userAgent2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/userAgent.js"() {
    init_userAgentPlatform2();
    init_constants3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/userAgentPolicy.js
var UserAgentHeaderName2;
var init_userAgentPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/userAgentPolicy.js"() {
    init_userAgent2();
    UserAgentHeaderName2 = getUserAgentHeaderName2();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/createFile.js
var init_createFile = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/createFile.js"() {
    init_file();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/file.js
var rawContent;
var init_file = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/file.js"() {
    init_createFile();
    rawContent = Symbol("rawContent");
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/multipartPolicy.js
var init_multipartPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/multipartPolicy.js"() {
    init_internal3();
    init_file();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/decompressResponsePolicy.js
var init_decompressResponsePolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/decompressResponsePolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/defaultRetryPolicy.js
var init_defaultRetryPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/defaultRetryPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/formDataPolicy.js
var init_formDataPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/formDataPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/proxyPolicy.js
var init_proxyPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/proxyPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/setClientRequestIdPolicy.js
var init_setClientRequestIdPolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/setClientRequestIdPolicy.js"() {
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/agentPolicy.js
var init_agentPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/agentPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/tlsPolicy.js
var init_tlsPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/tlsPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/restError.js
function isRestError2(e) {
  return isRestError(e);
}
var init_restError3 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/restError.js"() {
    init_esm5();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/tracingPolicy.js
var init_tracingPolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/tracingPolicy.js"() {
    init_esm2();
    init_constants3();
    init_userAgent2();
    init_log3();
    init_esm4();
    init_restError3();
    init_internal2();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/wrapAbortSignal.js
var init_wrapAbortSignal = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/wrapAbortSignal.js"() {
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/wrapAbortSignalLikePolicy.js
var init_wrapAbortSignalLikePolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/wrapAbortSignalLikePolicy.js"() {
    init_wrapAbortSignal();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/createPipelineFromOptions.js
var init_createPipelineFromOptions2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/createPipelineFromOptions.js"() {
    init_logPolicy2();
    init_pipeline2();
    init_redirectPolicy2();
    init_userAgentPolicy2();
    init_multipartPolicy2();
    init_decompressResponsePolicy2();
    init_defaultRetryPolicy2();
    init_formDataPolicy2();
    init_esm4();
    init_proxyPolicy2();
    init_setClientRequestIdPolicy();
    init_agentPolicy2();
    init_tlsPolicy2();
    init_tracingPolicy();
    init_wrapAbortSignalLikePolicy();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/defaultHttpClient.js
var init_defaultHttpClient2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/defaultHttpClient.js"() {
    init_esm5();
    init_wrapAbortSignal();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/httpHeaders.js
var init_httpHeaders2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/httpHeaders.js"() {
    init_esm5();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/pipelineRequest.js
function createPipelineRequest2(options) {
  return createPipelineRequest(options);
}
var init_pipelineRequest2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/pipelineRequest.js"() {
    init_esm5();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/exponentialRetryPolicy.js
var init_exponentialRetryPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/exponentialRetryPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/systemErrorRetryPolicy.js
var init_systemErrorRetryPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/systemErrorRetryPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/throttlingRetryPolicy.js
var init_throttlingRetryPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/throttlingRetryPolicy.js"() {
    init_internal3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/retryPolicy.js
var retryPolicyLogger2;
var init_retryPolicy2 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/retryPolicy.js"() {
    init_esm();
    init_constants3();
    init_internal3();
    retryPolicyLogger2 = createClientLogger2("core-rest-pipeline retryPolicy");
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/util/tokenCycler.js
async function beginRefresh(getAccessToken, retryIntervalInMs, refreshTimeout) {
  async function tryGetAccessToken() {
    if (Date.now() < refreshTimeout) {
      try {
        return await getAccessToken();
      } catch {
        return null;
      }
    } else {
      const finalToken = await getAccessToken();
      if (finalToken === null) {
        throw new Error("Failed to refresh access token.");
      }
      return finalToken;
    }
  }
  let token = await tryGetAccessToken();
  while (token === null) {
    await delay2(retryIntervalInMs);
    token = await tryGetAccessToken();
  }
  return token;
}
function createTokenCycler(credential, tokenCyclerOptions) {
  let refreshWorker = null;
  let token = null;
  let tenantId;
  const options = {
    ...DEFAULT_CYCLER_OPTIONS,
    ...tokenCyclerOptions
  };
  const cycler = {
    /**
     * Produces true if a refresh job is currently in progress.
     */
    get isRefreshing() {
      return refreshWorker !== null;
    },
    /**
     * Produces true if the cycler SHOULD refresh (we are within the refresh
     * window and not already refreshing)
     */
    get shouldRefresh() {
      if (token === null) {
        return true;
      }
      if (cycler.isRefreshing) {
        return false;
      }
      if (token.refreshAfterTimestamp && token.refreshAfterTimestamp < Date.now()) {
        return true;
      }
      return token.expiresOnTimestamp - options.refreshWindowInMs < Date.now();
    },
    /**
     * Produces true if the cycler MUST refresh (null or nearly-expired
     * token).
     */
    get mustRefresh() {
      return token === null || token.expiresOnTimestamp - options.forcedRefreshWindowInMs < Date.now();
    }
  };
  function refresh(scopes, getTokenOptions) {
    if (!cycler.isRefreshing) {
      const tryGetAccessToken = () => credential.getToken(scopes, getTokenOptions);
      refreshWorker = beginRefresh(
        tryGetAccessToken,
        options.retryIntervalInMs,
        // If we don't have a token, then we should timeout immediately
        token?.expiresOnTimestamp ?? Date.now()
      ).then((_token) => {
        refreshWorker = null;
        token = _token;
        tenantId = getTokenOptions.tenantId;
        return token;
      }).catch((reason) => {
        refreshWorker = null;
        token = null;
        tenantId = void 0;
        throw reason;
      });
    }
    return refreshWorker;
  }
  return async (scopes, tokenOptions) => {
    const hasClaimChallenge = Boolean(tokenOptions.claims);
    const tenantIdChanged = tenantId !== tokenOptions.tenantId;
    if (hasClaimChallenge) {
      token = null;
    }
    const mustRefresh = tenantIdChanged || hasClaimChallenge || cycler.mustRefresh;
    if (mustRefresh) {
      return refresh(scopes, tokenOptions);
    }
    if (cycler.shouldRefresh) {
      refresh(scopes, tokenOptions);
    }
    return token;
  };
}
var DEFAULT_CYCLER_OPTIONS;
var init_tokenCycler = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/util/tokenCycler.js"() {
    init_esm4();
    DEFAULT_CYCLER_OPTIONS = {
      forcedRefreshWindowInMs: 1e3,
      // Force waiting for a refresh 1s before the token expires
      retryIntervalInMs: 3e3,
      // Allow refresh attempts every 3s
      refreshWindowInMs: 1e3 * 60 * 2
      // Start refreshing 2m before expiry
    };
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/bearerTokenAuthenticationPolicy.js
async function trySendRequest(request, next) {
  try {
    return [await next(request), void 0];
  } catch (e) {
    if (isRestError2(e) && e.response) {
      return [e.response, e];
    } else {
      throw e;
    }
  }
}
async function defaultAuthorizeRequest(options) {
  const { scopes, getAccessToken, request } = options;
  const getTokenOptions = {
    abortSignal: request.abortSignal,
    tracingOptions: request.tracingOptions,
    enableCae: true
  };
  const accessToken = await getAccessToken(scopes, getTokenOptions);
  if (accessToken) {
    options.request.headers.set("Authorization", `Bearer ${accessToken.token}`);
  }
}
function isChallengeResponse(response) {
  return response.status === 401 && response.headers.has("WWW-Authenticate");
}
async function authorizeRequestOnCaeChallenge(onChallengeOptions, caeClaims) {
  const { scopes } = onChallengeOptions;
  const accessToken = await onChallengeOptions.getAccessToken(scopes, {
    enableCae: true,
    claims: caeClaims
  });
  if (!accessToken) {
    return false;
  }
  onChallengeOptions.request.headers.set("Authorization", `${accessToken.tokenType ?? "Bearer"} ${accessToken.token}`);
  return true;
}
function bearerTokenAuthenticationPolicy(options) {
  const { credential, scopes, challengeCallbacks } = options;
  const logger27 = options.logger || logger5;
  const callbacks = {
    authorizeRequest: challengeCallbacks?.authorizeRequest?.bind(challengeCallbacks) ?? defaultAuthorizeRequest,
    authorizeRequestOnChallenge: challengeCallbacks?.authorizeRequestOnChallenge?.bind(challengeCallbacks)
  };
  const getAccessToken = credential ? createTokenCycler(
    credential
    /* , options */
  ) : () => Promise.resolve(null);
  return {
    name: bearerTokenAuthenticationPolicyName,
    /**
     * If there's no challenge parameter:
     * - It will try to retrieve the token using the cache, or the credential's getToken.
     * - Then it will try the next policy with or without the retrieved token.
     *
     * It uses the challenge parameters to:
     * - Skip a first attempt to get the token from the credential if there's no cached token,
     *   since it expects the token to be retrievable only after the challenge.
     * - Prepare the outgoing request if the `prepareRequest` method has been provided.
     * - Send an initial request to receive the challenge if it fails.
     * - Process a challenge if the response contains it.
     * - Retrieve a token with the challenge information, then re-send the request.
     */
    async sendRequest(request, next) {
      if (!request.url.toLowerCase().startsWith("https://")) {
        throw new Error("Bearer token authentication is not permitted for non-TLS protected (non-https) URLs.");
      }
      await callbacks.authorizeRequest({
        scopes: Array.isArray(scopes) ? scopes : [scopes],
        request,
        getAccessToken,
        logger: logger27
      });
      let response;
      let error;
      let shouldSendRequest;
      [response, error] = await trySendRequest(request, next);
      if (isChallengeResponse(response)) {
        let claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate"));
        if (claims) {
          let parsedClaim;
          try {
            parsedClaim = atob(claims);
          } catch (e) {
            logger27.warning(`The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`);
            return response;
          }
          shouldSendRequest = await authorizeRequestOnCaeChallenge({
            scopes: Array.isArray(scopes) ? scopes : [scopes],
            response,
            request,
            getAccessToken,
            logger: logger27
          }, parsedClaim);
          if (shouldSendRequest) {
            [response, error] = await trySendRequest(request, next);
          }
        } else if (callbacks.authorizeRequestOnChallenge) {
          shouldSendRequest = await callbacks.authorizeRequestOnChallenge({
            scopes: Array.isArray(scopes) ? scopes : [scopes],
            request,
            response,
            getAccessToken,
            logger: logger27
          });
          if (shouldSendRequest) {
            [response, error] = await trySendRequest(request, next);
          }
          if (isChallengeResponse(response)) {
            claims = getCaeChallengeClaims(response.headers.get("WWW-Authenticate") ?? "");
            if (claims) {
              let parsedClaim;
              try {
                parsedClaim = atob(claims);
              } catch (e) {
                logger27.warning(`The WWW-Authenticate header contains "claims" that cannot be parsed. Unable to perform the Continuous Access Evaluation authentication flow. Unparsable claims: ${claims}`);
                return response;
              }
              shouldSendRequest = await authorizeRequestOnCaeChallenge({
                scopes: Array.isArray(scopes) ? scopes : [scopes],
                response,
                request,
                getAccessToken,
                logger: logger27
              }, parsedClaim);
              if (shouldSendRequest) {
                [response, error] = await trySendRequest(request, next);
              }
            }
          }
        }
      }
      if (error) {
        throw error;
      } else {
        return response;
      }
    }
  };
}
function parseChallenges(challenges) {
  const challengeRegex = /(\w+)\s+((?:\w+=(?:"[^"]*"|[^,]*),?\s*)+)/g;
  const paramRegex = /(\w+)="([^"]*)"/g;
  const parsedChallenges = [];
  let match;
  while ((match = challengeRegex.exec(challenges)) !== null) {
    const scheme = match[1];
    const paramsString = match[2];
    const params = {};
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsString)) !== null) {
      params[paramMatch[1]] = paramMatch[2];
    }
    parsedChallenges.push({ scheme, params });
  }
  return parsedChallenges;
}
function getCaeChallengeClaims(challenges) {
  if (!challenges) {
    return;
  }
  const parsedChallenges = parseChallenges(challenges);
  return parsedChallenges.find((x) => x.scheme === "Bearer" && x.params.claims && x.params.error === "insufficient_claims")?.params.claims;
}
var bearerTokenAuthenticationPolicyName;
var init_bearerTokenAuthenticationPolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/bearerTokenAuthenticationPolicy.js"() {
    init_tokenCycler();
    init_log3();
    init_restError3();
    bearerTokenAuthenticationPolicyName = "bearerTokenAuthenticationPolicy";
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/ndJsonPolicy.js
var init_ndJsonPolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/ndJsonPolicy.js"() {
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/policies/auxiliaryAuthenticationHeaderPolicy.js
var init_auxiliaryAuthenticationHeaderPolicy = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/policies/auxiliaryAuthenticationHeaderPolicy.js"() {
    init_tokenCycler();
    init_log3();
  }
});

// node_modules/@azure/core-rest-pipeline/dist/esm/index.js
var init_esm6 = __esm({
  "node_modules/@azure/core-rest-pipeline/dist/esm/index.js"() {
    init_pipeline2();
    init_createPipelineFromOptions2();
    init_defaultHttpClient2();
    init_httpHeaders2();
    init_pipelineRequest2();
    init_restError3();
    init_decompressResponsePolicy2();
    init_exponentialRetryPolicy2();
    init_setClientRequestIdPolicy();
    init_logPolicy2();
    init_multipartPolicy2();
    init_proxyPolicy2();
    init_redirectPolicy2();
    init_systemErrorRetryPolicy2();
    init_throttlingRetryPolicy2();
    init_retryPolicy2();
    init_tracingPolicy();
    init_defaultRetryPolicy2();
    init_userAgentPolicy2();
    init_tlsPolicy2();
    init_formDataPolicy2();
    init_bearerTokenAuthenticationPolicy();
    init_ndJsonPolicy();
    init_auxiliaryAuthenticationHeaderPolicy();
    init_agentPolicy2();
    init_file();
  }
});

// node_modules/@azure/core-client/dist/commonjs/state-cjs.js
var require_state_cjs2 = __commonJS({
  "node_modules/@azure/core-client/dist/commonjs/state-cjs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.state = void 0;
    exports.state = {
      operationRequestMap: /* @__PURE__ */ new WeakMap()
    };
  }
});

// node_modules/@azure/core-client/dist/esm/state.js
var import_state_cjs2;
var init_state2 = __esm({
  "node_modules/@azure/core-client/dist/esm/state.js"() {
    import_state_cjs2 = __toESM(require_state_cjs2(), 1);
  }
});

// node_modules/@azure/core-client/dist/esm/operationHelpers.js
var originalRequestSymbol;
var init_operationHelpers = __esm({
  "node_modules/@azure/core-client/dist/esm/operationHelpers.js"() {
    init_state2();
    originalRequestSymbol = Symbol.for("@azure/core-client original request");
  }
});

// node_modules/@azure/core-client/dist/esm/deserializationPolicy.js
var init_deserializationPolicy = __esm({
  "node_modules/@azure/core-client/dist/esm/deserializationPolicy.js"() {
    init_interfaces();
    init_esm6();
    init_serializer();
    init_operationHelpers();
  }
});

// node_modules/@azure/core-client/dist/esm/interfaceHelpers.js
var init_interfaceHelpers = __esm({
  "node_modules/@azure/core-client/dist/esm/interfaceHelpers.js"() {
    init_serializer();
  }
});

// node_modules/@azure/core-client/dist/esm/serializationPolicy.js
var init_serializationPolicy = __esm({
  "node_modules/@azure/core-client/dist/esm/serializationPolicy.js"() {
    init_interfaces();
    init_operationHelpers();
    init_serializer();
    init_interfaceHelpers();
  }
});

// node_modules/@azure/core-client/dist/esm/pipeline.js
var init_pipeline3 = __esm({
  "node_modules/@azure/core-client/dist/esm/pipeline.js"() {
    init_deserializationPolicy();
    init_esm6();
    init_serializationPolicy();
  }
});

// node_modules/@azure/core-client/dist/esm/httpClientCache.js
var init_httpClientCache = __esm({
  "node_modules/@azure/core-client/dist/esm/httpClientCache.js"() {
    init_esm6();
  }
});

// node_modules/@azure/core-client/dist/esm/urlHelpers.js
var init_urlHelpers2 = __esm({
  "node_modules/@azure/core-client/dist/esm/urlHelpers.js"() {
    init_operationHelpers();
    init_interfaceHelpers();
  }
});

// node_modules/@azure/core-client/dist/esm/log.js
var logger6;
var init_log4 = __esm({
  "node_modules/@azure/core-client/dist/esm/log.js"() {
    init_esm();
    logger6 = createClientLogger2("core-client");
  }
});

// node_modules/@azure/core-client/dist/esm/serviceClient.js
var init_serviceClient = __esm({
  "node_modules/@azure/core-client/dist/esm/serviceClient.js"() {
    init_esm6();
    init_pipeline3();
    init_utils2();
    init_httpClientCache();
    init_operationHelpers();
    init_urlHelpers2();
    init_interfaceHelpers();
    init_log4();
  }
});

// node_modules/@azure/core-client/dist/esm/authorizeRequestOnClaimChallenge.js
var init_authorizeRequestOnClaimChallenge = __esm({
  "node_modules/@azure/core-client/dist/esm/authorizeRequestOnClaimChallenge.js"() {
    init_log4();
    init_base64();
  }
});

// node_modules/@azure/core-client/dist/esm/authorizeRequestOnTenantChallenge.js
var init_authorizeRequestOnTenantChallenge = __esm({
  "node_modules/@azure/core-client/dist/esm/authorizeRequestOnTenantChallenge.js"() {
  }
});

// node_modules/@azure/core-client/dist/esm/index.js
var init_esm7 = __esm({
  "node_modules/@azure/core-client/dist/esm/index.js"() {
    init_serializer();
    init_serviceClient();
    init_pipeline3();
    init_interfaces();
    init_deserializationPolicy();
    init_serializationPolicy();
    init_authorizeRequestOnClaimChallenge();
    init_authorizeRequestOnTenantChallenge();
  }
});

// node_modules/@azure/identity/dist/esm/util/identityTokenEndpoint.js
var init_identityTokenEndpoint = __esm({
  "node_modules/@azure/identity/dist/esm/util/identityTokenEndpoint.js"() {
  }
});

// node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/utils.js
var init_utils3 = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/utils.js"() {
  }
});

// node_modules/@azure/identity/dist/esm/client/identityClient.js
var init_identityClient = __esm({
  "node_modules/@azure/identity/dist/esm/client/identityClient.js"() {
    init_esm7();
    init_esm4();
    init_esm6();
    init_errors();
    init_identityTokenEndpoint();
    init_constants();
    init_tracing();
    init_logging();
    init_utils3();
  }
});

// node_modules/@azure/identity/dist/esm/regionalAuthority.js
var RegionalAuthority;
var init_regionalAuthority = __esm({
  "node_modules/@azure/identity/dist/esm/regionalAuthority.js"() {
    (function(RegionalAuthority2) {
      RegionalAuthority2["AutoDiscoverRegion"] = "AutoDiscoverRegion";
      RegionalAuthority2["USWest"] = "westus";
      RegionalAuthority2["USWest2"] = "westus2";
      RegionalAuthority2["USCentral"] = "centralus";
      RegionalAuthority2["USEast"] = "eastus";
      RegionalAuthority2["USEast2"] = "eastus2";
      RegionalAuthority2["USNorthCentral"] = "northcentralus";
      RegionalAuthority2["USSouthCentral"] = "southcentralus";
      RegionalAuthority2["USWestCentral"] = "westcentralus";
      RegionalAuthority2["CanadaCentral"] = "canadacentral";
      RegionalAuthority2["CanadaEast"] = "canadaeast";
      RegionalAuthority2["BrazilSouth"] = "brazilsouth";
      RegionalAuthority2["EuropeNorth"] = "northeurope";
      RegionalAuthority2["EuropeWest"] = "westeurope";
      RegionalAuthority2["UKSouth"] = "uksouth";
      RegionalAuthority2["UKWest"] = "ukwest";
      RegionalAuthority2["FranceCentral"] = "francecentral";
      RegionalAuthority2["FranceSouth"] = "francesouth";
      RegionalAuthority2["SwitzerlandNorth"] = "switzerlandnorth";
      RegionalAuthority2["SwitzerlandWest"] = "switzerlandwest";
      RegionalAuthority2["GermanyNorth"] = "germanynorth";
      RegionalAuthority2["GermanyWestCentral"] = "germanywestcentral";
      RegionalAuthority2["NorwayWest"] = "norwaywest";
      RegionalAuthority2["NorwayEast"] = "norwayeast";
      RegionalAuthority2["AsiaEast"] = "eastasia";
      RegionalAuthority2["AsiaSouthEast"] = "southeastasia";
      RegionalAuthority2["JapanEast"] = "japaneast";
      RegionalAuthority2["JapanWest"] = "japanwest";
      RegionalAuthority2["AustraliaEast"] = "australiaeast";
      RegionalAuthority2["AustraliaSouthEast"] = "australiasoutheast";
      RegionalAuthority2["AustraliaCentral"] = "australiacentral";
      RegionalAuthority2["AustraliaCentral2"] = "australiacentral2";
      RegionalAuthority2["IndiaCentral"] = "centralindia";
      RegionalAuthority2["IndiaSouth"] = "southindia";
      RegionalAuthority2["IndiaWest"] = "westindia";
      RegionalAuthority2["KoreaSouth"] = "koreasouth";
      RegionalAuthority2["KoreaCentral"] = "koreacentral";
      RegionalAuthority2["UAECentral"] = "uaecentral";
      RegionalAuthority2["UAENorth"] = "uaenorth";
      RegionalAuthority2["SouthAfricaNorth"] = "southafricanorth";
      RegionalAuthority2["SouthAfricaWest"] = "southafricawest";
      RegionalAuthority2["ChinaNorth"] = "chinanorth";
      RegionalAuthority2["ChinaEast"] = "chinaeast";
      RegionalAuthority2["ChinaNorth2"] = "chinanorth2";
      RegionalAuthority2["ChinaEast2"] = "chinaeast2";
      RegionalAuthority2["GermanyCentral"] = "germanycentral";
      RegionalAuthority2["GermanyNorthEast"] = "germanynortheast";
      RegionalAuthority2["GovernmentUSVirginia"] = "usgovvirginia";
      RegionalAuthority2["GovernmentUSIowa"] = "usgoviowa";
      RegionalAuthority2["GovernmentUSArizona"] = "usgovarizona";
      RegionalAuthority2["GovernmentUSTexas"] = "usgovtexas";
      RegionalAuthority2["GovernmentUSDodEast"] = "usdodeast";
      RegionalAuthority2["GovernmentUSDodCentral"] = "usdodcentral";
    })(RegionalAuthority || (RegionalAuthority = {}));
  }
});

// node_modules/@azure/identity/dist/esm/util/processMultiTenantRequest.js
function createConfigurationErrorMessage(tenantId) {
  return `The current credential is not configured to acquire tokens for tenant ${tenantId}. To enable acquiring tokens for this tenant add it to the AdditionallyAllowedTenants on the credential options, or add "*" to AdditionallyAllowedTenants to allow acquiring tokens for any tenant.`;
}
function processMultiTenantRequest(tenantId, getTokenOptions, additionallyAllowedTenantIds = [], logger27) {
  let resolvedTenantId;
  if (process.env.AZURE_IDENTITY_DISABLE_MULTITENANTAUTH) {
    resolvedTenantId = tenantId;
  } else if (tenantId === "adfs") {
    resolvedTenantId = tenantId;
  } else {
    resolvedTenantId = getTokenOptions?.tenantId ?? tenantId;
  }
  if (tenantId && resolvedTenantId !== tenantId && !additionallyAllowedTenantIds.includes("*") && !additionallyAllowedTenantIds.some((t) => t.localeCompare(resolvedTenantId) === 0)) {
    const message = createConfigurationErrorMessage(resolvedTenantId);
    logger27?.info(message);
    throw new CredentialUnavailableError(message);
  }
  return resolvedTenantId;
}
var init_processMultiTenantRequest = __esm({
  "node_modules/@azure/identity/dist/esm/util/processMultiTenantRequest.js"() {
    init_errors();
  }
});

// node_modules/@azure/identity/dist/esm/util/tenantIdUtils.js
function checkTenantId(logger27, tenantId) {
  if (!tenantId.match(/^[0-9a-zA-Z-.]+$/)) {
    const error = new Error("Invalid tenant id provided. You can locate your tenant id by following the instructions listed here: https://learn.microsoft.com/partner-center/find-ids-and-domain-names.");
    logger27.info(formatError("", error));
    throw error;
  }
}
function resolveAdditionallyAllowedTenantIds(additionallyAllowedTenants) {
  if (!additionallyAllowedTenants || additionallyAllowedTenants.length === 0) {
    return [];
  }
  if (additionallyAllowedTenants.includes("*")) {
    return ALL_TENANTS;
  }
  return additionallyAllowedTenants;
}
var init_tenantIdUtils = __esm({
  "node_modules/@azure/identity/dist/esm/util/tenantIdUtils.js"() {
    init_constants();
    init_logging();
    init_processMultiTenantRequest();
  }
});

// node_modules/@azure/identity/dist/esm/msal/nodeFlows/msalClient.js
var msalLogger;
var init_msalClient = __esm({
  "node_modules/@azure/identity/dist/esm/msal/nodeFlows/msalClient.js"() {
    init_dist();
    init_logging();
    init_msalPlugins();
    init_utils();
    init_errors();
    init_identityClient();
    init_regionalAuthority();
    init_esm();
    init_tenantIdUtils();
    msalLogger = credentialLogger("MsalClient");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/clientCertificateCredential.js
import { createHash as createHash3, createPrivateKey } from "node:crypto";
import { readFile } from "node:fs/promises";
var credentialName, logger7;
var init_clientCertificateCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/clientCertificateCredential.js"() {
    init_msalClient();
    init_tenantIdUtils();
    init_logging();
    init_tracing();
    credentialName = "ClientCertificateCredential";
    logger7 = credentialLogger(credentialName);
  }
});

// node_modules/@azure/identity/dist/esm/util/scopeUtils.js
function ensureValidScopeForDevTimeCreds(scope, logger27) {
  if (!scope.match(/^[0-9a-zA-Z-_.:/]+$/)) {
    const error = new Error("Invalid scope was specified by the user or calling client");
    logger27.getToken.info(formatError(scope, error));
    throw error;
  }
}
function getScopeResource(scope) {
  return scope.replace(/\/.default$/, "");
}
var init_scopeUtils = __esm({
  "node_modules/@azure/identity/dist/esm/util/scopeUtils.js"() {
    init_logging();
  }
});

// node_modules/@azure/identity/dist/esm/credentials/clientSecretCredential.js
var logger8;
var init_clientSecretCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/clientSecretCredential.js"() {
    init_msalClient();
    init_tenantIdUtils();
    init_errors();
    init_logging();
    init_scopeUtils();
    init_tracing();
    logger8 = credentialLogger("ClientSecretCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/usernamePasswordCredential.js
var logger9;
var init_usernamePasswordCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/usernamePasswordCredential.js"() {
    init_msalClient();
    init_tenantIdUtils();
    init_errors();
    init_logging();
    init_scopeUtils();
    init_tracing();
    logger9 = credentialLogger("UsernamePasswordCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/environmentCredential.js
var credentialName2, logger10;
var init_environmentCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/environmentCredential.js"() {
    init_errors();
    init_logging();
    init_clientCertificateCredential();
    init_clientSecretCredential();
    init_usernamePasswordCredential();
    init_tenantIdUtils();
    init_tracing();
    credentialName2 = "EnvironmentCredential";
    logger10 = credentialLogger(credentialName2);
  }
});

// node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/imdsRetryPolicy.js
var DEFAULT_CLIENT_MAX_RETRY_INTERVAL2;
var init_imdsRetryPolicy = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/imdsRetryPolicy.js"() {
    init_esm6();
    init_esm4();
    DEFAULT_CLIENT_MAX_RETRY_INTERVAL2 = 1e3 * 64;
  }
});

// node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/imdsMsi.js
var msiName, logger11;
var init_imdsMsi = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/imdsMsi.js"() {
    init_esm6();
    init_esm4();
    init_logging();
    init_utils3();
    init_tracing();
    msiName = "ManagedIdentityCredential - IMDS";
    logger11 = credentialLogger(msiName);
  }
});

// node_modules/@azure/identity/dist/esm/credentials/clientAssertionCredential.js
var logger12;
var init_clientAssertionCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/clientAssertionCredential.js"() {
    init_msalClient();
    init_tenantIdUtils();
    init_errors();
    init_logging();
    init_tracing();
    logger12 = credentialLogger("ClientAssertionCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/workloadIdentityCredential.js
import { readFile as readFile2 } from "node:fs/promises";
var credentialName3, logger13;
var init_workloadIdentityCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/workloadIdentityCredential.js"() {
    init_logging();
    init_clientAssertionCredential();
    init_errors();
    init_tenantIdUtils();
    credentialName3 = "WorkloadIdentityCredential";
    logger13 = credentialLogger(credentialName3);
  }
});

// node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/tokenExchangeMsi.js
var msiName2, logger14;
var init_tokenExchangeMsi = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/tokenExchangeMsi.js"() {
    init_workloadIdentityCredential();
    init_logging();
    msiName2 = "ManagedIdentityCredential - Token Exchange";
    logger14 = credentialLogger(msiName2);
  }
});

// node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/index.js
var logger15;
var init_managedIdentityCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/managedIdentityCredential/index.js"() {
    init_esm();
    init_dist();
    init_identityClient();
    init_errors();
    init_utils();
    init_imdsRetryPolicy();
    init_logging();
    init_tracing();
    init_imdsMsi();
    init_tokenExchangeMsi();
    init_utils3();
    logger15 = credentialLogger("ManagedIdentityCredential");
  }
});

// node_modules/@azure/core-process/dist/esm/errors.js
function isProcessError(error) {
  if (error instanceof ProcessError) {
    return true;
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error;
  return candidate[processErrorBrand] === true && candidate.name === "ProcessError" && (typeof candidate.code === "string" || typeof candidate.code === "number" || candidate.code === null) && typeof candidate.killed === "boolean" && (typeof candidate.signal === "string" || candidate.signal === null);
}
function createExecutionError(error, stdout, stderr) {
  const code = error.code ?? null;
  const message = typeof code === "number" ? `The process exited with code ${code}.` : code ? `The process could not be completed (${code}).` : "The process could not be completed.";
  return new ProcessError(message, {
    code,
    signal: error.signal,
    killed: error.killed,
    stdout,
    stderr
  });
}
var processErrorBrand, ProcessError;
var init_errors2 = __esm({
  "node_modules/@azure/core-process/dist/esm/errors.js"() {
    processErrorBrand = Symbol.for("@azure/core-process.ProcessError");
    ProcessError = class extends Error {
      /**
       * The operating-system error code or process exit code.
       */
      code;
      /**
       * The signal that terminated the process.
       */
      signal;
      /**
       * Whether the process was killed.
       */
      killed;
      /**
       * Captured standard output, when available.
       */
      stdout;
      /**
       * Captured standard error, when available.
       */
      stderr;
      /**
       * Creates a process error.
       *
       * @param message - A message that does not contain command arguments or output.
       * @param options - Structured process failure details.
       */
      constructor(message, options = {}) {
        super(message);
        this.name = "ProcessError";
        this.code = options.code ?? null;
        this.signal = options.signal ?? null;
        this.killed = options.killed ?? false;
        Object.defineProperties(this, {
          [processErrorBrand]: {
            configurable: false,
            enumerable: false,
            value: true,
            writable: false
          },
          stdout: {
            configurable: false,
            enumerable: false,
            value: options.stdout,
            writable: false
          },
          stderr: {
            configurable: false,
            enumerable: false,
            value: options.stderr,
            writable: false
          }
        });
      }
    };
  }
});

// node_modules/@azure/core-process/dist/esm/resolveExecutable.js
import { accessSync as accessSync2, constants as constants2, realpathSync, statSync as statSync2 } from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
function getEnvironmentValue(environment, name2) {
  if (process.platform !== "win32") {
    return environment[name2];
  }
  const normalizedName = name2.toLowerCase();
  for (const [key, value] of Object.entries(environment)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  return void 0;
}
function setEnvironmentValue(environment, name2, value) {
  const normalizedName = name2.toLowerCase();
  const existingKey = Object.keys(environment).find((key) => key.toLowerCase() === normalizedName);
  environment[existingKey ?? name2] = value;
}
function snapshotEnvironment(environment) {
  const snapshot = {};
  const windowsKeys = /* @__PURE__ */ new Set();
  for (const [key, value] of Object.entries(environment)) {
    if (process.platform === "win32") {
      const normalizedKey = key.toLowerCase();
      if (windowsKeys.has(normalizedKey)) {
        throw new ProcessError("The environment contains duplicate case-insensitive variable names.", { code: "ERR_INVALID_ENVIRONMENT" });
      }
      windowsKeys.add(normalizedKey);
    }
    if (value !== void 0 && typeof value !== "string") {
      throw new ProcessError("The environment contains a non-string value.", {
        code: "ERR_INVALID_ENVIRONMENT"
      });
    }
    snapshot[key] = value;
  }
  return snapshot;
}
function normalizeCwd(cwd) {
  const cwdPath = cwd instanceof URL ? fileURLToPath(cwd) : cwd;
  return path2.resolve(cwdPath ?? process.cwd());
}
function createProcessContext(options = {}) {
  if (options.allowWindowsBatchFiles !== void 0 && typeof options.allowWindowsBatchFiles !== "boolean") {
    throw new ProcessError("The Windows batch option must be a boolean.", {
      code: "ERR_INVALID_PROCESS_OPTION"
    });
  }
  return {
    cwd: normalizeCwd(options.cwd),
    env: snapshotEnvironment(options.env ?? process.env),
    allowWindowsBatchFiles: options.allowWindowsBatchFiles === true
  };
}
function isExecutableFile(filePath) {
  try {
    if (!statSync2(filePath).isFile()) {
      return false;
    }
    if (process.platform !== "win32") {
      accessSync2(filePath, constants2.X_OK);
    }
    return true;
  } catch {
    return false;
  }
}
function isNativeExtension(extension) {
  return WINDOWS_NATIVE_EXTENSIONS.some((candidate) => candidate === extension);
}
function isBatchExtension(extension) {
  return WINDOWS_BATCH_EXTENSIONS.some((candidate) => candidate === extension);
}
function resolveWindowsCandidate(candidate, allowWindowsBatchFiles) {
  const extension = path2.extname(candidate).toLowerCase();
  if (extension) {
    if (!isNativeExtension(extension) && !(allowWindowsBatchFiles && isBatchExtension(extension))) {
      return void 0;
    }
    return isExecutableFile(candidate) ? candidate : void 0;
  }
  for (const nativeExtension of WINDOWS_NATIVE_EXTENSIONS) {
    const nativeCandidate = candidate + nativeExtension;
    if (isExecutableFile(nativeCandidate)) {
      return nativeCandidate;
    }
  }
  if (allowWindowsBatchFiles) {
    for (const batchExtension of WINDOWS_BATCH_EXTENSIONS) {
      const batchCandidate = candidate + batchExtension;
      if (isExecutableFile(batchCandidate)) {
        return batchCandidate;
      }
    }
  }
  return void 0;
}
function getSearchPaths(context3) {
  const pathValue = getEnvironmentValue(context3.env, "PATH") ?? "";
  const paths = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of pathValue.split(path2.delimiter)) {
    let candidate = entry;
    if (process.platform === "win32") {
      candidate = candidate.trim();
      if (candidate.startsWith('"') && candidate.endsWith('"')) {
        candidate = candidate.slice(1, -1);
      }
    }
    if (!candidate || !path2.isAbsolute(candidate)) {
      continue;
    }
    const normalized = path2.resolve(candidate);
    const key = process.platform === "win32" ? normalized.toLowerCase() : normalized;
    if (!seen.has(key)) {
      seen.add(key);
      paths.push(normalized);
    }
  }
  return paths;
}
function hasPathSeparator(command) {
  return command.includes("/") || process.platform === "win32" && command.includes("\\");
}
function validateCommand(command) {
  if (!command || command.includes("\0") || /[\r\n]/.test(command)) {
    throw new ProcessError("The executable name is invalid.", {
      code: "ERR_INVALID_EXECUTABLE"
    });
  }
  if (process.platform === "win32" && /^[a-z]:[^\\/]/i.test(command)) {
    throw new ProcessError("Drive-relative executable paths are not supported.", {
      code: "ERR_INVALID_EXECUTABLE"
    });
  }
}
function resolveExecutableWithContext(command, context3) {
  validateCommand(command);
  if (hasPathSeparator(command) || path2.isAbsolute(command)) {
    const candidate = path2.resolve(context3.cwd, command);
    if (process.platform === "win32") {
      return resolveWindowsCandidate(candidate, context3.allowWindowsBatchFiles);
    }
    return isExecutableFile(candidate) ? candidate : void 0;
  }
  const searchPaths = getSearchPaths(context3);
  if (process.platform !== "win32") {
    for (const searchPath of searchPaths) {
      const candidate = path2.join(searchPath, command);
      if (isExecutableFile(candidate)) {
        return candidate;
      }
    }
    return void 0;
  }
  const extension = path2.extname(command).toLowerCase();
  if (extension) {
    if (!isNativeExtension(extension) && !(context3.allowWindowsBatchFiles && isBatchExtension(extension))) {
      return void 0;
    }
    for (const searchPath of searchPaths) {
      const candidate = path2.join(searchPath, command);
      if (isExecutableFile(candidate)) {
        return candidate;
      }
    }
    return void 0;
  }
  for (const searchPath of searchPaths) {
    for (const nativeExtension of WINDOWS_NATIVE_EXTENSIONS) {
      const candidate = path2.join(searchPath, command + nativeExtension);
      if (isExecutableFile(candidate)) {
        return candidate;
      }
    }
  }
  if (context3.allowWindowsBatchFiles) {
    for (const searchPath of searchPaths) {
      for (const batchExtension of WINDOWS_BATCH_EXTENSIONS) {
        const candidate = path2.join(searchPath, command + batchExtension);
        if (isExecutableFile(candidate)) {
          return candidate;
        }
      }
    }
  }
  return void 0;
}
function resolveExecutable(command, options = {}) {
  return resolveExecutableWithContext(command, createProcessContext(options));
}
function canonicalizeWindowsPath(filePath) {
  try {
    return realpathSync.native(filePath).toLowerCase();
  } catch {
    return path2.resolve(filePath).toLowerCase();
  }
}
function isWindowsDriveAbsolutePath(filePath) {
  return WINDOWS_DRIVE_ABSOLUTE_PATH.test(filePath);
}
function resolveWindowsCommandInterpreter(childEnvironment) {
  const hostEnvironment = snapshotEnvironment(process.env);
  const systemRoot = getEnvironmentValue(hostEnvironment, "SystemRoot");
  if (!systemRoot || !isWindowsDriveAbsolutePath(systemRoot)) {
    throw new ProcessError("A trusted Windows system directory could not be established.", {
      code: "ERR_UNTRUSTED_COMMAND_INTERPRETER"
    });
  }
  const executablePath = path2.join(systemRoot, "System32", "cmd.exe");
  if (!isExecutableFile(executablePath)) {
    throw new ProcessError("The Windows command interpreter could not be found.", {
      code: "ERR_UNTRUSTED_COMMAND_INTERPRETER"
    });
  }
  const comSpec = getEnvironmentValue(hostEnvironment, "ComSpec");
  if (comSpec && (!isWindowsDriveAbsolutePath(comSpec) || canonicalizeWindowsPath(comSpec) !== canonicalizeWindowsPath(executablePath))) {
    throw new ProcessError("The Windows command interpreter is not trusted.", {
      code: "ERR_UNTRUSTED_COMMAND_INTERPRETER"
    });
  }
  const childSystemRoot = getEnvironmentValue(childEnvironment, "SystemRoot");
  if (childSystemRoot && (!isWindowsDriveAbsolutePath(childSystemRoot) || canonicalizeWindowsPath(childSystemRoot) !== canonicalizeWindowsPath(systemRoot))) {
    throw new ProcessError("The child environment contains an untrusted system directory.", {
      code: "ERR_UNTRUSTED_COMMAND_INTERPRETER"
    });
  }
  const childComSpec = getEnvironmentValue(childEnvironment, "ComSpec");
  if (childComSpec && (!isWindowsDriveAbsolutePath(childComSpec) || canonicalizeWindowsPath(childComSpec) !== canonicalizeWindowsPath(executablePath))) {
    throw new ProcessError("The child environment contains an untrusted command interpreter.", {
      code: "ERR_UNTRUSTED_COMMAND_INTERPRETER"
    });
  }
  setEnvironmentValue(childEnvironment, "SystemRoot", systemRoot);
  setEnvironmentValue(childEnvironment, "ComSpec", executablePath);
  return { executablePath, systemRoot };
}
var WINDOWS_NATIVE_EXTENSIONS, WINDOWS_BATCH_EXTENSIONS, WINDOWS_DRIVE_ABSOLUTE_PATH;
var init_resolveExecutable = __esm({
  "node_modules/@azure/core-process/dist/esm/resolveExecutable.js"() {
    init_errors2();
    WINDOWS_NATIVE_EXTENSIONS = [".exe", ".com"];
    WINDOWS_BATCH_EXTENSIONS = [".cmd", ".bat"];
    WINDOWS_DRIVE_ABSOLUTE_PATH = /^[a-z]:[\\/]/i;
  }
});

// node_modules/@azure/core-process/dist/esm/normalizeCommand.js
import path3 from "node:path";
function containsControlCharacter(value) {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint === 127) {
      return true;
    }
  }
  return false;
}
function snapshotArguments(args) {
  return args.map((arg, index) => {
    if (typeof arg !== "string" || arg.includes("\0")) {
      throw new ProcessError(`Process argument ${index} is invalid.`, {
        code: "ERR_INVALID_PROCESS_ARGUMENT"
      });
    }
    return arg;
  });
}
function validateBatchArguments(args) {
  for (const [index, arg] of args.entries()) {
    if (containsControlCharacter(arg) || UNSAFE_BATCH_ARGUMENT.test(arg) || /\\"/.test(arg) || /\\{2,}$/.test(arg)) {
      throw new ProcessError(`Windows batch argument ${index} is unsafe.`, {
        code: "ERR_UNSAFE_WINDOWS_BATCH_ARGUMENT"
      });
    }
  }
}
function escapeBatchCommand(filePath) {
  if (containsControlCharacter(filePath) || UNSAFE_BATCH_PATH.test(filePath)) {
    throw new ProcessError("The Windows batch path cannot be represented safely.", {
      code: "ERR_UNSAFE_WINDOWS_BATCH_PATH"
    });
  }
  return filePath.replace(BATCH_META_CHARACTER, "^$1");
}
function escapeBatchArgument(argument) {
  let escaped = argument;
  escaped = escaped.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
  escaped = escaped.replace(/(?=(\\+?)?)\1$/g, "$1$1");
  escaped = `"${escaped}"`;
  return escaped.replace(BATCH_META_CHARACTER, "^$1");
}
function normalizeCommand(command, args, context3) {
  const copiedArgs = snapshotArguments(args);
  const resolvedPath = resolveExecutableWithContext(command, context3);
  if (!resolvedPath) {
    throw new ProcessError("The executable could not be found.", { code: "ENOENT" });
  }
  if (process.platform !== "win32") {
    return {
      executable: resolvedPath,
      args: copiedArgs,
      cwd: context3.cwd,
      env: context3.env,
      windowsVerbatimArguments: false
    };
  }
  const extension = path3.extname(resolvedPath).toLowerCase();
  if (extension === ".exe" || extension === ".com") {
    return {
      executable: resolvedPath,
      args: copiedArgs,
      cwd: context3.cwd,
      env: context3.env,
      windowsVerbatimArguments: false
    };
  }
  if (extension !== ".cmd" && extension !== ".bat") {
    throw new ProcessError("The executable type is not supported on Windows.", {
      code: "ERR_UNSUPPORTED_WINDOWS_EXECUTABLE"
    });
  }
  if (!context3.allowWindowsBatchFiles) {
    throw new ProcessError("Windows batch execution was not enabled.", {
      code: "ERR_WINDOWS_BATCH_DISABLED"
    });
  }
  if (context3.cwd.startsWith("\\\\")) {
    throw new ProcessError("Windows batch execution does not support a UNC working directory.", {
      code: "ERR_UNSUPPORTED_WINDOWS_CWD"
    });
  }
  validateBatchArguments(copiedArgs);
  const commandInterpreter = resolveWindowsCommandInterpreter(context3.env);
  const commandLine = [
    escapeBatchCommand(resolvedPath),
    ...copiedArgs.map(escapeBatchArgument)
  ].join(" ");
  return {
    executable: commandInterpreter.executablePath,
    args: ["/d", "/s", "/v:off", "/c", `"${commandLine}"`],
    cwd: context3.cwd,
    env: context3.env,
    windowsVerbatimArguments: true
  };
}
var UNSAFE_BATCH_ARGUMENT, UNSAFE_BATCH_PATH, BATCH_META_CHARACTER;
var init_normalizeCommand = __esm({
  "node_modules/@azure/core-process/dist/esm/normalizeCommand.js"() {
    init_errors2();
    init_resolveExecutable();
    UNSAFE_BATCH_ARGUMENT = /[%!^&|<>()]/;
    UNSAFE_BATCH_PATH = /[%!]/;
    BATCH_META_CHARACTER = /([()\][%!^"`<>&|;, *?])/g;
  }
});

// node_modules/@azure/core-process/dist/esm/process.js
import * as childProcess from "node:child_process";
function sanitizeChildProcessError(error) {
  return error instanceof Error && !isProcessError(error) ? createExecutionError(error) : error;
}
function callWithSanitizedChildProcessErrors(callback) {
  try {
    return callback();
  } catch (error) {
    throw sanitizeChildProcessError(error);
  }
}
function sanitizeChildProcessErrors(child) {
  const originalEmit = child.emit;
  child.emit = ((eventName, ...args) => {
    if (eventName === "error") {
      args[0] = sanitizeChildProcessError(args[0]);
    }
    return Reflect.apply(originalEmit, child, [eventName, ...args]);
  });
  return child;
}
function prepareProcess(executable, args, options, allowedOptionNames) {
  if (options.shell !== void 0 || options.windowsVerbatimArguments !== void 0) {
    throw new ProcessError("Shell-related process options are not supported.", {
      code: "ERR_UNSAFE_PROCESS_OPTION"
    });
  }
  const copiedOptions = { ...options };
  const { cwd, env, allowWindowsBatchFiles } = copiedOptions;
  const resolutionOptionNames = /* @__PURE__ */ new Set(["cwd", "env", "allowWindowsBatchFiles"]);
  const allowedOptions = new Set(allowedOptionNames);
  const nodeOptions = {};
  for (const [name2, value] of Object.entries(copiedOptions)) {
    if ((name2 === "shell" || name2 === "windowsVerbatimArguments") && value === void 0) {
      continue;
    }
    if (resolutionOptionNames.has(name2)) {
      continue;
    }
    if (!allowedOptions.has(name2)) {
      throw new ProcessError("The process options contain an unsupported property.", {
        code: "ERR_UNSUPPORTED_PROCESS_OPTION"
      });
    }
    nodeOptions[name2] = value;
  }
  const context3 = createProcessContext({
    cwd,
    env,
    allowWindowsBatchFiles
  });
  const command = normalizeCommand(executable, args, context3);
  if (command.windowsVerbatimArguments && nodeOptions.argv0 !== void 0) {
    throw new ProcessError("The argv0 option is not supported for Windows batch files.", {
      code: "ERR_UNSAFE_PROCESS_OPTION"
    });
  }
  return { command, nodeOptions };
}
function spawn2(command, args = [], options = {}) {
  const prepared = prepareProcess(command, args, options, spawnOptionNames);
  const child = callWithSanitizedChildProcessErrors(() => childProcess.spawn(prepared.command.executable, prepared.command.args, {
    ...prepared.nodeOptions,
    cwd: prepared.command.cwd,
    env: prepared.command.env,
    shell: false,
    windowsVerbatimArguments: prepared.command.windowsVerbatimArguments
  }));
  return sanitizeChildProcessErrors(child);
}
async function execFile2(command, args = [], options = {}) {
  const prepared = prepareProcess(command, args, options, execFileOptionNames);
  return new Promise((resolve, reject) => {
    callWithSanitizedChildProcessErrors(() => childProcess.execFile(prepared.command.executable, prepared.command.args, {
      ...prepared.nodeOptions,
      cwd: prepared.command.cwd,
      env: prepared.command.env,
      shell: false,
      windowsVerbatimArguments: prepared.command.windowsVerbatimArguments,
      windowsHide: options.windowsHide
    }, (error, stdout, stderr) => {
      if (error) {
        reject(createExecutionError(error, stdout, stderr));
        return;
      }
      resolve({ stdout, stderr });
    }));
  });
}
var commonOptionNames, spawnOptionNames, spawnSyncOptionNames, execFileOptionNames;
var init_process = __esm({
  "node_modules/@azure/core-process/dist/esm/process.js"() {
    init_errors2();
    init_normalizeCommand();
    init_resolveExecutable();
    commonOptionNames = ["gid", "killSignal", "timeout", "uid", "windowsHide"];
    spawnOptionNames = [
      ...commonOptionNames,
      "argv0",
      "detached",
      "serialization",
      "signal",
      "stdio"
    ];
    spawnSyncOptionNames = [
      ...commonOptionNames,
      "argv0",
      "encoding",
      "input",
      "maxBuffer",
      "stdio"
    ];
    execFileOptionNames = [...commonOptionNames, "encoding", "maxBuffer", "signal"];
  }
});

// node_modules/@azure/core-process/dist/esm/index.js
var init_esm8 = __esm({
  "node_modules/@azure/core-process/dist/esm/index.js"() {
    init_errors2();
    init_process();
    init_resolveExecutable();
  }
});

// node_modules/@azure/identity/dist/esm/util/processUtils.js
function outputToString(output) {
  if (output === void 0) {
    return "";
  }
  return Buffer.isBuffer(output) ? output.toString("utf8") : output;
}
var processUtils;
var init_processUtils = __esm({
  "node_modules/@azure/identity/dist/esm/util/processUtils.js"() {
    init_esm8();
    processUtils = {
      /**
       * Executes a file and preserves output when the process exits nonzero.
       *
       * @internal
       */
      async execFileWithResult(file, params, options) {
        try {
          const result = await execFile2(file, params, options);
          return { ...result, error: null };
        } catch (error) {
          if (isProcessError(error)) {
            return {
              stdout: outputToString(error.stdout),
              stderr: outputToString(error.stderr),
              error
            };
          }
          throw error;
        }
      },
      /**
       * Executes a file and rejects when it writes to stderr or exits nonzero.
       *
       * @internal
       */
      async execFile(file, params, options) {
        const { stdout, stderr, error } = await processUtils.execFileWithResult(file, params, options);
        if (stderr || error) {
          throw stderr ? new Error(stderr) : error;
        }
        return stdout;
      }
    };
  }
});

// node_modules/@azure/identity/dist/esm/credentials/azureDeveloperCliCredential.js
var logger16;
var init_azureDeveloperCliCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/azureDeveloperCliCredential.js"() {
    init_logging();
    init_errors();
    init_tenantIdUtils();
    init_tracing();
    init_scopeUtils();
    init_processUtils();
    logger16 = credentialLogger("AzureDeveloperCliCredential");
  }
});

// node_modules/@azure/identity/dist/esm/util/subscriptionUtils.js
function checkSubscription(logger27, subscription) {
  if (!subscription.match(/^[0-9a-zA-Z-._ ]+$/)) {
    const error = new Error(`Subscription '${subscription}' contains invalid characters. If this is the name of a subscription, use its ID instead. You can locate your subscription by following the instructions listed here: https://learn.microsoft.com/azure/azure-portal/get-subscription-tenant-id`);
    logger27.info(formatError("", error));
    throw error;
  }
}
var init_subscriptionUtils = __esm({
  "node_modules/@azure/identity/dist/esm/util/subscriptionUtils.js"() {
    init_logging();
  }
});

// node_modules/@azure/identity/dist/esm/credentials/azureCliCredential.js
var logger17, azureCliPublicErrorMessages, cliCredentialInternals, AzureCliCredential;
var init_azureCliCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/azureCliCredential.js"() {
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_errors();
    init_tracing();
    init_subscriptionUtils();
    init_processUtils();
    init_esm8();
    logger17 = credentialLogger("AzureCliCredential");
    azureCliPublicErrorMessages = {
      claim: "This credential doesn't support claims challenges. To authenticate with the required claims, please run the following command:",
      notInstalled: "Azure CLI could not be found. Please visit https://aka.ms/azure-cli for installation instructions and then, once installed, authenticate to your Azure account using 'az login'.",
      login: "Please run 'az login' from a command prompt to authenticate before using this credential.",
      unknown: "Unknown error while trying to retrieve the access token",
      unexpectedResponse: 'Unexpected response from Azure CLI when getting token. Expected "expiresOn" to be a RFC3339 date string. Got:'
    };
    cliCredentialInternals = {
      /**
       * @internal
       */
      getSafeWorkingDir() {
        if (process.platform === "win32") {
          let systemRoot = process.env.SystemRoot || process.env["SYSTEMROOT"];
          if (!systemRoot) {
            logger17.getToken.warning("The SystemRoot environment variable is not set. This may cause issues when using the Azure CLI credential.");
            systemRoot = "C:\\Windows";
          }
          return systemRoot;
        } else {
          return "/bin";
        }
      },
      /**
       * Gets the access token from Azure CLI
       * @param resource - The resource to use when getting the token
       * @internal
       */
      async getAzureCliAccessToken(resource, tenantId, subscription, timeout) {
        let tenantSection = [];
        let subscriptionSection = [];
        if (tenantId) {
          tenantSection = ["--tenant", tenantId];
        }
        if (subscription) {
          subscriptionSection = ["--subscription", subscription];
        }
        const args = [
          "account",
          "get-access-token",
          "--output",
          "json",
          "--resource",
          resource,
          ...tenantSection,
          ...subscriptionSection
        ];
        return processUtils.execFileWithResult("az", args, {
          allowWindowsBatchFiles: true,
          cwd: cliCredentialInternals.getSafeWorkingDir(),
          encoding: "utf8",
          timeout
        });
      }
    };
    AzureCliCredential = class {
      tenantId;
      additionallyAllowedTenantIds;
      timeout;
      subscription;
      /**
       * Creates an instance of the {@link AzureCliCredential}.
       *
       * To use this credential, ensure that you have already logged
       * in via the 'az' tool using the command "az login" from the commandline.
       *
       * @param options - Options, to optionally allow multi-tenant requests.
       */
      constructor(options) {
        if (options?.tenantId) {
          checkTenantId(logger17, options?.tenantId);
          this.tenantId = options?.tenantId;
        }
        if (options?.subscription) {
          checkSubscription(logger17, options?.subscription);
          this.subscription = options?.subscription;
        }
        this.additionallyAllowedTenantIds = resolveAdditionallyAllowedTenantIds(options?.additionallyAllowedTenants);
        this.timeout = options?.processTimeoutInMs;
      }
      /**
       * Authenticates with Microsoft Entra ID and returns an access token if successful.
       * If authentication fails, a {@link CredentialUnavailableError} will be thrown with the details of the failure.
       *
       * @param scopes - The list of scopes for which the token will have access.
       * @param options - The options used to configure any requests this
       *                TokenCredential implementation might make.
       */
      async getToken(scopes, options = {}) {
        const scope = typeof scopes === "string" ? scopes : scopes[0];
        const claimsValue = options.claims;
        if (claimsValue && claimsValue.trim()) {
          const encodedClaims = btoa(claimsValue);
          let loginCmd = `az login --claims-challenge ${encodedClaims} --scope ${scope}`;
          const tenantIdFromOptions = options.tenantId;
          if (tenantIdFromOptions) {
            loginCmd += ` --tenant ${tenantIdFromOptions}`;
          }
          const error = new CredentialUnavailableError(`${azureCliPublicErrorMessages.claim} ${loginCmd}`);
          logger17.getToken.info(formatError(scope, error));
          throw error;
        }
        const tenantId = processMultiTenantRequest(this.tenantId, options, this.additionallyAllowedTenantIds);
        if (tenantId) {
          checkTenantId(logger17, tenantId);
        }
        if (this.subscription) {
          checkSubscription(logger17, this.subscription);
        }
        logger17.getToken.info(`Using the scope ${scope}`);
        return tracingClient.withSpan(`${this.constructor.name}.getToken`, options, async () => {
          try {
            ensureValidScopeForDevTimeCreds(scope, logger17);
            const resource = getScopeResource(scope);
            const obj = await cliCredentialInternals.getAzureCliAccessToken(resource, tenantId, this.subscription, this.timeout);
            const specificScope = obj.stderr?.match("(.*)az login --scope(.*)");
            const isLoginError = obj.stderr?.match("(.*)az login(.*)") && !specificScope;
            const isNotInstallError = obj.stderr?.match("az:(.*)not found") || obj.stderr?.startsWith("'az' is not recognized") || obj.error && isProcessError(obj.error) && obj.error.code === "ENOENT";
            if (isNotInstallError) {
              const error = new CredentialUnavailableError(azureCliPublicErrorMessages.notInstalled);
              logger17.getToken.info(formatError(scopes, error));
              throw error;
            }
            if (isLoginError) {
              const error = new CredentialUnavailableError(azureCliPublicErrorMessages.login);
              logger17.getToken.info(formatError(scopes, error));
              throw error;
            }
            try {
              const responseData = obj.stdout;
              const response = this.parseRawResponse(responseData);
              logger17.getToken.info(formatSuccess(scopes));
              return response;
            } catch (e) {
              if (obj.stderr) {
                throw new CredentialUnavailableError(obj.stderr);
              }
              throw e;
            }
          } catch (err) {
            const error = err.name === "CredentialUnavailableError" ? err : new CredentialUnavailableError(err.message || azureCliPublicErrorMessages.unknown);
            logger17.getToken.info(formatError(scopes, error));
            throw error;
          }
        });
      }
      /**
       * Parses the raw JSON response from the Azure CLI into a usable AccessToken object
       *
       * @param rawResponse - The raw JSON response from the Azure CLI
       * @returns An access token with the expiry time parsed from the raw response
       *
       * The expiryTime of the credential's access token, in milliseconds, is calculated as follows:
       *
       * When available, expires_on (introduced in Azure CLI v2.54.0) will be preferred. Otherwise falls back to expiresOn.
       */
      parseRawResponse(rawResponse) {
        const response = JSON.parse(rawResponse);
        const token = response.accessToken;
        let expiresOnTimestamp = Number.parseInt(response.expires_on, 10) * 1e3;
        if (!isNaN(expiresOnTimestamp)) {
          logger17.getToken.info("expires_on is available and is valid, using it");
          return {
            token,
            expiresOnTimestamp,
            tokenType: "Bearer"
          };
        }
        expiresOnTimestamp = new Date(response.expiresOn).getTime();
        if (isNaN(expiresOnTimestamp)) {
          throw new CredentialUnavailableError(`${azureCliPublicErrorMessages.unexpectedResponse} "${response.expiresOn}"`);
        }
        return {
          token,
          expiresOnTimestamp,
          tokenType: "Bearer"
        };
      }
    };
  }
});

// node_modules/@azure/identity/dist/esm/credentials/azurePowerShellCredential.js
function formatCommand(commandName) {
  if (isWindows) {
    return `${commandName}.exe`;
  } else {
    return commandName;
  }
}
var logger18, isWindows, powerShellResourceEnvironmentVariable, powerShellTenantEnvironmentVariable, powerShellPrivateEnvironmentVariables, commandStack;
var init_azurePowerShellCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/azurePowerShellCredential.js"() {
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_errors();
    init_processUtils();
    init_tracing();
    logger18 = credentialLogger("AzurePowerShellCredential");
    isWindows = process.platform === "win32";
    powerShellResourceEnvironmentVariable = "AZURE_IDENTITY_POWERSHELL_RESOURCE";
    powerShellTenantEnvironmentVariable = "AZURE_IDENTITY_POWERSHELL_TENANT_ID";
    powerShellPrivateEnvironmentVariables = new Set([powerShellResourceEnvironmentVariable, powerShellTenantEnvironmentVariable].map((name2) => name2.toLowerCase()));
    commandStack = [formatCommand("pwsh")];
    if (isWindows) {
      commandStack.push(formatCommand("powershell"));
    }
  }
});

// node_modules/@azure/identity/dist/esm/credentials/visualStudioCodeCredential.js
import { readFile as readFile3 } from "node:fs/promises";
var logger19;
var init_visualStudioCodeCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/visualStudioCodeCredential.js"() {
    init_logging();
    init_tenantIdUtils();
    init_errors();
    init_tenantIdUtils();
    init_msalClient();
    init_scopeUtils();
    init_msalPlugins();
    init_utils();
    logger19 = credentialLogger("VisualStudioCodeCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/brokerCredential.js
var logger20;
var init_brokerCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/brokerCredential.js"() {
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_tracing();
    init_msalClient();
    init_constants();
    init_errors();
    logger20 = credentialLogger("BrokerCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/defaultAzureCredentialFunctions.js
var init_defaultAzureCredentialFunctions = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/defaultAzureCredentialFunctions.js"() {
    init_environmentCredential();
    init_managedIdentityCredential();
    init_workloadIdentityCredential();
    init_azureDeveloperCliCredential();
    init_azureCliCredential();
    init_azurePowerShellCredential();
    init_visualStudioCodeCredential();
    init_brokerCredential();
  }
});

// node_modules/@azure/identity/dist/esm/credentials/defaultAzureCredential.js
var logger21;
var init_defaultAzureCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/defaultAzureCredential.js"() {
    init_chainedTokenCredential();
    init_logging();
    init_defaultAzureCredentialFunctions();
    logger21 = credentialLogger("DefaultAzureCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/interactiveBrowserCredential.js
var logger22;
var init_interactiveBrowserCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/interactiveBrowserCredential.js"() {
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_tracing();
    init_msalClient();
    init_constants();
    logger22 = credentialLogger("InteractiveBrowserCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/deviceCodeCredential.js
var logger23;
var init_deviceCodeCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/deviceCodeCredential.js"() {
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_tracing();
    init_msalClient();
    init_constants();
    logger23 = credentialLogger("DeviceCodeCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/azurePipelinesCredential.js
var credentialName4, logger24;
var init_azurePipelinesCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/azurePipelinesCredential.js"() {
    init_errors();
    init_esm6();
    init_clientAssertionCredential();
    init_identityClient();
    init_tenantIdUtils();
    init_logging();
    credentialName4 = "AzurePipelinesCredential";
    logger24 = credentialLogger(credentialName4);
  }
});

// node_modules/@azure/identity/dist/esm/credentials/authorizationCodeCredential.js
var logger25;
var init_authorizationCodeCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/authorizationCodeCredential.js"() {
    init_tenantIdUtils();
    init_tenantIdUtils();
    init_logging();
    init_scopeUtils();
    init_tracing();
    init_msalClient();
    logger25 = credentialLogger("AuthorizationCodeCredential");
  }
});

// node_modules/@azure/identity/dist/esm/credentials/onBehalfOfCredential.js
import { createHash as createHash4 } from "node:crypto";
import { readFile as readFile4 } from "node:fs/promises";
var credentialName5, logger26;
var init_onBehalfOfCredential = __esm({
  "node_modules/@azure/identity/dist/esm/credentials/onBehalfOfCredential.js"() {
    init_msalClient();
    init_logging();
    init_tenantIdUtils();
    init_errors();
    init_scopeUtils();
    init_tracing();
    credentialName5 = "OnBehalfOfCredential";
    logger26 = credentialLogger(credentialName5);
  }
});

// node_modules/@azure/identity/dist/esm/tokenProvider.js
function getBearerTokenProvider(credential, scopes, options) {
  const { abortSignal, tracingOptions } = options || {};
  const pipeline = createEmptyPipeline2();
  pipeline.addPolicy(bearerTokenAuthenticationPolicy({ credential, scopes }));
  async function getRefreshedToken() {
    const res = await pipeline.sendRequest({
      sendRequest: (request) => Promise.resolve({
        request,
        status: 200,
        headers: request.headers
      })
    }, createPipelineRequest2({
      url: "https://example.com",
      abortSignal,
      tracingOptions
    }));
    const accessToken = res.headers.get("authorization")?.split(" ")[1];
    if (!accessToken) {
      throw new Error("Failed to get access token");
    }
    return accessToken;
  }
  return getRefreshedToken;
}
var init_tokenProvider = __esm({
  "node_modules/@azure/identity/dist/esm/tokenProvider.js"() {
    init_esm6();
  }
});

// node_modules/@azure/identity/dist/esm/index.js
var init_esm9 = __esm({
  "node_modules/@azure/identity/dist/esm/index.js"() {
    init_consumer();
    init_defaultAzureCredential();
    init_errors();
    init_utils();
    init_chainedTokenCredential();
    init_clientSecretCredential();
    init_defaultAzureCredential();
    init_environmentCredential();
    init_clientCertificateCredential();
    init_clientAssertionCredential();
    init_azureCliCredential();
    init_azureDeveloperCliCredential();
    init_interactiveBrowserCredential();
    init_managedIdentityCredential();
    init_deviceCodeCredential();
    init_azurePipelinesCredential();
    init_authorizationCodeCredential();
    init_azurePowerShellCredential();
    init_usernamePasswordCredential();
    init_visualStudioCodeCredential();
    init_onBehalfOfCredential();
    init_workloadIdentityCredential();
    init_logging();
    init_constants();
    init_tokenProvider();
  }
});

// packages/canvas-toolkit/src/internal/auth-cli.mjs
var auth_cli_exports = {};
__export(auth_cli_exports, {
  createCliAuthSource: () => createCliAuthSource
});
import path4 from "node:path";
import { StringDecoder } from "node:string_decoder";
import { stripVTControlCharacters } from "node:util";
function failure(code) {
  const messages = {
    cancelled: ["The authentication operation was cancelled."],
    disposed: ["This Azure CLI authentication source has been disposed."],
    "cli-not-found": ["Azure CLI could not be found.", "Install Azure CLI 2.61 or later and make az available on the provider process PATH."],
    "cli-version-unsupported": ["Azure CLI 2.61 or later is required.", "Update Azure CLI explicitly, then reload the profile."],
    "cli-invalid-output": ["Azure CLI returned invalid profile metadata.", "Check Azure CLI outside the canvas, then reload the profile."],
    "cli-output-limit": ["Azure CLI exceeded the allowed output size.", "Check Azure CLI outside the canvas, then try again."],
    "cli-timeout": ["The Azure CLI operation timed out.", "Check Azure CLI outside the canvas, then try again."],
    "cli-failed": ["Azure CLI could not read the account profile.", "Check Azure CLI outside the canvas, then sign in or reload the profile."],
    "login-failed": ["Azure CLI sign-in did not complete.", "Try signing in again, or use device-code sign-in."],
    "invalid-options": ["The Azure CLI authentication options are invalid."]
  };
  return new AuthError(code, ...messages[code]);
}
function workingDirectory(platform) {
  return platform === "win32" ? process.env.SystemRoot || process.env.SYSTEMROOT || "C:\\Windows" : "/bin";
}
function loginEnvironment(source = process.env) {
  const env = { ...source };
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === "azure_core_login_experience_v2") delete env[key];
  }
  env.AZURE_CORE_LOGIN_EXPERIENCE_V2 = "off";
  return env;
}
function parseJson(text2) {
  try {
    return JSON.parse(text2);
  } catch {
    throw failure("cli-invalid-output");
  }
}
function progressText(text2) {
  return stripVTControlCharacters(text2).replace(
    /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}
function createCliAuthSource({
  spawnProcess = spawn2,
  resolveCommand = resolveExecutable,
  execProcess = execFile2,
  killProcess = process.kill.bind(process),
  emitWarning = process.emitWarning.bind(process),
  platform = process.platform,
  credentialFactory = (options) => new AzureCliCredential(options),
  executable: configuredExecutable,
  environment: configuredEnvironment,
  limits = DEFAULT_LIMITS,
  timeouts = DEFAULT_TIMEOUTS
} = {}) {
  if (configuredExecutable !== void 0 && (typeof configuredExecutable !== "string" || !path4.isAbsolute(configuredExecutable))) {
    throw failure("invalid-options");
  }
  if (configuredEnvironment !== void 0 && (!configuredEnvironment || typeof configuredEnvironment !== "object" || Array.isArray(configuredEnvironment) || Object.values(configuredEnvironment).some((value) => typeof value !== "string"))) throw failure("invalid-options");
  const childEnvironment = configuredEnvironment ? { ...configuredEnvironment } : void 0;
  const caps = { ...DEFAULT_LIMITS, ...limits };
  const deadlines = { ...DEFAULT_TIMEOUTS, ...timeouts };
  for (const value of [...Object.values(caps), ...Object.values(deadlines)]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw failure("invalid-options");
  }
  const shared = /* @__PURE__ */ new Map();
  const children = /* @__PURE__ */ new Set();
  let disposed = false;
  let verifiedExecutable;
  function assertActive(signal) {
    if (disposed) throw failure("disposed");
    if (signal?.aborted) throw failure("cancelled");
  }
  function sharedOperation(key, signal, work) {
    try {
      assertActive(signal);
    } catch (error) {
      return Promise.reject(error);
    }
    let operation = shared.get(key);
    if (!operation) {
      operation = { controller: new AbortController(), waiters: /* @__PURE__ */ new Set() };
      shared.set(key, operation);
      operation.promise = Promise.resolve().then(() => {
        assertActive(operation.controller.signal);
        return work(operation.controller.signal);
      }).catch((error) => {
        operation.controller.abort();
        throw error;
      }).finally(() => {
        if (shared.get(key) === operation) shared.delete(key);
      });
    }
    return new Promise((resolve, reject) => {
      const waiter = {};
      operation.waiters.add(waiter);
      const cleanup = () => {
        signal?.removeEventListener("abort", abort);
        operation.waiters.delete(waiter);
      };
      const abort = () => {
        cleanup();
        reject(failure("cancelled"));
        if (!operation.waiters.size) {
          if (shared.get(key) === operation) shared.delete(key);
          operation.controller.abort();
        }
      };
      signal?.addEventListener("abort", abort, { once: true });
      operation.promise.then((value) => {
        if (!operation.waiters.has(waiter)) return;
        cleanup();
        try {
          assertActive(signal);
          resolve(structuredClone(value));
        } catch (error) {
          reject(error);
        }
      }, (error) => {
        if (!operation.waiters.has(waiter)) return;
        cleanup();
        reject(disposed ? failure("disposed") : error);
      });
    });
  }
  function run(executable, args, { signal, kind = "read", onProgress } = {}) {
    assertActive(signal);
    return new Promise((resolve, reject) => {
      let child;
      let settled = false;
      let terminating = false;
      let stdoutSize = 0;
      let stderrSize = 0;
      let hasWarning = false;
      let output = [];
      let pendingProgress = "";
      const decoder = new StringDecoder("utf8");
      let timer;
      let escalation;
      let closed = false;
      let progressWarningReported = false;
      let terminationWarningReported = false;
      function reportProgressFailure() {
        if (progressWarningReported) return;
        progressWarningReported = true;
        emitWarning("An Azure CLI sign-in progress listener failed.", { code: "AZURE_CANVAS_AUTH_PROGRESS_LISTENER_FAILED" });
      }
      function reportTerminationFailure() {
        if (terminationWarningReported) return;
        terminationWarningReported = true;
        emitWarning(
          "Azure CLI process cleanup encountered an unexpected failure; an owned process may still be running.",
          { code: "AZURE_CANVAS_AUTH_PROCESS_CLEANUP_FAILED" }
        );
      }
      function emitProgress(text2) {
        if (settled || disposed || signal?.aborted || typeof onProgress !== "function") return;
        const safeText = progressText(text2);
        if (!safeText.trim()) return;
        try {
          Promise.resolve(onProgress(safeText)).catch(reportProgressFailure);
        } catch {
          reportProgressFailure();
        }
      }
      function forget() {
        children.delete(owned);
        clearTimeout(escalation);
      }
      function signalGroup(signal2) {
        try {
          killProcess(-child.pid, signal2);
        } catch (error) {
          if (error?.code === "ESRCH") {
            forget();
            return false;
          }
          if (error?.code !== "EPERM") reportTerminationFailure();
        }
        return true;
      }
      function terminate() {
        if (terminating || !child?.pid || !children.has(owned)) return;
        if (closed && platform === "win32") {
          forget();
          return;
        }
        terminating = true;
        if (platform === "win32") {
          const taskkill = path4.win32.join(workingDirectory(platform), "System32", "taskkill.exe");
          Promise.resolve().then(() => execProcess(taskkill, ["/pid", String(child.pid), "/t", "/f"], {
            windowsHide: true,
            timeout: 5e3,
            maxBuffer: 32 * 1024
          })).then(forget, () => {
            if (closed) return forget();
            try {
              if (child.kill("SIGKILL")) {
                terminating = false;
                reportTerminationFailure();
                return;
              }
            } catch (error) {
              if (error?.code !== "ESRCH") {
                terminating = false;
                reportTerminationFailure();
                return;
              }
            }
            escalation = setTimeout(() => {
              if (closed) return forget();
              terminating = false;
              reportTerminationFailure();
            }, deadlines.kill);
          });
        } else {
          if (closed && !signalGroup(0)) return;
          if (!signalGroup("SIGTERM")) return;
          escalation = setTimeout(() => {
            if (!signalGroup(0) || !signalGroup("SIGKILL")) return;
            escalation = setTimeout(() => {
              if (!signalGroup(0)) return;
              terminating = false;
              reportTerminationFailure();
            }, deadlines.kill);
          }, deadlines.kill);
        }
      }
      function finish(error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        pendingProgress = "";
        if (error) {
          output = [];
          terminate();
          if (!child?.pid) forget();
          reject(error);
        } else {
          const stdout = kind === "login" ? "" : Buffer.concat(output).toString("utf8");
          output = [];
          forget();
          resolve({ stdout, hasWarning });
        }
      }
      const abort = () => finish(failure(disposed ? "disposed" : "cancelled"));
      const owned = { cancel: () => settled ? terminate() : abort() };
      try {
        child = spawnProcess(executable, args, {
          allowWindowsBatchFiles: true,
          cwd: workingDirectory(platform),
          ...childEnvironment || kind === "login" ? { env: kind === "login" ? loginEnvironment(childEnvironment) : childEnvironment } : {},
          detached: platform !== "win32",
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"]
        });
        children.add(owned);
      } catch (error) {
        finish(failure(error?.code === "ENOENT" ? "cli-not-found" : kind === "login" ? "login-failed" : "cli-failed"));
        return;
      }
      signal?.addEventListener("abort", abort, { once: true });
      child.stdout.on("data", (chunk) => {
        if (settled) return;
        stdoutSize += Buffer.byteLength(chunk);
        if (stdoutSize > caps.stdout) return finish(failure("cli-output-limit"));
        if (kind !== "login") output.push(Buffer.from(chunk));
      });
      child.stderr.on("data", (chunk) => {
        if (settled) return;
        stderrSize += Buffer.byteLength(chunk);
        if (stderrSize > caps.stderr) return finish(failure("cli-output-limit"));
        hasWarning ||= Boolean(String(chunk).trim());
        if (kind === "login" && typeof onProgress === "function") {
          pendingProgress += decoder.write(Buffer.from(chunk));
          const lines = pendingProgress.split(/\r?\n/);
          pendingProgress = lines.pop();
          for (const line of lines) emitProgress(line);
        }
      });
      child.on("error", (error) => {
        if (settled) {
          if (platform !== "win32") {
            if (children.has(owned) && signalGroup(0)) {
              if (!["EPERM", "ESRCH"].includes(error?.code)) reportTerminationFailure();
              terminate();
            }
          } else if (error?.code === "ESRCH") forget();
          else {
            terminating = false;
            reportTerminationFailure();
          }
          return;
        }
        finish(failure(error?.code === "ENOENT" ? "cli-not-found" : kind === "login" ? "login-failed" : "cli-failed"));
      });
      child.on("close", (code) => {
        closed = true;
        if (settled) {
          if (platform === "win32") forget();
          else if (children.has(owned)) signalGroup(0);
          return;
        }
        if (kind === "login") emitProgress(pendingProgress + decoder.end());
        finish(code === 0 ? void 0 : failure(kind === "login" ? "login-failed" : "cli-failed"));
      });
      timer = setTimeout(() => finish(failure("cli-timeout")), deadlines[kind]);
      if (signal?.aborted) abort();
    });
  }
  async function ready(signal) {
    assertActive(signal);
    let executable;
    try {
      executable = configuredExecutable || resolveCommand("az", {
        cwd: workingDirectory(platform),
        allowWindowsBatchFiles: true,
        ...childEnvironment ? { env: childEnvironment } : {}
      });
    } catch {
      throw failure("cli-not-found");
    }
    if (!executable) throw failure("cli-not-found");
    if (verifiedExecutable?.executable === executable) return verifiedExecutable;
    return sharedOperation(`version:${executable}`, signal, async (innerSignal) => {
      const result = await run(executable, ["version", "--output", "json"], { signal: innerSignal });
      const version2 = parseJson(result.stdout)?.["azure-cli"];
      const match = typeof version2 === "string" && /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version2);
      if (!match) throw failure("cli-invalid-output");
      const major = Number(match[1]);
      const minor = Number(match[2]);
      if (major < 2 || major === 2 && minor < 61) throw failure("cli-version-unsupported");
      verifiedExecutable = { executable, hasWarning: result.hasWarning };
      return verifiedExecutable;
    });
  }
  function profile(refresh, signal) {
    return sharedOperation(refresh ? "refresh" : "read", signal, async (innerSignal) => {
      const cli = await ready(innerSignal);
      const [accountResult, cloudResult] = await Promise.all([
        run(
          cli.executable,
          ["account", "list", "--all", ...refresh ? ["--refresh"] : [], "--output", "json"],
          { signal: innerSignal, kind: refresh ? "refresh" : "read" }
        ),
        run(cli.executable, ["cloud", "show", "--output", "json"], { signal: innerSignal })
      ]);
      const accounts = parseJson(accountResult.stdout);
      const cloud = parseJson(cloudResult.stdout);
      if (!Array.isArray(accounts) || accounts.some((row) => !row || typeof row !== "object" || Array.isArray(row)) || !cloud || typeof cloud !== "object" || Array.isArray(cloud)) {
        throw failure("cli-invalid-output");
      }
      const warnings = [];
      if (cli.hasWarning || accountResult.hasWarning || cloudResult.hasWarning) {
        warnings.push(refresh ? REFRESH_WARNING : PROFILE_WARNING);
      }
      return { accounts, cloud, warnings };
    });
  }
  return Object.freeze({
    readProfile({ signal } = {}) {
      return profile(false, signal);
    },
    refreshProfile({ signal } = {}) {
      return profile(true, signal);
    },
    async login({ tenantId, flow = "default", allowNoSubscriptions = false, signal, onProgress } = {}) {
      assertActive(signal);
      if (!["default", "device-code"].includes(flow) || tenantId !== void 0 && (typeof tenantId !== "string" || !TENANT.test(tenantId)) || typeof allowNoSubscriptions !== "boolean" || onProgress !== void 0 && typeof onProgress !== "function") throw failure("invalid-options");
      const cli = await ready(signal);
      await run(cli.executable, [
        "login",
        "--output",
        "json",
        ...tenantId ? ["--tenant", tenantId] : [],
        ...flow === "device-code" ? ["--use-device-code"] : [],
        ...allowNoSubscriptions ? ["--allow-no-subscriptions"] : []
      ], { signal, kind: "login", onProgress });
    },
    credential({ subscriptionId, tenantId } = {}) {
      assertActive();
      if (subscriptionId !== void 0 && (typeof subscriptionId !== "string" || !GUID2.test(subscriptionId)) || tenantId !== void 0 && (typeof tenantId !== "string" || !TENANT.test(tenantId)) || subscriptionId !== void 0 && tenantId !== void 0) throw failure("invalid-options");
      if (configuredExecutable || childEnvironment) {
        return {
          async getToken(scopes, options = {}) {
            const values = typeof scopes === "string" ? [scopes] : scopes;
            if (!Array.isArray(values) || values.length !== 1 || typeof values[0] !== "string") {
              throw failure("invalid-options");
            }
            const scope = values[0];
            const resource = scope.endsWith("/.default") ? scope.slice(0, -"/.default".length) : scope;
            const cli = await ready(options.abortSignal);
            const result = await run(cli.executable, [
              "account",
              "get-access-token",
              "--output",
              "json",
              "--resource",
              resource,
              ...subscriptionId ? ["--subscription", subscriptionId] : [],
              ...tenantId ? ["--tenant", tenantId] : []
            ], { signal: options.abortSignal });
            const value = parseJson(result.stdout);
            const expiresOnTimestamp = Number(value.expires_on) * 1e3 || Date.parse(value.expiresOn || value.expires_on);
            if (typeof value.accessToken !== "string" || !value.accessToken || !Number.isFinite(expiresOnTimestamp)) {
              throw failure("cli-invalid-output");
            }
            return { token: value.accessToken, expiresOnTimestamp };
          }
        };
      }
      return credentialFactory({
        processTimeoutInMs: deadlines.read,
        ...subscriptionId ? { subscription: subscriptionId } : {},
        ...tenantId ? { tenantId } : {}
      });
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        for (const operation of shared.values()) operation.controller.abort();
        shared.clear();
      }
      for (const child of children) child.cancel();
      verifiedExecutable = void 0;
    }
  });
}
var DEFAULT_LIMITS, DEFAULT_TIMEOUTS, PROFILE_WARNING, REFRESH_WARNING, GUID2, TENANT;
var init_auth_cli = __esm({
  "packages/canvas-toolkit/src/internal/auth-cli.mjs"() {
    init_esm8();
    init_esm9();
    init_auth_errors();
    DEFAULT_LIMITS = Object.freeze({ stdout: 8 * 1024 * 1024, stderr: 256 * 1024 });
    DEFAULT_TIMEOUTS = Object.freeze({ read: 3e4, refresh: 12e4, login: 3e5, kill: 500 });
    PROFILE_WARNING = "Azure CLI reported a warning; the profile may be incomplete.";
    REFRESH_WARNING = "Azure CLI reported a warning during refresh; some accounts may still contain previously cached data.";
    GUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    TENANT = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?)$/i;
  }
});

// packages/canvas-toolkit/src/auth.mjs
init_auth_errors();

// packages/canvas-toolkit/src/internal/auth-session.mjs
init_esm9();
init_auth_errors();
import { setMaxListeners } from "node:events";

// packages/canvas-toolkit/src/internal/auth-model.mjs
init_auth_errors();
import { createHash as createHash5 } from "node:crypto";
var GUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
var CLOUDS = Object.freeze({
  AzureCloud: Object.freeze({
    name: "AzureCloud",
    resourceManager: "https://management.azure.com",
    armResource: "https://management.core.windows.net/",
    authority: "https://login.microsoftonline.com"
  }),
  AzureUSGovernment: Object.freeze({
    name: "AzureUSGovernment",
    resourceManager: "https://management.usgovcloudapi.net",
    armResource: "https://management.core.usgovcloudapi.net/",
    authority: "https://login.microsoftonline.us"
  }),
  AzureChinaCloud: Object.freeze({
    name: "AzureChinaCloud",
    resourceManager: "https://management.chinacloudapi.cn",
    armResource: "https://management.core.chinacloudapi.cn/",
    authority: "https://login.chinacloudapi.cn"
  })
});
function fail(code, message) {
  throw new AuthError(code, message);
}
function record(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}
function text(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 4096;
}
function principal(value) {
  return text(value) && value.trim().length > 0;
}
function lower(value) {
  return value.toLowerCase();
}
var endpoint = (value) => typeof value === "string" ? value.replace(/\/$/, "") : null;
function normalizeId(value, code = "invalid-scope") {
  if (typeof value !== "string" || !GUID.test(value)) fail(code, "Specify a valid Azure GUID identifier.");
  return lower(value);
}
function knownCloud(name2) {
  if (typeof name2 !== "string" || !Object.hasOwn(CLOUDS, name2)) {
    fail("cloud-unsupported", "Only AzureCloud, AzureUSGovernment, and AzureChinaCloud are supported.");
  }
  return { ...CLOUDS[name2] };
}
function normalizeCliCloud(raw) {
  if (!record(raw)) fail("invalid-profile", "Azure CLI returned invalid cloud metadata.");
  const expected = knownCloud(raw.name);
  if (!record(raw.endpoints) || endpoint(raw.endpoints.resourceManager) !== expected.resourceManager || endpoint(raw.endpoints.activeDirectoryResourceId) !== endpoint(expected.armResource) || endpoint(raw.endpoints.activeDirectory) !== expected.authority) {
    fail("cloud-unsupported", "Azure CLI cloud endpoints do not match a supported Azure cloud.");
  }
  return { ...expected, armResource: raw.endpoints.activeDirectoryResourceId };
}
function normalizeScope(scope) {
  if (!record(scope) || !Array.isArray(scope.subscriptionIds) || scope.subscriptionIds.length < 1 || scope.subscriptionIds.length > 1e3) {
    fail("invalid-scope", "Choose an explicit tenant, cloud, and one to 1000 subscriptions.");
  }
  const tenantId = normalizeId(scope.tenantId);
  knownCloud(scope.cloud);
  const subscriptionIds = scope.subscriptionIds.map((id) => normalizeId(id));
  if (new Set(subscriptionIds).size !== subscriptionIds.length) fail("invalid-scope", "Choose unique subscription IDs.");
  return { tenantId, cloud: scope.cloud, subscriptionIds };
}
function uniqueTenants(records) {
  return [...new Map(records.map(({ tenantId, cloud, accountName }) => [
    JSON.stringify([tenantId, cloud, lower(accountName)]),
    { tenantId, cloud, accountName }
  ])).values()];
}
function fingerprint(data) {
  return createHash5("sha256").update(JSON.stringify(data)).digest("hex");
}
function normalizeCliProfile(profile) {
  if (!record(profile) || !Array.isArray(profile.accounts)) fail("invalid-profile", "Azure CLI returned an invalid account list.");
  if (profile.warnings !== void 0 && (!Array.isArray(profile.warnings) || profile.warnings.some((warning) => !text(warning)))) {
    fail("invalid-profile", "Azure CLI returned invalid profile freshness warnings.");
  }
  const cloud = normalizeCliCloud(profile.cloud);
  const normalized = profile.accounts.map((raw) => {
    if (!record(raw)) fail("invalid-profile", "Azure CLI returned invalid account metadata.");
    const id = normalizeId(raw.id, "invalid-profile");
    const tenantId = normalizeId(raw.tenantId, "invalid-profile");
    const cloudName = raw.cloudName || raw.environmentName || cloud.name;
    knownCloud(cloudName);
    const accountName = raw.user?.name;
    if (!principal(accountName) || !text(raw.state)) fail("invalid-profile", "Azure CLI returned incomplete account metadata.");
    const tenantOnly = raw.name === "N/A(tenant level account)";
    if (tenantOnly && id !== tenantId) fail("invalid-profile", "Azure CLI returned an invalid tenant-only account.");
    return {
      id,
      tenantId,
      cloud: cloudName,
      name: text(raw.name) ? raw.name : id,
      tenantName: text(raw.tenantDisplayName) ? raw.tenantDisplayName : tenantId,
      state: raw.state,
      accountName,
      isDefault: raw.isDefault === true,
      tenantOnly,
      principalType: text(raw.user?.type) ? raw.user.type : "",
      homeTenantId: raw.homeTenantId == null ? null : normalizeId(raw.homeTenantId, "invalid-profile")
    };
  });
  const unique = /* @__PURE__ */ new Map();
  for (const row of normalized) {
    const key = JSON.stringify([
      row.id,
      row.tenantId,
      row.homeTenantId,
      row.cloud,
      lower(row.accountName),
      lower(row.principalType),
      lower(row.state),
      row.tenantOnly
    ]);
    const previous = unique.get(key);
    if (previous) {
      previous.isDefault ||= row.isDefault;
      if (previous.name === previous.id) previous.name = row.name;
      if (previous.tenantName === previous.tenantId) previous.tenantName = row.tenantName;
    } else unique.set(key, { ...row });
  }
  const records = [...unique.values()];
  const accounts = records.filter((row) => !row.tenantOnly).map(({ tenantOnly, principalType, homeTenantId, ...account }) => account);
  const tenants = uniqueTenants(records);
  const defaults = records.filter((row) => row.isDefault && row.cloud === cloud.name);
  const activePrincipals = [...new Set(defaults.map((row) => lower(row.accountName)))];
  const activePrincipal = activePrincipals.length === 1 ? activePrincipals[0] : null;
  return {
    cloud,
    accounts,
    tenants,
    activePrincipal,
    identity: records.length ? fingerprint({
      cloud: cloud.name,
      // Retain the identity shape used by existing persisted Resource Query views.
      entries: [...new Set(records.map((row) => JSON.stringify({
        id: row.id,
        tenantId: row.tenantId,
        homeTenantId: row.homeTenantId,
        cloud: row.cloud,
        user: { name: lower(row.accountName), ...row.principalType ? { type: lower(row.principalType) } : {} }
      })))].sort()
    }) : null
  };
}
function normalizeCredentialSource(source) {
  const context3 = source.context;
  if (!source.credential || typeof source.credential.getToken !== "function" || !record(context3) || !principal(context3.accountName) || !principal(context3.identityKey)) {
    fail("invalid-source", "An injected credential requires explicit tenant, cloud, identityKey, and accountName metadata.");
  }
  const tenantId = normalizeId(context3.tenantId, "invalid-source");
  const cloud = knownCloud(context3.cloud);
  const subscriptions = source.subscriptions ?? [];
  if (!Array.isArray(subscriptions)) fail("invalid-source", "Injected subscriptions must be an array.");
  const accounts = subscriptions.map((raw) => {
    if (!record(raw)) fail("invalid-source", "Injected subscription metadata is invalid.");
    const id = normalizeId(raw.id, "invalid-source");
    if (normalizeId(raw.tenantId, "invalid-source") !== tenantId || raw.cloud !== cloud.name || !principal(raw.accountName) || lower(raw.accountName) !== lower(context3.accountName) || !text(raw.state) || !text(raw.name) || !text(raw.tenantName) || typeof raw.isDefault !== "boolean") {
      fail("invalid-source", "Injected subscriptions must match the explicit credential tenant, cloud, and principal.");
    }
    return {
      id,
      tenantId,
      cloud: cloud.name,
      name: raw.name,
      tenantName: raw.tenantName,
      accountName: context3.accountName,
      isDefault: raw.isDefault,
      state: raw.state
    };
  });
  return {
    cloud,
    accounts,
    tenants: [{ tenantId, cloud: cloud.name, accountName: context3.accountName }],
    activePrincipal: lower(context3.accountName),
    identity: fingerprint([context3.identityKey, tenantId, cloud.name, lower(context3.accountName)])
  };
}
function selectSubscriptions(model, requested) {
  const scope = normalizeScope(requested);
  if (scope.cloud !== model.cloud.name) fail("invalid-scope", "Choose the loaded credential's active Azure cloud.");
  const subscriptions = scope.subscriptionIds.map((id) => {
    const matches = model.accounts.filter((account) => account.id === id);
    if (!matches.length) fail("invalid-scope", "A selected subscription is not present in the loaded account metadata.");
    const identities = new Set(matches.map((account) => JSON.stringify([account.tenantId, account.cloud, lower(account.accountName)])));
    if (identities.size !== 1) fail("ambiguous-identity", "The selected subscription is cached under multiple identities.");
    if (matches.some((account) => account.tenantId !== scope.tenantId || account.cloud !== scope.cloud)) {
      fail("invalid-scope", "Selected subscriptions must match the explicit tenant and cloud.");
    }
    if (matches.some((account) => lower(account.state) !== "enabled")) fail("access-denied", "A selected subscription is not enabled.");
    return matches[0];
  });
  if (new Set(subscriptions.map((account) => lower(account.accountName))).size !== 1) {
    fail("ambiguous-identity", "Choose subscriptions belonging to one Azure principal.");
  }
  return { scope, subscriptions };
}
function selectTenant(model, requested, isCli) {
  if (!record(requested)) fail("invalid-scope", "Specify an explicit tenant and cloud.");
  const tenantId = normalizeId(requested.tenantId);
  knownCloud(requested.cloud);
  if (requested.cloud !== model.cloud.name) fail("invalid-scope", "Choose the loaded credential's active Azure cloud.");
  if (requested.accountName !== void 0 && !principal(requested.accountName)) fail("invalid-scope", "Specify a valid account name.");
  const matches = model.tenants.filter((tenant) => tenant.tenantId === tenantId && tenant.cloud === requested.cloud);
  if (!matches.length) fail("invalid-scope", "This tenant is not present in the loaded account metadata.");
  const names = new Set(matches.map((tenant) => lower(tenant.accountName)));
  const accountName = requested.accountName === void 0 ? names.size === 1 ? [...names][0] : null : lower(requested.accountName);
  if (!accountName || !names.has(accountName) || isCli && accountName !== model.activePrincipal) {
    fail("ambiguous-identity", "Azure CLI cannot unambiguously address that tenant principal. Select its account in Azure CLI and reload the profile.");
  }
  return matches.find((tenant) => lower(tenant.accountName) === accountName);
}

// packages/canvas-toolkit/src/internal/auth-session.mjs
var clone = (value) => JSON.parse(JSON.stringify(value));
function controller() {
  const result = new AbortController();
  setMaxListeners(0, result.signal);
  return result;
}
function invalidatedError() {
  return new AuthError("auth-invalidated", "This authentication context has been replaced.", "Bind a new context from the current session.");
}
function tokenInvalidatedError() {
  return new AuthError("tokens-invalidated", "This token acquisition was invalidated.", "Request a token again.");
}
function waitFor(promise, signal, assertCurrent = () => {
}, invalidationSignals = []) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      for (const invalidation of invalidationSignals) invalidation.removeEventListener("abort", invalidated);
      if (error) reject(error);
      else resolve(result);
    };
    const abort = () => finish(cancelledError());
    const invalidated = () => {
      try {
        assertCurrent();
        finish(invalidatedError());
      } catch (error) {
        finish(error);
      }
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
    for (const invalidation of invalidationSignals) {
      if (invalidation.aborted) invalidated();
      else if (!settled) invalidation.addEventListener("abort", invalidated, { once: true });
    }
    Promise.resolve(promise).then((result) => {
      try {
        throwIfAborted(signal);
        assertCurrent();
        finish(null, result);
      } catch (error) {
        finish(error);
      }
    }, (error) => {
      try {
        throwIfAborted(signal);
        assertCurrent();
        finish(safeAuthError(error));
      } catch (currentError) {
        finish(currentError);
      }
    });
  });
}
function createAuthSession(options = {}, deps = {}) {
  const sourceOptions = options?.source ?? { kind: "cli" };
  if (!sourceOptions || !["cli", "credential"].includes(sourceOptions.kind)) {
    throw new AuthError("invalid-source", "Choose a CLI source or an explicitly supplied TokenCredential.");
  }
  const isCli = sourceOptions.kind === "cli";
  let disposed = false;
  let generation = 0;
  let invalidation = controller();
  let operation = null;
  let cliSource;
  let cliSourcePromise;
  let model = null;
  let loadedCredential;
  const handles = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let state3 = {
    status: "uninitialized",
    revision: 0,
    source: sourceOptions.kind,
    identity: null,
    cloud: null,
    accounts: [],
    tenants: [],
    error: null,
    warnings: [],
    freshness: { source: null, refreshedAt: null, complete: false }
  };
  function assertOpen() {
    if (disposed) throw new AuthError("disposed", "This authentication session has been disposed.");
  }
  function assertGeneration(mine) {
    assertOpen();
    if (state3.status === "disconnected") {
      throw new AuthError("disconnected", "This authentication session is disconnected.", "Reconnect before requesting credentials.");
    }
    if (mine !== generation) throw invalidatedError();
  }
  function getState() {
    return clone(state3);
  }
  function emit(type) {
    const revision = state3.revision;
    for (const listener of [...listeners]) {
      if (!listeners.has(listener) || state3.revision !== revision) continue;
      try {
        Promise.resolve(listener({ type, revision, state: getState() })).catch(() => reportAuthDiagnostic("listener"));
      } catch {
        reportAuthDiagnostic("listener");
      }
    }
  }
  function update(patch, type) {
    state3 = { ...state3, ...patch, revision: state3.revision + 1 };
    emit(type);
  }
  function retire() {
    generation += 1;
    const previousInvalidation = invalidation;
    invalidation = controller();
    handles.clear();
    const previous = operation;
    operation = null;
    previousInvalidation.abort();
    previous?.controller.abort();
  }
  async function source() {
    if (!cliSourcePromise) {
      cliSourcePromise = Promise.resolve().then(async () => {
        const factory = deps.createCliAuthSource ?? (await Promise.resolve().then(() => (init_auth_cli(), auth_cli_exports))).createCliAuthSource;
        const instance = factory(sourceOptions);
        if (disposed) {
          instance.dispose();
          assertOpen();
        }
        cliSource = instance;
        return instance;
      }).catch((error) => {
        cliSourcePromise = null;
        throw error;
      });
    }
    return cliSourcePromise;
  }
  function commitProfile(normalized, warnings, freshness, type) {
    model = normalized;
    loadedCredential = isCli ? void 0 : sourceOptions.credential;
    update({
      status: normalized.tenants.length ? "connected" : "signed-out",
      identity: normalized.identity,
      cloud: normalized.cloud,
      accounts: normalized.accounts,
      tenants: normalized.tenants,
      error: null,
      warnings,
      freshness: { source: freshness, refreshedAt: (/* @__PURE__ */ new Date()).toISOString(), complete: false }
    }, type);
  }
  function join(op, { signal, onProgress } = {}) {
    op.waiters += 1;
    const waiter = { signal, onProgress };
    op.progress.add(waiter);
    return waitFor(op.promise, signal, () => assertGeneration(op.generation), [op.controller.signal]).then(clone).finally(() => {
      op.waiters -= 1;
      op.progress.delete(waiter);
      if (signal?.aborted && !op.waiters && operation === op) {
        retire();
        update({ status: "error", error: cancelledError().toJSON() }, "error");
      }
    });
  }
  function run(kind, args = {}) {
    assertOpen();
    throwIfAborted(args.signal);
    const key = JSON.stringify([kind, args.tenantId, args.flow ?? "default", args.allowNoSubscriptions ?? false]);
    if (operation?.key === key) return join(operation, args);
    retire();
    const op = { key, generation, controller: controller(), waiters: 0, progress: /* @__PURE__ */ new Set() };
    operation = op;
    const check = () => assertGeneration(op.generation);
    state3 = { ...state3, status: kind === "connect" ? "signing-in" : "uninitialized", error: null };
    op.promise = Promise.resolve().then(async () => {
      check();
      if (!isCli) {
        if (kind === "refresh-from-azure") {
          throw new AuthError("unsupported-operation", "Azure refresh is unavailable for an injected credential.", "Reload caller-provided metadata instead.");
        }
        const normalized = normalizeCredentialSource(sourceOptions);
        check();
        if (args.tenantId && normalizeId(args.tenantId) !== normalized.tenants[0].tenantId) {
          throw new AuthError("invalid-scope", "The requested tenant does not match the injected credential context.");
        }
        commitProfile(normalized, [], "caller-provided", kind === "connect" ? "connected" : kind);
      } else {
        const cli = await source();
        check();
        const signal = op.controller.signal;
        if (kind === "connect") {
          await cli.login({
            tenantId: args.tenantId,
            flow: args.flow ?? "default",
            allowNoSubscriptions: args.allowNoSubscriptions ?? false,
            signal,
            onProgress: (text2) => {
              if (operation !== op || disposed || signal.aborted || typeof text2 !== "string") return;
              for (const waiter of [...op.progress]) {
                if (operation !== op || disposed || signal.aborted) break;
                if (waiter.signal?.aborted) continue;
                try {
                  Promise.resolve(waiter.onProgress?.(text2)).catch(() => reportAuthDiagnostic("progress"));
                } catch {
                  reportAuthDiagnostic("progress");
                }
              }
            }
          });
          check();
        }
        const profile = await (kind === "refresh-from-azure" ? cli.refreshProfile({ signal }) : cli.readProfile({ signal }));
        check();
        const normalized = normalizeCliProfile(profile);
        const warnings = Array.isArray(profile.warnings) ? profile.warnings.filter((item) => typeof item === "string") : [];
        commitProfile(normalized, warnings, kind === "refresh-from-azure" ? "azure-refresh" : "cli-profile", kind === "connect" ? "connected" : kind);
      }
      check();
      return getState();
    }).catch((error) => {
      check();
      const safe = safeAuthError(error);
      model = null;
      update({
        status: safe.code === "signed-out" ? "signed-out" : "error",
        identity: null,
        accounts: [],
        tenants: [],
        error: safe.toJSON()
      }, "error");
      throw safe;
    }).finally(() => {
      if (operation === op) operation = null;
    });
    update({}, kind === "connect" ? "signing-in" : kind);
    return join(op, args);
  }
  function assertReady() {
    assertOpen();
    if (state3.status !== "connected" || !model) {
      throw new AuthError(
        state3.status === "disconnected" ? "disconnected" : "not-connected",
        "Load a connected authentication profile before binding a context.",
        "Reload the profile or connect first."
      );
    }
  }
  function bind(tenant, subscriptionId) {
    const key = JSON.stringify([tenant.tenantId, tenant.cloud, tenant.accountName.toLowerCase(), subscriptionId]);
    if (handles.has(key)) return handles.get(key);
    const mine = generation;
    const authInvalidation = invalidation.signal;
    let tokenGeneration = 0;
    let tokenInvalidation = controller();
    const providers = /* @__PURE__ */ new Map();
    const assertActive = () => assertGeneration(mine);
    let baseCredential;
    try {
      baseCredential = isCli ? cliSource.credential(subscriptionId ? { subscriptionId } : { tenantId: tenant.tenantId }) : loadedCredential;
    } catch (error) {
      throw safeAuthError(error);
    }
    if (!baseCredential || typeof baseCredential.getToken !== "function") {
      throw new AuthError("invalid-source", "The authentication source did not supply a TokenCredential.");
    }
    const credential = Object.freeze({
      async getToken(scopes, options2 = {}) {
        assertActive();
        throwIfAborted(options2.abortSignal);
        if (options2.tenantId !== void 0 && normalizeId(options2.tenantId) !== tenant.tenantId) {
          throw new AuthError("invalid-scope", "The token request tenant does not match the bound context.");
        }
        const tokenMine = tokenGeneration;
        const tokenSignal = tokenInvalidation.signal;
        const check = () => {
          assertActive();
          if (tokenMine !== tokenGeneration) throw tokenInvalidatedError();
        };
        const { abortSignal, tenantId, ...sharedOptions } = options2;
        const acquisition = Promise.resolve().then(() => {
          check();
          return baseCredential.getToken(scopes, sharedOptions);
        }).then((token) => {
          check();
          if (!token || typeof token.token !== "string" || !token.token || !Number.isFinite(token.expiresOnTimestamp)) {
            throw new AuthError("authentication-failed", "The credential did not return a valid access token.");
          }
          return token;
        });
        return waitFor(acquisition, void 0, check, [authInvalidation, tokenSignal]);
      }
    });
    const context3 = Object.freeze({
      tenantId: tenant.tenantId,
      cloud: tenant.cloud,
      environment: Object.freeze({ ...model.cloud }),
      ...subscriptionId ? { subscriptionId } : {},
      accountName: tenant.accountName,
      credential,
      assertActive,
      getBearerTokenProvider(scopes) {
        assertActive();
        const requested = typeof scopes === "string" ? [scopes] : Array.isArray(scopes) ? [...scopes] : [];
        if (!requested.length || requested.some((scope) => typeof scope !== "string" || !scope.trim())) {
          throw new AuthError("invalid-scope", "Specify one or more nonempty token audience scopes.");
        }
        const key2 = JSON.stringify(requested);
        if (!providers.has(key2)) {
          const entry = { provider: null, callback: null };
          entry.callback = async ({ signal } = {}) => {
            assertActive();
            throwIfAborted(signal);
            const tokenMine = tokenGeneration;
            const tokenSignal = tokenInvalidation.signal;
            const check = () => {
              assertActive();
              if (tokenMine !== tokenGeneration) throw tokenInvalidatedError();
            };
            entry.provider ??= getBearerTokenProvider(credential, requested);
            return waitFor(entry.provider(), signal, check, [authInvalidation, tokenSignal]);
          };
          providers.set(key2, entry);
        }
        return providers.get(key2).callback;
      },
      invalidateTokens() {
        assertActive();
        tokenGeneration += 1;
        const previous = tokenInvalidation;
        tokenInvalidation = controller();
        for (const entry of providers.values()) entry.provider = null;
        previous.abort();
        update({}, "tokens-invalidated");
      }
    });
    handles.set(key, context3);
    return context3;
  }
  return Object.freeze({
    getState,
    reloadProfile: async (args = {}) => run("reload-profile", args),
    refreshFromAzure: async (args = {}) => run("refresh-from-azure", args),
    async connect(args = {}) {
      if (args.flow !== void 0 && !["default", "device-code"].includes(args.flow)) {
        return Promise.reject(new AuthError("invalid-flow", "Choose the default or device-code sign-in flow."));
      }
      if (args.tenantId !== void 0) {
        try {
          args = { ...args, tenantId: normalizeId(args.tenantId) };
        } catch (error) {
          return Promise.reject(error);
        }
      }
      return run("connect", args);
    },
    disconnect() {
      assertOpen();
      retire();
      model = null;
      update({
        status: "disconnected",
        identity: null,
        cloud: null,
        accounts: [],
        tenants: [],
        error: null,
        warnings: [],
        freshness: { source: null, refreshedAt: null, complete: false }
      }, "disconnect");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      retire();
      model = null;
      update({
        status: "disconnected",
        identity: null,
        cloud: null,
        accounts: [],
        tenants: [],
        error: null,
        warnings: [],
        freshness: { source: null, refreshedAt: null, complete: false }
      }, "dispose");
      listeners.clear();
      try {
        cliSource?.dispose();
      } catch {
        reportAuthDiagnostic("cleanup");
      }
    },
    subscribe(listener) {
      assertOpen();
      if (typeof listener !== "function") throw new TypeError("An authentication listener must be a function.");
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    resolveScope(requested) {
      assertReady();
      const { scope, subscriptions } = selectSubscriptions(model, requested);
      return {
        ...scope,
        tenantName: subscriptions[0].tenantName,
        subscriptions: subscriptions.map(({ id, name: name2 }) => ({ id, name: name2 }))
      };
    },
    bindSubscription(requested) {
      assertReady();
      const { subscriptions } = selectSubscriptions(model, {
        tenantId: requested?.tenantId,
        cloud: requested?.cloud,
        subscriptionIds: [requested?.subscriptionId]
      });
      return bind(subscriptions[0], subscriptions[0].id);
    },
    bindTenant(requested) {
      assertReady();
      return bind(selectTenant(model, requested, isCli));
    }
  });
}

// packages/canvas-toolkit/src/auth.mjs
function createAzureAuthSession(options) {
  return createAuthSession(options);
}

// packages/canvas-toolkit/src/subscriptions.mjs
var GUID3 = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
var clouds = {
  AzureCloud: "https://management.azure.com",
  AzureUSGovernment: "https://management.usgovcloudapi.net",
  AzureChinaCloud: "https://management.chinacloudapi.cn"
};
var SubscriptionError = class extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
  }
};
function fail2(code, message) {
  throw new SubscriptionError(code, message);
}
function normalizeSubscriptionScope(scope) {
  if (!scope || typeof scope !== "object" || Array.isArray(scope) || typeof scope.tenantId !== "string" || !GUID3.test(scope.tenantId) || !Array.isArray(scope.subscriptionIds) || !scope.subscriptionIds.length || scope.subscriptionIds.length > 1e3 || scope.subscriptionIds.some((id) => typeof id !== "string" || !GUID3.test(id)) || new Set(scope.subscriptionIds.map((id) => id.toLowerCase())).size !== scope.subscriptionIds.length || typeof scope.cloud !== "string" || !Object.hasOwn(clouds, scope.cloud)) {
    fail2("invalid-scope", "Choose an explicit tenant, one or more unique subscription IDs, and a supported Azure cloud.");
  }
  return { tenantId: scope.tenantId.toLowerCase(), subscriptionIds: scope.subscriptionIds.map((id) => id.toLowerCase()), cloud: scope.cloud };
}

// packages/studio-runtime/src/arm-rest.mjs
var ARM_RESOURCE = "https://management.azure.com/";
var ARM_ORIGIN = new URL(ARM_RESOURCE).origin.toLowerCase();
var REDACTED = "[redacted]";
var SENSITIVE_KEY_RE = /(?:authorization|access.?token|refresh.?token|^(?:id|session|auth)?token$|api.?key|^(?:primary|secondary|subscription|runtime)?key$|secret|password|sig(?:nature)?|connection.?string|client.?secret|sharedaccesssignature)/i;
var SENSITIVE_QUERY_RE = /^(?:access_token|assertion|client_assertion|client_secret|code|password|refresh_token|sig|signature|token)$/i;
function readHeader(headersLike, name2) {
  const headers = headersLike?.headers || headersLike;
  if (!headers) return null;
  if (typeof headers.get === "function") return headers.get(name2) ?? null;
  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === String(name2).toLowerCase()) return value == null ? null : String(value);
  }
  return null;
}
function headersObject(headersLike) {
  const headers = headersLike?.headers || headersLike;
  const out = {};
  if (!headers) return out;
  if (typeof headers.forEach === "function") {
    headers.forEach((value, key) => {
      out[String(key).toLowerCase()] = String(value);
    });
    return out;
  }
  for (const [key, value] of Object.entries(headers)) out[String(key).toLowerCase()] = String(value);
  return out;
}
function extractSubscription(pathname, fallback = "") {
  const match = /^\/subscriptions\/([^/]+)/i.exec(String(pathname || ""));
  return match ? decodeURIComponent(match[1]) : fallback;
}
function normalizeAccessToken(tokenResult) {
  if (typeof tokenResult === "string" && tokenResult) return tokenResult;
  if (tokenResult && typeof tokenResult.accessToken === "string" && tokenResult.accessToken) return tokenResult.accessToken;
  throw new TypeError("Azure CLI session returned no ARM access token.");
}
function sanitizeString(value) {
  let text2 = String(value || "");
  try {
    const url = new URL(text2);
    for (const [key] of url.searchParams) {
      if (SENSITIVE_QUERY_RE.test(key)) url.searchParams.set(key, REDACTED);
    }
    text2 = url.toString();
  } catch {
  }
  return text2.replace(
    /(["']?(?:authorization|api-key)["']?\s*:\s*["']?)(?:Bearer\s+)?[^"',\r\n}]+/gi,
    `$1${REDACTED}`
  ).replace(/(api-key\s*:\s*)\S+/gi, `$1${REDACTED}`).replace(/(authorization\s*:\s*)(?:Bearer\s+)?[^\r\n]+/gi, `$1${REDACTED}`).replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, `Bearer ${REDACTED}`).replace(/(\b(?:access_token|assertion|client_assertion|client_secret|code|password|refresh_token|sig|signature|token)=)[^&\s]+/gi, `$1${REDACTED}`);
}
function redactSensitive(value, key = "") {
  if (value == null) return value;
  if (SENSITIVE_KEY_RE.test(String(key))) return REDACTED;
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map((entry) => redactSensitive(entry, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, redactSensitive(childValue, childKey)])
    );
  }
  return value;
}
function parseErrorShape(body) {
  const error = body?.error && typeof body.error === "object" ? body.error : body;
  if (!error || typeof error !== "object") {
    return { code: "", message: "", details: [], target: "" };
  }
  return {
    code: typeof error.code === "string" ? error.code : "",
    message: typeof error.message === "string" ? sanitizeString(error.message) : "",
    details: Array.isArray(error.details) ? redactSensitive(error.details) : [],
    target: typeof error.target === "string" ? sanitizeString(error.target) : ""
  };
}
function resolvePath(path6, subscription, apiVersion) {
  const raw = String(path6 || "").trim();
  if (!raw) throw new TypeError("ARM path is required.");
  let absoluteUrl;
  if (/^https?:\/\//i.test(raw)) {
    const url2 = new URL(raw);
    if (url2.origin.toLowerCase() !== ARM_ORIGIN) {
      throw new RangeError("Absolute ARM URLs must use https://management.azure.com.");
    }
    absoluteUrl = raw;
  } else {
    let relativePath = raw.startsWith("/") ? raw : `/${raw}`;
    if (!/^\/(?:subscriptions\/|providers\/)/i.test(relativePath)) {
      if (!subscription) throw new TypeError("A subscription is required for subscription-relative ARM paths.");
      relativePath = `/subscriptions/${encodeURIComponent(subscription)}${relativePath}`;
    }
    absoluteUrl = `${ARM_RESOURCE.slice(0, -1)}${relativePath}`;
  }
  if (!/[?&]api-version=/i.test(absoluteUrl)) {
    if (!apiVersion) throw new TypeError("An explicit ARM api-version is required.");
    absoluteUrl = `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}api-version=${encodeURIComponent(apiVersion)}`;
  }
  const url = new URL(absoluteUrl);
  return {
    url: absoluteUrl,
    path: sanitizeString(absoluteUrl.replace(/^https:\/\/management\.azure\.com/i, "")),
    subscription: extractSubscription(url.pathname, subscription || "")
  };
}
async function parseBody(response) {
  const text2 = await response.text();
  if (!text2 || response.status === 204 || response.status === 205) return null;
  try {
    return JSON.parse(text2);
  } catch {
    throw new Error(`ARM ${response.status} response was not valid JSON.`);
  }
}
var AzureArmError = class extends Error {
  constructor({ status, code = "", message = "", details = [], target = "", requestIds = {}, method = "", path: path6 = "" }) {
    super(message || `${method} ${path6} failed (${status})`);
    this.name = "AzureArmError";
    this.status = Number(status || 0);
    this.code = code;
    this.azureMessage = message;
    this.details = details;
    this.target = target;
    this.requestIds = requestIds;
    this.method = method;
    this.path = path6;
  }
};
function extractEtag(headersLike) {
  return readHeader(headersLike, "etag");
}
function getArmRequestIds(headersLike) {
  return {
    requestId: readHeader(headersLike, "x-ms-request-id") || readHeader(headersLike, "request-id"),
    clientRequestId: readHeader(headersLike, "x-ms-client-request-id"),
    correlationRequestId: readHeader(headersLike, "x-ms-correlation-request-id"),
    routingRequestId: readHeader(headersLike, "x-ms-routing-request-id")
  };
}
function buildArmError({ method, path: path6, response, body }) {
  const azure = parseErrorShape(body);
  const status = Number(response?.status || 0);
  const requestIds = getArmRequestIds(response);
  const summary = azure.message ? `${azure.code ? ` ${azure.code}` : ""}: ${azure.message}` : "";
  const error = new AzureArmError({
    status,
    code: azure.code,
    message: `${method} ${path6} failed (${status})${summary}`,
    details: azure.details,
    target: azure.target,
    requestIds,
    method,
    path: path6
  });
  error.azureMessage = azure.message;
  return error;
}
function createArmClient({ session, fetchImpl = fetch } = {}) {
  if (!session || typeof session.accessToken !== "function") {
    throw new TypeError("createArmClient requires a session with accessToken(subscription, resource, force).");
  }
  if (typeof fetchImpl !== "function") throw new TypeError("createArmClient requires a fetch implementation.");
  async function request({
    subscription = "",
    path: path6,
    apiVersion,
    method = "GET",
    body,
    headers,
    ifMatch: match,
    ifNoneMatch: noneMatch
  } = {}) {
    const resolved = resolvePath(path6, subscription, apiVersion);
    const verb = String(method || "GET").toUpperCase();
    const doFetch = async (forceRefresh = false) => {
      const tokenResult = await session.accessToken(resolved.subscription, ARM_RESOURCE, forceRefresh);
      const requestHeaders = new Headers(headers || {});
      requestHeaders.set("Authorization", `Bearer ${normalizeAccessToken(tokenResult)}`);
      if (body !== void 0 && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
      if (match) requestHeaders.set("If-Match", String(match));
      if (noneMatch) requestHeaders.set("If-None-Match", String(noneMatch));
      return fetchImpl(resolved.url, {
        method: verb,
        headers: requestHeaders,
        body: body === void 0 ? void 0 : JSON.stringify(body)
      });
    };
    let response = await doFetch(false);
    if (response.status === 401) response = await doFetch(true);
    const responseBody = await parseBody(response);
    if (!response.ok) throw buildArmError({ method: verb, path: resolved.path, response, body: responseBody });
    return {
      body: responseBody,
      etag: extractEtag(response),
      status: response.status,
      headers: headersObject(response.headers)
    };
  }
  async function list({ subscription = "", path: path6, apiVersion, headers } = {}) {
    const items = [];
    let nextPath = path6;
    do {
      const response = await request({ subscription, path: nextPath, apiVersion, method: "GET", headers });
      if (Array.isArray(response.body?.value)) {
        items.push(...response.body.value);
      } else if (response.body != null) {
        items.push(response.body);
      }
      nextPath = response.body?.nextLink || "";
    } while (nextPath);
    return items;
  }
  return { request, list };
}

// packages/studio-runtime/src/studio-commands.mjs
import { execFile as execFile3, spawn as spawn3, spawnSync as spawnSync3 } from "node:child_process";
import { createHash as createHash6 } from "node:crypto";
import { accessSync as accessSync3, constants as constants3, readFileSync as readFileSync2 } from "node:fs";
import { cp, lstat, mkdir, mkdtemp, readFile as readFile5, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os3 from "node:os";
import path5 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var ICONS = {
  vscode: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>',
  github: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  azure: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.05 2 4 20.01h5.86l1.45-3.73 5.63 5.72H24L13.05 2Zm.8 6.42 4.37 10.36-5.25-4.79 2.91-5.01-2.03-.56ZM10.1 17.73H6.78l5.45-10.85 1.43 3.38-3.56 7.47Z"/></svg>'
};
var COMMAND_BUTTONS = `<button class="btn ghost" id="open-vscode">${ICONS.vscode}<span class="label">Open in VS Code</span></button>
      <button class="btn ghost" id="save-github">${ICONS.github}<span class="label">Save to GitHub</span></button>
      <button class="btn ghost" id="deploy-azure">${ICONS.azure}<span class="label">Deploy to Azure</span></button>`;
function shortError(error) {
  return redactDeploymentOutput(error?.stderr || error?.stdout || error?.message || error || "Command failed").replace(/\s+/g, " ").trim().slice(0, 300);
}
function canExecuteCommand(file, osName = os3.platform()) {
  try {
    accessSync3(file, osName === "win32" ? constants3.F_OK : constants3.X_OK);
    return true;
  } catch {
    return false;
  }
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
function locateAzureCli(source = process.env, osName = os3.platform(), exists = (candidate) => canExecuteCommand(candidate, osName)) {
  const paths = osName === "win32" ? path5.win32 : path5.posix;
  const inherited = sourcePath(source).split(paths.delimiter).filter(Boolean);
  const home = source.HOME || source.USERPROFILE || os3.homedir();
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
    for (const name2 of osName === "win32" ? ["az.cmd", "az.exe", "az"] : ["az"]) {
      const candidate = paths.join(directory, name2);
      searched.push(candidate);
      if (exists(candidate)) return { found: true, path: candidate, directory, searched };
    }
  }
  return { found: false, path: "", directory: "", searched };
}
function isAzureCliNotFoundError(error) {
  return error?.code === "AZURE_CLI_NOT_FOUND" || error?.name === "AzureCliNotFoundError";
}
function isAzureCliLoginRequiredError(error) {
  return /(?:please run ['"`]?az login|run ['"`]?az login|not logged in|login required|no subscriptions found)/i.test(
    shortError(error)
  );
}
function azureCliChildEnv(source = process.env, located = locateAzureCli(source), osName = os3.platform()) {
  const paths = osName === "win32" ? path5.win32 : path5.posix;
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
function redactDeploymentOutput(value) {
  return String(value || "").replace(/(https?:\/\/)[^/\s@]+@/gi, "$1[REDACTED]@").replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]").replace(
    /((?:^|[\s,{])["']?[A-Za-z0-9_-]*(?:token|secret|password|key|connection[_-]?string)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
    "$1[REDACTED]"
  ).replace(/([?&](?:code|key|sig|token|secret)=)[^&\s]+/gi, "$1[REDACTED]");
}

// canvases/azure-functions-hosted-skills/src/azure-auth.mjs
var HOSTED_SKILLS_AUTH_PROVIDER_ENV = "FUNCTIONS_HOSTED_SKILLS_AUTH_PROVIDER";
var DEFAULT_HOSTED_SKILLS_AUTH_PROVIDER = "toolkit";
function enabledAccounts(state3) {
  const cloud = state3.cloud?.name;
  return state3.accounts.filter(
    (account) => account.state.toLowerCase() === "enabled" && account.cloud === cloud
  );
}
function stateError(state3) {
  return new AuthError(
    state3.error?.code || (state3.status === "signed-out" ? "signed-out" : "not-connected"),
    state3.error?.message || "Azure CLI sign-in is unavailable.",
    state3.error?.remedy
  );
}
function tokenScope(resource) {
  const value = String(resource || "").trim();
  if (!value) throw new AuthError("invalid-scope", "Specify the Azure token audience.");
  return value.endsWith("/.default") ? value : `${value.replace(/\/+$/, "")}/.default`;
}
var lower2 = (value) => String(value ?? "").toLowerCase();
var pickerAccountKey = (account) => JSON.stringify([
  account.cloud,
  lower2(account.tenantId),
  lower2(account.id),
  lower2(account.accountName)
]);
function projectPickerAccounts(accounts, revision) {
  return {
    revision,
    accounts: accounts.map((account) => ({
      key: pickerAccountKey(account),
      id: account.id,
      name: account.name || account.id,
      tenantId: account.tenantId,
      tenantName: account.tenantName || account.tenantId,
      cloud: account.cloud,
      accountName: account.accountName,
      state: account.state,
      isDefault: Boolean(account.isDefault)
    }))
  };
}
function validatePickerSelection(snapshot, request) {
  if (!request || typeof request !== "object" || Array.isArray(request) || request.revision !== snapshot.revision || !Array.isArray(request.selectedKeys) || request.selectedKeys.length !== 1) {
    throw new AuthError("stale-scope", "Refresh subscriptions and choose the subscription again.");
  }
  const scope = normalizeSubscriptionScope(request);
  if (scope.cloud !== "AzureCloud" || scope.subscriptionIds.length !== 1) {
    throw new AuthError("invalid-scope", "Choose exactly one AzureCloud subscription.");
  }
  const selected = snapshot.accounts.filter((account2) => account2.key === request.selectedKeys[0]);
  if (selected.length !== 1) {
    throw new AuthError("stale-scope", "The selected account is no longer available. Refresh subscriptions.");
  }
  const account = selected[0];
  if (lower2(account.state) !== "enabled") {
    throw new AuthError("access-denied", `The selected subscription is ${account.state || "disabled"}.`);
  }
  if (lower2(account.id) !== scope.subscriptionIds[0] || lower2(account.tenantId) !== scope.tenantId || account.cloud !== scope.cloud) {
    throw new AuthError("invalid-scope", "The selected subscription does not match its tenant, cloud, or account.");
  }
  const identities = new Set(snapshot.accounts.filter((candidate) => lower2(candidate.id) === lower2(account.id) && lower2(candidate.tenantId) === lower2(account.tenantId) && candidate.cloud === account.cloud).map((candidate) => lower2(candidate.accountName)));
  if (identities.size !== 1) {
    throw new AuthError("ambiguous-identity", "The selected subscription is cached under multiple Azure accounts.");
  }
  return { scope, account };
}
function createHostedSkillsAzureAuth({
  auth = (() => {
    const located = locateAzureCli();
    return createAzureAuthSession({
      source: {
        kind: "cli",
        ...located.found ? { executable: located.path } : {},
        environment: azureCliChildEnv(process.env, located)
      }
    });
  })(),
  armClientFactory = createArmClient
} = {}) {
  let disposed = false;
  let controller2 = new AbortController();
  const bindings = /* @__PURE__ */ new Map();
  const unsubscribe = auth.subscribe((event) => {
    if (event.type === "tokens-invalidated") return;
    controller2.abort();
    controller2 = new AbortController();
    bindings.clear();
  });
  function assertOpen() {
    if (disposed) throw new AuthError("disposed", "The Hosted Skills Azure session has been disposed.");
  }
  async function profile({ force = false, signal } = {}) {
    assertOpen();
    const current = auth.getState();
    if (force || current.status !== "connected") await auth.reloadProfile({ signal });
    const state3 = auth.getState();
    if (state3.status !== "connected") throw stateError(state3);
    if (state3.cloud?.name !== "AzureCloud") {
      throw new AuthError(
        "unsupported-cloud",
        "Azure Functions Hosted Skills currently supports AzureCloud only."
      );
    }
    return state3;
  }
  async function subscriptions(force = false, { signal } = {}) {
    const state3 = await profile({ force, signal });
    return enabledAccounts(state3).map(({ id, name: name2, tenantId, isDefault }) => ({
      id,
      name: name2,
      tenantId,
      isDefault
    }));
  }
  async function pickerAccounts(force = false, { signal } = {}) {
    const state3 = await profile({ force, signal });
    return projectPickerAccounts(
      state3.accounts.filter((account) => account.cloud === state3.cloud.name),
      state3.revision
    );
  }
  async function resolvePickerScope(request) {
    const snapshot = await pickerAccounts(false);
    const { scope } = validatePickerSelection(snapshot, request);
    return { ...auth.resolveScope(scope), selectedKeys: [...request.selectedKeys], revision: snapshot.revision };
  }
  async function loginStatus(force = false, { signal } = {}) {
    try {
      const state3 = await profile({ force, signal });
      const accounts = enabledAccounts(state3);
      const selected = accounts.find((account) => account.isDefault) || accounts[0] || null;
      const tenant = state3.tenants[0] || null;
      return {
        loggedIn: true,
        cliFound: true,
        signInRequired: false,
        account: selected?.name || tenant?.tenantId || "",
        user: selected?.accountName || tenant?.accountName || "",
        state: state3
      };
    } catch (error) {
      const state3 = auth.getState();
      const code = error?.code || state3.error?.code || "";
      return {
        loggedIn: false,
        cliFound: code !== "cli-not-found",
        signInRequired: code === "signed-out",
        error: [error?.message || state3.error?.message, error?.remedy || state3.error?.remedy].filter(Boolean).join(" "),
        state: state3
      };
    }
  }
  function bindingFor(subscription, resource) {
    assertOpen();
    const state3 = auth.getState();
    if (state3.status !== "connected") throw stateError(state3);
    if (state3.cloud?.name !== "AzureCloud") {
      throw new AuthError(
        "unsupported-cloud",
        "Azure Functions Hosted Skills currently supports AzureCloud only."
      );
    }
    const matches = enabledAccounts(state3).filter(
      (account2) => account2.id.toLowerCase() === String(subscription || "").toLowerCase()
    );
    if (matches.length !== 1) {
      throw new AuthError("invalid-scope", "Select one enabled subscription from the current Azure profile.");
    }
    const account = matches[0];
    const scope = tokenScope(resource);
    const key = JSON.stringify([state3.revision, account.id, account.tenantId, account.cloud, scope]);
    if (!bindings.has(key)) {
      const context3 = auth.bindSubscription({
        subscriptionId: account.id,
        tenantId: account.tenantId,
        cloud: account.cloud
      });
      bindings.set(key, { context: context3, scope });
    }
    return bindings.get(key);
  }
  async function accessToken(subscription, resource, force = false) {
    const { context: context3, scope } = bindingFor(subscription, resource);
    if (force) context3.invalidateTokens();
    const signal = controller2.signal;
    const token = await context3.credential.getToken(scope, { abortSignal: signal });
    context3.assertActive();
    if (signal.aborted) throw new AuthError("auth-invalidated", "The Azure profile changed. Retry the operation.");
    if (!token?.token || !Number.isFinite(token.expiresOnTimestamp)) {
      throw new AuthError("authentication-failed", "The Azure credential returned an invalid access token.");
    }
    return {
      accessToken: token.token,
      expiresOnTimestamp: token.expiresOnTimestamp
    };
  }
  const armClient = armClientFactory({ session: { accessToken } });
  return Object.freeze({
    getState: () => auth.getState(),
    profile,
    subscriptions,
    pickerAccounts,
    resolvePickerScope,
    loginStatus,
    reloadProfile: (options) => auth.reloadProfile(options),
    refreshFromAzure: (options) => auth.refreshFromAzure(options),
    connect: (options) => auth.connect(options),
    disconnect: () => auth.disconnect(),
    accessToken,
    armClient,
    dispose() {
      if (disposed) return;
      disposed = true;
      controller2.abort();
      bindings.clear();
      unsubscribe();
      auth.dispose();
    }
  });
}
function createLegacyHostedSkillsAzureAuth({
  run,
  session = run ? createAzureCliSession(run) : null,
  armClientFactory = createArmClient
} = {}) {
  if (!session) throw new TypeError("Legacy Hosted Skills authentication requires an Azure CLI runner.");
  let disposed = false;
  let pickerRevision = 0;
  let pickerSnapshot = null;
  function assertOpen() {
    if (disposed) throw new AuthError("disposed", "The legacy Hosted Skills Azure session has been disposed.");
  }
  async function loginStatus(force = false) {
    assertOpen();
    if (force) pickerSnapshot = null;
    try {
      const account = await session.account(force);
      return {
        loggedIn: true,
        cliFound: true,
        signInRequired: false,
        account: account?.name || account?.id || "",
        user: account?.user?.name || ""
      };
    } catch (error) {
      return {
        loggedIn: false,
        cliFound: !isAzureCliNotFoundError(error),
        signInRequired: isAzureCliLoginRequiredError(error),
        error: shortError(error)
      };
    }
  }
  async function subscriptions(force = false) {
    assertOpen();
    if (force) pickerSnapshot = null;
    return session.subscriptions(force);
  }
  async function pickerAccounts(force = false) {
    assertOpen();
    if (force) pickerSnapshot = null;
    if (!force && pickerSnapshot) return structuredClone(pickerSnapshot);
    const [rows, current] = await Promise.all([
      run ? run(["account", "list", "-o", "json"]) : session.subscriptions(force),
      session.account(force)
    ]);
    const accounts = rows.map((account) => ({
      id: account.id,
      name: account.name || account.id,
      tenantId: account.tenantId,
      tenantName: account.tenantDisplayName || account.tenantName || account.tenantId,
      cloud: account.environmentName || account.cloudName || "AzureCloud",
      accountName: account.user?.name || current?.user?.name || "",
      state: account.state || "Enabled",
      isDefault: Boolean(account.isDefault)
    }));
    if (accounts.some((account) => !account.accountName)) {
      throw new AuthError("invalid-profile", "Azure CLI returned subscription metadata without an account identity.");
    }
    pickerSnapshot = projectPickerAccounts(accounts, ++pickerRevision);
    return structuredClone(pickerSnapshot);
  }
  async function resolvePickerScope(request) {
    const snapshot = await pickerAccounts(false);
    const { scope, account } = validatePickerSelection(snapshot, request);
    return {
      ...scope,
      tenantName: account.tenantName,
      subscriptions: [{ id: account.id, name: account.name }],
      selectedKeys: [...request.selectedKeys],
      revision: snapshot.revision
    };
  }
  async function profile(force = false) {
    if (force) pickerSnapshot = null;
    const [login, accounts] = await Promise.all([loginStatus(force), subscriptions(force)]);
    if (!login.loggedIn) {
      throw new AuthError(
        login.signInRequired ? "signed-out" : login.cliFound ? "cli-failed" : "cli-not-found",
        login.error || "Azure CLI sign-in is unavailable."
      );
    }
    return {
      status: "connected",
      source: "legacy-cli",
      accounts,
      identity: login.user || login.account || null
    };
  }
  const armClient = armClientFactory({ session });
  return Object.freeze({
    mode: "legacy",
    getState: () => ({ status: disposed ? "disconnected" : "uninitialized", source: "legacy-cli" }),
    profile: ({ force = false } = {}) => profile(force),
    subscriptions,
    pickerAccounts,
    resolvePickerScope,
    loginStatus,
    reloadProfile: () => profile(true),
    refreshFromAzure: async () => {
      pickerSnapshot = null;
      return profile(true);
    },
    connect: () => {
      throw new AuthError(
        "unsupported-operation",
        "Legacy Hosted Skills authentication never starts Azure CLI sign-in.",
        "Run az login in a terminal, then refresh."
      );
    },
    disconnect: () => {
      pickerSnapshot = null;
      session.clear();
    },
    accessToken: (subscription, resource, force = false) => {
      assertOpen();
      return session.accessToken(subscription, resource, force);
    },
    armClient,
    dispose() {
      if (disposed) return;
      disposed = true;
      pickerSnapshot = null;
      session.clear();
    }
  });
}
function resolveHostedSkillsAzureAuthProvider(value = process.env[HOSTED_SKILLS_AUTH_PROVIDER_ENV]) {
  const mode = String(value || DEFAULT_HOSTED_SKILLS_AUTH_PROVIDER).trim().toLowerCase();
  if (!["toolkit", "legacy"].includes(mode)) {
    throw new AuthError(
      "invalid-auth-provider",
      `${HOSTED_SKILLS_AUTH_PROVIDER_ENV} must be "toolkit" or "legacy".`
    );
  }
  return mode;
}
function createHostedSkillsAzureProvider({
  mode = resolveHostedSkillsAzureAuthProvider(),
  run,
  auth,
  armClientFactory = createArmClient
} = {}) {
  const selected = resolveHostedSkillsAzureAuthProvider(mode);
  if (selected === "legacy") {
    return createLegacyHostedSkillsAzureAuth({ run, armClientFactory });
  }
  const provider = createHostedSkillsAzureAuth({ auth, armClientFactory });
  return Object.freeze({ ...provider, mode: "toolkit" });
}
function createFixtureAzureAuthSession() {
  let disposed = false;
  const state3 = {
    status: "signed-out",
    revision: 0,
    source: "cli",
    identity: null,
    cloud: null,
    accounts: [],
    tenants: [],
    error: {
      code: "signed-out",
      message: "Azure authentication is disabled in Hosted Skills fixture mode.",
      remedy: "Inject a fixture authentication session."
    },
    warnings: [],
    freshness: { source: null, refreshedAt: null, complete: false }
  };
  const fail3 = () => {
    if (disposed) throw new AuthError("disposed", "This fixture authentication session has been disposed.");
    throw new AuthError(state3.error.code, state3.error.message, state3.error.remedy);
  };
  return Object.freeze({
    getState: () => structuredClone(state3),
    reloadProfile: fail3,
    refreshFromAzure: fail3,
    connect: fail3,
    disconnect() {
    },
    subscribe: () => () => {
    },
    resolveScope: fail3,
    bindSubscription: fail3,
    bindTenant: fail3,
    dispose() {
      disposed = true;
    }
  });
}
export {
  DEFAULT_HOSTED_SKILLS_AUTH_PROVIDER,
  HOSTED_SKILLS_AUTH_PROVIDER_ENV,
  createFixtureAzureAuthSession,
  createHostedSkillsAzureAuth,
  createHostedSkillsAzureProvider,
  createLegacyHostedSkillsAzureAuth,
  resolveHostedSkillsAzureAuthProvider
};
