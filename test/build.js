const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const { ufs } = require('unionfs')
const { Volume } = require('memfs')

const { ESBuildPlugin } = require('../src')
const esbuildLoader = require.resolve('../src')

function build(volJson, configure) {
  return new Promise((resolve, reject) => {
    const mfs = Volume.fromJSON(volJson)
    mfs.join = path.join.bind(path)

    let config = {
      mode: 'development',
      devtool: false,

      context: '/',
      entry: '/index.js',
      output: {
        path: '/dist',
        filename: 'index.js',
        libraryTarget: 'commonjs2',
      },

      resolveLoader: {
        alias: {
          'esbuild-loader': esbuildLoader,
        },
      },

      module: {
        rules: [
          {
            test: /\.js$/,
            loader: 'esbuild-loader',
          },
        ],
      },
      plugins: [new ESBuildPlugin()],
    }

    if (typeof configure === 'function') {
      configure(config)
    }

    const compiler = webpack(config)

    compiler.inputFileSystem = ufs.use(fs).use(mfs)
    compiler.outputFileSystem = mfs

    compiler.run((err, stats) => {
      if (err) {
        reject(err)
        return
      }

      if (stats.compilation.errors.length > 0) {
        reject(stats.compilation.errors)
        return
      }

      resolve(stats)
    })
  })
}

module.exports = build
