const readline = require('readline');
const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js");

const machine = vm.init(parser.parse(".128"));
const midiPort = midi.start({});
const clock = scheduler.start({ singleBarTimeMs: 1000 });
const system = { midi: midiPort, clock };

const run = async () => {
    while (true) await vm.run(system, machine);
};

run();

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
        machine.commands = parser.parse(input);
        rl.write(input);
        readCode();
    });
};

readCode();