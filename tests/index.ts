import { describe } from 'manten';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';

const webpacks = [
	webpack4,
	webpack5,
];

describe('esbuild-loader', ({ describe, runTestSuite }) => {
	for (const webpack of webpacks) {
		describe(`Webpack ${webpack.version![0]}`, ({ runTestSuite }) => {
			runTestSuite(import('./specs/loader.js'), webpack);
			runTestSuite(import('./specs/plugin.js'), webpack);
		});
	}

	runTestSuite(import('./specs/webpack5.js'));
});
