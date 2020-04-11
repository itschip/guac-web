module.exports = {
	locales: ['en', 'nb'],
	sourceLocale: 'en',
	fallbackLocale: 'en',
	compileNamespace: 'cjs',
	format: 'po',
	extractBabelOptions: {
	  plugins: [
		'@babel/plugin-syntax-dynamic-import'
	  ]
	},
	catalogs: [
	  {
		path: '<rootDir>/locale/{locale}/messages',
		include: '<rootDir>',
		exclude: ['**/node_modules/**'],
	  },
	],
  }  