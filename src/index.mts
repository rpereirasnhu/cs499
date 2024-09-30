
// imports
import path from 'node:path';
import express, { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import checkEnvVars from './env-check.mjs';
import { MongoClient } from 'mongodb';
import { AppDb } from './crud.mjs';
import apiRouter from './api.mjs';

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

// connect to db
const dbClient = new AppDb(process.env.DB_IP, process.env.DB_PORT, process.env.DB_APP_USER, process.env.DB_APP_PASS);

// basic middleware
app.use((req: Request, res: Response, next: NextFunction) => {

    // attach db client to response locals
    res.locals._dbClient = dbClient;

    // log
    console.log(`Incoming request from: ${req.ip}`);
    console.log(`${req.method} ${req.path}`);
    next();
});

// api routes
app.use('/api', apiRouter);

// routes
app.get('/', (req: Request, res: Response) => {
    res.redirect('/home');
});
app.get('/home', (req: Request, res: Response) => {
    res.render('home');
});

// error handling
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log('404');
    res.status(404).render('error', { err: '404 Page Not Found' });
    next();
});
app.use((err: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    console.error('500');
    if (res.headersSent) return next(err);
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
