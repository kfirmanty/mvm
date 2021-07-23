const start = ({ singleBarTimeMs, useExternalClock }) => {
    let signals = [];
    const fullBarSteps = 128;
    let clockStep = singleBarTimeMs / fullBarSteps;
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
    let maxCycle = fullBarSteps * 64; //64 bars
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
        if (cycle >= maxCycle) {
            cycle = 0;
        }
        signals = newsignals;
    };
    if (useExternalClock) {

    } else {
        setInterval(tick, clockStep);
    }
    const getCurrentBar = () => Math.floor(cycle / fullBarSteps);
    return { schedule, setDivision, getCurrentBar };
}

module.exports = { start }