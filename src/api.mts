
import { NextFunction, Request, Response, Router } from "express";
import { AppDb } from "./crud.mjs";

const router = Router();

router.route('/spm')
    .get(async (req: Request, res: Response) => {
        const dbClient = res.locals._dbClient as AppDb;
        const docs = await dbClient.read('spm', {});
        res.status(200).send(JSON.stringify(docs));
    });

export default router;