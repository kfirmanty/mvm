const midi = require("./components/midi.js");
const scheduler = require("./components/scheduler.js");
const parser = require("./parser.js");
const vm = require("./vm.js");
const fs = require("fs");
const ui = require("./ui/terminal.js");

const [file, isDebug, ...rest] = process.argv.slice(2);
const source = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : file; // source can be passed as file or plain string
const parsed = parser.parse(source);
const machine = vm.init(parsed);
const midiPort = midi.start({});
const clock = scheduler.start({ tick: 1000 });
const system = { midi: midiPort, clock };

const runDebug = async () => {
    while (machine.pc < machine.commands.length) {
        ui.drawVmState(machine);
        ui.drawCommands(machine.commands, machine.pc);
        await vm.step(system, machine);
        const input = await ui.waitForInput();
        if (input == "q") {
            ui.exit();
        }
    }
    ui.drawVmState(machine);
    ui.exit();
};

if (isDebug) {
    runDebug();
} else {
    const run = async () => {
        await vm.run(system, machine);
        ui.exit();
    };
    run();
}
