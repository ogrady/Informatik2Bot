import * as sqlite3h from "better-sqlite3-helper";
import * as discord from "discord.js"

export interface QueryInfo {
    readonly changes: number;
    readonly lastInsertRowid: number;
}

export interface User {
    readonly id: number;
    readonly token: string;
    readonly email: string;
    readonly discord_user: string;
    readonly confirmed: boolean;
    readonly created: string;
    readonly verified: string;
}

export class Database {
    /**
    * Finds a user by email. 
    * @param email the exact email of that user. 
    * @returns User record, if any else undefined.
    */
    public findUser(email: string): User | undefined {
        return this.execute(db => db.prepare(`
            SELECT 
                id,
                token,
                email,
                discord_user,
                confirmed,
                created,
                verified
            FROM 
                users
            WHERE 
                email = ?
        `).get(email))
    }

    /**
    * Upserts the token for a specific Discord user.
    * @param user discord user which is unique in the DB. Passing a duplicate will instead update EMail and token for them. 
    * @param email email address to which the token was sent. 
    * @param token token for verification.
    */
    public setToken(user: discord.User, email: string, token: string): void {
        this.execute(db => db.prepare(`INSERT INTO users(discord_user, email, token) VALUES(?,?,?) 
                                            ON CONFLICT(discord_user) DO 
                                            UPDATE SET 
                                                email = ?, 
                                                token = ?, 
                                                created = CURRENT_TIMESTAMP`)
                             .run(user.id, email, token, email, token));
    }

    /**
    * Verifies the token for a specific user. 
    * That is: if such a (user,token) pair exists, it is set to verified 
    * and the token is deleted to avoid abuse. 
    * @param user the user to check the token for. 
    * @param token the token to check. 
    * @returns true, if a (user,token) pair was found and updated.
    */
    public verifyToken(user: discord.User, token: string): boolean {
        return this.execute(db => db.prepare(`UPDATE users SET 
                                                confirmed = TRUE, 
                                                verified = CURRENT_TIMESTAMP,
                                                token = NULL
                                       WHERE discord_user = ? AND token = ?`)
                    .run(user.id, token))
                    .changes > 0;
    }

    /**
    *
    */
    public getDiscordUserByMail(email: string): string[] {
        return this.execute(db => db.prepare(`SELECT FROM discord_user users WHERE email = ?`).run(email))
    }

    /**
    * Executes an SQL statement and handles errors, as well as closing the DB connection afterwards.
    * f: lambda expression taking the opened sqlite3 connection to run queries on.
    * returns: the result of the lambda.
    */
    public execute<T>(f: (sqlite3: sqlite3h.BetterSqlite3Helper.DBInstance) => T): T | undefined  {
        const db: sqlite3h.BetterSqlite3Helper.DBInstance = sqlite3h.default();
        db.pragma("foreign_keys = ON");

        let res: T | undefined;
        try {
            res = f(db);
        } catch(err) {
            res = undefined;
            console.error(`DB execute: ${err["message"]} (stack: ${new Error().stack})`);
        }

        //db.close(); // nope, because of the global instance, this brings all following statements to a screeching halt...
        return res;
    }
}