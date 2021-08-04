const start = ({ singleBarTimeMs, useExternalClock }) => {
    let signals = [];
    const fullBarSteps = 128;
    const maxCycle = fullBarSteps * 64; //64 bars
    let clockStep = singleBarTimeMs / fullBarSteps;
    const waits = {};
    let cycle = 0;

    const padToNearestDivisionTick = (ticks, division) => {
        let singleUnitWaitSteps = fullBarSteps / division;
        let naiveTicks = ticks * singleUnitWaitSteps;
        let naiveTarget = naiveTicks + cycle;
        let off = naiveTarget % singleUnitWaitSteps;
        let padding = off < singleUnitWaitSteps / 2 ? -off : off;
        return naiveTicks + padding;
    }

    const schedule = (ticks, division) => {
        const p = new Promise((resolve, reject) => {
            signals.push({ t: padToNearestDivisionTick(ticks, division), p: resolve });
        });
        return p;
    }

    const waitTillBar = bar => {

    }

    const waitFor = id => {
        if (!waits[id]) {
            let resolveFn;
            const p = new Promise((resolve, reject) => {
                resolveFn = resolve;
            });
            waits[id].toWait = p;
            waits[id].resolve = resolveFn;
        }
        console.log("waitFor", id);
        return waits[id].toWait;
    }

    const notifyAll = callerId => {
        console.log("notifyAll", callerId, waits[callerId]);
        waits[callerId]?.resolve();
        waits[callerId] = null;
    }

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
    return { schedule, getCurrentBar, waitFor, notifyAll, waitTillBar };
}

module.exports = { start }