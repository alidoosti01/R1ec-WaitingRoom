# R1ec-WaitingRoom
This is the Waiting room project on Arvan edge computing likes Cloudflare workers.

## Build Redis Proxy docker image
For build image you need to add your **redis server ip** for connect to it in the index.js file:
```js
const redis = new Redis({
  host: 'redis-server-ip',
  port: 6379
})
```

for build the image you can use bellow command, but remember that if you change the bellow command for **image name**, you shoud change docker-compose.yaml file for name of redis proxy:
```bash
cd redis_proxy
docker build -t redis-proxy .
```

## Create container and run Redis and Redis proxy
**be attention: Redis is not have any configuration, e.g. password and authentication**

everything is fine and you can run docker compose:
```bash
docker compose up -d
```

## install r1ec CLI and deploy our project
We use r1ec CLI for deploy our code. for first we need to install the r1ec CLI:
```bash
npm install -g r1ec
```

after install we should **login** with our API key:
```bash
r1ec login
```

after login we can deploy our project in our account:
```bash
r1ec deploy <name> -f index.js
```

this file is the main code which we want to run on the edge's.


