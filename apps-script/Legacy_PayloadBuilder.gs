function buildEnvelope_(args) {
  const payload = args.payload || {};
  const meta = args.meta || {};
  const sourceSystem = args.source_system || 'apps_script_command_center';
  const entityType = args.entity_type;
  const externalId = args.external_id;

  if (!entityType) throw new Error('Missing entity_type');
  if (!externalId) throw new Error('Missing external_id');

  const priority = normalizeText_(args.priority || payload.priority || 'P3');

  const base = {
    schema_version: '1.0',
    external_id: externalId,
    occurred_at: args.occurred_at || nowIso_(),
    source_system: sourceSystem,
    entity_type: entityType,
    priority: priority,
    payload: payload,
    meta: meta
  };

  base.idempotency_key = makeIdempotencyKey_(sourceSystem, externalId, base);

  return base;
}