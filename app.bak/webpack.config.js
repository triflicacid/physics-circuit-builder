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
            })
        ]
    },
    output: {
        publicPath: 'dist',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist') // Absolute path
    }
};

module.exports = config;