import urllib.request
import json

def test():
    print("Testing GET /api/animals...")
    req = urllib.request.urlopen("http://127.0.0.1:8000/api/animals")
    animals = json.loads(req.read().decode())
    print(f"Total animals in DB: {len(animals)}")

    print("\nTesting POST /api/screening/runs...")
    payload = json.dumps({"run_name": "Test Python E2E Screening", "species": "Cattle"}).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/screening/runs",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    run_data = json.loads(res.read().decode())
    run_id = run_data["id"]
    print(f"Screening Run ID: {run_id}")
    print(f"Status: {run_data['status']}")
    print(f"Total Screened: {run_data['total_animals']}")
    print(f"Breakdown: Low={run_data['low_risk_count']}, NeedsInfo={run_data['needs_info_count']}, Med={run_data['medium_risk_count']}, High={run_data['high_risk_count']}, Crit={run_data['critical_count']}")

    print(f"\nTesting GET /api/screening/runs/{run_id}/animals...")
    req = urllib.request.urlopen(f"http://127.0.0.1:8000/api/screening/runs/{run_id}/animals")
    run_animals = json.loads(req.read().decode())
    print(f"Returned {len(run_animals)} animals in run.")
    if run_animals:
        first = run_animals[0]
        print(f"Sample animal: {first.get('animal', {}).get('animal_id')} - Category: {first.get('risk_category')}, Score: {first.get('risk_score')}")
        print(f"Findings: {first.get('observed_findings')}")
        print(f"Missing: {first.get('missing_information')}")

    print(f"\nTesting GET /api/screening/runs/{run_id}/pdf...")
    req = urllib.request.urlopen(f"http://127.0.0.1:8000/api/screening/runs/{run_id}/pdf")
    pdf_bytes = req.read()
    print(f"Generated Herd PDF size: {len(pdf_bytes)} bytes. Starts with: {pdf_bytes[:4]}")

    if run_animals:
        screening_animal_id = run_animals[0]["id"]
        print(f"\nTesting GET /api/screening/run-animals/{screening_animal_id}/pdf...")
        req = urllib.request.urlopen(f"http://127.0.0.1:8000/api/screening/run-animals/{screening_animal_id}/pdf")
        animal_pdf_bytes = req.read()
        print(f"Generated Animal PDF size: {len(animal_pdf_bytes)} bytes. Starts with: {animal_pdf_bytes[:4]}")

        print(f"\nTesting Feeding Questionnaire submission for {first.get('animal_id')}...")
        feed_payload = json.dumps({
            "animal_id": first.get("animal_id"),
            "screening_animal_id": screening_animal_id,
            "run_id": run_id,
            "intake_level": "MODERATE_REDUCTION",
            "appetite_trend": "DECLINING",
            "water_consumption": "REDUCED",
            "chewing_cud_rate": "REDUCED",
            "feed_type": "Total Mixed Ration (TMR)",
            "notes": "Testing automated questionnaire re-assessment"
        }).encode('utf-8')
        feed_req = urllib.request.Request(
            "http://127.0.0.1:8000/api/screening/feeding-observation",
            data=feed_payload,
            headers={"Content-Type": "application/json"}
        )
        feed_res = urllib.request.urlopen(feed_req)
        feed_data = json.loads(feed_res.read().decode())
        print(f"Feeding Q&A Result: New Risk Category: {feed_data.get('new_risk_category')}, New Score: {feed_data.get('new_risk_score')}")

    print("\nALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    test()
