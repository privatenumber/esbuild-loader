import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import {
	configureEsbuildLoader,
	configureCssLoader,
} from '../utils';
import * as fixtures from '../fixtures.js';
import type { EsbuildPluginOptions } from '#esbuild-loader';

const { exportFile } = fixtures;

export default testSuite(({ describe }, webpack: typeof webpack4 | typeof webpack5) => {
	describe('Loader', ({ test, describe }) => {
		describe('Error handling', ({ test }) => {
			test('tsx fails to be parsed as ts', async () => {
				const built = await build(
					exportFile(
						'tsx.tsx',
						'export default <div>hello world</div>',
					),
					(config) => {
						configureEsbuildLoader(config, {
							test: /\.tsx$/,
							options: {
								loader: 'ts',
							},
						});
					},
					webpack,
				);

				expect(built.stats.hasErrors()).toBe(true);
				const [error] = built.stats.compilation.errors;
				expect(error.message).toMatch('Transform failed with 1 error');
			});
		});

		test('transforms syntax', async () => {
			const built = await build(
				fixtures.js,
				configureEsbuildLoader,
				webpack,
			);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);
			expect(built.require('/dist')).toStrictEqual([
				'es2016 - Exponentiation operator',
				'es2017 - Async functions',
				'es2018 - Spread properties',
				'es2018 - Rest properties',
				'es2019 - Optional catch binding',
				'es2020 - Optional chaining',
				'es2020 - Nullish coalescing',
				'es2020 - import.meta',
				'es2021 - Logical assignment operators',
				'es2022 - Class instance fields',
				'es2022 - Static class fields',
				'es2022 - Private instance methods',
				'es2022 - Private instance fields',
				'es2022 - Private static methods',
				'es2022 - Private static fields',
				'es2022 - Class static blocks',
			]);
		});

		test('transforms TypeScript', async () => {
			const built = await build(
				fixtures.ts,
				(config) => {
					configureEsbuildLoader(config, {
						test: /\.ts$/,
					});
				},
				webpack,
			);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			expect(built.require('/dist')()).toBe('foo');
		});

		test('transforms TSX', async () => {
			const built = await build(
				exportFile(
					'tsx.tsx',
					'export default (<><div>hello world</div></>)',
				),
				(config) => {
					configureEsbuildLoader(config, {
						test: /\.tsx$/,
						options: {
							jsxFactory: 'Array',
							jsxFragment: '"Fragment"',
						},
					});
				},
				webpack,
			);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			expect(built.require('/dist')).toStrictEqual([
				'Fragment',
				null,
				[
					'div',
					null,
					'hello world',
				],
			]);
		});

		test('tsconfig', async () => {
			const built = await build(
				exportFile(
					'tsx.tsx',
					'export default (<div>hello world</div>)',
				),
				(config) => {
					configureEsbuildLoader(config, {
						test: /\.tsx$/,
						options: {
							tsconfigRaw: {
								compilerOptions: {
									jsxFactory: 'Array',
								},
							},
						},
					});
				},
				webpack,
			);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);
			expect(built.require('/dist/index.js')).toStrictEqual(['div', null, 'hello world']);
		});

		describe('implementation', ({ test }) => {
			test('error', async () => {
				const runWithImplementation = async (
					implementation: EsbuildPluginOptions['implementation'],
				) => {
					const built = await build(
						fixtures.blank,
						(config) => {
							configureEsbuildLoader(config, {
								options: {
									implementation,
								},
							});
						},
						webpack,
					);

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

			test('custom transform function', async () => {
				const built = await build(
					fixtures.blank,
					(config) => {
						configureEsbuildLoader(config, {
							options: {
								implementation: {
									transform: async () => ({
										code: 'export default "CUSTOM_ESBUILD_IMPLEMENTATION"',
										map: '',
										warnings: [],
									}),
								},
							},
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('CUSTOM_ESBUILD_IMPLEMENTATION');
			});
		});

		describe('ambigious ts/tsx', () => {
			test('ts via tsx', async () => {
				const built = await build(
					fixtures.ts,
					(config) => {
						configureEsbuildLoader(config, {
							test: /\.tsx?$/,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				expect(built.require('/dist')()).toBe('foo');
			});

			test('ts via tsx 2', async () => {
				const built = await build(
					exportFile(
						'ts.ts', `
						export default <V>(
							l: obj,
							options: { [key in obj]: V },
						): V => {
							return options[l];
						};
					`,
					),
					(config) => {
						configureEsbuildLoader(config, {
							test: /\.tsx?$/,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				expect(built.require('/dist')('a', { a: 1 })).toBe(1);
			});

			test('ambiguous ts', async () => {
				const built = await build(
					exportFile(
						'ts.ts',
						'export default () => <a>1</a>/g',
					),
					(config) => {
						configureEsbuildLoader(config, {
							test: /\.tsx?$/,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('(() => 1 < /a>/g)');
			});

			test('ambiguous tsx', async () => {
				const built = await build(
					exportFile(
						'tsx.tsx',
						'export default () => <a>1</a>/g',
					),
					(config) => {
						configureEsbuildLoader(config, {
							test: /\.tsx?$/,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('React.createElement');
			});
		});

		describe('Source-map', ({ test }) => {
			test('source-map eval', async () => {
				const built = await build(
					fixtures.js,
					(config) => {
						configureEsbuildLoader(config);
						config.devtool = 'eval-source-map';
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('eval(');
			});

			test('source-map inline', async () => {
				const built = await build(
					fixtures.js,
					(config) => {
						configureEsbuildLoader(config);
						config.devtool = 'inline-source-map';
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('sourceMappingURL');
			});

			test('source-map file', async () => {
				const built = await build(
					fixtures.js,
					(config) => {
						configureEsbuildLoader(config);
						config.devtool = 'source-map';
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const { assets } = built.stats.compilation;
				expect(assets).toHaveProperty(['index.js']);
				expect(assets).toHaveProperty(['index.js.map']);
			});

			test('source-map plugin', async () => {
				const built = await build(
					fixtures.js,
					(config) => {
						configureEsbuildLoader(config);

						delete config.devtool;
						config.plugins!.push(
							new webpack.SourceMapDevToolPlugin({}) as any,
						);
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('sourceMappingURL');
			});
		});

		test('webpack magic comments', async () => {
			const built = await build({
				'/src/index.js': `
					const chunkA = import(/* webpackChunkName: "named-chunk-foo" */'./chunk-a.js')
					const chunkB = import(/* webpackChunkName: "named-chunk-bar" */'./chunk-b.js')
					export default async () => (await chunkA).default + (await chunkB).default;
				`,
				'/src/chunk-a.js': 'export default 1',
				'/src/chunk-b.js': 'export default 2',
			}, configureEsbuildLoader, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const { assets } = built.stats.compilation;
			expect(assets).toHaveProperty(['index.js']);
			expect(assets).toHaveProperty(['named-chunk-foo.js']);
			expect(assets).toHaveProperty(['named-chunk-bar.js']);
			expect(await built.require('/dist')()).toBe(3);
		});

		test('CSS minification', async () => {
			const built = await build(
				fixtures.css,
				(config) => {
					configureEsbuildLoader(config);
					const cssRule = configureCssLoader(config);
					cssRule.use.push({
						loader: 'esbuild-loader',
						options: {
							minify: true,
						},
					});
				},
				webpack,
			);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const code = built.fs.readFileSync('/dist/index.js', 'utf8');
			expect(code).toContain('div{color:red}');
		});
	});
});
