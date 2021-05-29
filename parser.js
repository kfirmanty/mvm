const pop = (arr) => {
    const val = arr[0];
    arr.shift();
    return val;
};

const peek = (arr) => arr[0];

const isRegister = v => v == 'n' || v == 'v' || v == 'd' || v == 'r';
const isNumber = v => v.match(/\d+/);

const parseArg = arg => ({
    type: isNumber(arg) ? 'number' : 'register',
    value: isNumber(arg) ? parseInt(arg) : arg
})

const eatNumber = tokens => {
    let numStr = "";
    while (peek(tokens) && peek(tokens).match(/\d/)) {
        numStr += pop(tokens);
    };
    return numStr;
}

const consumeArg = tokens => {
    const nextToken = peek(tokens);
    let arg;
    if (isRegister(nextToken)) {
        arg = pop(tokens);
    } else {
        arg = eatNumber(tokens);
    }
    return arg;
}

const parse = text => {
    let tokens = text.replace(/\s+/g, "");
    tokens = tokens.split("");
    const commands = [];
    while (tokens.length > 0) {
        const operator = pop(tokens);
        switch (operator) {
            case '!': // no arg operators
                commands.push({ operator });
                break;
            case 'n':
            case 'v':
            case 'd':
            case 'r': // registers take one arg or 0 depending if next token is register or number
                const nextToken = peek(tokens);
                if (nextToken && (isNumber(nextToken) ||
                    isRegister(nextToken))) {
                    const arg = consumeArg(tokens);
                    commands.push({ operator, arg: parseArg(arg) });
                } else {
                    commands.push({ operator });
                }
                break
            default: // operators taking one arg
                const arg = consumeArg(tokens);
                commands.push({ operator, arg: parseArg(arg) });
                break;
        }
    }
    return commands;
}

exports.parse = parse;
