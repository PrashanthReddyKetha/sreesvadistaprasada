"""The real start-up sequence, twice, on an in-memory database (audit A-0003, TEST-001/BE-005): every seed and
migration runs, the index marker is written, and a second boot leaves the admin's menu alone."""
import asyncio

import pytest


@pytest.mark.filterwarnings("ignore")
def test_the_server_boots_twice_and_the_second_boot_changes_nothing(db, monkeypatch):
    import server
    from database import db as live_db

    async def boot():
        async with server.lifespan(server.app):
            return await live_db.settings.find_one({"_id": "indexes"}, {"_id": 0})

    marker = asyncio.run(boot())
    assert marker and marker["version"] == server.INDEX_VERSION
    # the admin deletes a dish and changes a price; a restart must not undo either (BE-004 / seed gate)
    dish = asyncio.run(live_db.menu_items.find_one({}, {"_id": 0, "id": 1, "name": 1}))
    asyncio.run(live_db.menu_items.update_one({"id": dish["id"]}, {"$set": {"price": 99.99}}))
    victim = asyncio.run(live_db.menu_items.find_one({"id": {"$ne": dish["id"]}}, {"_id": 0, "id": 1}))
    asyncio.run(live_db.menu_items.delete_one({"id": victim["id"]}))
    asyncio.run(boot())
    assert asyncio.run(live_db.menu_items.find_one({"id": dish["id"]}))["price"] == 99.99
    assert asyncio.run(live_db.menu_items.find_one({"id": victim["id"]})) is None
