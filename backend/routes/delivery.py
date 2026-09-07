from fastapi import APIRouter
from models import PostcodeCheckRequest, DeliveryZoneResponse
from routes.orders import get_zone_from_postcode, ZONE_DELIVERY_FEE, ZONE_FREE_DELIVERY_THRESHOLD, MINIMUM_ORDER

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
]

REST_OF_UK = {
    "city": "Rest of UK",
    "delivery_fee": 4.99,
    "free_over": 25.0,
    "min_order": 10.0,
    "estimated_time": "2–3 business days",
    "service_type": "snacks_only",
}


@router.post("/check", response_model=DeliveryZoneResponse)
async def check_postcode(payload: PostcodeCheckRequest):
    # Same district whitelist orders.py uses for checkout, so this checker
    # never promises delivery that the order engine will then refuse.
    mk_zone = get_zone_from_postcode(payload.postcode)

    if mk_zone is not None:
        return DeliveryZoneResponse(
            serviceable=True,
            city="Milton Keynes",
            delivery_fee=ZONE_DELIVERY_FEE[mk_zone],
            free_over=ZONE_FREE_DELIVERY_THRESHOLD[mk_zone],
            min_order=MINIMUM_ORDER,
            estimated_time="30–60 mins",
            service_type="full",
            message="We deliver to Milton Keynes! Full menu available.",
        )

    return DeliveryZoneResponse(
        serviceable=True,
        city=REST_OF_UK["city"],
        delivery_fee=REST_OF_UK["delivery_fee"],
        free_over=REST_OF_UK["free_over"],
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
