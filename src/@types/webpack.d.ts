import 'webpack';

declare module 'webpack' {

	namespace compilation {
		interface Compilation {
			getAssets(): Asset[];
		}
	}

    interface AssetInfo {
		minimized?: boolean;
	}
}

