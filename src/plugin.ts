import { startService } from 'esbuild';
import { Compiler } from './interfaces';

class ESBuildPlugin {
	apply(compiler: Compiler) {
		let watching = false;

		const safeStartService = async () => {
			if (!compiler.$esbuildService) {
				compiler.$esbuildService = await startService();
			}
		};

		compiler.hooks.thisCompilation.tap('esbuild', compilation => {
			compilation.hooks.childCompiler.tap('esbuild', childCompiler => {
				childCompiler.$esbuildService = compiler.$esbuildService;
			});
		});

		compiler.hooks.run.tapPromise('esbuild', async () => {
			await safeStartService();
		});

		compiler.hooks.watchRun.tapPromise('esbuild', async () => {
			watching = true;
			await safeStartService();
		});

		compiler.hooks.done.tap('esbuild', () => {
			if (!watching && compiler.$esbuildService) {
				compiler.$esbuildService.stop();
				compiler.$esbuildService = undefined;
			}
		});
	}
}

export default ESBuildPlugin;
