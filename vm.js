function VMException(message) {
    this.message = message;
    this.name = "VMException";
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
            n: 0, // note register
            v: 0, // velocity register
            d: 0, // duration register
            c: 0, // channel register
            r: 0, // random register
            t: 0, // boolean logic register
            s: 0, // scale register
            x: 0, // x,y,z general purpouse registers
            y: 0,
            z: 0,
        },
        6
    ),
});

const scaleRegisterToScale = {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    1: [0, 2, 4, 5, 7, 9, 11],
    2: [0, 2, 3, 5, 6, 7, 10],
};
const applyScaleRegister = (vm, val) => {
    const scaleVal = getRegister(vm, "s");
    if (scaleVal == 0) {
        return val;
    }
    const step = val % 12;
    const octave = Math.floor(val / 12);
    let note = val;
    const scale = scaleRegisterToScale[scaleVal];
    //find first equal scale step or bigger and reconstruct pitch
    for (i = 0; i < scale.length; i++) {
        if (scale[i] == step || scale[i] > step) {
            note = scale[i] + octave * 12;
            break;
        }
    }
    return note;
};

const getRegister = (vm, register) => vm.registers[vm.ri][register];
const setRegister = (vm, register, val) => {
    if (register == "n") {
        vm.registers[vm.ri][register] = applyScaleRegister(vm, val);
    } else {
        vm.registers[vm.ri][register] = val;
    }
};

const mathOpToFn = {
    "+": (v1, v2) => v1 + v2,
    "-": (v1, v2) => v1 - v2,
    "*": (v1, v2) => v1 * v2,
    "/": (v1, v2) => v1 / v2,
};

const booleanOpToFn = {
    ">": (v1, v2) => v1 > v2,
    "<": (v1, v2) => v1 < v2,
    ">=": (v1, v2) => v1 >= v2,
    "<=": (v1, v2) => v1 <= v2,
    "==": (v1, v2) => v1 == v2,
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
        if (command.operator == "|" && command.arg.value == label) {
            pc = i;
            break;
        }
    }
    return pc;
};

const jump = (vm, arg) => {
    let pc = -1;
    if (arg === null) {
        vm.pc == -1;
        return;
    }
    if (arg.type == "label") {
        pc = findLabelPC(vm, arg.value);
    } else {
        pc = argVal(vm, arg) - 1;
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
? - if true jump to label
?! - if not true jump to label
@ - jump unconditional
= - assign
. - wait till `n` next tick
, - wait for full `n` ticks from when the operator was called
n v d r t c s - register select
| - label
n v d r t c  s- registers
s - special scale register - affects math. 0 is chromatic, 1 major, 2 minor
*/
const step = async (system, vm) => {
    try {
        const command = vm.commands[vm.pc];
        console.log(command, command.operator, vm.registers);
        switch (command.operator) {
            case "+":
            case "-":
            case "*":
            case "/":
                const arg = argVal(vm, command.arg);
                let currentRegisterVal = getRegister(vm, vm.cr);
                setRegister(
                    vm,
                    vm.cr,
                    mathOpToFn[command.operator](currentRegisterVal, arg)
                );
                break;
            case ">":
            case "<":
            case ">=":
            case "<=":
            case "==":
                setRegister(
                    vm,
                    "t",
                    booleanOpToFn[command.operator](
                        getRegister(vm, vm.cr),
                        argVal(vm, command.arg)
                    )
                );
                break;
            case "=":
                setRegister(vm, vm.cr, argVal(vm, command.arg));
                break;
            case ":":
                vm.ri = argVal(vm, command.arg) % vm.registers.length;
                break;
            case "reg":
                vm.cr = command.arg.value;
                break;
            case "!":
                system.midi.sendMsg({
                    type: "note_on",
                    note: getRegister(vm, "n"),
                    velocity: getRegister(vm, "v"),
                    channel: getRegister(vm, "c"),
                });
                break;
            case ".":
                await system.clock.schedule(argVal(vm, command.arg));
                break;
            case "|":
                break;
            case "@":
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
    } catch (e) {
        console.log("error:", e);
    }
};

const run = async (system, vm) => {
    const maxStepsPerRun = system.maxStepsPerRun || 1000; // maxStepsPerRun is mostly used when VM would jump in such way that it would never end execution
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
