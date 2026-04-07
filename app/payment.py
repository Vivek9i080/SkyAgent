import random

def process_payment(price):

    return {
        "status": "SUCCESS",
        "amount": price,
        "transaction_id": "TXN" + str(random.randint(100000,999999))
    }