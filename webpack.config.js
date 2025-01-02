const path = require('path');

module.exports = {
  // ... other webpack configurations
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer/"),
    }
  }
};
