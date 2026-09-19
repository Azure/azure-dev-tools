// Shared renderer for Azure Functions Hosted Skills Preview canvas variants.
// Feature profiles define the capability boundary for later host-specific views.

import { COMMAND_CSS, ICONS, commandClientScript } from "./studio-commands.mjs";

export const HOSTED_SKILLS_RENDERER_FEATURES = Object.freeze([
	"doctor",
	"sourceWorkspace",
	"modelBinding",
	"modelCreation",
	"localRuntime",
	"functionDiscovery",
	"triggerInvocation",
	"deployment",
	"applicationInsights",
	"liveTelemetry",
	"loadTest",
	"activityLog",
	"azureExistingApp",
	"githubSession",
	"aiGateway",
	"connectorTrigger",
	"deploymentPreflight",
]);

export const FULL_HOSTED_SKILLS_FEATURE_PROFILE = Object.freeze(
	Object.fromEntries(HOSTED_SKILLS_RENDERER_FEATURES.map(feature => [feature, true])),
);

export const PUBLIC_HOSTED_SKILLS_FEATURE_PROFILE = Object.freeze({
	doctor: true,
	sourceWorkspace: true,
	modelBinding: true,
	modelCreation: true,
	localRuntime: true,
	functionDiscovery: false,
	triggerInvocation: true,
	deployment: false,
	applicationInsights: false,
	liveTelemetry: false,
	loadTest: false,
	activityLog: true,
	azureExistingApp: false,
	githubSession: false,
	aiGateway: false,
	connectorTrigger: false,
	deploymentPreflight: true,
});

function retainedHostedSkillsClient() {
	return String.raw`(() => {
  const $ = (id) => document.getElementById(id);
  let state;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  const post = async (url, body = {}) => {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    $('status').textContent = result.message || (result.ok ? '' : 'Request failed.');
    return result;
  };
  function render(next) {
    state = next;
    const doctor = next.doctor;
    $('doctor-tag').textContent = next.doctorRunning ? 'checking…' : doctor ? (doctor.ready ? 'ready' : 'action needed') : 'not checked';
    $('doctor-list').innerHTML = doctor ? doctor.checks.map((check) => '<div class="doctor-row ' + (check.status === 'ready' ? 'ok' : 'err') + '"><strong>' + esc(check.label) + '</strong><div class="doctor-detail">' + esc(check.detail) + '</div></div>').join('') : '';
    const source = next.sourceWorkspace || {};
    $('source-workspace-tag').textContent = source.materialized ? 'ready' : 'not created';
    $('source-workspace-note').textContent = source.error || (source.materialized ? 'Local workspace is ready.' : 'Choose a relative local folder and create the bundled starter.');
    $('source-path-display').textContent = source.destination || source.relativePath || 'Choose a local folder';
    if (document.activeElement !== $('source-relative-path')) $('source-relative-path').value = source.relativePath || '';
    const binding = next.modelBinding || {};
    $('model-subscription').innerHTML = (next.azure?.subscriptions || []).map((item) => '<option value="' + esc(item.id) + '">' + esc(item.name) + '</option>').join('') || '<option value="">No enabled subscriptions found</option>';
    $('model-subscription').value = binding.subscription || next.azure?.subscription || '';
    $('model-source').value = 'foundry';
    $('model-resource').innerHTML = (binding.foundry || []).map((item) => '<option value="' + esc(item.id) + '">' + esc(item.label) + '</option>').join('') || '<option value="">No Foundry projects discovered</option>';
    $('model-resource').value = binding.resourceId || '';
    const resource = (binding.foundry || []).find((item) => item.id === binding.resourceId) || (binding.foundry || [])[0];
    $('model-model').innerHTML = (resource?.models || []).map((item) => '<option value="' + esc(item.id) + '">' + esc(item.label) + '</option>').join('') || '<option value="">No deployed models</option>';
    $('model-model').value = binding.modelId || '';
    $('model-binding-tag').textContent = binding.loading ? 'discovering' : binding.configured ? 'ready' : (binding.readiness?.state || 'select model').replace(/-/g, ' ');
    const subscription = (next.azure?.subscriptions || []).find((item) => item.id === (binding.subscription || next.azure?.subscription));
    const activeResource = (binding.foundry || []).find((item) => item.id === binding.activeResourceId);
    const activeModel = activeResource?.models?.find((item) => item.id === binding.activeModelId);
    $('model-summary-detail').textContent = binding.configured
      ? [subscription?.name, activeResource?.label, activeModel?.label || binding.activeModelId].filter(Boolean).join(' · ')
      : binding.error || binding.readiness?.message || binding.status || binding.activeLabel || 'Choose a Microsoft Foundry model.';
    $('model-status').textContent = binding.error || binding.status || binding.activeLabel || '';
    $('model-refresh').disabled = Boolean(binding.loading);
    const create = next.modelCreate || {};
    $('model-create-resources').innerHTML = (create.resources || []).map((item) => '<li><strong>' + esc(item.kind) + '</strong>: ' + esc(item.note) + '</li>').join('') || '<li>Plan loading...</li>';
    $('model-create-alternatives').textContent = (create.alternatives || []).join(' ');
    $('model-create-confirm').disabled = Boolean(create.running);
    $('model-create-status').textContent = create.running ? 'Creating Foundry models...' : (create.message || '');
    $('local-log-tag').textContent = next.local.status + (next.local.port ? ' · :' + next.local.port : '');
    $('local-note').textContent = next.local.error || '';
    $('local-log').textContent = (next.local.logTail || []).join('\n');
    $('skill-name').textContent = next.hero?.title || 'Skill';
    $('prompt-preview').textContent = next.prompt || '';
    const invocations = next.invocations || [];
    $('inv-total').textContent = invocations.length + ' event' + (invocations.length === 1 ? '' : 's');
    $('inv-list').innerHTML = invocations.length ? invocations.map((item) => '<div class="invocation ' + (item.ok ? 'ok' : 'bad') + '"><div class="inv-note">' + esc(item.note) + '</div></div>').join('') : '<div class="empty">Waiting for local trigger activity.</div>';
    const latest = invocations.at(-1);
    $('digest-panel').classList.toggle('show', Boolean(latest?.response));
    $('digest-body').textContent = latest?.response || '';
    $('digest-meta').textContent = latest?.note || '';
  }
  $('doctor-toggle').addEventListener('click', () => { const panel = $('doctor-panel'); panel.hidden = !panel.hidden; });
  $('doctor-run').addEventListener('click', () => post('/doctor/run'));
  $('source-customize').addEventListener('click', () => { $('source-path-editor').hidden = false; $('source-create').hidden = false; });
  $('source-create').addEventListener('click', () => post('/source/create', { mode: 'current', relativePath: $('source-relative-path').value || '' }));
  $('target-local').addEventListener('click', () => state?.sourceWorkspace?.materialized ? Promise.resolve({ ok: true }) : post('/source/create', { mode: 'current', relativePath: state?.sourceWorkspace?.relativePath || $('source-relative-path').value || '' }));
  $('model-subscription').addEventListener('change', () => post('/models/select-subscription', { subscription: $('model-subscription').value }));
  $('model-source').addEventListener('change', () => post('/models/select-source', { source: 'foundry' }));
  $('model-resource').addEventListener('change', () => {
    const resource = (state?.modelBinding?.foundry || []).find((item) => item.id === $('model-resource').value);
    post('/models/select-choice', { resourceId: $('model-resource').value, modelId: resource?.models?.[0]?.id || '' });
  });
  $('model-model').addEventListener('change', () => post('/models/select-choice', { resourceId: $('model-resource').value, modelId: $('model-model').value }));
  $('model-refresh').addEventListener('click', () => post('/models/refresh'));
  $('model-mode-existing').addEventListener('click', () => { $('model-existing-view').style.display = ''; $('model-create-view').hidden = true; });
  $('model-mode-create').addEventListener('click', () => { $('model-existing-view').style.display = 'none'; $('model-create-view').hidden = false; post('/models/create-plan'); });
  $('model-create-confirm').addEventListener('click', () => post('/models/create', { confirm: true }));
  $('open-vscode').addEventListener('click', () => post('/open-vscode'));
  $('edit-instructions').addEventListener('click', () => post('/edit-instructions-vscode'));
  $('local-toggle').addEventListener('click', () => post(state?.local?.status === 'running' ? '/local/stop' : '/local/start'));
  $('invoke').addEventListener('click', () => post('/invoke', { prompt: $('trigger-test-input').value || '' }));
  $('clear-invocations').addEventListener('click', () => post('/clear'));
  $('deployment-preflight').addEventListener('click', () => post('/deployment/prepare'));
  const events = new EventSource('/events');
  events.addEventListener('state', (event) => render(JSON.parse(event.data)));
  events.onerror = () => { $('status').textContent = 'Waiting for runtime state…'; };
})();`;
}

export function createHostedSkillsRendererProfile({
	documentationUrl,
	minPythonLabel,
	rendererVersion,
	rendererRevision,
	pluginId,
	features = FULL_HOSTED_SKILLS_FEATURE_PROFILE,
}) {
	for (const feature of HOSTED_SKILLS_RENDERER_FEATURES) {
		if (typeof features[feature] !== "boolean") {
			throw new TypeError(`Renderer feature profile must define ${feature}.`);
		}
	}
	return Object.freeze({
		documentationUrl,
		minPythonLabel,
		rendererVersion,
		rendererRevision,
		pluginId,
		features: Object.freeze(Object.fromEntries(HOSTED_SKILLS_RENDERER_FEATURES.map(feature => [feature, features[feature]]))),
	});
}

