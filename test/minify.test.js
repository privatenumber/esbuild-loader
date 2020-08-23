const webpack4 = require('webpack')
const webpack5 = require('webpack5')
const { build, getFile } = require('./utils')
const { ESBuildMinifyPlugin } = require('../src')
const fixtures = require('./fixtures')

describe.each([
  ['Webpack 4', webpack4],
  ['Webpack 5', webpack5],
])('%s Loader + Minification', (_name, webpack) => {
  test('minify', async () => {
    const statsUnminified = await build(webpack, fixtures.js)

    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(statsUnminified.hash).not.toBe(stats.hash)
    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minifyWhitespace', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyWhitespace: true,
          }),
        ],
      }
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minifyIdentifiers', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyIdentifiers: true,
          }),
        ],
      }
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minifySyntax', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifySyntax: true,
          }),
        ],
      }
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minify w/ no devtool', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minify w/ devtool inline-source-map', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.devtool = 'inline-source-map'
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    const contents = getFile(stats, '/dist/index.js')
    expect(contents).toContain(`//# sourceMappingURL=data:application/`)
    expect(contents).toMatchSnapshot()
  })

  test('minify w/ devtool source-maps', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.devtool = 'source-map'
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    const contents = getFile(stats, '/dist/index.js')
    expect(contents).toContain(`//# sourceMappingURL=index.js.map`)
    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option and source-map plugin inline', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
      config.plugins.push(new webpack.SourceMapDevToolPlugin({}))
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option and source-map plugin external', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
      config.plugins.push(
        new webpack.SourceMapDevToolPlugin({
          filename: 'index.js.map',
        })
      )
    })

    expect(getFile(stats, '/dist/index.js')).toMatchSnapshot()
    expect(getFile(stats, '/dist/index.js.map')).toMatchSnapshot()
  })
})
