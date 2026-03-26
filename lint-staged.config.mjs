import path from 'node:path';

const relTo = (root) => (files) =>
  files.map((f) => path.relative(root, f)).filter(Boolean);

function agendaTasks(files) {
  const args = relTo('oftagenda')(files).join(' ');
  if (!args) return 'true';
  return [
    `pnpm --filter ./oftagenda exec oxlint --fix --type-aware ${args}`,
    `pnpm --filter ./oftagenda exec oxfmt --write --no-error-on-unmatched-pattern ${args}`,
  ];
}

function chatbotTasks(files) {
  const args = relTo('oftchatbot')(files).join(' ');
  if (!args) return 'true';
  return [
    `pnpm --filter ./oftchatbot exec oxlint --fix --type-aware ${args}`,
    `pnpm --filter ./oftchatbot exec oxfmt --write --no-error-on-unmatched-pattern ${args}`,
  ];
}

/** @type {import('lint-staged').Configuration} */
export default {
  'oftagenda/**/*.{js,jsx,ts,tsx,mjs,cjs}': agendaTasks,
  'oftchatbot/**/*.{js,jsx,ts,tsx,mjs,cjs}': chatbotTasks,
};
