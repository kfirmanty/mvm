const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js")
const fs = require('fs')

const [file, ...rest] = process.argv.slice(2);
const source = fs.readFileSync(file, 'utf8')
const parsed = parser.parse(source);
const machine = vm.init(parsed);
const midiPort = midi.start({});
const clock = scheduler.start({ tick: 500 });
const system = { midi: midiPort, clock };

vm.run(system, machine);