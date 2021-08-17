const {
  action,
  determineModuleName,
  findAllValuesDirectories,
  getModuleObject
} = require('./action');

describe('action', () => {

  test('should generate (stats only) report for sample project', async () => {
    // given
    const config = {
      project: './testdata/sampleproject',
      report: './testdata/stats_report.json',
      languages: ['pl','en'],
      statsOnly: true,
      verbose: false
    };

    const expectedReport = {
      'modules': [
        {
          'name': 'app',
          'stats': {
            'default': 12,
            'pl': 1,
            'en': 10
          }
        },
        {
          'name': 'library',
          'stats': {
            'default': 7,
            'pl': 5,
            'en': 0
          }
        }
      ],
      'totalStats': {
        'default': 19,
        'pl': 6,
        'en': 10
      }
    };

    // when
    const result = await action(config);

    // then
    expect(result).toEqual(expectedReport);
  });

  test('should generate (full) report for sample project', async () => {
    // given
    const config = {
      project: './testdata/sampleproject',
      report: './testdata/full_report.json',
      languages: ['pl','en'],
      statsOnly: false,
      verbose: false
    };

    const expectedReport = {
      'modules': [
        {
          'name': 'app',
          'stats': {
            'default': 12,
            'pl': 1,
            'en': 10
          },
          'resources': {
            'default': [
              'app_name',
              'rich_setup_first_step_title',
              'rich_setup_first_step_description',
              'rich_setup_add_channel',
              'rich_setup_cancel',
              'rich_setup_in_progress',
              'feed_error_message',
              'sync_error_canceled',
              'sync_error_no_data',
              'sync_error_other',
              'numberOfSongsAvailable',
              'planets_array'
            ],
            'pl': [
              'numberOfSongsAvailable'
            ],
            'en': [
              'app_name',
              'rich_setup_first_step_title',
              'rich_setup_first_step_description',
              'rich_setup_add_channel',
              'rich_setup_cancel',
              'rich_setup_in_progress',
              'feed_error_message',
              'sync_error_canceled',
              'sync_error_no_data',
              'sync_error_other'
            ]
          }
        },
        {
          'name': 'library',
          'stats': {
            'default': 7,
            'pl': 5,
            'en': 0
          },
          'resources': {
            'default': [
              'tif_channel_setup_title',
              'tif_channel_setup_description',
              'tif_channel_setup_cancel',
              'tif_channel_scan_canceled',
              'tif_channel_error_unknown',
              'tif_channel_error_no_channels',
              'tif_channel_error_no_programs'
            ],
            'pl': [
              'tif_channel_setup_title',
              'tif_channel_setup_description',
              'tif_channel_setup_cancel',
              'tif_channel_scan_canceled',
              'tif_channel_error_unknown'
            ],
            'en': []
          }
        }
      ],
      'totalStats': {
        'default': 19,
        'pl': 6,
        'en': 10
      }
    };

    // when
    const result = await action(config);

    // then
    expect(result).toEqual(expectedReport);
  });
});

describe('get module object', () => {
  test('should return empty object of module', () => {
    // given
    const modules = new Map();
    const newModule = { name: 'none', stats: { default: 0 }, resources: { default: [] }};

    // when
    const moduleObj = getModuleObject(modules, 'none');

    // then
    expect(moduleObj).toEqual(newModule);
  });

  test('should return filled object of module', () => {
    // given
    const sthModule = { name: 'something', stats: { default: 1 }, resources: { default: ['some_res'] }};
    const modules = new Map();
    modules.set(sthModule.name, sthModule);

    // when
    const moduleObj = getModuleObject(modules, 'something');

    // then
    expect(moduleObj).toEqual(sthModule);
  });
});

describe('find all values directories', () => {
  test('should find two directories', () => {
    // given, when
    const result = findAllValuesDirectories('./testdata/sampleproject');

    // then
    expect(result.length).toBe(2);
    expect(result[0]).toMatch('/app/src/main/res/values');
    expect(result[1]).toMatch('/library/src/main/res/values');
  });
});

describe('determine module name', () => {
  test('should find single name', () => {
    // given
    const dir = '/Home/User/Workspace/project/settings/src/debug/res/values';
    const pathToProject = '/Home/User/Workspace/project';

    // when
    const result = determineModuleName(dir, pathToProject);

    // then
    expect(result).toEqual('settings');
  });

  test('should find combined name', () => {
    // given
    const dir = '/Home/User/Workspace/project/devtools/contract/src/main/res/values';
    const pathToProject = '/Home/User/Workspace/project';

    // when
    const result = determineModuleName(dir, pathToProject);

    // then
    expect(result).toEqual('devtools/contract');
  });
});
