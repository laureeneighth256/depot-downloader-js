# depot-downloader-js

JavaScript Steam Depot Downloader by [xMysFad](https://github.com/mysfad)

## Install

```sh
npm i depot-downloader-js -g
```

## Code Usage

```js
import downloadDepot from 'depot-downloader-js'

downloadDepot({manifestFile, decryptionKey, concurrency})
```

## CLI Usage

```sh
depot-downloader-js --manifest <path> --key <key>
```