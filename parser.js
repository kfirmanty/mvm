const pop = (arr) => {
    const val = arr[0];
    arr.shift();
    return val;
};

const peek = (arr) => arr[0];

const isRegister = v => v == 'n' || v == 'v' || v == 'd' || v == 'r';
const isNumber = v => v.match(/\d+/);
const isLabel = v => v.match(/[A-Z]/);

const parseArg = arg => ({
    type: isNumber(arg) ? 'number'
        : isLabel(arg) ? 'label'
            : 'register',
    value: isNumber(arg) ? parseInt(arg) : arg
})

const eat = (tokens, match) => {
    let str = "";
    while (peek(tokens) && peek(tokens).match(match)) {
        str += pop(tokens);
    };
    return str;
}

const eatUppercase = tokens =>
    eat(tokens, /[A-Z]/);

const eatNumber = tokens =>
    eat(tokens, /\d/);

const consumeLabel = tokens => ({ type: "label", value: eatUppercase(tokens) });

const consumeArg = tokens => {
    const nextToken = peek(tokens);
    let arg;
    if (isRegister(nextToken)) {
        arg = pop(tokens);
    } else if (isLabel(nextToken)) {
        arg = eatUppercase(tokens);
    }
    else {
        arg = eatNumber(tokens);
    }
    return parseArg(arg);
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
            case '@': //label
            case "j": //jump unconditional
                commands.push({ operator, arg: consumeArg(tokens) });
                break;
            case '?':
                let op = "?";
                const next = peek(tokens);
                if (next == "!") {
                    pop(tokens);
                    op = "?!";
                }
                commands.push({ operator: op, arg: consumeLabel(tokens) });
                break;
            case 'n':
            case 'v':
            case 'd':
            case 'r': // registers take one arg or 0 depending if next token is register or number
                const nextToken = peek(tokens);
                if (nextToken && (isNumber(nextToken) ||
                    isRegister(nextToken))) {
                    commands.push({ operator, arg: consumeArg(tokens) });
                } else {
                    commands.push({ operator });
                }
                break
            case "<":
            case ">":
                let boolOp = operator;
                if (peek(tokens) == "=") { //== comparision operator
                    boolOp = boolOp + "="
                };
                commands.push({ operator: boolOp, arg: consumeArg(tokens) });
                break;
            case '=':
                op = "="
                if (peek(tokens) == "=") { //== comparision operator
                    op = "=="
                }
                commands.push({ op, arg: consumeArg(tokens) });
                break;
            default: // operators taking one arg
                commands.push({ operator, arg: consumeArg(tokens) });
                break;
        }
    }
    return commands;
}

exports.parse = parse;
