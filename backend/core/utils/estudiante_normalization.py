import re
from typing import Any, Tuple

SEXO_CANONICAL = {
    "m": "M",
    "masculino": "M",
    "f": "F",
    "femenino": "F",
    "o": "O",
    "otro": "O",
    "indistinto": "O",
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


def normalize_ciudad(value: Any) -> str:
    text = normalize_spaces(value)
    if not text:
        return ""
    
    # Normalizar texto para comparación
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", text)
    clean = "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()

    # Río Grande (variantes)
    if "rio grande" in clean or "rg" in clean or clean in ("tdf", "tierra del fuego"):
        return "Río Grande"

    # Ushuaia (variantes y typos)
    if "ushuaia" in clean or "usuahia" in clean:
        return "Ushuaia"

    # Tolhuin
    if "tolhuin" in clean:
        return "Tolhuin"

    # Zona Rural
    if "zona rural" in clean or "campo de doma" in clean or "estancia" in clean:
        return "Zona Rural"

    # CABA / Buenos Aires
    if clean in ("caba", "ciudad autonoma de bs.as", "ciudad autonoma de buenos aires", "capital federal"):
        return "CABA"

    # Si es "Sin Informacion" o números/códigos postales inválidos
    if clean in ("sin informacion", "undefined", "1744"):
        return ""

    # Quitar sufijos comunes como ", Argentina", ", Tierra Del Fuego...", etc.
    partes = [p.strip() for p in text.split(",") if p.strip()]
    if partes:
        primera_parte = partes[0].strip()
        # Verificar si la primera parte es normalizable
        p_clean = "".join(c for c in unicodedata.normalize("NFKD", primera_parte) if not unicodedata.combining(c)).lower().strip()
        if "rio grande" in p_clean:
            return "Río Grande"
        if "ushuaia" in p_clean or "usuahia" in p_clean:
            return "Ushuaia"
        if "tolhuin" in p_clean:
            return "Tolhuin"
    return to_title_case(text)


def normalize_country_with_other(value: Any) -> Tuple[str, str]:
    text = normalize_spaces(value)
    if not text:
        return "", ""
    canonical = COUNTRY_CANONICAL.get(text.lower())
    if canonical:
        return canonical, ""
    return "Otro", to_title_case(text)
