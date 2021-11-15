import { nthBitToBool } from '../../functions.js';

const pedalPowerBalance       = (flags) => nthBitToBool(flags,  0);
const accumulatedTorque       = (flags) => nthBitToBool(flags,  2);
const wheelRevolutionData     = (flags) => nthBitToBool(flags,  4);
const crankRevolutionData     = (flags) => nthBitToBool(flags,  5);
const offsetIndicator         = (flags) => nthBitToBool(flags, 12);

const fields = {
    flags:                      { size: 2 },
    power:                      { size: 2, resolution: 1 },
    pedalPowerBalance:          { size: 1, resolution: 0.5 },
    accumulatedTorque:          { size: 2, resolution: (1/32) },
    cumulativeWheelRevolutions: { size: 4, resolution: 1 },
    lastWheelEventTime:         { size: 2, resolution: (1/2048) },
    cumulativeCrankRevolutions: { size: 2, resolution: 1 },
    lastCrankEventTime:         { size: 2, resolution: (1/1024)},
    maximumForceMagnitude:      { size: 2, resolution: 1 },
    minimumForceMagnitude:      { size: 2, resolution: 1 },
    maximumTorqueMagnitude:     { size: 2, resolution: 1 },
    minimumTorqueMagnitude:     { size: 2, resolution: 1 }
};

function powerIndex(flags) {
    let i = fields.flags.size;
    return i;
}
function crankRevolutionsIndex(flags) {
    let i = fields.flags.size + fields.power.size;
    if(pedalPowerBalance(flags)) {
        i+= fields.pedalPowerBalance.size;
    }
    if(accumulatedTorque(flags)) {
        i+= fields.accumulatedTorque.size;
    }
    if(wheelRevolutionData(flags)) {
        i+= fields.cumulativeWheelRevolutions.size;
        i+= fields.lastWheelEventTime.size;
    }
    return i;
}
function crankEventIndex(flags) {
    let i = fields.flags.size + fields.power.size;
    if(pedalPowerBalance(flags)) {
        i+= fields.pedalPowerBalance.size;
    }
    if(accumulatedTorque(flags)) {
        i+= fields.accumulatedTorque.size;
    }
    if(wheelRevolutionData(flags)) {
        i+= fields.cumulativeWheelRevolutions.size;
        i+= fields.lastWheelEventTime.size;
    }
    i+= fields.cumulativeCrankRevolutions.size;
    return i;
}

function getPower(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getInt16(powerIndex(flags), true);
}
function getCrankRevolutions(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(crankRevolutionsIndex(flags), true);
}
function getCrankEvent(dataview) {
    const flags = dataview.getUint16(0, true);
    return dataview.getUint16(crankEventIndex(flags), true);
}


let crank_revs_1 = -1;
let crank_time_1 = -1;

function calculateCadence(crank_revs_2, crank_time_2) {
    const resolution = 1024;
    const rollover = 1024 * 64;
    const toRpm =  60;
    if(crank_revs_1 < 0) crank_revs_1 = crank_revs_2;
    if(crank_time_1 < 0) crank_time_1 = crank_time_2;

    if(crank_time_2 < crank_time_1) crank_time_1 = crank_time_1 - rollover;
    if(crank_revs_1 === crank_revs_2) return 0;

    const cadence = Math.round((crank_revs_1 - crank_revs_2) /
                               ((crank_time_1 - crank_time_2) / (resolution * toRpm)));
    crank_revs_1 = crank_revs_2;
    crank_time_1 = crank_time_2;
    return cadence;
}

function cyclingPowerMeasurementDecoder(dataview) {

    const flags = dataview.getUint16(0, true);

    let data = {};
    data['power'] = getPower(dataview);
    data['offsetIndicator'] = offsetIndicator(flags);

    //Speed
    data['power2'] = getPower(dataview)*0.3953488372;

    var meter = document.getElementById('somemeter');
    meter.value = getPower(dataview);

    var meter2 = document.getElementById('somemeter2');
    meter2.value = getPower(dataview);

    var meter3 = document.getElementById('somemeter3');
    meter3.value = getPower(dataview);

    //Image Light bulb

    var pic;
    if (getPower(dataview) == 0) {
        pic = "light-bulb1.jpg"
    } 
    else if (getPower(dataview) >= 25 && getPower(dataview) < 50) {
        pic = "light-bulb2.jpg"
    }
    else if (getPower(dataview) >= 50 && getPower(dataview) < 75) {
        pic = "light-bulb3.jpg"
    }
    else if (getPower(dataview) >= 75){
        pic = "light-bulb4.jpg"
    }
    document.getElementById('myImage').src = pic;

    // light bulb new














    if(crankRevolutionData(flags)) {
        data['crankRevolutions'] = getCrankRevolutions(dataview);
        data['crankEvent'] = getCrankEvent(dataview);
        data['cadence'] = calculateCadence(data['crankRevolutions'], data['crankEvent']);
    }

    return data;
}


export {
    cyclingPowerMeasurementDecoder,
};


//Light bulb

var tl = new TimelineLite;

tl
.staggerFromTo(".bottomm", 0.5, {alpha: 0}, {alpha: 1, fill: "#000", delay: 1}, 0.25)
.fromTo("#rectangle", 1, {fill:"#000", alpha: "0%", height: "7%"}, {fill: "#f5e317", alpha: "100%", height: "50%", ease: Power3.easeInOut}, "-=1")
.staggerFromTo(".ray", 1, {alpha: 0}, {alpha: 1, fill: "#000"}, 0.1, "-=1.25")






