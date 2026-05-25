"""
moald_extract.py
================
MOALD-specific extraction pipeline for RAG embedding.

What this file does:
  - Opens MOALD.pdf (242 pages, MoALD Statistical Information on Nepalese Agriculture 2022/23)
  - Skips empty and rotated/garbled pages
  - Extracts clean text per page using pdfplumber
  - Detects what section/table each page belongs to (from the known TOC)
  - Converts raw tabular text into structured natural-language sentences
    so embeddings carry semantic meaning (e.g. "In Koshi province, paddy
    production was 1,336,057 metric tonnes in FY 2022/23.")
  - Returns a list of dicts ready to feed into the spaCy → chunk → embed
    pipeline from local_rag.ipynb

Usage:
    from moald_extract import load_moald_pages
    pages_and_texts = load_moald_pages("MOALD.pdf")
    # then continue with the rest of the notebook pipeline
"""

import re
import pdfplumber
from tqdm.auto import tqdm


# ── SECTION MAP ──────────────────────────────────────────────────────────────
# Maps page ranges (0-indexed) to human-readable section labels.
# Built from the Table of Contents in the PDF.
SECTION_MAP = [
    (0,   5,   "cover_foreword_preface"),
    (6,   8,   "table_of_contents"),
    (9,   13,  "summary_key_indicators"),          # national-level summary tables
    (14,  21,  "cereal_crops_ten_year_trend"),      # Table 1.1
    (21,  22,  "cereal_production_by_province"),    # Table 1.2
    (22,  27,  "cereal_aggregate_by_district"),     # Table 1.3
    (27,  36,  "paddy_production_by_district"),     # Table 1.4
    (36,  42,  "maize_wheat_by_district"),          # Table 1.5
    (42,  48,  "millet_barley_buckwheat_district"), # Table 1.6
    (48,  56,  "cash_crops_ten_year_trend"),        # Table 2.1
    (56,  60,  "cash_crops_by_province"),           # Table 2.2
    (60,  70,  "cash_crops_by_district"),           # Table 2.3
    (70,  76,  "oilseed_by_district"),              # Table 2.4
    (76,  80,  "jute_cotton_rubber_coffee"),        # Tables 2.5-2.8
    (80,  85,  "tea_mulberry_mushroom_beekeeping"), # Tables 2.9-2.12
    (85,  92,  "spice_crops_by_district"),          # Table 2.13
    (92,  99,  "pulse_crops_ten_year_trend"),       # Table 3.1
    (99, 106,  "pulses_by_district"),               # Table 3.2
    (106, 114, "livestock_population_ten_years"),   # Table 4.1
    (114, 120, "livestock_products_ten_years"),     # Table 4.2
    (120, 130, "livestock_population_by_district"), # Table 4.3
    (130, 140, "milking_population_by_district"),   # Table 4.4
    (140, 145, "meat_production_by_district"),      # Table 4.5
    (145, 150, "egg_production_by_district"),       # Table 4.6
    (150, 155, "wool_yak_rabbit_by_district"),      # Tables 4.7-4.10
    (155, 165, "fishery_statistics"),               # Tables 5.1-5.3
    (165, 185, "fruit_production"),                 # Tables 6.1-6.4
    (185, 210, "vegetable_production_by_district"), # Tables 7.1-7.3
    (210, 218, "population_fertilizer_gdp"),        # Tables 8-10
    (218, 225, "exports_imports_agriculture"),      # Tables 11.1-11.2
    (225, 230, "seed_balance_production"),          # Tables 12.1-12.2
    (230, 235, "crop_livestock_insurance"),         # Table 13.1
    (235, 242, "bank_loans_gdp_contribution"),      # Tables 14-15
]

def get_section(page_idx: int) -> str:
    for (start, end, label) in SECTION_MAP:
        if start <= page_idx < end:
            return label
    return "general"


