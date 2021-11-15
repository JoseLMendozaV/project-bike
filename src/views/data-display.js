import { xf, equals } from '../functions.js';
import { models } from '../models/models.js';

class DataDisplay extends HTMLElement {
    constructor() {
        super();
        this.state = '';
        this.postInit();
    }
    postInit() { return; }
    static get observedAttributes() {
        return ['disabled'];
    }
    connectedCallback() {
        this.prop = this.getAttribute('prop');
        this.path = this.getAttribute('path') || false;

        if(this.hasAttribute('disabled')) {
            this.disabled = true;
        } else {
            this.disabled = false;
        }

        xf.sub(`db:${this.prop}`, this.onUpdate.bind(this));
    }
    disconnectedCallback() {
        document.removeEventListener(`db:${this.prop}`, this.onUpdate);
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if(name === 'disabled') {
            this.disabled = newValue === null ? false : true;
        }
    }
    onUpdate(value) {
        if(!equals(value, this.state)) {
            if(this.path) {
                this.state = value[this.path];
            } else {
                this.state = value;
            }
            this.render();
        }
    }
    render() {
        if(this.disabled) return;
        this.textContent = this.state;
    }
}

customElements.define('data-display', DataDisplay);

class EffectDisplay extends HTMLElement {
    constructor() {
        super();
        this.state = '';
    }
    connectedCallback() {
        this.effect = this.getAttribute('effect');
        xf.sub(`${this.effect}`, this.onEffect.bind(this));
    }
    disconnectedCallback() {
        document.removeEventListener(`${this.effect}`, this.onEffect);
    }
    onEffect(value) {
        if(!equals(value, this.state)) {
            this.state = value;
            this.render();
        }
    }
    render() {
        this.textContent = this.state;
    }
}

customElements.define('effect-display', EffectDisplay);





class SpeedDisplay extends DataDisplay {
    postInit() {
        this.measurement = models.measurement.default;
        this.unit = ``;
        this.dom = {
            unit: this.querySelector(`unit`),
            value: this.querySelector(`value`)
        };
        xf.sub(`db:measurement`, this.onMeasurement.bind(this));
    }
    onMeasurement(measurement) {
        this.measurement = measurement;
        if(measurement === 'imperial') {
            this.unit = ` mph`;
        } else {
            this.unit = ` mph`;
        }
    }
    kmhToMph(kmh) {
        return 0.621371 * kmh;
    };
    formatSpeed(value, measurement = models.measurement.default) {
        if(measurement === 'imperial') {
            value = `${this.kmhToMph(value).toFixed(1)}`;
        } else {
            value = `${(value).toFixed(1)}`;
        }
        return value;
    }
    renderUnit(text) {
        this.dom.unit.textContent = text;
    }
    render() {
        if(this.disabled) return;
        this.dom.value.textContent = this.formatSpeed(this.state, this.measurement);;
        this.dom.unit.textContent = this.unit;
    }
}

customElements.define('speed-display', SpeedDisplay);




class DeviceInfoDisplay extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const self = this;
        this.state = { manufacturer: '--' };
        this.effect = this.getAttribute('effect');
        xf.sub(`${self.effect}`, this.onEffect.bind(this));
        console.log(this.effect);
    }
    disconnectedCallback() {
        document.removeEventListener(`${this.effect}`, this.onEffect);
    }
    onEffect(data) {
        if('manufacturer' in data) {
            this.state.manufacturer = data.manufacturer;
            this.render();
        }
    }
    render() {
        this.textContent = this.state.manufacturer;
    }
}

customElements.define('device-info-display', DeviceInfoDisplay);


export { DataDisplay};
