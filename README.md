# esbuild-loader <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/v/esbuild-loader"></a> <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/dm/esbuild-loader"></a> <a href="https://packagephobia.now.sh/result?p=esbuild-loader"><img src="https://packagephobia.now.sh/badge?p=esbuild-loader"></a>

[esbuild](https://github.com/evanw/esbuild) is by far one of the fastest TS/ESNext to ES6 compilers, so it makes sense to use it over Babel/TSC with webpack to take advantage of both worlds (Speed and the webpack ecosytem).

You might also like [maho](https://github.com/egoist/maho), a React framework powered by esbuild.

## Install

```bash
npm i -D esbuild esbuild-loader
```

or

```bash
yarn add --dev esbuild esbuild-loader
```

## Usage

### Transpiling
In `webpack.config.js`:

```js
const { ESBuildPlugin } = require('esbuild-loader')

module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'esbuild-loader',
        options: {
          target: 'es2015', // default, or 'es20XX', 'esnext'
        },
      },
      {
        test: /\.tsx$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015',
        },
      },
    ],
  },
  plugins: [
    new ESBuildPlugin()
  ]
}
```

### Minifying

In `webpack.config.js`:

```js
const { ESBuildPlugin, ESBuildMinifyPlugin } = require('esbuild-loader')

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new ESBuildMinifyPlugin()
    ],
  },

  plugins: [
    new ESBuildPlugin()
  ],
}
```


## Options

### Loader
The loader supports options from [esbuild](https://github.com/evanw/esbuild#command-line-usage).
- `target` `<String>` (`es2015`) - Environment target (e.g. es2017, chrome80, esnext)
- `loader` `<String>` (`js`) - Which loader to use to handle file
  - [Possible values](https://github.com/evanw/esbuild/blob/master/lib/types.ts#L3): `js`, `jsx`, `ts`, `tsx`, `json`, `text`, `base64`, `file`, `dataurl`, `binary`
- `jsxFactory` `<String>` - What to use instead of React.createElement
- `jsxFragment` `<String>` - What to use instead of React.Fragment
- Enable source-maps via [`devtool`](https://webpack.js.org/configuration/devtool/)

### MinifyPlugin
- `minify` `<Boolean>` (`true`) - Sets all `--minify-*` flags
- `minifyWhitespace` `<Boolean>` - Remove whitespace
- `minifyIdentifiers` `<Boolean>` - Shorten identifiers
- `minifySyntax` `<Boolean>` - Use equivalent but shorter syntax
- `sourcemap` `<Boolean>` (defaults to Webpack `devtool`)- Whether to emit sourcemaps


## License

MIT &copy; [EGOIST (Kevin Titor)](https://github.com/sponsors/egoist)