# ── GARBLED/ROTATED PAGE DETECTION ───────────────────────────────────────────
# Some pages have text stored bottom-to-top (rotated column tables).
# These show up as reversed words like 'aerA', 'dleiY', 'noitcudorP'.
ROTATED_MARKERS = ["aerA", "dleiY", "noitcudorP", "stcirtsiD", "ecnivorP", "sennoT"]

def is_garbled(text: str) -> bool:
    if not text:
        return True
    sample = text[:200]
    hits = sum(1 for m in ROTATED_MARKERS if m in sample)
    return hits >= 2


# ── TEXT CLEANING ─────────────────────────────────────────────────────────────
def clean_text(text: str) -> str:
    """Basic cleaning: collapse whitespace, strip page numbers standing alone."""
    # Remove standalone page numbers (e.g. "\n12\n")
    text = re.sub(r'(?m)^\s*\d{1,3}\s*$', '', text)
    # Remove the repeated header line
    text = re.sub(
        r'STATISTICAL INFORMATION ON NEPALESE AGRICULTURE\s+\d{4}/\d{2}\s*\(\d{4}/\d{2}\)',
        '', text, flags=re.IGNORECASE
    )
    # Collapse multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


# ── STRUCTURED SENTENCE GENERATION ───────────────────────────────────────────
# The tables in MOALD are: Province/District | Crop | Area | Production | Yield
# Raw text extraction gives rows like:
#   "KOSHI 1,336,057 972,073 147,331 108,375 1,733 5,654 2,571,222"
# which is meaningless to an embedding model.
# We convert these into natural sentences.

PROVINCES = [
    "KOSHI", "MADHESH", "BAGMATI", "GANDAKI",
    "LUMBINI", "KARNALI", "SUDURPASHCHIM"
]

NEPAL_DISTRICTS = {
    "TAPLEJUNG", "PANCHTHAR", "ILAM", "JHAPA", "MORANG", "SUNSARI",
    "DHANKUTA", "TERHATHUM", "SANKHUWASABHA", "BHOJPUR", "SOLUKHUMBU",
    "OKHALDHUNGA", "KHOTANG", "UDAYAPUR", "SAPTARI", "SIRAHA",
    "DHANUSA", "MAHOTTARI", "SARLAHI", "SINDHULI", "RAMECHAP",
    "DOLAKHA", "SINDHUPALCHOK", "KAVRE", "LALITPUR", "BHAKTAPUR",
    "KATHMANDU", "NUWAKOT", "RASUWA", "DHADING", "MAKWANPUR",
    "RAUTAHAT", "BARA", "PARSA", "CHITWAN", "GORKHA", "LAMJUNG",
    "TANAHU", "SYANGJA", "KASKI", "MANANG", "MUSTANG", "MYAGDI",
    "PARBAT", "BAGLUNG", "GULMI", "PALPA", "NAWALPARASI EAST",
    "NAWALPARASI WEST", "RUPANDEHI", "KAPILBASTU", "ARGHAKHANCHI",
    "PYUTHAN", "ROLPA", "RUKUM EAST", "RUKUM WEST", "SALYAN",
    "DANG", "BANKE", "BARDIYA", "SURKHET", "DAILEKH", "JAJARKOT",
    "DOLPA", "HUMLA", "JUMLA", "KALIKOT", "MUGU", "BAJURA",
    "BAJHANG", "DARCHULA", "ACHHAM", "DOTI", "BAITADI",
    "DADELDHURA", "KAILALI", "KANCHANPUR",
}

# Section-specific naturalisation functions

