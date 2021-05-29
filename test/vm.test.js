const chai = require('chai');
const expect = chai.expect;
const parser = require('../parser.js');
const vm = require('../vm.js');

describe('Vm test', () => {
    it('should properly execute math', () => {
        const parsed = parser.parse('+ 90 * 2 / 4 - 3');
        const machine = vm.init(parsed);
        vm.step({}, machine);
        vm.step({}, machine);
        vm.step({}, machine);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(42);
    });
    it('should properly switch indexes', () => {
        const parsed = parser.parse('+ 2 : 1 : 0');
        const machine = vm.init(parsed);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(0);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
    });
    it('should properly switch registers', () => {
        const parsed = parser.parse('+ 2 | r | n');
        const machine = vm.init(parsed);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "r")).to.equal(0);
        vm.step({}, machine);
        expect(vm.getRegister(machine, "n")).to.equal(2);
    });
});
