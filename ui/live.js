const term = require('terminal-kit').terminal;

let inputField;

const init = (text, onEnter) => {
    term.clear();
    term.grabInput(true);
    term.on('key', function (name, matches, data) {
        //console.log("'key' event:", name);
        if (name == "ALT_ENTER") {
        }
    });
    term.inputField(
        {
            default: text, keyBindings: {
                ALT_ENTER: "submit",
                //ENTER: 'submit',
                KP_ENTER: 'submit',
                ESCAPE: 'cancel',
                BACKSPACE: 'backDelete',
                DELETE: 'delete',
                LEFT: 'backward',
                RIGHT: 'forward',
                UP: 'historyPrevious',
                DOWN: 'historyNext',
                HOME: 'startOfInput',
                END: 'endOfInput',
                TAB: 'autoComplete',
                CTRL_R: 'autoCompleteUsingHistory',
                CTRL_LEFT: 'previousWord',
                CTRL_RIGHT: 'nextWord',
                ALT_D: 'deleteNextWord',
                CTRL_W: 'deletePreviousWord',
                CTRL_U: 'deleteAllBefore',
                CTRL_K: 'deleteAllAfter'
            }
        },
        function (error, input) {
            term.grabInput(false);
            onEnter(input);
        }
    );
}

const waitForInput = () => term.inputField(
    {}
).promise;

const exit = () => term.processExit(0);

module.exports = { init, waitForInput, exit };