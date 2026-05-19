import dns from 'node:dns/promises'
import {MongoClient} from 'mongodb'

//Uses Google's DNS to get around Node.js issues with DNS and MongoDB
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const URI = process.env.MONGODB_URI!;

const DB_NAME = "airline_DB";

const client = new MongoClient(URI);

export async function connectDB() {
    await client.connect();

    return client.db(DB_NAME);
}