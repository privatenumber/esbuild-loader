import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import { build } from 'webpack-test-utils';
import { MinifyPluginOptions } from '../src/interfaces';
import * as fixtures from './fixtures';
import { configureEsbuildLoader } from './utils';

type WebpackSourceMapDevToolPlugin =
  | webpack4.SourceMapDevToolPlugin
  | webpack5.SourceMapDevToolPlugin;

describe.each([
	['Webpack 4', webpack4],
	['Webpack 5', webpack5],
])('%s', (_name, webpack) => {
	describe('Error handling', () => {
		test('tsx handled as ts', async () => {
			const built = await build(fixtures.tsx, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.tsx$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
					},
				});
			}, webpack);

			expect(built.stats.hasErrors()).toBe(true);
			const [error] = built.stats.compilation.errors;
			expect(error.message).toMatch('Unexpected ">"');
		});

		test('invalid tsx', async () => {
			const built = await build(fixtures.invalidTsx, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.tsx?$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
					},
				});
			}, webpack);

			expect(built.stats.hasErrors()).toBe(true);
			const [error] = built.stats.compilation.errors;
			expect(error.message).toMatch('Unexpected "const"');
		});

		test('invalid implementation option', async () => {
			const runWithImplementation = async (implementation: MinifyPluginOptions['implementation']) => {
				const built = await build(fixtures.tsx, (config) => {
					configureEsbuildLoader(config);

					config.module.rules.push({
						test: /\.js?$/,
						loader: 'esbuild-loader',
						options: {
							implementation,
						},
					});
				}, webpack);

				expect(built.stats.hasErrors()).toBe(true);
				const [error] = built.stats.compilation.errors;
				throw error;
			};

			// @ts-expect-error testing invalid type
			await expect(runWithImplementation({})).rejects.toThrow(
				'esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received undefined',
			);

			// @ts-expect-error testing invalid type
			await expect(runWithImplementation({ transform: 123 })).rejects.toThrow(
				'esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received number',
			);
		});
	});

	describe('Loader', () => {
		test('js', async () => {
			const built = await build(fixtures.js, configureEsbuildLoader, webpack);

			expect(
				built.fs.readFileSync('/dist/index.js', 'utf-8'),
			).toMatchSnapshot();
			expect(
				built.require('/dist'),
			).toMatchSnapshot();
		});

		test('ts', async () => {
			const built = await build(fixtures.ts, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.ts$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
					},
				});
			}, webpack);

			expect(
				built.fs.readFileSync('/dist/index.js', 'utf-8'),
			).toMatchSnapshot();
			expect(
				built.require('/dist'),
			).toMatchSnapshot();
		});

		test('tsx', async () => {
			const built = await build(fixtures.tsx, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.tsx$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
						jsxFactory: 'createElement',
						jsxFragment: 'Fragment',
					},
				});
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');

			expect(dist).toMatchSnapshot();

			built.fs.writeFileSync(
				'/dist/index.js',
				`const createElement = (...args) => args, Fragment = "Fragment";${dist}`,
			);

			expect(
				built.require('/dist'),
			).toMatchSnapshot();
		});

		test('ts w/ tsconfig', async () => {
			const builtA = await build(fixtures.tsConfig, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.ts$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'ts',
					},
				});
			}, webpack);

			const distA = builtA.fs.readFileSync('/dist/index.js', 'utf-8');

			const builtB = await build(fixtures.tsConfig, (config) => {
				configureEsbuildLoader(config);

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
			}, webpack);

			const distB = builtB.fs.readFileSync('/dist/index.js', 'utf-8');

			expect(distA).not.toBe(distB);
			expect(distB).toMatchSnapshot();
		});

		test('tsx w/ tsconfig', async () => {
			const built = await build(fixtures.tsx, (config) => {
				configureEsbuildLoader(config);

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
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');

			expect(dist).toMatchSnapshot();

			built.fs.writeFileSync(
				'/dist/index.js',
				`const customFactory = (...args) => args, customFragment = "Fragment";${dist}`,
			);

			expect(
				built.require('/dist'),
			).toMatchSnapshot();
		});

		test('custom esbuild transform function', async () => {
			const built = await build(fixtures.ts, (config) => {
				configureEsbuildLoader(config);

				config.module.rules.push({
					test: /\.tsx?$/,
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
						implementation: {
							transform: async () => ({
								code: 'export function foo() { return "MY_CUSTOM_ESBUILD_IMPLEMENTATION"; }',
								map: '',
								warnings: [],
							}),
						},
					},
				});
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');

			expect(dist).toContain('MY_CUSTOM_ESBUILD_IMPLEMENTATION');
			expect(dist).toMatchSnapshot();
		});

		describe('ambigious ts/tsx', () => {
			test('ts via tsx', async () => {
				const built = await build(fixtures.ts, (config) => {
					configureEsbuildLoader(config);

					config.module.rules.push({
						test: /\.tsx?$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
						},
					});
				}, webpack);

				expect(
					built.fs.readFileSync('/dist/index.js', 'utf-8'),
				).toMatchSnapshot();
			});

			test('ts via tsx 2', async () => {
				const built = await build(fixtures.ts2, (config) => {
					configureEsbuildLoader(config);

					config.module.rules.push({
						test: /\.tsx?$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
						},
					});
				}, webpack);

				expect(
					built.fs.readFileSync('/dist/index.js', 'utf-8'),
				).toMatchSnapshot();

				expect(
					built.require('/dist')('a', { a: 1 }),
				).toMatchSnapshot();
			});

			test('ambiguous ts', async () => {
				const built = await build(fixtures.tsAmbiguous, (config) => {
					configureEsbuildLoader(config);

					config.module.rules.push({
						test: /\.tsx?$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
						},
					});
				}, webpack);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');

				expect(dist).toContain('(() => 1 < /a>/g)');
				expect(dist).toMatchSnapshot();
			});

			test('ambiguous tsx', async () => {
				const built = await build(fixtures.tsxAmbiguous, (config) => {
					configureEsbuildLoader(config);

					config.module.rules.push({
						test: /\.tsx?$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
						},
					});
				}, webpack);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');
				expect(dist).toContain('React.createElement');
				expect(dist).toMatchSnapshot();
			});
		});
	});

	// Targets
	test('target', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.module.rules[0].options = {
				target: 'es2015',
			};
		}, webpack);

		expect(
			built.fs.readFileSync('/dist/index.js', 'utf-8'),
		).toMatchSnapshot();
		expect(
			built.require('/dist'),
		).toMatchSnapshot();
	});

	describe('Source-map', () => {
		test('source-map eval', async () => {
			const built = await build(fixtures.js, (config) => {
				configureEsbuildLoader(config);

				config.devtool = 'eval-source-map';
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');
			expect(dist).toMatchSnapshot();
			expect(dist).toContain('eval');
		});

		test('source-map inline', async () => {
			const built = await build(fixtures.js, (config) => {
				configureEsbuildLoader(config);

				config.devtool = 'inline-source-map';
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');
			expect(dist).toMatchSnapshot();
			expect(dist).toContain('sourceMappingURL');
		});

		test('source-map file', async () => {
			const built = await build(fixtures.js, (config) => {
				configureEsbuildLoader(config);

				config.devtool = 'source-map';
			}, webpack);

			expect(
				built.fs.readFileSync('/dist/index.js', 'utf-8'),
			).toMatchSnapshot();
			expect(
				built.fs.readFileSync('/dist/index.js.map', 'utf-8'),
			).toMatchSnapshot();
		});

		test('source-map plugin', async () => {
			const built = await build(fixtures.js, (config) => {
				configureEsbuildLoader(config);

				delete config.devtool;
				(config.plugins as WebpackSourceMapDevToolPlugin[]).push(
					new webpack.SourceMapDevToolPlugin({}),
				);
			}, webpack);

			const dist = built.fs.readFileSync('/dist/index.js', 'utf-8');

			expect(dist).toMatchSnapshot();
			expect(dist).toContain('sourceMappingURL');
		});
	});

	test('webpack magic comments', async () => {
		const built = await build(fixtures.webpackChunks, configureEsbuildLoader, webpack);

		expect(built.stats.hasErrors()).toBe(false);

		expect(
			built.fs.readFileSync('/dist/index.js', 'utf-8'),
		).toMatchSnapshot();

		expect(
			built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf-8'),
		).toMatchSnapshot();

		expect(
			built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf-8'),
		).toMatchSnapshot();
	});
});
