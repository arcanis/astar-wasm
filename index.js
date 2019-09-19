const loadWasm = Module => new Promise(resolve => {
    Module.onRuntimeInitialized = () => resolve(Module);
});

const engine = !process.argv.includes(`--wasm`)
    ? Promise.resolve().then(() => require(`./MyAstar.js`))
    : Promise.resolve().then(() => loadWasm(require(`./wasm.js`)));

const mazeGen = require(`@sbj42/maze-generator`);
const seedrandom = require(`seedrandom`);

function generateMap(map, width, height, seed) {
    if (width < 3 || height < 3 || width % 2 !== 1 || height % 2 !== 1)
        throw new Error(`Invalid map size: only odd number larger than 3`);

    const mazeWidth = (width - 1) / 2;
    const mazeHeight = (height - 1) / 2;

    const random = seedrandom(seed);

    const maze = mazeGen.generate(mazeWidth, mazeHeight, {
        generator: `@sbj42/maze-generator-backtrack`,
        random,
    });

    for (let t = 0; t < map.length; ++t)
        map[t] = 1;

    for (let y = 0; y < mazeHeight; ++y) {
        for (let x = 0; x < mazeWidth; ++x) {
            const cell = maze.cell(x, y);
            map[(y * 2 + 1) * width + x * 2 + 1] = 0;

            if (cell.north())
                map[(y * 2) * width + x * 2 + 1] = 0;
            if (cell.south())
                map[((y + 1) * 2) * width + x * 2 + 1] = 0;
            if (cell.west())
                map[(y * 2 + 1) * width + x * 2] = 0;
            if (cell.east()) {
                map[(y * 2 + 1) * width + (x + 1) * 2] = 0;
            }
        }
    }
}

engine.then(({allocateMap, computeShortestPath, serializeBoard}) => {
    // How much times to run the simulation
    const cycles = 100;

    // Size of the map - must be odd
    const width = 151;
    const height = 151;

    const map = allocateMap(width, height);
    generateMap(map, width, height, 42);

    if (process.argv.includes(`--map`)) {
        console.log(`int const g_map[] = {`, Array.from(map).join(`, `), `};`);
        console.log(`int const g_mapWidth = ${width};`);
        console.log(`int const g_mapHeight = ${height};`);
        console.log(`int const g_cycles = ${cycles};`);
        return;
    }

    /*
    const start = [1, 1];
    const end = [width - 2, height - 2];
    /*/
    const start = {x: 1, y: 1};
    const end = {x: width - 2, y: height - 2};
    //*/

    let totalTime = 0;

    for (let t = 0; t < cycles; ++t) {
        const now = Date.now();
        const path = computeShortestPath(map, width, height, start, end);
        const duration = Date.now() - now;

        //process.stdout.write(serializeBoard(map, width, height, path || []));

        totalTime += duration;
    }

    console.log(`Avg`, totalTime / cycles);
});
