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


def test_an_index_conflict_never_stops_the_server_starting():
    """Real MongoDB refuses to add a TTL to an existing index on the same key (code 85, IndexOptionsConflict) — this
    stopped the 6cbb093 deploy. The helper drops and recreates; any other failure is logged, never raised."""
    from pymongo.errors import OperationFailure
    import server

    class Coll:
        name = "admin_audit"
        def __init__(self, fail_code=85, second_fail=False):
            self.calls, self.dropped, self.fail_code, self.second_fail = 0, [], fail_code, second_fail
        async def create_index(self, keys, **opts):
            self.calls += 1
            if self.calls == 1 or self.second_fail:
                raise OperationFailure("An equivalent index already exists with the same name but different options", code=self.fail_code)
            return "at_1"
        async def index_information(self):
            return {"_id_": {"key": [("_id", 1)]}, "at_1": {"key": [("at", 1)]}}
        async def drop_index(self, name):
            self.dropped.append(name)

    server.INDEX_FAILURES.clear()
    c = Coll()
    assert asyncio.run(server.ensure_index(c, "at", expireAfterSeconds=10)) == "at_1"
    assert c.dropped == ["at_1"] and server.INDEX_FAILURES == []

    stubborn = Coll(second_fail=True)
    assert asyncio.run(server.ensure_index(stubborn, "at", expireAfterSeconds=10)) is None      # logged, not raised
    other = Coll(fail_code=13)                                                                     # e.g. unauthorised
    assert asyncio.run(server.ensure_index(other, "at")) is None
    assert len(server.INDEX_FAILURES) == 2
    server.INDEX_FAILURES.clear()
