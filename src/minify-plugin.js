const { version } = require('../package')
const assert = require('assert')
const { RawSource, SourceMapSource } = require('webpack-sources')

const isJsFile = /\.js$/i
const pluginName = 'esbuild-minify'

const flatMap = (arr, cb) => {
  assert(Array.isArray(arr), `arr is not an Array`)
  return arr.flatMap ? arr.flatMap(cb) : [].concat(...arr.map(cb))
}

class ESBuildMinifyPlugin {
  constructor(options) {
    this.options = { ...options }

    const hasMinify = Object.keys(this.options).some((k) =>
      k.startsWith('minify')
    )
    if (!hasMinify) {
      this.options.minify = true
    }
  }

  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      if (!compiler.$esbuildService) {
        throw new Error(
          `[esbuild-loader] You need to add ESBuildPlugin to your webpack config first`
        )
      }

      const meta = JSON.stringify({
        name: 'esbuild-loader',
        version,
        options: this.options,
      })
      compilation.hooks.chunkHash.tap(pluginName, (chunk, hash) =>
        hash.update(meta)
      )

      // Webpack 5
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          },
          (assets) => this.transformAssets(compilation, Object.keys(assets))
        )

        compilation.hooks.statsPrinter.tap(pluginName, (stats) => {
          stats.hooks.print
            .for('asset.info.minimized')
            .tap(pluginName, (minimized, { green, formatFlag }) =>
              minimized ? green(formatFlag('minimized')) : undefined
            )
        })
      }

      // Webpack 4
      else {
        compilation.hooks.optimizeChunkAssets.tapPromise(
          pluginName,
          async (chunks) => {
            return this.transformAssets(
              compilation,
              flatMap(chunks, (chunk) => chunk.files)
            )
          }
        )
      }
    })
  }

  async transformAssets(compilation, assetNames) {
    const {
      options: { devtool },
      $esbuildService,
    } = compilation.compiler

    const sourcemap =
      this.options.sourcemap !== undefined
        ? this.options.sourcemap
        : devtool && devtool.includes('source-map')

    const transforms = assetNames
      .filter((assetName) => isJsFile.test(assetName))
      .map((assetName) => [assetName, compilation.getAsset(assetName)])
      .map(async ([assetName, { info, source: assetSource }]) => {
        const { source, map } = assetSource.sourceAndMap()
        const result = await $esbuildService.transform(source, {
          ...this.options,
          sourcemap,
          devtool,
          sourcefile: assetName,
        })

        compilation.updateAsset(
          assetName,
          sourcemap
            ? new SourceMapSource(
                result.js || '',
                assetName,
                result.jsSourceMap,
                source,
                map,
                true
              )
            : new RawSource(result.js || ''),
          {
            ...info,
            minimized: true,
          }
        )
      })
    if (transforms.length) {
      await Promise.all(transforms)
    }
  }
}

module.exports = ESBuildMinifyPlugin
