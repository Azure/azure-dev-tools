import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function enforceIdentityOnlyDeploymentTemplate(projectDir) {
	const mainFile = path.join(projectDir, "infra", "main.bicep");
	const apiFile = path.join(projectDir, "infra", "app", "api.bicep");
	const foundryFile = path.join(projectDir, "infra", "app", "foundry.bicep");
	const [mainSource, apiSource, foundrySource] = await Promise.all([
		readFile(mainFile, "utf8"),
		readFile(apiFile, "utf8"),
		readFile(foundryFile, "utf8"),
	]);

	const mainNext = (() => {
		let next = mainSource;
		if (!/allowSharedKeyAccess:\s*false\b/.test(next)) {
			if (!/allowSharedKeyAccess:\s*true\b/.test(next)) {
				throw new Error("Deployment template does not declare the Storage shared-key policy; refusing to guess.");
			}
			next = next.replace(/allowSharedKeyAccess:\s*true\b/, "allowSharedKeyAccess: false");
		}
		if (
			/AZURE_FUNCTIONS_AGENTS_PROVIDER:\s*'foundry'/.test(next) &&
			/FOUNDRY_MODEL:\s*foundry\.outputs\.modelDeploymentName/.test(next) &&
			!/\bAZURE_FUNCTIONS_AGENTS_MODEL:/.test(next)
		) {
			next = next.replace(
				/(\s+)FOUNDRY_MODEL:\s*foundry\.outputs\.modelDeploymentName/,
				"$&$1AZURE_FUNCTIONS_AGENTS_MODEL: foundry.outputs.modelDeploymentName",
			);
		}
		if (
			/AZURE_FUNCTIONS_AGENTS_PROVIDER:\s*'foundry'/.test(next) &&
			!/\bAZURE_FUNCTIONS_AGENTS_MODEL:/.test(next)
		) {
			throw new Error("Deployment template does not expose the hosted-agent model setting; refusing to guess.");
		}
		return next;
	})();

	const apiNext = (() => {
		const directOptionalEndpoints =
			/^\s*AzureWebJobsStorage__(?:queue|table|file)ServiceUri:\s*stg\.properties\.primaryEndpoints\.(?:queue|table|file)\s*$/gm;
		const next = apiSource.replace(directOptionalEndpoints, "");
		if (
			/AzureWebJobsStorage__(?:queue|table|file)ServiceUri/.test(next) &&
			!(
				/param enableQueue bool = false/.test(next) &&
				/param enableTable bool = false/.test(next) &&
				/param enableFile bool = false/.test(next)
			)
		) {
			throw new Error("Deployment template exposes unrecognized optional host-storage settings; refusing to guess.");
		}
		return next;
	})();

	const foundryNext = (() => {
		const accountProperties =
			/(resource\s+foundryAccount\s+'Microsoft\.CognitiveServices\/accounts@[^'\r\n]+'\s*=\s*\{[\s\S]*?\r?\n)([ \t]*properties:\s*\{)(\r?\n)/;
		const supportedAccount =
			accountProperties.test(foundrySource) &&
			/kind:\s*'AIServices'/.test(foundrySource) &&
			/allowProjectManagement:\s*true\b/.test(foundrySource) &&
			/customSubDomainName:\s*accountName\b/.test(foundrySource);
		const supportedModel =
			/resource\s+foundryModelDeployments?\s+'Microsoft\.CognitiveServices\/accounts\/deployments@[^'\r\n]+'/.test(
				foundrySource,
			) &&
			/parent:\s*foundryAccount\b/.test(foundrySource) &&
			/output\s+modelDeploymentName\s+string\s*=\s*foundryModelDeployments?(?:\[[^\]\r\n]+\])?\.name\b/.test(
				foundrySource,
			);
		if (!supportedAccount || !supportedModel) {
			throw new Error("Deployment template does not expose Foundry account properties; refusing to guess.");
		}
		if (/disableLocalAuth:\s*true\b/.test(foundrySource)) return foundrySource;
		if (/disableLocalAuth:\s*false\b/.test(foundrySource)) {
			return foundrySource.replace(/disableLocalAuth:\s*false\b/, "disableLocalAuth: true");
		}
		return foundrySource.replace(
			accountProperties,
			(_match, prefix, propertiesLine, eol) =>
				`${prefix}${propertiesLine}${eol}${propertiesLine.match(/^[ \t]*/)[0]}  disableLocalAuth: true${eol}`,
		);
	})();

	await Promise.all([
		mainNext === mainSource ? undefined : writeFile(mainFile, mainNext),
		apiNext === apiSource ? undefined : writeFile(apiFile, apiNext),
		foundryNext === foundrySource ? undefined : writeFile(foundryFile, foundryNext),
	]);
}
