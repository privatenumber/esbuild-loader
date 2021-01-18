import webpack = require('webpack');
import {getOptions} from 'loader-utils';
import {Compiler, LoaderOptions} from './interfaces';

const tsxTryTsLoaderPtrn = /Unexpected|Expected/;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext,
	source: string,
) {
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

	try {
		const result = await service.transform(source, transformOptions).catch(async error => {
			// Target might be a TS file accidentally parsed as TSX
			if (transformOptions.loader === 'tsx' && tsxTryTsLoaderPtrn.test(error.message)) {
				transformOptions.loader = 'ts';
				return service.transform(source, transformOptions).catch(_ => {
					throw error;
				});
			}

			throw error;
		});
		done(null, result.code, result.map);
	} catch (error: unknown) {
		done(error as Error);
	}
}

export default ESBuildLoader;
