const path = require('path');
const TSConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const config = {
    devtool: 'eval-source-map',
    mode: 'development',
    entry: './src/index.ts', // Relative path
    module: {
        rules: [{
            // TS -> JS
            test: /\.ts$/,
            use: 'ts-loader',
            include: [
                // Where the typescript files should be
                path.resolve(__dirname, 'src')
            ]
        }]
    },
    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'src/')
        },
        extensions: ['.ts', '.js'],
        plugins: [
            new TSConfigPathsPlugin({
                extensions: ['.ts', '.js', 'tsx'],
                baseUrl: './src',
            }),
        ]
    },
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        // get the name. E.g. node_modules/packageName/not/this/part.js
                        // or node_modules/packageName
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

                        // npm package names are URL-safe, but some servers don't like @ symbols
                        return `npm.${packageName.replace('@', '')}`;
                    },
                },
            },
        },
    },
    output: {
        publicPath: 'dist/scripts',
        // filename: 'bundle.js',
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist/scripts') // Absolute path
    }
};

module.exports = config;