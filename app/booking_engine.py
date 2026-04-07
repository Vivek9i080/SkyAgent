import random
import string
from datetime import datetime
def create_booking(flight,passenger,origin,destination,travel_date):
    pnr= ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    if not flight:
        return {"message": "No flight available for booking."}
    return {
        "pnr": pnr,
        "flight": flight["flight_number"],
        "passenger": passenger,
        "airline": flight["airline"],
        "origin": origin,
        "destination": destination,
        "travel_date": travel_date,
        "booking_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "CONFIRMED"
    }