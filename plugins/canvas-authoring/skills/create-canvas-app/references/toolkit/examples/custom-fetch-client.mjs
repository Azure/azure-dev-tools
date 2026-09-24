import { AuthError } from "@microsoft/canvas-toolkit/auth";
import { isMain, reportFailure, runReadOnly } from "./run-read-only.mjs";

/** A real custom fetch client, not a toolkit HTTP wrapper. */
export function createCustomArmReader(context, fetchImpl = globalThis.fetch) {
    const getToken = context.getBearerTokenProvider(
        `${context.environment.armResource}/.default`
    );
    return {
        async readSubscription({ signal } = {}) {
            context.assertActive();
            if (!context.subscriptionId) throw new AuthError("invalid-context", "Bind a subscription for this example.");
            const url = new URL(
                `/subscriptions/${encodeURIComponent(context.subscriptionId)}?api-version=2022-12-01`,
                context.environment.resourceManager
            );
            try {
                const token = await getToken({ signal });
                context.assertActive();
                if (signal?.aborted) throw new AuthError("cancelled", "The read-only request was cancelled.");
                const response = await fetchImpl(url, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                    redirect: "error",
                    signal,
                });
                context.assertActive();
                if (!response.ok) throw new AuthError("http-error", "The read-only ARM request failed.");
                const body = await response.json();
                context.assertActive();
                if (signal?.aborted) throw new AuthError("cancelled", "The read-only request was cancelled.");
                return body;
            } catch (error) {
                if (error instanceof AuthError) throw error;
                if (signal?.aborted || error?.name === "AbortError") {
                    throw new AuthError("cancelled", "The read-only request was cancelled.");
                }
                throw new AuthError("request-failed", "The read-only ARM request could not complete.");
            }
        },
    };
}

if (isMain(import.meta.url)) {
    await runReadOnly((context, options) => createCustomArmReader(context).readSubscription(options)).catch(reportFailure);
}
