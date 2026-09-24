# Azure authentication sessions

Use `@microsoft/canvas-toolkit/auth` to manage a server-side Azure session and
bind credentials to explicit scope. Use your own Azure SDK/HTTP client or the
optional helpers in `@microsoft/canvas-toolkit/azure`.

Building a first app? Start with the [Azure quickstart](quickstart.md).
This page is the authentication reference:

- [Session methods and metadata](#public-session-api)
- [Bring your own credential](#explicit-credential-injection)
- [SDK and HTTP clients](#azure-sdk-clients-versus-custom-http-clients)
- [Login and refresh](#login-refresh-and-external-changes)
- [Lifetime and cancellation](#lifetime-cancellation-and-disposal)
- [Errors](#errors-and-security-boundaries) and [migration](#migrating-earlier-examples)

See the [package guide](README.md) for installation and licensing. Cloud and OS
support targets do not establish live sign-in coverage for every combination.

## Responsibility and prerequisites

- Use Node.js **22+** and, for the default source, Azure CLI **2.61+**.
  Azure Identity supplies the credential and bearer-token caching; the CLI owns
  sign-in and its token store.
- Alternatively, supply a `TokenCredential` with matching identity metadata.
  You own its configuration and disposal; the toolkit does not mix it with
  CLI accounts or fall back to another provider.
- The app owns resource selection, UI/state, mutation consent, retries and
  request/client lifetimes. A bound handle is not an authorization boundary.

Login requires explicit `connect()`. The toolkit does not repair failures by
signing in, install or upgrade the CLI, change CLI defaults/cloud, or log out
the machine. Login and `refreshFromAzure()` can change the shared CLI profile;
local disconnect does not undo those changes.

## Start with one owned session

```js
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

const auth = createAzureAuthSession(); // Same as source: { kind: "cli" }.
try {
    const state = await auth.reloadProfile();
    if (state.status !== "connected") {
        throw new Error("Connect to Azure before starting this operation.");
    }

    // These values come from an explicit, validated user selection.
    const context = auth.bindSubscription({
        subscriptionId: "00000000-0000-0000-0000-000000000001",
        tenantId: "00000000-0000-0000-0000-000000000002",
        cloud: "AzureCloud",
    });
    context.assertActive();
    // Pass context.credential to your SDK client, or use a bearer callback below.
} finally {
    auth.dispose();
}
```

Creation is lazy: it does not execute the CLI or authenticate. Keep a session
for its owner's lifetime, not per request. Send only JSON-safe snapshots to
the iframe; the subscription picker needs metadata, not credentials. Neither
the CLI default nor the first subscription grants consent to run an operation.

If your host manages executable discovery and child environments, pass them
through the public options:

```js
const auth = createAzureAuthSession({
    source: {
        kind: "cli",
        executable: azPath,
        environment: childEnvironment,
    },
});
```

These options apply to profile, login, refresh and token operations. Preserve
proxy and certificate settings when constructing `childEnvironment`. Omit the
options to use normal `az` discovery and the inherited environment.

## Public session API

| Method | Contract |
| --- | --- |
| `createAzureAuthSession(options?)` | Creates an owned session. The default source is `{ kind: "cli" }`; injected credentials are explicit, as shown below. |
| `getState()` | Returns an independent JSON-safe snapshot without credentials or token material. |
| `reloadProfile({ signal }?)` | Reads local CLI metadata without server refresh, or reloads caller-supplied metadata in injected mode. Returns a snapshot; failures surface safe errors and state, not empty success results. |
| `refreshFromAzure({ signal }?)` | Explicitly refreshes the CLI profile from Azure, retaining warnings and uncertain-freshness information. Unavailable for injected sources. |
| `connect({ tenantId?, flow?, allowNoSubscriptions?, signal?, onProgress? }?)` | Explicit CLI login followed by metadata reload; returns the new snapshot. `flow` defaults to `"default"`; `"device-code"` is explicit. `allowNoSubscriptions` defaults to `false`. Injected mode can reconnect local state but cannot launch interactive login. |
| `disconnect()` | Invalidates this session’s handles and notifies its consumers. Does not run CLI logout or revoke access tokens. |
| `dispose()` | Invalidates handles and cleans up owned operations and subscriptions. Idempotent; dispose the session when its owner ends. |
| `subscribe(listener)` | Emits `{ type, revision, state }` for explicit lifecycle changes and returns an unsubscribe function. It does not observe external CLI changes. |
| `resolveScope({ tenantId, cloud, subscriptionIds })` | Validates against the loaded snapshot without implicit CLI/network discovery. Returns normalized scope and subscription display metadata. |
| `bindSubscription({ subscriptionId, tenantId, cloud })` | Returns an immutable, generation-bound handle for one unambiguous enabled subscription. |
| `bindTenant({ tenantId, cloud, accountName? })` | Returns a tenant-only handle, rejecting identities the current CLI account cannot unambiguously address. |

A handle exposes `tenantId`, `cloud`, optional `subscriptionId`, `accountName`,
`environment`, `credential`, `assertActive()`, `getBearerTokenProvider(scopes)`, and
`invalidateTokens()`. Do not mutate a handle to retarget a request. Bind a new
handle after scope or authentication changes, and build URLs from the same
explicit subscription/tenant/cloud context.
Binding inputs and `context.cloud` use the cloud **name string**, such as
`"AzureCloud"`; `context.environment` is the immutable cloud **metadata object**
described below. Snapshot `cloud` also contains metadata, not just the name.

### Snapshots and signed-in state

Snapshots contain `status`, `revision`, `source`, `identity`, `cloud`, `accounts`,
`tenants`, `error`, `warnings`, and `freshness`. They are safe transport values,
not credentials or evidence of permission to a resource:

| Metadata | Shape |
| --- | --- |
| Cloud | `{ name, resourceManager, armResource, authority }` |
| Account | `{ id, name, tenantId, tenantName, cloud, isDefault, state, accountName }` |
| Tenant | `{ tenantId, cloud, accountName }` |

`source` is `"cli"` or `"credential"`; `identity` is a fingerprint string or
`null`, not a credential. Snapshot `cloud` is a metadata object or `null`.
`warnings` is an array of safe strings; `error` is
`{ code, message, remedy? }` or `null`. `freshness` is
`{ source, refreshedAt, complete }`: `source` is `"cli-profile"`,
`"azure-refresh"`, `"caller-provided"`, or `null`; `refreshedAt` is a timestamp
string or `null`; `complete` is `false`. It deliberately does not certify a
complete Azure account inventory.
Public TypeScript snapshots are read-only. Runtime snapshots are detached
copies, including separate results for concurrent callers; modifying one does
not modify the session or another caller's result.

`status` is `"uninitialized"`, `"signing-in"`, `"connected"`, `"disconnected"`,
`"signed-out"`, or `"error"`. **Connected with zero subscriptions is valid**:
an authenticated tenant may have no subscriptions, or the application may only
need a tenant-scoped service. CLI tenant-only sentinel entries appear as tenant
metadata, never selectable real subscriptions. Do not implement sign-in checks
as `accounts.length > 0`.

Disabled subscriptions may appear in metadata for explanation but cannot be
bound. Missing, cross-tenant/cloud, or ambiguous selections are rejected.
`resolveScope()` is for subscription selections; use `bindTenant()` for a
tenant-only operation. An `accountName` is an identity discriminator, not a
request to switch accounts or bypass CLI ambiguity.
With a CLI source, tenant binding requires the principal addressable by the
loaded CLI default account; an absent or ambiguous default principal is rejected.
The toolkit does not select a different account on the user's behalf.

Bindings must use the loaded source's active cloud. A cloud name on a request
does not switch the CLI cloud or reconfigure an injected credential.
`az account list --all` can contain cached rows from several clouds. Those rows
remain visible as metadata; only the active cloud can be bound.
The known metadata targets are:

| Cloud name | Resource Manager endpoint | ARM audience (`armResource`) | Authority |
| --- | --- | --- | --- |
| `AzureCloud` | `https://management.azure.com` | `https://management.core.windows.net/` | `https://login.microsoftonline.com` |
| `AzureUSGovernment` | `https://management.usgovcloudapi.net` | `https://management.core.usgovcloudapi.net/` | `https://login.microsoftonline.us` |
| `AzureChinaCloud` | `https://management.chinacloudapi.cn` | `https://management.core.chinacloudapi.cn/` | `https://login.chinacloudapi.cn` |

This table documents routing metadata, not live qualification. Custom clouds or
unexpected CLI endpoint metadata fail closed; there is no public-cloud fallback.

### Explicit credential injection

```js
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

// credential is a TokenCredential obtained/configured by the caller.
const auth = createAzureAuthSession({
    source: {
        kind: "credential",
        credential,
        context: {
            tenantId: "00000000-0000-0000-0000-000000000002",
            cloud: "AzureCloud",
            identityKey: "partner-owned-stable-identity",
            accountName: "application-identity",
        },
        subscriptions: [],
    },
});
await auth.reloadProfile();
const context = auth.bindTenant({
    tenantId: "00000000-0000-0000-0000-000000000002",
    cloud: "AzureCloud",
    accountName: "application-identity",
});
// Use context, then call auth.dispose() when its owner ends.
```

`subscriptions` is optional and uses the normalized account shape above. Supply
the actual context for the credential, including its stable `identityKey`.
Every supplied subscription requires all account fields, including `name`,
`tenantName`, `isDefault`, `state`, and `accountName`, and must match the injected
tenant, cloud, and principal. Metadata is normalized and snapshotted on reload.
If the caller updates the supplied source metadata, call `reloadProfile()`
explicitly to validate and adopt it; retained old handles are then invalidated.
The toolkit cannot prove that caller metadata matches permissions or that a
supplied credential is configured for the claimed tenant and sovereign cloud.
It does not discover extra CLI subscriptions to fill gaps, perform credential
fallback, or own disposal of the caller's credential. A credential requiring
interactive acquisition remains the caller's responsibility.

For an explicit CLI-less device-code provider, the released SDK's
`DeviceCodeCredential` supports `disableAutomaticAuthentication: true`.
Configure its client, tenant, and cloud authority deliberately, and supply a
`userPromptCallback` that routes instructions only to transient UI rather than
the SDK's default console output. Call `authenticate(scopes, { abortSignal })`
only from the selected Connect operation; validate the returned
`AuthenticationRecord` and derive the injected identity metadata from it.
Do not invent a signed-in identity when the record is absent. Subsequent
`getToken` calls then cannot unexpectedly start interactive sign-in.

Own this interactive SDK operation separately from a toolkit bearer callback's
shared acquisition. Cancelling a callback waiter does not cancel other waiters;
it is not an interactive-login cancellation mechanism. Clear transient progress
and reject late results when the application disconnects or disposes.

Prefer renewable SDK credentials over a legacy raw-token bridge. If an
application retains one, it must supply real expiry, tenant/cloud/principal
metadata, and an exact allowed audience, and reject expired or mismatched
requests. Neither arbitrary expiry values nor one token reused for unrelated
audiences is a supported substitute for credential configuration.

## Azure SDK clients versus custom HTTP clients

### Standard SDK clients: pass the credential

Pass `context.credential` to the SDK client you already use. For example, when
your application has the `@azure/storage-blob` SDK installed:

```js
import { BlobServiceClient } from "@azure/storage-blob";

context.assertActive();
const blobs = new BlobServiceClient(blobServiceUrl, context.credential);
// blobServiceUrl and SDK cloud/audience options are application-owned.
```

The SDK's authentication pipeline handles caching and token refresh. Do not
fetch a token once and manufacture a fixed-token credential. Do not persist a
credential or bearer token in canvas state, URLs, logs, or browser storage.
Configure each service's endpoint/audience for the selected cloud; a session
does not rewrite arbitrary third-party SDK options.

**Retire SDK clients when the session changes.** An SDK pipeline may hold an
already-issued bearer token and may therefore send without calling the
credential again. The toolkit cannot revoke that token or intercept an
arbitrary partner client. See [lifetime rules](#lifetime-cancellation-and-disposal).

### Custom HTTP clients: retain the callback, not the token

```js
const getToken = context.getBearerTokenProvider(
    "https://storage.azure.com/.default",
);

async function requestStorage(url, { signal } = {}) {
    context.assertActive();
    const token = await getToken({ signal });
    context.assertActive();
    return fetch(url, {
        redirect: "error",
        signal,
        headers: { Authorization: `Bearer ${token}` },
    });
}
```

Use the target service's documented scope for its cloud. Validate custom URLs
and never forward bearer headers across untrusted origins or redirects.
The callback uses the released SDK's `getBearerTokenProvider` cache rather than
a toolkit token-cache algorithm. `scopes` accepts a string or an array of strings.
Reuse it across requests in that context:
creating a callback per request defeats that cache. A callback accepts an
optional `{ signal }`; cancelling one waiter does not cancel an acquisition
shared by another caller.

`context.invalidateTokens()` replaces local token-provider state while keeping
existing callbacks usable. It does not revoke issued tokens or clear caches
inside an SDK client you created. Conversely, session invalidation makes old
handles and callbacks reject: they do not silently switch identity or return a
late acquisition from an invalidated generation.

## Optional ARM transport

Import `createArmClient`, `createPipelineRequest` and `listArm` from
`@microsoft/canvas-toolkit/azure` for generic ARM requests. They are optional;
authentication also works with your own clients.

`createArmClient(context, { httpClient }?)` uses the bound cloud's Resource Manager endpoint and
ARM audience. Toolkit-owned clients check context validity on every request,
even if their SDK pipeline already cached a bearer token. That local guard is
not token revocation or a sandbox for extension code.

`listArm(context, path, options)` pages ARM list responses. When a page limit
leaves a `nextLink`, it must be surfaced rather than reported as complete.
Inappropriate paging origins are rejected. A bounded result is not a complete
inventory; make incompleteness visible in application UI. Use the relevant Azure
REST documentation to choose API versions; the toolkit does not discover them
or supply service-specific request bodies.
Both client and listing options accept an optional standard Azure SDK
`httpClient`, scoped to that client or listing. There is no global HTTP mock.
This lets applications test their actual clients without changing other sessions.
Default ARM clients are memoized per bound handle. Supplying `httpClient`
creates an isolated client and does not replace or reuse that cached default.

Preserve `environment.armResource` exactly when forming
`${environment.armResource}/.default`. An audience ending in `/` intentionally
produces `//.default`: the SDK strips only the scope suffix when requesting a CLI
resource token. Endpoint URL normalization must not alter the token audience.

## Login, refresh, and external changes

### Explicit connection

```js
await auth.connect({
    tenantId,
    flow: "device-code", // Or "default" for the CLI's ordinary login flow.
    allowNoSubscriptions: true,
    signal,
    onProgress: text => {
        // Render escaped transient text in the current login UI.
        loginStatus.textContent = text;
    },
});
```

CLI login owns browser/WAM/device-code interaction. Progress is transient plain
text, not an OAuth protocol to parse. Clear it after the attempt; it can contain
interactive codes and must not enter persisted state, diagnostic files, or
telemetry. Cancellation is not a sign-out decision or permission to log out the
machine. Use a new snapshot after connection before rebinding clients.

### Two different refresh operations

| Operation | Source of metadata | Shared-profile effect |
| --- | --- | --- |
| `reloadProfile()` | Reads the CLI's current local profile; injected mode rereads supplied metadata. | Does not refresh accounts from Azure or change CLI defaults. |
| `refreshFromAzure()` | Explicit CLI server refresh, then loaded metadata. | Can rewrite the shared CLI account profile used by other CLI users/consumers. Not available with an injected credential. |

`freshness` distinguishes CLI-profile, Azure-refresh, and caller-provided
metadata. **Successful CLI exit is not proof that every account refreshed.**
Server refresh can retain old records and emit warnings when a tenant is
unavailable or needs interaction. Keep warnings visible alongside the result;
do not label it a completely fresh account inventory. Reload is not a silent
substitute for server refresh, and neither is an implicit request to log in.

External `az login`, `az logout`, cloud switches, and account/profile edits are
**manual-refresh only in v1**. There are no file watchers, polling loops,
background discovery, or external-change observer exports. Present an explicit
Reload profile action after an external change. Present Refresh from Azure as a
separate action with its shared-profile warning. Session events notify consumers
about toolkit-owned lifecycle operations, not mutations elsewhere on the machine.

## Lifetime, cancellation, and disposal

Events have `type` equal to `"reload-profile"`, `"refresh-from-azure"`,
`"signing-in"`, `"connected"`, `"disconnect"`, `"dispose"`,
`"tokens-invalidated"`, or `"error"`, plus `revision` and a snapshot `state`.
Read `getState()` for initial state; subscription does not itself trigger
discovery. Operations can emit start and completion states, so check
`event.state.status` before rebinding. `"tokens-invalidated"` changes token
provider state without invalidating its owning context.

1. Create one session per deliberate auth owner; share it where clients and views
   should share invalidation, not as an uncontrolled process-global singleton.
2. Subscribe to lifecycle changes and cancel owned resource requests, discard
   retained clients, and clear or revalidate selections/results from the old
   context. Rebind from the newly loaded snapshot before more work.
3. A context is generation-bound. Login, reload, refresh, local disconnect, and
   disposal invalidate old handles. An old credential/callback must not become a
   different account after a concurrent selection or refresh.
4. Pass signals to owned operations. A cancelled token waiter does not cancel
   another caller's shared acquisition. Ignore stale application-level results
   too; token guards do not replace your UI request-generation logic.
5. Unsubscribe listeners and dispose the session on server/panel owner teardown.
   `dispose()` is idempotent and cleans up toolkit-owned operations/listeners.
   Dispose any caller-owned credential or clients according to their SDK's
   lifecycle, if supported.

`disconnect()` is **local disconnection, not token revocation**. It does not run
`az logout`, sign out other processes/sessions, revoke a token already sent, or
undo CLI login/profile effects. Cancel in-flight work and retire your clients;
previously issued access tokens remain valid according to Azure.

## Errors and security boundaries

`AuthError(code, message, remedy?)` exposes safe `code`, `message`, and an optional
string `remedy`. Render remedies as escaped text. Handle cancellation distinctly
from authentication failures (`code === "cancelled"` for auth operations, or
`name === "AbortError"` for an SDK/HTTP cancellation);
do not turn a failed or cancelled discovery into an empty subscription list.
Never serialize raw SDK/CLI causes, token responses, authorization headers,
device codes, or login progress into durable errors or telemetry.
Failing event/progress callbacks and cleanup failures emit fixed, sanitized
process warnings without preventing local invalidation. CLI cancellation
attempts to terminate owned process trees within bounded waits. Unresolved
cleanup still warns and can be retried during disposal; do not treat a stopped
parent process as proof that all its children stopped.

Examples of actionable auth codes include:

| Code | Consumer response |
| --- | --- |
| `invalid-source`, `invalid-profile`, `cloud-unsupported` | Correct source metadata/environment; do not substitute empty accounts or a public-cloud default. |
| `invalid-scope`, `ambiguous-identity`, `access-denied` | Revisit explicit scope/principal selection; do not silently choose another subscription. |
| `not-connected`, `disconnected` | Present an explicit reload/connect action; do not launch login from a failed request. |
| `auth-invalidated`, `disposed` | Retire old work/clients. Rebind to a current session, or create a new owner after disposal. |
| `tokens-invalidated` | The acquisition was retired; an existing callback can be called again while its context is active. |
| `unsupported-operation` | Do not use CLI server refresh with an injected source; reload caller-provided metadata instead. |
| `cancelled` | End only the cancelled operation; do not report it as signed-out. |

Explicit subscription/tenant/cloud binding prevents mutable-selection mistakes;
it does not restrict the resource access granted by Azure. A Node extension
receiving a `TokenCredential` can use it outside toolkit helpers. Host-brokered,
capability-limited access is a separate platform concern, not provided here.
Custom clouds, standalone tenant/sign-in UI components, automatic external
refresh, and mutation permission management are outside this v1 contract.

## Migrating earlier examples

The previous process-global authentication API is replaced, not silently
aliased. Update consumers to the session entry point and retain ownership:

| Earlier API/pattern | Replacement |
| --- | --- |
| `getSignInState()` from `/azure` | Create a session; explicitly `reloadProfile()` and use `getState()`/lifecycle events. |
| `listSubscriptions({ refresh: true })` | `auth.reloadProfile()` and its `accounts` metadata. That old option meant local reread, not Azure server refresh. |
| Global `connect()` / `disconnect()` | `auth.connect(...)` / `auth.disconnect()` on the owned session. |
| A subscription record with `credential` / `armClient()` | JSON-safe account metadata plus an explicitly bound `context`; use `context.credential` or optional `createArmClient(context)`. |
| `listArm(sub, ...)` | `listArm(context, ...)` with a bound context and visible paging limits. |
| `AzureAuthError` | `AuthError` from `/auth`; handle its safe `code`, `message`, and optional `remedy`. |
| Exported `AbortError` | Auth operations use `AuthError` code `"cancelled"`; SDK/HTTP cancellations may still have name `"AbortError"`. |
| `createSubscriptionProvider()` and its discovery/refresh methods | `createAzureAuthSession()`, `reloadProfile()`, and `resolveScope()` on the loaded session. The standalone discovery factory is removed. |
| Public injection of CLI/process behavior | Explicit production `TokenCredential` injection; isolate fake processes/credentials in test-only seams. |

`@microsoft/canvas-toolkit/subscriptions` retains only the pure
`normalizeSubscriptionScope` helper and `SubscriptionError`; it no longer
discovers accounts. New auth consumers use the loaded session snapshot and
`auth.resolveScope()` rather than combining independently discovered CLI
metadata with another identity. Structural scope normalization is not
authorization or proof that a subscription is available to the session.

Use the documented public exports. UI grouping, selection and state transport
remain app responsibilities; there is no automatic external-change observer.

## Examples and qualification

The packaged [read-only examples](examples/README.md) demonstrate standard SDK,
optional toolkit ARM, and custom HTTP clients. They require explicit opt-in,
an already authenticated CLI profile, and explicit subscription/tenant/cloud
arguments. Importing them does not discover accounts or authenticate.

For automated tests, inject credentials and HTTP transports rather than using
the developer's identity. Verify live behavior separately in each supported
host, OS, and cloud with an explicitly authorized test scope. Neither mocked
tests nor a successful package installation prove live sign-in or permissions.