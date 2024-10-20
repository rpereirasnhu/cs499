
import { randomBytes, scrypt } from 'node:crypto';

// check if password parameter exists
const pwd = process.argv[2];
if (!pwd) {
    console.error('Requires one argument (password)');
    process.exit(1);
}

// generate hash and salt
const salt = randomBytes(16);
scrypt(pwd, salt, 16, { N: 131072, r: 8, p: 1, maxmem: 134217728 + 3072 }, (err, key) => {

    // return on error
    if (err) {
        console.error('An error has occurred');
        console.error(err);
        return;
    }

    // otherwise, print data
    console.log(`\nPlace this in the environment (.env) file:\n\nAPP_DEFAULT_USER=default\nAPP_DEFAULT_PASS="${key.toString('base64')}"\nAPP_DEFAULT_SALT="${salt.toString('base64')}"\n`);
});

console.log(randomBytes(32).toString('base64'));