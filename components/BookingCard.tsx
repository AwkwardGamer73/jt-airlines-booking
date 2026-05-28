"use client";

import { Schedule, Passenger } from "@/src/types/db";

import { formatDate, formatTime } from "@/lib/dateFormatting";
import { getAirportName } from "@/lib/airports";

export default function BookingCard({
  flight,
  loggedInPassenger,
  onCancelAction,
}: {
  flight: Schedule;
  loggedInPassenger: Passenger;
  onCancelAction: (scheduleID: string) => void;
}) {

  // Find the passenger's booking for this flight
  const booking = flight.bookings.find(
    (b) =>
      b.passengerID.toString() === loggedInPassenger._id?.toString()
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="grid gap-6 md:grid-cols-6 md:items-center">

        {/* Flight */}
        <div>
          <p className="text-sm text-slate-500">Flight</p>

          <h3 className="text-2xl font-bold text-slate-800">{flight.flightNo}</h3>

          <p className="mt-1 text-slate-600">{getAirportName(flight.origin)} {" → "} {getAirportName(flight.dest)}</p>
        </div>

        {/* Booking Reference */}
        <div>
          <p className="text-sm text-slate-500">Booking Ref</p>

          <p className="text-xl font-bold text-sky-600">{booking?.bookingRef}</p>
        </div>

        {/* Departure */}
        <div>
          <p className="text-sm text-slate-500">Departure</p>

          <p className="font-semibold text-slate-800">{formatDate(flight.depDate, flight.origin)}</p>

          <p className="font-semibold text-slate-800">{formatTime(flight.depDate, flight.origin)}</p>
        </div>

        {/* Arrival */}
        <div>
          <p className="text-sm text-slate-500">Arrival</p>

          <p className="font-semibold text-slate-800">{formatDate(flight.arrDate, flight.dest)}</p>

          <p className="font-semibold text-slate-800">{formatTime(flight.arrDate, flight.dest)}</p>
        </div>

        {/* Price */}
        <div>
          <p className="text-sm text-slate-500">Paid</p>

          <p className="text-2xl font-bold text-slate-800">NZD ${flight.price}</p>
        </div>

        {/*Cancel Button*/}
        <div>
          <button
              onClick={() => onCancelAction(flight._id.toString())}
              className="cursor-pointer w-full rounded-xl p-4 bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Cancel Booking
          </button>
        </div>

      </div>
    </div>
  );
}