import 'webpack';

declare module 'webpack' {

	namespace compilation {
		interface Compilation {
			getAssets(): Asset[];

			// From Webpack 5
			emitAsset(
				file: string,
				source: Source,
				assetInfo?: AssetInfo,
			): void;
		}
	}

	interface AssetInfo {
		minimized?: boolean;
	}
}
