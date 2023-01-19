import { EsbuildPluginOptions } from './types';

export class EsbuildPlugin {
	constructor(options?: EsbuildPluginOptions);

	apply(compiler: any): void;
}

export * from './types';
