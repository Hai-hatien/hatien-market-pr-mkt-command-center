function nowIso_() {
  return Utilities.formatDate(
    new Date(),
    'Asia/Ho_Chi_Minh',
    "yyyy-MM-dd'T'HH:mm:ss'+07:00'"
  );
}

function uuid_() {
  return Utilities.getUuid();
}

function normalizeText_(value) {
  return String(value || '').trim();
}

function sha256Hex_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function (b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function makeIdempotencyKey_(source, externalId, payload) {
  const raw = JSON.stringify({
    source: source,
    external_id: externalId,
    payload: payload
  });

  return [
    'HT',
    source,
    externalId,
    sha256Hex_(raw).slice(0, 16)
  ].join(':');
}

function safeJsonParse_(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    return {
      raw: text
    };
  }
}

function isBlankRow_(row) {
  return row.every(function (cell) {
    return normalizeText_(cell) === '';
  });
}