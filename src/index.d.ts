import type { EsbuildPluginOptions } from './types.js';

export class EsbuildPlugin {
	constructor(options?: EsbuildPluginOptions);

	apply(): void;
}

export * from './types.js';