def naturalise_summary(text: str) -> str:
    """
    Summary key indicator pages already have well-structured text like:
    "Paddy  1,447,789  5,486,472"
    Convert to: "In FY 2022/23, paddy area was 1,447,789 ha and production was 5,486,472 metric tonnes."
    """
    sentences = []
    # Match crop rows: crop name followed by numbers
    pattern = re.compile(
        r'(Paddy|Maize|Wheat|Millet|Barley|Buckwheat|Lentil|Chickpea|Potato|Sugarcane|Jute|Cotton|Soyabean|'
        r'Oilseeds?|Fruits?|Vegetables?|Ginger|Garlic|Turmeric|Mushroom|Fish)\s+'
        r'([\d,]+)\s+([\d,]+)',
        re.IGNORECASE
    )
    for m in pattern.finditer(text):
        crop, area, prod = m.group(1), m.group(2), m.group(3)
        sentences.append(
            f"In FY 2022/23 (2079/80), {crop} had a total cultivated area of {area} hectares "
            f"and production of {prod} metric tonnes in Nepal."
        )
    return " ".join(sentences) if sentences else text


def naturalise_province_table(text: str, crop_context: str = "cereal crops") -> str:
    """
    Province-level tables like Table 1.2.
    Rows: "KOSHI  1,336,057  972,073  ..."
    """
    sentences = []
    for province in PROVINCES:
        pattern = re.compile(
            rf'{province}\s+([\d,]+(?:\s+[\d,]+)*)', re.IGNORECASE
        )
        m = pattern.search(text)
        if m:
            nums = re.findall(r'[\d,]+', m.group(1))
            if nums:
                sentences.append(
                    f"In {province.title()} province, the total {crop_context} production "
                    f"in FY 2022/23 was {nums[0]} metric tonnes."
                )
    return " ".join(sentences) if sentences else text


def naturalise_district_table(text: str, section: str) -> str:
    """
    District-level tables: Province | District | Area | Production | Yield
    Extract rows and make sentences.
    """
    sentences = []

    # Determine what crop/category this section is about
    section_to_crop = {
        "cereal_aggregate_by_district":     "aggregate cereal crops",
        "paddy_production_by_district":     "paddy (rice)",
        "maize_wheat_by_district":          "maize and wheat",
        "millet_barley_buckwheat_district": "millet, barley and buckwheat",
        "cash_crops_by_district":           "cash crops (potato, sugarcane, oilseeds)",
        "oilseed_by_district":              "oilseeds",
        "spice_crops_by_district":          "spice crops (ginger, garlic, turmeric, cardamom)",
        "pulses_by_district":               "pulse crops (lentil, chickpea, soyabean)",
        "vegetable_production_by_district": "fresh vegetables",
        "livestock_population_by_district": "livestock population",
        "meat_production_by_district":      "meat production",
        "egg_production_by_district":       "egg production",
    }
    crop_label = section_to_crop.get(section, "agricultural products")

    # Find district rows: look for a known district name followed by numbers
    district_pattern = re.compile(
        r'\b([A-Z][A-Z\s]{2,20})\b\s+([\d,]+)\s+([\d,]+)(?:\s+([\d.]+))?'
    )

    for m in district_pattern.finditer(text.upper()):
        name = m.group(1).strip()
        area = m.group(2)
        production = m.group(3)
        yield_val = m.group(4) if m.group(4) else None

        # Only keep if it's a real district or province name
        if name in NEPAL_DISTRICTS or name in PROVINCES:
            label = "district" if name in NEPAL_DISTRICTS else "province"
            if yield_val:
                sentences.append(
                    f"In {name.title()} {label}, {crop_label} area was {area} hectares, "
                    f"production was {production} metric tonnes, and yield was {yield_val} MT/ha "
                    f"in FY 2022/23."
                )
            else:
                sentences.append(
                    f"In {name.title()} {label}, {crop_label} area was {area} hectares "
                    f"and production was {production} metric tonnes in FY 2022/23."
                )

    # Deduplicate (same district can appear multiple times in long pages)
    seen = set()
    unique = []
    for s in sentences:
        key = s[:60]
        if key not in seen:
            seen.add(key)
            unique.append(s)

    return " ".join(unique) if unique else text


