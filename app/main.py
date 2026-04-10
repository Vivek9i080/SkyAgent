from fastapi import FastAPI
from pydantic import BaseModel
from app.ai_parser import parse_travel_response
from app.agent import run_agent
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
load_dotenv()

app = FastAPI()
last_flights=[]
last_search={}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://sky-agent-gshb.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FlightRequest(BaseModel):
    request: str


@app.post("/ai-book-flight")
# def ai_book_flight(data: FlightRequest):
#     parsed = parse_travel_response(data.request)

#     result = run_agent(
#         parsed["origin"],
#         parsed["destination"],
#         parsed["date"],
#         parsed["passenger"]
#     )

#     return result
def ai_book_flight(data: FlightRequest):
    global last_flights,last_search
    parsed = parse_travel_response(data.request)
    
    # 🔍 SEARCH flights only (no booking yet)

    if parsed.get("intent")=="search":
        flights = run_agent(
            parsed["origin"],
            parsed["destination"],
            parsed["date"],
            parsed["passenger"],
            mode="search"
            
        
        )
        if not flights:
            return {"message": "No flights available"}
        flights=sorted(flights,key=lambda x:x["price"],reverse=True)
    
        last_flights=flights
        last_search = parsed
    
        return {
            "message": "Select a flight by number",
            "flights":flights
        }
    elif parsed.get("intent")=="book":
        result = run_agent(
            parsed["origin"],
            parsed["destination"],
            parsed["date"],
            parsed["passenger"],
            mode="book"
        )
        return result
    return {"error":"Invalid intent"}
##Book selected flight
@app.post("/book-flight/{index}")
async def book_flight(index: int,request:Request):

    global last_flights, last_search
    if not last_flights:
        return {"error": "No search performed yet"}
    if index<0 or index >= len(last_flights):
        return {"error": "Invalid selection"}
    body = await request.json()
    passenger_name = body.get("passenger") or last_search["passenger"] 

    selected_flight = last_flights[index]
    
    # ✈️ Now booking happens
    booking = run_agent(
        last_search["origin"],
        last_search["destination"],
        last_search["date"],
        # last_search["passenger"],
        passenger_name,
        selected_flight=selected_flight,
        mode="book"
    )

    return booking