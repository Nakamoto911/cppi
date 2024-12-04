// Load the data (CSV) dynamically
const csvFilePath = 'cppi_results2.csv'; // Ensure the CSV is in the same directory or adjust the path.

async function fetchData() {
    const response = await fetch(csvFilePath);
    const data = await response.text();
    const parsedData = Papa.parse(data, { header: true, skipEmptyLines: true }).data; // Requires PapaParse
    return parsedData;
}

function filterData(data, years, multiplier) {
    return data.filter(row => +row.years === years && +row.multiplier === multiplier);
}

function createCharts(filteredData) {
    // Terminal Wealth Chart
    const ctx1 = document.getElementById('terminalWealthChart').getContext('2d');

    // Format dates and reduce frequency
    const labels = filteredData.map((row, index) => {
        const date = new Date(row.start_date);
        return index % 10 === 0 ? date.getFullYear() : ''; // Show only every 10th year
    });

    const terminalWealthChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels, // Use formatted labels
            datasets: [
                {
                    label: 'CPPI Terminal Wealth',
                    data: filteredData.map(row => +row.cppi_terminal_wealth),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1.2, // Thinner line
                },
                {
                    label: 'Buy-and-Hold Terminal Wealth',
                    data: filteredData.map(row => +row.buy_and_hold_terminal_wealth),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 1.2, // Thinner line
                },
                {
                    label: 'Initial Wealth',
                    data: filteredData.map(() => 100), // Fixed value of 100
                    borderColor: 'rgba(255, 255, 255, 0.5)', // Light color
                    backgroundColor: 'rgba(255, 255, 255, 0)', // No fill
                    tension: 0,
                    pointRadius: 0,
                    borderWidth: 1,
                    borderDash: [1, 2], // Dotted line
                }
            ],
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0, // Horizontal labels
                        minRotation: 0,
                    }
                }
            },
            plugins: { // Add this plugins block
                legend: {
                    labels: {
                        useLineStyle: true,
                        boxWidth: 15
                    }
                }
            }
        }
    });

    return terminalWealthChart;
}

async function initializeDashboard() {
    const data = await fetchData();
    const yearsSelect = document.getElementById('years');
    const multiplierSelect = document.getElementById('multiplier');
    const fullscreenButton = document.getElementById('fullscreen-button');
    const fullscreenChart = document.getElementById('fullscreen-chart');
    const fullscreenChartCanvas = document.getElementById('fullscreen-chart-canvas');
    const closeFullscreenButton = document.getElementById('close-fullscreen-button');

    let terminalWealthChart = createCharts(filterData(data, +yearsSelect.value, +multiplierSelect.value)); // Initialize the chart

    function median(values) {
        if (values.length === 0) return 0;
    
        values.sort((a, b) => a - b);
        const half = Math.floor(values.length / 2);
        if (values.length % 2) {
            return   
     values[half];
        } else {
            return (values[half - 1] + values[half]) / 2.0;
        }
    }
    
    function updateCharts() {
        const years = +yearsSelect.value;
        const multiplier = +multiplierSelect.value;
        const filteredData = filterData(data, years, multiplier);

        // Format dates and reduce frequency
        const labels = filteredData.map((row, index) => {
            const date = new Date(row.start_date);
            return index % 10 === 0 ? date.getFullYear() : ''; // Show only every 10th year
        });

        // Update the chart data
        terminalWealthChart.data.labels = labels;
        terminalWealthChart.data.datasets[0].data = filteredData.map(row => +row.cppi_terminal_wealth);
        terminalWealthChart.data.datasets[1].data = filteredData.map(row => +row.sp500_terminal_wealth);

        // Trigger the update with animation
        terminalWealthChart.update();

        // Calculate and update table data
        const cppiCAGR = median(filteredData.map(row => +row.cppi_cagr));
        const sp500CAGR = median(filteredData.map(row => +row.sp500_cagr));
        const cppiTerminalWealth = median(filteredData.map(row => +row.cppi_terminal_wealth));
        const sp500TerminalWealth = median(filteredData.map(row => +row.sp500_terminal_wealth));
        const cppiVolatility = median(filteredData.map(row => +row.cppi_volatility));
        const sp500Volatility = median(filteredData.map(row => +row.sp500_volatility));
        const cppiMaxDrawdown = Math.min(...filteredData.map(row => +row.cppi_max_drawdown));
        const sp500MaxDrawdown = Math.min(...filteredData.map(row => +row.sp500_max_drawdown));
    
        document.getElementById('cppi-cagr').textContent = (cppiCAGR * 100).toFixed(2) + "%";
        document.getElementById('sp500-cagr').textContent = (sp500CAGR * 100).toFixed(2) + "%";
        document.getElementById('cppi-terminal-wealth').textContent = cppiTerminalWealth.toFixed(1);
        document.getElementById('sp500-terminal-wealth').textContent = sp500TerminalWealth.toFixed(1);
        document.getElementById('cppi-volatility').textContent = (cppiVolatility * 100).toFixed(2) + "%";
        document.getElementById('sp500-volatility').textContent = (sp500Volatility * 100).toFixed(2) + "%";
        document.getElementById('cppi-max-drawdown').textContent = (cppiMaxDrawdown).toFixed(2) + "%";
        document.getElementById('sp500-max-drawdown').textContent = (sp500MaxDrawdown).toFixed(2) + "%";

        // Update the stat box values
        document.getElementById('cppi-cagr-stat').textContent = (cppiCAGR * 100).toFixed(2) + "%";
        document.getElementById('sp500-cagr-stat').textContent = (sp500CAGR * 100).toFixed(2) + "%";
        document.getElementById('cppi-volatility-stat').textContent = (cppiVolatility * 100).toFixed(2) + "%";
        document.getElementById('sp500-volatility-stat').textContent = (sp500Volatility * 100).toFixed(2) + "%"; 

    }

    yearsSelect.addEventListener('change', updateCharts);
    multiplierSelect.addEventListener('change', updateCharts);


    // Initial chart render
    updateCharts();
}

initializeDashboard();
