const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  },
  module: {
      rules: [
          { test: /\.ts$/, use: 'ts-loader', exclude: 'node_modules/' },
      ]
  }
}
