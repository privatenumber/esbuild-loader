module.exports = {
	rules: {
		'comma-dangle': ['error', 'always-multiline'],
		'@typescript-eslint/comma-dangle': 'off',
		'symbol-description': 'off',
	},
	overrides: [
		{
			files: 'test/*',
			env: 'jest',
		},
	],
};
