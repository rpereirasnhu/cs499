
// imports
import path from 'node:path';
import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import checkEnvVars from './env-check.mjs';
import { MongoClient } from 'mongodb';
import { AppDb, User } from './crud.mjs';
import apiRouter from './api.mjs';
import loginRouter from './login.mjs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// check environment variables are defined; fail otherwise
if (!checkEnvVars(process.env)) {
    console.error('Missing environment variables');
    process.exit(1);
}

// setup and config express
const app = express();
app.set('views', path.join(import.meta.dirname, 'templates'));
app.set('view engine', 'pug');
app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser(process.env.APP_COOKIE_SECRET));

// connect to db
const dbClient = new AppDb(process.env.DB_IP, process.env.DB_PORT, process.env.DB_APP_USER, process.env.DB_APP_PASS);

// create default user if not set up yet
if ((await dbClient.read<User>('users', { uname: process.env.APP_DEFAULT_USER })).length === 0) {
    const dbRes = await dbClient.create<User>('users', {
        uid: 0,
        uname: process.env.APP_DEFAULT_USER,
        passwd_hash: process.env.APP_DEFAULT_PASS,
        passwd_salt: process.env.APP_DEFAULT_SALT
    });
    if (dbRes.insertedCount !== 1) {
        console.error('Failed to create default user');
        process.exit(1);
    }
}



// basic middleware
app.use((req: Request, res: Response, next: NextFunction) => {

    // attach db client to response locals
    res.locals._dbClient = dbClient;

    // log
    console.log(`Incoming request from: ${req.ip}`);
    console.log(`${req.method} ${req.path}`);

    // go to next if login
    if (req.path === '/login') return next();

    // if no valid jwt cookie, user is unauthorized
    try {
        const token = req.signedCookies['jwt'];
        if (token === undefined)
            throw 'Token not provided';
        jwt.verify(token, process.env.APP_JWT_SECRET as string);
        return next();
    } catch (err) {
        console.log(err);
        res.redirect('login');
    }
});

// login
app.use('/login', loginRouter);
app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('jwt');
    res.redirect('/login');
});

// api routes
app.use('/api', apiRouter);

// routes
app.get('/', (req: Request, res: Response) => {
    res.redirect('/home');
});
app.get('/home', (req: Request, res: Response) => {
    res.status(200).render('home');
});
app.get('/processadd', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('add-process');
});
app.get('/processedit', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('edit-process');
});
app.get('/processdelete', (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('delete-process');
});

// error handling
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('404');
    res.status(404).render('error', { err: '404 Page Not Found' });
    next();
});
app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    
    // print error
    console.error(err);

    // return to default error handler if response already partially sent
    if (res.headersSent) return next(err);

    // handle API error
    const errMsg = '500 Internal Server Error';
    if (req.path.startsWith('/api')) {
        res.status(500).json(errMsg);
        return;
    }

    // handle error for other routes
    try {
        res.status(500).render('error', { err: '500 Internal Server Error' });
    } catch (err) {
        if (res.headersSent) return next(err);
        res.status(500).send('<html><head><title>500 Internal Server Error</title></head><body><h1>500 Internal Server Error</h1></body></html>');
    }
});

// start listening
app.listen(process.env.HTTP_PORT, () => {
    console.log(`Listening on port ${process.env.HTTP_PORT}...`);
});
