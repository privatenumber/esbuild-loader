import assert from 'assert';
import {RawSource, SourceMapSource} from 'webpack-sources';
import {RawSourceMap} from 'source-map';
import {Compiler, MinifyPluginOptions} from './interfaces';
import webpack = require('webpack');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {version} = require('../package');

type Asset = webpack.compilation.Asset;

const isJsFile = /\.js$/i;
const pluginName = 'esbuild-minify';

// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
const flatMap = (array: any[], cb: (element: any) => any) => array.flatMap ? array.flatMap(cb) : [].concat(...array.map(cb));

class ESBuildMinifyPlugin {
	private readonly options: MinifyPluginOptions;

	constructor(options?: MinifyPluginOptions) {
		this.options = {...options};

		const hasMinify = Object.keys(this.options).some(k =>
			k.startsWith('minify'),
		);
		if (!hasMinify) {
			this.options.minify = true;
		}
	}

	apply(compiler: Compiler) {
		compiler.hooks.compilation.tap(pluginName, compilation => {
			assert(compiler.$esbuildService, '[esbuild-loader] You need to add ESBuildPlugin to your webpack config first');

			const meta = JSON.stringify({
				name: 'esbuild-loader',
				version,
				options: this.options,
			});
			compilation.hooks.chunkHash.tap(pluginName, (_, hash) =>
				hash.update(meta),
			);

			const hooks = (compilation.hooks as any);
			if (hooks.processAssets) {
				hooks.processAssets.tapPromise(
					{
						name: pluginName,
						stage: (compilation.constructor as any).PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
					},
					async (assets: Asset[]) => this.transformAssets(compilation, Object.keys(assets)),
				);

				hooks.statsPrinter.tap(pluginName, (stats: any) => {
					stats.hooks.print
						.for('asset.info.minimized')
						.tap(pluginName, (minimized: boolean, {green, formatFlag}: any) =>
							minimized ? green(formatFlag('minimized')) : undefined,
						);
				});
			} else {
				compilation.hooks.optimizeChunkAssets.tapPromise(
					pluginName,
					async chunks => this.transformAssets(
						compilation,
						flatMap(chunks, chunk => chunk.files),
					),
				);
			}
		});
	}

	async transformAssets(
		compilation: webpack.compilation.Compilation,
		assetNames: string[],
	) {
		const {
			options: {
				devtool,
			},
			$esbuildService,
		} = compilation.compiler as Compiler;

		assert($esbuildService, '[esbuild-loader] You need to add ESBuildPlugin to your webpack config first');

		const sourcemap = (
			// TODO: drop support for esbuild sourcemap in future so it all goes through WP API
			this.options.sourcemap === undefined ?
				devtool && (devtool as string).includes('source-map') :
				this.options.sourcemap
		);

		const transforms = assetNames
			.filter(assetName => isJsFile.test(assetName))
			.map((assetName): [string, Asset] => [
				assetName,
				compilation.getAsset(assetName),
			])
			.map(async ([
				assetName,
				{info, source: assetSource},
			]) => {
				const {source, map} = assetSource.sourceAndMap();
				const result = await $esbuildService.transform(source.toString(), {
					...this.options,
					sourcemap,
					sourcefile: assetName,
				});

				compilation.updateAsset(
					assetName,
					sourcemap ?
						new SourceMapSource(
							result.code || '',
							assetName,
							result.map as any,
							source?.toString(),
							(map as RawSourceMap),
							true,
						) :
						new RawSource(result.code || ''),
					{
						...info,
						minimized: true,
					} as any,
				);
			});

		if (transforms.length > 0) {
			await Promise.all(transforms);
		}
	}
}

export default ESBuildMinifyPlugin;
