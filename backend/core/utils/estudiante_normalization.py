import re
from typing import Any, Tuple

SEXO_CANONICAL = {
    "m": "Masculino",
    "masculino": "Masculino",
    "f": "Femenino",
    "femenino": "Femenino",
    "o": "Otro",
    "otro": "Otro",
    "indistinto": "Otro",
}

COUNTRY_CANONICAL = {
    "argentina": "Argentina",
    "bolivia": "Bolivia",
    "brasil": "Brasil",
    "chile": "Chile",
    "paraguay": "Paraguay",
    "uruguay": "Uruguay",
    "otro": "Otro",
}


def normalize_spaces(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def to_upper(value: Any) -> str:
    return normalize_spaces(value).upper()


def to_title_case(value: Any) -> str:
    text = normalize_spaces(value)
    if not text:
        return ""
    lowered = text.lower()
    return re.sub(
        r"[A-Za-zÀ-ÖØ-öø-ÿ]+",
        lambda match: match.group(0)[0].upper() + match.group(0)[1:],
        lowered,
    )


def normalize_dni_digits(value: Any) -> str:
    return re.sub(r"\D", "", normalize_spaces(value))


def normalize_sexo(value: Any) -> str:
    text = normalize_spaces(value)
    if not text:
        return ""
    return SEXO_CANONICAL.get(text.lower(), to_title_case(text))


def normalize_country_with_other(value: Any) -> Tuple[str, str]:
    text = normalize_spaces(value)
    if not text:
        return "", ""
    canonical = COUNTRY_CANONICAL.get(text.lower())
    if canonical:
        return canonical, ""
    return "Otro", to_title_case(text)

