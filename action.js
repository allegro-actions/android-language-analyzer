import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { error as _error, setFailed, info } from '@actions/core';
import klawSync from 'klaw-sync';
import { Parser } from 'xml2js';
import { resolve as _resolve } from 'path';

const parser = new Parser({ attrkey: 'attr' });

export function action(config) {
  return internalAction(config);
}
export function determineModuleName(directory, pathToProject) {
  return internalDetermineModuleName(directory, pathToProject);
}
export function findAllValuesDirectories(pathToProject) {
  return internalFindAllValuesDirectories(pathToProject);
}
export function getModuleObject(modules, name) {
  return internalGetModuleObject(modules, name);
}

async function xml2json(xml) {
  return new Promise((resolve, reject) => {
    parser.parseString(xml, function (err, json) {
      if (err) {
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

async function findResources(path) {
  const ids = [];
  try {
    const files = readdirSync(path);

    for (const file of files) {
      const xmlData = readFileSync(path + '/' + file, { encoding: 'utf8', flag: 'r' });
      const jsonData = await xml2json(xmlData);
      const resources = jsonData.resources;

      // Ignore whole file if it begins with: <resources translatable="false">
      if (resources.attr != undefined && resources.attr.translatable == 'false') {
        continue;
      }

      const string = resources.string;
      if (string) {
        for (const item of string) {
          if (item.attr.translatable != 'false') {
            ids.push(item.attr.name);
          }
        }
      }

      const plurals = resources.plurals;
      if (plurals) {
        for (const item of plurals) {
          ids.push(item.attr.name);
        }
      }

      const stringArray = resources['string-array'];
      if (stringArray) {
        for (const item of stringArray) {
          if (item.attr.translatable != 'false') {
            ids.push(item.attr.name);
          }
        }
      }
    }
  } catch (error) {
    if (error.code != 'ENOENT') {
      _error(error);
      setFailed(error);
    }
  }
  return ids;
}

function internalDetermineModuleName(directory, pathToProject) {
  let moduleName = directory.replace(pathToProject,'').split('/src/')[0];
  if (moduleName.startsWith('/')) {
    moduleName = moduleName.substring(1);
  }
  return moduleName;
}

function internalFindAllValuesDirectories(pathToProject) {
  const klawFilter = item => {
    return item.path.endsWith('/res/values') && !item.path.includes('/build/');
  };

  return klawSync(pathToProject, {
    filter: klawFilter,
    depthLimit: -1,
    traverseAll: true,
    nofile: true
  }).map(item => item.path);
}

function internalGetModuleObject(modules, name) {
  if (modules.has(name)) {
    return modules.get(name);
  } else {
    return { name: name, stats: { default: 0 }, resources: { default: [] }};
  }
}

async function internalAction(config) {
  // Determine absolute path to project
  config.project = _resolve(config.project);

  if (config.verbose) {
    info('Project path: ' + config.project);
  }

  // Find all "values" directories
  const foundDirectories = internalFindAllValuesDirectories(config.project);

  if (config.verbose) {
    info('Found directories: ' + foundDirectories);
  }

  // Report object
  const totalStats = { default: 0 };
  const modules = new Map();

  // Iterate through founded directory
  for (const directory of foundDirectories) {
    const moduleName = internalDetermineModuleName(directory, config.project);
    const moduleObj = internalGetModuleObject(modules, moduleName);

    if (config.verbose) {
      info('Processsing directory: ' + directory);
    }

    // Fetch string resources from "values"
    const defaultRes = await findResources(directory);
    if (!config.statsOnly) {
      moduleObj.resources.default = moduleObj.resources.default.concat(defaultRes);
    }
    moduleObj.stats.default += defaultRes.length;
    totalStats.default += defaultRes.length;

    // Fetch string resources from "values-xx"
    for (const language of config.languages) {
      const languageRes = await findResources(directory + '-' + language);

      if (!config.statsOnly) {
        if (moduleObj.resources[language] === undefined) {
          moduleObj.resources[language] = [];
        }
        moduleObj.resources[language] = moduleObj.resources[language].concat(languageRes);
      }

      if (moduleObj.stats[language] === undefined) {
        moduleObj.stats[language] = 0;
      }
      moduleObj.stats[language] += languageRes.length;

      if (totalStats[language] === undefined) {
        totalStats[language] = 0;
      }
      totalStats[language] += languageRes.length;
    }

    if (config.statsOnly) {
      delete moduleObj.resources;
    }

    if (config.verbose) {
      info('Module: ' + JSON.stringify(moduleObj, null, 2));
    }

    modules.set(moduleName, moduleObj);
  }

  const report = { modules: Array.from(modules.values()), totalStats: totalStats };

  if (config.verbose) {
    info('Total stats: ' + JSON.stringify(totalStats, null, 2));
  }

  writeFileSync(config.report, JSON.stringify(report, null, 2));

  return report;
}
