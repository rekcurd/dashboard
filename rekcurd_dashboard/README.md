# Rekcurd dashboard backend
You can use `setting.yml` as your configuration file. See [template](./template/settings.yml-tpl).


## Run it!
### DB
##### help
```bash
$ rekcurd_dashboard db -h
```

##### initialization
```bash
$ rekcurd_dashboard db --settings settings.yml init
$ rekcurd_dashboard db --settings settings.yml migrate
```

##### migration
```bash
$ rekcurd_dashboard db --settings settings.yml migrate
$ rekcurd_dashboard db --settings settings.yml upgrade
```


### Server
##### help
```bash
$ rekcurd_dashboard server -h
```

##### boot
```bash
$ rekcurd_dashboard server --settings settings.yml
```

Launched on `http://0.0.0.0:18080` as a default.
