from fastapi import APIRouter
from models import PostcodeCheckRequest, DeliveryZoneResponse

router = APIRouter(prefix="/delivery", tags=["delivery"])

ZONES = [
    {
        "city": "Milton Keynes",
        "prefixes": ["MK"],
        "delivery_fee": 3.99,
        "free_over": 30.0,
        "min_order": 15.0,
        "estimated_time": "30–60 mins",
        "service_type": "full",
    },
    {
        "city": "Edinburgh",
        "prefixes": ["EH"],
        "delivery_fee": 3.99,
        "free_over": 30.0,
        "min_order": 15.0,
        "estimated_time": "45–75 mins",
        "service_type": "full",
    },
    {
        "city": "Glasgow",
        "prefixes": ["G"],   # G followed by digit (not GU, GL, etc.)
        "delivery_fee": 3.99,
        "free_over": 30.0,
        "min_order": 15.0,
        "estimated_time": "45–75 mins",
        "service_type": "full",
    },
]

REST_OF_UK = {
    "city": "Rest of UK",
    "delivery_fee": 4.99,
    "free_over": 25.0,
    "min_order": 10.0,
    "estimated_time": "2–3 business days",
    "service_type": "snacks_only",
}


def match_zone(postcode: str):
    clean = postcode.upper().replace(" ", "")
    for zone in ZONES:
        for prefix in zone["prefixes"]:
            if clean.startswith(prefix):
                # For "G", make sure next char is a digit to avoid GU, GL, etc.
                after = clean[len(prefix):]
                if prefix == "G" and (not after or not after[0].isdigit()):
                    continue
                return zone
    return None


@router.post("/check", response_model=DeliveryZoneResponse)
async def check_postcode(payload: PostcodeCheckRequest):
    zone = match_zone(payload.postcode)

    if zone:
        return DeliveryZoneResponse(
            serviceable=True,
            city=zone["city"],
            delivery_fee=zone["delivery_fee"],
            min_order=zone["min_order"],
            estimated_time=zone["estimated_time"],
            service_type=zone["service_type"],
            message=f"We deliver to {zone['city']}! Full menu available.",
        )

    return DeliveryZoneResponse(
        serviceable=True,
        city=REST_OF_UK["city"],
        delivery_fee=REST_OF_UK["delivery_fee"],
        min_order=REST_OF_UK["min_order"],
        estimated_time=REST_OF_UK["estimated_time"],
        service_type=REST_OF_UK["service_type"],
        message="We ship snacks, pickles & podis to your area (2–3 business days).",
    )


@router.get("/zones")
async def get_zones():
    return {
        "full_service": [
            {"city": z["city"], "min_order": z["min_order"], "delivery_fee": z["delivery_fee"],
             "free_over": z["free_over"], "estimated_time": z["estimated_time"]}
            for z in ZONES
        ],
        "snacks_only": {
            "city": REST_OF_UK["city"],
            "min_order": REST_OF_UK["min_order"],
            "delivery_fee": REST_OF_UK["delivery_fee"],
            "free_over": REST_OF_UK["free_over"],
            "estimated_time": REST_OF_UK["estimated_time"],
        },
    }
