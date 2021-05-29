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
}

const argVal = (vm, arg) => {
    let argVal = 0;
    if (arg.type === "number") {
        argVal = arg.value;
    } else {
        argVal = getRegister(vm, arg.value);
    }
    return argVal;
}
/*
! - bang - send midi
: - switch index
+-/* - math
|| && < > <= >= == - logic
? - jump to label
!? - if not true jump to label
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
    }
    vm.pc += 1;
};

const run = async (system, vm) => {
    while (true) {
        await step(system, vm);
        if (vm.pc >= vm.commands.length) {
            break;
        }
    }
};

module.exports = { init, step, getRegister, run };