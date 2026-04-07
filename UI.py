import streamlit as st
import requests

st.title("AI Travel Agent ✈️")

user_request = st.text_input(
"Enter your travel request",
placeholder="Book a flight...."
)

if st.button("Book Flight"):


    if user_request:

        response = requests.post(
            "http://127.0.0.1:8000/ai-book-flight",
            params={"request": user_request}
        )

    data = response.json()

    booking = data["booking"]
    flight = data["selected_flight"]
    payment = data["payment"]

    st.success("Flight Booked Successfully ✈️")

    st.write(f"Passenger: {booking['passenger']}")
    st.write(f"Airline: {flight['airline']}")
    st.write(f"Flight: {flight['flight_number']}")
    st.write(f"From: {booking['origin']}")
    st.write(f"To: {booking['destination']}")
    
    st.write(f"PNR: {booking['pnr']}")
    st.write(f"Booking Time: {booking['booking_time']}")
    st.write(f"Amount Paid: ${payment['amount']}")
    st.write(f"Transaction ID: {payment['transaction_id']}")

else:
    st.warning("Please enter a travel request.")

