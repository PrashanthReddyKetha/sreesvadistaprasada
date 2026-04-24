from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid


# --- Enums ---

class UserRole(str, Enum):
    customer = "customer"
    admin = "admin"


class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    out_for_delivery = "out_for_delivery"
    delivered = "delivered"
    cancelled = "cancelled"


class SubscriptionStatus(str, Enum):
    active = "active"
    cancelled = "cancelled"
    expired = "expired"


class EnquiryStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    resolved = "resolved"


class MenuCategory(str, Enum):
    nonVeg = "nonVeg"
    veg = "veg"
    prasada = "prasada"
    breakfast = "breakfast"
    streetFood = "streetFood"
    drinks = "drinks"
    pickles = "pickles"
    podis = "podis"
    ragiSpecials = "ragiSpecials"


# --- Shared ---

class Address(BaseModel):
    line1: str
    line2: Optional[str] = None
    city: str
    postcode: str


# --- User ---

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    firebase_token: Optional[str] = None  # Firebase phone verification token


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Address] = None


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    phone_verified: bool = False
    address: Optional[Address] = None
    role: UserRole = UserRole.customer
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserInDB(User):
    password_hash: Optional[str] = None   # None for Google-only accounts


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# --- Google Auth ---

class GoogleAuthRequest(BaseModel):
    credential: str          # Google access token from frontend

class GoogleCompleteRequest(BaseModel):
    credential: str          # Original Google access token
    phone: str               # Phone number user entered
    firebase_token: str      # Firebase phone verification token


# --- Menu ---

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: MenuCategory
    subcategory: Optional[str] = None
    # extra_categories allows a single DB item to appear on multiple menu pages.
    # Each entry: {"category": "streetFood", "subcategory": "..."}
    extra_categories: List[dict] = []
    spice_level: int = Field(default=0, ge=0, le=5)
    is_veg: bool = True
    image: Optional[str] = None
    available: bool = True
    featured: bool = False
    allergens: List[str] = []
    tag: Optional[str] = None
    faqs: List[dict] = []
    pairs_with: List[str] = []


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[MenuCategory] = None
    subcategory: Optional[str] = None
    extra_categories: Optional[List[dict]] = None
    spice_level: Optional[int] = Field(default=None, ge=0, le=5)
    is_veg: Optional[bool] = None
    image: Optional[str] = None
    available: Optional[bool] = None
    featured: Optional[bool] = None
    allergens: Optional[List[str]] = None
    tag: Optional[str] = None
    faqs: Optional[List[dict]] = None
    pairs_with: Optional[List[str]] = None


class MenuItem(MenuItemCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Reviews ---

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=5, max_length=1000)


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    menu_item_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Orders ---

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float
    quantity: int


class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    delivery_address: Address
    items: List[OrderItem]
    notes: Optional[str] = None
    user_id: Optional[str] = None
    payment_intent_id: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class Order(OrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subtotal: float = 0.0
    delivery_fee: float = 0.0
    total: float = 0.0
    status: OrderStatus = OrderStatus.pending
    payment_intent_id: Optional[str] = None
    payment_status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# --- Subscriptions ---

class SubscriptionCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    plan: str                       # weekly | monthly
    box_type: str                   # prasada | svadista
    preferences: List[str] = []
    custom_request: Optional[str] = None
    start_date: str                 # YYYY-MM-DD (always a Monday)
    delivery_address: Address
    delivery_instruction: str = "door"  # call | door | neighbour | safeplace
    neighbour_name: Optional[str] = None
    neighbour_door: Optional[str] = None
    safe_place_description: Optional[str] = None
    is_guest: bool = False
    user_id: Optional[str] = None


class SubscriptionStatusUpdate(BaseModel):
    status: SubscriptionStatus


class Subscription(SubscriptionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    price: float = 0.0
    status: SubscriptionStatus = SubscriptionStatus.active
    end_date: Optional[str] = None
    meals_delivered: int = 0
    cancellation_window_expires: Optional[str] = None
    audit_trail: List[dict] = Field(default_factory=list)
    internal_notes: List[dict] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Daily Specials ---

class DailySpecialCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    link: Optional[str] = None
    active: bool = True
    display_order: int = 0


class DailySpecialUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    link: Optional[str] = None
    active: Optional[bool] = None
    display_order: Optional[int] = None


class DailySpecial(DailySpecialCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# --- Weekly Menu ---

class WeeklyMenuDay(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str           # YYYY-MM-DD
    box_type: str       # prasada | svadista
    items: List[str] = []   # flexible list of meal components
    status: str = "draft"   # draft | published
    dietary_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class WeeklyMenuDayCreate(BaseModel):
    date: str
    box_type: str
    items: List[str] = []
    status: str = "draft"
    dietary_notes: Optional[str] = None


class WeeklyMenuPublish(BaseModel):
    week_start: str  # YYYY-MM-DD


class WeeklyMenuNotes(BaseModel):
    week_start: str
    notes: str


class WeeklyMenuTemplate(BaseModel):
    name: str
    week_start: str


# --- Enquiries ---

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    user_id: Optional[str] = None


class ContactMessage(ContactMessageCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: EnquiryStatus = EnquiryStatus.new
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CateringEnquiryCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    event_type: str
    event_date: str
    guest_count: int
    food_preference: str
    additional_details: Optional[str] = None
    user_id: Optional[str] = None


class CateringEnquiry(CateringEnquiryCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: EnquiryStatus = EnquiryStatus.new
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Enquiry Threads ---

class EnquiryMessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class EnquiryMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enquiry_id: str
    enquiry_type: str  # "contact" | "catering"
    sender: str        # "admin" | "customer"
    sender_name: str
    text: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_by_admin: bool = False
    read_by_customer: bool = False


class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    body: str
    enquiry_id: str
    enquiry_type: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NewsletterCreate(BaseModel):
    email: EmailStr


class NewsletterSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Delivery ---

class PostcodeCheckRequest(BaseModel):
    postcode: str


class DeliveryZoneResponse(BaseModel):
    serviceable: bool
    city: Optional[str] = None
    delivery_fee: Optional[float] = None
    min_order: Optional[float] = None
    estimated_time: Optional[str] = None
    service_type: Optional[str] = None   # "full" | "snacks_only"
    message: str
