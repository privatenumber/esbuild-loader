"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const esbuild_1 = require("esbuild");
const webpack_sources_1 = require("webpack-sources");
const ModuleFilenameHelpers_1 = require("webpack/lib/ModuleFilenameHelpers");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package');
const isJsFile = /\.js$/i;
const isCssFile = /\.css$/i;
const pluginName = 'esbuild-minify';
const flatMap = (array, callback) => (
// eslint-disable-next-line unicorn/no-array-callback-reference
Array.prototype.concat(...array.map(callback)));
class ESBuildMinifyPlugin {
    constructor(options) {
        this.options = { ...options };
        const hasMinify = Object.keys(this.options).some(k => k.startsWith('minify'));
        if (!hasMinify) {
            this.options.minify = true;
        }
    }
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            const meta = JSON.stringify({
                name: 'esbuild-loader',
                version,
                options: this.options,
            });
            compilation.hooks.chunkHash.tap(pluginName, (_, hash) => hash.update(meta));
            if ('processAssets' in compilation.hooks) {
                const wp5Compilation = compilation;
                wp5Compilation.hooks.processAssets.tapPromise({
                    name: pluginName,
                    stage: wp5Compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
                    // @ts-expect-error
                    additionalAssets: true,
                }, async (assets) => this.transformAssets(compilation, Object.keys(assets)));
                wp5Compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
                    statsPrinter.hooks.print
                        .for('asset.info.minimized')
                        .tap(pluginName, (minimized, { green, formatFlag }) => (minimized ?
                        green(formatFlag('minimized')) :
                        undefined));
                });
            }
            else {
                compilation.hooks.optimizeChunkAssets.tapPromise(pluginName, async (chunks) => this.transformAssets(compilation, flatMap(chunks, chunk => chunk.files)));
            }
        });
    }
    async transformAssets(compilation, assetNames) {
        const { options: { devtool } } = compilation.compiler;
        const sourcemap = (
        // TODO: drop support for esbuild sourcemap in future so it all goes through WP API
        this.options.sourcemap === undefined ?
            devtool && devtool.includes('source-map') :
            this.options.sourcemap);
        const { include, exclude, ...transformOptions } = this.options;
        const transforms = assetNames
            .filter(assetName => ((isJsFile.test(assetName) ||
            isCssFile.test(assetName)) &&
            ModuleFilenameHelpers_1.matchObject({ include, exclude }, assetName)))
            .map((assetName) => [
            assetName,
            compilation.getAsset(assetName),
        ])
            .map(async ([assetName, { info, source: assetSource },]) => {
            const assetIsCss = isCssFile.test(assetName);
            const { source, map } = assetSource.sourceAndMap();
            const result = await esbuild_1.transform(source.toString(), {
                ...transformOptions,
                loader: (assetIsCss ?
                    'css' :
                    transformOptions.loader),
                sourcemap,
                sourcefile: assetName,
            });
            compilation.updateAsset(assetName, (sourcemap &&
                // CSS source-maps not supported yet https://github.com/evanw/esbuild/issues/519
                !assetIsCss) ?
                new webpack_sources_1.SourceMapSource(result.code || '', assetName, result.map, source === null || source === void 0 ? void 0 : source.toString(), map, true) :
                new webpack_sources_1.RawSource(result.code || ''), {
                ...info,
                minimized: true,
            });
        });
        if (transforms.length > 0) {
            await Promise.all(transforms);
        }
    }
}
exports.default = ESBuildMinifyPlugin;
