def get_clean_info(df):
    """Get information about missing values and duplicates."""
    missing = df.isnull().sum().to_dict()
    missing = {k: int(v) for k, v in missing.items()}
    total_missing = int(df.isnull().sum().sum())
    total_cells = int(df.shape[0] * df.shape[1])
    duplicates = int(df.duplicated().sum())

    cols_with_missing = [
        {"name": col, "missing": int(count), "percent": round(count / len(df) * 100, 1)}
        for col, count in missing.items() if count > 0
    ]
    cols_with_missing.sort(key=lambda x: x["missing"], reverse=True)

    return {
        "totalMissing": total_missing,
        "totalCells": total_cells,
        "qualityPercent": round(((total_cells - total_missing) / total_cells) * 100, 1) if total_cells else 100,
        "duplicateRows": duplicates,
        "columnsWithMissing": cols_with_missing,
        "affectedColumns": len(cols_with_missing),
    }

def apply_cleaning(df, action, column=None, fill_value=None, strategy="mean"):
    """Apply a cleaning operation to the dataframe."""
    original_shape = df.shape

    if action == "drop_missing_rows":
        if column:
            df = df.dropna(subset=[column])
        else:
            df = df.dropna()

    elif action == "fill_missing":
        if column:
            if strategy == "mean":
                df[column] = df[column].fillna(df[column].mean())
            elif strategy == "median":
                df[column] = df[column].fillna(df[column].median())
            elif strategy == "mode":
                df[column] = df[column].fillna(df[column].mode().iloc[0] if not df[column].mode().empty else "")
            elif strategy == "value" and fill_value is not None:
                df[column] = df[column].fillna(fill_value)
            elif strategy == "ffill":
                df[column] = df[column].ffill()
            elif strategy == "bfill":
                df[column] = df[column].bfill()
        else:
            numeric_cols = df.select_dtypes(include=["number"]).columns
            df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
            cat_cols = df.select_dtypes(include=["object"]).columns
            for col in cat_cols:
                df[col] = df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else "Unknown")

    elif action == "drop_duplicates":
        df = df.drop_duplicates()

    elif action == "drop_column":
        if column and column in df.columns:
            df = df.drop(columns=[column])

    return df, original_shape
