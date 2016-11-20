#!/usr/bin/env node

const fs = require('fs');
const minimist = require('minimist');
const ragecode = require('ragecode').ragecode;
const osc = require('osc');
const toGcode = require('./svg-to-gcode');
const JetHeadRobot = require('./jethead-robot');

function serveOSC(instructions, interval, port) {
    console.log(`sending OSC messages to 127.0.0.1 on port ${port}`);
    const udpPort = new osc.UDPPort({});

    udpPort.on('open', () => {
        udpPort.on('error', error => console.log(`An error occurred: ${error.message}`));

        const sendInterval = setInterval(() => {
            const instruction = instructions.shift();

            if (instruction === undefined) {
                clearInterval(sendInterval);
                console.log('done');
                return;
            }

            if (instruction.type === 'location') {
                const { x, y } = instruction.position;

                udpPort.send({
                    address: '/position',
                    args: [x, y],
                }, '127.0.0.1', port);
            } else if (instruction.type === 'endStroke') {
                udpPort.send({
                    address: '/endStroke',
                }, '127.0.0.1', port);
            }
        }, interval);
    });

    udpPort.open();
}

function die(msg) {
    console.log(msg);
    process.exit(1);
}

function main() {
    const argv = minimist(process.argv.slice(2));

    if (argv._.length === 0) {
        die('Must specify input file');
    }

    const fileContents = fs.readFileSync(argv._[0], 'utf16le');

    const parser = new ragecode.ScriptParser();
    fileContents.split('\r\n').forEach(line => parser.parseLine(line));

    // add robot outline
    if (argv['show-bounds']) {
        const addPt = (x, y) => {
            parser.instructions.push({
                type: 'location',
                position: { x, y },
            });

            parser.instructions.push({ type: 'endStroke' });
        };

        addPt(0, 0);
        addPt(JetHeadRobot.limit.x, 0);
        addPt(JetHeadRobot.limit.x, JetHeadRobot.limit.y);
        addPt(0, JetHeadRobot.limit.y);
    }

    const svg = ragecode.toSVG(parser.instructions);

    if (argv.osc) {
        if (!argv.port) {
            die('must specify --port');
        }

        serveOSC(parser.instructions, parseInt(argv.interval, 10) || 100, parseInt(argv.port, 10));
    } else if (argv.svg) {
        console.log(svg);
    } else {
        let width = 280;
        let height = 280;

        if (argv.width || argv.height) {
            if (!(argv.width && argv.height)) {
                die('Must supply width and height together');
            }

            width = parseFloat(argv.width, 10);
            height = parseFloat(argv.height, 10);
        }

        console.log(toGcode(svg, { width, height }));
    }
}

main();
