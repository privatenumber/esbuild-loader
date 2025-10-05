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
			test('auto-detects tsconfig and applies to all files regardless of include patterns', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [
							${detectStrictMode},
							require("./lib.ts"),
							require("./nested/also-strict.ts"),
						];`,
						'lib.ts': `module.exports = ${detectStrictMode}`,
						nested: {
							'also-strict.ts': `module.exports = ${detectStrictMode}`,
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

				// All files get strict mode from their nearest tsconfig
				// lib.ts is NOT in include pattern but still gets strict mode
				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([true, true, true]);
			});

			test('handles resource with query string', async () => {
				await using fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [${detectStrictMode}, require("./lib.ts?some-query")];`,
						'lib.ts': `module.exports = ${detectStrictMode}`,
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
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				// Both files get strict mode even with query string in require
				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([true, true]);
			});

			test('applies custom tsconfig to all files regardless of include patterns', async () => {
				await using fixture = await createFixture({
					src: {
						'utils/lib.ts': `module.exports = ${detectStrictMode}`,
						'app/index.ts': `module.exports = [${detectStrictMode}, require("../utils/lib.ts")];`,
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
									tsconfig: './tsconfig.json',
								}
							}],
						},

						entry: './src/app/index.ts',

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
							'src/app/**/*',
						],
					}),
				});

				const { stdout, exitCode } = await execa(webpackCli, {
					cwd: fixture.path,
				});

				// Should NOT produce warnings even though lib.ts is not in include patterns
				// TypeScript applies tsconfig to all imports
				expect(stdout).not.toMatch('does not match its "include" patterns');
				expect(exitCode).toBe(0);

				// Both files should have strict mode applied
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

			test('fails on invalid tsconfig.json', async () => {
				await using fixture = await createFixture({
					'tsconfig.json': tsconfigJson({
						extends: 'unresolvable-dep',
					}),
					src: {
						'index.ts': `
						console.log('Hello, world!' as numer);
						`,
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

						resolve: {
							extensions: ['.ts', '.js'],
						},

						module: {
							rules: [
								{
									test: /.[tj]sx?$/,
									loader: 'esbuild-loader',
									options: {
										target: 'es2015',
									}
								}
							],
						},

						entry: {
							index: './src/index.ts',
						},
					};
					`,
				});

				const { stdout, exitCode } = await execa(webpackCli, {
					cwd: fixture.path,
					reject: false,
				});

				expect(stdout).toMatch('Error parsing tsconfig.json:\nFile \'unresolvable-dep\' not found.');
				expect(exitCode).toBe(1);
			});

			test('ignores invalid tsconfig.json in JS dependencies', async () => {
				await using fixture = await createFixture({
					'node_modules/fake-lib': {
						'package.json': JSON.stringify({
							name: 'fake-lib',
						}),
						'tsconfig.json': tsconfigJson({
							extends: 'unresolvable-dep',
						}),
						'index.js': 'export function testFn() { return "Hi!" }',
					},
					'src/index.ts': `
					import { testFn } from "fake-lib";
					testFn();
					`,
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

						resolve: {
							extensions: ['.ts', '.js'],
						},

						module: {
							rules: [
								{
									test: /.[tj]sx?$/,
									loader: 'esbuild-loader',
									options: {
										target: 'es2015',
									}
								}
							],
						},

						entry: {
							index: './src/index.ts',
						},
					};
					`,
				});

				const { stdout, exitCode } = await execa(webpackCli, {
					cwd: fixture.path,
				});

				expect(stdout).not.toMatch('Error parsing tsconfig.json');
				expect(exitCode).toBe(0);
			});

			test('warns on invalid tsconfig.json in TS dependencies', async () => {
				await using fixture = await createFixture({
					'node_modules/fake-lib': {
						'package.json': JSON.stringify({
							name: 'fake-lib',
						}),
						'tsconfig.json': tsconfigJson({
							extends: 'unresolvable-dep',
						}),
						'index.ts': 'export function testFn(): string { return "Hi!" }',
					},
					'src/index.ts': `
					import { testFn } from "fake-lib";
					testFn();
					`,
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

						resolve: {
							extensions: ['.ts', '.js'],
						},

						module: {
							rules: [
								{
									test: /.[tj]sx?$/,
									loader: 'esbuild-loader',
									options: {
										target: 'es2015',
									}
								}
							],
						},

						entry: {
							index: './src/index.ts',
						},
					};
					`,
				});

				const { stdout, exitCode } = await execa(webpackCli, {
					cwd: fixture.path,
				});

				expect(stdout).toMatch('Error parsing tsconfig.json:\nFile \'unresolvable-dep\' not found.');

				// Warning so doesn't fail
				expect(exitCode).toBe(0);
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
