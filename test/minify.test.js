const build = require('./build')
const { ESBuildMinifyPlugin } = require('../src')
const fixtures = require('./fixtures')

describe('Loader + Minification', () => {
  test('minify', async () => {
    const stats = await build(fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  test('minifyWhitespace', async () => {
    const stats = await build(fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyWhitespace: true,
          }),
        ],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  test('minifyIdentifiers', async () => {
    const stats = await build(fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyIdentifiers: true,
          }),
        ],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  test('minifySyntax', async () => {
    const stats = await build(fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifySyntax: true,
          }),
        ],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  test('minify w/ no devtool', async () => {
    const stats = await build(fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  test('minify w/ source-maps', async () => {
    const stats = await build(fixtures.js, (config) => {
      config.devtool = 'inline-source-map'
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    const assets = stats.compilation.assets
    expect(assets['index.js'].source()).toMatchSnapshot()
  })
})
