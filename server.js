const ws = require("ws");
const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js");

const defaultCode = "{0.4}";
const parsed = parser.parseMachines(defaultCode);
const machines = Object.fromEntries(Object.keys(parsed).map(k => [k, vm.init(parsed[k], k)]));
const midiPort = midi.start({});
const clock = scheduler.start({ singleBarTimeMs: 1000 });
const system = { midi: midiPort, clock };

const run = async (system, machine) => {
    await vm.run(system, machine);
    run(system, machine)
};

Object.keys(machines).forEach(k => run(system, machines[k]));

let code = defaultCode;
const wss = new ws.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log("new ws conn");
    ws.on('message', (message) => {
        console.log('received: %s', message);
        message = JSON.parse(message);
        code = message.code;
        if (code) {
            let newMachinesCode = parser.parseMachines(code);
            Object.keys(newMachinesCode).forEach(k => {
                if (machines[k]) {
                    machines[k].commands = newMachinesCode[k];
                } else {
                    let machine = vm.init(newMachinesCode[k]);
                    machines[k] = machine;
                    run(system, machine);
                }
            });
        }
    });
});