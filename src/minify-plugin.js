const assert = require('assert')
const { RawSource, SourceMapSource } = require('webpack-sources')

const isJsFile = /\.js$/i
const pluginName = 'esbuild-minify'

const flatMap = (arr, cb) => {
  assert(Array.isArray(arr), `arr is not an Array`)
  return arr.flatMap ? arr.flatMap(cb) : [].concat(...arr.map(cb))
};

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
    const { options } = this

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const service = compiler.$esbuildService

      if (!service) {
        throw new Error(
          `[esbuild-loader] You need to add ESBuildPlugin to your webpack config first`
        )
      }

      const { devtool } = compiler.options
      const sourcemap =
        options.sourcemap !== undefined
          ? options.sourcemap
          : devtool && devtool.includes('source-map')

      compilation.hooks.optimizeChunkAssets.tapPromise(
        pluginName,
        async (chunks) => {
          const transforms = flatMap(chunks, (chunk) => {
            return chunk.files
              .filter((file) => isJsFile.test(file))
              .map(async (file) => {
                const assetSource = compilation.assets[file]
                const { source, map } = assetSource.sourceAndMap()

                const result = await service.transform(source, {
                  ...options,
                  sourcemap,
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
          })

          if (transforms.length) {
            await Promise.all(transforms)
          }
        }
      )
    })
  }
}

module.exports = ESBuildMinifyPlugin
