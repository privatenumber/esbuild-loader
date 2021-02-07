# esbuild-loader <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/v/esbuild-loader"></a> <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/dm/esbuild-loader"></a> <a href="https://packagephobia.now.sh/result?p=esbuild-loader"><img src="https://packagephobia.now.sh/badge?p=esbuild-loader"></a>

Speed up your Webpack build with [esbuild](https://github.com/evanw/esbuild)! 🔥

[esbuild](https://github.com/evanw/esbuild) is a JavaScript bundler written in Go that supports blazing fast ESNext & TypeScript transpilation and JS minification.

[esbuild-loader](https://github.com/privatenumber/esbuild-loader) lets you harness the speed of esbuild in your Webpack build by offering faster alternatives for transpilation (eg. babel-loader/ts-loader) and minification (eg. Terser)!

<sub>If you like this project, please star it & [follow me](https://github.com/privatenumber) to see what other cool projects I'm working on! ❤️</sub>

## 🚀 Install

```bash
npm i -D esbuild-loader
```

## 🚦 Quick Setup

### Javascript & JSX transpilation (eg. Babel)
In `webpack.config.js`:

```diff
+ const { ESBuildPlugin } = require('esbuild-loader')

  module.exports = {
    module: {
      rules: [
-       {
-         test: /\.js$/,
-         use: 'babel-loader',
-       },
+       {
+         test: /\.js$/,
+         loader: 'esbuild-loader',
+         options: {
+           loader: 'jsx', // Remove this if you're not using JSX
+           target: 'es2015' // Syntax to compile to (see options below for possible values)
+         }
+       },

        ...
      ],
    },
    plugins: [
+     new ESBuildPlugin()
    ]
  }
```

### TypeScript & TSX
In `webpack.config.js`:

```diff
+ const { ESBuildPlugin } = require('esbuild-loader')

  module.exports = {
    module: {
      rules: [
-       {
-         test: /\.tsx?$/,
-         use: 'ts-loader'
-       },
+       {
+         test: /\.tsx?$/,
+         loader: 'esbuild-loader',
+         options: {
+           loader: 'tsx', // Or 'ts' if you don't need tsx
+           target: 'es2015'
+         }
+       },

        ...
      ]
    },
    plugins: [
+     new ESBuildPlugin()
    ]
  }
```

#### Configuration
If you have a `tsconfig.json` file, esbuild-loader will automatically detect it. Alternatively, you can pass it in via the [`tsconfigRaw` option](https://esbuild.github.io/api/#tsconfig-raw).

Note, esbuild only supports a subset of `tsconfig` options [(see `TransformOptions` interface)](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L127-L133) and does not do type checks.

```diff
  {
      test: /\.tsx?$/,
      loader: 'esbuild-loader',
      options: {
          loader: 'tsx',
          target: 'es2015',
+         tsconfigRaw: require('./tsconfig.json')
      }
  }
```

### Minification (eg. Terser)
You can replace JS minifiers like Terser or UglifyJs. Checkout the [benchmarks](https://github.com/privatenumber/minification-benchmarks) to see how much faster esbuild is.

In `webpack.config.js`:

```diff
+ const {
+   ESBuildPlugin,
+   ESBuildMinifyPlugin
+ } = require('esbuild-loader')

  module.exports = {
    ...,

+   optimization: {
+     minimize: true,
+     minimizer: [
+       new ESBuildMinifyPlugin({
+         target: 'es2015' // Syntax to compile to (see options below for possible values)
+       })
+     ]
+   },

    plugins: [
+     new ESBuildPlugin()
    ]
  }
```

> _💁‍♀️ Protip: Use the minify plugin in-place of the loader to transpile your JS_
>
> The `target` option tells _esbuild_ that it can use newer JS syntax to perform better minification. If you're not using TypeScript or any syntax unsupported by Webpack, you can also leverage this as a transpilation step. It will be faster because there's less files to work on and will produce a smaller output because the polyfills will only be bundled once for the entire build instead of per file.

## ⚙️ Options

### Loader
The loader supports options from [esbuild](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L126-L138).
- `target` `String` (`es2015`) - [Environment target](https://esbuild.github.io/api/#target) (e.g. es2016, chrome80, esnext)
- `loader` `String` (`js`) - Which loader to use to handle file
  - [Possible values](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L3): `js`, `jsx`, `ts`, `tsx`, `json`, `text`, `base64`, `file`, `dataurl`, `binary`
- `jsxFactory` `String` - What to use instead of React.createElement
- `jsxFragment` `String` - What to use instead of React.Fragment

Enable source-maps via [`devtool`](https://webpack.js.org/configuration/devtool/)

### MinifyPlugin
- `target` `String` (`esnext`) - [Environment target](https://github.com/evanw/esbuild#javascript-syntax-support) (e.g. es2016, chrome80, esnext)
- `minify` `Boolean` (`true`) - Sets all `minify` flags
- `minifyWhitespace` `Boolean` - Remove whitespace
- `minifyIdentifiers` `Boolean` - Shorten identifiers
- `minifySyntax` `Boolean` - Use equivalent but shorter syntax
- `sourcemap` `Boolean` (defaults to Webpack `devtool`) - Whether to emit sourcemaps
- `include` `String|RegExp|Array<String|RegExp>` - Filter assets for inclusion in minification
- `exclude` `String|RegExp|Array<String|RegExp>` - Filter assets for exclusion in minification


## 💼 License
- MIT &copy; privatenumber
- MIT &copy; [EGOIST (Kevin Titor)](https://github.com/sponsors/egoist)
