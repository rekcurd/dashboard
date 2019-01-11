import path from 'path';
import webpack from 'webpack';

const src = path.resolve(__dirname, '../src');

export default {
  entry: {
    typescript: path.resolve(`${src}/app.tsx`)
  },

  output: {
    filename: 'js/bundle.js',
  },

  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.sass', '.scss'],
    alias: {
      '@base': path.resolve(`${src}/app.tsx`),
      '@src': src,
      '@common': path.resolve(`${src}/components/Common`),
      '@components': path.resolve(`${src}/components`),
    },
    modules: ['node_modules', '@base', '@src', '@common', '@components']
  },

  module: {
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, loader: 'ts-loader' },
      {
        test: /\.s?a?css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
              sourceMap: true,
              importLoaders: true,
            },
          },
          'sass-loader'
        ]
      },
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      REACT_APP_CONFIG: JSON.stringify(require('./config.json')),
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        API_HOST: JSON.stringify(process.env.API_HOST || 'http://localhost'),
        API_PORT: JSON.stringify(process.env.API_PORT || '18080')
      }
    })
  ],
};
