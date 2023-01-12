import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import type { MinifyPluginOptions } from '../../dist/interfaces.js';
import {
	configureEsbuildLoader,
	configureCssLoader,
	type SourceMapDevToolPlugin,
} from '../utils';

const trySyntax = (
	name: string,
	code: string,
) => `
(() => {
	try {
		${code}
		return ${JSON.stringify(name)};
	} catch (error) {
		return error;
	}
})()
`;

const exportFrom = (filePath: string) => `export { default } from ${JSON.stringify(filePath)};`;

const js = `
export default [${[
	trySyntax(
		'es2016 - Exponentiation operator',
		'10 ** 4',
	),

	trySyntax(
		'es2017 - Async functions',
		'typeof (async () => {})',
	),

	// trySyntax(
	// 	'es2018 - Asynchronous iteration',
	// 	'for await (let x of []) {}',
	// ),

	trySyntax(
		'es2018 - Spread properties',
		'let x = {...Object}',
	),

	trySyntax(
		'es2018 - Rest properties',
		'let {...x} = Object',
	),

	trySyntax(
		'es2019 - Optional catch binding',
		'try {} catch {}',
	),

	trySyntax(
		'es2020 - Optional chaining',
		'Object?.keys',
	),

	trySyntax(
		'es2020 - Nullish coalescing',
		'Object ?? true',
	),

	trySyntax(
		'es2020 - import.meta',
		'import.meta',
	),

	trySyntax(
		'es2021 - Logical assignment operators',
		'let a = false; a ??= true; a ||= true; a &&= true;',
	),

	trySyntax(
		'es2022 - Class instance fields',
		'(class { x })',
	),

	trySyntax(
		'es2022 - Static class fields',
		'(class { static x })',
	),

	trySyntax(
		'es2022 - Private instance methods',
		'(class { #x() {} })',
	),

	trySyntax(
		'es2022 - Private instance fields',
		'(class { #x })',
	),

	trySyntax(
		'es2022 - Private static methods',
		'(class { static #x() {} })',
	),

	trySyntax(
		'es2022 - Private static fields',
		'(class { static #x })',
	),

	// trySyntax(
	// 	'es2022 - Ergonomic brand checks',
	// 	'(class { #brand; static isC(obj) { return try obj.#brand; } })',
	// ),

	trySyntax(
		'es2022 - Class static blocks',
		'(class { static {} })',
	),

	// trySyntax(
	// 	'esnext - Import assertions',
	// 	'import "x" assert {}',
	// ),

].join(',')}];
`;

