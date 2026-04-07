def select_cheapest_flight(flights):
    if not flights:
        return None
    
    if len(flights) == 1:
        if flights[0]['seats'] > 0:
            return flights[0]
        else:
            return None
    
    sorted_flights = sorted(flights, key=lambda x: x['price'])
    for flight in sorted_flights:
        if flight['seats'] > 0:
            return flight
    return None