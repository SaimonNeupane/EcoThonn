#!/usr/bin/env python
# coding: utf-8

# In[1]:


get_ipython().run_line_magic('pip', 'install pymupdf')
get_ipython().run_line_magic('pip', 'install spacy')
get_ipython().run_line_magic('pip', 'install sentence-transformers')
get_ipython().run_line_magic('pip', 'install pandas tqdm requests')
get_ipython().run_line_magic('pip', 'install ollama')
# Also ensure Ollama desktop app is running and model is pulled:
# ollama pull qwen2.5:7b-instruct-q4_K_M  (or whichever tag you downloaded)


# ## Ollama + Qwen2.5 7B Q4 — SoilSense RAG
# 
# This notebook uses **Ollama** as the LLM backend instead of HuggingFace.
# Make sure Ollama is running locally (`ollama serve`) and the model is available:
# ```
# ollama pull qwen2.5:7b-instruct-q4_K_M
# ```
# 

# In[2]:


import torch
import ollama

# Check if GPU is available (used for embeddings only)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Embedding device: {device}")

# Verify Ollama is reachable and model exists
models = ollama.list()
model_names = [m.model for m in models.models]
print(f"Available Ollama models: {model_names}")

OLLAMA_MODEL = "qwen2.5:7b-instruct-q4_K_M"   # ← change tag if yours differs
if not any(OLLAMA_MODEL in m for m in model_names):
    print(f"[WARNING] '{OLLAMA_MODEL}' not found. Run: ollama pull {OLLAMA_MODEL}")
else:
    print(f"[OK] Model '{OLLAMA_MODEL}' is available.")


# In[3]:


import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# -------------------------------
# PDF URLs
# -------------------------------
NARC_URL = "https://env.narc.gov.np/uploads/documents/1736849201.pdf"
MOALD_URL = (
    "https://giwmscdnone.gov.np/media/pdf_upload/"
    "MOALD-Statical-Book-Magre-2081-Final_wgfs8ph.pdf"
)
FAO_SOIL_URL = (
    "https://openknowledge.fao.org/server/api/core/bitstreams/"
    "1bd0747c-e9d8-4b28-99bf-55684d121e38/content"
)
FAO_GFSAD_URL = (
    "https://openknowledge.fao.org/server/api/core/bitstreams/"
    "587935ca-862d-4471-9496-7f114631225f/content"
)

# -------------------------------
# File names
# -------------------------------
NARC_FILE = "NARC.pdf"
MOALD_FILE = "MOALD.pdf"
FAO_SOIL_FILE = "FAO_SOIL.pdf"
FAO_GFSAD_FILE = "FAO_GFSAD.pdf"

PDF_FILES = [
    (NARC_FILE, NARC_URL),
    (MOALD_FILE, MOALD_URL),
    (FAO_SOIL_FILE, FAO_SOIL_URL),
    (FAO_GFSAD_FILE, FAO_GFSAD_URL),
]


def create_session():
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[403, 429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/137.0.0.0 Safari/537.36"
        ),
        "Accept": "application/pdf,application/octet-stream,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
        "Connection": "keep-alive",
    })
    return session


def download_pdf(file_path, url):
    if os.path.exists(file_path):
        print(f"[INFO] File already exists: {file_path}")
        return
    print(f"[INFO] Downloading: {file_path}")
    session = create_session()
    try:
        response = session.get(url, stream=True, timeout=30, allow_redirects=True)
        response.raise_for_status()
        with open(file_path, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)
        print(f"[SUCCESS] Saved as: {file_path}")
    except requests.exceptions.HTTPError as e:
        print(f"[HTTP ERROR] {file_path}: {e}")
    except requests.exceptions.ConnectionError:
        print(f"[ERROR] Connection failed for {file_path}")
    except requests.exceptions.Timeout:
        print(f"[ERROR] Timeout while downloading {file_path}")
    except Exception as e:
        print(f"[ERROR] Failed to download {file_path}: {e}")


