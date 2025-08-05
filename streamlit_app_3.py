import streamlit as st
import pandas as pd
import plotly.graph_objects as go

# ---------- LOAD DATA ----------
df = pd.read_csv("Delivery_Challan (4).csv")
df['Item Name'] = df['Item Name'].str.lower()
df['Customer Name'] = df['Customer Name'].str.strip()
df['Challan Date'] = pd.to_datetime(df['Challan Date'], errors='coerce')

# ---------- PRODUCT CATEGORY MAPPING ----------
category_map = {
    "Bio-Fertilizers": [
        "peek sanjivani - consortia", "bio surakshak - tryka (trichoderma)",
        "peek sanjivani - p (psb)", "sanjivani kit (5 ltrs)", "peek sanjivani - k (kmb)",
        "peek sanjivani - p (azotobacter)", "bio surakshak - ryzia (metarhizium)",
        "bio surakshak - rekha (psudomonas)", "peek sanjivani - n (azotobacter)",
        "sanjivani granules", "rhizo-vishwa (200 gm)"
    ],
    "Micronutrients": [
        "nutrisac kit - (50 kg)", "nutrisac kit - (25 kg)", "nutrisac kit - (10 kg)",
        "dimond kit 50kg", "micromax kit (50 kg)", "ferrous sulphate (feso4) - 20 kg",
        "nutrisac mg -20kg", "nutrisac fe - 10 kg", "nutrisac mg - 10 kg",
        "nutrisac fe  - 20 kg", "jackpot kit", "orient kit - (50 kg)",
        "magnesium sulphate (mgso4) - 20 kg", "orient kit - (53 kg)", "diamond kit 50kg",
        "ferrous sulphate - feso4 (20 kg bag)"
    ],
    "Chelated Micronutrients": [
        "iron man - eddha ferrous (500 gm)", "micro man - fe (500 gm)",
        "micro man - fe (250 gm)", "micro man - zn (250 gm)", "micro man - zn (500 gm)",
        "micro man - pro (1 ltr)", "micro man - pro (500 ml)", "micro man pro (250 ml)",
        "iron man - eddha ferrous (1 kg)"
    ],
    "Bio-Stimulants": [
        "titanic kit - (25 kg)", "jeeto - 95 (100 ml)", "jeeto - 95 (200 ml)",
        "flora - 95 (100 ml)", "flora - 95 (200 ml)", "mantra humic acid (500 gm)",
        "mantra humic acid (250 gm)", "mantra humic acid (1 kg)", "jeeto - 95 (400 ml)",
        "pickup - 99 (100 ml)", "pickup - 99 (200 ml)", "pickup - 99 (400 ml)",
        "micro man plus (250 gm)", "micro man plus (500 gm)", "flora - 95 (400 ml)",
        "boomer - 90 (100 ml)", "boomer - 90 (200 ml)", "boomer - 90 (400 ml)",
        "bingo 100 ml", "bingo 200 ml", "bingo 400 ml", "rainbow 200", "rainbow 400",
        "rainbow 100ml", "mantra humic acid (100 gm)", "zumbaa", "turma max", "simba",
        "captain (100 ml)", "ferrari (200 ml)", "ferrari (400 ml)", "bio stimulant - f",
        "bio stimulant - j", "ozone power (10 kg bucket)", "fountain 1 liter",
        "fountain 500 ml"
    ],
    "Other Bulk Orders": [
        "biomass briquette", "nandi choona", "calcimag"
    ]
}
item_to_category = {item: cat for cat, items in category_map.items() for item in items}
df["Product Category"] = df["Item Name"].map(item_to_category).fillna("Uncategorized")

# ---------- CUSTOMER TYPE CLASSIFICATION ----------
customer_summary = df.groupby("Customer Name")["Item Total"].sum().reset_index()
def classify_customer(amount):
    if amount > 10_00_000:
        return "Gold"
    elif amount > 5_00_000:
        return "Silver"
    elif amount > 1_00_000:
        return "Bronze"
    else:
        return "Copper"
customer_summary["Customer Type"] = customer_summary["Item Total"].apply(classify_customer)
df = df.merge(customer_summary[["Customer Name", "Customer Type"]], on="Customer Name", how="left")

# ---------- MONTH COLUMN ----------
df["Month"] = df["Challan Date"].dt.strftime("%b %y")

# ---------- STREAMLIT UI ----------
st.set_page_config(layout="wide")
st.title("📦 Product Quantity Timeline")

# Filters
product_types = sorted(df["Product Category"].unique())
customer_types = sorted(df["Customer Type"].dropna().unique())

col1, col2 = st.columns(2)
with col1:
    selected_product_type = st.selectbox("📂 Filter by Product Category", ["All"] + product_types)
with col2:
    selected_customer_type = st.selectbox("🏅 Filter by Customer Type", ["All"] + customer_types)

search_term = st.text_input("🔍 Search Product Name", "").strip().lower()

