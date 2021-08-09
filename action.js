const fs = require('fs');
const klawSync = require('klaw-sync');
const xml2js = require('xml2js');

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
    return item.path.includes('/res/values') && !item.path.includes('/build/');
  };

  return klawSync(pathToProject, {
    filter: klawFilter,
    depthLimit: -1,
    traverseAll: true,
    nofile: true
  }).map(item => item.path);
}

module.exports = async function action(config) {
  // Find all "values" directories
  const foundDirectories = findAllValuesDirectories(config.project);

  // Report object
  const totalStats = { default: 0 };
  const modules = [];

  // Iterate through founded directory
  for (const directory of foundDirectories) {
    const moduleName = determineModuleName(directory, config.project);
    const resources = { default: 0 };
    const stats = { default: 0 };

    // Fetch string resources from "values"
    resources.default = await findResources(directory);
    stats.default = resources.default.length;
    totalStats.default += resources.default.length;

    // Fetch string resources from "values-xx"
    for (const language of config.languages) {
      resources[language] = await findResources(directory + '-' + language);
      stats[language] = resources[language].length;

      if (totalStats[language] === undefined) {
        totalStats[language] = 0;
      }
      totalStats[language] += resources[language].length;
    }

    // Store data about module
    if (config.statsOnly) {
      modules.push({ name: moduleName, stats: stats });
    } else {
      modules.push({ name: moduleName, resources: resources, stats: stats });
    }
  }

  const report = { modules: modules, totalStats: totalStats };
  fs.writeFileSync(config.report, JSON.stringify(report, null, 2));

  return totalStats;
};
