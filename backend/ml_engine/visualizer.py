import matplotlib.pyplot as plt
import seaborn as sns
from utils.plot_utils import fig_to_base64

def generate_visualization(df, graph_type, x_column, y_column=None):
    """Generate a visualization and return it as a base64 string."""
    sns.set_theme(style="whitegrid", font="sans-serif")
    fig, ax = plt.subplots(figsize=(10, 6))

    if graph_type == "Scatter Plot":
        if not y_column:
            raise ValueError("Y column required for scatter plot")
        sns.scatterplot(data=df, x=x_column, y=y_column, alpha=0.6, ax=ax, color="#6366f1")
        ax.set_xlabel(x_column, fontsize=12, fontweight="bold")
        ax.set_ylabel(y_column, fontsize=12, fontweight="bold")
        ax.set_title(f"Scatter Plot: {x_column} vs {y_column}", fontsize=14, fontweight="bold")

    elif graph_type == "Bar Chart":
        if not y_column:
            raise ValueError("Y column required for bar chart")
        grouped = df.groupby(x_column)[y_column].mean().reset_index()
        if len(grouped) > 30:
            grouped = grouped.head(30)
        sns.barplot(data=grouped, x=x_column, y=y_column, ax=ax, color="#f59e0b")
        ax.set_xlabel(x_column, fontsize=12, fontweight="bold")
        ax.set_ylabel(f"Avg {y_column}", fontsize=12, fontweight="bold")
        ax.set_title(f"Bar Chart: {x_column} vs {y_column}", fontsize=14, fontweight="bold")
        plt.xticks(rotation=45, ha="right")

    elif graph_type == "Histogram":
        sns.histplot(data=df, x=x_column, bins=30, kde=True, ax=ax, color="#16a34a", alpha=0.7)
        ax.set_xlabel(x_column, fontsize=12, fontweight="bold")
        ax.set_ylabel("Frequency", fontsize=12, fontweight="bold")
        ax.set_title(f"Histogram: {x_column}", fontsize=14, fontweight="bold")

    elif graph_type == "Box Plot":
        if y_column:
            sns.boxplot(data=df, x=x_column, y=y_column, ax=ax, palette="Set2")
        else:
            sns.boxplot(data=df, x=x_column, ax=ax, color="#6366f1")
        ax.set_title(f"Box Plot: {x_column}" + (f" by {y_column}" if y_column else ""), fontsize=14, fontweight="bold")

    elif graph_type == "Heatmap":
        numeric_df = df.select_dtypes(include=["number"])
        if numeric_df.shape[1] < 2:
            raise ValueError("Need at least 2 numeric columns for heatmap")
        corr = numeric_df.corr()
        sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdYlGn", ax=ax, center=0)
        ax.set_title("Correlation Heatmap", fontsize=14, fontweight="bold")

    elif graph_type == "Pair Plot":
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()[:5]
        if len(numeric_cols) < 2:
            raise ValueError("Need at least 2 numeric columns for pair plot")
        plt.close(fig)
        g = sns.pairplot(df[numeric_cols], diag_kind="kde", plot_kws={"alpha": 0.5})
        fig = g.figure
        fig.suptitle("Pair Plot", fontsize=14, fontweight="bold", y=1.01)

    elif graph_type == "Count Plot":
        sns.countplot(data=df, x=x_column, ax=ax, palette="Set2", order=df[x_column].value_counts().index[:20])
        ax.set_xlabel(x_column, fontsize=12, fontweight="bold")
        ax.set_ylabel("Count", fontsize=12, fontweight="bold")
        ax.set_title(f"Count Plot: {x_column}", fontsize=14, fontweight="bold")
        plt.xticks(rotation=45, ha="right")

    else:
        raise ValueError(f"Unknown graph type: {graph_type}")

    plt.tight_layout()
    image_b64 = fig_to_base64(fig)
    return image_b64
