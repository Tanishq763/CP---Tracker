from api.codeforces import CodeforcesAPI
from analyzer.stats import StatsAnalyzer
from analyzer.tag_analyzer import TagAnalyzer
from analyzer.recommender import Recommender
from display.cli import CLI

def main():
    cli = CLI()
    cli.print_banner()

    handle = input("\n  Enter your Codeforces handle: ").strip()
    if not handle:
        cli.print_error("Handle cannot be empty!")
        return

    cli.print_loading(f"Fetching data for '{handle}'...")

    cf = CodeforcesAPI(handle)

    # Fetch all data
    user_info = cf.get_user_info()
    if not user_info:
        cli.print_error(f"User '{handle}' not found on Codeforces!")
        return

    submissions = cf.get_submissions()
    rating_history = cf.get_rating_history()

    # Analyze
    stats = StatsAnalyzer(user_info, submissions, rating_history)
    tag_analyzer = TagAnalyzer(submissions)
    recommender = Recommender(handle, tag_analyzer)

    # Display
    cli.print_user_info(stats.get_summary())
    cli.print_tag_breakdown(tag_analyzer.get_tag_stats())
    cli.print_weak_topics(tag_analyzer.get_weak_tags())

    print()
    show_recs = input("  Want problem recommendations? (y/n): ").strip().lower()
    if show_recs == 'y':
        problems = recommender.get_recommendations(cf.get_all_problems())
        cli.print_recommendations(problems)

    cli.print_footer()

if __name__ == "__main__":
    main()
