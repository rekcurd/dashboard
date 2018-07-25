import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import common from './webpack.config.babel';

const src = path.resolve(__dirname, '../src');
const dist = path.resolve(__dirname, '../dist');

const prodConfig = {
  mode: 'production',

  output: {
    path: dist,
    publicPath: '/'
  },

  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'drucker-dashboard-frontend',
      template: `${src}/index.html`,
    })
  ],
};

export default merge(common, prodConfig);
