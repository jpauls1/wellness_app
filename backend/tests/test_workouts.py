def test_create_workout(client):
    response = client.post(
        "/api/workouts", json={"name": "Push Day", "date": "08/05/26", "type": "Lifting"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Push Day"
    assert body["date"] == "08/05/26"
    assert body["type"] == "Lifting"


def test_create_workout_rejects_invalid_type(client):
    response = client.post(
        "/api/workouts", json={"name": "Bad", "date": "08/05/26", "type": "Swimming"}
    )
    assert response.status_code == 422


def test_create_workout_rejects_invalid_date_format(client):
    response = client.post(
        "/api/workouts", json={"name": "Bad", "date": "2026-08-05", "type": "Lifting"}
    )
    assert response.status_code == 422


def test_workout_not_found(client):
    assert client.get("/api/workouts/999").status_code == 404
    assert client.put("/api/workouts/999", json={"name": "X"}).status_code == 404
    assert client.delete("/api/workouts/999").status_code == 404


def test_update_and_delete_workout(client):
    created = client.post(
        "/api/workouts", json={"name": "Leg Day", "date": "08/01/26", "type": "Lifting"}
    ).json()
    workout_id = created["id"]

    updated = client.put(f"/api/workouts/{workout_id}", json={"name": "Leg Day (Heavy)"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Leg Day (Heavy)"

    deleted = client.delete(f"/api/workouts/{workout_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/workouts/{workout_id}").status_code == 404


def test_set_numbers_auto_increment_per_exercise_type(client):
    workout = client.post(
        "/api/workouts", json={"name": "Push Day", "date": "08/05/26", "type": "Lifting"}
    ).json()
    workout_id = workout["id"]

    set1 = client.post(
        f"/api/workouts/{workout_id}/sets",
        json={
            "exercise_type": "Bench Press",
            "reps": 10,
            "time_spent": "00:01:15",
            "calories_burned": 20,
        },
    )
    assert set1.status_code == 201
    assert set1.json()["set_number"] == 1

    set2 = client.post(
        f"/api/workouts/{workout_id}/sets",
        json={"exercise_type": "Bench Press", "reps": 8},
    )
    assert set2.json()["set_number"] == 2
    assert set2.json()["time_spent"] is None
    assert set2.json()["calories_burned"] is None

    other_exercise = client.post(
        f"/api/workouts/{workout_id}/sets",
        json={"exercise_type": "Squat", "reps": 5},
    )
    assert other_exercise.json()["set_number"] == 1

    full_workout = client.get(f"/api/workouts/{workout_id}")
    assert full_workout.status_code == 200
    assert len(full_workout.json()["sets"]) == 3


def test_set_requires_workout_to_exist(client):
    response = client.post(
        "/api/workouts/999/sets", json={"exercise_type": "Bench Press", "reps": 10}
    )
    assert response.status_code == 404


def test_set_requires_exercise_type_and_reps(client):
    workout = client.post(
        "/api/workouts", json={"name": "Push Day", "date": "08/05/26", "type": "Lifting"}
    ).json()
    response = client.post(f"/api/workouts/{workout['id']}/sets", json={"reps": 10})
    assert response.status_code == 422


def test_update_and_delete_set(client):
    workout = client.post(
        "/api/workouts", json={"name": "Push Day", "date": "08/05/26", "type": "Lifting"}
    ).json()
    created_set = client.post(
        f"/api/workouts/{workout['id']}/sets",
        json={"exercise_type": "Bench Press", "reps": 10},
    ).json()

    updated = client.put(
        f"/api/workouts/{workout['id']}/sets/{created_set['id']}",
        json={"reps": 12, "calories_burned": 30},
    )
    assert updated.status_code == 200
    assert updated.json()["reps"] == 12
    assert updated.json()["calories_burned"] == 30

    deleted = client.delete(f"/api/workouts/{workout['id']}/sets/{created_set['id']}")
    assert deleted.status_code == 204

    remaining = client.get(f"/api/workouts/{workout['id']}/sets")
    assert remaining.json() == []


def test_list_workouts_filtered_by_type(client):
    client.post("/api/workouts", json={"name": "Push Day", "date": "08/01/26", "type": "Lifting"})
    client.post("/api/workouts", json={"name": "Morning Run", "date": "08/02/26", "type": "Cardio"})

    response = client.get("/api/workouts", params={"type": "Cardio"})
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["name"] == "Morning Run"
