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

// const tsxTryTsLoaderPtrn = /Unexpected|Expected/;
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

	if (transformOptions.loader === 'tsx') {
		if (/\.ts$/.test(this.resourcePath)) {
			transformOptions.loader = 'ts';
		}
	}

	try {
		const result = await service.transform(source, transformOptions);
		
		// .catch(async error => {
		// 	// Target might be a TS file accidentally parsed as TSX
		// 	if (transformOptions.loader === 'tsx' && tsxTryTsLoaderPtrn.test(error.message)) {
		// 		transformOptions.loader = 'ts';
		// 		return service.transform(source, transformOptions).catch(_ => {
		// 			throw error;
		// 		});
		// 	}

		// 	throw error;
		// });

		done(null, result.code, result.map && JSON.parse(result.map));
	} catch (error: unknown) {
		done(error as Error);
	}
}

export default ESBuildLoader;
