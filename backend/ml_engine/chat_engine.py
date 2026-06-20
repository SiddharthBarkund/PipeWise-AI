"""
PipeWise-AI — AI-Powered Data Analysis Chatbot
Uses Google Gemini + Groq (fallback) with rich dataset context.
Fallback chain: Gemini → Groq → Rule-based.
"""

import os
import traceback
import numpy as np
import pandas as pd
from dotenv import load_dotenv

# Load .env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# --- Gemini Setup ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None
gemini_model = None

if GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_model = "gemini-2.0-flash"
        print("✅ Gemini AI chatbot initialized successfully")
    except Exception as e:
        print(f"⚠️ Gemini setup failed: {e}")
        gemini_client = None
        gemini_model = None
else:
    print("⚠️ GEMINI_API_KEY not set.")

# --- Groq Setup ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None

if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq AI chatbot initialized successfully")
    except Exception as e:
        print(f"⚠️ Groq setup failed: {e}")
        groq_client = None
else:
    print("⚠️ GROQ_API_KEY not set.")

if not gemini_client and not groq_client:
    print("⚠️ No AI API configured. Using rule-based chat fallback.")


def _build_dataset_context(df, filename):
    """Build a rich context string from the dataframe for Gemini."""
    context_parts = []

    # Basic info
    context_parts.append(f"Dataset: {filename}")
    context_parts.append(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")

    # Column info with types
    col_info = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        nunique = df[col].nunique()
        missing = int(df[col].isnull().sum())
        col_info.append(f"  - {col} (type: {dtype}, unique: {nunique}, missing: {missing})")
    context_parts.append("Columns:\n" + "\n".join(col_info))

    # Statistics for numeric columns
    numeric_df = df.select_dtypes(include=["number"])
    if not numeric_df.empty:
        desc = numeric_df.describe().round(3).to_string()
        context_parts.append(f"Numeric Statistics:\n{desc}")

    # Correlation matrix (top pairs)
    if numeric_df.shape[1] >= 2:
        corr = numeric_df.corr()
        pairs = []
        for i in range(len(corr.columns)):
            for j in range(i + 1, len(corr.columns)):
                val = corr.iloc[i, j]
                if not np.isnan(val):
                    pairs.append((corr.columns[i], corr.columns[j], val))
        pairs.sort(key=lambda x: abs(x[2]), reverse=True)
        top_corr = pairs[:10]
        if top_corr:
            corr_str = "\n".join([f"  - {a} ↔ {b}: {c:.4f}" for a, b, c in top_corr])
            context_parts.append(f"Top Correlations:\n{corr_str}")

    # Missing values summary
    missing = df.isnull().sum()
    missing = missing[missing > 0]
    if not missing.empty:
        missing_str = "\n".join([f"  - {col}: {int(v)} ({v/len(df)*100:.1f}%)" for col, v in missing.items()])
        context_parts.append(f"Missing Values:\n{missing_str}")
    else:
        context_parts.append("Missing Values: None ✅")

    # Sample data (first 5 rows)
    sample = df.head(5).to_string()
    context_parts.append(f"Sample Data (first 5 rows):\n{sample}")

    # Categorical columns value counts
    cat_cols = df.select_dtypes(include=["object", "category"]).columns
    if len(cat_cols) > 0:
        cat_info = []
        for col in cat_cols[:5]:  # Limit to 5 categorical columns
            top_vals = df[col].value_counts().head(5)
            vals_str = ", ".join([f"{v}({c})" for v, c in top_vals.items()])
            cat_info.append(f"  - {col}: {vals_str}")
        context_parts.append(f"Categorical Columns (top values):\n" + "\n".join(cat_info))

    # Duplicate info
    dupes = int(df.duplicated().sum())
    context_parts.append(f"Duplicate Rows: {dupes}")

    return "\n\n".join(context_parts)


def _compute_ml_metrics(df, question):
    """Pre-compute ML metrics if the question asks about model performance."""
    question_lower = question.lower()
    
    ml_keywords = ["r2", "r²", "r square", "accuracy", "score", "train", "model",
                   "linear regression", "random forest", "decision tree", "regression",
                   "classification", "predict", "mse", "rmse", "mae", "f1"]
    
    if not any(kw in question_lower for kw in ml_keywords):
        return ""

    numeric_df = df.select_dtypes(include=["number"])
    if numeric_df.shape[1] < 2:
        return "\n\n[ML Note: Not enough numeric columns to compute ML metrics.]"

    try:
        from sklearn.model_selection import train_test_split
        from sklearn.linear_model import LinearRegression
        from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
        from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
        from sklearn.metrics import (
            r2_score, mean_squared_error, mean_absolute_error,
            accuracy_score, f1_score, classification_report
        )

        results = []
        results.append("\n\n--- Pre-Computed ML Metrics (for reference) ---")

        # Try each numeric column as potential target
        target_col = None
        # Check if user mentioned a specific column
        for col in df.columns:
            if col.lower() in question_lower:
                target_col = col
                break

        # If no specific target, use last numeric column
        if target_col is None:
            target_col = numeric_df.columns[-1]

        # Prepare data
        feature_cols = [c for c in numeric_df.columns if c != target_col]
        if len(feature_cols) == 0:
            return "\n\n[ML Note: Only one numeric column available, cannot split into features and target.]"

        X = numeric_df[feature_cols].dropna()
        y = df.loc[X.index, target_col].dropna()
        common_idx = X.index.intersection(y.index)
        X = X.loc[common_idx]
        y = y.loc[common_idx]

        if len(X) < 10:
            return "\n\n[ML Note: Not enough clean data points to train a model.]"

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Determine if classification or regression
        unique_target = y.nunique()
        is_classification = unique_target <= 20 and (y.dtype == "object" or unique_target / len(y) < 0.05)

        results.append(f"Target Column: {target_col}")
        results.append(f"Feature Columns: {', '.join(feature_cols)}")
        results.append(f"Train/Test Split: {len(X_train)}/{len(X_test)} samples")
        results.append(f"Task Type: {'Classification' if is_classification else 'Regression'}")

        if is_classification:
            # Classification models
            models = {
                "Random Forest Classifier": RandomForestClassifier(n_estimators=100, random_state=42),
                "Decision Tree Classifier": DecisionTreeClassifier(random_state=42),
            }
            for name, model in models.items():
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                acc = accuracy_score(y_test, y_pred)
                f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
                results.append(f"\n{name}:")
                results.append(f"  Accuracy: {acc:.4f} ({acc*100:.2f}%)")
                results.append(f"  F1 Score (weighted): {f1:.4f}")
        else:
            # Regression models
            models = {
                "Linear Regression": LinearRegression(),
                "Random Forest Regressor": RandomForestRegressor(n_estimators=100, random_state=42),
                "Decision Tree Regressor": DecisionTreeRegressor(random_state=42),
            }
            for name, model in models.items():
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                r2 = r2_score(y_test, y_pred)
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                mae = mean_absolute_error(y_test, y_pred)
                results.append(f"\n{name}:")
                results.append(f"  R² Score: {r2:.4f} ({r2*100:.2f}%)")
                results.append(f"  MSE: {mse:.4f}")
                results.append(f"  RMSE: {rmse:.4f}")
                results.append(f"  MAE: {mae:.4f}")

            # Feature importance from Random Forest
            rf = models["Random Forest Regressor"]
            importances = sorted(
                zip(feature_cols, rf.feature_importances_),
                key=lambda x: x[1], reverse=True
            )
            imp_str = "\n".join([f"  - {feat}: {imp:.4f}" for feat, imp in importances[:10]])
            results.append(f"\nFeature Importance (Random Forest):\n{imp_str}")

        return "\n".join(results)

    except Exception as e:
        return f"\n\n[ML Computation Error: {str(e)}]"


SYSTEM_PROMPT = """You are **PipeWise AI Assistant** — an expert data analyst and ML engineer embedded in a data pipeline tool called PipeWise-AI.

## Your Capabilities:
- You have FULL access to the user's loaded dataset (metadata, statistics, sample rows, correlations — all provided below)
- You can interpret pre-computed ML model results (R², accuracy, MSE, etc.)
- You provide actionable insights, not just raw numbers
- You explain things clearly for both beginners and advanced users

## Response Guidelines:
1. **Be specific** — Always reference actual column names, values, and numbers from the dataset
2. **Use markdown formatting** — Bold for emphasis, code blocks for data, bullet points for lists
3. **Be concise but thorough** — Give the answer first, then explain if needed
4. **Suggest next steps** — After answering, suggest what the user should do next
5. **Handle ML questions** — When ML metrics are pre-computed, interpret them (e.g., "R² of 0.85 means the model explains 85% of variance — that's good!")
6. **Multi-language support** — If the user asks in Hindi/Marathi, respond in that language
7. **Be proactive** — Point out interesting patterns, outliers, or potential issues you notice

## Important Rules:
- NEVER make up data. Only use the information provided in the dataset context.
- If you don't have enough information, say so and suggest what data might help.
- When discussing ML metrics, always explain what the numbers mean in practical terms.
- If pre-computed ML metrics are available, use them to give precise answers about model performance.
"""


def _call_gemini(prompt):
    """Call Gemini API."""
    response = gemini_client.models.generate_content(
        model=gemini_model,
        contents=prompt
    )
    return response.text


def _call_groq(prompt):
    """Call Groq API (uses Llama 3 models — blazing fast)."""
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        max_tokens=2048,
    )
    return response.choices[0].message.content


