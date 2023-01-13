import type { MinifyPluginOptions } from './interfaces';

export class ESBuildMinifyPlugin {
	constructor(options?: MinifyPluginOptions);

	apply(compiler: any): void;
}

export * from './interfaces';
