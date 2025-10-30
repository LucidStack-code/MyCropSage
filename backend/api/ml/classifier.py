# backend/api/ml/classifier.py
import re
import joblib
import os
import torch
from transformers import pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from api.models import Problem
from deep_translator import GoogleTranslator
from functools import lru_cache

MODEL_PATH = "api/ml/crop_model.pkl"

# ✅ Load multilingual zero-shot model (XLM-RoBERTa)
try:
    device = 0 if torch.cuda.is_available() else -1
    classifier = pipeline(
        "zero-shot-classification",
        model="joeddav/xlm-roberta-large-xnli",
        device=device
    )
    print("✅ XLM-RoBERTa multilingual model loaded.")
except Exception as e:
    print("⚠️ Warning: Transformer model not loaded:", e)
    classifier = None


# 🧠 Language detection (English / Hindi / Marathi)
def detect_language(text):
    """Rough Unicode-based language detection."""
    for ch in text:
        if '\u0900' <= ch <= '\u097F':
            return "hi"  # Hindi / Marathi
        if '\u0A80' <= ch <= '\u0AFF':
            return "mr"
    return "en"


# 🌐 Translation helpers
def translate_to_english_if_needed(text):
    """Translate Hindi/Marathi text to English if needed."""
    lang = detect_language(text)
    if lang != "en":
        try:
            translated = GoogleTranslator(source="auto", target="en").translate(text)
            print(f"🌐 Translated ({lang} → en): {translated}")
            return translated, lang
        except Exception as e:
            print("⚠️ Translation failed:", e)
            return text, lang
    return text, lang


def translate_output_back(output, target_lang):
    """Safely translate issue + remedies back to Hindi/Marathi."""
    if target_lang == "en":
        return output

    try:
        # 🧠 Translate issue safely
        issue = output.get("issue", "")
        if issue and isinstance(issue, str):
            output["issue"] = GoogleTranslator(source="en", target=target_lang).translate(issue)

        # 🧠 Translate each remedy, skipping invalid ones
        remedies = output["details"].get("remedies", [])
        translated_remedies = []
        for r in remedies:
            if isinstance(r, str) and r.strip() and r.strip() not in ["---", "None", "N/A"]:
                try:
                    translated_remedies.append(
                        GoogleTranslator(source="en", target=target_lang).translate(r.strip())
                    )
                except Exception:
                    translated_remedies.append(r)
            else:
                translated_remedies.append(r)
        output["details"]["remedies"] = translated_remedies

    except Exception as e:
        print(f"⚠️ Reverse translation failed safely: {e}")

    return output


# 🧹 Text cleaner
def clean_text(text):
    text = text.lower().strip()
    return re.sub(r'[^a-zA-Z\u0900-\u097F\u0A80-\u0AFF\s]', '', text)


# ✅ Lightweight ML model
class CropClassifier:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.model = LogisticRegression(max_iter=200)

    def train(self, texts, labels):
        X = self.vectorizer.fit_transform(texts)
        self.model.fit(X, labels)
        joblib.dump((self.vectorizer, self.model), MODEL_PATH)
        print("✅ Model trained and saved successfully at:", MODEL_PATH)

    def predict(self, text):
        if not os.path.exists(MODEL_PATH):
            return None
        self.vectorizer, self.model = joblib.load(MODEL_PATH)
        X = self.vectorizer.transform([text])
        return self.model.predict(X)[0]


# 🧩 Dynamic problem fetching
_problem_cache = None

def get_dynamic_problems(force_refresh=False):
    """Fetch problems and remedies dynamically with fallback."""
    global _problem_cache
    if _problem_cache and not force_refresh:
        return _problem_cache

    problems = {}
    for p in Problem.objects.all():
        causes, remedies = [], []

        if isinstance(p.causes, list):
            causes = [str(c).strip(" []'\"") for c in p.causes]
        elif isinstance(p.causes, str):
            causes = [c.strip(" []'\"") for c in p.causes.split(",") if c.strip()]

        if isinstance(p.remedies, list):
            remedies = [str(r).strip(" []'\"") for r in p.remedies]
        elif isinstance(p.remedies, str):
            remedies = [r.strip(" []'\"") for r in p.remedies.split(",") if r.strip()]

        problems[p.name] = {"causes": causes, "remedies": remedies}

    # Fallback defaults
    if not problems:
        problems = {
            "Nitrogen Deficiency": {
                "causes": ["yellow leaves", "pale green leaves"],
                "remedies": ["Apply urea", "Use organic compost"]
            },
            "Iron Deficiency": {
                "causes": ["yellow leaves", "pale veins", "white veins", "chlorosis"],
                "remedies": ["Apply FeSO4", "Use foliar iron spray", "Use iron chelates"]
            },
            "Root Rot": {
                "causes": ["wilting", "rotted roots", "waterlogging"],
                "remedies": ["Avoid overwatering", "Improve soil drainage"]
            },
        }

    _problem_cache = problems
    return problems


def clear_cache():
    """Clear cached problems (when DB updates)."""
    global _problem_cache
    _problem_cache = None
    print("🧹 Problem cache cleared!")


# 🧠 Unified Prediction Logic
def predict_issue(text):
    original_text = text
    text, detected_lang = translate_to_english_if_needed(text)
    text = clean_text(text)

    problems = get_dynamic_problems()
    labels = list(problems.keys())

    # --- Step 1: Custom ML model prediction ---
    clf = CropClassifier()
    custom_pred = None
    if os.path.exists(MODEL_PATH):
        try:
            custom_pred = clf.predict(text)
        except Exception:
            pass

    # --- Step 2: Zero-shot multilingual model ---
    bert_pred, confidence = None, 0.0
    if classifier:
        result = classifier(
            text,
            candidate_labels=labels,
            hypothesis_template="This text is about {}."
        )
        bert_pred = result["labels"][0]
        confidence = float(result["scores"][0])

    # --- Step 3: Rule-based match ---
    rule_pred, rule_conf = None, 0.0
    for label, data in problems.items():
        for kw in data.get("causes", []):
            if kw.lower() in text:
                rule_pred, rule_conf = label, 0.98
                break
        if rule_pred:
            break

    # --- Step 4: Merge intelligently ---
    final_issue = rule_pred or custom_pred or (
        bert_pred if confidence > 0.45 else "Problem not detected"
    )
    confidence = max(confidence, rule_conf)

    # --- Step 5: Iron Deficiency keyword override ---
    normalized_text = text.replace("  ", " ").strip()
    vein_patterns = ["vein", "veins", "nas", "नसें", "नस", "शिरा", "शिरांचे", "शिरा पांढऱ्या", "पिवळी"]
    if any(word in normalized_text for word in vein_patterns) and (
        "yellow" in normalized_text or "पीली" in normalized_text or "पिवळी" in normalized_text
    ):
        final_issue = "Iron Deficiency"
        confidence = max(confidence, 0.96)

    # --- Step 6: Fetch problem details ---
    details = problems.get(final_issue, {"remedies": [], "causes": []})

    # --- Step 7: Construct final response ---
    output = {
        "input": original_text,
        "translated": text,
        "language": detected_lang,
        "issue": str(final_issue),
        "confidence": round(confidence, 3),
        "details": details,
    }

    # --- Step 8: Translate back to detected language safely ---
    return translate_output_back(output, detected_lang)
