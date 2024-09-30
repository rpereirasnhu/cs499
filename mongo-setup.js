
// prepare default db data
db = db.getSiblingDB('spm-data');
db.spm.insertMany([
    { pid: 24, name: 'process_1', start_time: 0, duration: 3 },
    { pid: 25, name: 'process_2', start_time: 2, duration: 4 },
    { pid: 28, name: 'process_3', start_time: 7, duration: 2 },
    { pid: 36, name: 'process_4', start_time: 11, duration: 5 },
    { pid: 42, name: 'process_5', start_time: 15, duration: 3 },
]);

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