# ---------- APPLY FILTERS ----------
filtered_df = df.copy()
if selected_product_type != "All":
    filtered_df = filtered_df[filtered_df["Product Category"] == selected_product_type]
if selected_customer_type != "All":
    filtered_df = filtered_df[filtered_df["Customer Type"] == selected_customer_type]
if search_term:
    filtered_df = filtered_df[filtered_df["Item Name"].str.contains(search_term, case=False, na=False)]

# ---------- QUANTITY PIVOT TABLE ----------
pivot_qty = filtered_df.groupby(["Product Category", "Item Name", "Month"])["QuantityOrdered"].sum().unstack(fill_value=0)
pivot_qty["Total Qty"] = pivot_qty.sum(axis=1)

# ---------- ADD ITEM COST COLUMN ----------
item_total = filtered_df.groupby("Item Name")["Item Total"].sum()
pivot_qty["Total Cost"] = pivot_qty.index.get_level_values("Item Name").map(item_total).fillna(0)

# ---------- FORMAT CLEAN BLANKS ----------
display_table = pivot_qty.copy()
display_table = display_table.applymap(lambda x: "" if x == 0 else x)
display_table["Total Qty"] = pivot_qty["Total Qty"]
display_table["Total Cost"] = pivot_qty["Total Cost"].apply(lambda x: f"₹{x:,.0f}")

# ---------- COLOR ROWS BY CATEGORY ----------
def highlight_by_category(row):
    category_colors = {
        "Bio-Fertilizers": "#E8F8F5",
        "Micronutrients": "#FEF9E7",
        "Chelated Micronutrients": "#FDEDEC",
        "Bio-Stimulants": "#EBF5FB",
        "Other Bulk Orders": "#F9EBEA",
        "Uncategorized": "#F4F6F6"
    }
    color = category_colors.get(row.name[0], "#FFFFFF")
    return [f"background-color: {color}"] * len(row)

# ---------- DISPLAY TABLE ----------
st.markdown("### 📊 Quantity Ordered by Month")
st.dataframe(display_table.style.apply(highlight_by_category, axis=1), use_container_width=True)

# ---------- SUMMARY TOTALS ----------
st.markdown("### 📈 Totals for All Filtered Items")
summary = pivot_qty.drop(columns=["Total Qty", "Total Cost"], errors="ignore").sum().to_frame().T
summary["Total Qty"] = pivot_qty["Total Qty"].sum()
summary["Total Cost"] = f"₹{pivot_qty['Total Cost'].sum():,.0f}"
st.dataframe(summary, use_container_width=True)

# ---------- HEATMAPS BY CUSTOMER TYPE ----------
st.markdown("## 🔥 Product Heatmaps by Customer Type")

heatmap_data = df.copy()
heatmap_data = heatmap_data[heatmap_data["Product Category"] != "Other Bulk Orders"]

# Apply filters again
if selected_product_type != "All":
    heatmap_data = heatmap_data[heatmap_data["Product Category"] == selected_product_type]
if selected_customer_type != "All":
    heatmap_data = heatmap_data[heatmap_data["Customer Type"] == selected_customer_type]
if search_term:
    heatmap_data = heatmap_data[heatmap_data["Item Name"].str.contains(search_term, case=False, na=False)]

heatmap_data["Month"] = pd.to_datetime(heatmap_data["Challan Date"]).dt.strftime("%b %y")
heatmap_data["Item Name"] = heatmap_data["Item Name"].fillna("Unknown Item")

for customer_type in ["Gold", "Silver", "Bronze", "Copper"]:
    sub_df = heatmap_data[heatmap_data["Customer Type"] == customer_type]
    if sub_df.empty:
        continue

    pivot = sub_df.pivot_table(index="Item Name", columns="Month", values="QuantityOrdered", aggfunc="sum", fill_value=0)
    pivot = pivot.loc[pivot.sum(axis=1) > 0]
    pivot = pivot[pd.to_datetime(pivot.columns, format="%b %y").sort_values().strftime("%b %y")]

    # Mask 0s to show white
    z_data = pivot.values
    colorscale = [[0, 'white'], [0.00001, 'lightblue'], [1, 'darkblue']]

    fig = go.Figure(data=go.Heatmap(
        z=z_data,
        x=pivot.columns,
        y=pivot.index,
        colorscale="YlGnBu",
        zmin=0.00001,
        zauto=True,
        hovertemplate="Product: %{y}<br>Month: %{x}<br>Qty: %{z}<extra></extra>",
        colorbar=dict(title="Qty Ordered")
    ))

    fig.update_layout(
        title=f"🔥 {customer_type} Customers - Quantity Ordered",
        xaxis_title="Month",
        yaxis_title="Item Name",
        height=600,
        margin=dict(l=40, r=40, t=60, b=40)
    )

    st.plotly_chart(fig, use_container_width=True)