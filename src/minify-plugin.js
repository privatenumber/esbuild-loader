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
      const service = compiler.$esbuildService

      if (!service) {
        throw new Error(
          `[esbuild-loader] You need to add ESBuildPlugin to your webpack config first`
        )
      }

      if (compilation.hooks.processAssets) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
          },
          async (assets) => {
            await Promise.all(
              Object.entries(assets).map(async ([file, source]) => {
                if (isJsFile.test(file)) {
                  await this.processSource(source, file, compilation)
                }
              })
            )
          }
        )
      } else {
        compilation.hooks.optimizeChunkAssets.tapPromise(
          pluginName,
          async (chunks) => {
            const transforms = chunks.flatMap((chunk) => {
              return chunk.files
                .filter((file) => isJsFile.test(file))
                .map(async (file) => {
                  const assetSource = compilation.assets[file]
                  await this.processSource(assetSource, file, compilation)
                })
            })

            if (transforms.length) {
              await Promise.all(transforms)
            }
          }
        )
      }
    })
  }

  /**
   * @private
   * @param {import('webpack').Compilation} compilation
   * @param {import('webpack-sources').Source} source
   */
  async processSource(sourceObject, file, compilation) {
    const { source, map } = sourceObject.sourceAndMap()
    const {
      options: { devtool },
      $esbuildService,
    } = compilation.compiler

    const sourcemap =
      this.options.sourcemap !== undefined
        ? this.options.sourcemap
        : devtool && devtool.includes('source-map')

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
  }
}

module.exports = ESBuildMinifyPlugin
