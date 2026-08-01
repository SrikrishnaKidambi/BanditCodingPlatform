import json
from pathlib import Path

DEFAULT_TOPICS = ["Arrays", "BinarySearch", "Trees", "Graphs", "DP"]


def load_topics():
    topics_path = Path(__file__).resolve().parent.parent / "data" / "topics.json"
    if not topics_path.exists():
        return list(DEFAULT_TOPICS)

    try:
        with topics_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        topics = data.get("topics") if isinstance(data, dict) else None
        if isinstance(topics, list) and topics:
            cleaned = [str(topic).strip() for topic in topics if str(topic).strip()]
            if cleaned:
                return cleaned
    except (json.JSONDecodeError, OSError, TypeError):
        pass

    return list(DEFAULT_TOPICS)
