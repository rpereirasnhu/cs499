
import { NextFunction, Request, Response, Router } from "express";
import { AppDb, ProcessEntry } from "./crud.mjs";

const router = Router();

router.route('/spm')
    .get(async (req: Request, res: Response, next: NextFunction) => {

        // get db client
        const dbClient = res.locals._dbClient as AppDb;

        // attempt to pull docs
        dbClient.read<ProcessEntry>('spm', {})
            .then(dbRes => {
                res.status(200).json(dbRes);
            })
            .catch(err => next(err));
        
    })
    .post(async (req: Request, res: Response, next: NextFunction) => {

        // get db client
        const dbClient = res.locals._dbClient as AppDb;

        try {

            // check if intended for random generation
            const randCount = +req.body.gen_rand;
            if (req.body.gen_rand !== undefined) {

                // validate (if valid)
                if (!Number.isInteger(randCount) || randCount <= 0 || randCount > 64)
                    throw new Error('Invalid random count (number range must be [1, 64])');

                // generate docs
                let docs: ProcessEntry[] = [];
                for (let i = 0; i < randCount; i++) {
                    docs.push({
                        pid: i,
                        name: `process_${i}`,
                        owner: `user_${Math.floor(Math.random() * 4)}`,
                        start_time: Math.floor(Math.random() * randCount),
                        duration: Math.floor(Math.random() * randCount / 4) + 2
                    });
                }

                // delete all elements and insert docs
                dbClient.delete<ProcessEntry>('spm', {})
                    .then(dbRes => dbClient.create<ProcessEntry>('spm', ...docs))
                    .then(dbRes => dbRes ? res.status(200).json({ docInsertCount: dbRes.insertedCount }) : null)
                    .catch(console.error);

                return;
            }

            // validate (if vars exist)
            if (req.body.pid === undefined || req.body.name === undefined || req.body.owner === undefined || req.body.start_time === undefined || req.body.duration === undefined)
                throw new Error('Missing parameters');

            // validate (if vars are valid)
            const doc: ProcessEntry = {
                pid: +req.body.pid,
                name: req.body.name,
                owner: req.body.owner,
                start_time: +req.body.start_time,
                duration: +req.body.duration
            };
            if (!Number.isInteger(doc.pid) || doc.pid < 0 || doc.pid > 255 ||
                doc.name.length > 64 ||
                doc.owner.length > 64 ||
                !Number.isInteger(doc.start_time) || doc.start_time < 0 || doc.start_time > 255 ||
                !Number.isInteger(doc.duration) || doc.duration < 0 || doc.duration > 255)
                throw new Error('Invalid parameters (string length must be <= 64, number range must be [0, 255])');

            // insert data if pid doesn't exist
            dbClient.read<ProcessEntry>('spm', { pid: doc.pid })
                .then(dbRes => {

                    // return no inserts if pid exists
                    if (dbRes.length > 0) {
                        res.status(400).json({ docInsertCount: 0 });
                        return null;
                    }

                    // otherwise, create entry
                    return dbClient.create<ProcessEntry>('spm', doc);
                })
                .then(dbRes => dbRes ? res.status(200).json({ docInsertCount: dbRes.insertedCount }) : null)
                .catch(next);

        } catch (err: any) {

            console.error(err);
            res.status(400).json(err?.message); 
        }
    })
    .put(async (req: Request, res: Response, next: NextFunction) => {

        // get db client
        const dbClient = res.locals._dbClient as AppDb;

        try {

            // validate (if orig_pid exists)
            if (req.body.orig_pid === undefined || req.body.orig_pid === '')
                throw new Error('Missing PID');

            // validate (if orig_pid is valid)
            const origPid = +req.body.orig_pid;
            if (!Number.isInteger(origPid) || origPid < 0 || origPid > 255)
                throw new Error('Invalid PID (number range must be [0, 255])');

            // validate (if any other data exists)
            let updateObj: Partial<ProcessEntry> = {};
            if (req.body.pid !== undefined && req.body.pid !== '') updateObj.pid = +req.body.pid;
            if (req.body.name !== undefined && req.body.name !== '') updateObj.name = req.body.name;
            if (req.body.owner !== undefined && req.body.owner !== '') updateObj.owner = req.body.owner;
            if (req.body.start_time !== undefined && req.body.start_time !== '') updateObj.start_time = +req.body.start_time;
            if (req.body.duration !== undefined && req.body.duration !== '') updateObj.duration = +req.body.duration;
            if (Object.keys(updateObj).length === 0)
                throw new Error('No data to update with');

            // validate (if provided data is valid)
            if ((updateObj.pid !== undefined && (!Number.isInteger(updateObj.pid) || updateObj.pid < 0 || updateObj.pid > 255)) ||
                (updateObj.name !== undefined && updateObj.name.length > 64) ||
                (updateObj.owner !== undefined && updateObj.owner.length > 64) ||
                (updateObj.start_time !== undefined && (!Number.isInteger(updateObj.start_time) || updateObj.start_time < 0 || updateObj.start_time > 255)) ||
                (updateObj.duration !== undefined && (!Number.isInteger(updateObj.duration) || updateObj.duration < 0 || updateObj.duration > 255)))
                throw new Error('Invalid update parameters (string length must be <= 64, number range must be [0, 255])');

            // insert data if updated pid doesn't exist
            dbClient.read<ProcessEntry>('spm', { pid: updateObj.pid })
                .then(dbRes => {

                    // return no updates if new pid already exists
                    if (origPid !== updateObj.pid && dbRes.length > 0) {
                        res.status(400).json({ docUpdateCount: 0 });
                        return null;
                    }

                    // otherwise, update
                    return dbClient.update<ProcessEntry>('spm', { pid: origPid }, updateObj);
                })
                .then(dbRes => dbRes ? res.status(200).json({ docUpdateCount: dbRes.modifiedCount }) : null)
                .catch(next);

        } catch (err: any) {

            console.log(err?.message);
            res.status(400).json(err?.message);
        }
    })
    .delete(async (req: Request, res: Response, next: NextFunction) => {

        // get db client
        const dbClient = res.locals._dbClient as AppDb;

        try {

            // validate (if pid exists)
            if (req.body.pid === undefined || req.body.pid === '')
                throw new Error('Missing PID');

            // validate (if pid is valid)
            const pid = +req.body.pid;
            if (!Number.isInteger(pid) || pid < 0 || pid > 255)
                throw new Error('Invalid PID (number range must be [0-255])');

            // attempt to delete doc
            dbClient.delete<ProcessEntry>('spm', { pid: pid })
                .then(dbRes => res.status(200).json({ docDeleteCount: dbRes.deletedCount }))
                .catch(next);

        } catch (err: any) {

            console.error(err?.message);
            res.status(400).json(err?.message);
        }
    });

export default router;