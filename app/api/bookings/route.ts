import {NextResponse} from "next/server";
import {ObjectId} from "mongodb";
import {nanoid} from "nanoid";
import {connectDB} from "@/lib/mongodb";
import {Schedule, Passenger} from "@/src/types/db";

export async function POST(req:Request){
    try{
        const body = await req.json();

        const {scheduleID, passenger} = body;

        if(!scheduleID || !passenger){
            return NextResponse.json(
                {error: "Missing booking information"},
                {status: 400}
            );
        }

        const { title, firstName, surname, email, gender} = passenger;

        if(!title || !firstName || !surname || !email || !gender){
            return NextResponse.json(
                {error: "All passenger fields are required to make a booking."},
                {status: 400}
            );
        }

        const db = await connectDB();

        const schedules = db.collection<Schedule>("schedules");
        const passengers = db.collection<Passenger>("passengers");

        //Find schedule
        const schedule = await schedules.findOne({_id: new ObjectId(scheduleID)});

        if(!schedule){
            return NextResponse.json(
                {error: "Flight not found"},
                {status: 404}
            )
        }

        //Prevent overbooking
        const currentBookings = schedule.bookings?.length || 0;

        if (currentBookings >= schedule.seats){
            return NextResponse.json(
                {error: "Flight is already full"},
                {status: 400}
            )
        }

        //Reuse passenger if email already exists
        const existingPassenger = await passengers.findOne({email: email.toLowerCase()});

        let passengerID : ObjectId;

        if(existingPassenger){
            passengerID = existingPassenger._id;
        } else{
            const passengerInsert = await passengers.insertOne({
                title,
                firstName,
                surname,
                email: email.toLowerCase(),
                gender,
            });

            passengerID = passengerInsert.insertedId;
        }

        //Generate booking reference
        const bookingRef = "JTA-" + nanoid(6).toUpperCase();

        //Booking object
        const booking = {
            bookingRef,
            passengerID,

            title,
            firstName,
            surname,

            email: email.toLowerCase(),

            bookedAt: new Date(),
        }

        //Add booking to schedule
        await schedules.updateOne(
            {
                _id: schedule._id,
            },

            {
                $push: {
                    bookings: booking,
                },
            }
        );

        return NextResponse.json({
            success: true,

            bookingRef,

            flight: {
                flightNo: schedule.flightNo,
                origin: schedule.origin,
                dest: schedule.dest,

                depDate: schedule.depDate,
                arrDate: schedule.arrDate,

                price: schedule.price,
            },

            passenger: {
                title,
                firstName,
                surname,
                email,
            }
        });

    } catch (error){
        console.error("Booking API error: ", error);

        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}