# allegro-actions/android-language-analyzer

### Android App Languages Resources Analyzer

Action generates report about text resources in android project. It scans project's `res` directory looking for `strings`, `array-strings` and `plurals`. In the report you get total number of text resources divided into languages. Optionally you may get list of ids of text resources.

## Basic usage

```
steps:
  - name: Generate report about translation status of android project
    uses: allegro-actions/android-language-analyzer@v1
    with:
      PROJECT_PATH: './androidProjectDir'
      REPORT_PATH: './translation_report.json'
      SUPPORTED_LANGUAGES: 'pl,en,cs'
      STATS_ONLY: false
      VERBOSE: true
```

### Options

- **PROJECT_PATH** represents relative path to the android project directory in the workspace.
- **REPORT_PATH** represents relative path to the report about text resources.
- **SUPPORTED_LANGUAGES** list of languages selected for the report.
- **STATS_ONLY** if `true` then only stats will be reported otherwise resources `id`s will also included.
- **VERBOSE** if `true` logs are printed into console.

## Limitations

- `<string id="someId" translatable="false">..</string>` Action ignores `strings` and `string-array` where `translatable` argument is set to `false`.
- Only simple named `values-xx` directories are scanned. If your selected languages are `pl`, `en-rGB`, `fr` then action looks for `values-pl`, `values-en-rGB`, `values-fr` directories. Any directory with more then one qualifier (like `values-en-sw600dp-land`) is ignored.

## Sample report

Below you can see sample reports generated for `testdata/sampleproject`.

### Stats only

With configuration: `STATS_ONLY: true` and `SUPPORTED_LANGUAGES: pl,en`

```
{
  "modules": [
    {
      "name": "app",
      "stats": {
        "default": 12,
        "pl": 1,
        "en": 10
      }
    },
    {
      "name": "library",
      "stats": {
        "default": 7,
        "pl": 5,
        "en": 0
      }
    }
  ],
  "totalStats": {
    "default": 19,
    "pl": 6,
    "en": 10
  }
}
```

### Full

With configuration: `STATS_ONLY: false` and `SUPPORTED_LANGUAGES: pl,en`

```
{
  "modules": [
    {
      "name": "app",
      "stats": {
        "default": 12,
        "pl": 1,
        "en": 10
      },
      "resources": {
        "default": [
          "app_name",
          "rich_setup_first_step_title",
          "rich_setup_first_step_description",
          "rich_setup_add_channel",
          "rich_setup_cancel",
          "rich_setup_in_progress",
          "feed_error_message",
          "sync_error_canceled",
          "sync_error_no_data",
          "sync_error_other",
          "numberOfSongsAvailable",
          "planets_array"
        ],
        "pl": [
          "numberOfSongsAvailable"
        ],
        "en": [
          "app_name",
          "rich_setup_first_step_title",
          "rich_setup_first_step_description",
          "rich_setup_add_channel",
          "rich_setup_cancel",
          "rich_setup_in_progress",
          "feed_error_message",
          "sync_error_canceled",
          "sync_error_no_data",
          "sync_error_other"
        ]
      }
    },
    {
      "name": "library",
      "stats": {
        "default": 7,
        "pl": 5,
        "en": 0
      },
      "resources": {
        "default": [
          "tif_channel_setup_title",
          "tif_channel_setup_description",
          "tif_channel_setup_cancel",
          "tif_channel_scan_canceled",
          "tif_channel_error_unknown",
          "tif_channel_error_no_channels",
          "tif_channel_error_no_programs"
        ],
        "pl": [
          "tif_channel_setup_title",
          "tif_channel_setup_description",
          "tif_channel_setup_cancel",
          "tif_channel_scan_canceled",
          "tif_channel_error_unknown"
        ],
        "en": []
      }
    }
  ],
  "totalStats": {
    "default": 19,
    "pl": 6,
    "en": 10
  }
}
```

### How to test

Run command: `export INPUT_PROJECT_PATH=./testdata && export INPUT_REPORT_PATH=./report.json && export INPUT_VERBOSE=true && export INPUT_SUPPORTED_LANGUAGES=pl,en && node index.js`