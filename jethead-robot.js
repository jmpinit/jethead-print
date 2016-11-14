function pt(x, y, z) {
    return { x, y, z };
}

function clamp(v, min, max) {
    return Math.max(Math.min(v, max), min);
}

// create GCode to make robot do something
// units in mm
class JetHeadRobot {
    constructor() {
        this.rate = pt(1000, 1000, 100);
        this.limit = pt(290, 290, 10);
        this.position = pt(0, 0, 0);
        this.stepsPerMM = pt(40, 40, 1287.3);

        // rotation axis angle
        this.angle = 0;
        this.secondsPerRadian = 2 / Math.PI;
        this.rotationAxisOffset = 3; // mm

        this.gcode = ([
            /*
            '$20=0', // enable soft limits
            `$100=${this.stepsPerMM.x}`,
            `$110=${this.stepsPerMM.y}`,
            `$120=${this.stepsPerMM.z}`,
            `$130=${this.limit.x}`,
            `$131=${this.limit.y}`,
            `$132=${this.limit.z}`,
            `$110=${this.rate.x}`,
            `$111=${this.rate.y}`,
            `$112=${this.rate.z}`,
            */
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

    addPosition(x, y) {
        const rotOffsetX = this.rotationAxisOffset * Math.cos(-(this.angle + Math.PI / 2));
        const rotOffsetY = this.rotationAxisOffset * Math.sin(-(this.angle + Math.PI / 2));

        let correctedX = clamp(x + rotOffsetX, 0, this.limit.x);
        let correctedY = clamp(y + rotOffsetY, 0, this.limit.y);

        this.addCode(`G1 X${correctedX} Z${correctedY}`);

        this.position.x = x;
        this.position.y = y;
    }

    addRotation(angle) {
        if (angle < 0) {
            // make it greater than zero
            angle += Math.ceil(-angle % (2 * Math.PI)) * (2 * Math.PI);
        }

        // limit to 0-180 degrees for actuator
        const limitedAngle = angle % Math.PI;
        const pwm = Math.floor(1000 * limitedAngle / Math.PI);
        const dwellTime = this.secondsPerRadian * Math.abs(limitedAngle - this.angle);

        // don't draw while rotating
        const wasDrawing = this.drawing;
        if (wasDrawing) {
            this.stopDrawing();
        }

        // move to correct offset
        this.angle = limitedAngle;
        this.addPosition(this.position.x, this.position.y);

        // rotation angle is tied to spindle speed
        this.addCode(`S${pwm}`);

        // dwell long enough to complete rotation
        this.addCode(`G4 P${dwellTime}`);

        // begin drawing again
        if (wasDrawing) {
            this.startDrawing();
        }
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

module.exports = JetHeadRobot;
