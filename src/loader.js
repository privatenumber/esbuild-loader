const path = require('path')
const { getOptions } = require('loader-utils')

async function ESBuildLoader(source) {
  const done = this.async()
  const options = getOptions(this)
  /** @type {import('esbuild').Service} */
  const service = this._compiler.$esbuildService

  if (!service) {
    return done(
      new Error(
        `[esbuild-loader] You need to add ESBuildPlugin to your webpack config first`
      )
    )
  }

  try {
    const result = await service.transform(source, {
      target: options.target || 'es2015',
      loader: options.loader || 'js',
      platform: options.platform || 'browser',
      jsxFactory: options.jsxFactory,
      jsxFragment: options.jsxFragment,
      sourcemap: this.sourceMap,
      sourcefile: this.resourcePath,
    })
    done(null, result.js, result.jsSourceMap)
  } catch (err) {
    done(err)
  }
}

module.exports = ESBuildLoader
