import {Service, Loader, TransformOptions} from 'esbuild';
import {Compiler as Webpack4Compiler} from 'webpack';

export interface LoaderOptions {
	target?: string;
	loader?: Loader;
	minify?: boolean;
	tsconfigRaw?: TransformOptions['tsconfigRaw'];
}

export interface Compiler extends Webpack4Compiler {
	$esbuildService?: Service;
}

export interface MinifyPluginOptions {
	target?: string;
	loader?: Loader;
	minify?: boolean;
	minifyWhitespace?: boolean;
	minifyIdentifiers?: boolean;
	minifySyntax?: boolean;
	sourcemap?: boolean;
}
