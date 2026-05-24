"use client";

import { useState } from "react";
import { Schedule } from "@/src/types/db";

const airports = [
  {code: "NZNE", name: "Dairy Flat", tz: "Pacific/Auckland"},
  {code: "NZRO", name: "Rotorua", tz: "Pacific/Auckland"},
  {code: "NZGB", name: "Claris", tz: "Pacific/Auckland"},
  {code: "NZTL", name: "Lake Tekapo", tz: "Pacific/Auckland"},
  {code: "NZCI", name: "Tuuta", tz: "Pacific/Chatham"},
  {code: "YSSY", name: "Sydney", tz: "Australia/Sydney"},
]

function getAirportTZ(code: string) {
  return airports.find((airport) => airport.code === code)?.tz;
}

export default function Home(){
  //Search parameters for flights
  const [orig, setOrig] = useState("NZNE");
  const [dest, setDest] = useState("NZRO");
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");

  //Flights found by the search
  const [flights, setFlights] = useState<Schedule[]>([]);

  //Flight selected by the user
  const [selectedFlight, setSelectedFlight] = useState<Schedule | null>(null);

  //Form data for setting a booking
  const [formData, setFormData] = useState({
    title: "Mr",
    firstName: "",
    surname: "",
    email: "",
    gender: "m",
  })

  async function searchFlights(){
    try{
      //Search for flights based on origin airport, destination airport, and during a range of dates
      const response = await fetch(`api/schedules?orig=${orig}&dest=${dest}&date1=${date1}&date2=${date2}`);

      const data = await response.json();

      setFlights(data);
    } catch (error){
      console.error(error);
    }
  }

  async function handleBooking(){
    if(!selectedFlight){
      return;
    }

    try{
      const response = await fetch (
          "api/bookings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scheduleID: selectedFlight._id,
            })
          });

      const data = await response.json();

      if(!response.ok){
        alert(data.error);
        return;
      }

      setSelectedFlight(null);

      await searchFlights();
    } catch (error){
      console.error(error);
    }
  }

  return(
      <main className="min-h-screen bg-slate-100">
        <section className="relative h-[75vh] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/60"/>

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-white">
            <h1 className="mb-4 text-center text-5xl font-bold md:text-6xl">JT Airlines</h1>

            <p className="mb-10 max-w-2xl text-center text-lg text-slate-200">Placeholder</p>

            {/*Search Box*/}
            <div className="w-full max-w-6xl rounded-3xl bg-white p-6 text-slate-800 shadow-2xl">
              <div className="grid gap-4 md:grid-cols-5">

                {/*Origin Airport Selection*/}
                <div>
                  <label className="mb-2 block text-sm font-semibold">From</label>

                  <select
                      value = {orig}
                      onChange={(e) => setOrig(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3">
                    {
                      airports.map((airport) => (
                          <option key={airport.code} value={airport.code}>
                            {airport.name}
                          </option>
                      ))
                    }
                  </select>

                </div>

                {/*Destination Airport*/}
                <div>
                  <label className="mb-2 block text-sm font-semibold">To</label>

                  <select
                      value={dest}
                      onChange={(e) => setDest(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3"
                  >
                    {airports.map((airport) => (
                        <option
                            key={airport.code}
                            value={airport.code}
                        >
                          {airport.name}
                        </option>
                    ))}
                  </select>
                </div>

                {/* Date 1 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">From Date</label>

                  <input
                      type="date"
                      value={date1}
                      onChange={(e) => setDate1(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                {/* Date 2 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">To Date</label>

                  <input
                      type="date"
                      value={date2}
                      onChange={(e) => setDate2(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                {/*Search Flights Button*/}
                <div className="flex items-end">
                  <button
                      onClick={searchFlights}
                      className="w-full rounded-xl bg-sky-500 p-3 font-semibold text-white transition hover:bg-sky-400">
                    {"Search Flights"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Results of search*/}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-800">Available Flights</h2>

            <span className="text-slate-500">{flights.length} flights found</span>
          </div>

          {flights.length === 0 ? (
              // Displays this if flights.length = 0
              <div className="rounded-2xl bg-white p-12 text-center shadow">
                <p className="text-lg text-slate-500">Search for flights to begin</p>
              </div>
          ) : (
              //Displays this if there were flights found
              <div className= "grid gap-6">
                {flights.map((flight) => {
                  const seatsLeft = flight.seats - flight.bookings.length;

                  return(
                      <div
                          key = {flight._id.toString()}
                          className="rounded-3xl bg-white p-6 shadow-lg"
                      >
                        <div className="grid gap-6 md:grid-cols-6 md:items-center">
                          <div>
                            <p className="text-sm text-slate-500">Flight</p>

                            {/*Giving flight number and the route*/}
                            <h3 className="text-2xl font-bold text-slate-800">{flight.flightNo}</h3>

                            <p className="mt-1 text-slate-600">{flight.origin} → {flight.dest}</p>
                          </div>

                          {/*Displaying Duration of Flight*/}
                          <div>
                            <p className="text-sm text-slate-500">Duration</p>

                            <h3 className="text-3xl font-semibold text-slate-800">{flight.duration}</h3>
                          </div>

                          {/*Displaying Departure Date*/}
                          <div>
                            <p className="text-sm text-slate-500">Departure</p>

                            <p className="font-semibold text-slate-800">
                              {new Date(flight.depDate).toLocaleString("en-NZ", {
                                timeZone: getAirportTZ(flight.origin),
                                weekday: "short",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>

                            <p className="font-semibold text-slate-800">
                              {new Date(flight.depDate).toLocaleString("en-NZ", {
                                timeZone: getAirportTZ(flight.origin),
                                hour: "numeric",
                                minute: "numeric",
                                timeZoneName: "short",
                              })}
                            </p>
                          </div>

                          {/*Displaying Arrival Date*/}
                          <div>
                            <p className="text-sm text-slate-500">Arrival</p>

                            <p className="font-semibold text-slate-800">
                              {new Date(flight.arrDate).toLocaleString("en-NZ", {
                                timeZone: getAirportTZ(flight.dest),
                                weekday: "short",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>

                            <p className="font-semibold text-slate-800">
                              {new Date(flight.arrDate).toLocaleString("en-NZ", {
                                timeZone: getAirportTZ(flight.dest),
                                hour: "numeric",
                                minute: "numeric",
                                timeZoneName: "short",
                              })}
                            </p>
                          </div>

                          {/*Price and Available Seats*/}
                          <div>
                            <p className="text-sm text-slate-500">Price</p>

                            <p className="text-2xl font-bold text-sky-600">NZD ${flight.price}</p>

                            {/*Changes text colour depending on if flight is full*/}
                            <p className={`mt-1 text-sm font-medium ${seatsLeft > 0 ? "text-green-600" : "text-red-500"}`}>
                              {seatsLeft > 0 ? `${seatsLeft} seats left` : "Flight full"}
                            </p>
                          </div>

                          {/*Booking Button*/}
                          <div>
                            <button
                              disabled={seatsLeft <= 0}

                              onClick={() => setSelectedFlight(flight)}

                              className={`w-full rounded-xl p-4 font-semibold text-white transition ${
                                seatsLeft > 0 
                                    ? "bg-sky-500 hover:bg-sky-400" 
                                    : "cursor-not-allowed bg-slate-400"}`}>

                              {seatsLeft > 0 ? "Book Flight" : "Flight Full"}

                            </button>
                          </div>

                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </section>
      </main>
  );
}