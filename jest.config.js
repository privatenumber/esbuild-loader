module.exports = {
	testEnvironment: 'node',
	moduleNameMapper: {
		'^esbuild-loader$': '<rootDir>/src',
	},
	preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: './src/tsconfig.json',
		},
	},
};
