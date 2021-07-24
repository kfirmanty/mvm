const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js");
const fs = require("fs");

const [file, isDebug, ...rest] = process.argv.slice(2);
const source = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : file; // source can be passed as file or plain string
const parsed = parser.parseMachines(source);
console.log("PARSED", parsed);
const machines = Object.keys(parsed).map(k => vm.init(parsed[k]))
const midiPort = midi.start({});
const clock = scheduler.start({ singleBarTimeMs: 1000 });
const system = { midi: midiPort, clock };

console.log("INITED MACHINES", machines);
const run = async (system, machine) => {
    await vm.run(system, machine);
    run(system, machine)
};

machines.forEach(m => run(system, m));