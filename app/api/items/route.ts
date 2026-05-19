import {connectDB} from "@/lib/mongodb";

export async function GET() {
    const myDB = await connectDB();

    const airports = await myDB.collection("airports");

    const myQuery = {tz: {"$eq": "Pacific/Auckland"}};

    const myDocs = await airports.find(myQuery).toArray();

    return Response.json(myDocs);
}