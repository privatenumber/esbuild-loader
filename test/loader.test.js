const webpack4 = require('webpack');
const webpack5 = require('webpack5');
const {build, getFile} = require('./utils');
const fixtures = require('./fixtures');

describe.each([
	['Webpack 4', webpack4],
	['Webpack 5', webpack5],
])('%s', (_name, webpack) => {
	describe('Error handling', () => {
		test('tsx handled as ts', async () => {
			const runBuild = () => build(webpack, fixtures.tsx, config => {
				config.module.rules.push({
					test: /\.tsx$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
					},
				});
			});
			await expect(runBuild).rejects.toThrow('Unexpected ">"');
		});

		test('invalid tsx', async () => {
			const runBuild = () => build(webpack, fixtures.invalidTsx, config => {
				config.module.rules.push({
					test: /\.tsx?$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
					},
				});
			});

			await expect(runBuild).rejects.toThrow('Unexpected "const"');
		});
	});

	describe('Loader', () => {
		test('js', async () => {
			const stats = await build(webpack, fixtures.js);

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('tsx', async () => {
			const stats = await build(webpack, fixtures.tsx, config => {
				config.module.rules.push({
					test: /\.tsx$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
					},
				});
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('ts', async () => {
			const stats = await build(webpack, fixtures.ts, config => {
				config.module.rules.push({
					test: /\.ts$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
					},
				});
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('ts as tsx', async () => {
			/*
			 * If a TS file is accidentally parsed as TSX, it should fallback to parsing as TS
			 * This is to support ts-loader like syntax: test: /\.tsx?$/
			 */
			const stats = await build(webpack, fixtures.ts, config => {
				config.module.rules.push({
					test: /\.tsx?$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
					},
				});
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('ts w/ tsconfig', async () => {
			const stats = await build(webpack, fixtures.ts, config => {
				config.module.rules.push({
					test: /\.ts$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
						tsconfigRaw: {
							compilerOptions: {
								useDefineForClassFields: true,
							},
						},
					},
				});
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('tsx w/ tsconfig', async () => {
			const stats = await build(webpack, fixtures.tsx, config => {
				config.module.rules.push({
					test: /\.tsx$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
						tsconfigRaw: {
							compilerOptions: {
								jsxFactory: 'customFactory',
								jsxFragmentFactory: 'customFragment',
							},
						},
					},
				});
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});
	});

	// Targets
	test('target', async () => {
		const stats = await build(webpack, fixtures.target, config => {
			config.module.rules[0].options = {
				target: 'es2015',
			};
		});

		expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
	});

	describe('Source-map', () => {
		test('source-map eval', async () => {
			const stats = await build(webpack, fixtures.js, config => {
				config.devtool = 'eval-source-map';
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('source-map inline', async () => {
			const stats = await build(webpack, fixtures.js, config => {
				config.devtool = 'inline-source-map';
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});

		test('source-map file', async () => {
			const stats = await build(webpack, fixtures.js, config => {
				config.devtool = 'source-map';
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
			expect(getFile(stats, '/dist/index.js.map')).toMatchSnapshot();
		});

		test('source-map plugin', async () => {
			const stats = await build(webpack, fixtures.js, config => {
				delete config.devtool;
				config.plugins.push(new webpack.SourceMapDevToolPlugin({}));
			});

			expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		});
	});

	test('webpack magic comments', async () => {
		const stats = await build(webpack, fixtures.webpackChunks);

		const {assets} = stats.compilation;
		expect(getFile(stats, '/dist/index.js')).toMatchSnapshot();
		expect(assets).toHaveProperty(['named-chunk-foo.js']);
		expect(getFile(stats, '/dist/named-chunk-foo.js')).toMatchSnapshot();
		expect(assets).toHaveProperty(['named-chunk-bar.js']);
		expect(getFile(stats, '/dist/named-chunk-bar.js')).toMatchSnapshot();
	});
});
