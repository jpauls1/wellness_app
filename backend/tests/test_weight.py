def test_create_and_list_weight_entry(client):
    response = client.post("/api/weight-entries", json={"weight_lbs": 182.4})
    assert response.status_code == 201
    body = response.json()
    assert body["weight_lbs"] == 182.4
    assert "id" in body
    assert "timestamp" in body

    response = client.get("/api/weight-entries")
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_create_weight_entry_with_explicit_timestamp(client):
    response = client.post(
        "/api/weight-entries",
        json={"weight_lbs": 180.0, "timestamp": "2026-08-01T07:00:00"},
    )
    assert response.status_code == 201
    assert response.json()["timestamp"].startswith("2026-08-01T07:00:00")


def test_get_update_and_delete_weight_entry(client):
    created = client.post("/api/weight-entries", json={"weight_lbs": 180.0}).json()
    entry_id = created["id"]

    fetched = client.get(f"/api/weight-entries/{entry_id}")
    assert fetched.status_code == 200

    updated = client.put(f"/api/weight-entries/{entry_id}", json={"weight_lbs": 179.5})
    assert updated.status_code == 200
    assert updated.json()["weight_lbs"] == 179.5

    deleted = client.delete(f"/api/weight-entries/{entry_id}")
    assert deleted.status_code == 204

    missing = client.get(f"/api/weight-entries/{entry_id}")
    assert missing.status_code == 404


def test_weight_entry_not_found(client):
    assert client.get("/api/weight-entries/999").status_code == 404
    assert client.put("/api/weight-entries/999", json={"weight_lbs": 100}).status_code == 404
    assert client.delete("/api/weight-entries/999").status_code == 404


def test_list_weight_entries_filtered_by_date_range(client):
    client.post("/api/weight-entries", json={"weight_lbs": 190, "timestamp": "2026-07-01T08:00:00"})
    client.post("/api/weight-entries", json={"weight_lbs": 185, "timestamp": "2026-07-15T08:00:00"})
    client.post("/api/weight-entries", json={"weight_lbs": 180, "timestamp": "2026-08-01T08:00:00"})

    response = client.get("/api/weight-entries", params={"from": "2026-07-10", "to": "2026-07-31"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["weight_lbs"] == 185
