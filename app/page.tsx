"use client";

import { useState } from "react";
import { Schedule, Passenger } from "@/src/types/db";

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

function getAirportName(code: string) {
  return airports.find((airport) => airport.code === code)?.name;
}

function formatDate(d: Date, code: string) {
  const date = new Date(d);

  return new Intl.DateTimeFormat("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: getAirportTZ(code),
  }).format(date);
}

function formatTime(d: Date, code: string) {
  const date = new Date(d);
  
  return new Intl.DateTimeFormat("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: getAirportTZ(code),
    timeZoneName: "short",
  }).format(date)
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

  //To see when data is loading
  const [loading, setLoading] = useState(false);

  //Logging in
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [loggedInPassenger, setLoggedInPassenger] = useState<Passenger | null>(null);
  const [creatingPassenger, setCreatingPassenger] = useState(false);

  const [formData, setFormData] = useState({
    title: "Mr",
    firstName: "",
    surname: "",
    email: "",
  });

  async function searchFlights(){
    try{
      setLoading(true);

      //Search for flights based on origin airport, destination airport, and during a range of dates
      const response = await fetch(`api/schedules?orig=${orig}&dest=${dest}&date1=${date1}&date2=${date2}`);

      const data = await response.json();

      setFlights(data);
    } catch (error){
      console.error(error);
    } finally{
      setLoading(false);
    }
  }

  async function handleLogin(){
    try{
      const response = await fetch(`api/passengers?email=${email}`);

      const data = await response.json();

      //Passenger exists
      if(response.ok){
        setLoggedInPassenger(data);
        setShowLogin(false);
        return;
      }

      //Passenger not found - Prompts user to create a profile
      const createProfile = confirm("No passenger found with that email. Create a profile?");

      if(!createProfile){
        return;
      }

      setCreatingPassenger(true);

    } catch(error){
      console.error(error);
    }
  }

  async function handleCreatePassenger(){
    try{
      const response = await fetch("api/passengers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if(!response.ok){
        alert(data.error);
        return;
      }

      setLoggedInPassenger(data);

      setCreatingPassenger(false);
      setShowLogin(false);

      //Resetting form data
      setFormData({
        title: "Mr",
        firstName: "",
        surname: "",
        email: "",
      })

    } catch (error){
      console.error(error);
    }
  }

  async function handleBooking(){
    if(!selectedFlight || !loggedInPassenger){
      alert("Please log in first.");
      return;
    }

    try{
      const response = await fetch ("api/bookings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scheduleID: selectedFlight._id,
              passengerID: loggedInPassenger._id,
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

  //Makes it so if origin isn't Dairy Flat, destination can only be Dairy Flat
  //Also ensures flights from Dairy Flat can't be selected to go to Dairy Flat
  const destinationOptions =
      (orig === "NZNE")
          ? airports.filter((airport) => airport.code !== "NZNE")
          : airports.filter((airport) => airport.code === "NZNE");

  return(
      <main className="min-h-screen bg-slate-100">

        {/*Top Banner*/}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3">

            <div className="text-xl font-bold text-white">JT Airlines</div>

            {/*Login Button*/}
            {loggedInPassenger ? (
                <div className="rounded-xl bg-white px-5 py-2 text-sm font-semibold text-slate-800 shadow">
                  <p>{loggedInPassenger.firstName} {loggedInPassenger.surname}</p>
                </div>
            ) : (
                <button
                    onClick={() => setShowLogin(true)}
                    className="rounded-2xl bg-white px-5 py-2 font-semibold text-slate-800 shadow transition hover:bg-slate-100">
                  Login
                </button>
            )}
          </div>
        </div>

        <section className="relative mt-12 h-[50vh] bg-cover bg-center">
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
                      onChange={(e) => {
                        const newOrig = e.target.value;

                        setOrig(newOrig);

                        if(newOrig === "NZNE"){
                          if(dest === "NZNE"){
                            setDest("NZRO");
                          }
                        } else{
                          setDest("NZNE");
                        }

                  }}
                      className="w-full rounded-xl border border-slate-300 p-3">
                    {
                      airports.map((airport) => (
                          <option
                              key={airport.code}
                              value={airport.code}
                          >
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
                    {destinationOptions.map((airport) => (
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
                    {/*Changes to searching if loading*/}
                    {loading ? "Searching" : "Search Flights"}
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
                              {formatDate(flight.depDate, flight.origin)}
                            </p>

                            <p className="font-semibold text-slate-800">
                              {formatTime(flight.depDate, flight.origin)}
                            </p>
                          </div>

                          {/*Displaying Arrival Date*/}
                          <div>
                            <p className="text-sm text-slate-500">Arrival</p>

                            <p className="font-semibold text-slate-800">
                              {formatDate(flight.arrDate, flight.dest)}
                            </p>

                            <p className="font-semibold text-slate-800">
                              {formatTime(flight.arrDate, flight.dest)}
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
                              disabled={seatsLeft <= 0 || !loggedInPassenger}

                              onClick={() => setSelectedFlight(flight)}

                              className={`w-full rounded-xl p-4 font-semibold text-white transition ${
                                seatsLeft <= 0 
                                    ? "cursor-not-allowed bg-slate-400"
                                    : !loggedInPassenger 
                                        ? "cursor-not-allowed bg-slate-300"
                                        : "bg-sky-500 hover:bg-sky-400"}`}>

                              {seatsLeft <= 0
                                  ? "Flight Full"
                                  : !loggedInPassenger
                                      ? "Login to Book"
                                      : "Book Flight"}


                            </button>
                          </div>

                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </section>

        {/*Logging In*/}
        {showLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h2 className="mb-4 text-2xl font-bold text-slate-800">Login</h2>

                <input
                    type = "email"
                    placeholder= "Enter your email"
                    value={email}
                    onChange={(e) => {setEmail(e.target.value); setFormData({...formData, email: e.target.value})}}
                    className="mb-4 w-full rounded-xl border border-slate-300 p-3"/>

                {creatingPassenger &&(
                    <div className="mb-6 space-y-4">
                      <select
                          value = {formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="w-full rounded-xl border border-slate-300 p-3"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Miss">Miss</option>
                        <option value="Ms">Ms</option>
                      </select>

                      <input
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full rounded-xl border border-slate-300 p-3"/>

                      <input
                          type="text"
                          placeholder="Surname"
                          value={formData.surname}
                          onChange={(e) => setFormData({...formData, surname: e.target.value})}
                          className="w-full rounded-xl border border-slate-300 p-3"/>

                      <div className="flex justify-center gap-3">

                        <button
                            onClick={handleCreatePassenger}
                            className="w-2/5 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400"
                        >
                          Create Profile
                        </button>

                        <button
                            onClick={() => {setCreatingPassenger(false); setShowLogin(false)}}
                            className="w-2/5 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-400"
                        >
                          Cancel
                        </button>

                      </div>
                    </div>
                )}

                {!creatingPassenger && (
                    <div className="flex justify-end gap-3">
                      <button
                          onClick={() => setShowLogin(false)}
                          className="rounded-xl bg-slate-200 px-4 py-2 font-semibold">
                        Cancel
                      </button>

                      <button onClick={handleLogin} className="rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400">
                        Continue
                      </button>
                    </div>
                )}
              </div>
            </div>
        )}

        {/*Booking*/}
        {selectedFlight && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">Book Flight</h2>

                    <p className="mt-1 text-slate-500">
                      {selectedFlight.flightNo} •{" "}
                      {getAirportName(selectedFlight.origin)} →{" "}
                      {getAirportName(selectedFlight.dest)}
                    </p>

                    <p className="mt-1 text-slate-500">
                      {"Plane Type: "} {selectedFlight.planeType}
                    </p>
                  </div>

                  <button
                      onClick={() => setSelectedFlight(null)}
                      className="text-2xl text-slate-400 hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Total Price
                    </p>

                    <p className="text-3xl font-bold text-sky-600">
                      NZD ${selectedFlight.price}
                    </p>
                  </div>

                  <button
                      onClick={handleBooking}
                      className="rounded-xl bg-sky-500 px-8 py-4 font-semibold text-white transition hover:bg-sky-400"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
        )}
      </main>
  );
}