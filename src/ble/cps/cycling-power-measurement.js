import { nthBitToBool } from '../../functions.js';
import { format } from '../../utils.js';

const pedalPowerBalance = (flags) => nthBitToBool(flags, 0);
const pedalPowerBalanceRef = (flags) => nthBitToBool(flags, 1);
const accumulatedTorque = (flags) => nthBitToBool(flags, 2);
const accumulatedTorqueSource = (flags) => nthBitToBool(flags, 3);
const wheelRevolutionData = (flags) => nthBitToBool(flags, 4);
const crankRevolutionData = (flags) => nthBitToBool(flags, 5);
const extremeForceMagnitudes = (flags) => nthBitToBool(flags, 6);
const extremeTorqueMagnitudes = (flags) => nthBitToBool(flags, 7);
const extremeAngles = (flags) => nthBitToBool(flags, 8);
const topDeadSpotAngle = (flags) => nthBitToBool(flags, 9);
const bottomDeadSpotAngle = (flags) => nthBitToBool(flags, 10);
const accumulatedEnergy = (flags) => nthBitToBool(flags, 11);
const offsetIndicator = (flags) => nthBitToBool(flags, 12);

const fields = {
    flags: { size: 2 },
    power: { size: 2, resolution: 1 },
    pedalPowerBalance: { size: 1, resolution: 0.5 },
    accumulatedTorque: { size: 2, resolution: (1 / 32) },
    cumulativeWheelRevolutions: { size: 4, resolution: 1 },
    lastWheelEventTime: { size: 2, resolution: (1 / 2048) },
    cumulativeCrankRevolutions: { size: 2, resolution: 1 },
    lastCrankEventTime: { size: 2, resolution: (1 / 1024) },
    maximumForceMagnitude: { size: 2, resolution: 1 },
    minimumForceMagnitude: { size: 2, resolution: 1 },
    maximumTorqueMagnitude: { size: 2, resolution: 1 },
    minimumTorqueMagnitude: { size: 2, resolution: 1 }
};

function cadencePresent(flags) {
    return nthBitToBool(flags, 5);
}

function powerIndex(flags) {
    let i = fields.flags.size;
    return i;
}
function wheelRevolutionsIndex(flags) {
    let i = fields.flags.size + fields.power.size;
    if (pedalPowerBalance(flags)) {
        i += fields.pedalPowerBalance.size;
    }
    if (accumulatedTorque(flags)) {
        i += fields.accumulatedTorque.size;
    }
    return i;
}
function wheelEventIndex(flags) {
    let i = fields.flags.size + fields.power.size;
    if (pedalPowerBalance(flags)) {
        i += fields.pedalPowerBalance.size;
    }
    if (accumulatedTorque(flags)) {
        i += fields.accumulatedTorque.size;
    }
    i += fields.cumulativeWheelRevolutions.size;
    return i;
}
function crankEventIndex(flags) {
    let i = fields.flags.size + fields.power.size;
    if (pedalPowerBalance(flags)) {
        i += fields.pedalPowerBalance.size;
    }
    if (accumulatedTorque(flags)) {
        i += fields.accumulatedTorque.size;
    }
    if (wheelRevolutionData(flags)) {
        i += fields.cumulativeWheelRevolutions.size;
        i += fields.lastWheelEventTime.size;
    }
    i += fields.cumulativeCrankRevolutions.size;
    return i;
}

function getPower(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getInt16(powerIndex(flags), true);
}
function getWheelRevolutions(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(wheelRevolutionsIndex(flags), true);
}
function getWheelEvent(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(wheelEventIndex(flags), true);
}
function getCrankRevolutions(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(crankRevolutionsIndex(flags), true);
}
function getCrankEvent(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(crankEventIndex(flags), true);
}


