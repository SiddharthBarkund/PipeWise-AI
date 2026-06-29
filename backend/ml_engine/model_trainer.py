import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score,
    confusion_matrix, classification_report
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor
from catboost import CatBoostClassifier, CatBoostRegressor

# ---------------------------------------------------------
# Helper Functions (Inlined for Jupyter Lab compatibility)
# ---------------------------------------------------------

def fig_to_base64(fig):
    """Convert matplotlib figure to base64 PNG string for web apps."""
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor="#ffffff")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")

def preprocess_data(df, target_col):
    """Clean missing values and encode categorical features."""
    df_clean = df.dropna()
    if len(df_clean) < 10:
        raise ValueError("Not enough data after removing missing values (need >= 10 rows)")

    X = df_clean.drop(columns=[target_col])
    y = df_clean[target_col]

    # Encode categorical features in X
    for col in X.select_dtypes(include=["object", "category"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))

    # Detect task type and encode target if needed
    if y.dtype == "object" or y.nunique() <= 10:
        task_type = "classification"
        target_le = LabelEncoder()
        y = pd.Series(target_le.fit_transform(y.astype(str)))
    else:
        task_type = "regression"
        target_le = None

    # Scale numerical features
    X_scaled = StandardScaler().fit_transform(X)

    return X_scaled, y, task_type, target_le, X.columns.tolist()

# ---------------------------------------------------------
# Model Definitions
# ---------------------------------------------------------

CLASSIFIERS = {
    "Random Forest": RandomForestClassifier,
    "Decision Tree": DecisionTreeClassifier,
    "Logistic Regression": LogisticRegression,
    "Gradient Boosting": GradientBoostingClassifier,
    "SVM": SVC,
    "KNN": KNeighborsClassifier,
    "Naive Bayes": GaussianNB,
    "XGBoost": XGBClassifier,
    "LightGBM": LGBMClassifier,
    "CatBoost": CatBoostClassifier,
}

REGRESSORS = {
    "Random Forest": RandomForestRegressor,
    "Decision Tree": DecisionTreeRegressor,
    "Linear Regression": LinearRegression,
    "Gradient Boosting": GradientBoostingRegressor,
    "SVR": SVR,
    "KNN": KNeighborsRegressor,
    "XGBoost": XGBRegressor,
    "LightGBM": LGBMRegressor,
    "CatBoost": CatBoostRegressor,
}

# ---------------------------------------------------------
# Main Training Function
# ---------------------------------------------------------

def train_and_evaluate(df, target_col, algorithm, test_size=0.2, task_type=None, jupyter_mode=False):
    """
    Train a machine learning model and return metrics and charts.
    
    Parameters:
    - df: pandas DataFrame containing the data.
    - target_col: Name of the column to predict.
    - algorithm: Name of the model algorithm to use.
    - test_size: Fraction of data to use for testing.
    - task_type: "classification" or "regression" (auto-detected if None).
    - jupyter_mode: If True, renders plots using plt.show() instead of returning base64 strings.
    """
    # 1. Prepare Data
    X_scaled, y, detected_task, target_le, feature_names = preprocess_data(df, target_col)
    task_type = task_type or detected_task

    # 2. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=test_size, random_state=42)

    # 3. Model Initialization
    models_dict = CLASSIFIERS if task_type == "classification" else REGRESSORS
    model_class = models_dict.get(algorithm)
    
    if not model_class:
        raise ValueError(f"Unknown algorithm: {algorithm} for task: {task_type}")
        
    model = model_class()

    # Apply algorithm-specific parameters safely
    if hasattr(model, 'random_state'):
        model.set_params(random_state=42)
    if algorithm == "SVM" and task_type == "classification":
        model.set_params(probability=True, max_iter=1000)
    elif algorithm == "Logistic Regression":
        model.set_params(max_iter=1000)

    # Train and Predict
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    # 4. Evaluation Metrics & Plotting
    metrics, charts = {}, {}

    if task_type == "classification":
        # Metrics
        metrics["accuracy"] = round(accuracy_score(y_test, y_pred), 4)
        metrics["precision"] = round(precision_score(y_test, y_pred, average="weighted", zero_division=0), 4)
        metrics["recall"] = round(recall_score(y_test, y_pred, average="weighted", zero_division=0), 4)
        metrics["f1Score"] = round(f1_score(y_test, y_pred, average="weighted", zero_division=0), 4)
        metrics["classificationReport"] = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

        # Plot: Confusion Matrix
        fig, ax = plt.subplots(figsize=(8, 6))
        labels = target_le.classes_.tolist() if target_le else sorted(y.unique().tolist())
        sns.heatmap(confusion_matrix(y_test, y_pred), annot=True, fmt="d", cmap="Greens", 
                    ax=ax, xticklabels=labels, yticklabels=labels)
        ax.set_xlabel("Predicted", fontweight="bold")
        ax.set_ylabel("Actual", fontweight="bold")
        ax.set_title("Confusion Matrix", fontweight="bold")
        
        if jupyter_mode:
            plt.show()
        else:
            charts["confusionMatrix"] = fig_to_base64(fig)

    else:
        # Metrics
        metrics["mse"] = round(float(mean_squared_error(y_test, y_pred)), 4)
        metrics["rmse"] = round(float(np.sqrt(metrics["mse"])), 4)
        metrics["mae"] = round(float(mean_absolute_error(y_test, y_pred)), 4)
        metrics["r2"] = round(float(r2_score(y_test, y_pred)), 4)

        # Plot: Actual vs Predicted
        fig, ax = plt.subplots(figsize=(8, 6))
        ax.scatter(y_test, y_pred, alpha=0.5, color="#6366f1")
        lims = [min(y_test.min(), y_pred.min()), max(y_test.max(), y_pred.max())]
        ax.plot(lims, lims, "r--", alpha=0.7, label="Perfect Prediction")
        ax.set_xlabel("Actual", fontweight="bold")
        ax.set_ylabel("Predicted", fontweight="bold")
        ax.set_title("Actual vs Predicted", fontweight="bold")
        ax.legend()
        
        if jupyter_mode:
            plt.show()
        else:
            charts["actualVsPredicted"] = fig_to_base64(fig)

    # 5. Feature Importance (If applicable)
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        fi = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        metrics["featureImportance"] = [{"feature": f, "importance": round(float(imp), 4)} for f, imp in fi]

        fig, ax = plt.subplots(figsize=(10, max(4, len(fi) * 0.4)))
        fi_df = pd.DataFrame(fi[:15], columns=["Feature", "Importance"])
        sns.barplot(data=fi_df, y="Feature", x="Importance", ax=ax, palette="viridis", hue="Feature", legend=False)
        ax.set_title("Feature Importance (Top 15)", fontweight="bold")
        plt.tight_layout()
        
        if jupyter_mode:
            plt.show()
        else:
            charts["featureImportance"] = fig_to_base64(fig)

    # 6. Final Results
    return {
        "taskType": task_type,
        "algorithm": algorithm,
        "testSize": test_size,
        "trainSamples": len(X_train),
        "testSamples": len(X_test),
        "features": feature_names,
        "target": target_col,
        "metrics": metrics,
        "charts": charts,
        "model": model if jupyter_mode else None
    }

