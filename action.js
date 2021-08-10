const fs = require('fs');
const klawSync = require('klaw-sync');
const xml2js = require('xml2js');
const path = require('path');

const parser = new xml2js.Parser({ attrkey: 'attr' });

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
    const files = fs.readdirSync(path);

    for (const file of files) {
      const xmlData = fs.readFileSync(path + '/' + file, { encoding: 'utf8', flag: 'r' });
      const jsonData = await xml2json(xmlData);
      const resources = jsonData.resources;

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
          ids.push(item.attr.name);
        }
      }
    }
  } catch (error) {
    if (error.code != 'ENOENT') {
      console.error(error);
    }
  }
  return ids;
}

function determineModuleName(directory, pathToProject) {
  var moduleName = directory.replace(pathToProject,'').split('/src/')[0];
  if (moduleName.startsWith('/')) {
    moduleName = moduleName.substring(1);
  }
  return moduleName;
}

function findAllValuesDirectories(pathToProject) {
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

function getModuleObject(modules, name) {
  if (modules.has(name)) {
    return modules.get(name);
  } else {
    return { name: name, stats: { default: 0 }, resources: { default: [] }};
  }
}

module.exports = async function action(config) {
  // Determine absolute path to project
  if (!path.isAbsolute(config.project)) {
    config.project = path.join(__dirname, config.project);
  }

  if (config.verbose) {
    console.log('Project path: ' + config.project);
  }

  // Find all "values" directories
  const foundDirectories = findAllValuesDirectories(config.project);

  if (config.verbose) {
    console.log('Found directories: ' + foundDirectories);
  }

  // Report object
  const totalStats = { default: 0 };
  const modules = new Map();

  // Iterate through founded directory
  for (const directory of foundDirectories) {
    const moduleName = determineModuleName(directory, config.project);
    const moduleObj = getModuleObject(modules, moduleName);

    if (config.verbose) {
      console.log('Processsing module: ' + moduleName);
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
      console.log('Module: ' + JSON.stringify(moduleObj, null, 2));
    }

    modules.set(moduleName, moduleObj);
  }

  const report = { modules: Array.from(modules.values()), totalStats: totalStats };
  fs.writeFileSync(config.report, JSON.stringify(report, null, 2));


  if (config.verbose) {
    console.log('Total stats: ' + JSON.stringify(totalStats, null, 2));
  }

  return totalStats;
};
