import { NextResponse } from "next/server";
import { Filter, Document } from "mongodb";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        //Search parameters for finding scheduled flights
        const orig = searchParams.get("orig");
        const dest = searchParams.get("dest");
        const date1 = searchParams.get("date1");
        const date2 = searchParams.get("date2");

        const db = await connectDB();

        const query: Filter<Document> = {};

        if (orig) query.origin = orig;
        if (dest) query.dest = dest;

        //Date range filter
        if (date1 && date2) {
            //Interpret search dates in NZ local time
            //Otherwise, Vercel will use UTC time for searching
            const start = new Date(`${date1}T00:00:00+12:00`);
            const end = new Date(`${date2}T23:59:59.999+12:00`);

            query.depDate = {
                $gte: start,
                $lte: end,
            };
        }

        //Fetch schedules
        const schedules = await db
            .collection("schedules")
            .find(query)
            .sort({ depDate: 1 })       //Orders search results by departure date (earliest first)
            .toArray();

        //Computing seats left
        const flightsPlusSeatsLeft = schedules.map((flight) => ({
            ...flight,
            seatsLeft: flight.seats - (flight.bookings?.length || 0),
        }));

        return NextResponse.json(flightsPlusSeatsLeft);
    } catch (error) {
        console.error("Schedules API error:", error);

        return NextResponse.json(
            { error: "Failed to fetch schedules." },
            { status: 500 }
        );
    }
}