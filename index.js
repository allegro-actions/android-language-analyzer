const core = require('@actions/core');
const action = require('./action');

const prefix = core.getInput('prefix');
const versioning = core.getInput('versioning');
const force = core.getInput('force');

const result = action();

core.setOutput('result', result);
