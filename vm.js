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

const init = (commands, id) => ({
    id,
    commands,
    pc: 0,
    ri: 0, // registers index
    cr: "n", // current register
    division: 4,
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
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    1: [0, 2, 4, 5, 7, 9, 11, 12],
    2: [0, 2, 3, 5, 7, 8, 10, 12],
    3: [0, 4, 5, 7, 11, 12],
    4: [0, 3, 5, 7, 10, 12],
};
const applyScaleRegister = (vm, val, prevVal) => {
    const scaleVal = getRegister(vm, "s");
    if (scaleVal == 0) {
        return val;
    }
    const step = val % 12;
    const octave = Math.floor(val / 12);
    const scale = scaleRegisterToScale[scaleVal];
    let fromScale = 0;
    if (val > prevVal) {
        for (let i = 0; i < scale.length; i++) {
            if (scale[i] == step || scale[i] > step) {
                fromScale = scale[i];
                break;
            }
        }
    } else {
        for (let i = scale.length - 1; i >= 0; i--) {
            if (scale[i] == step || scale[i] < step) {
                fromScale = scale[i];
                break;
            }
        }
    }
    return fromScale + octave * 12;
};

const getRegister = (vm, register) => vm.registers[vm.ri][register];
const setRegister = (vm, register, val) => {
    if (register == "n") {
        vm.registers[vm.ri][register] = applyScaleRegister(vm, val, vm.registers[vm.ri][register]);
    } else {
        vm.registers[vm.ri][register] = val;
    }
};

const mathOpToFn = {
    "+": (v1, v2) => v1 + v2,
    "-": (v1, v2) => v1 - v2,
    "*": (v1, v2) => v1 * v2,
    "/": (v1, v2) => v1 / v2,
    "%": (v1, v2) => v1 % v2,
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
        if (arg.value == 'r') {
            argVal = Math.floor(Math.random() * argVal);
        }
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
+-/*% - math
|| && < > <= >= == - logic
? - if true jump to label
?! - if not true jump to label
@ - jump unconditional
= - assign
. - wait till `n` next tick
\ - set timer units \4 is default and is 1/4 of bar. \16 would work on 16th
, - wait for full `n` ticks from when the operator was called
n v d r t c s x y z - register select
s - special scale register - affects math. 0 is chromatic, 1 major, 2 minor
| - label
# - send midi cc, uses registers x and y
p - execute codeblock with percentage probability
w - wait for machine
W - notify machine
b - execute when bar modulo arg == 0
e - execute on every bar except when modulo arg == 0
R - repeat code block arg times
*/
const step = async (system, vm) => {
    try {
        const command = vm.commands[vm.pc];
        const runCodeBlock = async (codeBlock) => {
            let localCopy = Object.assign({}, vm);
            localCopy.pc = 0;
            localCopy.commands = codeBlock;//command.arg;
            await run(system, localCopy);
            const pcBackup = vm.pc;
            const commandsBackup = vm.commands;
            Object.assign(vm, localCopy);
            vm.pc = pcBackup;
            vm.commands = commandsBackup;
        }
        switch (command.operator) {
            case "+":
            case "-":
            case "*":
            case "/":
            case "%":
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
            case "#":
                system.midi.sendMsg({
                    type: "cc",
                    cc: getRegister(vm, "x"),
                    value: getRegister(vm, "y"),
                    channel: getRegister(vm, "c"),
                });
                break;
            case "\\":
                vm.division = argVal(vm, command.arg);
                break;
            case ".":
                await system.clock.schedule(argVal(vm, command.arg), vm.division);
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
            case "p":
            case "p?":
                if ((Math.random() * 100) < argVal(vm, command.probability)) {
                    await runCodeBlock(command.execute);
                } else if (command.elseExecute) {
                    await runCodeBlock(command.elseExecute);
                }
                break;
            case "??":
            case "??!":
            case "b":
            case "e":
                if ((command.operator == "??" && getRegister(vm, "t") == true)
                    || (command.operator == "??!" && getRegister(vm, "t") == false)
                    || (command.operator == "b" && (system.clock.getCurrentBar() % argVal(vm, command.bar)) == 0)
                    || (command.operator == "e" && (system.clock.getCurrentBar() % argVal(vm, command.bar)) != 0)) {
                    await runCodeBlock(command.arg);
                }
                break;
            case "R":
                for (let i = 0; i < argVal(vm, command.repetitions); i++) {
                    await runCodeBlock(command.arg);
                }
                break;
            case "W":
                system.clock.waitTillBar(argVal(vm, command.arg));
                break;
            default:
                console.log("WARNING:", "unknown command " + command);
                break;
        }
        vm.pc += 1;
    } catch (e) {
        //console.log("error:", e);
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