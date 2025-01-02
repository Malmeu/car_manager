const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function override(config) {
  // Remove the existing HtmlWebpackPlugin
  config.plugins = config.plugins.filter(plugin => !(plugin instanceof HtmlWebpackPlugin));

  // Add our configured HtmlWebpackPlugin
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: true
    })
  );

  // Add fallbacks for node modules
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "process": false,
    "path": false,
    "fs": false
  });
  config.resolve.fallback = fallback;

  // Add webpack plugins
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ]);

  return config;
}
