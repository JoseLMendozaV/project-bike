import { Hrm } from '../ble/hrm.js';
import { Controllable } from '../ble/controllable.js';
import { PowerMeter } from '../ble/power-meter.js';

function start() {
    console.log(`start connection manager`);

    const controllable = new Controllable();
    const hrm = new Hrm();
    const pm = new PowerMeter();

    'const fec = new FEC();'
    'const antHrm = new AntHrm();'
}

start();