import requests
import os
from dotenv import load_dotenv
load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# CITY_TO_IATA = {
#     "delhi": "DEL",
#     "mumbai": "BOM",
#     "london": "LON",
#     "chennai": "MAA",
#     "bangalore": "BLR",
#     "bengaluru": "BLR",
#     "kolkata": "CCU",
#     "hyderabad": "HYD"
# }
# def get_amadeus_token():
#     url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    
#     data = {
#         "grant_type": "client_credentials",
#         "client_id": os.getenv("AMADEUS_API_KEY"),
#         "client_secret": os.getenv("AMADEUS_API_SECRET")
#     }
#     headers = {
#         "Content-Type": "application/x-www-form-urlencoded"
#     }
    
#     response = requests.post(url, data=data, headers=headers)
#     print("Amadeus token response:", response.json())
#     return response.json().get("access_token")


# def get_airport_code(city, token):

#     url = "https://test.api.amadeus.com/v1/reference-data/locations"

#     headers = {
#         "Authorization": f"Bearer {token}"
#     }

#     params = {
#         "keyword": city,
#         "subType": "CITY,AIRPORT",   # 🔥 FIX
#         "page[limit]": 3
#     }

#     response = requests.get(url, headers=headers, params=params)

#     data = response.json()
    
#     print(f"[COMBINED] '{city}':", data)

#     if "data" in data and len(data["data"]) > 0:
#         return data["data"][0]["iataCode"]

#     return None
HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com"
}

# def get_airport_code(city, token):
#     city_lower = city.lower().strip()

#     # 🔥 STEP 1: Fallback mapping (handles 90% cases reliably)
#     if city_lower in CITY_TO_IATA:
#         print(f"[FALLBACK] {city} → {CITY_TO_IATA[city_lower]}")
#         return CITY_TO_IATA[city_lower]

#     # 🔥 STEP 2: API Call
#     url = "https://test.api.amadeus.com/v1/reference-data/locations"

#     headers = {
#         "Authorization": f"Bearer {token}"
#     }

#     params = {
#         "keyword": city,
#         "subType": "CITY,AIRPORT",   # ✅ FIXED
#         "page[limit]": 5
#     }

#     response = requests.get(url, headers=headers, params=params)

#     # 🔴 Handle API failure
#     if response.status_code != 200:
#         print(f"[API ERROR] {city}: {response.status_code} → {response.text}")
#         return None

#     try:
#         data = response.json()
#     except Exception:
#         print("Invalid JSON response:", response.text)
#         return None

#     print(f"[API SUCCESS] '{city}':", data)

#     if "data" not in data or len(data["data"]) == 0:
#         return None

#     # 🔥 STEP 3: Prefer AIRPORT over CITY
#     for item in data["data"]:
#         if item.get("subType") == "AIRPORT":
#             print(f"[SELECTED AIRPORT] {item['name']} → {item['iataCode']}")
#             return item["iataCode"]

#     # 🔁 Fallback to first result
#     print(f"[SELECTED FIRST RESULT] → {data['data'][0]['iataCode']}")
#     return data["data"][0]["iataCode"]

airport_cache = {}

def get_airport_code(city, token=None):
    city_lower = city.lower()

    # Return from cache if already resolved
    if city_lower in airport_cache:
        print(f"[CACHE] {city} → {airport_cache[city_lower]}")
        return airport_cache[city_lower]

    try:
        response = requests.get(
            "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport",
            headers=HEADERS,
            params={"query": city, "locale": "en-US"},
            timeout=10
        )
        data = response.json()
        print(f"Airport search for '{city}':", data)

        places = data.get("data", [])
        if places and len(places) > 0:
            code = places[0]["skyId"]
            airport_cache[city_lower] = code
            print(f"[RAPIDAPI] Resolved '{city}' → {code}")
            return code

    except Exception as e:
        print(f"RapidAPI airport search error for '{city}': {e}")

    print(f"Could not resolve airport code for: '{city}'")
    return None



EXCHANGE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY")
def convert_usd_to_inr(amount):

    url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_API_KEY}/latest/USD"

    response = requests.get(url)

    data = response.json()

    rate = data["conversion_rates"]["INR"]

    return amount * rate