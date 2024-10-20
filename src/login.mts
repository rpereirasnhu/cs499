
import { NextFunction, Request, Response, Router } from "express";
import { scrypt } from 'node:crypto';
import { AppDb, User } from "./crud.mjs";
import jwt from 'jsonwebtoken';

const router = Router();
const errStr = {
    INVALID_CREDS: 'Invalid username / password combination',
    UNEXPECTED_ERR: 'An unexpected error has occurred'
}

router.route('/')
    .get((req: Request, res: Response, next: NextFunction) => {
        res.status(200).render('login');
    })
    .post((req: Request, res: Response, next: NextFunction) => {

        // get db client
        const dbClient = res.locals._dbClient as AppDb;

        // validate input
        if (req.body.uname === undefined || req.body.passwd === undefined) {
            res.status(200).render('login', { err: 'Missing variables' });
            console.log('Missing variables');
            return;
        }
        if (req.body.uname.length === 0 || req.body.uname.length > 64 || req.body.passwd === 0 || req.body.passwd > 64) {
            res.status(200).render('login', { err: 'Invalid field lengths (> 64 or empty)' });
            console.log('Invalid field lengths');
            return;
        }

        // get user auth data
        dbClient.read<User>('users', { uname: req.body.uname })
            .then(dbRes => {

                // return if no results
                if (dbRes.length === 0) {
                    res.status(200).render('login', { err: errStr.INVALID_CREDS }); // intentionally kept ambiguous for security
                    console.log('Username does not exist in DB');
                    return;
                }

                // otherwise, generate hash with input password
                scrypt(req.body.passwd, Buffer.from(dbRes[0].passwd_salt, 'base64'), 16, { N: 131072, r: 8, p: 1, maxmem: 134217728 + 3072 }, (err, key) => {

                    // fail on error
                    if (err) {
                        res.status(200).render('login', { err: errStr.UNEXPECTED_ERR });
                        console.error('Scrypt failed');
                        return;
                    }
                
                    // otherwise, compare with db entry
                    if (Buffer.compare(Buffer.from(dbRes[0].passwd_hash, 'base64'), key) !== 0) {
                        res.status(200).render('login', { err: errStr.INVALID_CREDS });
                        console.log('Keys do not match');
                        return;
                    }

                    // passwords match, grant jwt
                    res.cookie('jwt', jwt.sign({ userid: dbRes[0].uid, uname: dbRes[0].uname }, process.env.APP_JWT_SECRET as string), {
                        maxAge: 86400000, // 24 hours
                        signed: true,
                        path: '/',
                        httpOnly: true
                    });
                    console.log('Successfully granted JWT cookie');
                    res.redirect('/home');
                });
            })
            .catch(err => {
                console.error(err);
                next(err);
            });
    });

export default router;