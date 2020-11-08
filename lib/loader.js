const {getOptions} = require('loader-utils');

async function ESBuildLoader(source, ...args) {
	const done = this.async();
	const {fallbackFn, ...options} = getOptions(this);
	const service = this._compiler.$esbuildService;

	if (!service) {
		return done(
			new Error(
				'[esbuild-loader] You need to add ESBuildPlugin to your webpack config first',
			),
		);
	}

	try {
		const result = await service.transform(source, {
			...options,
			target: options.target || 'es2015',
			loader: options.loader || 'js',
			sourcemap: this.sourceMap,
			sourcefile: this.resourcePath,
		});
		done(null, result.js, result.jsSourceMap);
	} catch (error) {
		if (fallbackFn) {
			fallbackFn.call(this, source, ...args);
		} else {
			done(error);
		}
	}
}

module.exports = ESBuildLoader;
