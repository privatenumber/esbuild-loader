export const blank = {
	'/src/index.js': '',
};

export const minification = {
	'/src/index.js': 'export default ( stringVal )  =>  { return stringVal }',
};

export const legalComments = {
	'/src/index.js': `
		//! legal comment
		globalCall();
	`,
};
