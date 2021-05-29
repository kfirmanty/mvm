const midi = require("./components/midi.js");
const parser = require("./parser.js");
const vm = require("./vm.js")

const parsed = parser.parse('+ 48 | v + 100 !');
const machine = vm.init(parsed);
const midiPort = midi.start({});
const system = { midi: midiPort };

vm.step(system, machine);
vm.step(system, machine);
vm.step(system, machine);
vm.step(system, machine);