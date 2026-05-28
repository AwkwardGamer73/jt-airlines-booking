"use client";

import { Schedule, Passenger } from "@/src/types/db";
import { formatDate, formatTime } from "@/lib/dateFormatting"

export default function FlightCard({flight, loggedInPassenger, onSelectAction}
                                   :{
                                        flight: Schedule;
                                        loggedInPassenger: Passenger | null;
                                        onSelectAction: (flight: Schedule) => void;
                                    }){
    const seatsLeft = flight.seats - flight.bookings.length;

    const alreadyBooked = flight.bookings.some(
        (booking) =>
            booking.passengerID.toString() === loggedInPassenger?._id?.toString()
    );

    return (
        <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="grid gap-6 md:grid-cols-6 md:items-center">

                <div>
                    <p className="text-sm text-slate-500">Flight</p>

                    {/*Giving flight number and route*/}
                    <h3 className="text-2xl font-bold text-slate-800">{flight.flightNo}</h3>

                    <p className="mt-1 text-slate-600">{flight.origin} → {flight.dest}</p>
                </div>

                {/*Displaying duration of flight*/}
                <div>
                    <p className="text-sm text-slate-500">Duration</p>

                    <h3 className="text-3xl font-semibold text-slate-800">{flight.duration}</h3>
                </div>

                {/*Displaying departure date and time of flight*/}
                <div>
                    <p className="text-sm text-slate-500">Departure</p>

                    <p className="font-semibold text-slate-800">{formatDate(flight.depDate, flight.origin)}</p>

                    <p className="font-semibold text-slate-800">{formatTime(flight.depDate, flight.origin)}</p>
                </div>

                {/*Displaying departure date and time of flight*/}
                <div>
                    <p className="text-sm text-slate-500">Arrival</p>

                    <p className="font-semibold text-slate-800">{formatDate(flight.arrDate, flight.dest)}</p>

                    <p className="font-semibold text-slate-800">{formatTime(flight.arrDate, flight.dest)}</p>
                </div>

                {/*Displaying price and available seats*/}
                <div>
                    <p className="text-sm text-slate-500">Price</p>

                    <p className="text-2xl font-bold text-sky-600">NZD ${flight.price}</p>

                    {/*Changes text colour depending on if flight is full*/}
                    <p className={`mt-1 text-sm font-medium ${seatsLeft > 0
                        ? "text-green-600"
                        : "text-red-500"}`}>{seatsLeft > 0 ? `${seatsLeft} seats left` : "Flight full"}</p>
                </div>

                <div>

                    {/* Booking Button
                        Gets disabled when no seats are left, passenger isn't logged in,
                        or when flight is already booked by passenger*/}
                    <button
                        disabled={seatsLeft <= 0 || !loggedInPassenger || alreadyBooked}

                        onClick={() => onSelectAction(flight)}

                        className={`w-full rounded-xl p-4 font-semibold text-white transition ${seatsLeft <= 0
                            ? "cursor-not-allowed bg-slate-400"
                            : alreadyBooked
                                ? "cursor-not-allowed bg-green-400"
                                : !loggedInPassenger
                                    ? "cursor-not-allowed bg-slate-300"
                                    : "cursor-pointer bg-sky-500 hover:bg-sky-400"}`}>

                        {seatsLeft <= 0 ? "Flight Full" : alreadyBooked
                            ? "Already Booked"
                            : !loggedInPassenger
                                ? "Login to Book"
                                : "Book Flight"}
                    </button>

                </div>
            </div>
        </div>
    );
}