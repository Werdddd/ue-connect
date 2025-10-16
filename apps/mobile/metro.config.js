const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('csv'); // 👈 allow Metro to bundle CSV files

module.exports = config;