import {transform, TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

type Filter = string | RegExp;

type Implementation = {
	transform: typeof transform;
};

type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'> & {
	/** Pass a custom esbuild implementation */
	implementation?: Implementation;
};
type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
	css?: boolean;
	/** Pass a custom esbuild implementation */
	implementation?: Implementation;
};

export {
	LoaderOptions,
	MinifyPluginOptions,
};
