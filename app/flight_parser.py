from app.help import convert_usd_to_inr, get_amadeus_token,get_airport_code
import requests
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
FLIGHTAPI_KEY = os.getenv("FLIGHTAPIKEY")
def search_flights(origin, destination, date):

    token = get_amadeus_token()

    # # Convert city names → airport codes
    
    origin_code = get_airport_code(origin,token)
    destination_code = get_airport_code(destination,token)

    print("Converted:", origin_code, destination_code)
    
    if not origin_code or not destination_code:
        print(f"Airport code resolution failed: {origin} → {origin_code}, {destination} → {destination_code}")
        return []
    
    
    

    url = "https://test.api.amadeus.com/v2/shopping/flight-offers"

    headers = {
        "Authorization": f"Bearer {token}"
    }

    params = {
        "originLocationCode": origin_code,
        "destinationLocationCode": destination_code,
        "departureDate": date,
        "adults": 1,
        "max": 3
    }

    response = requests.get(url, headers=headers, params=params)

    data = response.json()

    flights = []

    if "data" not in data:
        print("API ERROR:", data)
        return flights

    for offer in data["data"]:
        itinerary = offer["itineraries"][0]
        segment = itinerary["segments"][0]
        price_usd = float(offer["price"]["total"])
        price_inr = convert_usd_to_inr(price_usd)
        departure_time = segment["departure"]["at"]
        arrival_time = segment["arrival"]["at"]
        duration = itinerary["duration"]
        
        dep_time=dep_time = datetime.fromisoformat(departure_time).strftime("%H:%M")
        arr_time = datetime.fromisoformat(arrival_time).strftime("%H:%M")
        flights.append({
            "airline": offer["validatingAirlineCodes"][0],
            "flight_number": offer["itineraries"][0]["segments"][0]["number"],
            "departure":dep_time,
            "arrival":arr_time,
            "duration":duration,
            "price": round(price_inr, 2),
            "seats": 5
        })

    return flights


    

    