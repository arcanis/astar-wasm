#ifdef EMSCRIPTEN
# include <emscripten/bind.h>
# include <emmagic/magic.hh>
#endif

#include <array>
#include <list>
#include <optional>
#include <string>

struct Point {
    int x;
    int y;

    Point(void) : x(0), y(0) {}
    Point(int x, int y) : x(x), y(y){}

    Point operator+(Point const & other) const {
        return Point(this->x + other.x, this->y + other.y);
    }

    bool operator==(Point const & other) const {
        return this->x == other.x && this->y == other.y;
    }

    bool operator!=(Point const & other) const {
        return this->x != other.x || this->y != other.y;
    }

#ifdef EMSCRIPTEN
    /*
    std::array<int, 2> toJS(void) {
        return { this->x, this->y };
    }

    static Point fromJS(std::array<int, 2> const & data) {
        return Point(data.at(0), data.at(1));
    }
    /*/
    std::map<std::string, int> toJS(void) {
        return { { "x", this->x }, { "y", this->y } };
    }

    static Point fromJS(std::map<std::string, int> const & data) {
        return Point(data.at("x"), data.at("y"));
    }
    //*/
#endif
};

static Point const allNeighbours[] = {
//  { -1, -1 },
//  {  1, -1 },
//  { -1,  1 },
//  {  1,  1 },
    {  0, -1 },
    { -1,  0 },
    {  0,  1 },
    {  1,  0 },
};

struct Node {
    Point position;
    Point parent;

    int cost;
    int distance;

    Node(Point position, Point parent, int cost, int distance) : position(position), parent(parent), cost(cost), distance(distance) {}

    bool operator==(Point point) const {
        return this->position == point;
    }
};

class AStar {
public:
    static std::optional<std::list<Point>> search(int const * map, int width, int height, Point start, Point end) {
        AStar engine(map, width, height, start, end);
        
        if (engine.search()) {
            return engine.path();
        } else {
            return std::nullopt;
        }
    }

private:
    AStar(int const * map, int width, int height, Point start, Point end) : m_map(map), m_width(width), m_height(height), m_start(start), m_end(end) {}

public:
    int getDistanceToEnd(Point point) const {
        int x = m_end.x - point.x;
        int y = m_end.y - point.y;
        return x * x + y * y;
    }

    bool isValid(Point point) const {
        return point.x >= 0 && point.x < m_width && point.y >= 0 && point.y < m_height;
    }

    int getCost(Point point) const {
        return m_map[point.y * m_width + point.x];
    }

    bool isPointRegistered(Point p, int distCost) {
        std::list<Node>::iterator it;

        it = std::find(m_closed.begin(), m_closed.end(), p);
        if (it != m_closed.end()) {
            if (it->cost + it->distance < distCost) {
                return true;
            } else {
                m_closed.erase(it);
                return false;
            }
        }

        it = std::find(m_open.begin(), m_open.end(), p);
        if (it != m_open.end()) {
            if (it->cost + it->distance < distCost) {
                return true;
            } else {
                m_open.erase(it);
                return false;
            }
        }

        return false;
    }

    bool search(void) {
        m_open.emplace_back(m_start, Point(), 0, this->getDistanceToEnd(m_start));

        while (!m_open.empty()) {
            Node node = m_open.front();
            m_open.pop_front();

            m_closed.emplace_back(node);

            if (this->fillOpen(node)) {
                return true;
            }
        }

        return false;
    }

    std::list<Point> path(void) {
        std::list<Point> path = {m_end};
        
        auto & backNode = m_closed.back();
        path.emplace_front(backNode.position);
        Point parent = backNode.parent;

        for (auto it = m_closed.rbegin(); it != m_closed.rend(); ++it) {
            auto position = it->position;

            if (position == parent && position != m_start) {
                path.push_front(position);
                parent = it->parent;
            }
        }

        path.emplace_front(m_start);

        return path;
    }

    bool fillOpen(Node const & node) {
        for (int t = 0; t < sizeof(allNeighbours) / sizeof(allNeighbours[0]); ++t) {
            Point neighbour = node.position + allNeighbours[t];
            if (neighbour == m_end)
                return true;

            if (this->isValid(neighbour) && this->getCost(neighbour) != 1) {
                int neighbourCost = node.cost + 1;
                int neighbourDistance = this->getDistanceToEnd(neighbour);

                if (!this->isPointRegistered(neighbour, neighbourCost + neighbourDistance)) {
                    m_open.emplace_back(neighbour, node.position, neighbourCost, neighbourDistance);
                }
            }
        }

        return false;
    }

private:
    int const * m_map;

    int m_width;
    int m_height;

    Point m_start;
    Point m_end;

    std::list<Node> m_open;
    std::list<Node> m_closed;
};

int * allocateMap(int width, int height) {
    return new int[width * height];
}

std::optional<std::list<Point>> computeShortestPath(int const * map, int width, int height, Point start, Point end) {
    return AStar::search(map, width, height, start, end);
}

std::string serializeBoard(int const * map, int width, int height, std::list<Point> const & path) {
    // To account for the trailing \n
    int printWidth = width + 1;

    char copy[height * printWidth + 1];
    copy[height * printWidth] = 0;

    for (int y = 0; y < height; ++y) {
        copy[y * printWidth + width] = '\n';
        for (int x = 0; x < width; ++x) {
            copy[y * printWidth + x] = map[y * width + x] == 1 ? '#' : '.';
        }
    }

    for (auto const & point : path)
        copy[point.y * printWidth + point.x] = 'x';

    return std::string(&copy[0], sizeof(copy));
}

#ifndef EMSCRIPTEN
# include <chrono>
# include <iostream>
# include "./map.cc"

int main(int argc, char ** argv) {
    Point start = {1, 1};
    Point end = {g_mapWidth - 2, g_mapHeight - 2};

    int totalTime = 0;

    for (int t = 0; t < g_cycles; ++t) {
        auto before = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch());
        auto path = computeShortestPath(&g_map[0], g_mapWidth, g_mapHeight, start, end);
        auto after = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch());

        totalTime += (after - before).count();
    }

    std::cout << "Avg " << (static_cast<float>(totalTime) / g_cycles) << std::endl;

    return 0;
}

#else
# include <emscripten/bind.h>
# include <emmagic/magic.hh>
# include <emmagic/stl.hh>

EMSCRIPTEN_BINDINGS(test)
{
    using namespace emmagic;

    function<allocateMap>("allocateMap");
    function<computeShortestPath>("computeShortestPath");
    function<serializeBoard>("serializeBoard");
}

#endif
