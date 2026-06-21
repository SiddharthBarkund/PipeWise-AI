import pandas as pd
import numpy as np
import seaborn as sns
import io
import os

def load_dataset(file, filename):
    """Load a dataset file using pandas based on extension."""
    ext = filename.lower().split('.')[-1]
    if ext == 'csv':
        df = pd.read_csv(file)
    elif ext in ['xls', 'xlsx']:
        df = pd.read_excel(file)
    elif ext == 'json':
        df = pd.read_json(file)
    elif ext == 'parquet':
        df = pd.read_parquet(file)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
    df.columns = df.columns.str.strip()
    return df

def load_demo_dataset():
    """Load the built-in Titanic demo dataset."""
    try:
        df = sns.load_dataset("titanic")
        filename = "titanic.csv"
    except Exception:
        np.random.seed(42)
        n = 891
        df = pd.DataFrame({
            "PassengerId": range(1, n + 1),
            "Survived": np.random.choice([0, 1], n, p=[0.62, 0.38]),
            "Pclass": np.random.choice([1, 2, 3], n, p=[0.24, 0.21, 0.55]),
            "Name": [f"Passenger_{i}" for i in range(1, n + 1)],
            "Sex": np.random.choice(["male", "female"], n, p=[0.65, 0.35]),
            "Age": np.where(np.random.random(n) > 0.2, np.random.normal(30, 14, n).round(1), np.nan),
            "SibSp": np.random.choice(range(6), n, p=[0.68, 0.23, 0.05, 0.02, 0.01, 0.01]),
            "Parch": np.random.choice(range(4), n, p=[0.76, 0.13, 0.09, 0.02]),
            "Fare": np.round(np.random.exponential(32, n), 2),
            "Embarked": np.random.choice(["S", "C", "Q", np.nan], n, p=[0.70, 0.19, 0.09, 0.02]),
        })
        filename = "titanic_demo.csv"
    df.columns = df.columns.str.strip()
    return df, filename

def get_basic_meta(df, file=None):
    """Calculate basic metadata for a dataframe."""
    total_missing = int(df.isnull().sum().sum())
    total_cells = int(df.shape[0] * df.shape[1])
    missing_pct = round((total_missing / total_cells) * 100, 1) if total_cells > 0 else 0
    file_size = 0
    if file:
        file_size = file.seek(0, 2)
        file.seek(0)
    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "fileSize": file_size,
        "totalMissing": total_missing,
        "missingPercent": missing_pct,
        "columnNames": df.columns.tolist(),
    }

def export_dataframe(df, filename, fmt):
    """Export the dataframe to a bytes buffer."""
    buf = io.BytesIO()
    download_name = f"{os.path.splitext(filename)[0]}_export"
    mimetype = ""
    
    if fmt == "csv":
        df.to_csv(buf, index=False)
        mimetype = "text/csv"
        download_name += ".csv"
    elif fmt == "json":
        data = df.to_json(orient="records", indent=2)
        buf.write(data.encode())
        mimetype = "application/json"
        download_name += ".json"
    elif fmt == "excel":
        df.to_excel(buf, index=False, engine="openpyxl")
        mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        download_name += ".xlsx"
    else:
        raise ValueError(f"Unsupported format: {fmt}")
        
    buf.seek(0)
    return buf, mimetype, download_name
