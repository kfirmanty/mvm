const start = ({ bar, useExternalClock }) => {
    let signals = [];
    const fullBarSteps = 128;
    let clockStep = bar / fullBarSteps;
    let division = 4;
    let singleUnitWaitSteps = fullBarSteps / division;

    const schedule = ticks => {
        const p = new Promise((resolve, reject) => {
            signals.push({ t: ticks * singleUnitWaitSteps, p: resolve });
        });
        return p;
    }

    const setDivision = div => {
        division = div;
        singleUnitWaitSteps = fullBarSteps / division;
    }

    let cycle = 0;
    const tick = () => {
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
    };
    if (useExternalClock) {

    } else {
        setInterval(tick, clockStep);
    }
    return { schedule, setDivision };
}

module.exports = { start }