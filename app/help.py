import requests
import os
from dotenv import load_dotenv
load_dotenv()
def get_amadeus_token():
    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    
    data = {
        "grant_type": "client_credentials",
        "client_id": os.getenv("AMADEUS_API_KEY"),
        "client_secret": os.getenv("AMADEUS_API_SECRET")
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    response = requests.post(url, data=data, headers=headers)
    print("Amadeus token response:", response.json())
    return response.json().get("access_token")


def get_airport_code(city, token):

    url = "https://test.api.amadeus.com/v1/reference-data/locations"

    headers = {
        "Authorization": f"Bearer {token}"
    }

    for sub_type in ["AIRPORT", "CITY"]:
        params = {
            "keyword": city,
            "subType": sub_type,
            "page[limit]": 1
        }

        response = requests.get(url, headers=headers, params=params)

        data = response.json()
        print(f"[{sub_type}] '{city}':", data)

        if "data" in data and len(data["data"]) > 0:
            return data["data"][0]["iataCode"]

    return None


EXCHANGE_API_KEY = os.getenv("EXCHANGE_RATE_API_KEY")
def convert_usd_to_inr(amount):

    url = f"https://v6.exchangerate-api.com/v6/{EXCHANGE_API_KEY}/latest/USD"

    response = requests.get(url)

    data = response.json()

    rate = data["conversion_rates"]["INR"]

    return amount * rate