def naturalise_fertilizer(text: str) -> str:
    """Table 9: fertilizer sales by type and district."""
    sentences = []

    # National totals
    for fert in ["Urea", "DAP", "Potash"]:
        m = re.search(rf'{fert}\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text, re.IGNORECASE)
        if m:
            sentences.append(
                f"Annual sales of {fert} fertilizer in Nepal were {m.group(1)} MT "
                f"(FY 2020/21), {m.group(2)} MT (FY 2021/22), and {m.group(3)} MT "
                f"(FY 2022/23)."
            )

    # District rows
    dist_pattern = re.compile(
        r'\b([A-Z][A-Z\s]{2,20})\b\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)'
    )
    for m in dist_pattern.finditer(text.upper()):
        name = m.group(1).strip()
        if name in NEPAL_DISTRICTS:
            sentences.append(
                f"In {name.title()} district, fertilizer sales (Urea/DAP/Potash combined) "
                f"were {m.group(2)}, {m.group(3)}, and {m.group(4)} metric tonnes in FY 2022/23."
            )

    return " ".join(sentences) if sentences else text


def naturalise_livestock(text: str, section: str) -> str:
    """Livestock population and production pages."""
    sentences = []

    if "population_ten_years" in section or "products_ten_years" in section:
        # Keep as-is but clean — these are trend data, valuable as text
        return text

    # District livestock rows: District | cattle | buffalo | goat | ...
    dist_pattern = re.compile(
        r'\b([A-Z][A-Z\s]{2,20})\b\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)'
    )
    livestock_label = {
        "livestock_population_by_district": "total livestock (cattle, buffalo, goats, poultry)",
        "milking_population_by_district":   "milking animals and milk production",
        "meat_production_by_district":      "meat production",
        "egg_production_by_district":       "egg production",
    }.get(section, "livestock")

    for m in dist_pattern.finditer(text.upper()):
        name = m.group(1).strip()
        if name in NEPAL_DISTRICTS:
            sentences.append(
                f"In {name.title()} district, {livestock_label} figures in FY 2022/23: "
                f"{m.group(2)}, {m.group(3)}, {m.group(4)} (units vary by category)."
            )

    return " ".join(sentences) if sentences else text


def naturalise_gdp(text: str) -> str:
    """GDP contribution table — keep as clean text, add context header."""
    if "contribution" in text.lower() or "gdp" in text.lower():
        header = (
            "The following shows the percentage contribution of agricultural commodities "
            "to Nepal's Agriculture GDP in FY 2023/24 at current prices. "
        )
        return header + re.sub(r'\s+', ' ', text).strip()
    return text


def naturalise_trade(text: str) -> str:
    """Export/import tables — add context."""
    if "export" in text.lower() or "import" in text.lower():
        header = (
            "The following are Nepal's agricultural commodity export and import statistics "
            "for FY 2022/23 (quantities in kg, values in NPR thousand). "
        )
        return header + re.sub(r'\s+', ' ', text).strip()
    return text


def naturalise_insurance(text: str) -> str:
    """Crop and livestock insurance tables."""
    header = (
        "Nepal's crop and livestock insurance statistics from FY 2073/74 to 2078/79 "
        "show the following sum insured, premiums, subsidized premiums, and claims paid. "
    )
    return header + re.sub(r'\s+', ' ', text).strip()


# ── SECTION DISPATCHER ────────────────────────────────────────────────────────
def naturalise(text: str, section: str, page_idx: int) -> str:
    """
    Route each page to the appropriate naturalisation function based on section.
    Falls back to returning cleaned text if no specific handler applies.
    """
    if not text or len(text.strip()) < 30:
        return ""

    if section in ("cover_foreword_preface", "table_of_contents"):
        # Foreword/preface is narrative — useful as-is
        return text

    if section == "summary_key_indicators":
        enriched = naturalise_summary(text)
        return enriched if len(enriched) > 100 else text

    if section == "cereal_production_by_province":
        return naturalise_province_table(text, "cereal crops")

    if section in (
        "cereal_aggregate_by_district", "paddy_production_by_district",
        "maize_wheat_by_district", "millet_barley_buckwheat_district",
        "cash_crops_by_district", "oilseed_by_district",
        "spice_crops_by_district", "pulses_by_district",
        "vegetable_production_by_district",
    ):
        enriched = naturalise_district_table(text, section)
        return enriched if len(enriched) > 100 else text

    if section in (
        "livestock_population_by_district", "milking_population_by_district",
        "meat_production_by_district", "egg_production_by_district",
        "wool_yak_rabbit_by_district",
    ):
        return naturalise_livestock(text, section)

    if "fertilizer" in section or "population_fertilizer" in section:
        enriched = naturalise_fertilizer(text)
        return enriched if len(enriched) > 100 else text

    if section == "exports_imports_agriculture":
        return naturalise_trade(text)

    if section == "crop_livestock_insurance":
        return naturalise_insurance(text)

    if section == "bank_loans_gdp_contribution":
        return naturalise_gdp(text)

    # Everything else (ten-year trends, fishery, fruit, seed, livestock totals):
    # return the cleaned text directly — it already has readable structure
    return text


# ── MAIN EXTRACTION FUNCTION ──────────────────────────────────────────────────
def load_moald_pages(pdf_path: str = "MOALD.pdf") -> list:
    """
    Main entry point. Returns a list of dicts, one per usable page:

        {
            "source":       "MOALD",
            "page_number":  int,          # 0-indexed PDF page
            "section":      str,          # human-readable section label
            "page_char_count":      int,
            "page_word_count":      int,
            "page_sentence_count_raw": int,
            "page_token_count":     float,
            "text":         str,          # naturalised text ready for embedding
        }

    Pages that are empty, garbled/rotated, or produce no useful text are skipped.
    """
    pages_and_texts = []
    skipped_empty = 0
    skipped_garbled = 0

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"[MOALD] Total pages: {total_pages}")

        for page_idx, page in tqdm(
            enumerate(pdf.pages),
            total=total_pages,
            desc="Extracting MOALD pages"
        ):
            raw_text = page.extract_text() or ""

            # Skip empty pages
            if len(raw_text.strip()) < 30:
                skipped_empty += 1
                continue

            # Skip rotated / garbled pages
            if is_garbled(raw_text):
                skipped_garbled += 1
                continue

            # Clean raw text
            cleaned = clean_text(raw_text)

            # Determine section
            section = get_section(page_idx)

            # Naturalise into embedding-friendly text
            final_text = naturalise(cleaned, section, page_idx)

            if not final_text or len(final_text.strip()) < 30:
                skipped_empty += 1
                continue

            pages_and_texts.append({
                "source":                  "MOALD",
                "page_number":             page_idx,
                "section":                 section,
                "page_char_count":         len(final_text),
                "page_word_count":         len(final_text.split(" ")),
                "page_sentence_count_raw": len(final_text.split(". ")),
                "page_token_count":        len(final_text) / 4,
                "text":                    final_text,
            })

    print(f"[MOALD] Extracted: {len(pages_and_texts)} pages")
    print(f"[MOALD] Skipped empty: {skipped_empty} | Skipped garbled: {skipped_garbled}")
    return pages_and_texts


# ── QUICK SANITY CHECK ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json

    pages = load_moald_pages("MOALD.pdf")

    print(f"\nTotal usable pages: {len(pages)}")
    print("\nSection distribution:")
    from collections import Counter
    counts = Counter(p["section"] for p in pages)
    for section, count in counts.most_common():
        print(f"  {section:<45} {count:>3} pages")

    print("\n--- Sample outputs ---")
    sections_to_show = [
        "summary_key_indicators",
        "cereal_production_by_province",
        "cereal_aggregate_by_district",
        "paddy_production_by_district",
        "spice_crops_by_district",
        "exports_imports_agriculture",
        "bank_loans_gdp_contribution",
    ]
    shown = set()
    for page in pages:
        if page["section"] in sections_to_show and page["section"] not in shown:
            shown.add(page["section"])
            print(f"\n[Section: {page['section']} | Page: {page['page_number']}]")
            print(page["text"][:400])
            print("...")
