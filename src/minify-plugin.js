const { RawSource, SourceMapSource } = require('webpack-sources')

const isJsFile = /\.js$/i
const pluginName = 'esbuild-minify'

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

      // Webpack 5
      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          },
          (assets) => this.transformAssets(compilation, Object.entries(assets))
        )
      }

      // Webpack 4
      else {
        compilation.hooks.optimizeChunkAssets.tapPromise(
          pluginName,
          async (chunks) => {
            const files = chunks.flatMap((chunk) => chunk.files.map((file) => [file, compilation.assets[file]]))
            return this.transformAssets(compilation, files);
          }
        )
      }
    })
  }

  async transformAssets(compilation, assets) {
    const {
      options: { devtool },
      $esbuildService,
    } = compilation.compiler

    const sourcemap =
      this.options.sourcemap !== undefined
        ? this.options.sourcemap
        : devtool && devtool.includes('source-map')

    const transforms = assets
      .filter(([file]) => isJsFile.test(file))
      .map(async ([file, assetSource]) => {
        const { source, map } = assetSource.sourceAndMap()
        const result = await $esbuildService.transform(source, {
          ...this.options,
          sourcemap,
          devtool,
          sourcefile: file,
        })

        compilation.updateAsset(file, () => {
          if (sourcemap) {
            return new SourceMapSource(
              result.js || '',
              file,
              result.jsSourceMap,
              source,
              map,
              true
            )
          } else {
            return new RawSource(result.js || '')
          }
        })
      })

    if (transforms.length) {
      await Promise.all(transforms)
    }
  }
}

module.exports = ESBuildMinifyPlugin