for file_path, url in PDF_FILES:
    download_pdf(file_path, url)


# In[4]:


import fitz  # PyMuPDF
from tqdm.auto import tqdm
import random


def text_formatter(text: str) -> str:
    """Performs minor formatting on text."""
    cleaned_text = text.replace("\n", " ").strip()
    return cleaned_text


def open_and_read_pdf(pdf_path: str, source_tag: str = "") -> list:
    """Open a PDF and return a list of page dicts with text and stats."""
    doc = fitz.open(pdf_path)
    pages_and_texts = []
    for page_number, page in tqdm(enumerate(doc), desc=f"Reading {pdf_path}"):
        text = page.get_text()
        text = text_formatter(text=text)
        pages_and_texts.append({
            "source": source_tag,
            "page_number": page_number,
            "page_char_count": len(text),
            "page_word_count": len(text.split(" ")),
            "page_sentence_count_raw": len(text.split(". ")),
            "page_token_count": len(text) / 4,  # token ~ 4 chars
            "text": text
        })
    return pages_and_texts


# Read all 4 PDFs and combine
pages_and_texts = []
for file_path, _ in PDF_FILES:
    source_tag = file_path.replace(".pdf", "")
    pages = open_and_read_pdf(pdf_path=file_path, source_tag=source_tag)
    pages_and_texts.extend(pages)
    print(f"  → {file_path}: {len(pages)} pages")

print(f"\nTotal pages across all PDFs: {len(pages_and_texts)}")
pages_and_texts[:2]


# In[5]:


import pandas as pd

df = pd.DataFrame(pages_and_texts)
df.head()


# In[6]:


df.describe().round(2)


# In[7]:


from spacy.lang.en import English

nlp = English()
nlp.add_pipe("sentencizer")

# Quick sanity check
doc = nlp("This is a sentence. This is another sentence. I like soil science.")
assert len(list(doc.sents)) == 3
list(doc.sents)


# In[8]:


for item in tqdm(pages_and_texts, desc="Splitting sentences"):
    item["sentences"] = [str(s) for s in nlp(item["text"]).sents]
    item["page_sentence_count_spacy"] = len(item["sentences"])

# Show a sample
random.sample(pages_and_texts, k=1)


# In[9]:


df = pd.DataFrame(pages_and_texts)
df.describe().round(2)


# In[10]:


num_sentence_chunk_size = 10

def split_list(input_list: list, slice_size: int = num_sentence_chunk_size) -> list:
    """Split a list into chunks of slice_size."""
    return [input_list[i:i + slice_size] for i in range(0, len(input_list), slice_size)]

# Quick test
test_list = list(range(25))
split_list(test_list)  # [[0..9], [10..19], [20..24]]


# In[11]:


for item in tqdm(pages_and_texts, desc="Chunking"):
    item["sentence_chunks"] = split_list(input_list=item["sentences"],
                                          slice_size=num_sentence_chunk_size)
    item["num_chunks"] = len(item["sentence_chunks"])

df = pd.DataFrame(pages_and_texts)
df.describe().round(2)


# In[12]:


import re

pages_and_chunks = []
for item in tqdm(pages_and_texts, desc="Flattening chunks"):
    for sentence_chunk in item["sentence_chunks"]:
        chunk_dict = {}
        chunk_dict["source"] = item["source"]
        chunk_dict["page_number"] = item["page_number"]

        # Join sentences into a paragraph
        joined_sentence_chunk = "".join(sentence_chunk).replace("  ", " ").strip()
        # Add space after period before capital letter
        joined_sentence_chunk = re.sub(r'\.([A-Z])', r'. \1', joined_sentence_chunk)

        chunk_dict["sentence_chunk"] = joined_sentence_chunk
        chunk_dict["chunk_char_count"] = len(joined_sentence_chunk)
        chunk_dict["chunk_word_count"] = len(joined_sentence_chunk.split(" "))
        chunk_dict["chunk_token_count"] = len(joined_sentence_chunk) / 4

        pages_and_chunks.append(chunk_dict)

