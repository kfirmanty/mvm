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
n v d r t - registers
*/

const pop = (arr) => {
    const val = arr[0];
    arr.shift();
    return val;
}

const peek = (arr) => arr[0];

const isRegister = v => v == "n" || v == "v" || v == "d" || v == "r";
const isNumber = v => v.match(/\d+/);

const parseArg = arg => ({
    type: isNumber(arg) ? "number" : "register",
    value: isNumber(arg) ? parseInt(arg) : arg
});

const parse = text => {
    let tokens = text.split(/\s+/);
    let commands = [];
    while (tokens.length > 0) {
        const operator = pop(tokens);
        switch (operator) {
            case "!": // no arg operators
                commands.push({ operator });
                break;
            case "n":
            case "v":
            case "d":
            case "r": // registers take one arg or 0 depending if next token is register or number
                let nextToken = peek(tokens);
                if (isNumber(nextToken)
                    || isRegister(nextToken)) {
                    let arg = pop(tokens);
                    commands.push({ operator, arg: parseArg(arg) })
                } else {
                    commands.push({ operator })
                }
                break;
            default: // operators taking one arg
                let arg = pop(tokens);
                commands.push({ operator, arg: parseArg(arg) });
                break;
        }
    }
    return commands;
}

exports.parse = parse;