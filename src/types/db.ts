import {ObjectId} from "mongodb";

export interface Booking{
    bookingRef: string;
    passengerID: ObjectId;

    title: string;
    firstName: string;
    surname: string;

    email: string;
    bookedAt: Date;
}

export interface Schedule {
    _id: ObjectId;

    flightNo: string,
    origin: string;
    dest: string;

    depDate: Date;
    arrDate: Date;

    duration: string;

    price: number;
    seats: number;

    bookings: Booking[];
}

export interface Passenger{
    _id?: ObjectId;

    title: string;
    firstName: string;
    surname: string;

    email: string;
    gender: string;
}