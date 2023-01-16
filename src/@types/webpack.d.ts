import 'webpack';

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

	interface AssetInfo {
		minimized?: boolean;
	}
}
