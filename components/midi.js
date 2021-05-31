const midi = require("midi");

/*
  8x	note, velocity	Note off
  9x	note, velocity	Note on (velocity 0 = note off)
  Bx	controller, value	Controller change
*/
const sendMsg = (output, msg) => {
    let vals;
    if (msg.type == "cc") {
        vals = [msg.channel + 0xb0, msg.cc, Math.floor(msg.value)];
    } else if (msg.type == "note_on") {
        vals = [
            msg.channel + 0x90,
            Math.floor(msg.note),
            Math.floor(msg.velocity),
        ];
        setTimeout(() => {
            output.sendMessage([msg.channel + 0x80, msg.note, 0]); // send note of after 100 ms
        }, 100);
    }
    if (vals != null) {
        console.log(vals);
        output.sendMessage(vals);
    }
};

const start = (config) => {
    const output = new midi.Output();
    //output.openVirtualPort(config.name || 'mvm');
    output.openPort(0);
    const sendMsgFn = (msg) => sendMsg(output, msg);
    return { output, sendMsg: sendMsgFn };
};

const stop = (midi) => {
    output.close();
    return {};
};

module.exports = { start, stop };