let wheel_rev_1 = -1;
let wheel_time_1 = -1;
function calculateSpeed(wheel_rev_2, wheel_time_2) {
    const resolution = 2048;
    const rollover = 2048 * 32;
    const wheel_circumference = 2.105; // m -> 700x25
    const toKmh = 3.6;

    if (wheel_rev_1 < 0) wheel_rev_1 = wheel_rev_2;
    if (wheel_time_1 < 0) wheel_time_1 = wheel_time_2;

    if (wheel_time_2 < wheel_time_1) wheel_time_1 = wheel_time_1 - rollover; // clock rolls over
    if (wheel_rev_2 === wheel_rev_1) return 0; // coasting

    let speed = ((wheel_rev_1 - wheel_rev_2) * wheel_circumference /
        ((wheel_time_1 - wheel_time_2) / resolution)) * toKmh;
    speed = format(speed, 100);

    wheel_rev_1 = wheel_rev_2;
    wheel_time_1 = wheel_time_2;
    return speed;
}


let crank_revs_1 = -1;
let crank_time_1 = -1;

function calculateCadence(crank_revs_2, crank_time_2) {
    const resolution = 1024;
    const rollover = 1024 * 64;
    const toRpm = 60;
    if (crank_revs_1 < 0) crank_revs_1 = crank_revs_2;
    if (crank_time_1 < 0) crank_time_1 = crank_time_2;

    if (crank_time_2 < crank_time_1) crank_time_1 = crank_time_1 - rollover;
    if (crank_revs_1 === crank_revs_2) return 0;

    const cadence = Math.round((crank_revs_1 - crank_revs_2) /
        ((crank_time_1 - crank_time_2) / (resolution * toRpm)));
    crank_revs_1 = crank_revs_2;
    crank_time_1 = crank_time_2;
    return cadence;
}



function cyclingPowerMeasurementDecoder(dataview) {

    const flags = dataview.getUint16(0, true);

    var data = {};
    data['power'] = getPower(dataview);
    data['offsetIndicator'] = offsetIndicator(flags);

    document.getElementById('Power1').innerHTML = getPower(dataview);

    var cadence = getPower(dataview) * 1.6744186047;
    document.getElementById('Cadence1').innerHTML = cadence.toFixed(2);


    var speed = getPower(dataview) * 0.3953488372
    document.getElementById('Speed1').innerHTML = speed.toFixed(2);


    var powerData = getPower(dataview);
    window.localStorage.setItem("powerData1", powerData);



    var meter = document.getElementById('somemeter');
    meter.value = getPower(dataview);

    var meter2 = document.getElementById('somemeter2');
    meter2.value = getPower(dataview);

    var meter3 = document.getElementById('somemeter3');
    meter3.value = getPower(dataview);

    var meter4 = document.getElementById('somemeter4');
    meter4.value = getPower(dataview);



    var tree;
    if (getPower(dataview) == 0) {
        tree = "tree1.png"
    }
    else if (getPower(dataview) >= 25 && getPower(dataview) < 50) {
        tree = "tree2.png"
    }
    else if (getPower(dataview) >= 50 && getPower(dataview) < 75) {
        tree = "tree3.png"
    }
    else if (getPower(dataview) >= 75 && getPower(dataview) < 100) {
        tree = "tree4.png"
    }
    else if (getPower(dataview) >= 100) {
        tree = "tree5.png"
    }
    document.getElementById('myTree').src = tree;




    if (wheelRevolutionData(flags)) {
        data['wheelRevolutions'] = getWheelRevolutions(dataview);
        data['wheelEvent'] = getWheelEvent(dataview);
        data['speed'] = calculateSpeed(data['wheelRevolutions'], data['wheelEvent']);
    }


    if (crankRevolutionData(flags)) {
        data['crankRevolutions'] = getCrankRevolutions(dataview);
        data['crankEvent'] = getCrankEvent(dataview);
        data['cadence'] = calculateCadence(data['crankRevolutions'], data['crankEvent']);
    }

    return data;
}


export {
    cyclingPowerMeasurementDecoder,
};


var powerData =0;
window.localStorage.setItem("powerData1", powerData);