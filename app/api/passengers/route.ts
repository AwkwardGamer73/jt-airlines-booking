import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/mongodb";
import {Passenger} from "@/src/types/db";

//Finds a passenger with the same email
export async function GET(req: NextRequest){
    const email = req.nextUrl.searchParams.get("email");

    if(!email){
        return NextResponse.json(
            {error: "Email required"},
            {status: 400}
        );
    }

    const db = await connectDB();

    const passenger = await db
        .collection<Passenger>("passengers")
        .findOne({email:email.toLowerCase()});

    if(!passenger){
        return NextResponse.json(
            {error: "Passenger not found"},
            {status: 404}
        );
    }

    return NextResponse.json(passenger);
}

//Creates a passenger based on the form data
export async function POST(req: NextRequest){
    try{
        const body = await req.json();

        const {title, firstName, surname, email} = body;

        if(!firstName || !surname || !email){
            return NextResponse.json(
                {error: "Missing required fields"},
                {status: 400}
            )
        }

        const db = await connectDB();

        //Checks just in case, as during creation phase, user may have changed email to an email ALREADY in database
        const existingPassenger = await db.collection<Passenger>("passengers").findOne({email:email.toLowerCase()});

        if(existingPassenger){
            return NextResponse.json(
                {error: "Email already in use"},
                {status: 409}
            );
        }

        const newPassenger = {
            title,
            firstName,
            surname,
            email: email.toLowerCase(),};

        const result = await db
            .collection<Passenger>("passengers")
            .insertOne(newPassenger)

        //MongoDB creates document IDs automatically, so I pulled the createdPassenger to retrieve the full document
        const createdPassenger = await db
            .collection<Passenger>("passengers")
            .findOne({ _id: result.insertedId});

        return NextResponse.json(createdPassenger);

    } catch (error){
        console.error(error);

        return NextResponse.json(
            {error: "Failed to create passenger"},
            {status: 500}
        )
    }
}