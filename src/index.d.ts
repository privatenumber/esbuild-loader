import { EsbuildPluginOptions } from './types.js';

export class EsbuildPlugin {
	constructor(options?: EsbuildPluginOptions);

	apply(compiler: any): void;
}

export * from './types.js';
