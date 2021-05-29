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
const step = (system, vm) => {
    const command = vm.commands[vm.pc];
    switch (command.operator) {
        case "+":
        case "-":
        case "*":
        case "/":
            let arg = 0;
            if (command.arg.type === "number") {
                arg = command.arg.value;
            } else {
                arg = getRegister(vm, command.arg.value);
            }
            let currentRegisterVal = getRegister(vm, vm.cr);
            setRegister(vm, vm.cr, mathOpToFn[command.operator](currentRegisterVal, arg));
            break;
    }
    vm.pc += 1;
};

const tick = (system, vm) => {

};

module.exports = { init, step, getRegister };