print(f"Total chunks: {len(pages_and_chunks)}")
random.sample(pages_and_chunks, 1)


# In[13]:


df = pd.DataFrame(pages_and_chunks)
df.describe().round(2)


# In[14]:


min_token_length = 30

# Show some short chunks to understand what we're removing
for row in df[df["chunk_token_count"] <= min_token_length].sample(5).iterrows():
    print(f'Tokens: {row[1]["chunk_token_count"]} | Source: {row[1]["source"]} | Text: {row[1]["sentence_chunk"]}')


# In[15]:


pages_and_chunks_over_min_token_len = df[df["chunk_token_count"] > min_token_length].to_dict(orient="records")
print(f"Chunks remaining after filter: {len(pages_and_chunks_over_min_token_len)}")
pages_and_chunks_over_min_token_len[:2]


# In[16]:


from sentence_transformers import SentenceTransformer

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

embedding_model = SentenceTransformer(
    model_name_or_path="all-mpnet-base-v2",
    device=device
)

# Quick test
test_embed = embedding_model.encode(["soil pH affects crop yield"])
print(f"Embedding shape: {test_embed.shape}")


# In[17]:


# Embed all chunks (batched for speed)
text_chunks = [item["sentence_chunk"] for item in pages_and_chunks_over_min_token_len]
print(f"Embedding {len(text_chunks)} chunks...")

text_chunk_embeddings = embedding_model.encode(
    text_chunks,
    batch_size=16,
    convert_to_tensor=True,
    show_progress_bar=True
)
print(f"Embeddings shape: {text_chunk_embeddings.shape}")


# In[18]:


# Also store embedding per chunk item (for CSV save)
for i, item in enumerate(pages_and_chunks_over_min_token_len):
    item["embedding"] = text_chunk_embeddings[i].cpu().numpy()


# In[19]:


text_chunks_and_embeddings_df = pd.DataFrame(pages_and_chunks_over_min_token_len)
embeddings_df_save_path = "text_chunks_and_embeddings_df.csv"
text_chunks_and_embeddings_df.to_csv(embeddings_df_save_path, index=False)
print(f"Saved {len(text_chunks_and_embeddings_df)} rows to {embeddings_df_save_path}")
text_chunks_and_embeddings_df.head()


# In[20]:


import numpy as np
import torch
import pandas as pd

device = "cuda" if torch.cuda.is_available() else "cpu"

# Load from CSV
text_chunks_and_embeddings_df = pd.read_csv("text_chunks_and_embeddings_df.csv")

# Convert string representation back to numpy array
text_chunks_and_embeddings_df["embedding"] = text_chunks_and_embeddings_df["embedding"].apply(
    lambda x: np.fromstring(x.strip("[]"), sep=" ")
)

# Stack into a torch tensor on GPU/CPU
embeddings = torch.tensor(
    np.stack(text_chunks_and_embeddings_df["embedding"].tolist(), axis=0),
    dtype=torch.float32
).to(device)

# Convert to list of dicts for lookup
pages_and_chunks = text_chunks_and_embeddings_df.to_dict(orient="records")

print(f"Embeddings shape: {embeddings.shape}")
print(f"Total chunks loaded: {len(pages_and_chunks)}")


# In[21]:


# Reload embedding model
from sentence_transformers import SentenceTransformer, util

embedding_model = SentenceTransformer(
    model_name_or_path="all-mpnet-base-v2",
    device=device
)


# In[22]:


from time import perf_counter as timer
import textwrap

def print_wrap(text: str, width: int = 100):
    wrapped = textwrap.fill(text, width=width)
    print(wrapped)


