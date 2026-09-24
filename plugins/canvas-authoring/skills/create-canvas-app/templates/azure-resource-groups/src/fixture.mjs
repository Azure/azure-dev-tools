import { setTimeout as delay } from "node:timers/promises";
import { createHttpHeaders } from "@azure/core-rest-pipeline";
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

export const selection = {
    subscriptionId: "11111111-1111-1111-1111-111111111111",
    tenantId: "22222222-2222-2222-2222-222222222222",
    cloud: "AzureCloud",
};

export function createFixture({ scenario = "success", delayMs = 50 } = {}) {
    const accountName = "builder@example.invalid";
    const auth = createAzureAuthSession({ source: {
        kind: "credential",
        context: { tenantId: selection.tenantId, cloud: selection.cloud, accountName, identityKey: accountName },
        credential: { async getToken() {
            return { token: "synthetic-not-a-real-credential", expiresOnTimestamp: Date.now() + 3600000 };
        } },
        subscriptions: [{
            id: selection.subscriptionId, name: "Synthetic learning subscription",
            tenantId: selection.tenantId, tenantName: "Synthetic tenant",
            cloud: selection.cloud, accountName, isDefault: true, state: "Enabled",
        }],
    } });
    const stats = { requests: 0 };
    const httpClient = {
        async sendRequest(request) {
            stats.requests++;
            const expected = `https://management.azure.com/subscriptions/${selection.subscriptionId}/resourcegroups?api-version=2021-04-01`;
            if (request.method !== "GET" || request.url !== expected) throw new Error("Unexpected fixture request.");
            await delay(delayMs, undefined, { signal: request.abortSignal });
            const value = scenario === "empty" ? [] : ["sample-app", "sample-data", "sample-monitoring"].map(name => ({
                id: `/subscriptions/${selection.subscriptionId}/resourceGroups/${name}`,
                name, location: "westus", tags: { omitted: "not part of the projected result" },
            }));
            return { request, status: scenario === "error" ? 403 : 200, headers: createHttpHeaders(),
                bodyAsText: JSON.stringify(scenario === "error" ? { error: { code: "AuthorizationFailed", message: "Synthetic access denial." } } : { value }) };
        },
    };
    return { auth, httpClient, stats };
}
