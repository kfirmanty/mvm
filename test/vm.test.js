const chai = require('chai');
const midi = require('midi');
const expect = chai.expect;
const parser = require('../parser.js');
const vm = require('../vm.js');

describe('Vm test', () => {
    it('should properly execute math', async () => {
        const parsed = parser.parse('+ 90 * 2 / 4 - 3');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(42);
    });
    it('should properly switch indexes', async () => {
        const parsed = parser.parse('+ 2 : 1 : 0');
        const machine = vm.init(parsed);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(0);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
    });
    it('should properly switch registers', async () => {
        const parsed = parser.parse('+ 2 | r | n');
        const machine = vm.init(parsed);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "r")).to.equal(0);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
    });
    it('should send midi on bang', async () => {
        const parsed = parser.parse('+ 48 v + 100 !');
        const machine = vm.init(parsed);
        const midi = { sendMsg: (msg) => expect(msg).to.deep.equal({ type: "note_on", note: 48, velocity: 100, channel: 0 }) };
        const system = { midi };
        await vm.run(system, machine);
        expect(vm.getRegister(machine, "n")).to.equal(48);
        expect(vm.getRegister(machine, "v")).to.equal(100);

    });
    it('should jump unconditional', async () => {
        const parsed = parser.parse('+ 42 @TEST + 100 |TEST');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(42);
    });
    it('should jump if true', async () => {
        const parsed = parser.parse('+ 42 > 40 ? TEST - 42 |TEST');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(42);
    });
    it('should jump if false', async () => {
        const parsed = parser.parse('+ 42 < 40 ?! TEST - 42 |TEST');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(42);
    });
    it('should respect scale register when doing math on n register - major', async () => {
        const parsed = parser.parse('s = 1 n + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 38');
        const machine = vm.init(parsed);
        await vm.step({}, machine);
        await vm.step({}, machine);
        await vm.step({}, machine);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(4);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(5);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(7);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(9);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(11);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(12);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(14);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(52);
    });
    it('should respect scale register when doing math on n register - minor', async () => {
        const parsed = parser.parse('s = 2 n + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 37 - 37 -1 -1 -1 -1 -1');
        const machine = vm.init(parsed);
        await vm.step({}, machine);
        await vm.step({}, machine);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(0);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(3);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(5);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(7);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(8);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(10);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(12);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(14);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(51);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(14);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(12);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(10);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(8);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(7);
        await vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(5);
    });
    it('should call fn once', async () => {
        const parsed = parser.parse('@CODE |ADDHUNDRED + 100 @ z |CODE + 1 z + 10 n @ADDHUNDRED + 2');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(103);
    });
    it('should execute code block if true', async () => {
        const parsed = parser.parse('+ 40 < 42 ?? (- 40) ');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(0);
    });
    it('should skip code block if false', async () => {
        const parsed = parser.parse('+ 40 > 42 ?? (- 40) ');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(40);
    });
    it('should execute code block if false', async () => {
        const parsed = parser.parse('+ 40 > 42 ??! (- 40) ');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(0);
    });
    it('should execute code block 3 times', async () => {
        const parsed = parser.parse('+40R3(+1)');
        const machine = vm.init(parsed);
        await vm.run({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(43);
    });
});