export function renderHostedSkillsHtml(profile) {
	const {
		documentationUrl: DOC_URL,
		minPythonLabel: MIN_PYTHON_LABEL,
		rendererVersion: STUDIO_VERSION,
		rendererRevision: STUDIO_REVISION,
		pluginId: PLUGIN_ID,
	} = profile;
	const enabled = (feature) => profile?.features?.[feature] === true;
	const withAzureExistingApp = enabled("azureExistingApp") && enabled("functionDiscovery");
	const withGitHubSession = enabled("githubSession");
	const withAiGateway = enabled("aiGateway");
	const withModelCreation = enabled("modelCreation");
	const withDeployment = enabled("deployment");
	const withTelemetry = enabled("applicationInsights") && enabled("liveTelemetry");
	const withLoadTest = enabled("loadTest");
	const withDeploymentPreflight = enabled("deploymentPreflight");
	const withFullClient = HOSTED_SKILLS_RENDERER_FEATURES.every(enabled);
	const displayName = "Azure Functions Hosted Skills Preview";
	const feedbackUrl =
		"https://github.com/microsoft/azure-dev-tools/issues/new" +
		`?title=${encodeURIComponent(`${displayName} feedback`)}` +
		`&body=${encodeURIComponent(
			`Product: ${displayName}\nCanvas: ${PLUGIN_ID}\nVersion: ${STUDIO_VERSION}\nRevision: ${STUDIO_REVISION}\n\n## Feedback\n\n`,
		)}`;
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${displayName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffffff; --panel: #f7f6fb; --line: #e6e3f0;
    --ink: #1b1a24; --muted: #6a6775; --accent: #6b3fd6; --accent2: #7b52e0;
    --ok: #0f9d6e; --warn: #b45309; --bad: #dc2626;
  }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: radial-gradient(1200px 600px at 100% -12%, rgba(107,63,214,0.05), transparent), var(--bg);
    color: var(--ink); min-height: 100vh; padding: 1.75rem 1.5rem 2.5rem;
  }
  .wrap { max-width: 840px; margin: 0 auto; }
  .topline { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-bottom: .9rem; }
  .badge {
    display: inline-block; font-size: 11px; letter-spacing: .6px; text-transform: uppercase;
    color: var(--accent2); border: 1px solid rgba(139,92,246,.35); border-radius: 999px; padding: 3px 10px;
  }
  .tag { display: inline-block; font-size: .72rem; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; background: var(--panel); }
  button.tag { cursor: pointer; font: inherit; display: inline-flex; align-items: center; gap: 4px; }
  button.tag svg { width: 12px; height: 12px; flex: 0 0 auto; }
  button.tag:hover { color: var(--ink); border-color: var(--accent); }
  h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -.01em; }
  .sub { color: var(--muted); margin-top: .35rem; font-size: .92rem; line-height: 1.55; }
  .sub a { color: var(--accent2); text-decoration: none; }
  .sub a:hover { text-decoration: underline; }
  h2.sec { font-size: .74rem; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); margin: 1.4rem 0 .5rem; }

  .controls { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; margin: .6rem 0; }
  .seg { display: inline-flex; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .seg button { background: transparent; color: var(--muted); border: none; padding: 7px 14px; font-size: .8rem; font-weight: 600; cursor: pointer; }
  .seg button.on { background: var(--accent); color: #fff; }
  .controls select, .controls input[type=text] {
    background: var(--panel); color: var(--ink); border: 1px solid var(--line);
    border-radius: 9px; padding: 7px 10px; font: inherit; font-size: .8rem; max-width: 300px;
  }
  .inline-note { font-size: .78rem; color: var(--muted); line-height: 1.5; }
  .inline-note.err { color: var(--bad); }
  .inline-note.warn { color: var(--warn, #d9a441); }
  .inline-note code { background: var(--panel); border: 1px solid var(--line); border-radius: 5px; padding: 1px 5px; }
  .btn.warn-outline { border: 1px solid var(--warn, #d9a441); }

  .chips { display: flex; flex-wrap: wrap; gap: .4rem; margin: .3rem 0 .8rem; }
  .trig { font-size: .76rem; font-weight: 600; border-radius: 999px; padding: 5px 12px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); cursor: pointer; }
  .trig.on { background: var(--accent); color: #fff; border-color: var(--accent); }
  .trig.nyi { cursor: not-allowed; opacity: .55; }
  .trig .nyi-tag { font-size: .6rem; margin-left: 5px; text-transform: uppercase; letter-spacing: .3px; }
  .timer-schedule { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; margin: -.35rem 0 1rem; color: var(--muted); font-size: .8rem; }
  .timer-schedule select, .timer-schedule input {
    background: var(--panel); color: var(--ink); border: 1px solid var(--line);
    border-radius: 8px; padding: 5px 8px; font: inherit; font-size: .78rem;
  }
  .timer-schedule input[type=time] { width: 112px; }
  .timer-schedule input[type=number] { width: 62px; }
  .timer-fields { display: inline-flex; align-items: center; gap: .45rem; }
  .timer-fields[hidden] { display: none; }
  .timer-schedule .schedule-status { font-size: .72rem; }
  .timer-schedule .schedule-status.err { color: var(--bad); }

  .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; margin-bottom: 1rem; }
  .panel h3 {
    font-size: .74rem; text-transform: uppercase; letter-spacing: .6px; color: var(--muted);
    padding: .8rem 1rem; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;
  }
  .panel .body { padding: .85rem 1rem; }
  .list { max-height: 280px; overflow-y: auto; }
  .row { display: flex; gap: .75rem; padding: .65rem 1rem; border-bottom: 1px solid var(--line); align-items: flex-start; }
  .row:last-child { border-bottom: none; }
  .row .tagcol {
    flex: 0 0 auto; font-size: .66rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
    color: var(--accent2); border: 1px solid rgba(123,82,224,.3); border-radius: 6px; padding: 3px 7px; height: fit-content; white-space: nowrap;
  }
  .row .tagcol.bad { color: var(--bad); border-color: rgba(220,38,38,.35); }
  .row .tagcol.ok { color: var(--ok); border-color: rgba(15,157,110,.35); }
  .row .meta { min-width: 0; }
  .row .meta .s { font-size: .85rem; overflow-wrap: anywhere; }
  .row .meta .t { font-size: .7rem; color: var(--muted); margin-top: 2px; }
  .empty { padding: 1.2rem 1rem; color: var(--muted); font-size: .84rem; font-style: italic; text-align: center; }

  .cmdlog {
    margin: 0 0 1rem; border: 1px solid var(--line); border-radius: 12px;
    background: var(--panel); overflow: hidden;
  }
  .cmdlog > summary {
    cursor: pointer; padding: .7rem .9rem; font-size: .82rem; font-weight: 650;
    display: flex; align-items: center; gap: .5rem; list-style: none;
  }
  .cmdlog > summary::-webkit-details-marker { display: none; }
  .cmdlog > summary::before { content: "›"; color: var(--accent); font-size: 1rem; transition: transform .2s; }
  .cmdlog[open] > summary::before { transform: rotate(90deg); }
  .cmdlog .ttl { letter-spacing: .2px; }
  .cmdlog-sub { color: var(--muted); font-weight: 400; font-size: .74rem; }
  .cmdlog-list { padding: 0 .65rem .65rem; display: grid; gap: .55rem; max-height: 360px; overflow-y: auto; }
  .cmd {
    border: 1px solid var(--line); border-radius: 10px; padding: .6rem .7rem;
    background: #fff; box-shadow: 0 6px 18px rgba(32,24,64,.04);
  }
  .cmd.run { border-color: rgba(107,63,214,.45); box-shadow: 0 0 0 1px rgba(107,63,214,.08); }
  .cmd.err { border-color: rgba(220,38,38,.35); }
  .cmd .chead { display: flex; flex-wrap: wrap; align-items: center; gap: .42rem; font-size: .78rem; }
  .cmd .ckind {
    font-size: .62rem; font-weight: 750; text-transform: uppercase; letter-spacing: .4px;
    border-radius: 5px; padding: 2px 7px; border: 1px solid var(--line); color: var(--muted);
  }
  .cmd .ckind.az, .cmd .ckind.app { color: var(--accent); border-color: rgba(107,63,214,.4); }
  .cmd .ckind.rest { color: #b42373; border-color: rgba(180,35,115,.35); }
  .cmd .ckind.shell { color: #9a6700; border-color: rgba(154,103,0,.35); }
  .cmd .ctitle { font-weight: 650; }
  .cmd .cst { font-size: .66rem; border-radius: 999px; padding: 2px 8px; border: 1px solid var(--line); }
  .cmd .cst.ok { color: var(--ok); border-color: rgba(15,157,110,.35); }
  .cmd .cst.err { color: var(--bad); border-color: rgba(220,38,38,.35); }
  .cmd .cst.run { color: var(--accent); border-color: rgba(107,63,214,.4); }
  .cmd .ctime { font-size: .68rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .cmd .cms { font-size: .68rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .cmd .cnote { font-size: .68rem; color: var(--muted); margin-left: auto; }
  .cmd .cpurpose { font-size: .74rem; color: var(--muted); margin: .4rem 0 0; line-height: 1.45; }
  .cmd .ccmd {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem;
    color: var(--ink); background: #f1eff8; border: 1px solid #e9e4f7; border-radius: 8px;
    padding: .55rem .65rem; margin-top: .45rem; white-space: pre-wrap; word-break: break-word; line-height: 1.5;
  }

  .inv-panel { margin: 0 0 1rem; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); overflow: hidden; }
  .inv-title {
    padding: .7rem .9rem; display: flex; justify-content: space-between; align-items: center;
    font-size: .82rem; font-weight: 650; border-bottom: 1px solid var(--line);
  }
  .inv-title span:last-child { color: var(--muted); font-size: .74rem; font-weight: 500; }
  .inv-list { padding: .65rem; display: grid; gap: .55rem; max-height: 320px; overflow-y: auto; }
  .invocation { border: 1px solid var(--line); border-radius: 10px; padding: .65rem .7rem; background: #fff; }
  .invocation.ok { border-left: 3px solid var(--ok); }
  .invocation.bad { border-left: 3px solid var(--bad); }
  .invocation.run { border-left: 3px solid var(--accent); background: rgba(107,63,214,.035); }
  .inv-head { display: flex; flex-wrap: wrap; align-items: center; gap: .42rem; }
  .inv-badge {
    color: var(--accent); border: 1px solid rgba(107,63,214,.35); border-radius: 6px;
    padding: 2px 7px; font-size: .64rem; font-weight: 750; text-transform: uppercase; letter-spacing: .35px;
  }
  .inv-target { font-size: .74rem; font-weight: 650; }
  .inv-status { font-size: .68rem; color: var(--muted); }
  .inv-time { margin-left: auto; font-size: .68rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .inv-note { margin-top: .4rem; color: var(--ink); font-size: .78rem; line-height: 1.45; }
  .digest-panel {
    display: none; margin: 0 0 1rem; border: 1px solid rgba(107,63,214,.3);
    border-radius: 12px; background: var(--panel); overflow: hidden;
    box-shadow: 0 8px 24px rgba(28,18,51,.06);
  }
  .digest-panel.show { display: block; }
  .digest-head {
    display: flex; flex-wrap: wrap; align-items: baseline; gap: .55rem;
    padding: .8rem 1rem; border-bottom: 1px solid var(--line);
  }
  .digest-head strong { font-size: .82rem; color: var(--ink); }
  .digest-meta { color: var(--muted); font-size: .7rem; }
  .digest-body { padding: .9rem 1rem; font-size: .82rem; line-height: 1.55; color: var(--ink); }
  .digest-body h1, .digest-body h2, .digest-body h3 { margin: .9rem 0 .35rem; line-height: 1.25; }
  .digest-body h1:first-child, .digest-body h2:first-child, .digest-body h3:first-child { margin-top: 0; }
  .digest-body h1 { font-size: 1.15rem; }
  .digest-body h2 { font-size: 1rem; }
  .digest-body h3 { font-size: .9rem; }
  .digest-body p { margin: .45rem 0; }
  .digest-body ul, .digest-body ol { margin: .4rem 0 .6rem; padding-left: 1.35rem; }
  .digest-body li { margin: .2rem 0; }
  .digest-body code { font-family: var(--font-mono, ui-monospace, monospace); font-size: .75rem; background: rgba(107,63,214,.08); padding: 1px 4px; border-radius: 4px; }
  .digest-body a { color: var(--accent2); text-decoration: none; }
  .digest-body a:hover { text-decoration: underline; }

  .instr summary {
    cursor: pointer; list-style: none; display: flex; align-items: center; gap: .5rem;
    font-size: .74rem; text-transform: uppercase; letter-spacing: .6px; color: var(--muted);
    background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: .7rem 1rem;
  }
  .instr summary::-webkit-details-marker { display: none; }
  .instr summary::before { content: "›"; color: var(--accent); font-size: 1rem; transition: transform .2s; }
  .instr[open] summary::before { transform: rotate(90deg); }
  .instr summary > span:first-child { flex: 1 1 auto; }
  .instr[open] summary { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
  .instr .ibody { background: var(--panel); border: 1px solid var(--line); border-top: none; border-radius: 0 0 12px 12px; padding: .8rem 1rem; }
  .instr pre {
    white-space: pre-wrap; overflow-wrap: anywhere; font-size: .78rem; line-height: 1.55; color: var(--ink);
    max-height: 180px; overflow-y: auto; background: #fff; border: 1px solid var(--line); border-radius: 8px; padding: .6rem .7rem;
  }
  .instr .row2 { display: flex; gap: .5rem; margin-top: .6rem; align-items: center; }

  .btn {
    border: none; cursor: pointer; border-radius: 10px; padding: 10px 16px;
    font-size: .86rem; font-weight: 600; color: #fff;
    background: var(--accent);
    display: inline-flex; align-items: center; gap: .45rem;
  }
  .btn svg { width: 15px; height: 15px; flex: 0 0 auto; }
  .btn:hover { filter: brightness(1.06); }
  .btn.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
  .btn.ghost:hover { color: var(--ink); }
  .btn[hidden] { display: none; }
  .btn:disabled { opacity: .5; cursor: not-allowed; filter: none; }
  .invoke-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: invoke-spin .8s linear infinite; display: none; }
  #invoke.running .invoke-spinner { display: inline-block; }
  @keyframes invoke-spin { to { transform: rotate(360deg); } }
  .bar { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1rem 0 .45rem; align-items: center; }
  .status { min-height: 1.1rem; color: var(--muted); font-size: .78rem; margin: 0 0 1rem; }
  .status a { color: var(--accent2); text-decoration: none; }
  .status a:hover { text-decoration: underline; }
  ${COMMAND_CSS}
  .btn { background: var(--accent); color: #fff; }
  .btn.ghost { background: transparent; color: var(--muted); border: 1px solid var(--line); }
${withDeployment ? `  #deploy-azure svg { color: var(--accent); }` : ''}
  .section-label { font-size: .72rem; font-weight: 700; letter-spacing: .08em; color: var(--muted); margin: 1.5rem 0 .55rem; }

  .fields { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; margin: .5rem 0; }
  .fields label { font-size: .74rem; color: var(--muted); display: flex; flex-direction: column; gap: 3px; }
  .fields input[type=number], .fields input[type=text], .fields select {
    background: #fff; color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 6px 8px; font: inherit; font-size: .8rem; width: 90px;
  }
  .fields input[type=text] { width: 260px; }
  .trigger-test-input { margin: .65rem 0 1rem; }
  .trigger-test-input label { display: block; color: var(--muted); font-size: .74rem; font-weight: 600; }
  .trigger-test-input textarea {
    width: 100%; min-height: 64px; margin-top: .35rem; resize: vertical;
    background: #fff; color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
    padding: 8px 10px; font: .78rem/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace;
  }
  .trigger-test-input textarea.queue-editor { min-height: 180px; }
  .http-request-editor {
    display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: .7rem; margin: .65rem 0 1rem;
  }
  .http-request-editor[hidden] { display: none; }
  .http-request-editor label { color: var(--muted); font-size: .74rem; font-weight: 600; }
  .http-request-editor textarea {
    width: 100%; min-height: 180px; margin-top: .35rem; resize: vertical;
    background: #fff; color: var(--ink); border: 1px solid var(--line); border-radius: 8px;
    padding: 8px 10px; font: .78rem/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace;
  }
  .http-request-note { grid-column: 1 / -1; margin: 0; }
  .model-binding { margin: .65rem 0 1rem; }
  .model-binding > summary {
    cursor: pointer; list-style: none; display: flex; align-items: flex-start; gap: .65rem;
    padding: .75rem .9rem; font-size: .8rem;
  }
  .model-binding > summary::-webkit-details-marker { display: none; }
  .model-binding > summary::before { content: "›"; color: var(--accent); font-size: 1rem; transition: transform .2s; margin-top: .1rem; }
  .model-binding[open] > summary::before { transform: rotate(90deg); }
  .model-binding[open] > summary { border-bottom: 1px solid var(--line); }
  .model-binding .model-summary { min-width: 0; flex: 1 1 auto; display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem .55rem; }
  .model-binding .model-summary strong { color: var(--ink); font-size: .8rem; flex: 0 0 auto; }
  .model-binding .model-summary-detail { color: var(--muted); flex: 1 1 220px; min-width: 0; white-space: normal; overflow-wrap: anywhere; }
  .model-binding .model-summary-detail.err { color: var(--bad); }
  .model-binding > summary .tag { margin-left: auto; flex: 0 0 auto; }
  .model-binding .endpoint-mode { margin-bottom: .8rem; }
  .model-binding .fields { align-items: end; }
  .model-binding .fields label { flex: 1 1 180px; }
  .model-binding .fields select { width: 100%; min-width: 160px; }
  .model-binding .model-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .55rem; margin-top: .7rem; }
  .model-binding .model-status { color: var(--muted); font-size: .76rem; }
  .model-binding .model-status.ok { color: var(--ok); }
  .model-binding .model-status.err { color: var(--bad); }
  .model-binding .model-status.warn { color: var(--warn, #d9a441); }
  .model-binding .model-create-resources { margin: .5rem 0; padding-left: 1.1rem; font-size: .78rem; color: var(--ink); }
  .model-binding .model-create-resources li { margin-bottom: .25rem; }
  .model-binding .model-create-alt { white-space: normal; overflow-wrap: anywhere; margin-top: .45rem; }

  .doctor-panel { border: 1px solid var(--line); border-radius: 10px; padding: .75rem .9rem; margin: .65rem 0 1rem; background: #fff; }
  .doctor-panel[hidden] { display: none; }
  .doctor-head { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
  .doctor-head .tag.ok { color: var(--ok); border-color: rgba(15,157,110,.35); }
  .doctor-head .tag.err { color: var(--bad); border-color: rgba(220,38,38,.35); }
  .doctor-note { color: var(--muted); font-size: .74rem; margin: .4rem 0 0; }
  .doctor-list { margin-top: .7rem; display: flex; flex-direction: column; gap: .5rem; }
  .doctor-row { border: 1px solid var(--line); border-radius: 8px; padding: .55rem .7rem; }
  .doctor-row-head { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
  .doctor-dot { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; background: var(--muted); }
  .doctor-row.ok .doctor-dot { background: var(--ok); }
  .doctor-row.warn .doctor-dot { background: #b45309; }
  .doctor-row.err .doctor-dot { background: var(--bad); }
  .doctor-row-head strong { font-size: .8rem; color: var(--ink); }
  .doctor-status { font-size: .68rem; text-transform: uppercase; letter-spacing: .3px; color: var(--muted); margin-left: auto; }
  .doctor-row.ok .doctor-status { color: var(--ok); }
  .doctor-row.warn .doctor-status { color: #b45309; }
  .doctor-row.err .doctor-status { color: var(--bad); }
  /* Doctor/warning text must always be fully readable, never clipped: wrap
     long lines instead of truncating them with an ellipsis. */
  .doctor-detail, .doctor-fix { font-size: .76rem; color: var(--muted); margin-top: .3rem; white-space: normal; overflow-wrap: anywhere; }
  .doctor-fix { color: var(--ink); }
  .footer-meta { margin-top: 1rem; display: flex; justify-content: flex-end; align-items: center; gap: .6rem; color: var(--muted); font: 10px/1.2 ui-monospace, "SFMono-Regular", Menlo, monospace; opacity: .7; }
  .build-stamp { text-align: right; }
  .feedback-link { color: inherit; text-decoration: none; border-bottom: 1px solid transparent; }
  .feedback-link:hover, .feedback-link:focus-visible { color: var(--ink); border-bottom-color: currentColor; }
  .local-path {
    margin: .35rem 0 .8rem; padding: .65rem .75rem; border: 1px solid var(--line);
    border-radius: 10px; background: var(--panel);
  }
  .local-path[hidden], .local-path-editor[hidden] { display: none; }
  .local-path-head { display: flex; align-items: center; gap: .55rem; min-width: 0; }
  .local-path-label { color: var(--muted); font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; flex: 1 1 auto; }
  .local-path code { color: var(--ink); font: .76rem/1.4 ui-monospace, "SFMono-Regular", Menlo, monospace; overflow-wrap: anywhere; }
  .local-path-value { display: block; margin-top: .35rem; }
  .path-action {
    border: 0; background: transparent; color: var(--accent2); cursor: pointer;
    padding: 3px 4px; font: 600 .74rem/1 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .path-action:hover { text-decoration: underline; }
  .path-action:disabled { opacity: .5; cursor: not-allowed; text-decoration: none; }
  .local-path-editor { margin-top: .65rem; padding-top: .65rem; border-top: 1px solid var(--line); }
  .local-path-editor label { display: block; color: var(--muted); font-size: .72rem; }
  .local-path-editor input {
    width: 100%; margin-top: .3rem; background: #fff; color: var(--ink); border: 1px solid var(--line);
    border-radius: 8px; padding: 7px 9px; font: .78rem ui-monospace, "SFMono-Regular", Menlo, monospace;
  }
  .local-path-actions { display: flex; align-items: center; gap: .3rem; margin-top: .5rem; flex-wrap: wrap; }
  .btn.compact { padding: 6px 10px; border-radius: 8px; font-size: .75rem; }
  .btn.danger-text { margin-left: auto; background: transparent; color: var(--bad); border: 0; }
  .btn.danger-text:hover { background: rgba(220,38,38,.06); filter: none; }
  .local-path .inline-note { margin-top: .45rem; }

  .chart { border: 1px solid var(--line); border-radius: 10px; background: #fff; padding: .6rem .7rem; }
  .chart svg { display: block; width: 100%; height: 90px; }
  .stat-row { display: flex; flex-wrap: wrap; gap: .5rem 1.2rem; margin-top: .5rem; font-size: .78rem; color: var(--muted); }
  .stat-row b { color: var(--ink); font-variant-numeric: tabular-nums; }

  .loglines { background: #0b1120; color: #cdd6f4; font-family: ui-monospace, monospace; font-size: .72rem; line-height: 1.5;
    max-height: 200px; overflow-y: auto; padding: .6rem .7rem; border-radius: 10px; white-space: pre-wrap; overflow-wrap: anywhere; }
${withLoadTest || withDeployment || withTelemetry ? `  .load-terminal { margin: .7rem 0; border-radius: 10px; overflow: hidden; border: 1px solid #202a3b; background: #0b1120; }
  .load-terminal-head { display: flex; align-items: center; gap: .45rem; padding: .48rem .65rem; color: #a9b5ca;
    background: #111a2b; border-bottom: 1px solid #202a3b; font: 600 .7rem ui-monospace, SFMono-Regular, Menlo, monospace; }
  .load-terminal-dot { width: 7px; height: 7px; border-radius: 50%; background: #8b5cf6; box-shadow: 0 0 8px rgba(139,92,246,.8); }
  .load-terminal pre { margin: 0; min-height: 88px; max-height: 220px; overflow-y: auto; padding: .7rem;
    background: #0b1120; color: #dbe5f7; font: .72rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
  .deployment-output { margin: -.2rem 0 1rem; }
  .deployment-output[hidden] { display: none; }
  .deployment-output .body { padding: 0 .65rem .65rem; }
  .deployment-phases { display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: .6rem; }
  .deployment-phase { border: 1px solid var(--line); border-radius: 999px; padding: 3px 8px; color: var(--muted); font-size: .68rem; }
  .deployment-phase.started { color: var(--accent2); }
  .deployment-phase.completed { color: var(--ok); }
  .deployment-phase.failed, .deployment-phase.cancelled { color: var(--bad); }
  .deployment-actions { display: flex; align-items: center; gap: .55rem; margin-bottom: .55rem; }
  .deployment-terminal { margin: 0; min-height: 100px; max-height: 300px; overflow: auto; border-radius: 8px; padding: .65rem;
    background: #0b1120; color: #dbe5f7; font: .72rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
` : ''}</style>
</head>
<body>
  <div class="wrap">
    <div class="topline">
      <span class="badge">Initial Concept</span>
      <span class="tag" id="target-badge">Target: Local</span>
      <span class="tag" id="trigger-badge">Trigger: Timer</span>
      <button class="tag" id="doctor-toggle" aria-expanded="false">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2.5 2C2.22386 2 2 2.22386 2 2.5V7.50003C2 9.8163 3.75002 11.7238 6 11.9726V13C6 15.7614 8.23858 18 11 18C13.7614 18 16 15.7614 16 13V11.95C17.1411 11.7184 18 10.7095 18 9.5C18 8.11929 16.8807 7 15.5 7C14.1193 7 13 8.11929 13 9.5C13 10.7095 13.8589 11.7184 15 11.95V13C15 15.2092 13.2091 17 11 17C8.79086 17 7 15.2092 7 13V11.9726C9.24998 11.7238 11 9.8163 11 7.50003V2.5C11 2.22386 10.7761 2 10.5 2H8.5C8.22386 2 8 2.22386 8 2.5C8 2.77614 8.22386 3 8.5 3H10V7.50003C10 9.43302 8.433 11 6.5 11C4.567 11 3 9.43302 3 7.50003V3H4.5C4.77614 3 5 2.77614 5 2.5C5 2.22386 4.77614 2 4.5 2H2.5ZM15.5 8C16.3284 8 17 8.67157 17 9.5C17 10.3284 16.3284 11 15.5 11C14.6716 11 14 10.3284 14 9.5C14 8.67157 14.6716 8 15.5 8Z"/></svg>
        <span id="doctor-toggle-label">Doctor</span>
      </button>
    </div>
    <h1>${displayName}</h1>
    <p class="sub">
      Build and run <strong>Hosted Skills</strong> in a local Function App${withAzureExistingApp ? ', or select an existing Azure Function App to invoke remotely.' : '.'}
      <a href="${DOC_URL}" target="_blank" rel="noreferrer">Docs</a>
    </p>

    <div class="doctor-panel" id="doctor-panel" hidden>
      <div class="doctor-head">
        <button class="btn ghost" id="doctor-run">Check readiness</button>
        <span class="tag" id="doctor-tag">not checked</span>
      </div>
      <p class="doctor-note">Read-only checks for uv, Python ${MIN_PYTHON_LABEL}+, Core Tools, Node.js, Azurite, and the Azure CLI (including sign-in). Never installs anything, never opens a login prompt, never touches Azure resources.</p>
      <div class="doctor-list" id="doctor-list"></div>
    </div>

    <h2 class="sec">BUILD NEW OR SELECT EXISTING</h2>
    <div class="controls">
      <div class="seg" role="tablist">
        <button id="target-local">New local function</button>${withAzureExistingApp ? '\n        <button id="target-azure">Azure Function App</button>' : ''}
      </div>${withAzureExistingApp ? '\n      <select id="sub" style="display:none" title="Azure subscription"></select>\n      <select id="app" style="display:none" title="Azure Function App"></select>\n      <button class="btn ghost" id="refresh-apps" style="display:none" title="Reload the Function App list">Refresh</button>' : ''}
    </div>
    <div class="local-path" id="source-workspace-panel">
      <div class="local-path-head">
        <span class="local-path-label">Local function path</span>
        <span class="tag" id="source-workspace-tag">creating</span>
        <button class="path-action" id="source-customize">Change</button>
      </div>
      <code class="local-path-value" id="source-path-display">Preparing…</code>
      <div class="local-path-editor" id="source-path-editor" hidden>
        <label>Subfolder in current worktree
          <input id="source-relative-path" value="functions/daily-repo-digest" autocomplete="off" spellcheck="false">
        </label>
        <div class="local-path-actions">
          <button class="btn compact" id="source-create">Move here</button>
          <button class="btn compact ghost" id="source-cancel">Cancel</button>
          <button class="btn compact danger-text" id="source-remove" hidden>Remove generated skill</button>
        </div>
      </div>
      <p class="inline-note" id="source-workspace-note"></p>
    </div>
    <div class="inline-note" id="source-note"></div>
    <h2 class="sec">MODEL ENDPOINT</h2>
    <details class="panel model-binding" id="model-binding-panel">
      <summary>
        <span class="model-summary"><strong>Existing</strong><span class="model-summary-detail" id="model-summary-detail">Discovering available models...</span></span>
        <span class="tag" id="model-binding-tag">discovering</span>
      </summary>
      <div class="body">
        <div class="seg endpoint-mode" role="tablist" aria-label="Model endpoint source">
          <button class="on" id="model-mode-existing" aria-selected="true">Existing</button>
${withModelCreation ? '          <button id="model-mode-create" aria-selected="false">Create Models</button>' : ''}
        </div>
        <div id="model-existing-view">
          <div class="fields">
            <label>Subscription<select id="model-subscription"></select></label>
            <label>Provider
              <select id="model-source">
                <option value="foundry">Microsoft Foundry</option>${withAiGateway ? '\n                <option value="gateway">AI Gateway</option>' : ''}
              </select>
            </label>
            <label>${withAiGateway ? 'Project or gateway' : 'Project'}<select id="model-resource"></select></label>
            <label>Model<select id="model-model"></select></label>
          </div>
          <div class="model-actions">
            <button class="btn ghost" id="model-refresh">Refresh</button>
            <span class="model-status" id="model-status"></span>
          </div>
        </div>
${withModelCreation ? `        <div id="model-create-view" hidden>
          <p class="inline-note">${withAiGateway ? 'Create only the Foundry project and two model deployments used by the AI Gateway template. No Function App or hosting resources are deployed.' : 'Create the two supported model deployments in the selected Microsoft Foundry account. No Function App or hosting resources are deployed.'}</p>
          <ul class="model-create-resources" id="model-create-resources"></ul>
          <div class="model-actions">
            <button class="btn" id="model-create-confirm">Create Models</button>
            <span class="model-status" id="model-create-status"></span>
          </div>
          <p class="inline-note model-create-alt" id="model-create-alternatives"></p>
        </div>` : ''}
      </div>
    </details>
    <div class="bar" id="local-build-actions">
      <button class="btn ghost" id="open-vscode">${ICONS.vscode}<span class="label">Open in VS Code</span></button>
${withGitHubSession ? `      <button class="btn ghost" id="register-app-project" title="Creates a separate session from the isolated generated working copy; it does not add files to your current project." hidden>${ICONS.github}<span class="label">Create isolated GitHub Session</span></button>\n` : ''}      <button class="btn ghost" id="local-toggle">Start local function</button>${withDeployment ? `\n      <button class="btn ghost" id="deploy-azure">${ICONS.azure}<span class="label">Deploy to Azure</span></button>` : ''}${withDeploymentPreflight && !withDeployment ? '\n      <button class="btn ghost" id="deployment-preflight">Check deployment readiness</button>' : ''}
    </div>
    <div class="inline-note" id="local-note" hidden></div>
    <div class="inline-note" id="code-location" hidden></div>
${withDeployment ? `    <details class="cmdlog deployment-output" id="deployment-output" hidden>
      <summary><span class="ttl">Deployment output</span><span class="cmdlog-sub" id="deployment-summary"></span></summary>
      <div class="body">
        <div class="deployment-phases" id="deployment-phases"></div>
        <div class="deployment-actions">
          <button class="btn compact ghost" id="deployment-cancel" hidden>Cancel deployment</button>
          <span class="inline-note" id="deployment-output-note"></span>
        </div>
        <pre class="deployment-terminal" id="deployment-terminal">Waiting for deployment output.</pre>
      </div>
    </details>` : ''}

    <h2 class="sec">Trigger</h2>
    <div class="chips" id="triggers"></div>
    <div class="trigger-test-input" id="trigger-test-input-wrap" hidden>
      <label><span id="trigger-test-input-label">Trigger/test input (optional)</span>
        <textarea id="trigger-test-input" maxlength="65536" placeholder="Optional input for this test only"></textarea>
      </label>
      <p class="inline-note" id="trigger-input-guidance"></p>
    </div>
    <details class="panel model-binding parameter-panel" id="parameters-panel" hidden>
      <summary><span class="model-summary"><strong>Parameters</strong></span></summary>
      <div class="body">
        <div class="http-request-editor" id="http-request-editor">
          <label>Request headers JSON
            <textarea id="http-request-headers" maxlength="16384" spellcheck="false" placeholder='{"X-Correlation-Id":"demo-run"}'></textarea>
          </label>
          <label>Parameters JSON object
            <textarea id="http-request-body" maxlength="65536" spellcheck="false" placeholder='{"topic":"Summarize open incidents"}'></textarea>
          </label>
          <p class="inline-note http-request-note" id="http-request-note"></p>
        </div>
      </div>
    </details>
    <div class="timer-schedule" id="timer-schedule">
      <select id="timer-cadence" aria-label="Timer cadence">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="hourly">Hourly</option>
      </select>
      <span class="timer-fields" id="timer-daily-fields">
        <span>at</span>
        <input id="timer-time" type="time" step="60" aria-label="Daily timer time">
        <span>local time</span>
      </span>
      <span class="timer-fields" id="timer-weekly-fields" hidden>
        <select id="timer-weekday" aria-label="Weekly timer weekday">
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </select>
        <span>at</span>
        <input id="timer-weekly-time" type="time" step="60" aria-label="Weekly timer time">
        <span>local time</span>
      </span>
      <span class="timer-fields" id="timer-hourly-fields" hidden>
        <span>at minute</span>
        <input id="timer-minute" type="number" min="0" max="59" step="1" inputmode="numeric" aria-label="Hourly timer minute">
      </span>
      <span class="schedule-status" id="timer-status"></span>
    </div>
    <div class="inline-note" id="trigger-guidance"></div>

    <details class="instr" id="instr" open>
      <summary><span>SKILL INSTRUCTIONS</span><span class="tag" id="skill-name">Skill</span></summary>
      <div class="ibody">
        <pre id="prompt-preview"></pre>
        <div class="row2">
          <button class="btn ghost" id="edit-instructions">${ICONS.vscode}<span class="label">Edit in VS Code</span></button>
        </div>
      </div>
    </details>

    <div class="section-label">TEST</div>
    <div class="bar">
      <button class="btn" id="invoke"><span class="invoke-spinner" aria-hidden="true"></span><span id="invoke-label">Invoke</span></button>
${withLoadTest ? '      <button class="btn ghost" id="load-test-toggle" title="Sends real throttled HTTP bursts to measure latency/throughput. Read-only against Azure (looks up URL/key/instances); never creates or changes resources.">Load test</button>\n' : ''}      <button class="btn ghost" id="clear-invocations" title="Clear the trigger activity feed below">Clear</button>${withTelemetry ? '\n      <button class="btn ghost" id="open-app-insights">Open in Application Insights</button>' : ''}
    </div>
    <div class="inline-note" id="invoke-gate" hidden></div>
    <div class="status" id="status"></div>

    <div class="section-label" id="observe-label">OBSERVE</div>
${withTelemetry ? `    <details class="instr" id="telemetry-panel" style="display:none;margin-bottom:1rem;">
      <summary><span>Live Application Insights telemetry</span><span class="tag" id="telemetry-tag">off</span></summary>
      <div class="ibody">
        <div class="inline-note">Polled every 15s. Application Insights ingestion lags ~1-5 minutes, so this is near-real-time.</div>
        <div class="stat-row" id="ai-stats"></div>
        <div class="load-terminal">
          <div class="load-terminal-head"><span class="load-terminal-dot"></span><span>Recent traces and exceptions</span></div>
          <pre id="ai-traces">Waiting for Application Insights traces.</pre>
        </div>
        <div class="inline-note err" id="ai-error"></div>
        <div class="bar" style="margin-top:.65rem;">
          <button class="btn ghost" id="telemetry-toggle">Enable telemetry</button>
        </div>
      </div>
    </details>
` : ''}    <details class="instr" id="local-log-wrap" tabindex="-1" style="margin-bottom:1rem;">
      <summary><span>Local function host log</span><span class="tag" id="local-log-tag">stopped</span></summary>
      <div class="ibody"><div class="loglines" id="local-log"></div></div>
    </details>
    <div class="digest-panel" id="digest-panel">
      <div class="digest-head"><strong>Agent digest</strong><span class="digest-meta" id="digest-meta"></span></div>
      <div class="digest-body" id="digest-body"></div>
    </div>

    <details class="cmdlog" id="cmdlog" style="display:none" open>
      <summary><span class="ttl">Commands</span><span class="cmdlog-sub" id="cmdlog-sub"></span></summary>
      <div class="cmdlog-list" id="cmdlog-list"></div>
    </details>

    <div class="inv-panel">
      <div class="inv-title"><span>Trigger activity</span><span id="inv-total">0 events</span></div>
      <div class="inv-list" id="inv-list"><div class="empty">Waiting for local or Azure trigger activity.</div></div>
    </div>

${withLoadTest ? `    <div class="panel" id="load-test-panel" style="display:none">
      <h3><span>Load test</span><span id="load-test-status"></span></h3>
      <div class="body">
        <p class="inline-note">Sends real, throttled HTTP bursts with <code>oha</code> against your Function App's HTTP trigger - to measure latency/throughput, not to change anything. Local target hits your running <code>func start</code> host directly. Azure target first runs read-only <code>az</code> commands to look up the selected Function App's URL, host key, and instance count, then sends the same bursts to it. <strong>No Azure resource is created, modified, scaled, or deployed by this button</strong> - it only reads config/metrics and sends test traffic. Requires <code>oha</code> installed (see Doctor) and, for Local, the host already running.</p>
        <div class="fields">
          <label>Target
            <select id="lt-target"><option value="local">Local</option><option value="azure">Azure</option></select>
          </label>
          <label>Duration (s)<input type="number" id="lt-duration" min="5" max="120" /></label>
          <label>Concurrency
            <select id="lt-concurrency"><option value="1">1</option><option value="16">16</option><option value="32">32</option></select>
          </label>
          <label>Max req/s<input type="number" id="lt-rps" min="1" max="200" /></label>
        </div>
        <div class="inline-note" id="lt-note"></div>
        <div class="load-terminal">
          <div class="load-terminal-head"><span class="load-terminal-dot"></span><span>oha burst output</span></div>
          <pre id="lt-terminal">Waiting for a load test.</pre>
        </div>
        <div class="chart"><svg id="lt-chart" viewBox="0 0 600 90" preserveAspectRatio="none"></svg></div>
        <div class="stat-row" id="lt-stats"></div>
      </div>
    </div>` : ''}

    <div class="footer-meta">
      <div class="build-stamp">${displayName} v${STUDIO_VERSION} &middot; rev ${STUDIO_REVISION} &middot; ${PLUGIN_ID}</div>
      <a class="feedback-link" href="${feedbackUrl.replaceAll("&", "&amp;")}" target="_blank" rel="noopener noreferrer">Send feedback</a>
    </div>
  </div>

${withFullClient ? `<script>
${commandClientScript()}
</script>
` : ''}${withFullClient ? `<script>
  function localRuntimeControlState(state) {
    const localStatus = state && state.local ? state.local.status : 'stopped';
    const materialized = Boolean(state && state.sourceWorkspace && state.sourceWorkspace.materialized);
    const deploymentPreparing = Boolean(state && state.deployment && state.deployment.status === 'preparing');
    return {
      visible: !state || state.target !== 'azure',
      disabled: localStatus === 'starting' || !materialized || (deploymentPreparing && localStatus !== 'running'),
      label: localStatus === 'starting'
        ? 'Starting...'
        : localStatus === 'running' ? 'Stop local function' : 'Start local function'
    };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
  function updateSubscriptionSelect(select, subscriptions, selectedSubscription) {
    const inventory = Array.isArray(subscriptions) ? subscriptions : [];
    const inventoryKey = JSON.stringify(inventory.map((subscription) => [
      subscription.id,
      subscription.name,
      Boolean(subscription.isDefault),
    ]));
    if (select.dataset.subscriptionInventory !== inventoryKey) {
      select.innerHTML = inventory.map((subscription) =>
        '<option value="' + esc(subscription.id) + '">' + esc(subscription.name) +
        (subscription.isDefault ? ' (default)' : '') + '</option>'
      ).join('');
      select.dataset.subscriptionInventory = inventoryKey;
    }
    const selected = inventory.some((subscription) => subscription.id === selectedSubscription)
      ? selectedSubscription
      : inventory.find((subscription) => subscription.isDefault)?.id || inventory[0]?.id || '';
    if (selected && select.value !== selected) select.value = selected;
  }
  function updateModelSelect(select, items, selectedId, emptyLabel) {
    const inventory = Array.isArray(items) ? items : [];
    const currentIsValid = inventory.some((item) => item.id === select.value);
    if (document.activeElement === select && currentIsValid) return;
    select.innerHTML = inventory.length
      ? inventory.map((item) => '<option value="' + esc(item.id) + '"' + (item.id === selectedId ? ' selected' : '') + '>' + esc(item.label) + '</option>').join('')
      : '<option value="">' + esc(emptyLabel) + '</option>';
  }
  function inlineMarkdown(s) {
    return esc(s)
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\[([^\\]]+)\\]\\((https:\\/\\/[^)\\s]+)\\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      .replace(/\`([^\`]+)\`/g, '<code>$1</code>');
  }
  function renderMarkdown(text) {
    const lines = String(text || '').replace(/\\r\\n/g, '\\n').split('\\n');
    let html = '';
    let list = '';
    function closeList() { if (list) { html += '</' + list + '>'; list = ''; } }
    lines.forEach((line) => {
      const heading = /^(#{1,3})\\s+(.+)$/.exec(line);
      const bullet = /^\\s*[-*]\\s+(.+)$/.exec(line);
      const numbered = /^\\s*\\d+[.)]\\s+(.+)$/.exec(line);
      if (heading) {
        closeList();
        const level = heading[1].length;
        html += '<h' + level + '>' + inlineMarkdown(heading[2]) + '</h' + level + '>';
      } else if (bullet || numbered) {
        const nextList = bullet ? 'ul' : 'ol';
        if (list !== nextList) { closeList(); list = nextList; html += '<' + list + '>'; }
        html += '<li>' + inlineMarkdown((bullet || numbered)[1]) + '</li>';
      } else if (!line.trim()) {
        closeList();
      } else {
        closeList();
        html += '<p>' + inlineMarkdown(line) + '</p>';
      }
    });
    closeList();
    return html;
  }
  function postJson(url, body) {
    return fetch(url, { method: 'POST', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
      .then((r) => r.json());
  }
  const statusEl = document.getElementById('status');
  function setStatus(message, url) {
    statusEl.textContent = message || '';
    if (url) {
      statusEl.textContent = 'Saved: ';
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noreferrer'; a.textContent = url;
      statusEl.appendChild(a);
    }
  }
  window.cmdSetStatus = setStatus;

  const targetBadge = document.getElementById('target-badge');
  const triggerBadge = document.getElementById('trigger-badge');
  const timerSchedule = document.getElementById('timer-schedule');
  const timerCadence = document.getElementById('timer-cadence');
  const timerDailyFields = document.getElementById('timer-daily-fields');
  const timerTime = document.getElementById('timer-time');
  const timerWeeklyFields = document.getElementById('timer-weekly-fields');
  const timerWeekday = document.getElementById('timer-weekday');
  const timerWeeklyTime = document.getElementById('timer-weekly-time');
  const timerHourlyFields = document.getElementById('timer-hourly-fields');
  const timerMinute = document.getElementById('timer-minute');
  const timerStatus = document.getElementById('timer-status');
  const triggerGuidance = document.getElementById('trigger-guidance');
  const targetLocalBtn = document.getElementById('target-local');
  const targetAzureBtn = document.getElementById('target-azure');
  const subSel = document.getElementById('sub');
  const appSel = document.getElementById('app');
  const refreshAppsBtn = document.getElementById('refresh-apps');
  const sourceNote = document.getElementById('source-note');
  const doctorToggleBtn = document.getElementById('doctor-toggle');
  const doctorToggleLabel = document.getElementById('doctor-toggle-label');
  const doctorPanel = document.getElementById('doctor-panel');
  const doctorRunBtn = document.getElementById('doctor-run');
  const doctorTag = document.getElementById('doctor-tag');
  const doctorList = document.getElementById('doctor-list');
  const sourceWorkspacePanel = document.getElementById('source-workspace-panel');
  const sourceWorkspaceTag = document.getElementById('source-workspace-tag');
  const sourcePathDisplay = document.getElementById('source-path-display');
  const sourceCustomize = document.getElementById('source-customize');
  const sourcePathEditor = document.getElementById('source-path-editor');
  const sourceRelativePath = document.getElementById('source-relative-path');
  const sourceCreate = document.getElementById('source-create');
  const sourceCancel = document.getElementById('source-cancel');
  const sourceRemove = document.getElementById('source-remove');
  const sourceWorkspaceNote = document.getElementById('source-workspace-note');
  const modelBindingPanel = document.getElementById('model-binding-panel');
  const modelBindingTag = document.getElementById('model-binding-tag');
  const modelSummaryDetail = document.getElementById('model-summary-detail');
  const modelSubscription = document.getElementById('model-subscription');
  const modelSource = document.getElementById('model-source');
  const modelResource = document.getElementById('model-resource');
  const modelModel = document.getElementById('model-model');
  const modelRefresh = document.getElementById('model-refresh');
  const modelStatus = document.getElementById('model-status');
  const modelModeExisting = document.getElementById('model-mode-existing');
  const modelModeCreate = document.getElementById('model-mode-create');
  const modelExistingView = document.getElementById('model-existing-view');
  const modelCreateView = document.getElementById('model-create-view');
  const modelCreateResources = document.getElementById('model-create-resources');
  const modelCreateAlternatives = document.getElementById('model-create-alternatives');
  const modelCreateConfirm = document.getElementById('model-create-confirm');
  const modelCreateStatus = document.getElementById('model-create-status');
  const localBuildActions = document.getElementById('local-build-actions');
  const registerAppProject = document.getElementById('register-app-project');
  const deployAzureBtn = document.getElementById('deploy-azure');
  const deploymentOutput = document.getElementById('deployment-output');
  const deploymentSummaryEl = document.getElementById('deployment-summary');
  const deploymentPhases = document.getElementById('deployment-phases');
  const deploymentCancel = document.getElementById('deployment-cancel');
  const deploymentOutputNote = document.getElementById('deployment-output-note');
  const deploymentTerminal = document.getElementById('deployment-terminal');
  const codeLocation = document.getElementById('code-location');
  const triggersEl = document.getElementById('triggers');
  const triggerTestInputWrap = document.getElementById('trigger-test-input-wrap');
  const triggerTestInput = document.getElementById('trigger-test-input');
  const triggerTestInputLabel = document.getElementById('trigger-test-input-label');
  const triggerInputGuidance = document.getElementById('trigger-input-guidance');
  const parametersPanel = document.getElementById('parameters-panel');
  const httpRequestEditor = document.getElementById('http-request-editor');
  const httpRequestHeaders = document.getElementById('http-request-headers');
  const httpRequestBody = document.getElementById('http-request-body');
  const httpRequestNote = document.getElementById('http-request-note');
  const instructions = document.getElementById('instr');
  const skillName = document.getElementById('skill-name');
  const promptPreview = document.getElementById('prompt-preview');
  const invokeBtn = document.getElementById('invoke');
  const invokeLabel = document.getElementById('invoke-label');
  const invokeGate = document.getElementById('invoke-gate');
  const localToggleBtn = document.getElementById('local-toggle');
  const localNote = document.getElementById('local-note');
  const localLogEl = document.getElementById('local-log');
  const localLogTag = document.getElementById('local-log-tag');
  const localLogWrap = document.getElementById('local-log-wrap');
  const observeLabel = document.getElementById('observe-label');
  const openAiBtn = document.getElementById('open-app-insights');
  const loadTestToggleBtn = document.getElementById('load-test-toggle');
  const clearInvocationsBtn = document.getElementById('clear-invocations');
  const loadTestPanel = document.getElementById('load-test-panel');
  const ltTargetSel = document.getElementById('lt-target');
  const ltDuration = document.getElementById('lt-duration');
  const ltConcurrency = document.getElementById('lt-concurrency');
  const ltRps = document.getElementById('lt-rps');
  const ltNote = document.getElementById('lt-note');
  const ltChart = document.getElementById('lt-chart');
  const ltStats = document.getElementById('lt-stats');
  const ltTerminal = document.getElementById('lt-terminal');
  const ltStatus = document.getElementById('load-test-status');
  const telemetryPanel = document.getElementById('telemetry-panel');
  const telemetryToggleBtn = document.getElementById('telemetry-toggle');
  const telemetryTag = document.getElementById('telemetry-tag');
  const aiStats = document.getElementById('ai-stats');
  const aiTraces = document.getElementById('ai-traces');
  const aiError = document.getElementById('ai-error');
  const cmdlog = document.getElementById('cmdlog');
  const cmdlogList = document.getElementById('cmdlog-list');
  const cmdlogSub = document.getElementById('cmdlog-sub');
  const invList = document.getElementById('inv-list');
  const invTotal = document.getElementById('inv-total');
  const digestPanel = document.getElementById('digest-panel');
  const digestMeta = document.getElementById('digest-meta');
  const digestBody = document.getElementById('digest-body');
  let latest = null;
  let triggerInputKey = '';
  let httpRequestInputKey = '';
  let sourceEditorOpen = false;

  function renderTriggers(state) {
    const schedule = state.timerSchedule || { cadence: 'daily', localTime: '09:00', weekday: 1, hourlyMinute: 0, status: '', error: '' };
    if (state.target === 'azure') {
      const selected = (state.azure.functions || []).find((fn) => fn.name === state.azure.functionName);
      triggersEl.innerHTML = (state.azure.functions || []).map((fn) => {
        const on = fn.name === state.azure.functionName ? ' on' : '';
        const unsupported = fn.supportsInvoke ? '' : ' nyi';
        const tag = fn.supportStatus === 'conditional'
          ? '<span class="nyi-tag">RBAC</span>'
          : fn.supportsInvoke ? '' : '<span class="nyi-tag">unsupported</span>';
        return '<button class="trig' + on + unsupported + '" data-function="' + esc(fn.name) + '" title="' + esc(fn.hostedSkillNote + '. ' + fn.guidance) + '">' + esc(fn.name + ' · ' + fn.label) + tag + '</button>';
      }).join('') || '<span class="inline-note">Select an app to discover its deployed functions and trigger bindings.</span>';
      triggerBadge.textContent = selected ? ('Function: ' + selected.name + ' · ' + selected.label) : 'Trigger: none';
    } else {
      triggersEl.innerHTML = state.triggerTypes.map((t) => {
        const on = t.id === state.trigger ? ' on' : '';
        const nyi = t.nyi ? ' nyi' : '';
        const tag = t.nyi ? '<span class="nyi-tag">NYI</span>' : '';
        const title = t.nyi ? 'Not implemented in this canvas yet' : 'Manually invoke via ' + t.label;
        return '<button class="trig' + on + nyi + '" data-id="' + t.id + '" title="' + title + '"' + (t.nyi || !state.sourceWorkspace.materialized || state.azdOperation.active ? ' disabled' : '') + '>' + t.label + tag + '</button>';
      }).join('');
      triggerBadge.textContent = 'Trigger: ' + ((state.triggerTypes.find((t) => t.id === state.trigger) || {}).label || 'none');
    }
    const showTimerSchedule = state.trigger === 'timer' && state.target === 'local';
    timerSchedule.style.display = showTimerSchedule ? '' : 'none';
    const cadence = schedule.cadence || 'daily';
    if (document.activeElement !== timerCadence) timerCadence.value = cadence;
    timerDailyFields.hidden = cadence !== 'daily';
    timerWeeklyFields.hidden = cadence !== 'weekly';
    timerHourlyFields.hidden = cadence !== 'hourly';
    if (document.activeElement !== timerTime) timerTime.value = schedule.localTime || '09:00';
    if (document.activeElement !== timerWeeklyTime) timerWeeklyTime.value = schedule.localTime || '09:00';
    if (document.activeElement !== timerWeekday) timerWeekday.value = String(schedule.weekday == null ? 1 : schedule.weekday);
    if (document.activeElement !== timerMinute) timerMinute.value = String(schedule.hourlyMinute == null ? 0 : schedule.hourlyMinute);
    timerStatus.textContent = schedule.error || schedule.status || '';
    timerStatus.className = 'schedule-status' + (schedule.error ? ' err' : '');
    const scheduleDisabled = Boolean(state.local.status === 'starting' || !state.sourceWorkspace.materialized || state.azdOperation.active);
    [timerCadence, timerTime, timerWeekday, timerWeeklyTime, timerMinute].forEach((control) => { control.disabled = scheduleDisabled; });
    const support = state.triggerSupport || {};
    if (state.trigger === 'connector') {
      const connector = support.connector || {};
      triggerGuidance.textContent = state.target === 'local'
        ? 'Microsoft 365 Inbox only (' + (connector.operationName || 'OnNewEmailV3') + ', Inbox). Local Invoke uses the runtime chat endpoint with representative DRY RUN Trigger data; Outlook tools are not registered locally, so it cannot call Microsoft 365. Other connectors are unsupported.'
        : 'Microsoft 365 Inbox only. Azure requires an authorized Connector Namespace OnNewEmailV3 trigger, MCP endpoint, and delegated consent. Azure Functions Hosted Skills Preview does not create or invoke that webhook and blocks deployment until you configure it externally; other connectors are unsupported.';
    } else if (state.trigger === 'blob' || state.trigger === 'cosmos') {
      triggerGuidance.textContent = 'This trigger is not supported in Azure Functions Hosted Skills Preview yet.';
    } else {
      triggerGuidance.textContent = '';
    }
    triggerGuidance.hidden = !triggerGuidance.textContent;
  }

  function renderDoctor(state) {
    const doctor = state.doctor;
    const running = Boolean(state.doctorRunning);
    doctorRunBtn.disabled = running;
    doctorRunBtn.textContent = running ? 'Checking…' : 'Check readiness';
    if (running) {
      doctorTag.textContent = 'checking…';
      doctorTag.className = 'tag';
    } else if (!doctor) {
      doctorTag.textContent = 'not checked';
      doctorTag.className = 'tag';
    } else {
      doctorTag.textContent = doctor.ready ? 'ready' : 'action needed';
      doctorTag.className = 'tag' + (doctor.ready ? ' ok' : ' err');
    }
    doctorToggleLabel.textContent = !doctor ? 'Doctor' : doctor.ready ? 'Doctor: ready' : 'Doctor: action needed';
    if (doctor && !doctor.ready && doctorPanel.hidden) {
      doctorPanel.hidden = false;
      doctorToggleBtn.setAttribute('aria-expanded', 'true');
    }
    if (!doctor) { doctorList.innerHTML = ''; return; }
    const statusLabel = { ready: 'Ready', missing: 'Missing', stale: 'Stale', error: 'Error' };
    doctorList.innerHTML = doctor.checks.map((check) => {
      const cls = check.status === 'ready' ? 'ok' : check.status === 'stale' ? 'warn' : 'err';
      return '<div class="doctor-row ' + cls + '">' +
        '<div class="doctor-row-head"><span class="doctor-dot"></span><strong>' + esc(check.label) + '</strong>' +
        '<span class="doctor-status">' + esc(statusLabel[check.status] || check.status) + (check.required ? '' : ' · optional') + '</span></div>' +
        (check.detail ? '<div class="doctor-detail">' + esc(check.detail) + '</div>' : '') +
        (check.fix ? '<div class="doctor-fix">' + esc(check.fix) + '</div>' : '') +
        '</div>';
    }).join('');
  }

  function renderModelBinding(state) {
    const binding = state.modelBinding || {};
    const readiness = binding.readiness || {};
    const resources = binding.source === 'gateway' ? (binding.gateways || []) : (binding.foundry || []);
    const resource = resources.find((item) => item.id === binding.resourceId) || resources[0];
    const model = resource && (resource.models.find((item) => item.id === binding.modelId) || resource.models[0]);
    const activeResources = binding.activeSource === 'gateway' ? (binding.gateways || []) : (binding.foundry || []);
    const activeResource = activeResources.find((item) => item.id === binding.activeResourceId);
    const activeModel = activeResource && activeResource.models.find((item) => item.id === binding.activeModelId);
    const activeModelName = activeModel ? (activeModel.label || activeModel.name || activeModel.id) : binding.activeModelId;
    const activeResourceName = activeResource
      ? (activeResource.name || activeResource.label)
      : String(binding.activeResourceId || '').split('/').filter(Boolean).pop();
    const boundSummary = binding.configured && activeModelName
      ? activeModelName + (activeResourceName ? ' · ' + activeResourceName : '')
      : '';
    // Priority: a hard discovery/apply error first, then the prescriptive
    // readiness classification (not-signed-in / no-subscription / no-account
    // / no-model / endpoint-invalid / ready / select), then the legacy
    // active-label fallback. This is what makes the six bootstrap states
    // visible instead of a generic "no active model endpoint".
    modelSummaryDetail.textContent = boundSummary
      ? boundSummary
      : binding.error
        ? binding.error
      : readiness.message
        ? readiness.message
        : binding.loading ? 'Binding selected model...' : 'No active model endpoint';
    modelSummaryDetail.className = 'model-summary-detail' + (!boundSummary && (binding.error || readiness.state === 'no-account' || readiness.state === 'no-model' || readiness.state === 'endpoint-invalid' || readiness.state === 'not-signed-in' || readiness.state === 'no-subscription') ? ' err' : '');
    modelBindingPanel.style.display = state.target === 'local' && state.sourceWorkspace.materialized ? '' : 'none';
    updateSubscriptionSelect(
      modelSubscription,
      state.azure.subscriptions,
      binding.subscription || state.azure.subscription
    );
    modelSource.value = binding.source || 'foundry';
    updateModelSelect(modelResource, resources, (resource || {}).id || '', 'No existing resources found');
    updateModelSelect(modelModel, resource ? resource.models : [], (model || {}).id || '', 'No deployed models found');
    modelBindingTag.textContent = binding.loading ? 'binding' : binding.configured ? 'ready' : (readiness.state || 'select model').replace(/-/g, ' ');
    modelBindingTag.className = 'tag' + (binding.configured ? ' ok' : '');
    modelStatus.textContent = binding.error || binding.gatewayActionError || binding.status || binding.activeLabel || readiness.message || '';
    modelStatus.className = 'model-status' + (binding.error || binding.gatewayActionError ? ' err' : binding.configured ? ' ok' : '');
    modelRefresh.disabled = Boolean(binding.loading);
    renderModelCreate(state);
  }

  // Whichever tab (Existing / Create Models) the user last clicked; a plan
  // fetched into state.modelCreate does not itself switch tabs, so this
  // stays purely a client-side view toggle.
  let modelCreateTabActive = false;
  function setModelTab(create) {
    modelCreateTabActive = create;
    modelModeExisting.classList.toggle('on', !create);
    modelModeExisting.setAttribute('aria-selected', String(!create));
    modelModeCreate.classList.toggle('on', create);
    modelModeCreate.setAttribute('aria-selected', String(create));
    modelExistingView.style.display = create ? 'none' : '';
    modelCreateView.hidden = !create;
    if (create) postJson('/models/create-plan');
  }
  modelModeExisting.addEventListener('click', () => setModelTab(false));
  modelModeCreate.addEventListener('click', () => setModelTab(true));

  function renderModelCreate(state) {
    const create = state.modelCreate || {};
    const azdOp = state.azdOperation || {};
    const blockedByDeploy = Boolean(azdOp.active && azdOp.kind !== 'create-models');
    modelCreateResources.innerHTML = (create.resources || []).map((r) =>
      '<li><strong>' + esc(r.kind) + '</strong>: ' + esc(r.note) + '</li>'
    ).join('') || '<li>Plan loading...</li>';
    modelCreateAlternatives.innerHTML = (create.alternatives || []).map((a) => esc(a)).join('<br>');
    modelCreateConfirm.disabled = Boolean(create.running) || blockedByDeploy;
    modelCreateConfirm.title = blockedByDeploy ? ((azdOp.label || 'Another azd operation') + ' is still running - wait for it to finish.') : '';
    modelCreateStatus.textContent = blockedByDeploy
      ? (azdOp.label || 'Another Azure write operation') + ' is still running. Wait for it to finish before creating models.'
      : create.running ? 'Creating Foundry models...' : (create.message || '');
    modelCreateStatus.className = 'model-status' + (blockedByDeploy ? ' warn' : create.ok === false ? ' err' : create.ok === true ? ' ok' : '');
  }

  modelCreateConfirm.addEventListener('click', async () => {
    // This explicit user click is the confirmation. Discovery, doctor, and
    // agent actions can only explain the plan and never reach this route.
    if (modelCreateConfirm.disabled) return;
    modelCreateConfirm.disabled = true;
    modelCreateStatus.textContent = 'Starting model deployment...';
    modelCreateStatus.className = 'model-status';
    await postJson('/models/create', { confirm: true });
  });
  function renderSourceWorkspace(state) {
    const source = state.sourceWorkspace || {};
    const busy = Boolean(source.operation);
    const current = source.mode === 'current';
    const showEditor = current && (sourceEditorOpen || (!source.materialized && !busy));
    sourceWorkspacePanel.hidden = state.target === 'azure';
    sourcePathDisplay.textContent = current ? (source.relativePath || 'functions/daily-repo-digest') : 'Isolated workspace';
    sourcePathDisplay.title = source.destination || '';
    sourceCustomize.hidden = !current || busy;
    sourceCustomize.disabled = busy;
    sourcePathEditor.hidden = !showEditor;
    if (document.activeElement !== sourceRelativePath) sourceRelativePath.value = source.relativePath || 'functions/daily-repo-digest';
    sourceRelativePath.disabled = busy;
    sourceCreate.disabled = busy || !source.canUseCurrent;
    sourceCreate.textContent = source.materialized ? 'Move here' : 'Create here';
    sourceCancel.disabled = busy;
    sourceRemove.hidden = !(showEditor && source.materialized && current);
    sourceRemove.disabled = busy;
    sourceWorkspaceTag.textContent = busy
      ? source.operation
      : source.materialized ? (current ? 'current worktree' : 'isolated') : source.autoCreate === false ? 'removed' : 'preparing';
    sourceWorkspaceTag.className = 'tag' + (source.materialized ? ' ok' : '');
    if (source.error) {
      sourceWorkspaceNote.hidden = false;
      sourceWorkspaceNote.className = 'inline-note err';
      sourceWorkspaceNote.textContent = source.error;
    } else if (!source.materialized && source.autoCreate === false) {
      sourceWorkspaceNote.hidden = false;
      sourceWorkspaceNote.className = 'inline-note';
      sourceWorkspaceNote.textContent = 'Removed. Choose a folder and create again whenever you want it back.';
    } else if (busy) {
      sourceWorkspaceNote.hidden = false;
      sourceWorkspaceNote.className = 'inline-note';
      sourceWorkspaceNote.textContent = source.operation === 'moving' ? 'Moving the complete generated app…' : 'Creating the generated app…';
    } else if (source.materialized && current && showEditor) {
      sourceWorkspaceNote.hidden = false;
      sourceWorkspaceNote.className = 'inline-note';
      sourceWorkspaceNote.textContent = 'Changing the path moves the complete generated app. Remove succeeds only while files owned by Azure Functions Hosted Skills Preview are unchanged.';
    } else {
      sourceWorkspaceNote.hidden = true;
      sourceWorkspaceNote.textContent = '';
    }
  }

  function renderSource(state) {
    renderSourceWorkspace(state);
    renderModelBinding(state);
    targetLocalBtn.classList.toggle('on', state.target === 'local');
    targetAzureBtn.classList.toggle('on', state.target === 'azure');
    targetBadge.textContent = 'Target: ' + (state.target === 'azure' ? ('Azure' + (state.azure.app ? ' · ' + state.azure.app.name : '')) : 'Local');
    const showAzure = state.target === 'azure';
    const localControl = localRuntimeControlState(state);
    subSel.style.display = showAzure ? '' : 'none';
    appSel.style.display = showAzure ? '' : 'none';
    refreshAppsBtn.style.display = showAzure ? '' : 'none';
    sourceNote.hidden = !showAzure;
    localBuildActions.style.display = localControl.visible ? '' : 'none';
    deploymentOutput.style.display = showAzure ? 'none' : '';
    codeLocation.hidden = true;
    localLogWrap.style.display = showAzure ? 'none' : '';
    observeLabel.style.display = (!showAzure || state.azure.app) ? '' : 'none';
    openAiBtn.style.display = showAzure ? '' : 'none';
    if (showAzure) {
      updateSubscriptionSelect(subSel, state.azure.subscriptions, state.azure.subscription);
      if (document.activeElement !== appSel) {
        appSel.innerHTML = '<option value="">Select a Function App…</option>' +
          (state.azure.apps || []).map((a) => '<option value="' + esc(a.id) + '"' + (a.id === state.azure.appId ? ' selected' : '') + '>' + esc(a.name) + ' (' + esc(a.resourceGroup) + ')</option>').join('');
      }
      let note = '';
      if (state.azure.subscriptionsError) note = state.azure.subscriptionsError;
      else if (state.azure.appsError) note = state.azure.appsError;
      else if (state.azure.app && state.azure.functionsError) note = state.azure.functionsError;
      else if (state.azure.app) {
        const selected = (state.azure.functions || []).find((fn) => fn.name === state.azure.functionName);
        note = state.azure.functions.length + ' function(s) found on ' + state.azure.app.name +
          (selected ? '. Selected ' + selected.name + ' (' + selected.label + '). ' + selected.hostedSkillNote + '. ' + selected.guidance : '');
      }
      sourceNote.textContent = note;
      sourceNote.className = 'inline-note' + ((state.azure.subscriptionsError || state.azure.appsError || state.azure.functionsError) ? ' err' : '');
    } else sourceNote.textContent = '';
    const reg = state.appRegistration || {};
    const registerLabel = registerAppProject.querySelector('.label');
    registerAppProject.disabled = Boolean(reg.pending || reg.ok === true);
    registerAppProject.title = state.sourceWorkspace.mode === 'current'
      ? 'Move the generated app out of this worktree, then create an isolated GitHub session. The current-worktree folder is removed only after the move succeeds.'
      : 'Create a separate session from the isolated generated working copy.';
    registerLabel.textContent = reg.pending
      ? 'Creating Session...'
      : reg.ok === true
        ? 'Session Ready'
        : state.sourceWorkspace.mode === 'current' ? 'Move to isolated GitHub Session' : 'Create isolated GitHub Session';
    if (state.openStatus) setStatus(state.openStatus);
  }

  function renderLocal(state) {
    const running = state.local.status === 'running';
    const localControl = localRuntimeControlState(state);
    localToggleBtn.textContent = localControl.label;
    localToggleBtn.disabled = localControl.disabled;
    localLogTag.textContent = state.local.status + (running && state.local.port ? (' · :' + state.local.port) : '');
    localNote.textContent = state.local.error || (running ? state.local.functions.map((f) => f.name + ' (' + f.kind + (f.route ? ', ' + f.route : '') + ')').join(' · ') : '');
    localNote.className = 'inline-note' + (state.local.error ? ' err' : '');
    localNote.hidden = state.target !== 'local' || !localNote.textContent;
    localLogEl.textContent = (state.local.logTail || []).join('\\n');
    localLogEl.scrollTop = localLogEl.scrollHeight;
  }

  function renderDeployment(state) {
    const deployment = state.deployment || { status: 'idle', phases: {}, output: [] };
    if (deployment.status === 'preparing' && deploymentOutput.dataset.status !== 'preparing') deploymentOutput.open = true;
    deploymentOutput.dataset.status = deployment.status;
    deploymentOutput.hidden = deployment.status === 'idle';
    deploymentSummaryEl.textContent = state.deployStatus || deployment.message || deployment.status;
    deploymentPhases.innerHTML = ['provision', 'package', 'deploy'].map((name) => {
      const phase = deployment.phases[name] || { state: 'pending' };
      const duration = phase.durationMs != null ? ' · ' + (phase.durationMs / 1000).toFixed(1) + 's' : '';
      return '<span class="deployment-phase ' + esc(phase.state) + '" title="' + esc(phase.detail || '') + '">' +
        esc(name + ': ' + phase.state + duration) + '</span>';
    }).join('');
    const running = deployment.status === 'preparing' || deployment.status === 'running';
    deploymentCancel.hidden = !running;
    deploymentCancel.disabled = Boolean(deployment.cancelRequested || deployment.status === 'preparing');
    deploymentOutputNote.textContent = deployment.outputTruncated
      ? 'Older output was removed from this bounded view.'
      : running ? 'Deployment continues while this panel is collapsed.' : '';
    const terminalText = (deployment.output || []).map((item) => '[' + item.stream + '] ' + item.text).join('\\n') ||
      (running ? 'Waiting for azd output...' : 'No deployment output was emitted.');
    if (deploymentTerminal.textContent !== terminalText) {
      const atBottom = deploymentTerminal.scrollHeight - deploymentTerminal.scrollTop - deploymentTerminal.clientHeight < 24;
      deploymentTerminal.textContent = terminalText;
      if (atBottom) deploymentTerminal.scrollTop = deploymentTerminal.scrollHeight;
    }
  }

  // Invoke is never a dead gray control: it always stays clickable. When
  // something blocks a real invocation, the click still does something
  // useful - it runs the doctor sweep, explains the exact blocker, and
  // opens the panel that fixes it, instead of silently doing nothing.
  function computeInvokeGate(state) {
    const binding = state.modelBinding || {};
    if (state.target === 'azure') {
      if (!state.azure.app) return { blocked: true, reason: 'Select an Azure Function App first.', focus: 'azure' };
      if (state.azure.functionsError) return { blocked: true, reason: state.azure.functionsError, focus: 'azure' };
      const fn = (state.azure.functions || []).find((candidate) => candidate.name === state.azure.functionName);
      if (!fn) return { blocked: true, reason: 'Select a discovered deployed function first.', focus: 'azure' };
      if (!fn.supportsInvoke) return { blocked: true, reason: fn.guidance, focus: 'azure' };
      return { blocked: false };
    }
    if (!state.sourceWorkspace.materialized) {
      return { blocked: true, reason: 'Create the generated app in the selected source location first.', focus: 'source' };
    }
    const cooldownSeconds = binding.activeSource === 'gateway'
      ? Math.max(0, Math.ceil(((binding.nextInvokeAt || 0) - Date.now()) / 1000))
      : 0;
    if (cooldownSeconds > 0) {
      return { blocked: true, reason: 'This gateway model is rate-limited for ' + cooldownSeconds + 's more before the next call.', focus: 'cooldown' };
    }
    const boundToActive = binding.configured &&
      binding.source === binding.activeSource &&
      binding.resourceId === binding.activeResourceId &&
      binding.modelId === binding.activeModelId;
    if (binding.loading) return { blocked: true, reason: 'Still binding the selected model - try again in a moment.', focus: null };
    if (!boundToActive) {
      const readiness = binding.readiness || {};
      const reason = readiness.message || 'No model endpoint is bound yet. Pick Subscription/Provider/Project/Model above, or use Create Models.';
      return { blocked: true, reason, focus: 'model' };
    }
    return { blocked: false };
  }

  function renderTriggerEditors(state, selectedAzure) {
    const queueInput = state.trigger === 'queue' && (state.target === 'local' || (selectedAzure && selectedAzure.kind === 'queue'));
    const connectorInput = state.trigger === 'connector' && state.target === 'local';
    const httpInput = (state.target === 'local' && (state.trigger === 'http' || state.trigger === 'timer')) || (
      state.trigger === 'http' &&
      (selectedAzure && selectedAzure.kind === 'http' && (!(selectedAzure.methods || []).length || selectedAzure.methods.includes('POST')))
    );
    const nextTriggerInputKey = queueInput
      ? state.target + ':queue:' + (selectedAzure ? selectedAzure.name : 'local')
      : connectorInput
        ? 'local:connector'
        : selectedAzure && selectedAzure.kind !== 'http' ? 'azure:' + selectedAzure.kind + ':' + selectedAzure.name : '';
    triggerTestInputWrap.hidden = !(queueInput || connectorInput || (selectedAzure && !httpInput));
    if (nextTriggerInputKey !== triggerInputKey) {
      triggerInputKey = nextTriggerInputKey;
      triggerTestInput.value = queueInput
        ? (((state.triggerSupport || {}).queue || {}).message || '')
        : connectorInput
          ? (((state.triggerSupport || {}).connector || {}).payload || '')
          : '';
    }
    triggerTestInput.classList.toggle('queue-editor', queueInput);
    triggerTestInputLabel.textContent = queueInput
      ? 'Queue message JSON'
      : connectorInput ? 'Microsoft 365 Inbox dry-run payload JSON' : 'Trigger/test input (optional)';
    triggerInputGuidance.textContent = queueInput
      ? ''
      : connectorInput
        ? 'Representative email array only. Azure Functions Hosted Skills Preview always adds RUN MODE: DRY RUN and does not register Outlook tools locally.'
        : selectedAzure ? selectedAzure.hostedSkillNote + '. ' + selectedAzure.guidance : '';
    triggerTestInput.placeholder = queueInput
      ? '{\\n  "request": "Create a repository digest",\\n  "repository": "owner/repo",\\n  "lookbackHours": 24\\n}'
      : connectorInput
        ? '[\\n  {\\n    "Subject": "Daily repository digest request",\\n    "BodyPreview": "Summarize repository activity"\\n  }\\n]'
        : selectedAzure && selectedAzure.kind === 'http'
          ? 'Optional Hosted Skills/MCP message for this HTTP call'
          : selectedAzure && selectedAzure.kind === 'timer'
            ? 'Optional Timer trigger/test input; does not change skill instructions'
            : 'Optional trigger/test input';
    const nextHttpRequestInputKey = httpInput
      ? state.target + ':http:' + (selectedAzure ? selectedAzure.name : 'local')
      : '';
    parametersPanel.hidden = !httpInput;
    httpRequestEditor.hidden = false;
    const draft = state.httpRequestDraft || {};
    if (nextHttpRequestInputKey !== httpRequestInputKey) {
      httpRequestInputKey = nextHttpRequestInputKey;
      httpRequestHeaders.value = draft.headersText == null ? '{}' : draft.headersText;
      httpRequestBody.value = draft.bodyText == null ? '' : draft.bodyText;
    } else {
      if (document.activeElement !== httpRequestHeaders && draft.headersText != null &&
          httpRequestHeaders.value !== draft.headersText) httpRequestHeaders.value = draft.headersText;
      if (document.activeElement !== httpRequestBody && draft.bodyText != null &&
          httpRequestBody.value !== draft.bodyText) httpRequestBody.value = draft.bodyText;
    }
    const parameterSchema = (state.parameters || {}).schema;
    const requiredParameters = parameterSchema && Array.isArray(parameterSchema.required) ? parameterSchema.required : [];
    httpRequestNote.textContent = state.httpRequestError ||
      'Parameters are sent as the JSON request body to HTTP and Timer manual tests.' +
      (requiredParameters.length ? ' Required: ' + requiredParameters.join(', ') + '.' : '') +
      ' Safe drafts persist for this canvas; credential-like values do not.';
    httpRequestNote.className = 'inline-note http-request-note' + (state.httpRequestError ? ' err' : '');
    return { queueInput, connectorInput, httpInput };
  }

  function renderInvoke(state) {
    const binding = state.modelBinding || {};
    const gate = computeInvokeGate(state);
    const cooldownSeconds = state.target === 'local' && binding.activeSource === 'gateway'
      ? Math.max(0, Math.ceil(((binding.nextInvokeAt || 0) - Date.now()) / 1000))
      : 0;
    const invocationRunning = (state.invocations || []).some((item) => item.phase === 'running');
    const selectedAzure = state.target === 'azure'
      ? (state.azure.functions || []).find((fn) => fn.name === state.azure.functionName)
      : null;
    invokeLabel.textContent = invocationRunning
      ? 'Running…'
      : cooldownSeconds
        ? 'Invoke Trigger · ' + cooldownSeconds + 's'
        : selectedAzure ? 'Invoke ' + selectedAzure.name : 'Invoke Trigger';
    invokeBtn.classList.toggle('running', invocationRunning);
    invokeBtn.setAttribute('aria-busy', String(invocationRunning));
    if (invocationRunning && state.target === 'local') localLogWrap.open = true;
    invokeBtn.disabled = false;
    invokeBtn.classList.toggle('warn-outline', gate.blocked);
    invokeBtn.title = gate.blocked ? gate.reason : '';
    if (gate.blocked) {
      // Always show the blocker while genuinely blocked - no dismiss state.
      // A real blocker (no model bound, still binding, etc.) must stay
      // visible for as long as it is true, not be hideable by the user.
      invokeGate.hidden = false;
      invokeGate.className = 'inline-note warn';
      invokeGate.textContent = gate.reason;
    } else {
      invokeGate.hidden = true;
    }
    openAiBtn.disabled = !(state.target === 'azure' && state.azure.app);
    renderTriggerEditors(state, selectedAzure);
    loadTestToggleBtn.style.display = state.target === 'azure' && (!selectedAzure || selectedAzure.kind !== 'http') ? 'none' : '';
    telemetryPanel.style.display = (state.azure.app) ? '' : 'none';
  }

  function chartPath(values, w, h, pad) {
    if (!values.length) return '';
    const max = Math.max(1, ...values);
    const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
    return values.map((v, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (v / max) * (h - pad * 2);
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }
  function renderChart(svgEl, values, color) {
    const path = chartPath(values, 600, 90, 8);
    svgEl.innerHTML = path ? '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2"/>' : '<text x="10" y="45" font-size="11" fill="#9ca3af">No data yet</text>';
  }

  function renderLoadTest(state) {
    const lt = state.loadTest;
    loadTestToggleBtn.textContent = lt.running ? 'Stop load test' : 'Load test';
    loadTestPanel.style.display = loadTestPanel.dataset.open === '1' ? '' : (lt.running ? '' : loadTestPanel.style.display);
    if (document.activeElement !== ltTargetSel) ltTargetSel.value = lt.target;
    if (document.activeElement !== ltDuration) ltDuration.value = lt.durationSec;
    if (document.activeElement !== ltConcurrency) ltConcurrency.value = lt.concurrency;
    if (document.activeElement !== ltRps) ltRps.value = lt.maxRps;
    ltStatus.textContent = lt.running ? 'running…' : (lt.points.length ? 'stopped' : '');
    if (!lt.ohaAvailable && lt.ohaChecked) {
      ltNote.className = 'inline-note err';
      ltNote.textContent = 'oha is not installed. Install it: brew install oha (macOS) or cargo install oha, then retry. No traffic is sent without it.';
    } else if (lt.error) {
      ltNote.className = 'inline-note err';
      ltNote.textContent = lt.error;
    } else {
      ltNote.className = 'inline-note';
      ltNote.textContent = 'Each point is a real 3s oha burst, logged live below.';
    }
    const terminalText = (lt.logTail || []).join('\\n') || 'Waiting for a load test.';
    if (ltTerminal.textContent !== terminalText) {
      ltTerminal.textContent = terminalText;
      ltTerminal.scrollTop = ltTerminal.scrollHeight;
    }
    renderChart(ltChart, lt.points.map((p) => p.rps), '#6b3fd6');
    const last = lt.points[lt.points.length - 1];
    const instances = lt.instanceCount == null ? '—' : lt.instanceCount;
    const configStats = '<span title="' + esc(lt.instanceCountNote || '') + '">instances <b>' + instances + '</b></span><span>concurrency <b>' + lt.concurrency + '</b></span>';
    ltStats.innerHTML = configStats + (last
      ? '<span>RPS <b>' + last.rps.toFixed(1) + '</b></span><span>avg <b>' + last.avgMs.toFixed(1) + 'ms</b></span><span>p95 <b>' + last.p95Ms.toFixed(1) + 'ms</b></span><span>errors <b>' + last.errors + '</b></span><span>total <b>' + last.total + '</b></span>'
      : '');
  }

  function renderTelemetry(state) {
    telemetryToggleBtn.textContent = state.liveTelemetry.enabled ? 'Disable telemetry' : 'Enable telemetry';
    telemetryTag.textContent = state.liveTelemetry.enabled ? 'live' : 'off';
    const pts = state.liveTelemetry.points || [];
    const total = pts.reduce((sum, point) => sum + Number(point.total || 0), 0);
    const failed = pts.reduce((sum, point) => sum + Number(point.failed || 0), 0);
    const weightedDuration = pts.reduce((sum, point) => sum + Number(point.avgMs || 0) * Number(point.total || 0), 0);
    const averageMs = total ? weightedDuration / total : null;
    aiStats.innerHTML = '<span>requests (30m) <b>' + total + '</b></span><span>failed <b>' + failed +
      '</b></span><span>avg duration <b>' + (averageMs != null ? averageMs.toFixed(1) : '—') + 'ms</b></span>';
    const traces = state.liveTelemetry.traces || [];
    aiTraces.textContent = traces.length
      ? traces.map((item) => {
          const severity = item.kind === 'exception' ? 'exception' : 'severity ' + item.severity;
          const operation = item.operationId ? ' · operation ' + item.operationId : '';
          return '[' + item.t + '] ' + severity + operation + '\\n' + item.message;
        }).join('\\n\\n')
      : 'No traces or exceptions ingested in the last 30 minutes.';
    aiError.textContent = state.liveTelemetry.error || '';
  }

  function renderCommands(state) {
    const cmds = state.commands || [];
    if (!cmds.length) { cmdlog.style.display = 'none'; return; }
    cmdlog.style.display = '';
    const running = cmds.filter((c) => c.status === 'run').length;
    cmdlogSub.textContent = running ? (running + ' running…') : (cmds.length + ' call' + (cmds.length === 1 ? '' : 's'));
    cmdlogList.innerHTML = cmds.map((c) => {
      const badge = c.kind === 'az' ? 'az' : c.kind === 'rest' ? 'REST' : c.kind === 'shell' ? 'shell' : c.kind === 'app' ? 'App' : 'http';
      const st = c.status === 'run' ? '<span class="cst run">running</span>' : c.status === 'err' ? '<span class="cst err">error</span>' : '<span class="cst ok">ok</span>';
      const time = c.ts ? '<span class="ctime">' + esc(new Date(c.ts).toLocaleTimeString()) + '</span>' : '';
      const ms = c.ms != null ? '<span class="cms">' + c.ms + 'ms</span>' : '';
      const note = c.note ? '<span class="cnote">' + esc(c.note) + '</span>' : '';
      const purpose = c.purpose ? '<div class="cpurpose">' + esc(c.purpose) + '</div>' : '';
      return '<div class="cmd ' + c.status + '"><div class="chead"><span class="ckind ' + c.kind + '">' + badge + '</span><span class="ctitle">' + esc(c.title || '') + '</span>' + st + time + ms + note + '</div>' + purpose + '<pre class="ccmd">' + esc(c.cmd || '') + '</pre></div>';
    }).join('');
  }

  function renderInvocations(state) {
    const items = state.invocations || [];
    const running = items.filter((item) => item.phase === 'running').length;
    invTotal.textContent = running ? (running + ' running · ' + items.length + ' event' + (items.length === 1 ? '' : 's')) : (items.length + ' event' + (items.length === 1 ? '' : 's'));
    clearInvocationsBtn.disabled = !items.length;
    if (!items.length) { invList.innerHTML = '<div class="empty">Waiting for local or Azure trigger activity.</div>'; return; }
    invList.innerHTML = items.map((e) => {
      const cls = e.phase === 'running' ? 'run' : e.ok ? 'ok' : 'bad';
      const phase = e.phase === 'running' ? 'Running' : e.ok ? 'Completed' : 'Failed';
      const status = e.status ? (phase + ' · HTTP ' + e.status) : phase;
      const duration = e.ms != null ? (e.ms + ' ms') : '';
      const origin = e.origin === 'scheduled' ? 'Scheduled' : e.origin === 'manual' ? 'Manual' : 'Runtime';
      return '<div class="invocation ' + cls + '">' +
        '<div class="inv-head"><span class="inv-badge">' + esc(e.trigger) + '</span>' +
        '<span class="inv-target">' + esc(origin + ' · ' + (e.target === 'azure' ? 'Azure Function App' : 'Local function')) + '</span>' +
        '<span class="inv-status">' + esc(status) + (duration ? ' · ' + esc(duration) : '') + '</span>' +
        '<span class="inv-time">#' + e.id + ' · ' + esc(e.time) + '</span></div>' +
        '<div class="inv-note">' + esc(e.note || (e.phase === 'running' ? 'Trigger is running.' : e.ok ? 'Trigger completed.' : 'Trigger failed.')) + '</div></div>';
    }).join('');
  }

  function renderDigest(state) {
    const event = (state.invocations || [])[0];
    if (!event || !event.response) {
      digestPanel.classList.remove('show');
      digestBody.innerHTML = '';
      digestMeta.textContent = '';
      return;
    }
    const origin = event.origin === 'scheduled' ? 'Scheduled' : event.origin === 'manual' ? 'Manual' : 'Runtime';
    digestMeta.textContent = origin + ' ' + event.trigger + ' · ' + (event.target === 'azure' ? 'Azure Function App' : 'Local function') + ' · #' + event.id + ' · ' + event.time;
    digestBody.innerHTML = renderMarkdown(event.response);
    digestPanel.classList.add('show');
  }

  function render(state) {
    latest = state;
    instructions.style.display = state.target === 'azure' ? 'none' : '';
    if (state.target === 'local') instructions.open = true;
    renderTriggers(state);
    renderDoctor(state);
    renderSource(state);
    renderLocal(state);
    renderDeployment(state);
    renderInvoke(state);
    renderLoadTest(state);
    renderTelemetry(state);
    renderCommands(state);
    renderInvocations(state);
    renderDigest(state);
    if (typeof window.applyCommandState === 'function') window.applyCommandState(state);
    skillName.textContent = state.hero && state.hero.title ? state.hero.title : 'Skill';
    promptPreview.textContent = state.prompt || '';
  }

  const es = new EventSource('/events');
  es.addEventListener('state', (e) => render(JSON.parse(e.data)));
  setInterval(() => { if (latest) renderInvoke(latest); }, 500);

  triggersEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.trig');
    if (!btn || btn.disabled) return;
    try {
      if (latest && latest.trigger === 'http') await saveHttpRequestDraftNow();
      if (latest && latest.target === 'local' && (latest.trigger === 'queue' || latest.trigger === 'connector')) {
        await saveTriggerPayloadDraftNow(latest.trigger);
      }
    } catch (error) {
      setStatus(error.message);
      return;
    }
    if (btn.dataset.function) await postJson('/az/select-function', { functionName: btn.dataset.function });
    else await postJson('/select-trigger', { trigger: btn.dataset.id });
  });
  function timerSchedulePayload() {
    const cadence = timerCadence.value;
    if (cadence === 'weekly') {
      return { cadence, weekday: Number(timerWeekday.value), localTime: timerWeeklyTime.value };
    }
    if (cadence === 'hourly') {
      return { cadence, hourlyMinute: Number(timerMinute.value) };
    }
    return { cadence: 'daily', localTime: timerTime.value };
  }
  function applyTimerSchedule() {
    timerStatus.textContent = 'Applying…';
    postJson('/timer-schedule', timerSchedulePayload()).catch((error) => {
      timerStatus.textContent = error.message || 'Could not apply schedule';
      timerStatus.className = 'schedule-status err';
    });
  }
  [timerCadence, timerTime, timerWeekday, timerWeeklyTime, timerMinute].forEach((control) => {
    control.addEventListener('change', applyTimerSchedule);
  });

  sourceCustomize.addEventListener('click', () => {
    sourceEditorOpen = true;
    renderSourceWorkspace(latest);
    sourceRelativePath.focus();
    sourceRelativePath.select();
  });
  sourceCancel.addEventListener('click', () => {
    sourceEditorOpen = false;
    if (latest) renderSourceWorkspace(latest);
  });
  sourceCreate.addEventListener('click', async () => {
    const source = latest && latest.sourceWorkspace ? latest.sourceWorkspace : {};
    const moving = Boolean(source.materialized);
    if (moving && !window.confirm('Move the complete generated app to ' + sourceRelativePath.value + '?')) return;
    sourceCreate.disabled = true;
    setStatus(moving ? 'Moving generated app...' : 'Creating generated app...');
    const result = await postJson(moving ? '/source/move-current' : '/source/create', moving
      ? { confirm: true, relativePath: sourceRelativePath.value }
      : { mode: 'current', relativePath: sourceRelativePath.value });
    if (result.ok) {
      sourceEditorOpen = false;
      if (latest) renderSourceWorkspace(latest);
    }
    setStatus(result.message || (result.ok ? (moving ? 'Generated app moved.' : 'Generated app created.') : 'Could not update generated app.'));
  });
  sourceRemove.addEventListener('click', async () => {
    const source = latest && latest.sourceWorkspace ? latest.sourceWorkspace : {};
    if (!window.confirm('Remove the generated app at ' + source.destination + '? Removal stops if generated files changed.')) return;
    sourceRemove.disabled = true;
    setStatus('Checking and removing owned files...');
    const result = await postJson('/source/remove', { confirm: true });
    if (result.ok) {
      sourceEditorOpen = false;
      if (latest) renderSourceWorkspace(latest);
    }
    setStatus(result.message || (result.ok ? 'Generated app removed.' : 'Nothing was removed.'));
  });

  targetLocalBtn.addEventListener('click', () => postJson('/select-target', { target: 'local' }));
  targetAzureBtn.addEventListener('click', () => postJson('/select-target', { target: 'azure' }));
  modelSubscription.addEventListener('change', () => postJson('/models/select-subscription', { subscription: modelSubscription.value }));
  modelSource.addEventListener('change', () => postJson('/models/select-source', { source: modelSource.value }));
  modelResource.addEventListener('change', () => {
    const binding = latest.modelBinding || {};
    const resources = modelSource.value === 'gateway' ? (binding.gateways || []) : (binding.foundry || []);
    const resource = resources.find((item) => item.id === modelResource.value);
    postJson('/models/select-choice', { resourceId: modelResource.value, modelId: resource && resource.models[0] ? resource.models[0].id : '' });
  });
  modelModel.addEventListener('change', () => postJson('/models/select-choice', { resourceId: modelResource.value, modelId: modelModel.value }));
  modelRefresh.addEventListener('click', () => postJson('/models/refresh'));
  doctorToggleBtn.addEventListener('click', () => {
    doctorPanel.hidden = !doctorPanel.hidden;
    doctorToggleBtn.setAttribute('aria-expanded', String(!doctorPanel.hidden));
  });
  doctorRunBtn.addEventListener('click', async () => {
    try {
      const result = await postJson('/doctor/run');
      if (result.doctor && latest) {
        latest = { ...latest, doctor: result.doctor, doctorRunning: false };
        renderDoctor(latest);
      }
      if (!result.ok) setStatus(result.message || 'Doctor could not complete.');
    } catch (error) {
      if (latest) {
        latest = { ...latest, doctorRunning: false };
        renderDoctor(latest);
      }
      setStatus(error.message || 'Doctor could not complete.');
    }
  });
  subSel.addEventListener('change', () => { setStatus('Loading Function Apps…'); postJson('/az/select-subscription', { subscription: subSel.value }).then(() => setStatus('')); });
  appSel.addEventListener('change', () => { if (!appSel.value) return; setStatus('Discovering functions…'); postJson('/az/select-app', { resourceId: appSel.value }).then(() => setStatus('')); });
  refreshAppsBtn.addEventListener('click', () => postJson('/az/refresh-apps'));
  registerAppProject.addEventListener('click', async () => {
    if (latest && latest.sourceWorkspace && latest.sourceWorkspace.mode === 'current') {
      const destination = latest.sourceWorkspace.destination;
      if (!window.confirm('Move the complete generated app from ' + destination + ' to an isolated workspace and create a GitHub session? The current-worktree folder is removed only after the move succeeds.')) return;
    }
    registerAppProject.disabled = true;
    setStatus('Preparing the project and GitHub Copilot App session...');
    const r = await postJson('/register-app-project');
    registerAppProject.disabled = Boolean(r.pending);
    setStatus(r.message || (r.ok ? 'Session creation requested.' : 'Session handoff failed.'));
  });

  localToggleBtn.addEventListener('click', async () => {
    if (latest && latest.local.status === 'running') { await postJson('/local/stop'); return; }
    setStatus('Starting local function host (Core Tools, Azurite, venv, func start)…');
    const r = await postJson('/local/start');
    setStatus(r.ok ? 'Local function host running.' : r.message);
  });

  deploymentCancel.addEventListener('click', async () => {
    if (deploymentCancel.disabled) return;
    deploymentCancel.disabled = true;
    const result = await postJson('/deploy-azure/cancel');
    setStatus(result.message || (result.ok ? 'Cancellation requested.' : 'Could not cancel deployment.'));
  });
  deployAzureBtn.addEventListener('click', () => {
    if (deployAzureBtn.disabled) return;
    deploymentOutput.hidden = false;
    deploymentOutput.open = true;
    deploymentSummaryEl.textContent = 'Preparing isolated deployment...';
  });

  function currentHttpRequestPayload() {
    const headersText = httpRequestHeaders.value;
    const bodyText = httpRequestBody.value;
    for (const [label, text, allowEmpty] of [
      ['HTTP headers', headersText, false],
      ['HTTP body', bodyText, true],
    ]) {
      if (allowEmpty && !text.trim()) continue;
      let parsed;
      try { parsed = JSON.parse(text || '{}'); }
      catch (error) { throw new Error(label + ' must be valid JSON. ' + error.message); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(label + ' must be a JSON object.');
      }
    }
    return { headersText, bodyText };
  }

  let httpDraftTimer = null;
  async function saveHttpRequestDraftNow() {
    clearTimeout(httpDraftTimer);
    const result = await postJson('/http-request/draft', currentHttpRequestPayload());
    if (!result.ok) throw new Error(result.message || 'HTTP request is invalid.');
    if (result.bodyText) httpRequestBody.value = result.bodyText;
    const overridden = result.overriddenHeaders || [];
    httpRequestNote.textContent = overridden.length
      ? 'Azure Functions Hosted Skills Preview will override ' + overridden.join(', ') + ' with application/json.'
      : result.persisted
        ? 'Saved for this canvas instance. POST sends this JSON object exactly.'
        : 'Valid for this request, but not saved because the body contains credential-like data.';
    httpRequestNote.className = 'inline-note http-request-note';
    return result;
  }
  function scheduleHttpRequestDraftSave() {
    clearTimeout(httpDraftTimer);
    httpDraftTimer = setTimeout(() => {
      saveHttpRequestDraftNow().catch((error) => {
        httpRequestNote.textContent = error.message;
        httpRequestNote.className = 'inline-note http-request-note err';
      });
    }, 250);
  }
  httpRequestHeaders.addEventListener('input', scheduleHttpRequestDraftSave);
  httpRequestBody.addEventListener('input', scheduleHttpRequestDraftSave);

  function currentTriggerPayloadDraft(trigger) {
    const value = triggerTestInput.value;
    let payload;
    try { payload = JSON.parse(value); }
    catch (error) { throw new Error((trigger === 'queue' ? 'Queue message' : 'Microsoft 365 Inbox dry-run payload') + ' must be valid JSON. ' + error.message); }
    if (trigger === 'queue' && (!payload || typeof payload !== 'object' || Array.isArray(payload))) {
      throw new Error('Queue message must be a JSON object.');
    }
    if (trigger === 'connector' && (!Array.isArray(payload) || !payload.length || payload.some((item) => !item || typeof item !== 'object' || Array.isArray(item)))) {
      throw new Error('Microsoft 365 Inbox dry-run payload must be a non-empty JSON array of email objects.');
    }
    return { trigger, value };
  }

  let triggerDraftTimer = null;
  async function saveTriggerPayloadDraftNow(trigger) {
    clearTimeout(triggerDraftTimer);
    if (trigger !== 'queue' && trigger !== 'connector') return { ok: true };
    const result = await postJson('/trigger-payload/draft', currentTriggerPayloadDraft(trigger));
    if (!result.ok) throw new Error(result.message || 'Trigger payload is invalid.');
    return result;
  }
  function scheduleTriggerPayloadDraftSave() {
    clearTimeout(triggerDraftTimer);
    const trigger = latest && latest.target === 'local' ? latest.trigger : '';
    if (trigger !== 'queue' && trigger !== 'connector') return;
    triggerDraftTimer = setTimeout(() => {
      saveTriggerPayloadDraftNow(trigger).catch((error) => setStatus(error.message));
    }, 250);
  }
  triggerTestInput.addEventListener('input', scheduleTriggerPayloadDraftSave);

  invokeBtn.addEventListener('click', async () => {
    const invocationRunning = latest && (latest.invocations || []).some((item) => item.phase === 'running');
    if (invocationRunning) {
      if (!window.confirm('An invocation is already running. Cancel it and restart the local function host?')) return;
      const cancelled = await postJson('/invoke/cancel', {});
      setStatus(cancelled.message || (cancelled.ok ? 'Invocation cancelled.' : 'Could not cancel invocation.'));
      return;
    }
    const gate = latest ? computeInvokeGate(latest) : { blocked: false };
    if (gate.blocked) {
      // Never a dead click: explain the exact blocker, run doctor for a full
      // picture, and open the panel that actually fixes it.
      invokeGate.hidden = false;
      invokeGate.className = 'inline-note warn';
      invokeGate.textContent = gate.reason;
      setStatus('Invoke blocked: ' + gate.reason);
      if (gate.focus === 'model' && modelBindingPanel) modelBindingPanel.open = true;
      if (gate.focus === 'source' && sourceWorkspacePanel) {
        sourceWorkspacePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (gate.focus === 'azure' && sourceNote) {
        sourceNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      doctorPanel.hidden = false;
      doctorToggleBtn.setAttribute('aria-expanded', 'true');
      doctorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!(latest && latest.doctorRunning)) postJson('/doctor/run').catch(() => {});
      return;
    }
    if (latest && latest.target === 'local') {
      localLogWrap.open = true;
      localLogWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      localLogWrap.focus({ preventScroll: true });
    }
    if (latest && latest.target === 'azure') telemetryPanel.open = true;
    setStatus('Invoking…');
    digestPanel.classList.remove('show');
    digestBody.innerHTML = '';
    digestMeta.textContent = '';
    const queueInput = latest && latest.trigger === 'queue';
    const connectorInput = latest && latest.target === 'local' && latest.trigger === 'connector';
    if (queueInput) {
      try {
        await saveTriggerPayloadDraftNow('queue');
      } catch {
        setStatus('Queue message must be a valid JSON object.');
        triggerTestInput.focus();
        return;
      }
    }
    if (connectorInput) {
      try {
        await saveTriggerPayloadDraftNow('connector');
      } catch {
        setStatus('Microsoft 365 Inbox dry-run payload must be a non-empty JSON array of email objects.');
        triggerTestInput.focus();
        return;
      }
    }
    const selectedHttpFunction = latest && latest.target === 'azure'
      ? (latest.azure.functions || []).find((fn) => fn.name === latest.azure.functionName)
      : null;
    const httpInput = latest && (
      (latest.target === 'local' && (latest.trigger === 'http' || latest.trigger === 'timer')) ||
      (latest.trigger === 'http' &&
      (selectedHttpFunction && (!(selectedHttpFunction.methods || []).length || selectedHttpFunction.methods.includes('POST')))
      )
    );
    let httpRequest;
    if (httpInput) {
      try {
        await saveHttpRequestDraftNow();
        httpRequest = currentHttpRequestPayload();
      } catch (error) {
        parametersPanel.open = true;
        httpRequestNote.textContent = error.message;
        httpRequestNote.className = 'inline-note http-request-note err';
        (error.message.startsWith('HTTP headers') ? httpRequestHeaders : httpRequestBody).focus();
        setStatus(error.message);
        return;
      }
    }
    const r = await postJson(
      '/invoke',
      httpInput
        ? { httpRequest }
        : latest && latest.target === 'azure'
          ? { input: triggerTestInput.value }
          : queueInput || connectorInput ? { prompt: triggerTestInput.value } : {},
    );
    if (r.ok) setStatus((r.result.ok ? 'Invoked: ' : 'Invoke failed: ') + (r.result.note || ''));
    else {
      if (httpInput) {
        parametersPanel.open = true;
        httpRequestNote.textContent = r.message || 'HTTP request failed.';
        httpRequestNote.className = 'inline-note http-request-note err';
        httpRequestBody.focus({ preventScroll: true });
      }
      setStatus(r.message);
    }
  });

  openAiBtn.addEventListener('click', async () => {
    setStatus('Resolving Application Insights…');
    const r = await postJson('/app-insights/open');
    if (r.ok) { window.open(r.url, '_blank'); setStatus(''); } else setStatus(r.message);
  });

  const telemetryToggle = document.getElementById('telemetry-toggle');
  telemetryToggle.addEventListener('click', async () => {
    if (latest && latest.liveTelemetry.enabled) { await postJson('/telemetry/stop'); return; }
    setStatus('Resolving Application Insights…');
    const r = await postJson('/telemetry/start');
    setStatus(r.ok ? '' : r.message);
  });

  loadTestToggleBtn.addEventListener('click', async () => {
    if (latest && latest.loadTest.running) { await postJson('/load-test/stop'); return; }
    loadTestPanel.style.display = '';
    loadTestPanel.dataset.open = '1';
    await postJson('/load-test/start', {
      target: ltTargetSel.value,
      durationSec: Number(ltDuration.value) || 60,
      concurrency: Number(ltConcurrency.value) || 16,
      maxRps: Number(ltRps.value) || 50,
    });
  });

  clearInvocationsBtn.addEventListener('click', async () => {
    await postJson('/clear', {});
    setStatus('Trigger activity cleared.');
  });

  document.getElementById('edit-instructions').addEventListener('click', async () => {
    setStatus('Opening agent instructions in VS Code...');
    const r = await postJson('/edit-instructions-vscode');
    setStatus(r.ok ? 'Opened agent instructions in VS Code.' : r.message);
  });
</script>` : ''}${!withFullClient ? `<script>${retainedHostedSkillsClient()}</script>` : ''}
</body>
</html>`;
}
