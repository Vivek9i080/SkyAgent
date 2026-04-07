from app.flight_parser import search_flights
from app.cheapest_flight import select_cheapest_flight
from app.booking_engine import create_booking
from app.payment import process_payment
import uuid
import random
def run_agent(origin, destination, date, passenger,mode="search",selected_flight=None):
    flights = search_flights(origin, destination, date)
    # cheapest_flight = select_cheapest_flight(flights)
    
    if not flights:
        return {"message":"No available flights found."}
    
    # booking = create_booking(cheapest_flight, passenger, origin, destination, date)
    # payment_result = process_payment(cheapest_flight['price'])
    
    # if payment_result['status'] == "SUCCESS":
    #     return {
    #         "selected_flight": cheapest_flight,
    #         "booking": booking,
    #         "payment": payment_result
    #     }
    # else:
    #     return "Payment failed."
    if mode=="search":
        return flights
    if mode =="book":
        if not selected_flight:
            flights = search_flights(origin, destination, date)

            if not flights:
                return {"message": "No flights available"}

        # pick cheapest with seats
            available = [f for f in flights if f["seats"] > 0]

            if not available:
                return {"message": "No seats available"}

            selected_flight = sorted(available, key=lambda x: x["price"])[0]
        return {
            "selected_flights":selected_flight,
            "booking":create_booking(
                selected_flight,
                passenger,
                origin,
                destination,
                date
            ),
            "payment":{
                "amount":selected_flight["price"],
                "transaction_id":"TXN" + str(random.randint(100000,999999))
            }
            
        }