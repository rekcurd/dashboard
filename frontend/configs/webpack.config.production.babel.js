import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import common from './webpack.config.babel';

const src = path.resolve(__dirname, '..', 'src');
const dist = path.resolve(__dirname, '..', '..', 'drucker_dashboard', 'static', 'dist');

const prodConfig = {
  mode: 'production',

  output: {
    path: dist,
    publicPath: '/static/dist'
  },

  plugins: [
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        API_HOST: JSON.stringify(process.env.API_HOST || 'http://localhost'),
        API_PORT: JSON.stringify(process.env.API_PORT || '18080')
      }
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      title: 'dashboard-frontend',
      template: `${src}/index.html`,
    })
  ],
};

export default merge(common, prodConfig);
