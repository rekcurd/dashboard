# Rekcurd dashboard backend
## Edit settings.yml
```
$ vi settings.yml
```

## Run it!
### DB
```bash
$ python app.py --settings settings.yml db init
$ python app.py --settings settings.yml db migrate
```

### Server
```bash
$ python app.py --settings settings.yml server
```

Launched on `http://0.0.0.0:18080` as a default.
