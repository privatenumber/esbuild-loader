const esbuild = require('esbuild');

class ESBuildPlugin {
	/**
   * @param {import('webpack').Compiler} compiler
   */
	apply(compiler) {
		let watching = false;

		const startService = async () => {
			if (!compiler.$esbuildService) {
				compiler.$esbuildService = await esbuild.startService();
			}
		};

		compiler.hooks.thisCompilation.tap('esbuild', compilation => {
			compilation.hooks.childCompiler.tap('esbuild', childCompiler => {
				childCompiler.$esbuildService = compiler.$esbuildService;
			});
		});

		compiler.hooks.run.tapPromise('esbuild', async () => {
			await startService();
		});

		compiler.hooks.watchRun.tapPromise('esbuild', async () => {
			watching = true;
			await startService();
		});

		compiler.hooks.done.tap('esbuild', () => {
			if (!watching && compiler.$esbuildService) {
				compiler.$esbuildService.stop();
				compiler.$esbuildService = undefined;
			}
		});
	}
}

module.exports = ESBuildPlugin;
