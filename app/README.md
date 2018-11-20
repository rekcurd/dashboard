# Drucker dashboard backend
### Download
```
$ git clone https://github.com/drucker/drucker-dashboard.git drucker-dashboard
```

### Edit settings.yml
```
$ cd app
$ vi settings.yml
```

All you have to do is specify the DB (sqlite or MySQL) you want to use.

### Run it!
```
$ cd app
$ sh start.sh
```

### Test
```
$ cd app
$ sh drucker-grpc-proto/run_codegen.sh
$ cp drucker-grpc-proto/protobuf/drucker_pb2.py .
$ cp drucker-grpc-proto/protobuf/drucker_pb2_grpc.py .
$ DRUCKER_TEST_MODE=true python -m unittest
```
