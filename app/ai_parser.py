import json
import os
import re
import parsedatetime
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def parse_travel_response(user_request):

    prompt = f"""
    
    Extract travel information from the request below.

    Return ONLY valid JSON in this exact format:

    {{
        
        "intent": "",   // "search" or "book"
        "origin": "",
        "destination": "",
        "date": "",
        "passenger": ""
    }}
    

    Rules:
    
    - If user says "show", "list", "find" → intent = "search"
    - If user says "book" → intent = "book"

    Do not add explanations.

    Request: {user_request}
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=150
    )

    content = response.choices[0].message.content

    match = re.search(r"\{.*\}", content, re.DOTALL)

    if match:

        data = json.loads(match.group())

        # Convert natural language date → actual date
        cal = parsedatetime.Calendar()
        time_struct, status = cal.parse(data["date"])

        if status == 0:
            return {"error": f"Invalid date: {data['date']}"}

            
        parsed_date = datetime(*time_struct[:6]).date()
        data["date"] = parsed_date.strftime("%Y-%m-%d")
        
        return data

    