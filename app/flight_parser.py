from app.help import convert_usd_to_inr, get_airport_code
import requests
import os
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

def search_flights(origin, destination, date):

    # token = get_amadeus_token()

    # Convert city names → airport codes
    origin_code = get_airport_code(origin)
    destination_code = get_airport_code(destination)

    print("Converted:", origin_code, destination_code)
    
    if not origin_code or not destination_code:
        print(f"Airport code resolution failed: {origin} → {origin_code}, {destination} → {destination_code}")
        return []
    
    try:
        
        response = requests.get(
            
            "https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights",
            headers={
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com"
            },
            params={
                "originSkyId": origin_code,
                "destinationSkyId": destination_code,
                "originEntityId": origin_code,
                "destinationEntityId": destination_code,
                "date": date,
                "adults": "1",
                "currency": "USD",
                "market": "IN",
                "countryCode": "IN",
                "cabinClass": "economy"
            },
            timeout=15
        )
        data = response.json()
    except Exception as e:
        print(f"RapidAPI flight search error: {e}")
        return []

    print("RapidAPI response:", data)

    itineraries = data.get("data", {}).get("itineraries", [])

    if not itineraries:
        print("No itineraries found:", data)
        return []

    flights = []
    for offer in itineraries[:3]:
        try:
            price_usd = float(offer["price"]["raw"])
            price_inr = convert_usd_to_inr(price_usd)

            leg = offer["legs"][0]
            dep_time = datetime.fromisoformat(
                leg["departure"].replace("Z", "")
            ).strftime("%H:%M")
            arr_time = datetime.fromisoformat(
                leg["arrival"].replace("Z", "")
            ).strftime("%H:%M")

            duration_mins = leg["durationInMinutes"]
            hours = duration_mins // 60
            mins = duration_mins % 60
            duration = f"PT{hours}H{mins}M"

            carrier = leg["carriers"]["marketing"][0]
            airline = carrier["name"]
            flight_number = str(carrier.get("alternateId", "N/A"))

            flights.append({
                "airline": airline,
                "flight_number": flight_number,
                "departure": dep_time,
                "arrival": arr_time,
                "duration": duration,
                "price": round(price_inr, 2),
                "seats": 5
            })
        except Exception as e:
            print(f"Error parsing offer: {e}")
            continue

    return flights
    

    # url = "https://test.api.amadeus.com/v2/shopping/flight-offers"

    # headers = {
    #     "Authorization": f"Bearer {token}"
    # }

    # params = {
    #     "originLocationCode": origin_code,
    #     "destinationLocationCode": destination_code,
    #     "departureDate": date,
    #     "adults": 1,
    #     "max": 3
    # }

    # response = requests.get(url, headers=headers, params=params)

    # data = response.json()

    # flights = []

    # if "data" not in data:
    #     print("API ERROR:", data)
    #     return flights

    # for offer in data["data"]:
    #     itinerary = offer["itineraries"][0]
    #     segment = itinerary["segments"][0]
    #     price_usd = float(offer["price"]["total"])
    #     price_inr = convert_usd_to_inr(price_usd)
    #     departure_time = segment["departure"]["at"]
    #     arrival_time = segment["arrival"]["at"]
    #     duration = itinerary["duration"]
        
    #     dep_time=dep_time = datetime.fromisoformat(departure_time).strftime("%H:%M")
    #     arr_time = datetime.fromisoformat(arrival_time).strftime("%H:%M")
    #     flights.append({
    #         "airline": offer["validatingAirlineCodes"][0],
    #         "flight_number": offer["itineraries"][0]["segments"][0]["number"],
    #         "departure":dep_time,
    #         "arrival":arr_time,
    #         "duration":duration,
    #         "price": round(price_inr, 2),
    #         "seats": 5
    #     })

    # return flights
