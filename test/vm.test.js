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
});
