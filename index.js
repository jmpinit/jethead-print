#!/usr/bin/env node
const fs = require('fs');
const minimist = require('minimist');
const ragecode = require('ragecode').ragecode;
const toGcode = require('./svg-to-gcode');

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

    const svg = ragecode.toSVG(parser.instructions);

    if (argv.svg) {
        console.log(svg);
    } else {
        console.log(toGcode(svg));
    }
}

main();
