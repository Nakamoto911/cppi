# CPPI (Constant Proportion Portfolio Insurance) Simulator

**CPPI** is a web-based interactive tool that demonstrates and visualizes the Constant Proportion Portfolio Insurance (CPPI) investment strategy. The goal of CPPI is to allow investment in risky assets (like stocks) while guaranteeing a minimum level of capital at the end of the investment period.

:rocket: **[Live Demo](https://cppi.pages.dev/)**

## What is CPPI?

**CPPI (Constant Proportion Portfolio Insurance)** is an investment technique that dynamically allocates funds between a risky asset (such as stocks) and a safe asset (such as bonds or cash) to ensure that the portfolio does not fall below a predetermined minimum value, known as the floor. This approach lets investors participate in potential market gains while protecting against significant losses.

Key features of CPPI:
- **Cushion:** The amount you can risk, calculated as the difference between your total wealth and the floor (the minimum wealth you want to preserve).
- **Dynamic Allocation:** The allocation to risky assets is a multiple (the "multiplier") of the cushion. As your cushion grows, your risky asset allocation increases; as it shrinks, your allocation decreases.
- **Floor Calculation:** The floor is recalculated at regular intervals (typically quarterly), representing the minimum level of capital to be preserved, compounded to the current period.
- **Periodic Rebalancing:** Portfolios are rebalanced every three months to keep the allocation consistent with the current cushion and floor.
- **Interest Reinvestment:** Interest from the safe asset is paid at each rebalancing and reinvested.

## Features

- **Interactive Dashboard:** Visualize how CPPI performs compared to a simple S&P 500 investment and a risk-free asset.
- **Backtest Simulations:** See historical backtests of CPPI strategies over different periods and multipliers.
- **Customizable Parameters:** Adjust the investment period and CPPI multiplier to explore various scenarios.
- **Performance Metrics:** View terminal wealth, CAGR, volatility, max drawdown, and probabilities of losses for CPPI vs. S&P 500.

## How It Works

1. **Initial Wealth:** Each simulation starts with an initial wealth of 100.
2. **Quarterly Rebalancing:** Portfolios are rebalanced every three months.
3. **Floor Calculation:** At each rebalancing, the minimum wealth (floor) is recalculated by discounting the target wealth at the risk-free rate.
4. **Interest Payments:** Safe asset interest is paid and reinvested at each rebalancing.

### Example Floor Calculation

```
Floor (today) = Target Wealth × (1 + Safe Asset Rate)^(-N)
```
*Where N is the number of remaining rebalancing periods.*

## Project Structure

- `index.html` – Main dashboard and backtest visualization.
- `cppi_period.html` – Explore results over specific periods.
- `what_is_cppi.html` – Explains the CPPI concept.
- `script.js`, `cppi_script.js` – Core logic for simulation, charting, and interactivity.
- `cppi_results2.csv` – Historical data for backtesting.
- `img/` – Icons and images used in the interface.

## Usage

1. **Clone the repository:**
    ```
    git clone https://github.com/Nakamoto911/cppi.git
    ```
2. Open `index.html` in your browser.
3. Adjust the investment period and multiplier to see how CPPI would have performed historically versus the S&P 500 and the risk-free asset.

Or try the :rocket: **[Live Demo](https://cppi.pages.dev/)** in your browser!

## Dependencies

- [Chart.js](https://www.chartjs.org/) – For data visualization and charts.
- CSV parser (client-side JS) for reading historical results.

## License

*No license specified yet.*

## Author

[Nakamoto911](https://github.com/Nakamoto911)

---

*This project is for educational and illustrative purposes only. No investment advice is provided.*
