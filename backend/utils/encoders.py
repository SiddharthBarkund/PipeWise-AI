import pandas as pd
from sklearn.preprocessing import LabelEncoder

def encode_categorical_features(X):
    """Encode categorical features in the dataframe using LabelEncoder."""
    label_encoders = {}
    for col in X.select_dtypes(include=["object", "category"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le
    return X, label_encoders

def encode_target(y):
    """Encode string target variable for classification."""
    if y.dtype == "object":
        target_le = LabelEncoder()
        y_encoded = pd.Series(target_le.fit_transform(y))
        return y_encoded, target_le
    return y, None
