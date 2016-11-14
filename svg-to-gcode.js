const cheerio = require('cheerio');
const JetHeadRobot = require('./jethead-robot');

function lineCoordinates(line) {
    return {
        x1: parseFloat(cheerio(line).attr('x1')),
        y1: parseFloat(cheerio(line).attr('y1')),
        x2: parseFloat(cheerio(line).attr('x2')),
        y2: parseFloat(cheerio(line).attr('y2')),
    };
}

function getSVGBounds(svg) {
    const lines = svg('line').toArray();

    const points = lines.reduce((pts, line) => {
        const { x1, y1, x2, y2 } = lineCoordinates(line);

        pts.push({ x: x1, y: y1 });
        pts.push({ x: x2, y: y2 });

        return pts;
    }, []);

    return points.reduce((bounds, { x, y }) => {
        bounds.left = x < bounds.left ? x : bounds.left;
        bounds.top = y < bounds.top ? y : bounds.top;
        bounds.right = x > bounds.right ? x : bounds.right;
        bounds.bottom = y > bounds.bottom ? y : bounds.bottom;

        return bounds;
    }, { left: points[0].x, top: points[0].y, right: points[0].x, bottom: points[0].y });
}

function toGcode(svgString, opts) {
    opts = opts || {};
    const minMoveDistance = 0.001; // mm

    let robot = new JetHeadRobot();

    const {
        targetWidth = robot.limit.x,
        targetHeight = robot.limit.y,
    } = opts;

    const svg = cheerio.load(svgString);

    const svgBounds = getSVGBounds(svg);
    const svgDim = {
        width: svgBounds.right - svgBounds.left,
        height: svgBounds.bottom - svgBounds.top,
    };
    const svgOffset = {
        x: -svgBounds.left,
        y: -svgBounds.top,
    };

    const rescaleX = x => targetWidth * (x - svgBounds.left) / svgDim.width;
    const rescaleY = y => targetHeight * (y - svgBounds.top) / svgDim.height;

    const scaledLine = (line) => {
        const { x1, y1, x2, y2 } = lineCoordinates(line);

        return {
            x1: rescaleX(x1),
            y1: rescaleY(y1),
            x2: rescaleX(x2),
            y2: rescaleY(y2),
        };
    };

    const lines = svg('line').toArray();
    robot = lines.reduce((robot, line) => {
        const { x1, y1, x2, y2 } = scaledLine(line);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        robot.addRotation(angle);

        if (robot.flatDistanceTo(x1, y1) >= minMoveDistance) {
            // we are not at the start so we need to get there without drawing
            robot.moveTo(robot.position.x, robot.position.y, 0);
            robot.moveTo(x1, y1);
            robot.moveTo(robot.position.x, robot.position.y, 0);
        }

        robot.lineTo(x2, y2);

        return robot;
    }, robot);

    return robot.gcode;
}

module.exports = toGcode;
