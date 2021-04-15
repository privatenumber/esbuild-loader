# esbuild-loader <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/v/esbuild-loader"></a> <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/dm/esbuild-loader"></a> <a href="https://packagephobia.now.sh/result?p=esbuild-loader"><img src="https://packagephobia.now.sh/badge?p=esbuild-loader"></a>

Speed up your Webpack build with [esbuild](https://github.com/evanw/esbuild)! 🔥

[esbuild](https://github.com/evanw/esbuild) is a JavaScript bundler written in Go that supports blazing fast ESNext & TypeScript transpilation and JS minification.

[esbuild-loader](https://github.com/privatenumber/esbuild-loader) lets you harness the speed of esbuild in your Webpack build by offering faster alternatives for transpilation (eg. babel-loader/ts-loader) and minification (eg. Terser)!

Curious how much faster your build will be? See [what users are saying](https://github.com/privatenumber/esbuild-loader/issues/13).

<sub>If you like this project, please star it & [follow me](https://github.com/privatenumber) to see what other cool projects I'm working on! ❤️</sub>

## 🚀 Install

```bash
npm i -D esbuild-loader
```

## 🚦 Quick Setup

### Javascript & JSX transpilation (eg. Babel)
In `webpack.config.js`:

```diff
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
+           loader: 'jsx',  // Remove this if you're not using JSX
+           target: 'es2015'  // Syntax to compile to (see options below for possible values)
+         }
+       },

        ...
      ],
    },
  }
```

### TypeScript & TSX
In `webpack.config.js`:

```diff
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
+           loader: 'tsx',  // Or 'ts' if you don't need tsx
+           target: 'es2015'
+         }
+       },

        ...
      ]
    },
  }
```

#### Configuration
If you have a `tsconfig.json` file, esbuild-loader will automatically detect it.

Alternatively, you can also pass it in directly via the [`tsconfigRaw` option](https://esbuild.github.io/api/#tsconfig-raw):
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

⚠️ esbuild only supports a subset of `tsconfig` options [(see `TransformOptions` interface)](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L127-L133) and does not do type-checks. It's recommended to use a type-aware IDE or `tsc --noEmit` for type-checking instead. It is also recommended to enable [`isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules) and [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop) options in your `tsconfig` by the [esbuild docs](https://esbuild.github.io/content-types/#typescript-caveats).


### JS Minification (eg. Terser)
You can replace JS minifiers like Terser or UglifyJs. Checkout the [benchmarks](https://github.com/privatenumber/minification-benchmarks) to see how much faster esbuild is. The `target` option tells esbuild that it can use newer JS syntax to perform better minification.

In `webpack.config.js`:

```diff
+ const { ESBuildMinifyPlugin } = require('esbuild-loader')

  module.exports = {
    ...,

+   optimization: {
+     minimizer: [
+       new ESBuildMinifyPlugin({
+         target: 'es2015'  // Syntax to compile to (see options below for possible values)
+       })
+     ]
+   },
  }
```

#### _💁‍♀️ Protip: Use the minify plugin in-place of the loader to transpile the JS_
If you're not using TypeScript, JSX, or any syntax unsupported by Webpack, you can also leverage the minifier for transpilation (as an alternative to Babel). It will be faster because there's less files to work on and will produce a smaller output because the polyfills will only be bundled once for the entire build instead of per file. Simply set the `target` option on the minifier to specify which support level you want.


### CSS Minification

There are two ways to minify CSS, depending on your setup. You should already have CSS setup in your build using [`css-loader`](https://github.com/webpack-contrib/css-loader).

⚠️ esbuild currently [doesn't support source-maps for CSS minification](https://github.com/evanw/esbuild/issues/519).

#### CSS assets
If your CSS is extracted and emitted as a CSS file, you can replace CSS minification plugins like [`css-minimizer-webpack-plugin`](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) or [`optimize-css-assets-webpack-plugin`](https://github.com/NMFR/optimize-css-assets-webpack-plugin) with the same `ESBuildMinifyPlugin` by enabling the `css` option.

Assuming the CSS is extracted using something like [MiniCssExtractPlugin](https://github.com/webpack-contrib/mini-css-extract-plugin), in `webpack.config.js`:

```diff
  const { ESBuildMinifyPlugin } = require('esbuild-loader')
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  module.exports = {
    ...,

    optimization: {
      minimizer: [
        new ESBuildMinifyPlugin({
          target: 'es2015',
+         css: true  // Apply minification to CSS assets
        })
      ]
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }
      ]
    },

    plugins: [
      new MiniCssExtractPlugin()
    ]
  }
```


#### CSS in JS

If your CSS is not emitted as a CSS file, but rather loaded via JS using something like [`style-loader`](https://github.com/webpack-contrib/style-loader), you can use the loader for minification.


In `webpack.config.js`:

```diff
  module.exports = {
    ...,

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            'css-loader',
+           {
+             loader: 'esbuild-loader',
+             options: {
+               loader: 'css',
+               minify: true
+             }
+           }
          ]
        }
      ]
    }
  }
```


#### Custom esbuild implementation

This loader ships with a stable esbuild version but you can override it in the loader options. This is useful when you want to use a more recent release of esbuild, for example.

⚠️ Attention: using a different implementation is not guaranteed to work, be careful when overriding it in production.

```diff
+ import { transform } from 'esbuild';

  ...

  {
      test: /\.tsx?$/,
      loader: 'esbuild-loader',
      options: {
          loader: 'tsx',
          target: 'es2015',
+         implementation: { transform },
      }
  }
```

The minify plugin also accepts a custom esbuild implementation.


### Examples
If you'd like to see working Webpack builds that use esbuild-loader for basic JS, React, TypeScript, or Next.js, check out the [examples repo](https://github.com/privatenumber/esbuild-loader-examples).

## ⚙️ Options

### Loader
The loader supports options from [esbuild](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L126-L138).
- `target` `String` (`'es2015'`) - [Environment target](https://esbuild.github.io/api/#target) (e.g. es2016, chrome80, esnext)
- `loader` `String` (`'js'`) - Which loader to use to handle file
  - [Possible values](https://github.com/evanw/esbuild/blob/b901055/lib/types.ts#L3): `js`, `jsx`, `ts`, `tsx`, `json`, `text`, `base64`, `file`, `dataurl`, `binary`
- `jsxFactory` `String` - What to use instead of React.createElement
- `jsxFragment` `String` - What to use instead of React.Fragment
- `implementation` `{ transform: Function }` - Custom ESBuild transform implementation

Enable source-maps via [`devtool`](https://webpack.js.org/configuration/devtool/)

### MinifyPlugin
- `target` `String|Aray<String>` (`'esnext'`) - [Environment target](https://github.com/evanw/esbuild#javascript-syntax-support) (e.g. `'es2016'`, `['chrome80', 'esnext']`)
- `minify` `Boolean` (`true`) - Sets all `minify` flags
- `minifyWhitespace` `Boolean` - Remove whitespace
- `minifyIdentifiers` `Boolean` - Shorten identifiers
- `minifySyntax` `Boolean` - Use equivalent but shorter syntax
- `sourcemap` `Boolean` (defaults to Webpack `devtool`) - Whether to emit sourcemaps
- `css` `Boolean` (`false`) - Whether to minify CSS files
- `include` `String|RegExp|Array<String|RegExp>` - Filter assets for inclusion in minification
- `exclude` `String|RegExp|Array<String|RegExp>` - Filter assets for exclusion in minification
- `implementation` `{ transform: Function }` - Custom ESBuild transform implementation


## 💼 License
- MIT &copy; privatenumber
- MIT &copy; [EGOIST (Kevin Titor)](https://github.com/sponsors/egoist)
