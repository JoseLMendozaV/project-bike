import { nthBitToBool } from '../functions.js';

// HR
function dataPage2(msg) {
    // HR Manufacturer Information (0x02)
    const manufacturerId = msg[5];
    const serialNumber   = (msg[7] << 8) + (msg[6]);

    return { manufacturerId, serialNumber };
}
function dataPage3(msg) {
    // HR Product Information (0x03)
    const hardwareVersion = msg[5];
    const softwareVersion = msg[6];
    const modelNumber     = msg[7];

    return { hardwareVersion, softwareVersion, modelNumber };
}
function toBatteryPercentage(x) {
    if(x === 255) return 'not supported';
    if(x > 100)   return '--';
    return x;
}
function dataPage7(msg) {
    // HR Battery Status (0x07)
    const batteryLevel   = toBatteryPercentage(msg[5]);
    const batteryVoltage = msg[6];
    const descriptive    = msg[7];

    return { batteryLevel, batteryVoltage, descriptive };
}

// FE-C
function dataPage16(dataview) {
    // General FE data, 0x10, Dataview input
    const resolution    = 0.001;
    const equipmentType = dataview.getUint8(5);
    let   speed         = dataview.getUint16(8, true);
    const flags         = dataview.getUint8(11);
    // const distance      = dataview.getUint8(7); // 255 rollover
    // const hr            = dataview.getUint8(10); // optional
    speed = (speed * resolution * 3.6);
    return { speed, page: 16 };
}
function decodePower(powerMSB, powerLSB) {
    return ((powerMSB & 0b00001111) << 8) + (powerLSB);
}
function decoupleStatus(powerMSB) {
    return powerMSB >> 4;
}
function decodeStatus(bits) {
    return {
        powerCalibration:      nthBitToBool(bits, 0),
        resistanceCalibration: nthBitToBool(bits, 1),
        userConfiguration:     nthBitToBool(bits, 2)
    };
}
function readStatus(status) {
    const powerCalibration = nthBitToBool(status, 0);      // 0: 'not required', 1: 'required', Zero Offset
    const resistanceCalibration = nthBitToBool(status, 1); // 0: 'not required', 1: 'required', Spin Down
    const userConfiguration = nthBitToBool(status, 2);     // 0: 'not required', 1: 'required';

    return { powerCalibration,
             resistanceCalibration,
             userConfiguration };
}
function dataPage25(dataview) {
    // Specific Trainer data, 0x19, Dataview input
    const updateEventCount = dataview.getUint8(5);
    const cadence          = dataview.getUint8(6);  // rpm
    const powerLSB         = dataview.getUint8(9);  // 8bit Power Lsb
    const powerMSB         = dataview.getUint8(10); // 4bit Power Msb + 4bit Status
    const flags            = dataview.getUint8(11);

    const power  = decodePower(powerMSB, powerLSB);
    const status = readStatus(decoupleStatus(powerMSB));

    return { power, cadence, status, page: 25 };
}

function DataPage25(msg) {
    // Specific Tr data, 0x19, Array input
    const updateEventCount = msg[5];
    const cadence          = msg[6];  // rpm
    const powerLSB         = msg[9];  // 8bit Power Lsb
    const powerMSB         = msg[10]; // 4bit Power Msb + 4bit Status
    const flags            = msg[11];

    const power  = decodePower(powerMSB, powerLSB);
    const status = decoupleStatus(powerMSB);

    return { power, cadence, status, page: 25 };
}

function DataPage16(msg) {
    // General FE data, 0x10, Array input
    const resolution    = 0.001;
    const equipmentType = msg[5];
    let speed           = (msg[9] << 8) + (msg[8]);
    const flags         = msg[11];
    // const distance      = msg.getUint8(7); // 255 rollover
    // const hr            = msg.getUint8(10); // optional
    speed = (speed * resolution * 3.6);
    return { speed, page: 16 };
}




function compansateGradeOffset(slope) {
    // slope is coming as -> 1.8% * 100 = 180
    // 0 = -200%, 20000 = 0%, 40000 = 200%
    //
    // compansateGradeOffset(0)   === 20000
    // compansateGradeOffset(1)   === 20100
    // compansateGradeOffset(4.5) === 20450
    // compansateGradeOffset(10)  === 21000
    return 20000 + (slope * 100);
}
function dataPage48(resistance) {
    // Data Page 48 (0x30) – Basic Resistance
    const dataPage = 48;
    const unit     = 0.5;
    let buffer     = new ArrayBuffer(8);
    let view       = new DataView(buffer);

    view.setUint8(0, dataPage, true);
    view.setUint8(7, resistance / 0.5, true);

    return view;
}
function dataPage49(power) {
    // Data Page 49 (0x31) – Target Power
    const dataPage = 49;
    const unit     = 0.25; // W, 0 - 4000W
    let buffer     = new ArrayBuffer(8);
    let view       = new DataView(buffer);

    view.setUint8( 0, dataPage, true);
    view.setUint16(6, power / unit, true);

    return view;
}
function dataPage51(slope) {
    // Data Page 51 (0x33) – Track Resistance
    const dataPage  = 51;
    const gradeUnit = 0.01; // %, -200.00 - 200.00%
    const crrUnit   = 5*Math.pow(10,-5); // 5x10^-5
    const grade     = compansateGradeOffset(slope);
    const crr       = 0xFF; // default value
    let buffer      = new ArrayBuffer(8);
    let view        = new DataView(buffer);

    view.setUint8( 0, dataPage,          true);
    view.setUint16(5, grade, true);
    view.setUint8( 7, crr,               true);

    return view;
}

function HRPage(msg) {
    const page         = msg[4] & 0b01111111; // just bit 0 to 6
    const pageChange   = msg[4] << 7; // just bit 7
    const hrbEventTime = (msg[9] << 8) + msg[8];
    const hbCount      = msg[10];
    const heartRate    = msg[11];
    let specific       = {};

    if(page === 2) {
        specific = dataPage2(msg);
    }
    if(page === 3) {
        specific = dataPage3(msg);
    }
    if(page === 7) {
        specific = dataPage7(msg);
    }
    return { heartRate, page, hrbEventTime, hbCount, ...specific };
}

function FECPage(msg) {
    const page = msg[4];
    if(page === 25) return DataPage25(msg);
    if(page === 16) return DataPage16(msg);
    return { page: 0 };
}

const page = {
    // HR
    dataPage2,
    dataPage3,
    dataPage7,
    HRPage,

    // FE-C
    dataPage16,
    dataPage25,
    DataPage16,
    DataPage25,
    dataPage48,
    dataPage49,
    dataPage51,
    FECPage,
};

export { page };
