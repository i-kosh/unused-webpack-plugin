const path = require('path')
const { UnusedPlugin } = require('../dist/index')

/** @type {import('webpack').Configuration} */
const config = {
  mode: 'development',
  entry: path.resolve(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  plugins: [
    new UnusedPlugin({
      exclude: ['**/dist', '**/webpack.*.{js,ts}'],
      outputFile: `${__dirname}/unused.json`,
    }),
  ],
}

module.exports = config
