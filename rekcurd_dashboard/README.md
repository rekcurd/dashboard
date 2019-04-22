# Rekcurd dashboard backend
You can use `setting.yml` as your configuration file. See [template](./template/settings.yml-tpl).


## Run it!
### DB
##### help
```bash
$ python app.py db -h
```

##### initialization
```bash
$ python app.py db --settings settings.yml init
$ python app.py db --settings settings.yml migrate
```

##### migration
```bash
$ python app.py db --settings settings.yml migrate
$ python app.py db --settings settings.yml upgrade
```


### Server
##### help
```bash
$ python app.py server -h
```

##### boot
```bash
$ python app.py server --settings settings.yml
```

Launched on `http://0.0.0.0:18080` as a default.
