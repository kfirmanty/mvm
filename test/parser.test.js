const chai = require('chai');
const expect = chai.expect;
const parser = require('../parser.js');

describe('Parser tests', () => {
    it('should properly parse input', () => {
        const parsed = parser.parse('! n = 20 r');
        expect(parsed).to.deep.equal([
            { operator: '!' },
            { operator: 'reg', arg: { type: 'register', value: 'n' } },
            { operator: '=', arg: { type: 'number', value: 20 } },
            { operator: 'reg', arg: { type: 'register', value: 'r' } }
        ]);
    });
    it('whitespace should be meaningless', () => {
        expect(parser.parse('! n 20 r')).to.deep.equal(parser.parse('!n20r'));
    });

    it('machines definitions should be respected', () => {
        expect(parser.parseMachines('{0 !}')).to.deep.equal({
            "0": [
                { operator: '!' }]
        });
    });
    it('multiple machines definitions should be parsed properly', () => {
        expect(parser.parseMachines('{0 !} {1 ! n}')).to.deep.equal({
            "0": [
                { operator: '!' }],
            "1": [
                {
                    operator: "!"
                },
                {
                    arg: {
                        type: "register",
                        value: "n"
                    },
                    operator: "reg"
                }
            ]
        });
    });
});
