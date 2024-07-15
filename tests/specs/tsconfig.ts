import path from 'path';
import { createRequire } from 'node:module';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { execa } from 'execa';
import { tsconfigJson } from '../utils.js';

const require = createRequire(import.meta.url);

const webpackCli = path.resolve('node_modules/webpack-cli/bin/cli.js');
const esbuildLoader = path.resolve('dist/index.cjs');

const detectStrictMode = '(function() { return !this; })()';

export default testSuite(({ describe }) => {
	describe('tsconfig', ({ describe }) => {
		describe('loader', ({ test }) => {
			test('finds tsconfig.json and applies strict mode', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [
							${detectStrictMode},
							require("./not-strict.ts"),
							require("./different-config/strict.ts"),
						];`,
						'not-strict.ts': `module.exports = ${detectStrictMode}`,
						'different-config': {
							'strict.ts': `module.exports = ${detectStrictMode}`,
							'tsconfig.json': tsconfigJson({
								compilerOptions: {
									strict: true,
								},
							}),
						},
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',
	
						optimization: {
							minimize: false,
						},
	
						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},
	
						module: {
							rules: [{
								test: /\\.ts$/,
								loader: 'esbuild-loader',
							}],
						},
	
						entry: './src/index.ts',

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							strict: true,
						},
						include: [
							'src/index.ts',
						],
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([true, false, true]);
			});

			test('handles resource with query', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [${detectStrictMode}, require("./not-strict.ts?some-query")];`,
						'not-strict.ts': `module.exports = ${detectStrictMode}`,
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',
	
						optimization: {
							minimize: false,
						},
	
						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},
	
						module: {
							rules: [{
								test: /\\.ts$/,
								loader: 'esbuild-loader',
							}],
						},
	
						entry: './src/index.ts',

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							strict: true,
						},
						include: [
							'src/index.ts',
						],
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([true, false]);
			});

			test('accepts custom tsconfig.json path', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [${detectStrictMode}, require("./strict.ts")];`,
						'strict.ts': `module.exports = ${detectStrictMode}`,
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',
	
						optimization: {
							minimize: false,
						},
	
						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},
	
						module: {
							rules: [{
								test: /\\.ts$/,
								loader: 'esbuild-loader',
								options: {
									tsconfig: './tsconfig.custom.json',
								}
							}],
						},
	
						entry: './src/index.ts',

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.custom.json': tsconfigJson({
						compilerOptions: {
							strict: true,
						},
						include: [
							'src/strict.ts',
						],
					}),
				});

				const { stdout } = await execa(webpackCli, {
					cwd: fixture.path,
				});

				expect(stdout).toMatch('does not match its "include" patterns');

				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([true, true]);
			});

			test('applies different tsconfig.json paths', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': 'export class C { foo = 100; }',
						'index2.ts': 'export class C { foo = 100; }',
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',

						optimization: {
							minimize: false,
						},

						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},

						module: {
							rules: [
								{
									test: /index\\.ts$/,
									loader: 'esbuild-loader',
									options: {
										tsconfig: './tsconfig.custom1.json',
									}
								},
								{
									test: /index2\\.ts$/,
									loader: 'esbuild-loader',
									options: {
										tsconfig: './tsconfig.custom2.json',
									}
								}
							],
						},

						entry: {
							index1: './src/index.ts',
							index2: './src/index2.ts',
						},

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.custom1.json': tsconfigJson({
						compilerOptions: {
							useDefineForClassFields: false,
						},
					}),
					'tsconfig.custom2.json': tsconfigJson({
						compilerOptions: {
							useDefineForClassFields: true,
						},
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				const code1 = await fixture.readFile('dist/index1.js', 'utf8');
				expect(code1).toMatch('this.foo = 100;');

				const code2 = await fixture.readFile('dist/index2.js', 'utf8');
				expect(code2).toMatch('__publicField(this, "foo", 100);');
			});
		});

		describe('plugin', ({ test }) => {
			/**
			 * Since the plugin applies on distribution assets, it should not apply
			 * any tsconfig settings.
			 */
			test('should not detect tsconfig.json and apply strict mode', async () => {
				await using fixture = await createFixture({
					src: {
						'index.js': 'console.log(1)',
					},
					'webpack.config.js': `
					const { EsbuildPlugin } = require(${JSON.stringify(esbuildLoader)});
					module.exports = {
						mode: 'production',
						optimization: {
							minimizer: [
								new EsbuildPlugin(),
							],
						},
						entry: './src/index.js',
					};
					`,
					'tsconfig.json': tsconfigJson({
						compilerOptions: {
							strict: true,
						},
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				const code = await fixture.readFile('dist/main.js', 'utf8');
				expect(code).not.toMatch('use strict');
			});
		});
	});
});
