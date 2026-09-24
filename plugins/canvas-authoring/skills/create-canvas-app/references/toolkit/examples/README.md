# Read-only Azure examples

Building a new canvas? Start with the [Azure canvas quickstart](../quickstart.md),
then use these examples to customize its Azure reads.

| Example | Use it to learn |
| --- | --- |
| [Resource groups](resource-groups.mjs) | List resource groups with explicit scope, paging limits and cancellation. |
| [SDK client](sdk-client.mjs) | Pass a bound credential to an Azure SDK client or the optional toolkit ARM client. |
| [Custom HTTP client](custom-fetch-client.mjs) | Use an SDK-cached bearer callback with a caller-owned HTTP transport. |

Copy `resource-groups.mjs` into server source and call
`readResourceGroups(context, { signal, httpClient })` with a subscription-bound
context. It returns `id`, `name` and `location`, and rejects incomplete listings,
invalid data, cancellation or results above 200 rows / 10 pages. An empty array
means a successful empty listing. It has no CLI runner or import-time activity.

## Authentication and transport examples

These Node 22+ examples use public package exports. Importing them, or running
them without `--run`, performs no discovery, authentication, or network request.
Install the toolkit as described in the
[package guide](../README.md#setup-and-exports). No separate dependency install
is needed in this examples folder. The [authentication guide](../auth.md)
explains session ownership and credential handling.
The SDK/custom-HTTP runners never launch login, change CLI defaults/cloud, or
print credentials or resource data. Supply a dedicated test scope and an **already authenticated**
Azure CLI profile. The profile's active cloud must match the explicit cloud.

From the toolkit package directory (`node_modules/@microsoft/canvas-toolkit`
in an installed application), opt in to exactly one read:

```sh
node examples/sdk-client.mjs \
  --run --subscription <subscription-id> --tenant <tenant-id> --cloud AzureCloud
node examples/sdk-client.mjs \
  --run --optional-arm --subscription <subscription-id> --tenant <tenant-id> --cloud AzureCloud
node examples/custom-fetch-client.mjs \
  --run --subscription <subscription-id> --tenant <tenant-id> --cloud AzureCloud
```

Replace `AzureCloud` with `AzureUSGovernment` or `AzureChinaCloud` for an
appropriately authenticated sovereign-cloud profile; these commands do not
establish live qualification for those environments. Examples time out after
30 seconds and dispose their local session without machine-wide logout.

- **SDK:** constructs a real `ServiceClient` with `context.credential` and
  `context.environment` endpoint/audience. Generated service SDKs use the same
  credential contract; their service-specific endpoint options can differ.
- **Optional ARM:** uses `createArmClient(context)` instead, gaining toolkit
  per-request validity and ARM URL checks. For lists use `listArm(context, path)`;
  an iterator failure means results are incomplete, including `paging-limit`.
- **Custom fetch:** creates one reusable SDK-cached token callback and uses it
  for actual `fetch` requests. Request routing is the custom client's concern,
  not an arbitrary-service-URL option on authentication. Redirects are disabled.

For repeated requests, retain the client/reader until its auth context changes.
Then cancel old requests and retire the client. See the auth guide for
[lifetime and token-cache rules](../auth.md#lifetime-cancellation-and-disposal)
and [ARM audience handling](../auth.md#optional-arm-transport).

For automated tests, pass an injected-credential context rather than running
the CLI examples. `readWithSdk(context, { httpClient })` and
`readWithOptionalArm(context, { httpClient })` accept a standard Azure SDK
`HttpClient`. Tests use fake credentials and per-client transports; they do not
invoke the opt-in runner.
