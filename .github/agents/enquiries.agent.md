---
description: "Use when: working on enquiries, contact form, catering form, conversation threading, admin inbox, customer notifications, unread badges, newsletter subscriptions, or the Enquiries tab in admin or customer dashboard"
tools: [read, edit, search]
---

You are an enquiries and notifications specialist for Sree Svadista Prasada.

## Enquiry Routes (`backend/routes/enquiries.py` → `/api/enquiries`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/enquiries` | Optional | Contact form submission |
| `POST` | `/api/enquiries/catering` | Optional | Catering enquiry |
| `POST` | `/api/enquiries/newsletter` | None | Newsletter signup |
| `GET` | `/api/enquiries` | Auth | Admin: all; Customer: own (filtered by `user_id`) |
| `GET` | `/api/enquiries/{id}/messages` | Auth | Thread messages |
| `POST` | `/api/enquiries/{id}/messages` | Auth | Send reply |
| `PATCH` | `/api/enquiries/{id}/status` | Admin | Update enquiry status |

## MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `enquiries` | Enquiry records |
| `enquiry_messages` | Per-enquiry thread messages |
| `notifications` | In-app notifications for customers |

## Enquiry Data Model

```python
{
    "name": str,
    "email": str,
    "subject": str,
    "message": str,
    "type": str,        # "contact" | "catering" | "newsletter"
    "user_id": str,     # Optional — links enquiry to account when logged in
    "status": str,      # "new" | "contacted" | "resolved"
    "created_at": datetime,
}
```

## Conversation Threading

- Admin opens enquiry in Enquiries tab → thread loaded from `enquiry_messages`
- Admin reply → `POST /api/enquiries/{id}/messages` → auto-sets status to `"contacted"`
- Customer reply → same endpoint, different `sender` field
- Both sides poll `GET /api/enquiries/{id}/messages` every **6–8 seconds** while thread is open

## Notifications Flow

1. Admin sends reply to a customer's enquiry
2. Notification record created in `notifications` collection: `{ user_id, enquiry_id, message, read: false, created_at }`
3. Customer sees unread badge on Dashboard → Enquiries tab
4. Customer sees unread alert on Dashboard → Overview tab
5. On opening the thread, mark messages as read

## Frontend — Contact Form (`frontend/src/pages/Contact.jsx`)

- Submits to `POST /api/enquiries`
- Attaches `user_id` if user is logged in (enables notification delivery)
- Fields: name, email, subject, message

## Frontend — Catering Form (`frontend/src/pages/Catering.jsx`)

- Submits to `POST /api/enquiries/catering`

## Customer Dashboard Enquiries Tab (`frontend/src/pages/Dashboard.jsx`)

- Lists own enquiries (filtered by logged-in user's `user_id`)
- Unread badge = count of unread admin messages
- Click enquiry → opens thread view, can reply to admin
- Polling interval: 6–8 seconds while thread open

## Admin Enquiries Tab (`frontend/src/pages/Admin.jsx`)

- Inbox: all enquiries, unread count per enquiry
- Click → conversation thread → reply box
- Status actions: mark as resolved
- Admin replies auto-update status to `"contacted"`

## Constraints

- NEVER expose one customer's enquiries to another customer
- ALWAYS attach `user_id` when user is logged in — required for notification delivery
- Polling interval MUST stay at 6–8 seconds — shorter intervals risk rate limiting
- Newsletter signup does NOT require authentication