def retrieve_relevant_resources(
    query: str,
    embeddings: torch.Tensor,
    model: SentenceTransformer = embedding_model,
    n_resources_to_return: int = 5,
    print_time: bool = True
):
    """
    Embed a query and return the top-k scores and indices from the embedding store.
    """
    query_embedding = model.encode(query, convert_to_tensor=True)

    start_time = timer()
    dot_scores = util.dot_score(query_embedding, embeddings)[0]
    end_time = timer()

    if print_time:
        print(f"[INFO] Time taken to get scores on ({len(embeddings)} embeddings : {end_time - start_time:.5f} seconds.)")

    scores, indices = torch.topk(input=dot_scores, k=n_resources_to_return)
    return scores, indices


def print_top_results_and_scores(
    query: str,
    embeddings: torch.Tensor,
    pages_and_chunks: list = pages_and_chunks,
    n_resources_to_return: int = 5
):
    scores, indices = retrieve_relevant_resources(
        query=query, embeddings=embeddings, n_resources_to_return=n_resources_to_return
    )
    for score, idx in zip(scores, indices):
        print(f"Score: {score:.4f} | Source: {pages_and_chunks[idx]['source']} | Page: {pages_and_chunks[idx]['page_number']}")
        print("Text:")
        print_wrap(pages_and_chunks[idx]["sentence_chunk"])
        print("\n")


# In[23]:


# Test retrieval
query = "What is the best crop for clay loam soil in Nepal?"
print(f"Query: {query}")
print_top_results_and_scores(query=query, embeddings=embeddings)


# In[24]:


# Another test
query = "fertilizer urea application Nepal"
print(f"Query: {query}")
print_top_results_and_scores(query=query, embeddings=embeddings)


# In[25]:


def dot_product(vector1, vector2):
    return torch.dot(vector1, vector2)

def cosine_similarity(vector1, vector2):
    dot = torch.dot(vector1, vector2)
    norm1 = torch.sqrt(torch.sum(vector1 ** 2))
    norm2 = torch.sqrt(torch.sum(vector2 ** 2))
    return dot / (norm1 * norm2)

v1 = torch.tensor([1, 2, 3], dtype=torch.float32)
v2 = torch.tensor([1, 2, 3], dtype=torch.float32)
v3 = torch.tensor([4, 5, 6], dtype=torch.float32)

print("Dot product v1·v2:", dot_product(v1, v2))
print("Dot product v1·v3:", dot_product(v1, v3))
print("Cosine sim v1,v2:", cosine_similarity(v1, v2))
print("Cosine sim v1,v3:", cosine_similarity(v1, v3))


# ## LLM Setup — Ollama
# 
# We skip GPU-memory-based model selection entirely.
# Ollama manages memory, quantization (Q4), and inference internally.
# 

# In[26]:


# Model is already set above; just confirm
print(f"LLM backend : Ollama")
print(f"Model       : {OLLAMA_MODEL}")
print(f"Quantization: Q4 (managed by Ollama)")


# In[50]:


import ollama

def ollama_generate(prompt: str, temperature: float = 0.7, max_new_tokens: int = 512) -> str:
    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": temperature,
            "num_predict": max_new_tokens,
            "num_ctx": 4096,
            "stop": ["\n\n\n", "Note:", "Remember:"]  # ← cuts rambling endings
        }
    )
    return response["message"]["content"]

# Quick smoke test
test_reply = ollama_generate("Say 'Ollama is ready' in one sentence.")
print(test_reply)


# *(Model parameter/memory stats are not applicable when using Ollama — the model runs as a separate process.)*
# 

# In[28]:


# Confirm embedding device
print(f"Embedding device: {device}")


# In[29]:


input_text = "What are the main cereal crops grown in Nepal?"
print(f"Input text: {input_text}")

# With Ollama we pass the message directly — no manual chat-template needed
reply = ollama_generate(input_text)
print(f"\nResponse:\n{reply}")


# In[30]:


from time import perf_counter as timer

start = timer()
reply = ollama_generate("What are the main cereal crops grown in Nepal?", max_new_tokens=256)
end = timer()
print(f"Response time: {end - start:.2f}s")
print(reply)


# In[41]:


from dataclasses import dataclass
from typing import Optional

