import {transform} from 'esbuild';
import {RawSource, SourceMapSource} from 'webpack-sources';
import webpack from 'webpack';
import {matchObject} from 'webpack/lib/ModuleFilenameHelpers';
import {MinifyPluginOptions} from './interfaces';

type Asset = webpack.compilation.Asset;

type KnownStatsPrinterContext = {
	formatFlag(flag: string): string;
	green(string: string): string;
};

type Tappable = {
	tap(
		name: string,
		callback: (
			minimized: boolean,
			statsPrinterContext: KnownStatsPrinterContext,
		) => void,
	): void;
};

type StatsPrinter = {
	hooks: {
		print: {
			for(name: string): Tappable;
		};
	};
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {version} = require('../package');

const isJsFile = /\.js$/i;
const isCssFile = /\.css$/i;
const pluginName = 'esbuild-minify';

const flatMap = <T, U>(
	array: T[],
	callback: (value: T) => U[],
): U[] => (
	// eslint-disable-next-line unicorn/no-array-callback-reference
	Array.prototype.concat(...array.map(callback))
);

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

	apply(compiler: webpack.Compiler): void {
		compiler.hooks.compilation.tap(pluginName, compilation => {
			const meta = JSON.stringify({
				name: 'esbuild-loader',
				version,
				options: this.options,
			});

			compilation.hooks.chunkHash.tap(pluginName, (_, hash) => hash.update(meta));

			type Wp5Compilation = typeof compilation & {
				hooks: typeof compilation.hooks & {
					processAssets: typeof compilation.hooks.optimizeAssets;
					statsPrinter: typeof compilation.hooks.childCompiler; // Could be any SyncHook
				};
				constructor: {
					PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE: number;
				};
			};

			if ('processAssets' in compilation.hooks) {
				const wp5Compilation = compilation as Wp5Compilation;

				wp5Compilation.hooks.processAssets.tapPromise(
					{
						name: pluginName,
						stage: wp5Compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
						// @ts-expect-error
						additionalAssets: true,
					},
					async (assets: Asset[]) => this.transformAssets(compilation, Object.keys(assets)),
				);

				wp5Compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter: StatsPrinter) => {
					statsPrinter.hooks.print
						.for('asset.info.minimized')
						.tap(
							pluginName,
							(minimized, {green, formatFlag}: any) => (
								minimized ?
									green(formatFlag('minimized')) :
									undefined
							),
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
	): Promise<void> {
		const {options: {devtool}} = compilation.compiler;

		const sourcemap = (
			// TODO: drop support for esbuild sourcemap in future so it all goes through WP API
			this.options.sourcemap === undefined ?
				devtool && (devtool as string).includes('source-map') :
				this.options.sourcemap
		);

		const {include, exclude, ...transformOptions} = this.options;

		const transforms = assetNames
			.filter(assetName => (
				(
					isJsFile.test(assetName) ||
					isCssFile.test(assetName)
				) &&
				matchObject({include, exclude}, assetName)),
			)
			.map((assetName): [string, Asset] => [
				assetName,
				compilation.getAsset(assetName),
			])
			.map(async ([
				assetName,
				{info, source: assetSource},
			]) => {
				const assetIsCss = isCssFile.test(assetName);
				const {source, map} = assetSource.sourceAndMap();
				const result = await transform(source.toString(), {
					...transformOptions,
					loader: (
						assetIsCss ?
							'css' :
							transformOptions.loader
					),
					sourcemap,
					sourcefile: assetName,
				});

				compilation.updateAsset(
					assetName,
					(
						sourcemap &&
						// CSS source-maps not supported yet https://github.com/evanw/esbuild/issues/519
						!assetIsCss
					) ?
						new SourceMapSource(
							result.code || '',
							assetName,
							result.map as any,
							source?.toString(),
							map!,
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
