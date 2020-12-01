import {getOptions} from 'loader-utils';
import webpack4 = require('webpack');
import {Compiler, LoaderOptions} from './interfaces';

async function ESBuildLoader(
	this: webpack4.loader.LoaderContext,
	source: string,
) {
	const done = this.async() as webpack4.loader.loaderCallback;
	const options: LoaderOptions = getOptions(this);
	const service = (this._compiler as Compiler).$esbuildService;

	if (!service) {
		return done(
			new Error(
				'[esbuild-loader] You need to add ESBuildPlugin to your webpack config first',
			),
		);
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
			if (transformOptions.loader === 'tsx' && error.message.includes('Unexpected')) {
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
