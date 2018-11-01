# Drucker dashboard frontend
### Download
```
$ git clone https://github.com/drucker/drucker-dashboard.git drucker-dashboard
```

### Run it!
```shell
$ cd frontend
$ yarn install
$ API_HOST=http://0.0.0.0 API_PORT=18080 yarn run start
```

Specify the backend host URI. The frontend is launched on `http://0.0.0.0:8080` as a default.

If you want to generate a production build, run below. You can find generated files (`index.html` and `bundle.js`) under `dist` directory.
```shell
$ API_HOST=http://0.0.0.0 API_PORT=18080 yarn run build
```
