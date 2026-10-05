/**
 * Unit tests for STT model selection (no API key required).
 * Run: node test-stt-models.mjs
 */
const MODEL_RE = /^gemini-(?:\d+(?:\.\d+)?-(?:flash|pro)(?:-[a-z0-9.-]+)?|flash(?:-lite)?-latest|pro-latest)$/;
const EXCLUDED = ['audio', 'tts', 'image', 'live', 'embedding', 'robotics', 'computer-use', 'deep-research', 'custom'];
const STT_PREF = [
  'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest',
  'gemini-2.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 'gemini-3.8-flash-lite', 'gemini-3.5-flash-lite'
];

function normalizeModelId(name) {
  if (typeof name !== 'string') return '';
  name = name.trim();
  if (name.startsWith('models/')) name = name.slice(7);
  return name;
}
function supportedModel(name) {
  name = normalizeModelId(name);
  return !!name && name.length <= 100 && MODEL_RE.test(name) && !EXCLUDED.some(x => name.includes(x));
}
function buildSttCandidates(listedModels, selectedModel) {
  const listed = [...new Set((listedModels || []).map(normalizeModelId).filter(supportedModel))];
  if (!listed.length) return [];
  const selected = normalizeModelId(selectedModel);
  const out = [];
  const push = name => { if (name && listed.includes(name) && !out.includes(name)) out.push(name); };
  for (const pref of STT_PREF) push(pref);
  const rest = listed.slice().sort((a, b) => {
    const rank = name => {
      if (name === selected && name.includes('flash')) return 0;
      if (name.includes('flash-lite')) return 1;
      if (name.includes('flash')) return 2;
      if (name === selected) return 3;
      if (name.includes('pro')) return 5;
      return 4;
    };
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  for (const name of rest) push(name);
  return out.slice(0, 8);
}
function isRetryableSttFailure(err) {
  if (!err) return false;
  if (err.status === 404 || err.status === 400) return true;
  return /unavailable|404|not found|not supported|does not support|denied access|rejected the key or request|Choose a supported|invalid model|thinking/i.test(String(err.message || ''));
}

function assert(cond, msg) {
  if (!cond) throw Error(msg);
}

// Prefer known-good flash from the live list; never invent ids absent from listModels.
const listed = [
  'models/gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-1.5-flash' // may be retired, but if listed it is still a candidate
];
const c1 = buildSttCandidates(listed, 'gemini-2.5-pro');
assert(c1[0] === 'gemini-3.8-flash', 'expected gemini-3.8-flash first when present, got ' + c1[0]);
assert(c1.includes('gemini-2.5-flash'), 'flash should be included');
assert(c1.includes('gemini-2.5-pro'), 'selected pro remains a fallback');
assert(!c1.includes('models/gemini-2.5-pro'), 'models/ prefix must be stripped');
assert(!c1.includes('gemini-2.5-flash-lite'), 'must not invent ids missing from listModels');

// Empty list => no candidates (forces connect/refresh).
assert(buildSttCandidates([], 'gemini-3.8-flash').length === 0, 'empty list must yield no STT candidates');

// Retryable classification.
assert(isRetryableSttFailure({ status: 404, message: 'This Gemini model is unavailable. Reconnect to refresh the model list.' }), '404 retryable');
assert(isRetryableSttFailure({ status: 400, message: 'Gemini rejected the key or request.' }), '400 retryable for STT fallback');
assert(!isRetryableSttFailure({ status: 401, message: 'Gemini rejected this API key.' }), '401 not retryable via status alone without message match');
assert(!isRetryableSttFailure({ status: 429, message: 'quota' }), '429 not retryable');

// Simulate fallback exhausting all candidates.
const tried = [];
let lastError = null;
const failing = buildSttCandidates(['gemini-2.5-pro', 'gemini-2.5-flash'], 'gemini-2.5-pro');
for (const model of failing) {
  tried.push(model);
  lastError = { status: 404, message: 'This Gemini model is unavailable. Reconnect to refresh the model list.' };
  if (isRetryableSttFailure(lastError)) continue;
  throw Error('should continue');
}
assert(tried.length === failing.length, 'must try every candidate');
const finalMsg = 'Transcription failed for every connected Gemini model tried (' + tried.join(', ') + '). ' + lastError.message;
assert(finalMsg.includes('gemini-2.5-flash'), 'final error must name tried models');
assert(finalMsg.includes('unavailable'), 'final error keeps root cause');

console.log('OK stt model selection tests passed');
console.log('sample candidates:', c1.join(', '));
