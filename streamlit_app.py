import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load data
df = pd.read_csv("Delivery_Challan (4).csv")

# Preprocess
df['Challan Date'] = pd.to_datetime(df['Challan Date'])
df['Month'] = df['Challan Date'].dt.to_period('M').astype(str)
df['Item Name'] = df['Item Name'].str.lower()
df['Customer Name'] = df['Customer Name'].str.strip()

# Category mapping
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

category_colors = {
    "Bio-Fertilizers": "#1f77b4",
    "Micronutrients": "#ff7f0e",
    "Chelated Micronutrients": "#2ca02c",
    "Bio-Stimulants": "#d62728",
    "Other Bulk Orders": "#9467bd",
    "Uncategorized": "#8c564b"
}

# Dealer stats
dealer_stats = df.groupby("Customer Name").agg({
    "Item Total": "sum",
    "Delivery Challan Number": pd.Series.nunique
}).rename(columns={"Item Total": "Total Sales", "Delivery Challan Number": "Total Orders"}).reset_index()

dealer_stats = dealer_stats.sort_values(by="Total Sales", ascending=False).reset_index(drop=True)

# Streamlit layout
st.set_page_config(layout="wide")
st.title("📦 Dealer Dashboard")

# Search bar
search = st.text_input("🔍 Search Dealer by Name").strip().lower()
filtered_dealers = dealer_stats[dealer_stats["Customer Name"].str.lower().str.contains(search)]

if filtered_dealers.empty:
    st.warning("No dealers found.")
else:
    for idx, row in filtered_dealers.iterrows():
        serial = idx + 1
        customer = row["Customer Name"]
        total_sales = row["Total Sales"]
        total_orders = row["Total Orders"]
        customer_data = df[df["Customer Name"] == customer]

        # Category breakdown
        category_share = (
            customer_data.groupby("Category")["Item Total"]
            .sum().reset_index()
        )
        category_share["%"] = (category_share["Item Total"] / category_share["Item Total"].sum() * 100).round(1)

        # Build horizontal stacked bar (Plotly)
        fig_bar = go.Figure()
        for _, r in category_share.iterrows():
            fig_bar.add_trace(go.Bar(
                x=[r["%"]],
                y=[""],
                orientation='h',
                marker=dict(color=category_colors.get(r["Category"], "#cccccc")),
                name=r["Category"],
                hovertemplate=f"{r['Category']}: {r['%']}%",
                showlegend=False
            ))
        fig_bar.update_layout(
            barmode='stack',
            margin=dict(l=0, r=0, t=0, b=0),
            height=25,
            xaxis=dict(visible=False),
            yaxis=dict(visible=False)
        )

        # Row layout before expanding
        colA, colB, colC, colD, colE = st.columns([0.5, 4, 2, 2, 2])
        colA.markdown(f"**{serial}.**")
        colB.markdown(f"**🧾 {customer}**")
        colC.metric("Orders", total_orders)
        colD.plotly_chart(fig_bar, use_container_width=True, config={"displayModeBar": False})
        colE.markdown(f"<div style='text-align:right; font-weight:bold; color:#28a745;'>₹{total_sales:,.2f}</div>", unsafe_allow_html=True)

        # Monthly breakdown chart (in expander)
        with st.expander("📊 Show Monthly Breakdown"):
            monthly_sales = (
                customer_data.groupby(["Month", "Category"])["Item Total"]
                .sum().reset_index()
            )
            monthly_totals = (
                customer_data.groupby("Month")["Item Total"]
                .sum().reset_index()
            )

            fig = px.bar(
                monthly_sales,
                x="Month",
                y="Item Total",
                color="Category",
                title="Monthly Sales by Category",
                text_auto=".2s",
                color_discrete_map=category_colors
            )
            for _, r in monthly_totals.iterrows():
                fig.add_annotation(
                    x=r["Month"],
                    y=r["Item Total"],
                    text=f"₹{r['Item Total']:,.0f}",
                    showarrow=False,
                    yshift=10
                )
            st.plotly_chart(fig, use_container_width=True)
