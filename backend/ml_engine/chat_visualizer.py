"""
PipeWise-AI — Chat Visualization Engine
Detects visualization requests in chat and generates inline charts.
"""

import re
import random
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from utils.plot_utils import fig_to_base64


# Keywords that indicate a chart/graph request
CHART_KEYWORDS = [
    "scatter", "plot", "graph", "chart", "histogram", "bar chart", "bar plot",
    "box plot", "boxplot", "heatmap", "heat map", "correlation map",
    "distribution", "visualize", "visualisation", "visualization",
    "draw", "show me a graph", "show me a chart", "show me a plot",
    "pie chart", "line chart", "line plot", "count plot", "countplot",
]


def _detect_chart_request(question):
    """Detect if the user is asking for a chart/visualization."""
    q = question.lower().strip()
    return any(kw in q for kw in CHART_KEYWORDS)


def _detect_chart_type(question):
    """Detect the desired chart type from the question."""
    q = question.lower()
    if "scatter" in q:
        return "scatter"
    elif "histogram" in q or "distribution" in q:
        return "histogram"
    elif "bar" in q:
        return "bar"
    elif "box" in q:
        return "box"
    elif "heatmap" in q or "heat map" in q or "correlation map" in q:
        return "heatmap"
    elif "pie" in q:
        return "pie"
    elif "line" in q:
        return "line"
    elif "count" in q:
        return "count"
    elif "pair" in q:
        return "pairplot"
    else:
        # Default to scatter for generic "plot" / "graph" requests
        return "scatter"


def _pick_columns(df, question, chart_type):
    """Pick the best x and y columns based on the question and chart type."""
    q = question.lower()
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

    # Try to find columns mentioned in the question
    mentioned_cols = []
    for col in df.columns:
        if col.lower() in q or col.lower().replace("_", " ") in q:
            mentioned_cols.append(col)

    x_col, y_col = None, None

    if len(mentioned_cols) >= 2:
        x_col, y_col = mentioned_cols[0], mentioned_cols[1]
    elif len(mentioned_cols) == 1:
        x_col = mentioned_cols[0]
        # Pick a correlated numeric column as y
        if x_col in numeric_cols and len(numeric_cols) >= 2:
            others = [c for c in numeric_cols if c != x_col]
            correlations = df[others].corrwith(df[x_col]).abs()
            y_col = correlations.idxmax() if not correlations.empty else others[0]
        elif len(numeric_cols) >= 1:
            y_col = numeric_cols[0] if numeric_cols[0] != x_col else (numeric_cols[1] if len(numeric_cols) > 1 else None)
    else:
        # No columns mentioned — pick based on chart type
        if chart_type in ("scatter", "line"):
            if len(numeric_cols) >= 2:
                # Pick the most correlated pair
                corr = df[numeric_cols].corr().abs()
                np.fill_diagonal(corr.values, 0)
                max_idx = np.unravel_index(corr.values.argmax(), corr.shape)
                x_col = numeric_cols[max_idx[0]]
                y_col = numeric_cols[max_idx[1]]
            elif len(numeric_cols) == 1:
                x_col = numeric_cols[0]
        elif chart_type in ("histogram", "box"):
            if len(numeric_cols) >= 1:
                x_col = random.choice(numeric_cols)
        elif chart_type in ("bar", "count"):
            if cat_cols:
                x_col = cat_cols[0]
            if numeric_cols:
                y_col = numeric_cols[0]
        elif chart_type == "pie":
            if cat_cols:
                x_col = cat_cols[0]
        elif chart_type == "heatmap":
            pass  # No columns needed

    return x_col, y_col


