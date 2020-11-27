const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, 'src/scripts/index.js'),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, '../', 'build'),
    filename: 'content.js',
  },
  resolve: {
    modules: [path.resolve(__dirname, '../', 'node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: path.join(__dirname, 'src'),
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
}