export default testSuite(({ describe }, webpack: typeof webpack4 | typeof webpack5) => {
	describe('Loader', ({ test, describe }) => {
		describe('Error handling', ({ test }) => {
			test('tsx fails to be parsed as ts', async () => {
				const built = await build(
					{
						'/src/index.js': exportFrom('./foo.tsx'),
						'/src/foo.tsx': 'export default <div>hello world</div>',
					},
					(config) => {
						configureEsbuildLoader(config);

						config.module!.rules!.push({
							test: /\.tsx$/,
							loader: 'esbuild-loader',
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
				{
					'/src/index.js': exportFrom('./js.js'),
					'/src/js.js': js,
				},
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
				{
					'/src/index.js': exportFrom('./ts.ts'),
					'/src/ts.ts': `
						import type {Type} from 'foo'
				
						interface Foo {}
				
						type Foo = number
				
						declare module 'foo' {}
				
						enum BasicEnum {
							Left,
							Right,
						}
				
						enum NamedEnum {
							SomeEnum = 'some-value',
						}
				
						const a = BasicEnum.Left;
				
						const b = NamedEnum.SomeEnum;
				
						export default function foo(): string {
							return 'foo'
						}
				
						// For "ts as tsx" test
						const bar = <T>(value: T) => fn<T>();
					`,
				},
				(config) => {
					configureEsbuildLoader(config);

					config.module!.rules!.push({
						test: /\.ts$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'ts',
						},
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
				{
					'/src/index.js': exportFrom('./tsx.tsx'),
					'/src/tsx.tsx': 'export default (<><div>hello world</div></>);',
				},
				(config) => {
					configureEsbuildLoader(config);

					config.module!.rules!.push({
						test: /\.tsx$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
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
				{
					'/src/index.js': exportFrom('./tsx.tsx'),
					'/src/tsx.tsx': 'export default (<div>hello world</div>);',
				},
				(config) => {
					configureEsbuildLoader(config);

					config.module!.rules!.push({
						test: /\.tsx$/,
						loader: 'esbuild-loader',
						options: {
							loader: 'tsx',
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
					implementation: MinifyPluginOptions['implementation'],
				) => {
					const built = await build(
						{ '/src/index.js': '' },
						(config) => {
							configureEsbuildLoader(config);

							config.module!.rules!.push({
								test: /\.js$/,
								loader: 'esbuild-loader',
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
					{
						'/src/index.js': exportFrom('./ts.ts'),
						'/src/ts.ts': '',
					},
					(config) => {
						configureEsbuildLoader(config);

						config.module!.rules!.push({
							test: /\.ts$/,
							loader: 'esbuild-loader',
							options: {
								loader: 'tsx',
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
					{
						'/src/index.js': exportFrom('./foo.ts'),
						'/src/foo.ts': `
							import type {Type} from 'foo'
					
							interface Foo {}
					
							type Foo = number
					
							declare module 'foo' {}
					
							enum BasicEnum {
								Left,
								Right,
							}
					
							enum NamedEnum {
								SomeEnum = 'some-value',
							}
					
							export const a = BasicEnum.Left;
					
							export const b = NamedEnum.SomeEnum;
					
							export default function foo(): string {
								return 'foo'
							}
					
							// For "ts as tsx" test
							const bar = <T>(value: T) => fn<T>();
						`,
					},
					(config) => {
						configureEsbuildLoader(config);
						config.module!.rules!.push({
							test: /\.tsx?$/,
							loader: 'esbuild-loader',
							options: {
								loader: 'tsx',
							},
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
					{
						'/src/index.js': `
							export { default } from './foo.ts'
						`,
						'/src/foo.ts': `
							const testFn = <V>(
								l: obj,
								options: { [key in obj]: V },
							): V => {
								return options[l];
							};
					
							export default testFn;
						`,
					},
					(config) => {
						configureEsbuildLoader(config);

						config.module!.rules!.push({
							test: /\.tsx?$/,
							loader: 'esbuild-loader',
							options: {
								loader: 'tsx',
							},
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
					{
						'/src/index.js': 'export { default } from "./foo.ts"',
						'/src/foo.ts': 'export default () => <a>1</a>/g',
					},
					(config) => {
						configureEsbuildLoader(config);
						config.module!.rules!.push({
							test: /\.tsx?$/,
							loader: 'esbuild-loader',
							options: {
								loader: 'tsx',
							},
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
					{
						'/src/index.js': 'export { default } from "./tsx.tsx"',
						'/src/tsx.tsx': 'export default () => <a>1</a>/g',
					},
					(config) => {
						configureEsbuildLoader(config);

						config.module!.rules!.push({
							test: /\.tsx?$/,
							loader: 'esbuild-loader',
							options: {
								loader: 'tsx',
							},
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
					{
						'/src/index.js': 'export { default } from "./js.js"',
						'/src/js.js': js,
					},
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
				const built = await build({
					'/src/index.js': 'export { default } from "./js.js"',
					'/src/js.js': js,
				}, (config) => {
					configureEsbuildLoader(config);
					config.devtool = 'inline-source-map';
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const dist = built.fs.readFileSync('/dist/index.js', 'utf8');
				expect(dist).toContain('sourceMappingURL');
			});

			test('source-map file', async () => {
				const built = await build({
					'/src/index.js': 'export { default } from "./js.js"',
					'/src/js.js': js,
				}, (config) => {
					configureEsbuildLoader(config);
					config.devtool = 'source-map';
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const { assets } = built.stats.compilation;
				expect(assets).toHaveProperty(['index.js']);
				expect(assets).toHaveProperty(['index.js.map']);
			});

			test('source-map plugin', async () => {
				const built = await build({
					'/src/index.js': 'export { default } from "./js.js"',
					'/src/js.js': js,
				}, (config) => {
					configureEsbuildLoader(config);

					delete config.devtool;
					(config.plugins as SourceMapDevToolPlugin[]).push(
						new webpack.SourceMapDevToolPlugin({}),
					);
				}, webpack);

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
			const built = await build({
				'/src/index.js': 'import "./styles.css"',
				'/src/styles.css': `
				div {
					color: red;
				}
				span {
					margin: 0px 10px;
				}
				`,
			}, (config) => {
				configureEsbuildLoader(config);
				const cssRule = configureCssLoader(config);
				cssRule.use.push({
					loader: 'esbuild-loader',
					options: {
						loader: 'css',
						minify: true,
					},
				});
			}, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const code = built.fs.readFileSync('/dist/index.js', 'utf8');
			expect(code).toContain('div{color:red}');
		});
	});
});
