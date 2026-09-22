import { createRequire as __canvasCreateRequire } from "node:module";
const require = __canvasCreateRequire(import.meta.url);

// packages/canvas-toolkit/src/icons.mjs
var GENERIC_ICON = "Generic";
var BY_TYPE = {
  "microsoft.app/containerapps": "ContainerApps",
  "microsoft.app/managedenvironments": "ContainerAppsEnvironment",
  "microsoft.appconfiguration/configurationstores": "Generic",
  "microsoft.cache/redis": "CacheRedis",
  "microsoft.cdn/profiles": "FrontDoorAndCdnProfiles",
  "microsoft.compute/availabilitysets": "AvailabilitySets",
  "microsoft.compute/disks": "Disks",
  "microsoft.compute/images": "Images",
  "microsoft.compute/virtualmachines": "VirtualMachines",
  "microsoft.compute/virtualmachinescalesets": "VirtualMachineScaleSets",
  "microsoft.containerregistry/registries": "ContainerRegistry",
  "microsoft.containerservice/managedclusters": "ContainerServiceManagedClusters",
  "microsoft.dbformysql/servers": "MysqlServers",
  "microsoft.dbforpostgresql/flexibleservers": "PostgresqlServersFlexible",
  "microsoft.dbforpostgresql/servers": "PostgresqlServersStandard",
  "microsoft.devices/iothubs": "DeviceIotHubs",
  "microsoft.devtestlab/labs": "DevTestLabs",
  "microsoft.durabletask/schedulers": "DurableTaskScheduler",
  "microsoft.eventgrid/domains": "EventGridDomains",
  "microsoft.eventgrid/eventsubscriptions": "EventGridEventSubscriptions",
  "microsoft.eventgrid/topics": "EventGridTopics",
  "microsoft.eventhub/namespaces": "EventHubNamespaces",
  "microsoft.insights/components": "ApplicationInsights",
  "microsoft.keyvault/vaults": "KeyVaults",
  "microsoft.kubernetes/connectedclusters": "KubernetesConnectedClusters",
  "microsoft.logic/workflows": "LogicWorkflows",
  "microsoft.managedidentity/userassignedidentities": "ManagedIdentityUserAssignedIdentities",
  "microsoft.network/applicationgateways": "NetworkApplicationGateways",
  "microsoft.network/applicationsecuritygroups": "NetworkApplicationSecurityGroups",
  "microsoft.network/loadbalancers": "LoadBalancers",
  "microsoft.network/localnetworkgateways": "NetworkLocalNetworkGateways",
  "microsoft.network/networkinterfaces": "NetworkInterfaces",
  "microsoft.network/networksecuritygroups": "NetworkSecurityGroups",
  "microsoft.network/networkwatchers": "NetworkWatchers",
  "microsoft.network/publicipaddresses": "PublicIpAddresses",
  "microsoft.network/publicipprefixes": "NetworkPublicIpPrefixes",
  "microsoft.network/routetables": "NetworkRouteTables",
  "microsoft.network/virtualnetworkgateways": "NetworkVirtualNetworkGateways",
  "microsoft.network/virtualnetworks": "VirtualNetworks",
  "microsoft.notificationhubs/namespaces": "NotificationHubNamespaces",
  "microsoft.operationalinsights/workspaces": "OperationalInsightsWorkspaces",
  "microsoft.operationsmanagement/solutions": "OperationsManagementSolutions",
  "microsoft.servicebus/namespaces": "ServiceBusNamespaces",
  "microsoft.servicefabric/clusters": "ServiceFabricClusters",
  "microsoft.servicefabricmesh/applications": "ServiceFabricMeshApplications",
  "microsoft.signalrservice/signalr": "SignalRService",
  "microsoft.signalrservice/webpubsub": "WebPubSub",
  "microsoft.sql/servers": "SqlServers",
  "microsoft.sql/servers/databases": "SqlDatabases",
  "microsoft.storage/storageaccounts": "StorageAccounts",
  "microsoft.web/hostingenvironments": "WebHostingEnvironments",
  "microsoft.web/kubeenvironments": "AppServiceKubernetesEnvironment",
  "microsoft.web/serverfarms": "AppServicePlans",
  "microsoft.web/staticsites": "StaticWebApps",
  "microsoft.apimanagement/service": "ApiManagementService",
  "microsoft.batch/batchaccounts": "BatchAccounts",
  "microsoft.documentdb/mongoclusters": "MongoClusters",
  "microsoft.extendedlocation/customlocations": "Customlocations",
  "microsoft.hybridcompute/machines": "ArcEnabledMachines",
  "microsoft.resources/subscriptions": "Subscription",
  "microsoft.resources/resourcegroups": "ResourceGroup",
  "microsoft.appplatform/spring": "SpringApps"
};
function iconForType(type, kind = "") {
  const t = String(type ?? "").toLowerCase();
  const k = String(kind ?? "").toLowerCase();
  if (t === "microsoft.web/sites") {
    if (k.includes("functionapp") && k.includes("workflowapp")) return "LogicApp";
    if (k.includes("functionapp")) return "FunctionApp";
    return "AppServices";
  }
  if (t === "microsoft.machinelearningservices/workspaces") {
    return k.includes("project") ? "AiFoundry" : "Generic";
  }
  if (t === "microsoft.documentdb/databaseaccounts") {
    return k.includes("mongodb") ? "AzureCosmosDbForMongoDbRu" : "AzureCosmosDb";
  }
  return Object.hasOwn(BY_TYPE, t) ? BY_TYPE[t] : GENERIC_ICON;
}
var keys = /* @__PURE__ */ new Set([
  ...Object.values(BY_TYPE),
  "FunctionApp",
  "LogicApp",
  "AppServices",
  "AiFoundry",
  "AzureCosmosDbForMongoDbRu",
  "AzureCosmosDb",
  "AzureDocumentDb",
  "DurableTaskHub"
]);
var azureIconAssets = new Map([...keys].map((key) => [
  `icons/${key}.svg`,
  [new URL(`./icons/${key}.svg`, import.meta.url), "image/svg+xml"]
]));
export {
  BY_TYPE,
  GENERIC_ICON,
  azureIconAssets,
  iconForType
};
