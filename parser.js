const pop = (arr) => {
    const val = arr[0];
    arr.shift();
    return val;
};

const peek = (arr) => arr[0];

const isNumber = (v) => v.match(/\d+/);
const isLabel = (v) => v.match(/[A-Z]/);

const parseArg = (arg) => ({
    type: isNumber(arg) ? "number" : isLabel(arg) ? "label" : "register",
    value: isNumber(arg) ? parseInt(arg) : arg,
});

const eat = (tokens, match) => {
    let str = "";
    while (peek(tokens) && peek(tokens).match(match)) {
        str += pop(tokens);
    }
    return str;
};

const eatUppercase = (tokens) => eat(tokens, /[A-Z]/);

const eatNumber = (tokens) => eat(tokens, /\d/);

const consumeLabel = (tokens) => ({
    type: "label",
    value: eatUppercase(tokens),
});

const consumeArg = (tokens) => {
    const nextToken = peek(tokens);
    let arg;
    if (isNumber(nextToken)) {
        arg = eatNumber(tokens);
    } else if (isLabel(nextToken)) {
        arg = eatUppercase(tokens);
    } else {
        arg = pop(tokens);
    }
    return parseArg(arg);
};

const parse = (text) => {
    let tokens = text
        .replace(/\s+/g, "")
        .replace(/\r?\n|\r/g)
        .split("");
    const commands = [];
    let op;
    while (tokens.length > 0) {
        const operator = pop(tokens);
        switch (operator) {
            case "!":
            case "#": // no arg operators
                commands.push({ operator });
                break;
            case "|": //label
            case "@": //jump unconditional
                const nextToken = peek(tokens);
                if (nextToken == "@") commands.push({ operator, arg: null });
                else commands.push({ operator, arg: consumeArg(tokens) });
                break;
            case "?":
                op = "?";
                const next = peek(tokens);
                if (next == "!") {
                    pop(tokens);
                    op = "?!";
                }
                commands.push({ operator: op, arg: consumeLabel(tokens) });
                break;
            case "n":
            case "v":
            case "d":
            case "c":
            case "s":
            case "r":
            case "x":
            case "y":
            case "z":
                commands.push({
                    operator: "reg",
                    arg: { type: "register", value: operator },
                });
                break;
            case "<":
            case ">":
                let boolOp = operator;
                if (peek(tokens) == "=") {
                    //>= <= comparision operators
                    boolOp = boolOp + "=";
                }
                commands.push({ operator: boolOp, arg: consumeArg(tokens) });
                break;
            case "=":
                op = "=";
                if (peek(tokens) == "=") {
                    //== comparision operator
                    op = "==";
                }
                commands.push({ operator: op, arg: consumeArg(tokens) });
                break;
            default:
                // operators taking one arg
                commands.push({ operator, arg: consumeArg(tokens) });
                break;
        }
    }
    return commands;
};

const eatCurly = text => {
    let token = text[0];
    let match = "";
    while (token != "}") {
        match += token;
        text = text.substring(1);
        token = text[0];
    }
    return [text.substring(1), match.substring(1)];
}

const removeWhitespace = text => text
    .replace(/\s+/g, "")
    .replace(/\r?\n|\r/g);

const isMachineSource = (text) => removeWhitespace(text)[0] == "{";

const parseMachines = text => {
    text = removeWhitespace(text);
    let machines = {};
    if (isMachineSource(text)) {
        while (text != "") {
            let res = eatCurly(text);
            text = res[0];
            machines[res[1][0]] = parse(res[1].substring(1));
        }
    } else {
        machines = { "0": parse(text) }
    }
    return machines;
}

exports.parse = parse;
exports.parseMachines = parseMachines;
exports.removeWhitespace = removeWhitespace;
exports.isMachineSource = isMachineSource;