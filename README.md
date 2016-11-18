# JetHead Print

## Installation

    npm install -g git+https://github.com/jmptable/jethead-print

## Usage

Generate g-code for the [JetHead](https://github.com/jmptable/jethead) robot from a script file:

`jethead-print painting.arscript > painting.gcode`

Convert ArtRage script to SVG image:

`jethead-print --svg painting.arscript > painting.svg`

Send location and endStroke events over OSC (for example usage take a look at examples/osc_receive):

`jethead-print --osc y --interval 1 painting.arscript`
