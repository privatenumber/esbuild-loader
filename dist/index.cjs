'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var esbuild = require('esbuild');
var loaderUtils = require('loader-utils');
var getTsconfig = require('get-tsconfig');
var webpackSources = require('webpack-sources');
var ModuleFilenameHelpers = require('webpack/lib/ModuleFilenameHelpers.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ModuleFilenameHelpers__default = /*#__PURE__*/_interopDefaultLegacy(ModuleFilenameHelpers);

const tsconfigCache = /* @__PURE__ */ new Map();
async function ESBuildLoader(source) {
  var _a, _b, _c;
  const done = this.async();
  const options = typeof this.getOptions === "function" ? this.getOptions() : loaderUtils.getOptions(this);
  const {
    implementation,
    tsconfig: tsconfigPath,
    ...esbuildTransformOptions
  } = options;
  if (implementation && typeof implementation.transform !== "function") {
    done(
      new TypeError(
        `esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received ${typeof implementation.transform}`
      )
    );
    return;
  }
  const transform = (_a = implementation == null ? void 0 : implementation.transform) != null ? _a : esbuild.transform;
  const transformOptions = {
    ...esbuildTransformOptions,
    target: (_b = options.target) != null ? _b : "es2015",
    loader: (_c = options.loader) != null ? _c : "default",
    sourcemap: this.sourceMap,
    sourcefile: this.resourcePath
  };
  if (!("tsconfigRaw" in transformOptions)) {
    const { resourcePath } = this;
    if (tsconfigPath) {
      const tsconfigFullPath = path__default["default"].resolve(tsconfigPath);
      const cacheKey = `esbuild-loader:${tsconfigFullPath}`;
      let tsconfig = tsconfigCache.get(cacheKey);
      if (!tsconfig) {
        tsconfig = {
          config: getTsconfig.parseTsconfig(tsconfigFullPath, tsconfigCache),
          path: tsconfigFullPath
        };
        tsconfigCache.set(cacheKey, tsconfig);
      }
      const filesMatcher = getTsconfig.createFilesMatcher(tsconfig);
      const matches = filesMatcher(resourcePath);
      if (!matches) {
        this.emitWarning(
          new Error(`[esbuild-loader] The specified tsconfig at "${tsconfigFullPath}" was applied to the file "${resourcePath}" but does not match its "include" patterns`)
        );
      }
      transformOptions.tsconfigRaw = tsconfig.config;
    } else {
      const tsconfig = getTsconfig.getTsconfig(resourcePath, "tsconfig.json", tsconfigCache);
      if (tsconfig) {
        const fileMatcher = getTsconfig.createFilesMatcher(tsconfig);
        transformOptions.tsconfigRaw = fileMatcher(resourcePath);
      }
    }
  }
  try {
    const { code, map } = await transform(source, transformOptions);
    done(null, code, map && JSON.parse(map));
  } catch (error) {
    done(error);
  }
}

var version = "0.0.0-semantic-release";

const isJsFile = /\.[cm]?js(?:\?.*)?$/i;
const isCssFile = /\.css(?:\?.*)?$/i;
const pluginName = "EsbuildPlugin";
const transformAssets = async (options, transform, compilation, useSourceMap) => {
  const { compiler } = compilation;
  const sources = "webpack" in compiler && compiler.webpack.sources;
  const SourceMapSource = sources ? sources.SourceMapSource : webpackSources.SourceMapSource;
  const RawSource = sources ? sources.RawSource : webpackSources.RawSource;
  const {
    css: minifyCss,
    include,
    exclude,
    implementation,
    ...transformOptions
  } = options;
  const minimized = transformOptions.minify || transformOptions.minifyWhitespace || transformOptions.minifyIdentifiers || transformOptions.minifySyntax;
  const assets = compilation.getAssets().filter((asset) => (
    // Filter out already minimized
    !asset.info.minimized && (isJsFile.test(asset.name) || minifyCss && isCssFile.test(asset.name)) && ModuleFilenameHelpers__default["default"].matchObject(
      { include, exclude },
      asset.name
    )
  ));
  await Promise.all(assets.map(async (asset) => {
    const assetIsCss = isCssFile.test(asset.name);
    let source;
    let map = null;
    if (useSourceMap) {
      if (asset.source.sourceAndMap) {
        const sourceAndMap = asset.source.sourceAndMap();
        source = sourceAndMap.source;
        map = sourceAndMap.map;
      } else {
        source = asset.source.source();
        if (asset.source.map) {
          map = asset.source.map();
        }
      }
    } else {
      source = asset.source.source();
    }
    const sourceAsString = source.toString();
    const result = await transform(sourceAsString, {
      ...transformOptions,
      loader: assetIsCss ? "css" : transformOptions.loader,
      sourcemap: useSourceMap,
      sourcefile: asset.name
    });
    if (result.legalComments) {
      compilation.emitAsset(
        `${asset.name}.LEGAL.txt`,
        new RawSource(result.legalComments)
      );
    }
    compilation.updateAsset(
      asset.name,
      result.map ? new SourceMapSource(
        result.code,
        asset.name,
        result.map,
        sourceAsString,
        map,
        true
      ) : new RawSource(result.code),
      {
        ...asset.info,
        minimized
      }
    );
  }));
};
class EsbuildPlugin {
  constructor(options = {}) {
    const { implementation } = options;
    if (implementation && typeof implementation.transform !== "function") {
      throw new TypeError(
        `[${pluginName}] implementation.transform must be an esbuild transform function. Received ${typeof implementation.transform}`
      );
    }
    this.options = options;
  }
  apply(compiler) {
    var _a, _b, _c, _d, _e;
    const {
      implementation,
      ...options
    } = this.options;
    const transform = (_a = implementation == null ? void 0 : implementation.transform) != null ? _a : esbuild.transform;
    if (!("format" in options)) {
      const { target } = compiler.options;
      const isWebTarget = Array.isArray(target) ? target.includes("web") : target === "web";
      const wontGenerateHelpers = !options.target || (Array.isArray(options.target) ? options.target.length === 1 && options.target[0] === "esnext" : options.target === "esnext");
      if (isWebTarget && !wontGenerateHelpers) {
        options.format = "iife";
      }
    }
    const usedAsMinimizer = (_d = (_c = (_b = compiler.options.optimization) == null ? void 0 : _b.minimizer) == null ? void 0 : _c.includes) == null ? void 0 : _d.call(_c, this);
    if (usedAsMinimizer && !("minify" in options || "minifyWhitespace" in options || "minifyIdentifiers" in options || "minifySyntax" in options)) {
      options.minify = (_e = compiler.options.optimization) == null ? void 0 : _e.minimize;
    }
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      const meta = JSON.stringify({
        name: "esbuild-loader",
        version,
        options
      });
      compilation.hooks.chunkHash.tap(
        pluginName,
        (_, hash) => hash.update(meta)
      );
      let useSourceMap = false;
      compilation.hooks.finishModules.tap(
        pluginName,
        (modules) => {
          const firstModule = Array.isArray(modules) ? modules[0] : modules.values().next().value;
          if (firstModule) {
            useSourceMap = firstModule.useSourceMap;
          }
        }
      );
      if ("processAssets" in compilation.hooks) {
        compilation.hooks.processAssets.tapPromise(
          {
            name: pluginName,
            // @ts-expect-error undefined on Function type
            stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            additionalAssets: true
          },
          () => transformAssets(options, transform, compilation, useSourceMap)
        );
        compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
          statsPrinter.hooks.print.for("asset.info.minimized").tap(
            pluginName,
            (minimized, { green, formatFlag }) => minimized ? green(formatFlag("minimized")) : void 0
          );
        });
      } else {
        compilation.hooks.optimizeChunkAssets.tapPromise(
          pluginName,
          () => transformAssets(options, transform, compilation, useSourceMap)
        );
      }
    });
  }
}

exports.EsbuildPlugin = EsbuildPlugin;
exports["default"] = ESBuildLoader;
