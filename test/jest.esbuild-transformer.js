const {transformSync} = require('esbuild');

exports.process = (code, sourcefile) => transformSync(code, {
	target: 'node12',
	format: 'cjs',
	loader: 'ts',
	sourcemap: 'inline',
	sourcefile,
}).code;
