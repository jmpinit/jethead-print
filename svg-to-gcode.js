const cheerio = require('cheerio');

// create GCode to make robot do something
class Robot {
    constructor() {
        this.position = {
            x: 0,
            y: 0,
            z: 0,
        };

        this.gcode = ([
            'F100',
            'G1 Z1.0 F3000',
            'G92 E0',
            'G90',
            'G21',
            'G92 E0',
            'M82',
            'M3',
            '',
        ]).join('\n');

        this.drawing = false;
    }

    addCode(lineOfCode) {
        this.gcode += `${lineOfCode}\n`;
    }

    addPosition(x, y, z) {
        if (z !== undefined) {
            this.addCode(`G1 X${x} Y${y} Z${z}`);
        } else {
            this.addCode(`G1 X${x} Y${y}`);
        }

        this.position.x = x;
        this.position.y = y;
        this.position.z = z || this.position.z;
    }

    startDrawing() {
        this.addCode('M8');
        this.drawing = true;
    }

    stopDrawing() {
        this.addCode('M9');
        this.drawing = false;
    }

    flatDistanceTo(x2, y2) {
        const { x, y } = this.position;
        const sqdiff = (a, b) => Math.pow(b - a, 2);
        return Math.sqrt(sqdiff(x, x2) + sqdiff(y, y2));
    }

    moveTo(x, y, z)  {
        if (this.drawing) {
            this.stopDrawing();
        }

        this.addPosition(x, y, z);
    }

    lineTo(x, y, z) {
        if (!this.drawing) {
            this.startDrawing();
        }
        
        this.addPosition(x, y, z);
    }
}

function toGcode(svgString) {
    const svg = cheerio.load(svgString);
    const lines = svg('line').toArray();

    const minMoveDistance = 0.001; // mm

    const robot = lines.reduce((robot, line) => {
        const x1 = parseFloat(cheerio(line).attr('x1'));
        const y1 = parseFloat(cheerio(line).attr('y1'));
        const x2 = parseFloat(cheerio(line).attr('x2'));
        const y2 = parseFloat(cheerio(line).attr('y2'));

        if (robot.flatDistanceTo(x1, y1) >= minMoveDistance) {
            // we are not at the start so we need to get there without drawing
            robot.moveTo(robot.position.x, robot.position.y, -10);
            robot.moveTo(x1, y1);
            robot.moveTo(robot.position.x, robot.position.y, 0);
        }

        robot.lineTo(x2, y2);

        return robot;
    }, new Robot());

    return robot.gcode;
}

module.exports = toGcode;
