import fs from 'node:fs';
import assert from 'node:assert/strict';
import { resolveAgentModel, loadModelRouting } from '../scripts/resolve-agent-model.mjs';

const config = loadModelRouting();

assert.equal(config.status, 'OWNER_APPROVED', 'model routing must be owner approved');
assert.ok(config.model_tiers.GPT_5_6_SOL_EXTRA_HIGH, 'missing GPT_5_6_SOL_EXTRA_HIGH');
assert.ok(config.model_tiers.GPT_5_5_EXTRA_HIGH, 'missing GPT_5_5_EXTRA_HIGH');
assert.ok(config.model_tiers.GPT_5_5_MEDIUM, 'missing GPT_5_5_MEDIUM');

const expectedRoleTiers = {
  BA: 'GPT_5_6_SOL_EXTRA_HIGH',
  PO: 'GPT_5_6_SOL_EXTRA_HIGH',
  PM: 'GPT_5_6_SOL_EXTRA_HIGH',
  CMO: 'GPT_5_6_SOL_EXTRA_HIGH',
  DEV: 'GPT_5_5_MEDIUM',
  'Content Creator': 'GPT_5_5_MEDIUM',
  'Content creater': 'GPT_5_5_MEDIUM',
  Designer: 'GPT_5_5_MEDIUM'
};

for (const [role, expected] of Object.entries(expectedRoleTiers)) {
  const result = resolveAgentModel({ role }, { config });
  assert.equal(result.model_tier, expected, `${role} should resolve to ${expected}`);
}

const expectedAgentTiers = {
  'g0-case-controller': 'GPT_5_6_SOL_EXTRA_HIGH',
  'g7-proof-qa': 'GPT_5_6_SOL_EXTRA_HIGH',
  'product-rd-liaison': 'GPT_5_6_SOL_EXTRA_HIGH',
  'product-owner-agent': 'GPT_5_6_SOL_EXTRA_HIGH',
  'ba-agent': 'GPT_5_6_SOL_EXTRA_HIGH',
  'pm-agent': 'GPT_5_6_SOL_EXTRA_HIGH',
  'cmo-agent': 'GPT_5_6_SOL_EXTRA_HIGH',
  'mkt-strategist': 'GPT_5_5_EXTRA_HIGH',
  'content-producer': 'GPT_5_5_EXTRA_HIGH',
  'channel-operator': 'GPT_5_5_EXTRA_HIGH',
  'performance-analyst': 'GPT_5_5_EXTRA_HIGH',
  'product-marketing-context': 'GPT_5_5_EXTRA_HIGH',
  'dev-agent': 'GPT_5_5_MEDIUM',
  'content-creator': 'GPT_5_5_MEDIUM',
  designer: 'GPT_5_5_MEDIUM',
  'tester-agent': 'GPT_5_5_MEDIUM'
};

for (const [agent, expected] of Object.entries(expectedAgentTiers)) {
  const result = resolveAgentModel(agent, { config });
  assert.equal(result.model_tier, expected, `${agent} should resolve to ${expected}`);
  assert.notEqual(result.owner_label, null, `${agent} should have a model label`);
}

assert.equal(
  resolveAgentModel({ agent: 'unknown-mkt-agent', team: 'marketing' }, { config }).model_tier,
  'GPT_5_5_EXTRA_HIGH',
  'unknown marketing team agent should use MKT default'
);
assert.equal(
  resolveAgentModel({ agent: 'unknown-dev-task', team: 'execution' }, { config }).model_tier,
  'GPT_5_5_MEDIUM',
  'unknown execution agent should use execution default'
);
assert.equal(
  resolveAgentModel({ agent: 'unknown-approval-task', intent: 'approval' }, { config }).model_tier,
  'GPT_5_6_SOL_EXTRA_HIGH',
  'unknown approval agent should use strategic approval default'
);
assert.equal(
  resolveAgentModel({ agent: 'unknown-agent' }, { config }).model_tier,
  'REQUIRES_OWNER_CONFIRMATION',
  'unknown agent without team/intent should not be auto-assigned'
);

const routingText = fs.readFileSync('marketing-agent-pack/governance/model-routing.md', 'utf8');
for (const token of [
  'BA, PO, PM, CMO',
  'DEV, Content Creator, Designer',
  'Agent thuộc team Marketing',
  'Không tự diễn giải các nhãn này thành tên model API public'
]) {
  assert.ok(routingText.includes(token), `model-routing.md missing: ${token}`);
}

console.log('PASS: owner-approved agent model routing contract');
