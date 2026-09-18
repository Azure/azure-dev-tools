export function normalizeAzureSubscriptions(rows) {
	const subscriptions = (Array.isArray(rows) ? rows : []).map((subscription) => ({
		id: String(subscription?.id || ""),
		name: String(subscription?.name || ""),
		tenantId: String(subscription?.tenantId || ""),
		isDefault: Boolean(subscription?.isDefault),
	}));
	subscriptions.sort((left, right) => (left.isDefault === right.isDefault ? 0 : left.isDefault ? -1 : 1));
	return subscriptions;
}

export function applyAzureSubscriptionInventory(azure, subscriptions) {
	const previousSubscription = azure.subscription;
	azure.subscriptions = subscriptions.map((subscription) => ({ ...subscription }));
	const selected =
		azure.subscriptions.find((subscription) => subscription.id === previousSubscription) ||
		azure.subscriptions.find((subscription) => subscription.isDefault) ||
		azure.subscriptions[0] ||
		null;
	azure.subscription = selected?.id || "";
	azure.tenantId = selected?.tenantId || "";
	azure.subscriptionsError = "";
	return {
		changed: previousSubscription !== azure.subscription,
		selected: selected ? { ...selected } : null,
	};
}

export function isAzureSubscriptionRequestCurrent(azure, request) {
	return azure.subscriptionsGeneration === request?.generation;
}

export function isAzureFunctionAppsRequestCurrent(azure, request) {
	return (
		azure.appsGeneration === request?.generation &&
		azure.subscription === request?.subscription &&
		(!request?.subscriptionRequest ||
			isAzureSubscriptionRequestCurrent(azure, request.subscriptionRequest))
	);
}

export function loadAzureFunctionAppInventory(
	azure,
	{ subscriptionRequest = null, load, apply, fail, stale },
) {
	const request = {
		subscription: azure.subscription,
		subscriptionRequest,
		generation: (azure.appsGeneration || 0) + 1,
	};
	azure.appsGeneration = request.generation;

	return Promise.resolve()
		.then(() => load(request.subscription, request))
		.then(
			(apps) =>
				isAzureFunctionAppsRequestCurrent(azure, request)
					? apply(apps, request)
					: stale?.(null, request),
			(error) =>
				isAzureFunctionAppsRequestCurrent(azure, request)
					? fail(error, request)
					: stale?.(error, request),
		);
}

export function hydrateAzureSubscriptionInventory(
	azure,
	{ force = false, loadApps = true, load, apply, fail },
) {
	const active = azure.subscriptionsRequest;
	if (active && (!force || active.force)) {
		active.loadApps ||= loadApps;
		return active.promise;
	}

	const request = {
		force,
		loadApps: Boolean(loadApps || active?.loadApps),
		generation: (azure.subscriptionsGeneration || 0) + 1,
		promise: null,
	};
	azure.subscriptionsGeneration = request.generation;

	const followLatestRequest = () => {
		const latest = azure.subscriptionsRequest;
		return latest && latest !== request ? latest.promise : undefined;
	};

	request.promise = Promise.resolve()
		.then(() => load(request.force))
		.then(
			async (inventory) => {
				if (!isAzureSubscriptionRequestCurrent(azure, request)) return followLatestRequest();
				const result = await apply(inventory, request);
				return isAzureSubscriptionRequestCurrent(azure, request) ? result : followLatestRequest();
			},
			async (error) => {
				if (!isAzureSubscriptionRequestCurrent(azure, request)) return followLatestRequest();
				const result = await fail(error, request);
				return isAzureSubscriptionRequestCurrent(azure, request) ? result : followLatestRequest();
			},
		)
		.finally(() => {
			if (azure.subscriptionsRequest === request) azure.subscriptionsRequest = null;
		});
	azure.subscriptionsRequest = request;
	return request.promise;
}
