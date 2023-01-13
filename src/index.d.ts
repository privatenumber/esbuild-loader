import { MinifyPluginOptions } from './types';

export class ESBuildMinifyPlugin {
	constructor(options?: MinifyPluginOptions);

	apply(compiler: any): void;
}

export * from './types';
