import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/mongodb";
import {Passenger} from "@/src/types/db";

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

        const newPassenger = {title, firstName, surname, email};

        const result = await db
            .collection<Passenger>("passengers")
            .insertOne(newPassenger)

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