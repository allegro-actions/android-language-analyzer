const core = require('@actions/core');
const { action } = require('./action');

const projectPath = core.getInput('PROJECT_PATH');
const reportPath = core.getInput('REPORT_PATH');
const supportedLanguages = core.getInput('SUPPORTED_LANGUAGES');
const statsOnly = core.getInput('STATS_ONLY');
const verbose = core.getInput('VERBOSE');

(async () => {
  const result = await action({
    project: projectPath,
    report: reportPath,
    languages: supportedLanguages.split(','),
    statsOnly: statsOnly == 'true',
    verbose: verbose == 'true'
  });
  core.setOutput('result', result);
})().catch(err => {
    console.error(err);
});
