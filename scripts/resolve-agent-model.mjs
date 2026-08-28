#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const routingPath = path.join(repoRoot, 'marketing-agent-pack', 'governance', 'model-routing.json');

export function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function loadModelRouting(filePath = routingPath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function tierPayload(config, modelTier, source, matchedKey, extra = {}) {
  const tier = config.model_tiers[modelTier];
  if (!tier) {
    throw new Error(`Unknown model tier in routing config: ${modelTier}`);
  }
  return {
    model_tier: modelTier,
    owner_label: tier.owner_label,
    normalized_label: tier.normalized_label,
    source,
    matched_key: matchedKey,
    ...extra
  };
}

export function resolveAgentModel(input, options = {}) {
  const config = options.config || loadModelRouting(options.filePath || routingPath);
  const raw = typeof input === 'string' ? { agent: input } : (input || {});
  const agentKey = normalizeKey(raw.agent || raw.agent_id || raw.name || raw.role);
  const roleKey = normalizeKey(raw.role || raw.role_group || raw.agent || raw.name);
  const teamKey = normalizeKey(raw.team || raw.team_group || raw.department);

  if (agentKey && config.agent_overrides?.[agentKey]) {
    const override = config.agent_overrides[agentKey];
    return tierPayload(config, override.model_tier, 'agent_overrides', agentKey, {
      display_name: override.display_name,
      role_group: override.role_group,
      reason: override.reason
    });
  }

  if (roleKey && config.role_defaults?.[roleKey]) {
    return tierPayload(config, config.role_defaults[roleKey], 'role_defaults', roleKey);
  }

  if (teamKey && config.team_defaults?.[teamKey]) {
    return tierPayload(config, config.team_defaults[teamKey], 'team_defaults', teamKey);
  }

  const intentKey = normalizeKey(raw.intent || raw.work_type || raw.task_type);
  const fallback = config.fallback_policy || {};
  if (['strategy', 'approval', 'decision', 'owner_review', 'proof_qa'].includes(intentKey)) {
    return tierPayload(config, fallback.strategy_or_approval_unknown, 'fallback_policy', intentKey);
  }
  if (['marketing', 'mkt', 'campaign', 'market_research', 'performance'].includes(teamKey || intentKey)) {
    return tierPayload(config, fallback.marketing_team_unknown, 'fallback_policy', teamKey || intentKey);
  }
  if (['execution', 'code', 'design', 'asset', 'test'].includes(teamKey || intentKey)) {
    return tierPayload(config, fallback.execution_unknown, 'fallback_policy', teamKey || intentKey);
  }

  return {
    model_tier: fallback.otherwise || 'REQUIRES_OWNER_CONFIRMATION',
    owner_label: null,
    normalized_label: null,
    source: 'fallback_policy',
    matched_key: agentKey || roleKey || teamKey || 'unknown',
    reason: 'Không đủ thông tin để gán model an toàn; cần cập nhật model-routing.json hoặc hỏi owner.'
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [agent, role, team] = process.argv.slice(2);
  if (!agent) {
    console.error('Usage: node scripts/resolve-agent-model.mjs <agent> [role] [team]');
    process.exit(2);
  }
  const result = resolveAgentModel({ agent, role, team });
  console.log(JSON.stringify(result, null, 2));
  if (result.model_tier === 'REQUIRES_OWNER_CONFIRMATION') {
    process.exit(1);
  }
}
