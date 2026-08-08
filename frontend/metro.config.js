const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const config = {
  resolver: {
    // `blacklistRE` is the deprecated name; modern Metro reads `blockList`.
    blockList: /android\/.*|ios\/.*|backend\/.*/,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
