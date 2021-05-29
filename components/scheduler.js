const start = ({ tick }) => {
    let signals = [];

    const schedule = ticks => {
        const p = new Promise((resolve, reject) => {
            signals.push({ t: ticks, p: resolve });
        });
        console.log('schedule', cycle, ticks);
        return p;
    }

    let cycle = 0;

    setInterval(() => {
        let newsignals = [];
        for (let i = 0; i < signals.length; i++) {
            signals[i].t--;
            if (signals[i].t <= 0) {
                signals[i].p(cycle);
            } else {
                newsignals.push(signals[i]);
            }
        }
        cycle++;
        signals = newsignals;
    }, tick);
    return { schedule };
}


module.exports = { start }