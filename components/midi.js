const midi = require("midi");

const start = config => {
    const output = new midi.Output();
    output.openVirtualPort(config.name || "mvm");
    return { output };
}

const stop = midi => {
    output.close();
    return {};
}

/*
  8x	note, velocity	Note off
  9x	note, velocity	Note on (velocity 0 = note off)
  Bx	controller, value	Controller change
*/
const sendMsg = (midi, msg) => {
    let vals;
    if (msg.type == "cc") {
        vals = [msg.channel + 0xb0, msg.cc, Math.floor(msg.value)];
    } else if (msg.type == "note_on") {
        vals = [
            msg.channel + 0x90,
            Math.floor(msg.note),
            Math.floor(msg.velocity)
        ];
        setTimeout(() => {
            midi.output.sendMessage([msg.channel + 0x80, msg.note, 0]); // send note of after 100 ms
        }, 100);
    }
    if (vals != null) {
        midi.output.sendMessage(vals);
    }
};

exports = { start, stop, sendMsg };
