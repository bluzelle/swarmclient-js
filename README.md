# JS setup documentation

1. Install [NodeJS](https://nodejs.org/en/download/package-manager/) - provides desktop JavaScript capabilities and comes bundled with the *Node Package Manager* (npm).

2. Get our client code (https://github.com/bluzelle/swarmclient-js)


## Building the CRUD app

```
1. cd swarmclient-js
2. npm install
3. cd crud/web
4. npm install
5. npm run dev-compile
6. cd ../desktop
7. npm run start
```

> Note: any directory containing a `package.json` file is considered an *npm module*. We run `npm install` from that directory to install relevant dependencies.


## Using `bluzelle` in a JS project

```
1. mkdir myProject; cd myProject
2. npm init
3. npm install bluzelle
4. vim index.js

> const bluzelle = require('bluzelle');
> ...
> ...

5. node index.js
```


## Running `bluzelle` client end-to-end tests with emulator

```
1. cd swarmclient-js
2. npm install
3. cd bluzelle-js
4. npm install
5. npm run test
```