const chai = require('chai');
const expect = chai.expect;
const parser = require('../parser.js');

describe('Parser tests', () => {
    it('should properly parse input', () => {
        const parsed = parser.parse('! n 2 r');
        expect(parsed).to.deep.equal([
            { operator: '!' },
            { operator: 'n', arg: { type: 'number', value: 2 } },
            { operator: 'r' }
        ]);
    });
});
