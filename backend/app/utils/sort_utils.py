import re


def natural_sort_key(s: str | None) -> tuple:
    """
    Numerik/doğal sıralama anahtarı (örn: 's1', 's2', 's10').
    Metindeki sayı kısımlarını integer'a çevirerek sıralar.
    """
    if not s:
        return (999999, "")
    parts = []
    for part in re.split(r"(\d+)", str(s)):
        if part.isdigit():
            parts.append(int(part))
        else:
            parts.append(part.lower().strip())
    return tuple(parts)
