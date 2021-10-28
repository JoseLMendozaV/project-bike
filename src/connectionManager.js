import { Hrm } from '../ble/hrm.js';
import { Controllable } from '../ble/controllable.js';
import { PowerMeter } from '../ble/power-meter.js';

import { Hrm2 } from '../ble2/hrm.js';
import { Controllable2 } from '../ble2/controllable.js';
import { PowerMeter2 } from '../ble2/power-meter2.js';

function start() {
    console.log(`start connection manager`);

    const controllable = new Controllable();
    const hrm = new Hrm();
    const pm = new PowerMeter();

    const controllable2 = new Controllable2();
    const hrm2 = new Hrm2();
    const pm2 = new PowerMeter2();

    'const fec = new FEC();'
    'const antHrm = new AntHrm();'
}

start();