import 'webpack';
import type { LoaderContext as Webpack5LoaderContext } from 'webpack5';

declare module 'webpack' {

	namespace compilation {
		interface Compilation {
			getAssets(): Asset[];
			emitAsset(
				file: string,
				source: Source,
				assetInfo?: AssetInfo,
			): void;
		}
	}

	namespace loader {
		interface LoaderContext <T> {
			getOptions: Webpack5LoaderContext<T>['getOptions'];
		}
	}

	interface AssetInfo {
		minimized?: boolean;
	}
}
