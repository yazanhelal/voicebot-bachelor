from pathlib import Path

SEARCH_FOLDERS = [
    Path.home() / "Desktop",
    Path.home() / "Documents",
    Path.home() / "Downloads",
]


def find_local_file(filename: str, max_results: int = 5):
    results = []

    if not filename:
        return results

    for folder in SEARCH_FOLDERS:
        if not folder.exists():
            continue

        try:
            for path in folder.rglob(filename):
                if path.is_file():
                    results.append(str(path))
                    if len(results) >= max_results:
                        return results
        except PermissionError:
            continue

    return results
