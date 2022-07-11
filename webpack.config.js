const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: ['./src/js/main.js'],
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        assetModuleFilename: "images/[name][ext]",
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader",
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: "asset/resource",
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './index.html' }),
    ]
};