def compare_models(df, target_col, test_size=0.2, task_type=None):
    """
    Train and compare multiple models on the dataset to find the best algorithm.
    Returns a sorted list of dictionaries containing algorithm names and metrics.
    """
    # 1. Prepare Data
    X_scaled, y, detected_task, target_le, feature_names = preprocess_data(df, target_col)
    task_type = task_type or detected_task

    # 2. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=test_size, random_state=42)

    # 3. Model Initialization
    models_dict = CLASSIFIERS if task_type == "classification" else REGRESSORS
    
    results = []

    for algorithm, model_class in models_dict.items():
        try:
            model = model_class()

            # Apply algorithm-specific parameters safely
            if hasattr(model, 'random_state'):
                model.set_params(random_state=42)
            if algorithm == "SVM" and task_type == "classification":
                model.set_params(probability=True, max_iter=1000)
            elif algorithm == "Logistic Regression":
                model.set_params(max_iter=1000)
            elif algorithm == "CatBoost":
                model.set_params(verbose=False)

            # Train and Predict
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)

            if task_type == "classification":
                acc = accuracy_score(y_test, y_pred)
                prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
                rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
                f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
                
                results.append({
                    "algorithm": algorithm,
                    "metrics": {
                        "accuracy": round(acc, 4),
                        "precision": round(prec, 4),
                        "recall": round(rec, 4),
                        "f1Score": round(f1, 4),
                    }
                })
            else:
                mse = float(mean_squared_error(y_test, y_pred))
                rmse = float(np.sqrt(mse))
                mae = float(mean_absolute_error(y_test, y_pred))
                r2 = float(r2_score(y_test, y_pred))
                
                results.append({
                    "algorithm": algorithm,
                    "metrics": {
                        "mse": round(mse, 4),
                        "rmse": round(rmse, 4),
                        "mae": round(mae, 4),
                        "r2": round(r2, 4),
                    }
                })
        except Exception as e:
            # Skip model if it fails for any reason
            continue

    # Sort results to highlight the best model
    if task_type == "classification":
        # Sort by Accuracy (Descending)
        results.sort(key=lambda x: x["metrics"]["accuracy"], reverse=True)
    else:
        # Sort by R2 (Descending)
        results.sort(key=lambda x: x["metrics"]["r2"], reverse=True)
        
    return {
        "taskType": task_type,
        "testSize": test_size,
        "trainSamples": len(X_train),
        "testSamples": len(X_test),
        "features": feature_names,
        "target": target_col,
        "results": results
    }

# ---------------------------------------------------------
# Jupyter Lab Example Usage
# ---------------------------------------------------------
if __name__ == "__main__":
    # Example: How to run in Jupyter Lab
    # df = pd.read_csv("your_dataset.csv")
    # results = train_and_evaluate(df, "target_column", "Random Forest", jupyter_mode=True)
    # print("Accuracy:", results["metrics"]["accuracy"])
    pass
