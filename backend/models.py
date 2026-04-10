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
    paused = "paused"
    cancelled = "cancelled"


class EnquiryStatus(str, Enum):
    new = "new"
    contacted = "contacted"
    resolved = "resolved"


class MenuCategory(str, Enum):
    nonVeg = "nonVeg"
    veg = "veg"
    prasada = "prasada"
    breakfast = "breakfast"
    pickles = "pickles"
    podis = "podis"


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
    address: Optional[Address] = None
    role: UserRole = UserRole.customer
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserInDB(User):
    password_hash: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


# --- Menu ---

class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    category: MenuCategory
    subcategory: Optional[str] = None
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


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class Order(OrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subtotal: float = 0.0
    delivery_fee: float = 0.0
    total: float = 0.0
    status: OrderStatus = OrderStatus.pending
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# --- Subscriptions ---

class SubscriptionCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    plan: str          # weekly | monthly | family
    box_type: str      # prasada | svadista | mixed
    preferences: List[str] = []
    start_date: str
    delivery_address: Address
    user_id: Optional[str] = None


class SubscriptionStatusUpdate(BaseModel):
    status: SubscriptionStatus


class Subscription(SubscriptionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    price: float = 0.0
    status: SubscriptionStatus = SubscriptionStatus.active
    created_at: datetime = Field(default_factory=datetime.utcnow)


# --- Enquiries ---

class ContactMessageCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str


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


class CateringEnquiry(CateringEnquiryCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: EnquiryStatus = EnquiryStatus.new
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
