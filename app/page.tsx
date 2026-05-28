"use client";

import { useState } from "react";
import { Schedule, Passenger } from "@/src/types/db";

//Converting to specific formats and airports
import {formatDate, formatTime} from "@/lib/dateFormatting";
import {airports, getAirportName} from "@/lib/airports";

//Custom-Made React Components
import FlightCard from "@/components/FlightCard";
import BookingCard from "@/components/BookingCard";

export default function Home(){
  //Search parameters for flights
  const [orig, setOrig] = useState("NZNE");
  const [dest, setDest] = useState("NZRO");
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");

  //Flights found by the search
  const [flights, setFlights] = useState<Schedule[]>([]);

  //Stores currently selected flight (for booking purposes)
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

  //Passenger bookings
  const [bookings, setBookings] = useState<Schedule[]>([]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  //Finds all flights with specific parameters
  async function searchFlights(){
    //Prevents searchFlights() from running without a date range
    if((!date1 && !date2) || (!date1 || !date2)){
      alert("Please enter your date selection.");
      setFlights([]);
      return;
    }

    //Prevents end date being before start date in the date range
    if(new Date(date2) < new Date(date1)){
      alert("To Date can not be earlier than From Date.");
      setFlights([]);
      return;
    }

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

  //Finds all bookings belonging to a passenger's ID
  async function fetchBookings(passengerID: string){
    try{
      const response = await fetch(`api/bookings?passengerID=${passengerID}`)

      const data = await response.json();

      if(!response.ok){
        console.error(data.error);
        return;
      }

      setBookings(data);
    } catch(error){
      console.error(error);
    }
  }

  //Allows user to "login" as a previously-existing passenger using the email
  async function handleLogin(){
    try{
      const response = await fetch(`api/passengers?email=${email}`);

      const data = await response.json();

      //Passenger exists
      if(response.ok){
        setLoggedInPassenger(data);
        await fetchBookings(data._id);
        setShowLogin(false);
        return;
      }

      //Passenger not found - Prompts user to create a profile
      const createProfile = confirm("No passenger found with that email. Create a profile?");

      if(!createProfile){
        return;
      }

      //Switching login into passenger creation mode
      setCreatingPassenger(true);

    } catch(error){
      console.error(error);
    }
  }

  //Allows user to create a passenger entry
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
      await fetchBookings(data._id);

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

  //Handles booking for a selected flight
  async function handleBooking(){
    setBookingLoading(true);

    if(!selectedFlight || !loggedInPassenger){
      alert("Please log in first and select a flight.");
      setBookingLoading(false);
      return;
    }

    //Prevents passengers from booking the same flight twice
    const alreadyBooked = selectedFlight.bookings.some(
        (booking) =>
            booking.passengerID.toString() === loggedInPassenger._id?.toString()
    );

    if(alreadyBooked){
      alert("You're already booked on this flight");
      setBookingLoading(false);
      return;
    }

    try{
      //Creates a booking based on scheduled flight and passenger's ID
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

      //To get the notification to show the user the new booking reference
      setBookingRef(data.bookingRef);
      setBookingConfirmed(true);

      //Updates searched flights and bookings
      await searchFlights();

      await fetchBookings(loggedInPassenger._id!.toString());
    } catch (error){
      console.error(error);
    } finally{
      setBookingLoading(false);
    }
  }

  //Deletes a booking
  async function handleDeleteBooking(scheduleID: string){
    if(!loggedInPassenger){return;}

    //Requires confirmation before deleting
    const confirmDelete = confirm("Are you sure you want to delete this booking?");

    if (!confirmDelete){
      return;
    }

    try{
      const response = await fetch("api/bookings",
          {
            method: "DELETE",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              scheduleID,
              passengerID: loggedInPassenger._id,
            }),
          });

      const data = await response.json();

      if(!response.ok){
        alert(data.error);
        return;
      }

      //Refresh bookings and flights
      await searchFlights();
      await fetchBookings(loggedInPassenger._id!.toString());
    } catch(error){
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

        {/*Banner*/}
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/90 backdrop-blur">
          <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3">

            <div className="text-xl font-bold text-white">JT Airlines</div>

            {/*Login Button*/}
            {loggedInPassenger ? (
                //If logged in, when button is clicked, it checks if user wants to log out
                <button
                    onClick={() => {
                      const logOut = confirm("Do you want to log out?");

                      if(!logOut){
                        return;
                      }

                      //Clears the logged in passenger, allowing user to log in with a different email if they wish
                      setLoggedInPassenger(null);
                    }}
                    className="cursor-pointer rounded-2xl bg-white px-5 py-2 font-semibold text-slate-800 shadow transition hover:bg-slate-100">
                  <p>{loggedInPassenger.firstName} {loggedInPassenger.surname}</p>
                </button>
            ) : (
                <button
                    onClick={() => setShowLogin(true)}
                    className="cursor-pointer rounded-2xl bg-white px-5 py-2 font-semibold text-slate-800 shadow transition hover:bg-slate-100">
                  Login
                </button>
            )}
          </div>
        </div>

        {/*Hero Section*/}
        {/*Background image found free-to-use on Unsplash*/}
        <section
            className="relative mt-12 h-[50vh] bg-cover bg-center"
            style={{
              backgroundImage:
                  "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')"
        }}>
          <div className="absolute inset-0 bg-black/60"/>

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-white">
            <h1 className="mb-6 font-serif text-center text-5xl font-bold md:text-6xl">JT Airlines</h1>

            <p className="mb-10 font-serif italic text-center text-lg text-slate-200">Book premium flights from Dairy Flat to select destinations across New Zealand, Chatham Islands, and Australia</p>

            {/*FLIGHT SEARCH BOX*/}
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
                      className="cursor-pointer w-full rounded-xl border border-slate-300 p-3">
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
                      className="cursor-pointer w-full rounded-xl border border-slate-300 p-3"
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
                      className="cursor-pointer w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                {/* Date 2 */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">To Date</label>

                  <input
                      type="date"
                      value={date2}
                      onChange={(e) => setDate2(e.target.value)}
                      className="cursor-pointer w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                {/*Search Flights Button*/}
                <div className="flex items-end">
                  <button
                      disabled={loading}
                      onClick={searchFlights}
                      className="cursor-pointer w-full rounded-xl bg-sky-500 p-3 font-semibold text-white transition hover:bg-sky-400">
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
                <p className="text-lg text-slate-500">No flights available for this route in the selected date range.</p>
              </div>
          ) : (
              //Displays this if there were flights found
              <div className= "grid gap-6">
                {flights.map((flight) => (
                    //Made into a React component to make it easier to edit
                    <FlightCard
                        key = {flight._id.toString()}
                        flight= {flight}
                        loggedInPassenger= {loggedInPassenger}
                        onSelectAction= {setSelectedFlight}/>
                ))}
              </div>
          )}
        </section>

        {/* Passenger Bookings */}
        {loggedInPassenger && (
            <section className="mx-auto max-w-7xl px-6 pb-16">

              <div className="mb-8 flex items-center justify-between">

                <h2 className="text-3xl font-bold text-slate-800">My Bookings</h2>

                <span className="text-slate-500">{bookings.length} bookings</span>

              </div>

              {/*Booking Cards*/}
              {bookings.length === 0 ? (
                  <div className="rounded-2xl bg-white p-10 text-center shadow">
                    <p className="text-slate-500">No bookings found</p>
                  </div>
              ) : (
                  <div className="grid gap-6">
                    {bookings.map((flight) => (
                        <BookingCard
                            key = {flight._id.toString()}
                            flight= {flight}
                            loggedInPassenger= {loggedInPassenger}
                            onCancelAction={handleDeleteBooking}
                        />
                    ))}
                  </div>
              )}
            </section>
        )}

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

                      {/*Getting form data*/}
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
                            className="cursor-pointer w-2/5 rounded-xl bg-sky-500 px-4 py-3 font-semibold text-white hover:bg-sky-400"
                        >
                          Create Profile
                        </button>

                        <button
                            onClick={() => {setCreatingPassenger(false); setShowLogin(false)}}
                            className="cursor-pointer w-2/5 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-400"
                        >
                          Cancel
                        </button>

                      </div>
                    </div>
                )}

                {!creatingPassenger && (
                    <div className="flex justify-center gap-3">

                      <button onClick={handleLogin} className="cursor-pointer rounded-xl bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-400">
                        Login
                      </button>

                      <button
                          onClick={() => setShowLogin(false)}
                          className="cursor-pointer rounded-xl bg-red-500 text-white px-4 py-2 font-semibold">
                        Cancel
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

                {/*Invoice/Booking Details Display*/}
                {!bookingConfirmed ? (
                    <div>
                      <h2 className="text-3xl font-bold text-slate-800">Book Flight</h2>

                      <div className="mb-6 flex items-center justify-center">
                        <div className="rounded-2xl border border-slate-200 p-6">

                          <h3 className="mb-4 text-xl font-bold text-slate-800">Passenger</h3>

                          <div className="space-y-1">
                            <p>
                              {loggedInPassenger?.title}{" "}
                              {loggedInPassenger?.firstName}{" "}
                              {loggedInPassenger?.surname}
                            </p>

                            <p className="text-slate-500">{loggedInPassenger?.email}</p>
                          </div>

                          <hr className="my-6"/>

                          <h3 className="mb-4 text-xl font-bold text-slate-800">Flight Details</h3>

                          <div className="space-y-2">

                            <p>
                              <span className="font-semibold">Flight:</span>
                              {" "}
                              {selectedFlight.flightNo}
                            </p>

                            <p>
                              <span className="font-semibold">Aircraft:</span>
                              {" "}
                              {selectedFlight.planeType}
                            </p>

                            <p>
                              <span className="font-semibold">Route:</span>
                              {" "}
                              {getAirportName(selectedFlight.origin)}
                              {" → "}
                              {getAirportName(selectedFlight.dest)}
                            </p>

                            <p>
                              <span className="font-semibold">Departure:</span>
                              {" "}
                              {formatDate(selectedFlight.depDate, selectedFlight.origin)}
                              {" at "}
                              {formatTime(selectedFlight.depDate, selectedFlight.origin)}
                            </p>

                            <p>
                              <span className="font-semibold">Arrival:</span>
                              {" "}
                              {formatDate(selectedFlight.arrDate, selectedFlight.dest)}
                              {" at "}
                              {formatTime(selectedFlight.arrDate, selectedFlight.dest)}
                            </p>

                            <p>
                              <span className="font-semibold">Duration:</span>
                              {" "}
                              {selectedFlight.duration}
                            </p>

                          </div>

                          <hr className="my-6"/>

                          <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold">Total Price</p>

                            <p className="text-3xl font-bold text-sky-600">NZD ${selectedFlight.price}</p>
                          </div>

                        </div>
                      </div>

                      <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                            disabled={bookingLoading}   //Prevents double-clicking
                            onClick={handleBooking}
                            className="cursor-pointer rounded-xl bg-sky-500 px-8 py-4 font-semibold text-white transition hover:bg-sky-400"
                        >
                          {bookingLoading ? "Booking..." : "Confirm Booking"}
                        </button>

                        <button
                            onClick={() => setSelectedFlight(null)}
                            className="cursor-pointer rounded-xl bg-red-500 px-8 py-4 font-semibold text-white transition hover:bg-red-400"
                        >
                          Cancel
                        </button>
                      </div>

                    </div>
                ) : (
                    // Confirmation with booking reference
                    <div className="flex flex-col items-center justify-center text-center py-8">
                      <h2 className="mb-3 text-4xl font-bold text-slate-800">Booking Confirmed</h2>

                      <p className="mb-4 text-slate-500">Your flight has been successfully booked.</p>

                      <div className="p-4">
                        <p className="mb-1 text-sm text-slate-500">Booking Reference</p>

                        <p className="text-3xl font-bold text-sky-600">{bookingRef}</p>
                      </div>

                      <button
                          onClick={() => {
                            setBookingConfirmed(false);
                            setBookingRef("");
                            setSelectedFlight(null);
                          }}
                          className="cursor-pointer mt-8 rounded-xl bg-sky-500 px-8 py-4 font-semibold text-white transition hover:bg-sky-400"
                      >
                        Done
                      </button>
                    </div>
                )}

              </div>
            </div>
        )}
      </main>
  );
}