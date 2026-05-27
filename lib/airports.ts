export const airports = [
    {code: "NZNE", name: "Dairy Flat", tz: "Pacific/Auckland"},
    {code: "NZRO", name: "Rotorua", tz: "Pacific/Auckland"},
    {code: "NZGB", name: "Claris", tz: "Pacific/Auckland"},
    {code: "NZTL", name: "Lake Tekapo", tz: "Pacific/Auckland"},
    {code: "NZCI", name: "Tuuta", tz: "Pacific/Chatham"},
    {code: "YSSY", name: "Sydney", tz: "Australia/Sydney"},
]

export function getAirportTZ(code: string) {
    return airports.find((airport) => airport.code === code)?.tz;
}

export function getAirportName(code: string) {
    return airports.find((airport) => airport.code === code)?.name;
}