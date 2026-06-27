import pandas as pd

def get_understand_data(df):
    """Return dataset preview, shape, dtypes, missing values, unique counts."""
    preview = df.head(10).astype(object).fillna("").to_dict(orient="records")
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    missing = df.isnull().sum().to_dict()
    missing = {k: int(v) for k, v in missing.items()}
    unique = df.nunique().to_dict()
    unique = {k: int(v) for k, v in unique.items()}

    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    boolean_cols = df.select_dtypes(include=["bool"]).columns.tolist()

    return {
        "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
        "preview": preview,
        "columnNames": df.columns.tolist(),
        "dtypes": dtypes,
        "missing": missing,
        "unique": unique,
        "numericColumns": numeric_cols,
        "categoricalColumns": categorical_cols,
        "booleanColumns": boolean_cols,
    }

def get_insights(df):
    """Return df.describe() and key statistical insights."""
    desc = df.describe(include="all").round(4)
    describe_dict = {}
    for col in desc.columns:
        describe_dict[col] = {k: (None if pd.isna(v) else (v.item() if hasattr(v, "item") else v)) for k, v in desc[col].items()}

    numeric_df = df.select_dtypes(include=["number"])
    correlation = None
    if numeric_df.shape[1] >= 2:
        corr = numeric_df.corr().round(4)
        correlation = corr.to_dict()

    skewness = {}
    kurtosis = {}
    for col in numeric_df.columns:
        skewness[col] = round(float(numeric_df[col].skew()), 4)
        kurtosis[col] = round(float(numeric_df[col].kurtosis()), 4)

    return {
        "describe": describe_dict,
        "numericColumns": numeric_df.columns.tolist(),
        "correlation": correlation,
        "skewness": skewness,
        "kurtosis": kurtosis,
    }
