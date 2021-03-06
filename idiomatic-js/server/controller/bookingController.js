'use strict';
let bookings = require('../../data_dump/bookings.json');

let projectionService = require('../service/projectionService');

const ticketTypeToDiscountMap = {"normal": 0, "student": 0.15, "group": 0.20, "senior": 0.1};

const MIN_GROUP_SIZE_FOR_DISCOUNT = 10;
const TICKET_DETAILS_KEY = "ticket_details";
const PROJECTION_ID_KEY = "projection_id";

//todo: ex. for modification task - return projections with datetime sort order
exports.get_all_projections = function (req, res) {
    return {}
};

exports.get_all_bookings = function (req, res) {
    return {}
};

exports.book = function (req, res) { //todo: make 'book' return hash of booking (id)
    let bookingDetails = req.body;
    let ticketQuantity = countTicketQuantity(bookingDetails[TICKET_DETAILS_KEY]);
    let response = void 0; //IDIOM
    let proj = projectionService.getProjectionById(bookingDetails[PROJECTION_ID_KEY]);
    if (areVacantSeatsAvailable(proj, ticketQuantity)) {
        response = bookSeats(bookingDetails);
    }
    else {
        throw Error("Could not book - too few seats available");
    }
    return res.json(response);
};

exports.get_booking_by_id = function (req, res) {
    let bookingIdentifier = ~~req.params["bookingId"]; //IDIOM2 (konwersja)
    let foundBooking = getBooking(bookingIdentifier);
    return res.json(foundBooking);
};

exports.projections_from = function (req, res) {
    let bookAfterDatetime = req.body;
    let proj = getProjectionsWithFreeSeats(bookAfterDatetime["datetime"]);
    console.log("Matching projections: " + proj);
    return res.json(proj);
};

exports.checkFreeSeats = function (req, res) {
    let projId = +req.params["projectionId"]; //IDIOM
    let bookedSeatsQuantity = getBookedSeatsQuantity(projId);
    let allSeats = projectionService.getPlaceNumberForProjection(projId);
    let available = allSeats - bookedSeatsQuantity;
    console.log("All seats: " + allSeats + " booked: " + bookedSeatsQuantity + "Available seats: " + available);
    return res.json(available > 0 ? available : 0);


};

function getProjectionsWithFreeSeats(datetime, howMany) {
    let projectionsWithPredicate = [];
    let projectionsAfterDatetime = projectionService.getProjectionsStartingFrom(datetime);
    for (var i = 0, projection; projection = projectionsAfterDatetime[i]; i++) {
        areVacantSeatsAvailable(projection, howMany) && projectionsWithPredicate.push(projection); //IDIOM projectionsWithPredicate[projectionsWithPredicate.length] = projection
    }
    return projectionsWithPredicate;
}

function areVacantSeatsAvailable(projection, seatQuantityToBook) {
    let bookedSeatsQuantity = getBookedSeatsQuantity(projection.projection_id);
    return projection.seats >= bookedSeatsQuantity + seatQuantityToBook
}

function bookSeats(bookingRequest) {
    console.log("Booking seats.");
    var totalTicketCost = calculateTotalPrice(bookingRequest[TICKET_DETAILS_KEY], 20);
    return {"booking_id": 1234, "total_price": totalTicketCost};

}

function getBookedSeatsQuantity(projectionId) {
    let bookingsForProjection = bookings.filter((booking) => booking.projection_id === projectionId);
    console.log("Bookings for projection: " + bookingsForProjection.length);
    return bookingsForProjection.length ? countBookedPlaces(bookingsForProjection) : 0;
}

function countBookedPlaces(bookingsForProjection) {
    let seatsNumber;
    for (var i = 0, booking; booking = bookingsForProjection[i]; i++) {
        var places = countTicketQuantity(booking[TICKET_DETAILS_KEY]);
        seatsNumber + places || (seatsNumber = 0); //seatsNumber = seatsNumber + places;
        console.log(" Places for booking: " + booking[PROJECTION_ID_KEY] + " places: " + places + " seats number: " + seatsNumber);
    }
    return seatsNumber;

}

function calculateTotalPrice(ticketDetails, normalTicketPrice) {
    let totalCost = 0.0;
    let totalNumOfTickets = void 0; //IDIOM
    if (totalNumOfTickets = countTicketQuantity(ticketDetails)) {
        if (totalNumOfTickets >= MIN_GROUP_SIZE_FOR_DISCOUNT) {
            totalCost = normalTicketPrice * (1.0 - ticketTypeToDiscountMap["group"]) * totalNumOfTickets;
        }
        else {
            for (let [discountName, numOfTickets] of Object.entries(ticketDetails)) {
                let ticketsPrice = normalTicketPrice * (1.0 - ticketTypeToDiscountMap[discountName]) * numOfTickets;
                totalCost = totalCost + ticketsPrice;
            }
        }
    }
    else {
        throw Error("There must be at least 1 ticket on resevation!");
    }
    return totalCost;
}

function countTicketQuantity(ticketDetails) {
    return Object.entries(ticketDetails).reduce(function (suma, ticket_type_entry) {
        const [discount_type, quantity] = ticket_type_entry;
        return suma + quantity;
    }, 0);
}


function calcTicketsPrice(ticketDetails, normalTicketPrice) {
    return Object.entries(ticketDetails).reduce(function (totalCost, ticket_type_entry) {
        const [discount_type, quantity] = ticket_type_entry;
        return totalCost + (quantity * (1.0 - ticketTypeToDiscountMap[discount_type]));
    }, 0);
}

function getBooking(bookingId) {
    let matchingBookings = bookings.filter((booking) => booking.booking_id === bookingId);
    return matchingBookings.length && matchingBookings[0]; //IDIOM
}


function calcTotalPriceIdiom(ticketDetails, normalTicketPrice) {
    let totalCost;
    if (totalCost = calcTicketsPrice(ticketDetails, normalTicketPrice) && countTicketQuantity(ticketDetails) >= MIN_GROUP_SIZE_FOR_DISCOUNT) { //IDIOM
        //todo: add discount for group
    }
    return totalCost || 0;
}