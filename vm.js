function VMException(message) {
    this.message = message;
    this.name = 'VMException';
}

const repeat = (val, n) => {
    const arr = [];
    for (i = 0; i < n; i++) {
        arr[i] = { ...val };
    }
    return arr;
};

const init = (commands) => ({
    commands,
    pc: 0,
    ri: 0, // registers index
    cr: "n", // current register
    registers: repeat(
        {
            n: 0,
            c: 0,
            v: 0,
            d: 0,
            r: 0,
            t: 0
        }, 16
    )
});

const getRegister = (vm, register) => vm.registers[vm.ri][register];
const setRegister = (vm, register, val) => (vm.registers[vm.ri][register] = val);

const mathOpToFn = {
    "+": (v1, v2) => v1 + v2,
    "-": (v1, v2) => v1 - v2,
    "*": (v1, v2) => v1 * v2,
    "/": (v1, v2) => v1 / v2
};

const booleanOpToFn = {
    ">": (v1, v2) => v1 > v2,
    "<": (v1, v2) => v1 < v2,
    ">=": (v1, v2) => v1 >= v2,
    "<=": (v1, v2) => v1 <= v2,
    "==": (v1, v2) => v1 == v2
};

const argVal = (vm, arg) => {
    let argVal = 0;
    if (arg.type === "number") {
        argVal = arg.value;
    } else {
        argVal = getRegister(vm, arg.value);
    }
    return argVal;
};

const findLabelPC = (vm, label) => {
    let pc = -1;
    for (i = 0; i < vm.commands.length; i++) {
        const command = vm.commands[i];
        if (command.operator == "@" && command.arg.value == label) {
            pc = i;
            break;
        }
    }
    return pc;
};

const jump = (vm, arg) => {
    let pc = -1;
    if (arg.type == "label") {
        pc = findLabelPC(vm, arg.value);
    } else {
        pc = vm.pc + argVal(vm, arg);
    }
    if (pc == -1) {
        throw new VMException(`couldn't find jump place for arg ${arg}`);
    }
    vm.pc = pc;
};
/*
! - bang - send midi
: - switch index
+-/* - math
|| && < > <= >= == - logic
? - jump to label
?! - if not true jump to label
j - jump unconditional
= - assign
. - wait till `n` next tick
, - wait for full `n` ticks from when the operator was called
| - register select
l - label
n v d r t c - registers
*/
const step = async (system, vm) => {
    const command = vm.commands[vm.pc];
    switch (command.operator) {
        case "+":
        case "-":
        case "*":
        case "/":
            const arg = argVal(vm, command.arg);
            let currentRegisterVal = getRegister(vm, vm.cr);
            setRegister(vm, vm.cr, mathOpToFn[command.operator](currentRegisterVal, arg));
            break;
        case ">":
        case "<":
        case ">=":
        case "<=":
        case "==":
            setRegister(vm, "t", booleanOpToFn[command.operator](getRegister(vm, vm.cr), argVal(vm, command.arg)));
            break;
        case "=":
            setRegister(vm, vm.cr, argVal(vm, command.arg));
            break;
        case ":":
            vm.ri = argVal(vm, command.arg) % vm.registers.length;
            break;
        case "|":
            vm.cr = command.arg.value;
            break;
        case "!":
            system.midi.sendMsg({ type: "note_on", note: getRegister(vm, "n"), velocity: getRegister(vm, "v"), channel: getRegister(vm, "c") });
            break;
        case ".":
            await system.clock.schedule(argVal(vm, command.arg));
            break;
        case "@":
            break;
        case "j":
            jump(vm, command.arg);
            break;
        case "?":
            getRegister(vm, "t") == true ? jump(vm, command.arg) : null;
            break;
        case "?!":
            getRegister(vm, "t") == false ? jump(vm, command.arg) : null;
            break;
    }
    vm.pc += 1;
};

const run = async (system, vm) => {
    const maxStepsPerRun = system.maxStepsPerRun || 1000;
    if (vm.pc >= vm.commands.length) {
        vm.pc = vm.pc % vm.commands.length;
    }
    let executed = 0;
    while (vm.pc < vm.commands.length && executed < maxStepsPerRun) {
        await step(system, vm);
        executed += 1;
    }
};

module.exports = { init, step, getRegister, run };