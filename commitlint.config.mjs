/**
 * Conventional Commits, como pede o PRACTICES.md. O preset ja limita os tipos exatamente a
 * feat, fix, docs, style, refactor, perf, test, build, ci, chore e revert.
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
};
