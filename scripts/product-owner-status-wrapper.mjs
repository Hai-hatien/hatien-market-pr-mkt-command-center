const targetSha = String(process.env.PO_TARGET_SHA || '').trim();
const targetBranch = String(process.env.PO_TARGET_BRANCH || '').trim();

if (targetSha) process.env.GITHUB_SHA = targetSha;
if (targetBranch) {
  process.env.GITHUB_HEAD_REF = targetBranch;
  process.env.GITHUB_REF_NAME = targetBranch;
}

await import('./product-owner-status.mjs');