@dataclass
class SoilSenseInput:
    # From ResNet
    soil_type: str           # e.g. "Red_Soil"
    confidence: float        # e.g. 0.78

    # From GPS / device
    location: str            # e.g. "Kathmandu Valley, Nepal"
    elevation_m: float       # e.g. 1340

    # From weather API
    temp_celsius: float
    humidity_percent: float
    rainfall_last_7d_mm: float
    rainfall_forecast_14d_mm: float
    season: str              # e.g. "Pre-monsoon transitional"
    days_since_last_rain: int

    # From user
    query: str


# In[51]:


def prompt_formatter(input_data: SoilSenseInput, context_items: list) -> str:

    soil_props = SOIL_PROPERTIES.get(input_data.soil_type, {})
    soil_name = input_data.soil_type.replace("_", " ")

    soil_block = ""
    if soil_props:
        soil_block = (
            f"Soil: {soil_name} | pH: {soil_props['pH_range']} | "
            f"N: {soil_props['Nitrogen_N']} | P: {soil_props['Phosphorus_P']} | "
            f"K: {soil_props['Potassium_K']} | Confidence: {input_data.confidence*100:.0f}%"
        )

    weather_block = (
        f"Location: {input_data.location} | Elevation: {input_data.elevation_m}m | "
        f"Season: {input_data.season} | Temp: {input_data.temp_celsius}°C | "
        f"Humidity: {input_data.humidity_percent}% | "
        f"Rain last 7d: {input_data.rainfall_last_7d_mm}mm | "
        f"Forecast 14d: {input_data.rainfall_forecast_14d_mm}mm | "
        f"Days since rain: {input_data.days_since_last_rain}"
    )

    # Take only top 3 chunks instead of 5, and truncate each to 200 chars
    top_chunks = context_items[:3]
    pdf_context = "\n".join([
        f"- {item['sentence_chunk'][:200]}..." for item in top_chunks
    ])

    confidence_note = (
        f" (low confidence: {input_data.confidence*100:.0f}%, treat soil type as approximate)"
        if input_data.confidence < 0.80 else ""
    )

    prompt = f"""You are an agricultural advisor for Nepal. Answer concisely in 3-5 bullet points max.
No explanations unless critical. Be specific with quantities and timing.
{confidence_note}

CONTEXT:
{soil_block}
{weather_block}

DOCUMENTS:
{pdf_context}

QUERY: {input_data.query}

ANSWER (bullet points only, max 5):"""

    return prompt


# In[44]:


def ask(
    input_data: SoilSenseInput,
    temperature: float = 0.7,
    max_new_tokens: int = 512,      # increased — richer context = longer answers
    return_answer_only: bool = True
):
    ## RETRIEVAL — use query + soil type for better hits
    enriched_query = f"{input_data.query} {input_data.soil_type.replace('_', ' ')} Nepal"
    scores, indices = retrieve_relevant_resources(query=enriched_query, embeddings=embeddings)
    context_items = [pages_and_chunks[i] for i in indices]
    for i, item in enumerate(context_items):
        item["score"] = scores[i].cpu()

    ## AUGMENT
    prompt = prompt_formatter(input_data=input_data, context_items=context_items)

    ## GENERATE
    answer = ollama_generate(prompt, temperature=temperature, max_new_tokens=max_new_tokens)

    return answer if return_answer_only else (answer, context_items)


# In[48]:


import json

with open("soil_prop.json") as f:
    SOIL_PROPERTIES = json.load(f)


# In[52]:


# ── Test 1: Crop recommendation with full context ─────────────────────────
input1 = SoilSenseInput(
    soil_type="Red_Soil", confidence=0.78,
    location="Kathmandu Valley, Nepal", elevation_m=1340,
    temp_celsius=24, humidity_percent=68,
    rainfall_last_7d_mm=12, rainfall_forecast_14d_mm=45,
    season="Pre-monsoon transitional", days_since_last_rain=2,
    query="What crops should I grow and what soil treatments are needed?"
)
print(f"Query: {input1.query}")
print_wrap(ask(input_data=input1, temperature=0.4))

