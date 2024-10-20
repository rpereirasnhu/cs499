
// prepare default db data
db = db.getSiblingDB('spm-data');
db.spm.createIndex({ pid: 1 }, { unique: true });
db.spm.insertMany([
    { pid: 28, name: 'process_3', owner: 'ryan', start_time: 7, duration: 2 },
    { pid: 42, name: 'process_5', owner: 'ryan', start_time: 15, duration: 3 },
    { pid: 24, name: 'process_1', owner: 'alex', start_time: 0, duration: 3 },
    { pid: 36, name: 'process_4', owner: 'root', start_time: 11, duration: 5 },
    { pid: 25, name: 'process_2', owner: 'jeffrey', start_time: 2, duration: 4 },
    { pid: 124, name: 'process_6', owner: 'jeffrey', start_time: 2, duration: 5 },
    { pid: 62, name: 'process_8', owner: 'ryan', start_time: 7, duration: 3 },
    { pid: 87, name: 'process_10', owner: 'root', start_time: 9, duration: 10 },
    { pid: 14, name: 'process_9', owner: 'ryan', start_time: 6, duration: 2 },
    { pid: 81, name: 'process_7', owner: 'jeffrey', start_time: 4, duration: 7 },
    { pid: 26, name: 'process_11', owner: 'alex', start_time: 8, duration: 2 },
]);

// prepare users collection
db.users.createIndex({ uid: 1 }, { unique: true });
db.users.createIndex({ uname: 1 }, { unique: true });

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
