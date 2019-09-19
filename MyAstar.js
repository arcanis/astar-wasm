const allNeighbours = [
//  {x: -1, y: -1},
//  {x:  1, y: -1},
//  {x: -1, y:  1},
//  {x:  1, y:  1},
    {x:  0, y: -1},
    {x: -1, y:  0},
    {x:  0, y:  1},
    {x:  1, y:  0},
];

// Used to avoid allocations
const temporaryNeighbour = {
    x: 0,
    y: 0,
};

class AStar {
    constructor(map, width, height, start, end) {
        this.map = map;

        this.width = width;
        this.height = height;

        this.start = start;
        this.end = end;

        this.open = [];
        this.closed = [];
    }

    getDistanceToEnd(point) {
        const x = this.end.x - point.x;
        const y = this.end.y - point.y;
        return x * x + y * y;
    }

    isValid(point) {
        return point.x >= 0 && point.x < this.width && point.y >= 0 && point.y < this.height;
    }

    getCost(point) {
        return this.map[point.y * this.width + point.x];
    }

    isPointRegistered(point, distCost) {
        const findByPosition = node => {
            return node.position.x === point.x && node.position.y === point.y;
        };

        const closedIt = this.closed.findIndex(findByPosition);
        if (closedIt !== -1) {
            const closed = this.closed[closedIt];
            if (closed.cost + closed.distance < distCost) {
                return true;
            } else {
                this.closed.splice(closedIt, 1);
                return false;
            }
        }

        const openIt = this.open.findIndex(findByPosition);
        if (openIt !== -1) {
            const open = this.open[openIt];
            if (open.cost + open.distance < distCost) {
                return true;
            } else {
                this.open.splice(openIt, 1);
                return false;
            }
        }
    }

    search() {
        this.open.push({
            position: this.start,
            parent: {x: 0, y: 0},
            cost: 0,
            distance: this.getDistanceToEnd(this.start),
        });

        while (this.open.length > 0) {
            const node = this.open.shift();
            this.closed.push(node);

            if (this.fillOpen(node)) {
                return true;
            }
        }

        return false;
    }

    path() {
        const path = [this.end];

        const backNode = this.closed[this.closed.length - 1];
        path.unshift(backNode.position);
        let parent = backNode.parent;

        for (let t = this.closed.length - 1; t >= 0; --t) {
            const node = this.closed[t];
            const {position} = node;

            if ((position.x === parent.x && position.y === parent.y) && (position.x !== this.start.x || position.y !== this.start.y)) {
                path.unshift(position);
                parent = node.parent;
            }
        }

        path.unshift(this.start);

        return path;
    }

    fillOpen(node) {
        for (let t = 0; t < allNeighbours.length; ++t) {
            temporaryNeighbour.x = node.position.x + allNeighbours[t].x;
            temporaryNeighbour.y = node.position.y + allNeighbours[t].y;
            if (temporaryNeighbour.x === this.end.x && temporaryNeighbour.y === this.end.y)
                return true;

            if (this.isValid(temporaryNeighbour) && this.getCost(temporaryNeighbour) != 1) {
                const neighbourCost = node.cost + 1;
                const neighbourDistance = this.getDistanceToEnd(temporaryNeighbour);

                if (!this.isPointRegistered(temporaryNeighbour, neighbourCost + neighbourDistance)) {
                    this.open.push({
                        position: {x: temporaryNeighbour.x, y: temporaryNeighbour.y},
                        parent: node.position,
                        cost: neighbourCost,
                        distance: neighbourDistance,
                    });
                }
            }
        }

        return false;
    }
}

exports.allocateMap = function (width, height) {
    return new Uint8Array(width * height);
};

exports.computeShortestPath = function (map, width, height, start, end) {
    const engine = new AStar(map, width, height, start, end);

    if (engine.search()) {
        return engine.path();
    } else {
        return null;
    }
};

exports.serializeBoard = function (map, width, height, path) {
    let board = '';

    const nodes = new Set();
    for (let t = 0; t < path.length; ++t)
        nodes.add(`${path[t].x}x${path[t].y}`);

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            if (nodes.has(`${x}x${y}`)) {
                board += `x`;
            } else {
                board += map[y * width + x] === 1 ? `#` : `.`;
            }
        }

        board += `\n`;
    }

    return board;
};
