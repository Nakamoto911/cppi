import numpy as np
import pandas as pd
import yfinance as yf
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os

# Parameters
start_date = "1928-01-01"  # Starting date for data download
end_date = "2023-12-31"  # End date for data download
initial_wealth = 100
years_list = [5, 10, 15]  # List of investment horizons
safe_rate = 0.028  # Annualized
floor_growth_rate = (1 + safe_rate) ** (1 / 12) - 1  # Monthly
multiplier = 3  # Leverage factor for risky assets
rebalance_window = 3  # in months


def get_data(ticker, start_date, end_date):
    data = yf.download(ticker, start=start_date, end=end_date, progress=False)
    data = data.resample("ME").last()  # Resample to month-end frequency
    data["Adj Close"] = data["Adj Close"].ffill()  # Forward fill missing values
    data["Monthly Return"] = data["Adj Close"].pct_change()  # Calculate monthly returns
    return data.dropna()  # Remove rows with missing values


def run_cppi_with_logging(
    data, years, multiplier, initial_wealth, floor_growth_rate, rebalance_window
):
    n_months = years * 12
    wealth = initial_wealth
    floor = initial_wealth / ((1 + safe_rate) ** years)

    simulation_logs = []
    prev_wealth = initial_wealth
    cppi_peak_wealth = (
        initial_wealth  # Track peak wealth for CPPI drawdown calculations
    )
    cppi_months_in_drawdown = 0

    sp500_peak_wealth = initial_wealth
    sp500_months_in_drawdown = 0

    # Case 1: Initialization (period 0)
    cushion = max(wealth - floor, 0)
    risky_allocation = min(multiplier * cushion, wealth)
    safe_allocation = wealth - risky_allocation
    risky_allocation = max(0, risky_allocation)
    safe_allocation = max(0, safe_allocation)

    accumulated_safe_return = 0
    sp500_wealth = initial_wealth
    floor_breaches = 0

    for i in range(n_months):
        if i >= len(data):
            break

        current_date = data.index[i].strftime("%Y-%m-%d")
        monthly_return = data["Monthly Return"].iloc[i]

        # Store start of period exposures
        start_risky_exposure = risky_allocation
        start_safe_exposure = safe_allocation

        # Calculate risky returns
        risky_return = risky_allocation * monthly_return
        risky_allocation_after_return = risky_allocation + risky_return

        # Update wealth with risky return
        wealth = risky_allocation_after_return + safe_allocation

        # Accumulate safe returns
        accumulated_safe_return += safe_allocation * floor_growth_rate

        # Case 2: Rebalancing period
        if (i + 1) % rebalance_window == 0:
            # Step 1: Apply accumulated safe returns
            wealth += accumulated_safe_return
            accumulated_safe_return = 0

            # Step 2: Rebalance based on updated wealth
            cushion = max(
                wealth - floor * (1 + floor_growth_rate), 0
            )  # Floor at the end of the period
            risky_allocation = min(
                multiplier * cushion, wealth
            )  # risky_allocation < wealth -> no leverage
            safe_allocation = wealth - risky_allocation
            risky_allocation = max(0, risky_allocation)
            safe_allocation = max(0, safe_allocation)

        else:
            # Regular period, update risky allocation without rebalancing
            risky_allocation = risky_allocation_after_return

        # Calculate CPPI drawdown
        cppi_drawdown = round((wealth - cppi_peak_wealth) / cppi_peak_wealth * 100, 1)
        if wealth < cppi_peak_wealth:
            cppi_months_in_drawdown += 1

        # Calculate S&P 500 drawdown
        sp500_drawdown = round(
            (sp500_wealth - sp500_peak_wealth) / sp500_peak_wealth * 100, 1
        )
        if sp500_wealth < sp500_peak_wealth:
            sp500_months_in_drawdown += 1
        sp500_peak_wealth = max(sp500_peak_wealth, sp500_wealth)

        # Track S&P 500 performance
        sp500_wealth *= 1 + data["Monthly Return"].iloc[i]

        # Check for floor breaches
        if wealth < floor:
            floor_breaches += 1

        # Log results
        decimal_num = 1
        simulation_logs.append(
            {
                "Start Date": data.index[0].strftime("%Y-%m-%d"),
                "Date": current_date,
                "Duration (years)": years,  # Add duration column
                "Start Portfolio": round(prev_wealth, decimal_num),
                "Floor": round(floor, decimal_num),
                "Cushion": round(cushion, decimal_num),
                "Start Risky Exp.": round(start_risky_exposure, decimal_num),
                "Start Safe Exp.": round(start_safe_exposure, decimal_num),
                "Safe Return (%)": round(floor_growth_rate * 100, decimal_num),
                "Risky Return (%)": round(monthly_return * 100, decimal_num),
                "Risky Return (€)": round(risky_return, decimal_num),
                "Safe Return (€)": round(
                    start_safe_exposure * floor_growth_rate, decimal_num
                ),
                "End Portfolio": round(wealth, decimal_num),
                "Drawdown (%)": cppi_drawdown,
                "S&P 500 Value": round(sp500_wealth, decimal_num),
                "S&P 500 Drawdown (%)": sp500_drawdown,
            }
        )

        # Update floor and peak wealth at the end of every month
        floor *= 1 + floor_growth_rate
        cppi_peak_wealth = max(cppi_peak_wealth, wealth)
        prev_wealth = wealth
        print("Start Date: " + str(start_date) + " Years: " + str(years))

    df = pd.DataFrame(simulation_logs)
    return df


# --- Example usage ---
sp500_data = get_data("^GSPC", start_date=start_date, end_date=end_date)

all_simulations = []
output_filename = "cppi_simu.csv"

# Check if the file exists and load existing data
if os.path.exists(output_filename):
    cppi_simu = pd.read_csv(output_filename)
else:
    cppi_simu = pd.DataFrame(
        columns=[  # Initialize cppi_simu with column names if the file doesn't exist
            "Start Date",
            "Date",
            "Duration (years)",
            "Start Portfolio",
            "Floor",
            "Cushion",
            "Start Risky Exp.",
            "Start Safe Exp.",
            "Safe Return (%)",
            "Risky Return (%)",
            "Risky Return (€)",
            "Safe Return (€)",
            "End Portfolio",
            "Drawdown (%)",
            "S&P 500 Value",
            "S&P 500 Drawdown (%)",
        ]
    )

for years in years_list:
    for start_date in sp500_data.index:
        # Calculate end_date using the 'years' variable
        end_date = (start_date + pd.DateOffset(years=years)).strftime("%Y-%m-%d")

        # Check if this simulation has already been run
        existing_sim = cppi_simu[
            (cppi_simu["Start Date"] == start_date.strftime("%Y-%m-%d"))
            & (cppi_simu["Date"] == end_date)
            & (cppi_simu["Duration (years)"] == years)  # Also check for duration
        ]
        if not existing_sim.empty:
            continue  # Skip this simulation if it already exists

        subset_data = sp500_data.loc[start_date:end_date]
        simulation_df = run_cppi_with_logging(
            subset_data,
            years,
            multiplier,
            initial_wealth,
            floor_growth_rate,
            rebalance_window,
        )

        # Check if simulation_df is empty or contains only NaNs before concatenating
        if not simulation_df.empty and not simulation_df.isnull().all().all():
            all_simulations.append(simulation_df)

        # Concatenate only if all_simulations is not empty
        if all_simulations:
            cppi_simu = pd.concat([cppi_simu] + all_simulations, ignore_index=True)
            cppi_simu.to_csv(output_filename, index=False)
            all_simulations = []  # Clear the list after saving to CSV
