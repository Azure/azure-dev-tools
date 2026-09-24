import { ServiceClient } from "@azure/core-client";
import { AuthError } from "@microsoft/canvas-toolkit/auth";
import { createArmClient, createPipelineRequest } from "@microsoft/canvas-toolkit/azure";
import { isMain, reportFailure, runReadOnly } from "./run-read-only.mjs";

/**
 * The credential also works in a generated @azure/arm-* client. Configure
 * that client's endpoint/audience for the chosen cloud using its SDK options.
 */
export async function readWithSdk(context, { signal, httpClient } = {}) {
    context.assertActive();
    const client = new ServiceClient({
        credential: context.credential,
        endpoint: context.environment.resourceManager,
        credentialScopes: [`${context.environment.armResource}/.default`],
        ...(httpClient ? { httpClient } : {}),
    });
    return readSubscription(client, context, signal);
}

/** The optional toolkit client adds per-request lifecycle and ARM routing checks. */
export async function readWithOptionalArm(context, { signal, httpClient } = {}) {
    return readSubscription(createArmClient(context, { httpClient }), context, signal);
}

async function readSubscription(client, context, signal) {
    context.assertActive();
    if (!context.subscriptionId) throw new AuthError("invalid-context", "Bind a subscription for this example.");
    try {
        const url = new URL(
            `/subscriptions/${encodeURIComponent(context.subscriptionId)}?api-version=2022-12-01`,
            context.environment.resourceManager
        );
        const response = await client.sendRequest(createPipelineRequest({
            url: url.href,
            method: "GET",
            ...(signal ? { abortSignal: signal } : {}),
        }));
        context.assertActive();
        if (signal?.aborted) throw new AuthError("cancelled", "The read-only request was cancelled.");
        if (response.status !== 200) throw new AuthError("http-error", "The read-only ARM request failed.");
        return JSON.parse(response.bodyAsText);
    } catch (error) {
        if (error instanceof AuthError) throw error;
        if (signal?.aborted || error?.name === "AbortError") {
            throw new AuthError("cancelled", "The read-only request was cancelled.");
        }
        throw new AuthError("request-failed", "The read-only ARM request could not complete.");
    }
}

if (isMain(import.meta.url)) {
    const read = process.argv.includes("--optional-arm") ? readWithOptionalArm : readWithSdk;
    await runReadOnly(read).catch(reportFailure);
}
