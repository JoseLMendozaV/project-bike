import { xf, exists, equals } from '../functions.js';
import { models } from './models/models.js';

let db = {
    // Data Screen
    power: models.power.default,
    power2: models.power2.default,
    heartRate: models.heartRate.default,
    cadence: models.cadence.default,
    speed: models.speed.default,
    distance: models.distance.default,
    sources: models.sources.default,

    // Targets
    powerTarget: models.powerTarget.default,
    resistanceTarget: models.resistanceTarget.default,
    slopeTarget: models.slopeTarget.default,

    mode: models.mode.default,
    page: models.page.default,

    // Profile
    ftp: models.ftp.default,
    weight: models.weight.default,
    theme: models.theme.default,
    measurement: models.measurement.default,

    // Workouts
    workouts: [],
    workout: models.workout.default,

    // Recording
    records: [],
    lap: [],
    laps: [],
    lapStartTime: false,
    gpsData: [],
    gps: false,

};

xf.create(db);

// Data Screen
xf.reg(models.heartRate.prop, (heartRate, db) => {
    db.heartRate = heartRate;
});

xf.reg(models.power.prop, (power, db) => {
    db.power = power;
});

xf.reg(models.power2.prop, (power2, db) => {
    db.power2 = power2;
});

xf.reg(models.cadence.prop, (cadence, db) => {
    db.cadence = cadence;
});

xf.reg(models.speed.prop, (speed, db) => {
    db.speed = speed;
});

xf.reg(models.distance.prop, (distance, db) => {
    db.distance = distance;
});

xf.reg(models.sources.prop, (sources, db) => {
    db.sources = models.sources.set(db.sources, sources);
    console.log(db.sources);
});

// Pages
xf.reg('ui:page-set', (page, db) => {
    db.page = models.page.set(page);
});

// Modes
xf.reg('ui:mode-set', (mode, db) => {
    db.mode = models.mode.set(mode);

    if(equals(mode, 'erg'))        xf.dispatch(`ui:power-target-set`, db.powerTarget);
    if(equals(mode, 'resistance')) xf.dispatch(`ui:resistance-target-set`, db.resistanceTarget);
    if(equals(mode, 'slope'))      xf.dispatch(`ui:slope-target-set`, db.slopeTarget);
});

// Targets
xf.reg('ui:power-target-set', (powerTarget, db) => {
    db.powerTarget = models.powerTarget.set(powerTarget);
});
xf.reg('ui:power-target-inc', (_, db) => {
    db.powerTarget = models.powerTarget.inc(db.powerTarget);
});
xf.reg(`ui:power-target-dec`, (_, db) => {
    db.powerTarget = models.powerTarget.dec(db.powerTarget);
});

xf.reg('ui:resistance-target-set', (resistanceTarget, db) => {
    db.resistanceTarget = models.resistanceTarget.set(resistanceTarget);
});
xf.reg('ui:resistance-target-inc', (_, db) => {
    db.resistanceTarget = models.resistanceTarget.inc(db.resistanceTarget);
});
xf.reg(`ui:resistance-target-dec`, (_, db) => {
    db.resistanceTarget = models.resistanceTarget.dec(db.resistanceTarget);
});

xf.reg('ui:slope-target-set', (slopeTarget, db) => {
    db.slopeTarget = models.slopeTarget.set(slopeTarget);
});
xf.reg('ui:slope-target-inc', (_, db) => {
    db.slopeTarget = models.slopeTarget.inc(db.slopeTarget);
});
xf.reg(`ui:slope-target-dec`, (_, db) => {
    db.slopeTarget = models.slopeTarget.dec(db.slopeTarget);
});

// Profile
xf.reg('ui:ftp-set', (ftp, db) => {
    db.ftp = models.ftp.set(ftp);
    models.ftp.backup(db.ftp);
});
xf.reg('ui:weight-set', (weight, db) => {
    db.weight = models.weight.set(weight);
    models.weight.backup(db.weight);
});
xf.reg('ui:theme-switch', (_, db) => {
    db.theme = models.theme.switch(db.theme);
    models.theme.backup(db.theme);
});
xf.reg('ui:measurement-switch', (_, db) => {
    db.measurement = models.measurement.switch(db.measurement);
    models.measurement.backup(db.measurement);
});

// Workouts
xf.reg('workout', (workout, db) => {
    db.workout = models.workout.set(workout);
});
xf.reg('ui:workout:select', (id, db) => {
    db.workout = models.workouts.get(db.workouts, id);
});
xf.reg('ui:workout:upload', async function(workoutFile, db) {
    const workoutText = await models.workout.readFromFile(workoutFile);
    const workout = models.workout.parse(workoutText);
    models.workouts.add(db.workouts, workout);
    xf.dispatch('db:workouts', db);
});
xf.reg('ui:activity:save', (_, db) => {
    try {
        models.workout.save(db);
        xf.dispatch('activity:save:success');
    } catch (err) {
        console.error(`Error on activity save: `, err);
        xf.dispatch('activity:save:fail');
    }
});
xf.reg('activity:save:success', (e, db) => {
    // file:download:activity
    // reset db session:
    db.records = [];
    db.resistanceTarget = 0;
    db.slopeTarget = 0;
    db.powerTarget = 0;
});

// Wake Lock
xf.reg('lock:beforeunload', (e, db) => {
    // backup session
    models.session.backup(db);
});
xf.reg('lock:release', (e, db) => {
    // backup session
    models.session.backup(db);
});

xf.reg('app:start', async function(_, db) {

    db.ftp = models.ftp.restore();
    db.weight = models.weight.restore();
    db.theme = models.theme.restore();
    db.measurement = models.measurement.restore();

    db.workouts = models.workouts.restore();
    db.workout = models.workout.restore(db);

    await models.session.start();
    await models.session.restore(db);
    xf.dispatch('workout:restore');

});

function start () {
    console.log('start db');
    xf.dispatch('db:start');
}

start();

export { db };