def generate_chat_chart(df, question):
    """
    Detect if the question is a visualization request.
    If so, generate the chart and return (chart_base64, chart_description).
    If not, return (None, None).
    """
    if not _detect_chart_request(question):
        return None, None

    chart_type = _detect_chart_type(question)
    x_col, y_col = _pick_columns(df, question, chart_type)

    sns.set_theme(style="whitegrid", font="sans-serif")
    fig, ax = plt.subplots(figsize=(10, 6))
    description = ""

    try:
        if chart_type == "scatter":
            if not x_col or not y_col:
                return None, None
            sns.scatterplot(data=df, x=x_col, y=y_col, alpha=0.6, ax=ax, color="#6366f1")
            ax.set_xlabel(x_col, fontsize=12, fontweight="bold")
            ax.set_ylabel(y_col, fontsize=12, fontweight="bold")
            ax.set_title(f"Scatter Plot: {x_col} vs {y_col}", fontsize=14, fontweight="bold")
            # Compute correlation for description
            if x_col in df.select_dtypes(include=["number"]).columns and y_col in df.select_dtypes(include=["number"]).columns:
                corr_val = df[x_col].corr(df[y_col])
                strength = "strong" if abs(corr_val) > 0.7 else ("moderate" if abs(corr_val) > 0.4 else "weak")
                direction = "positive" if corr_val > 0 else "negative"
                description = f"**Scatter Plot: {x_col} vs {y_col}**\n\nCorrelation: **{corr_val:.4f}** ({strength} {direction} correlation)"
            else:
                description = f"**Scatter Plot: {x_col} vs {y_col}**"

        elif chart_type == "histogram":
            if not x_col:
                return None, None
            sns.histplot(data=df, x=x_col, bins=30, kde=True, ax=ax, color="#16a34a", alpha=0.7)
            ax.set_xlabel(x_col, fontsize=12, fontweight="bold")
            ax.set_ylabel("Frequency", fontsize=12, fontweight="bold")
            ax.set_title(f"Distribution: {x_col}", fontsize=14, fontweight="bold")
            if x_col in df.select_dtypes(include=["number"]).columns:
                mean_val = df[x_col].mean()
                std_val = df[x_col].std()
                description = f"**Distribution of {x_col}**\n\nMean: **{mean_val:.2f}**, Std Dev: **{std_val:.2f}**"
            else:
                description = f"**Distribution of {x_col}**"

        elif chart_type == "bar":
            if not x_col:
                return None, None
            if y_col and y_col in df.select_dtypes(include=["number"]).columns:
                grouped = df.groupby(x_col)[y_col].mean().reset_index()
                if len(grouped) > 20:
                    grouped = grouped.head(20)
                sns.barplot(data=grouped, x=x_col, y=y_col, ax=ax, color="#f59e0b")
                ax.set_ylabel(f"Avg {y_col}", fontsize=12, fontweight="bold")
                ax.set_title(f"Bar Chart: {x_col} vs Avg {y_col}", fontsize=14, fontweight="bold")
                description = f"**Bar Chart: {x_col} vs Average {y_col}**"
            else:
                counts = df[x_col].value_counts().head(20)
                sns.barplot(x=counts.index, y=counts.values, ax=ax, color="#f59e0b")
                ax.set_ylabel("Count", fontsize=12, fontweight="bold")
                ax.set_title(f"Bar Chart: {x_col}", fontsize=14, fontweight="bold")
                description = f"**Bar Chart: {x_col}** (top {len(counts)} values)"
            ax.set_xlabel(x_col, fontsize=12, fontweight="bold")
            plt.xticks(rotation=45, ha="right")

        elif chart_type == "box":
            if not x_col:
                return None, None
            if y_col:
                sns.boxplot(data=df, x=x_col, y=y_col, ax=ax, palette="Set2")
                ax.set_title(f"Box Plot: {y_col} by {x_col}", fontsize=14, fontweight="bold")
                description = f"**Box Plot: {y_col} grouped by {x_col}**"
            else:
                sns.boxplot(data=df, x=x_col, ax=ax, color="#6366f1")
                ax.set_title(f"Box Plot: {x_col}", fontsize=14, fontweight="bold")
                if x_col in df.select_dtypes(include=["number"]).columns:
                    q1 = df[x_col].quantile(0.25)
                    q3 = df[x_col].quantile(0.75)
                    description = f"**Box Plot: {x_col}**\n\nQ1: {q1:.2f}, Q3: {q3:.2f}, IQR: {q3 - q1:.2f}"
                else:
                    description = f"**Box Plot: {x_col}**"

        elif chart_type == "heatmap":
            numeric_df = df.select_dtypes(include=["number"])
            if numeric_df.shape[1] < 2:
                return None, None
            corr = numeric_df.corr()
            sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdYlGn", ax=ax, center=0)
            ax.set_title("Correlation Heatmap", fontsize=14, fontweight="bold")
            description = f"**Correlation Heatmap** across {numeric_df.shape[1]} numeric columns"

        elif chart_type == "pie":
            if not x_col:
                return None, None
            counts = df[x_col].value_counts().head(10)
            ax.pie(counts.values, labels=counts.index, autopct="%1.1f%%", startangle=90)
            ax.set_title(f"Pie Chart: {x_col}", fontsize=14, fontweight="bold")
            description = f"**Pie Chart: {x_col}** — showing distribution of top {len(counts)} categories"

        elif chart_type == "line":
            if not x_col or not y_col:
                return None, None
            sorted_df = df.sort_values(by=x_col)
            ax.plot(sorted_df[x_col], sorted_df[y_col], color="#6366f1", alpha=0.8)
            ax.set_xlabel(x_col, fontsize=12, fontweight="bold")
            ax.set_ylabel(y_col, fontsize=12, fontweight="bold")
            ax.set_title(f"Line Plot: {x_col} vs {y_col}", fontsize=14, fontweight="bold")
            description = f"**Line Plot: {x_col} vs {y_col}**"

        elif chart_type == "count":
            if not x_col:
                return None, None
            order = df[x_col].value_counts().index[:20]
            sns.countplot(data=df, x=x_col, ax=ax, palette="Set2", order=order)
            ax.set_xlabel(x_col, fontsize=12, fontweight="bold")
            ax.set_ylabel("Count", fontsize=12, fontweight="bold")
            ax.set_title(f"Count Plot: {x_col}", fontsize=14, fontweight="bold")
            plt.xticks(rotation=45, ha="right")
            description = f"**Count Plot: {x_col}** — distribution of categories"

        else:
            plt.close(fig)
            return None, None

        plt.tight_layout()
        image_b64 = fig_to_base64(fig)
        return image_b64, description

    except Exception as e:
        plt.close(fig)
        print(f"⚠️ Chat chart generation error: {e}")
        return None, None