def generate_chat_response(df, filename, question):
    """Generate AI-powered chat response. Fallback: Gemini → Groq → Rule-based."""

    # Build rich dataset context
    dataset_context = _build_dataset_context(df, filename)

    # Pre-compute ML metrics if relevant
    ml_context = _compute_ml_metrics(df, question)

    full_prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"## Dataset Context:\n{dataset_context}"
        f"{ml_context}\n\n"
        f"## User Question:\n{question}"
    )

    # Try Gemini first
    if gemini_client and gemini_model:
        try:
            return _call_gemini(full_prompt)
        except Exception as e:
            print(f"⚠️ Gemini failed: {e}")

    # Fallback to Groq
    if groq_client:
        try:
            return _call_groq(full_prompt)
        except Exception as e:
            print(f"⚠️ Groq failed: {e}")

    # Final fallback: rule-based
    return _rule_based_response(df, filename, question)


def _rule_based_response(df, filename, question):
    """Fallback rule-based chat responses (original implementation)."""
    question = question.lower().strip()

    if any(w in question for w in ["shape", "size", "how many rows", "how many columns", "kitne rows"]):
        return f"The dataset has **{df.shape[0]}** rows and **{df.shape[1]}** columns."

    elif any(w in question for w in ["missing", "null", "nan", "empty"]):
        missing = df.isnull().sum()
        missing = missing[missing > 0]
        if missing.empty:
            return "No missing values found in the dataset! ✅"
        total = int(missing.sum())
        details = ", ".join([f"**{col}**: {int(v)}" for col, v in missing.items()])
        return f"Total missing values: **{total}**.\n\nBreakdown: {details}"

    elif any(w in question for w in ["column", "columns", "features", "fields"]):
        cols = ", ".join([f"`{c}`" for c in df.columns])
        return f"The dataset has {df.shape[1]} columns: {cols}"

    elif any(w in question for w in ["types", "dtype", "data type"]):
        types = "\n".join([f"- **{col}**: `{dtype}`" for col, dtype in df.dtypes.items()])
        return f"Data types:\n{types}"

    elif any(w in question for w in ["describe", "statistics", "stats", "summary"]):
        desc = df.describe().round(2)
        return f"Statistics summary:\n\n```\n{desc.to_string()}\n```"

    elif any(w in question for w in ["correlat", "correlated"]):
        numeric_df = df.select_dtypes(include=["number"])
        if numeric_df.shape[1] < 2:
            return "Not enough numeric columns to compute correlations."
        corr = numeric_df.corr()
        pairs = []
        for i in range(len(corr.columns)):
            for j in range(i + 1, len(corr.columns)):
                pairs.append((corr.columns[i], corr.columns[j], abs(corr.iloc[i, j])))
        pairs.sort(key=lambda x: x[2], reverse=True)
        top = pairs[:5]
        details = "\n".join([f"- **{a}** ↔ **{b}**: {c:.3f}" for a, b, c in top])
        return f"Top 5 most correlated feature pairs:\n{details}"

    elif any(w in question for w in ["unique", "distinct", "categories"]):
        unique = df.nunique()
        details = "\n".join([f"- **{col}**: {int(v)} unique values" for col, v in unique.items()])
        return f"Unique values per column:\n{details}"

    elif any(w in question for w in ["duplicate", "dup"]):
        dupes = int(df.duplicated().sum())
        return f"The dataset has **{dupes}** duplicate row(s)." + (" All rows are unique! ✅" if dupes == 0 else "")

    elif any(w in question for w in ["head", "preview", "first", "sample"]):
        preview = df.head(5).to_string()
        return f"First 5 rows:\n\n```\n{preview}\n```"

    elif any(w in question for w in ["target", "predict", "what should i"]):
        return f"Based on your dataset columns ({', '.join(df.columns[:8])}), choose the column you want to predict as the **target**. Use the remaining columns as features. Go to the **Train Model** step to get started!"

    else:
        return (
            f"I have your dataset **{filename}** loaded with {df.shape[0]} rows × {df.shape[1]} columns.\n\n"
            "Try asking me about:\n"
            "- Missing values\n"
            "- Column types\n"
            "- Statistics / describe\n"
            "- Top correlations\n"
            "- Unique values\n"
            "- Duplicates\n"
            "- Dataset shape\n"
            "- Train a model / R² score\n"
            "- Feature importance"
        )
