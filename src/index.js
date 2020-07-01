const path = require('path')
const esbuild = require('esbuild')
const { getOptions } = require('loader-utils')

/** @type {import('esbuild').Service} */
let service

const getLoader = (ext) => {
  if (ext === '.json') {
    return 'json'
  }
  return 'tsx'
}

module.exports = async function (source) {
  const done = this.async()
  const options = getOptions(this)
  if (!service) {
    return done(
      new Error(
        `[esbuild-loader] You need to add ESBuildPlugin to your webpack config first`
      )
    )
  }

  try {
    const ext = path.extname(this.resourcePath)

    const result = await service.transform(source, {
      target: options.target || 'es2015',
      loader: getLoader(ext),
      jsxFactory: options.jsxFactory,
      jsxFragment: options.jsxFragment,
      sourcemap: options.sourceMap
    })
    done(null, result.js, result.jsSourceMap)
  } catch (err) {
    done(err)
  }
}

module.exports.ESBuildPlugin = class ESBuildPlugin {
  /**
   * @param {import('webpack').Compiler} compiler
   */
  apply(compiler) {
    let watching = false

    const startService = async () => {
      if (!service) {
        service = await esbuild.startService()
      }
    }

    compiler.hooks.run.tapPromise('esbuild', async () => {
      await startService()
    })
    compiler.hooks.watchRun.tapPromise('esbuild', async () => {
      watching = true
      await startService()
    })

    compiler.hooks.done.tap('esbuild', () => {
      if (!watching && service) {
        service.stop()
        service = undefined
      }
    })
  }
}
