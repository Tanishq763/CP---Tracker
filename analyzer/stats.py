class StatsAnalyzer:
    def __init__(self, user_info, submissions, rating_history):
        self.user_info = user_info
        self.submissions = submissions
        self.rating_history = rating_history

    def get_solved_count(self):
        solved = set()
        for sub in self.submissions:
            if sub.get("verdict") == "OK":
                prob = sub["problem"]
                solved.add((prob.get("contestId"), prob.get("index")))
        return len(solved)

    def get_max_rating(self):
        if self.rating_history:
            return max(r["newRating"] for r in self.rating_history)
        return self.user_info.get("rating", 0)

    def get_contests_count(self):
        return len(self.rating_history)

    def get_rank_color(self, rank):
        rank = rank.lower() if rank else ""
        colors = {
            "newbie": "white",
            "pupil": "green",
            "specialist": "cyan",
            "expert": "blue",
            "candidate master": "magenta",
            "master": "yellow",
            "international master": "yellow",
            "grandmaster": "red",
            "international grandmaster": "red",
            "legendary grandmaster": "red",
        }
        for key in colors:
            if key in rank:
                return colors[key]
        return "white"

    def get_summary(self):
        return {
            "handle": self.user_info.get("handle", "N/A"),
            "rank": self.user_info.get("rank", "Unrated"),
            "rating": self.user_info.get("rating", 0),
            "max_rating": self.get_max_rating(),
            "solved": self.get_solved_count(),
            "contests": self.get_contests_count(),
            "contribution": self.user_info.get("contribution", 0),
            "color": self.get_rank_color(self.user_info.get("rank", "")),
        }
