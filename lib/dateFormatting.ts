import {getAirportTZ} from "@/lib/airports";

//Formatting date and time depending on location
export function formatDate(d: Date, code: string) {
    const date = new Date(d);

    return new Intl.DateTimeFormat("en-NZ", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: getAirportTZ(code),
    }).format(date);
}

export function formatTime(d: Date, code: string) {
    const date = new Date(d);

    return new Intl.DateTimeFormat("en-NZ", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: getAirportTZ(code),
        timeZoneName: "short",
    }).format(date)
}