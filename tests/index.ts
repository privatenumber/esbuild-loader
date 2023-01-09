import { describe } from 'manten';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';

describe('esbuild-loader', ({ describe }) => {
	for (const webpack of [webpack4, webpack5]) {
		describe(`Webpack ${webpack.version}`, ({ runTestSuite }) => {
			runTestSuite(import('./specs/loader.js'), webpack);
			runTestSuite(import('./specs/plugin.js'), webpack);
			// runTestSuite(import('./specs/parse-tsconfig/index.js'));
			// runTestSuite(import('./specs/create-paths-matcher.js'));
		});
	}
});
