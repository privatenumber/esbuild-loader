const { promisify } = require('util')
const webpack = require('webpack')
const { ESBuildPlugin } = require('../src')

const esbuildLoader = require.resolve('../src')

test('simple', async () => {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    entry: __dirname + '/fixture/index.js',
    output: {
      path: __dirname + '/fixture/dist',
      filename: 'index.js',
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.js', '.tsx', '.ts', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: esbuildLoader,
        },
      ],
    },
    plugins: [new ESBuildPlugin()],
  })
  let assets
  compiler.hooks.done.tap('test', (stats) => {
    console.log(stats.toString('minimal'))
    assets = stats.compilation.assets
  })
  await promisify(compiler.run.bind(compiler))()
  expect(Object.keys(assets)).toMatchInlineSnapshot(`
      Array [
        "index.js",
      ]
    `)
  expect(assets['index.js'].source()).toMatchSnapshot()
})

test('minified', async () => {
  const compiler = webpack({
    mode: 'development',
    devtool: false,
    entry: __dirname + '/fixture/index.js',
    output: {
      path: __dirname + '/fixture/dist',
      filename: 'minify.js',
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.js', '.tsx', '.ts', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          loader: esbuildLoader,
          options: {
            minify: true,
          },
        },
      ],
    },
    plugins: [new ESBuildPlugin()],
  })
  let assets
  compiler.hooks.done.tap('test', (stats) => {
    console.log(stats.toString('minimal'))
    assets = stats.compilation.assets
  })
  await promisify(compiler.run.bind(compiler))()
  expect(Object.keys(assets)).toMatchInlineSnapshot(`
    Array [
      "minify.js",
    ]
  `)
  expect(assets['minify.js'].source()).toMatchSnapshot()
})
