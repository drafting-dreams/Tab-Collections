const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'background.js'),
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../', 'build'),
    filename: 'background.js',
  },
  resolve: {
    modules: [path.resolve(__dirname, '../', 'node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
}
