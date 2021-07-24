const readline = require('readline');
const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js");

const parsed = parser.parseMachines("{0.128}");
const machines = Object.fromEntries(Object.keys(parsed).map(k => [k, vm.init(parsed[k])]));
const midiPort = midi.start({});
const clock = scheduler.start({ singleBarTimeMs: 1000 });
const system = { midi: midiPort, clock };

const run = async (system, machine) => {
    await vm.run(system, machine);
    run(system, machine)
};

Object.keys(machines).forEach(k => run(system, machines[k]));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let input = "";
const readCode = () => {
    rl.question('_: ', (code) => {
        if (code == 'q') {
            rl.close();
            process.exit();
        }
        input = code;
        let newMachinesCode = parser.parseMachines(input);
        Object.keys(newMachinesCode).forEach(k => {
            if (machines[k]) {
                machines[k].commands = newMachinesCode[k];
            } else {
                let machine = vm.init(newMachinesCode[k]);
                machines[k] = machine;
                run(system, machine);
            }
        });
        rl.write(input);
        readCode();
    });
};

readCode();