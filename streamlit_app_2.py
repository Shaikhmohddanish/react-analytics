import streamlit as st
import pandas as pd

# ---------- LOAD DATA ----------
df = pd.read_csv("Delivery_Challan (4).csv")
df['Item Name'] = df['Item Name'].str.lower()
df['Customer Name'] = df['Customer Name'].str.strip()

# ---------- CATEGORY MAPPING ----------
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
df["Category"] = df["Item Name"].map(item_to_category).fillna("Uncategorized")

# ---------- AGGREGATION ----------
summary = df.groupby("Customer Name").agg({
    "Delivery Challan Number": pd.Series.nunique,
    "Item Total": "sum"
}).rename(columns={
    "Delivery Challan Number": "Total Orders",
    "Item Total": "Total Order Amount"
})

category_list = list(category_map.keys()) + ["Uncategorized"]

# Add per-category ₹ + % columns
for cat in category_list:
    amt = df[df["Category"] == cat].groupby("Customer Name")["Item Total"].sum()
    amt_full = summary.index.map(amt).fillna(0)
    total_amt = summary["Total Order Amount"].replace(0, 1)
    pct_full = amt_full / total_amt * 100

    summary[cat] = [
        f"₹{a:,.0f} ({p:.1f}%)" if a > 0 else "-"
        for a, p in zip(amt_full, pct_full)
    ]

summary = summary.reset_index()

# ---------- CUSTOMER TYPE CLASSIFICATION ----------
def classify_customer(amount):
    if amount > 10_00_000:
        return "Gold"
    elif amount > 5_00_000:
        return "Silver"
    elif amount > 1_00_000:
        return "Bronze"
    else:
        return "Copper"

summary["Customer Type"] = summary["Total Order Amount"].apply(classify_customer)

# ---------- STREAMLIT UI ----------
st.set_page_config(layout="wide")
st.title("📊 Dealer Summary Table")

types = ["All", "Gold", "Silver", "Bronze", "Copper"]
selected_type = st.selectbox("🏅 Filter by Customer Type", types)

customer_names = ["All"] + sorted(summary["Customer Name"].unique())
selected_customer = st.selectbox("🔍 Search or Select Customer", customer_names)

# ---------- FILTERING ----------
filtered = summary.copy()
if selected_type != "All":
    filtered = filtered[filtered["Customer Type"] == selected_type]
if selected_customer != "All":
    filtered = filtered[filtered["Customer Name"] == selected_customer]

# ---------- DISPLAY FILTERED SUMMARY FIRST ----------
def highlight_row(row):
    color_map = {
        "Gold": "#FFFACD",
        "Silver": "#D3D3D3",
        "Bronze": "#F5DEB3",
        "Copper": "#ADD8E6"
    }
    return ['background-color: {}'.format(color_map.get(row["Customer Type"], "#FFFFFF"))] * len(row)

format_dict = {
    "Total Order Amount": "₹{:,.2f}"
}

styled = filtered.style.apply(highlight_row, axis=1).format(format_dict)
st.markdown("### 📋 Filtered Dealer Summary")
st.dataframe(styled, use_container_width=True)

# ---------- TOTALS ROW ----------
if not filtered.empty:
    total_amt = filtered["Total Order Amount"].sum()
    total_orders = filtered["Total Orders"].sum()
    row = {
        "Customer Name": "Total",
        "Total Orders": total_orders,
        "Total Order Amount": total_amt,
        "Customer Type": "-"
    }

    for cat in category_list:
        def extract_amount(val):
            try:
                return float(val.split(" ")[0].replace("₹", "").replace(",", ""))
            except:
                return 0

        cat_vals = filtered[cat].apply(extract_amount)
        total_cat_amt = cat_vals.sum()
        pct = (total_cat_amt / total_amt * 100) if total_amt else 0
        row[cat] = f"₹{total_cat_amt:,.0f} ({pct:.1f}%)" if total_cat_amt > 0 else "-"

    total_df = pd.DataFrame([row])
    st.markdown("### 🔢 Totals for Filtered Results")
    st.dataframe(total_df.style.format(format_dict), use_container_width=True)

# ---------- CUSTOMER TYPE SUMMARY (AT THE END) ----------
st.markdown("### 📊 Summary by Customer Type")
type_summary = summary.groupby("Customer Type").agg(
    **{
        "No. of Customers": ("Customer Name", "nunique"),
        "Total No. of Orders": ("Total Orders", "sum"),
        "Total Amount of Order": ("Total Order Amount", "sum")
    }
).reset_index()

type_summary["Total Amount of Order"] = type_summary["Total Amount of Order"].apply(lambda x: f"₹{x:,.2f}")
st.dataframe(type_summary, use_container_width=True)
