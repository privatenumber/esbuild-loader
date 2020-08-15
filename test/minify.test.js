const webpack4 = require('webpack4')
const build = require('./build')
const { ESBuildMinifyPlugin } = require('../src')
const fixtures = require('./fixtures')

describe.each([['Webpack 4', webpack4]])(
  '%s Loader + Minification',
  (_name, webpack) => {
    test('minify', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.optimization = {
          minimize: true,
          minimizer: [new ESBuildMinifyPlugin()],
        }
      })

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('minify w/ no devtool', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        delete config.devtool
        config.optimization = {
          minimize: true,
          minimizer: [new ESBuildMinifyPlugin()],
        }
      })

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('minify w/ devtool inline-source-map', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'inline-source-map'
        config.optimization = {
          minimize: true,
          minimizer: [new ESBuildMinifyPlugin()],
        }
      })

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('minify w/ devtool source-maps', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'source-map'
        config.optimization = {
          minimize: true,
          minimizer: [new ESBuildMinifyPlugin()],
        }
      })

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
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

      const assets = stats.compilation.assets
      expect(assets['index.js'].source()).toMatchSnapshot()
      expect(assets['index.js.map'].source()).toMatchSnapshot()
    })
  }
)
