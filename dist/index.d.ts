import { TransformOptions, transform } from 'esbuild';

type Filter = string | RegExp;

type Implementation = {
	transform: typeof transform;
};

type Except<ObjectType, Properties> = {
	[Key in keyof ObjectType as (Key extends Properties ? never : Key)]: ObjectType[Key];
};

type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'> & {
	/** Pass a custom esbuild implementation */
	implementation?: Implementation;

	/**
	 * Path to tsconfig.json file
	 */
	tsconfig?: string;
};

type EsbuildPluginOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'> & {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
	css?: boolean;
	/** Pass a custom esbuild implementation */
	implementation?: Implementation;
};

declare class EsbuildPlugin {
	constructor(options?: EsbuildPluginOptions);

	apply(compiler: any): void;
}

export { EsbuildPlugin, EsbuildPluginOptions, LoaderOptions };
