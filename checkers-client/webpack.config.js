const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },
  resolve: {
    fallback: { util: false },
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        include: path.resolve(__dirname, 'src')
      }
    ],
  },
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
  },
  performance: {
    maxAssetSize: 3000000,
    maxEntrypointSize: 3000000,
    hints: 'warning'
  }
}
