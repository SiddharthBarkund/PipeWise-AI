def generate_chat_response(df, filename, question):
    """Rule-based chat responses based on the dataframe."""
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
            "- Dataset shape"
        )
