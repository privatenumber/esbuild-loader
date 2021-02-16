import fs from 'fs';
import path from 'path';
import {getOptions} from 'loader-utils';
import webpack from 'webpack';
import JoyCon, {LoadResult} from 'joycon';
import JSON5 from 'json5';
import {Compiler, LoaderOptions} from './interfaces';

const joycon = new JoyCon();

joycon.addLoader({
	test: /\.json$/,
	async load(filePath) {
		try {
			const config = fs.readFileSync(filePath, 'utf8');
			return JSON5.parse(config);
		} catch (error: any) { // eslint-disable-line @typescript-eslint/no-implicit-any-catch
			throw new Error(
				`Failed to parse tsconfig at ${path.relative(process.cwd(), filePath)}: ${error.message as string}`,
			);
		}
	},
});

const isTsExtensionPtrn = /\.ts$/i;
let tsConfig: LoadResult;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext,
	source: string,
): Promise<void> {
	const done = this.async()!;
	const options: LoaderOptions = getOptions(this);
	const service = (this._compiler as Compiler).$esbuildService;

	if (!service) {
		done(
			new Error(
				'[esbuild-loader] You need to add ESBuildPlugin to your webpack config first',
			),
		);
		return;
	}

	const transformOptions = {
		...options,
		target: options.target ?? 'es2015',
		loader: options.loader ?? 'js',
		sourcemap: this.sourceMap,
		sourcefile: this.resourcePath,
	};

	if (!('tsconfigRaw' in transformOptions)) {
		if (!tsConfig) {
			tsConfig = await joycon.load(['tsconfig.json']);
		}

		if (tsConfig.data) {
			transformOptions.tsconfigRaw = tsConfig.data;
		}
	}

	// https://github.com/privatenumber/esbuild-loader/pull/107
	if (
		transformOptions.loader === 'tsx'
		&& isTsExtensionPtrn.test(this.resourcePath)
	) {
		transformOptions.loader = 'ts';
	}

	try {
		const { code, map } = await service.transform(source, transformOptions);
		done(null, code, map && JSON.parse(map));
	} catch (error: unknown) {
		done(error as Error);
	}
}

export default ESBuildLoader;
