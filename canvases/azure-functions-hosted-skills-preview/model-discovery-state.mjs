function selectionIdentity(binding) {
	return {
		subscription: String(binding.subscription || ""),
		source: binding.source === "gateway" ? "gateway" : "foundry",
		resourceId: String(binding.resourceId || ""),
		modelId: String(binding.modelId || ""),
		selectionGeneration: Number(binding.selectionGeneration || 0),
	};
}

export function beginModelDiscovery(binding, subscription) {
	const requestedSubscription = String(subscription || "");
	if (binding.subscription !== requestedSubscription) {
		binding.subscription = requestedSubscription;
		binding.resourceId = "";
		binding.modelId = "";
		binding.selectionGeneration = Number(binding.selectionGeneration || 0) + 1;
	}
	const request = {
		...selectionIdentity(binding),
		generation: Number(binding.discoveryGeneration || 0) + 1,
	};
	binding.discoveryGeneration = request.generation;
	binding.discoveryRequest = request;
	return request;
}

export function markModelSelection(binding, { source, resourceId, modelId }) {
	const next = {
		source: source === "gateway" ? "gateway" : "foundry",
		resourceId: String(resourceId || ""),
		modelId: String(modelId || ""),
	};
	const changed =
		binding.source !== next.source ||
		binding.resourceId !== next.resourceId ||
		binding.modelId !== next.modelId;
	binding.source = next.source;
	binding.resourceId = next.resourceId;
	binding.modelId = next.modelId;
	if (changed) {
		binding.selectionGeneration = Number(binding.selectionGeneration || 0) + 1;
		binding.discoveryGeneration = Number(binding.discoveryGeneration || 0) + 1;
		binding.discoveryRequest = null;
	}
	return changed;
}

export function isModelDiscoveryCurrent(binding, request) {
	if (!request || binding.discoveryRequest?.generation !== request.generation) return false;
	const current = selectionIdentity(binding);
	return (
		current.subscription === request.subscription &&
		current.source === request.source &&
		current.resourceId === request.resourceId &&
		current.modelId === request.modelId &&
		current.selectionGeneration === request.selectionGeneration
	);
}
