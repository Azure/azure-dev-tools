import { AuthError } from "@microsoft/canvas-toolkit/auth";
import { listArm } from "@microsoft/canvas-toolkit/azure";

/** A bounded, read-only lesson; the calling app owns auth, scope, state and cancellation. */
export async function readResourceGroups(context, { signal, httpClient } = {}) {
    context.assertActive();
    if (!context.subscriptionId) {
        throw new AuthError("invalid-context", "Select a subscription before listing resource groups.");
    }
    const path = `/subscriptions/${encodeURIComponent(context.subscriptionId)}/resourcegroups?api-version=2021-04-01`;
    const groups = [];
    for await (const group of listArm(context, path, { signal, httpClient, maxPages: 10 })) {
        if (!group || ["id", "name", "location"].some(key => typeof group[key] !== "string" || !group[key])) {
            throw new AuthError("invalid-response", "Azure returned an invalid resource group.");
        }
        if (groups.length === 200) {
            throw new AuthError("result-limit", "This example supports up to 200 resource groups. Use a paged view for larger inventories.");
        }
        groups.push({ id: group.id, name: group.name, location: group.location });
    }
    context.assertActive();
    return groups;
}
