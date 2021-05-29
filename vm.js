const repeat = (val, n) => {
    let arr = [];
    for (i = 0; i < n; i++) {
        arr[i] = { ...val }
    }
    return arr;
}
const init = (commands) => ({
    commands,
    pc: 0,
    ri: 0, //register index
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
})

const step = (system, vm) => {
    const command = vm.commands[vm.pc];
    switch (command.operator) {

    }
    vm.pc += 1;
}

const tick = (system, vm) => {

}