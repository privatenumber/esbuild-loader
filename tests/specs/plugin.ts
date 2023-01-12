import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import * as esbuild from 'esbuild';
import type { MinifyPluginOptions } from '../../dist/interfaces.js';
import {
	configureEsbuildMinifyPlugin,
	configureMiniCssExtractPlugin,
} from '../utils';
import * as fixtures from '../fixtures.js';

const assertMinified = (code: string) => {
	expect(code).not.toMatch(/\s{2,}/);
	expect(code).not.toMatch('stringVal');
	expect(code).not.toMatch('return ');
};

export default testSuite(({ describe }, webpack: typeof webpack4 | typeof webpack5) => {
	describe('Plugin', ({ test, describe }) => {
		describe('Minify JS', ({ test }) => {
			test('minify', async () => {
				const built = await build(
					fixtures.minification,
					(config) => {
						configureEsbuildMinifyPlugin(config);
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');
				assertMinified(exportedFunction.toString());
			});

			test('minifyWhitespace', async () => {
				const built = await build(
					fixtures.minification,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							minifyWhitespace: true,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).not.toMatch(/\s{2,}/);
				expect(code).toMatch('stringVal');
				expect(code).toMatch('return ');
			});

			test('minifyIdentifiers', async () => {
				const built = await build(
					fixtures.minification,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							minifyIdentifiers: true,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).toMatch(/\s{2,}/);
				expect(code).not.toMatch('stringVal');
				expect(code).toMatch('return ');
			});

			test('minifySyntax', async () => {
				const built = await build(
					fixtures.minification,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							minifySyntax: true,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).toMatch(/\s/);
				expect(code).toMatch('stringVal');
				expect(code).not.toMatch('return ');
			});

			test('minify chunks & filter using include/exclude', async () => {
				const built = await build({
					'/src/index.js': `
						const foo = import(/* webpackChunkName: "named-chunk-foo" */'./foo.js')
						const bar = import(/* webpackChunkName: "named-chunk-bar" */'./bar.js')
						const baz = import(/* webpackChunkName: "named-chunk-baz" */'./baz.js')
						export default [foo, bar, baz];
					`,
					'/src/foo.js': fixtures.minification['/src/index.js'],
					'/src/bar.js': fixtures.minification['/src/index.js'],
					'/src/baz.js': fixtures.minification['/src/index.js'],
				}, (config) => {
					configureEsbuildMinifyPlugin(config, {
						include: /ba./,
						exclude: /baz/,
					});
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const chunkFoo = built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8').toString();

				// The string "__webpack_require__" is only present in unminified chunks
				expect(chunkFoo).toContain('__webpack_require__');

				const chunkBar = built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8').toString();
				expect(chunkBar).not.toContain('__webpack_require__');
				assertMinified(chunkBar);

				const chunkBaz = built.fs.readFileSync('/dist/named-chunk-baz.js', 'utf8').toString();
				expect(chunkBaz).toContain('__webpack_require__');
			});

			describe('devtool', ({ test }) => {
				test('minify w/ no devtool', async () => {
					const built = await build(
						fixtures.blank,
						(config) => {
							delete config.devtool;
							configureEsbuildMinifyPlugin(config);
						},
						webpack,
					);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).not.toContain('//# sourceURL');
				});

				test('minify w/ devtool inline-source-map', async () => {
					const built = await build(
						fixtures.blank,
						(config) => {
							config.devtool = 'inline-source-map';
							configureEsbuildMinifyPlugin(config);
						},
						webpack,
					);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=data:application/');
				});

				test('minify w/ devtool source-map', async () => {
					const built = await build(
						fixtures.blank,
						(config) => {
							config.devtool = 'source-map';
							configureEsbuildMinifyPlugin(config);
						},
						webpack,
					);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets),
					).toStrictEqual([
						'index.js',
						'index.js.map',
					]);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=index.js.map');
				});

				// TODO: This doesn't work, so maybe we should just remove the option?
				// test('minify w/ plugin sourcemap option', async () => {
				// 	const built = await build({
				// 		'/src/index.js': '',
				// 	}, (config) => {
				// 		delete config.devtool;
				// 		configureEsbuildMinifyPlugin(config, {
				// 			sourcemap: true,
				// 		});
				// 	}, webpack);

				// 	const { stats } = built;
				// 	expect(stats.hasWarnings()).toBe(false);
				// 	expect(stats.hasErrors()).toBe(false);
				// 	expect(
				// 		Object.keys(stats.compilation.assets),
				// 	).toStrictEqual([
				// 		'index.js',
				// 		// 'index.js.map',
				// 	]);

				// 	const file = built.fs.readFileSync('/dist/index.js', 'utf8');
				// 	expect(file).toContain('//# sourceMappingURL=index.js.map');
				// });

				test('minify w/ source-map option and source-map plugin inline', async () => {
					const built = await build(
						fixtures.blank,
						(config) => {
							delete config.devtool;
							configureEsbuildMinifyPlugin(config, {
								sourcemap: true,
							});

							config.plugins!.push(
								new webpack.SourceMapDevToolPlugin({}) as any,
							);
						},
						webpack,
					);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=data:application/');
				});

				test('minify w/ source-map option and source-map plugin external', async () => {
					const built = await build(
						fixtures.blank,
						(config) => {
							delete config.devtool;
							configureEsbuildMinifyPlugin(config, {
								sourcemap: true,
							});

							config.plugins!.push(
								new webpack.SourceMapDevToolPlugin({
									filename: 'index.js.map',
								}) as any,
							);
						},
						webpack,
					);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets),
					).toStrictEqual([
						'index.js',
						'index.js.map',
					]);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=index.js.map');
				});
			});

			test('minify w/ query strings', async () => {
				const built = await build(
					{
						'/src/index.js': 'import(/* webpackChunkName: "chunk" */"./chunk.js")',
						'/src/chunk.js': '',
					},
					(config) => {
						config.output!.filename = '[name].js?foo=bar';
						config.output!.chunkFilename = '[name].js?foo=bar';

						configureEsbuildMinifyPlugin(config);
					},
					webpack,
				);

				const { stats } = built;
				expect(stats.hasWarnings()).toBe(false);
				expect(stats.hasErrors()).toBe(false);
				expect(
					Object.keys(stats.compilation.assets).sort(),
				).toStrictEqual([
					'chunk.js?foo=bar',
					'index.js?foo=bar',
				]);

				// The actual file name does not include the query string
				const file = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(file).toMatch('?foo=bar');
			});

			describe('legalComments', ({ test }) => {
				test('minify w/ legalComments - default is inline', async () => {
					const builtDefault = await build(
						fixtures.legalComments,
						(config) => {
							configureEsbuildMinifyPlugin(config);
						},
						webpack,
					);

					const builtInline = await build(
						fixtures.legalComments,
						(config) => {
							configureEsbuildMinifyPlugin(config, {
								legalComments: 'inline',
							});
						},
						webpack,
					);

					const fileInline = builtInline.fs.readFileSync('/dist/index.js', 'utf8');
					const fileDefault = builtDefault.fs.readFileSync('/dist/index.js', 'utf8');

					expect(fileDefault).toMatch('//! legal comment');
					expect(fileDefault).toBe(fileInline);
				});

				test('minify w/ legalComments - eof', async () => {
					const built = await build(
						fixtures.legalComments,
						(config) => {
							configureEsbuildMinifyPlugin(config, {
								legalComments: 'eof',
							});
						},
						webpack,
					);

					expect(built.stats.hasWarnings()).toBe(false);
					expect(built.stats.hasErrors()).toBe(false);

					const file = built.fs.readFileSync('/dist/index.js').toString();
					expect(file.trim().endsWith('//! legal comment')).toBe(true);
				});

				test('minify w/ legalComments - none', async () => {
					const built = await build(
						fixtures.legalComments,
						(config) => {
							configureEsbuildMinifyPlugin(config, {
								legalComments: 'none',
							});
						},
						webpack,
					);

					expect(built.stats.hasWarnings()).toBe(false);
					expect(built.stats.hasErrors()).toBe(false);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).not.toMatch('//! legal comment');
				});
			});
		});

		describe('implementation', ({ test }) => {
			test('error', async () => {
				const runWithImplementation = async (implementation: MinifyPluginOptions['implementation']) => {
					await build(
						fixtures.blank,
						(config) => {
							configureEsbuildMinifyPlugin(config, {
								implementation,
							});
						},
						webpack,
					);
				};

				await expect(
					// @ts-expect-error testing invalid type
					runWithImplementation({}),
				).rejects.toThrow(
					'ESBuildMinifyPlugin: implementation.transform must be an ESBuild transform function. Received undefined',
				);

				await expect(
					// @ts-expect-error testing invalid type
					runWithImplementation({ transform: 123 }),
				).rejects.toThrow(
					'ESBuildMinifyPlugin: implementation.transform must be an ESBuild transform function. Received number',
				);
			});

			test('customizable', async () => {
				const code = 'export function foo() { return "CUSTOM_ESBUILD_IMPLEMENTATION"; }';
				const built = await build(
					fixtures.blank,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							implementation: {
								transform: async () => ({
									code,
									map: '',
									warnings: [],
								}),
							},
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);
				expect(
					built.fs.readFileSync('/dist/index.js', 'utf8'),
				).toBe(code);
			});

			test('customize with real esbuild', async () => {
				const built = await build(
					fixtures.minification,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							implementation: esbuild,
						});
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');
				assertMinified(exportedFunction.toString());
			});
		});

		describe('CSS', () => {
			test('minify CSS asset', async () => {
				const built = await build(
					fixtures.css,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							css: true,
						});
						configureMiniCssExtractPlugin(config);
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const file = built.fs.readFileSync('/dist/index.css').toString();
				expect(file.trim()).not.toMatch(/\s{2,}/);
			});

			test('exclude', async () => {
				const built = await build(
					fixtures.css,
					(config) => {
						configureEsbuildMinifyPlugin(config, {
							css: true,
							exclude: /index\.css$/,
						});
						configureMiniCssExtractPlugin(config);
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const file = built.fs.readFileSync('/dist/index.css').toString();
				expect(file.trim()).toMatch(/\s{2,}/);
			});

			test('minify w/ source-map', async () => {
				const built = await build(
					fixtures.css,
					(config) => {
						config.devtool = 'source-map';
						configureEsbuildMinifyPlugin(config, {
							css: true,
						});
						configureMiniCssExtractPlugin(config);
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const cssFile = built.fs.readFileSync('/dist/index.css').toString();
				const css = cssFile.trim().split('\n');
				expect(css[0]).not.toMatch(/\s{2,}/);
				expect(css[2]).toMatch(/sourceMappingURL/);

				const sourcemapFile = built.fs.readFileSync('/dist/index.css.map', 'utf8');
				expect(sourcemapFile).toMatch(/styles\.css/);
			});
		});
	});
});
