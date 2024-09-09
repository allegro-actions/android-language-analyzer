import { getInput, setOutput, error, setFailed } from '@actions/core';
import { action } from './action.js';

const projectPath = getInput('PROJECT_PATH');
const reportPath = getInput('REPORT_PATH');
const supportedLanguages = getInput('SUPPORTED_LANGUAGES');
const statsOnly = getInput('STATS_ONLY');
const verbose = getInput('VERBOSE');

(async () => {
  const result = await action({
    project: projectPath,
    report: reportPath,
    languages: supportedLanguages.split(','),
    statsOnly: statsOnly == 'true',
    verbose: verbose == 'true'
  });
  setOutput('result', result);
})().catch(err => {
    error(err);
    setFailed(err);
});
