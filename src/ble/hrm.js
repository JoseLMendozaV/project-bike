import { ble } from './web-ble.js';
import { uuids } from './uuids.js';
import { Device } from './device.js';

import { DeviceInformationService } from './dis/dis.js';



function onHrmInfo(value) {
    console.log(`Heart Rate Monitor Information: `, value);
}

class Hrm extends Device {
    defaultId() { return `ble:hrm`; }
    defaultFilter() { return ble.requestFilters.hrm; }
    postInit() {
        const self = this;
    }
    async initServices(device) {

        const dis = new DeviceInformationService({ble: ble, onInfo: onHrmInfo, ...device});

        if(ble.hasService(device, uuids.deviceInformation)) {
            await dis.init();
        }

        return { dis };
    }
}

export { Hrm }
