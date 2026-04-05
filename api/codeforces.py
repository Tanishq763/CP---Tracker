import requests
import json
import os
import time

CACHE_FILE = "data/cache.json"
BASE_URL = "https://codeforces.com/api"

class CodeforcesAPI:
    def __init__(self, handle):
        self.handle = handle
        self.cache = self._load_cache()

    def _load_cache(self):
        if os.path.exists(CACHE_FILE):
            with open(CACHE_FILE, "r") as f:
                return json.load(f)
        return {}

    def _save_cache(self):
        os.makedirs("data", exist_ok=True)
        with open(CACHE_FILE, "w") as f:
            json.dump(self.cache, f, indent=2)

    def _fetch(self, endpoint, params={}):
        cache_key = endpoint + str(params)
        # Use cache if less than 1 hour old
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if time.time() - cached["timestamp"] < 3600:
                return cached["data"]

        try:
            url = f"{BASE_URL}/{endpoint}"
            res = requests.get(url, params=params, timeout=10)
            data = res.json()

            if data["status"] == "OK":
                self.cache[cache_key] = {
                    "data": data["result"],
                    "timestamp": time.time()
                }
                self._save_cache()
                return data["result"]
            else:
                return None
        except Exception as e:
            print(f"  [Error] API call failed: {e}")
            return None

    def get_user_info(self):
        result = self._fetch("user.info", {"handles": self.handle})
        return result[0] if result else None

    def get_submissions(self):
        return self._fetch("user.status", {"handle": self.handle}) or []

    def get_rating_history(self):
        return self._fetch("user.rating", {"handle": self.handle}) or []

    def get_all_problems(self):
        result = self._fetch("problemset.problems")
        return result.get("problems", []) if result else []
