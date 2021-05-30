const term = require('terminal-kit').terminal;

const init = () => term.clear();

const drawVmState = vm => {
    const fields = Object.keys(vm).map(k => {
        if (k == "registers" || k == "commands") {
            return [];
        } else {
            return [k, vm[k]];
        }
    }
    );
    const registers = Object.keys(vm.registers[0]).map(k => {
        return [k, vm.registers[vm.ri][k]];
    })
    term.table([
        ['field', 'val'],
        ...fields,
        ...registers
    ], {
        hasBorder: true,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' },
        textAttr: { bgColor: 'default' },
        width: 60,
        fit: true   // Activate all expand/shrink + wordWrap
    }
    );
}

const commandToString = command => `${command.operator} ${command.arg ? command.arg.value : ""}`

const printCommand = (commands, index, pc) => {
    if (index >= 0 && index < commands.length) {
        if (pc == index) {
            term.bold.underline(`${index}:    `)
            term.underline(commandToString(commands[index]) + "\n");
        } else {
            term.bold(`${index}:    `)
            term(commandToString(commands[index]) + "\n");
        }
    }
}

const drawCommands = (commands, pc) => {
    term.moveTo(1, 32);
    const span = 8;
    for (i = pc - span; i < pc + span; i++) {
        printCommand(commands, i, pc);
    }
}

const waitForInput = () => term.inputField(
    {}
).promise;

const exit = () => term.processExit(0);

module.exports = { init, drawVmState, waitForInput, drawCommands, exit };