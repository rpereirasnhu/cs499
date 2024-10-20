import { DeleteResult, Document, Filter, FindCursor, InsertManyResult, MatchKeysAndValues, MongoClient, OptionalId, OptionalUnlessRequiredId, UpdateFilter, UpdateResult, WithId } from "mongodb";

export interface ProcessEntry extends Document {
    pid: number;
    name: string;
    owner: string;
    start_time: number;
    duration: number;
}

export interface User extends Document {
    uid: number;
    uname: string;
    passwd_hash: string;
    passwd_salt: string;
}

export class AppDb {

    private static _dbName: string = 'spm-data';
    private _dbClient: MongoClient;

    // connect driver client instance to db
    constructor(dbIp: string, dbPort: string | number, dbUser: string, dbPass: string) {
        this._dbClient = new MongoClient(`mongodb://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPass)}@${dbIp}:${dbPort}`, { connectTimeoutMS: 5000 });
        this._dbClient.connect()
            .then(() => {
                console.log('Database connection successful');
            })
            .catch(err => {
                console.error('Database connection failed');
                console.error(err);
            });
    }

    /**
     * Creates database entries in a specified collection.
     * @param {string} collection The collection to insert into.
     * @param {OptionalUnlessRequiredId<T>[]} docs The documents to add.
     * @returns {Promise<InsertManyResult>} The result of the attempted insertion.
     */
    public async create<T extends Document>(collection: string, ...docs: OptionalUnlessRequiredId<T>[]): Promise<InsertManyResult> {
        return this._dbClient.db(AppDb._dbName).collection<T>(collection).insertMany(docs);
    }

    /**
     * Reads database entries in a specified collection.
     * @param {string} collection The collection to query.
     * @param {Filter<T>} filter The query to try.
     * @returns {Promise<WithId<T>[]>} The result of the attempted retrieval.
     */
    public async read<T extends Document>(collection: string, filter: Filter<T>): Promise<WithId<T>[]> {
        return this._dbClient.db(AppDb._dbName).collection<T>(collection).find(filter).toArray();
    }

    /**
     * Updates database entries in a specified collection.
     * @param {string} collection The collection to update.
     * @param {Filter<T>} filter The query to try.
     * @param {MatchKeysAndValues<T>} update The data to update.
     * @returns {Promise<UpdateResult<T>>} The result of the attempted update.
     */
    public async update<T extends Document>(collection: string, filter: Filter<T>, update: MatchKeysAndValues<T>): Promise<UpdateResult<T>> {
        return this._dbClient.db(AppDb._dbName).collection<T>(collection).updateMany(filter, { $set: update });
    }

    /**
     * Deletes database entries in a specified collection.
     * @param {string} collection 
     * @param {Filter<T>} filter 
     * @returns {Promise<DeleteResult>} The result of the attempted deletion.
     */
    public async delete<T extends Document>(collection: string, filter: Filter<T>): Promise<DeleteResult> {
        return this._dbClient.db(AppDb._dbName).collection<T>(collection).deleteMany(filter);
    }
}