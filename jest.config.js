module.exports = {
	testEnvironment: 'node',
	transform: {
		'\\.ts$': './test/jest.esbuild-transformer.js',
	},
};
