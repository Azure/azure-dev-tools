import { pathToFileURL } from "node:url";
import { createAzureAuthSession } from "@microsoft/canvas-toolkit/auth";

export function isMain(metaUrl) {
    return Boolean(process.argv[1]) && metaUrl === pathToFileURL(process.argv[1]).href;
}

/** No CLI discovery, token requests, or sign-in unless explicitly invoked. */
export async function runReadOnly(read) {
    const args = process.argv.slice(2);
    if (!args.includes("--run")) {
        console.log("Opt-in only: --run --subscription <id> --tenant <id> --cloud <AzureCloud|AzureUSGovernment|AzureChinaCloud>");
        return;
    }
    const value = (flag) => {
        const index = args.indexOf(flag);
        return index < 0 ? undefined : args[index + 1];
    };
    const subscriptionId = value("--subscription");
    const tenantId = value("--tenant");
    const cloud = value("--cloud");
    if (!subscriptionId || !tenantId || !["AzureCloud", "AzureUSGovernment", "AzureChinaCloud"].includes(cloud)) {
        throw new Error("Explicit subscription, tenant, and supported cloud arguments are required.");
    }
    const auth = createAzureAuthSession();
    try {
        await auth.reloadProfile();
        const context = auth.bindSubscription({ subscriptionId, tenantId, cloud });
        await read(context, { signal: AbortSignal.timeout(30_000) });
        console.log("Read-only ARM request completed. No resource details or credentials are printed.");
    } finally {
        auth.dispose();
    }
}

export function reportFailure() {
    // Even unexpected third-party failures can contain request headers or settings.
    console.error("The read-only example failed. Check the explicit scope, existing CLI sign-in, and network access.");
    process.exitCode = 1;
}
