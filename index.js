const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");

const parser = require("./parser.js");
const vm = require("./vm.js")

const parsed = parser.parse('+ 48 | v + 100 . 4 ! | n + 12 . 2 ! . 2 !');
const machine = vm.init(parsed);
const midiPort = midi.start({});
const clock = scheduler.start({ tick: 500 });
const system = { midi: midiPort, clock };

vm.run(system, machine);