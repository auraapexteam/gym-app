module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  // lucide-react-native ships .mjs modules — run them through Babel too.
  transform: {
    '\\.mjs$': 'babel-jest',
  },
  // These packages ship untranspiled ESM/TS and must be run through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage|@react-navigation|react-native-.*|lucide-react-native)/)',
  ],
};
