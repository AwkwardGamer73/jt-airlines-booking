import {NextRequest, NextResponse} from "next/server";
import {ObjectId} from "mongodb";
import {nanoid} from "nanoid";
import {connectDB} from "@/lib/mongodb";
import {Schedule, Passenger} from "@/src/types/db";

//Getting all bookings associated with a passengerID
export async function GET(req: NextRequest){
    try{
        const passengerID = req.nextUrl.searchParams.get("passengerID");

        if(!passengerID){
            return NextResponse.json(
                {error: "Passenger ID required"},
                {status: 400}
            );
        }

        const db = await connectDB();

        const schedules = db.collection<Schedule>("schedules");

        //Find all flights with bookings matching passenger's ID
        const flights = await schedules
            .find({"bookings.passengerID": new ObjectId(passengerID)})
            .toArray();

        return NextResponse.json(flights);

    } catch (error){
        console.error(error);

        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }

}

//Creates a booking for the user
export async function POST(req:NextRequest){
    try{
        const body = await req.json();

        const {scheduleID, passengerID} = body;

        if(!scheduleID || !passengerID){
            return NextResponse.json(
                {error: "Missing booking information"},
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

        //Find passenger
        const passenger = await passengers.findOne({_id: new ObjectId(passengerID)});

        if(!passenger){
            return NextResponse.json(
                {error: "Passenger not found"},
                {status: 404}
            )
        }

        const {title, firstName, surname, email} = passenger;

        //Prevent overbooking
        const currentBookings = schedule.bookings?.length || 0;

        if (currentBookings >= schedule.seats){
            return NextResponse.json(
                {error: "Flight is already full"},
                {status: 400}
            )
        }

        //Generate booking reference
        const bookingRef = "JTA-" + nanoid(6).toUpperCase();

        //Booking object
        const booking = {
            bookingRef,
            passengerID: passenger._id,

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
                planeType: schedule.planeType,
                origin: schedule.origin,
                dest: schedule.dest,

                depDate: schedule.depDate,
                arrDate: schedule.arrDate,

                duration: schedule.duration,

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

//Deletes/cancels a booking for a specific passenger
export async function DELETE(req: NextRequest){
    try{
        const body = await req.json();

        const {scheduleID, passengerID} = body;

        if(!scheduleID || !passengerID){
            return NextResponse.json(
                {error: "Missing booking information"},
                {status: 400}
            )
        }

        const db = await connectDB();

        const schedules = db.collection<Schedule>("schedules");

        //Remove booking from schedule
        const result = await schedules.updateOne(
            {_id: new ObjectId(scheduleID)},
            {
                $pull: {
                    bookings: {
                        passengerID: new ObjectId(passengerID),
                    },
                },
            }
        );

        //Checks to see if anything was modified (if there wasn't, it means the booking wasn't found)
        if(result.modifiedCount === 0){
            return NextResponse.json(
                {error: "Booking not found"},
                {status: 404}
            );
        }

        return NextResponse.json({
            success: true,
            message: "Booking deleted successfully",
        })

    } catch(error){
        console.error(error);

        return NextResponse.json(
            { error: "Failed to delete booking" },
            {status: 500}
        );
    }
}