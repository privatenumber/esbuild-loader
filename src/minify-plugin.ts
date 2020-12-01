const {version} = require('../package');
import assert from 'assert';
import {RawSource, SourceMapSource} from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import { Compiler, MinifyPluginOptions } from './interfaces';
import * as webpack4 from 'webpack';
import * as webpack5 from 'webpack5';

type Asset = webpack4.compilation.Asset | ReturnType<webpack5.Compilation["getAsset"]>;

const isJsFile = /\.js$/i;
const pluginName = 'esbuild-minify';

// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
const flatMap = (array: any[], cb: (element: any) => any) => array.flatMap ? array.flatMap(cb) : [].concat(...array.map(cb));

function isWebpack5(compilation: webpack4.compilation.Compilation | webpack5.Compilation): compilation is webpack5.Compilation {
	return (compilation as webpack5.Compilation).hooks.processAssets !== undefined;
}

class ESBuildMinifyPlugin {
	private readonly options: MinifyPluginOptions;

	constructor(options: MinifyPluginOptions) {
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

			if (isWebpack5(compilation)) {
				compilation.hooks.processAssets.tapPromise(
					{
						name: pluginName,
						stage: (compilation.constructor as typeof webpack5.Compilation).PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
					},
					assets => this.transformAssets(compilation, Object.keys(assets)),
				);

				compilation.hooks.statsPrinter.tap(pluginName, stats => {
					stats.hooks.print
						.for('asset.info.minimized')
						.tap(pluginName, (minimized, {green, formatFlag}: any) =>
							minimized ? green(formatFlag('minimized')) : undefined,
						);
				});
			} else {
				compilation.hooks.optimizeChunkAssets.tapPromise(
					pluginName,
					async chunks => {
						return this.transformAssets(
							compilation,
							flatMap(chunks, chunk => chunk.files),
						);
					},
				);
			}
		});
	}

	async transformAssets(
		compilation: webpack4.compilation.Compilation | webpack5.Compilation,
		assetNames: string[],
	) {
		const {
			options: {
				devtool
			},
			$esbuildService,
		} = compilation.compiler as Compiler;

		assert($esbuildService, '[esbuild-loader] You need to add ESBuildPlugin to your webpack config first');

		const sourcemap = (
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
					// @ts-ignore
					sourcemap ?
						new SourceMapSource(
							result.code || '',
							assetName,
							result.map as any,
							source && source.toString(),
							(map as RawSourceMap),
							true,
						) :
						new RawSource(result.code || ''),
					{
						...info,
						minimized: true,
					},
				);
			});

		if (transforms.length > 0) {
			await Promise.all(transforms);
		}
	}
}

export default ESBuildMinifyPlugin;
