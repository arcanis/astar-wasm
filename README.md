# A* in WebAssembly

This repository is a showcase of a same implementation running on three different ecosystem: one in pure JS, another in native C++17, and the final one compiled to WASM and run within Node.

Interestingly my results seem to indicate that the JS one is faster than the native one, which leads me to believe I've made an error somewhere:

```
./native
Avg 130.58
node ./index.js --wasm
Avg 121.24
node ./index.js
Avg 111.55
```

## Prerequisites

You must have the [emsdk](https://github.com/emscripten-core/emsdk) located in `$HOME/emsdk`.

## Usage

Just run `yarn && make all`. This will run the same benchmark on the various environments (they all follow the same logic).
