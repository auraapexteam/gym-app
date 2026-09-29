const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const config = {
  resolver: {
    // Exclude only the app's native project folders. An unanchored `ios/`
    // pattern also matches `node_modules/axios/` and prevents Metro from
    // resolving Axios in Release bundles.
    blockList: new RegExp(`^${projectRoot}[\\\\/](?:android|ios)[\\\\/].*$`),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
