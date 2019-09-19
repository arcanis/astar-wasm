all: bench-native bench-wasm bench-js

bench-native: ./native
	./native

bench-wasm: wasm.js index.js
	node ./index.js --wasm

bench-js: index.js
	node ./index.js

# ---

./wasm.js: MyAstar.cc
	source ~/emsdk/emsdk_env.sh >& /dev/null && em++ --std=c++17 -O3 -Inode_modules/@manaflair/emmagic/includes MyAstar.cc --bind -o wasm.js

./map.cc: index.js
	node ./index.js --map > map.cc

./native: MyAstar.cc map.cc
	clang++ --std=c++17 -O3 MyAstar.cc -o native

# ---

.PHONY: all bench-native bench-wasm bench-js
