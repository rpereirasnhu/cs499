
// prepare default db data
db = db.getSiblingDB('spm-data');
db.spm.insertMany([
    { pid: 28, name: 'process_3', start_time: 7, duration: 2 },
    { pid: 42, name: 'process_5', start_time: 15, duration: 3 },
    { pid: 24, name: 'process_1', start_time: 0, duration: 3 },
    { pid: 36, name: 'process_4', start_time: 11, duration: 5 },
    { pid: 25, name: 'process_2', start_time: 2, duration: 4 },
    { pid: 124, name: 'process_6', start_time: 2, duration: 5 },
    { pid: 62, name: 'process_8', start_time: 7, duration: 3 },
    { pid: 87, name: 'process_10', start_time: 9, duration: 10 },
    { pid: 14, name: 'process_9', start_time: 6, duration: 2 },
    { pid: 81, name: 'process_7', start_time: 4, duration: 7 },
    { pid: 26, name: 'process_11', start_time: 8, duration: 2 },
]);


//NOTE: add 'user' property


// create app user
db = db.getSiblingDB('admin');
db.createUser(
    {
        user: process.env.DB_APP_USER,
        pwd: process.env.DB_APP_PASS,
        roles: [
            { role: 'readWrite', db: 'spm-data' }
        ]
    }
);
