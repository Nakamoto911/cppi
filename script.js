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

function prepareTerminalWealthData(filteredData) {
    const riskFreeRate = 2.8;
    const initialInvestment = 100;
    const riskFreeTerminalWealth = initialInvestment * Math.pow(1 + riskFreeRate / 100, filteredData.length);

    return {
        labels: filteredData.map((row, index) => {
            const date = new Date(row.start_date);
            return index % 10 === 0 ? date.getFullYear() : '';
        }),
        datasets: [
            {
                label: 'CPPI Terminal Wealth',
                data: filteredData.map(row => +row.cppi_terminal_wealth),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
            },
            {
                label: 'S&P 500 Terminal Wealth',
                data: filteredData.map(row => +row.sp500_terminal_wealth),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
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
            },
            {
                label: 'Risk-Free Asset',
                data: filteredData.map(row => {
                    const years = +row.years; // Get the number of years from the data
                    return 100 * Math.pow(1 + 0.028, years); // Calculate terminal wealth for risk-free asset
                }),
                borderColor: 'rgba(255, 165, 0, 0.5)', // Orange color
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
                borderDash: [1, 2], // Dotted line
            }
        ]
    };
}

function prepareCAGRData(filteredData) {
    const riskFreeRate = 2.8;

    return {
        labels: filteredData.map((row, index) => {
            const date = new Date(row.start_date);
            return index % 10 === 0 ? date.getFullYear() : '';
        }),
        datasets: [
            {
                label: 'CPPI CAGR',
                data: filteredData.map(row => +row.cppi_cagr * 100),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
            },
            {
                label: 'S&P 500 CAGR',
                data: filteredData.map(row => +row.sp500_cagr * 100),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
            },
            {
                label: '0% Return', // Changed label
                data: filteredData.map(() => 0), // Data now represents 0% return
                borderColor: 'rgba(255, 255, 255, 0.5)', // Light color
                backgroundColor: 'rgba(255, 255, 255, 0)', // No fill
                tension: 0,
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [1, 2], // Dotted line
            },
            {
                label: 'Risk-Free Rate',
                data: filteredData.map(() => 2.8), // Fixed 2.8% CAGR
                borderColor: 'rgba(255, 165, 0, 0.5)', // Orange color
                backgroundColor: 'rgba(255, 165, 0, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
                borderDash: [1, 2], // Dotted line
            }
        ]
    };
}

function prepareVolatilityData(filteredData) {
    return {
        labels: filteredData.map((row, index) => {
            const date = new Date(row.start_date);
            return index % 10 === 0 ? date.getFullYear() : '';
        }),
        datasets: [
            {
                label: 'CPPI Volatility',
                data: filteredData.map(row => +row.cppi_volatility * 100),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
            },
            {
                label: 'S&P 500 Volatility',
                data: filteredData.map(row => +row.sp500_volatility * 100),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
            }
        ]
    };
}

async function initializeDashboard() {
    const data = await fetchData();
    const yearsSelect = document.getElementById('years');
    const multiplierSelect = document.getElementById('multiplier');

    const terminalWealthTab = document.getElementById('terminalWealthTab');
    const cagrTab = document.getElementById('cagrTab');
    const volatilityTab = document.getElementById('volatilityTab');

    // Initialize the chart with Terminal Wealth data
    let chart = new Chart(document.getElementById('chart').getContext('2d'), {
        type: 'line',
        data: prepareTerminalWealthData(filterData(data, +yearsSelect.value, +multiplierSelect.value)),
        options: {
            scales: {
                x: {
                    ticks: {
                        maxRotation: 0, // Horizontal labels
                        minRotation: 0,
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        useLineStyle: true,
                        boxWidth: 15
                    }
                },
                tooltip: {
                    position: 'nearest', // Set tooltip position to average
                    intersect: false,
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.label === 'Initial Wealth' || context.dataset.label === '0% Return') {
                                return null; // Don't show a tooltip for this dataset
                            }
                
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (cagrTab.classList.contains('active') || volatilityTab.classList.contains('active')) {
                                    label += context.parsed.y.toFixed(2) + '%';
                                } else {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                            }
                            return label;
                        },
                        title: function(context) {
                            const date = new Date(filterData(data, +yearsSelect.value, +multiplierSelect.value)[context[0].dataIndex].start_date);
                            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                        }
                    }
                }
            },
            events: ['mousemove', 'mouseout', 'touchstart', 'touchmove'], // Ensure touch events are included
        },
    });

    let hoveredIndex = null; // Store the current hovered x-axis index

    // Plugin for drawing the vertical dashed line
    const verticalLinePlugin = {
        id: 'verticalLine',
        afterDatasetsDraw(chart) {
            if (hoveredIndex !== null) {
                const ctx = chart.ctx;
                const xScale = chart.scales.x;
                const xPosition = xScale.getPixelForValue(hoveredIndex);
    
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([5, 5]); // Set dashed line style
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Light white line
                ctx.lineWidth = 1;
    
                // Draw the vertical line
                ctx.moveTo(xPosition, chart.chartArea.top);
                ctx.lineTo(xPosition, chart.chartArea.bottom);
                ctx.stroke();
                ctx.restore();
            }
        },
    };
    
    // Add the plugin to Chart.js
    Chart.register(verticalLinePlugin);
    
    // Update `onHover` to handle vertical line and points
    chart.options.onHover = (event) => {
        const xPosition = event.native.offsetX;
        const xScale = chart.scales.x;
        hoveredIndex = xScale.getValueForPixel(xPosition);
    
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            if (datasetIndex !== 2) { // Skip "Initial Wealth" or datasets not needing interaction
                dataset.pointRadius = dataset.data.map((_, index) => (index === hoveredIndex ? 3 : 0));
                dataset.pointBackgroundColor = dataset.data.map((_, index) =>
                    index === hoveredIndex ? dataset.borderColor : 'rgba(0, 0, 0, 0)'
                );
            }
        });
    
        chart.update('none'); // Update the chart without animation
    };
    
    // Clear hoveredIndex when the mouse leaves the chart
    chart.options.onLeave = () => {
        hoveredIndex = null;
        chart.data.datasets.forEach((dataset) => {
            dataset.pointRadius = dataset.data.map(() => 0);
            dataset.pointBackgroundColor = dataset.data.map(() => 'rgba(0, 0, 0, 0)');
        });
        chart.update('none');
    };

    chart.options.onTouch = (event, elements) => {
        chart.data.datasets.forEach((dataset, index) => {
            if (index !== 2) { //Except Initial Wealth
                dataset.pointRadius = dataset.data.map((_, i) => (elements.length > 0 && i === elements[0].index) ? 3 : 0);
            }
        });
        chart.update();
    };

    function median(values) {
        if (values.length === 0) return 0;

        values.sort((a, b) => a - b);
        const half = Math.floor(values.length / 2);
        if (values.length % 2) {
            return values[half];
        } else {
            return (values[half - 1] + values[half]) / 2.0;
        }
    }

    function updateCharts() {
        const years = +yearsSelect.value;
        const multiplier = +multiplierSelect.value;
        const filteredData = filterData(data, years, multiplier);

        let chartData;
        if (terminalWealthTab.classList.contains('active')) {
            chartData = prepareTerminalWealthData(filteredData);
        } else if (cagrTab.classList.contains('active')) {
            chartData = prepareCAGRData(filteredData);
        } else if (volatilityTab.classList.contains('active')) {
            chartData = prepareVolatilityData(filteredData);
        }

    // Update the chart data and labels
    chart.data.labels = chartData.labels;

    // Check if the number of datasets has changed
    if (chart.data.datasets.length !== chartData.datasets.length) {
        // If the number of datasets is different, replace the entire datasets array
        chart.data.datasets = chartData.datasets; 
    } else {
        // Otherwise, update the data for each existing dataset
        chart.data.datasets.forEach((dataset, i) => {
            if (chartData.datasets[i]) {
                dataset.label = chartData.datasets[i].label;
                dataset.data = chartData.datasets[i].data; 
            }
        });
    }
 
     // Trigger the update with animation
     chart.update();

        // Calculate and update table data
        const cppiCAGR = median(filteredData.map(row => +row.cppi_cagr));
        const sp500CAGR = median(filteredData.map(row => +row.sp500_cagr));
        const cppiTerminalWealth = median(filteredData.map(row => +row.cppi_terminal_wealth));
        const sp500TerminalWealth = median(filteredData.map(row => +row.sp500_terminal_wealth));
        const cppiVolatility = median(filteredData.map(row => +row.cppi_volatility));
        const sp500Volatility = median(filteredData.map(row => +row.sp500_volatility));
        const cppiMaxDrawdown = Math.min(...filteredData.map(row => +row.cppi_max_drawdown));
        const sp500MaxDrawdown = Math.min(...filteredData.map(row => +row.sp500_max_drawdown));

        // New calculations
        const cppiLossesPercent = (filteredData.filter(row => +row.cppi_terminal_wealth < 100).length / filteredData.length * 100).toFixed(0) + "%";
        const sp500LossesPercent = (filteredData.filter(row => +row.sp500_terminal_wealth < 100).length / filteredData.length * 100).toFixed(0) + "%";

        const riskFreeWealth = filteredData.map(row => {
            const years = +row.years;
            return 100 * Math.pow(1 + 0.028, years);
        });

        const cppiBelowRiskFreePercent = (filteredData.filter((row, index) => +row.cppi_terminal_wealth < riskFreeWealth[index]).length / filteredData.length * 100).toFixed(0) + "%";
        const sp500BelowRiskFreePercent = (filteredData.filter((row, index) => +row.sp500_terminal_wealth < riskFreeWealth[index]).length / filteredData.length * 100).toFixed(0) + "%";
        
        document.getElementById('cppi-cagr').textContent = (cppiCAGR * 100).toFixed(2) + "%";
        document.getElementById('sp500-cagr').textContent = (sp500CAGR * 100).toFixed(2) + "%";
        document.getElementById('cppi-terminal-wealth').textContent = cppiTerminalWealth.toFixed(1);
        document.getElementById('sp500-terminal-wealth').textContent = sp500TerminalWealth.toFixed(1);
        document.getElementById('cppi-volatility').textContent = (cppiVolatility * 100).toFixed(2) + "%";
        document.getElementById('sp500-volatility').textContent = (sp500Volatility * 100).toFixed(2) + "%";
        document.getElementById('cppi-max-drawdown').textContent = (cppiMaxDrawdown).toFixed(2) + "%";
        document.getElementById('sp500-max-drawdown').textContent = (sp500MaxDrawdown).toFixed(2) + "%";
        document.getElementById('cppi-losses-percent').textContent = cppiLossesPercent;
        document.getElementById('sp500-losses-percent').textContent = sp500LossesPercent;
        document.getElementById('cppi-below-risk-free-percent').textContent = cppiBelowRiskFreePercent;
        document.getElementById('sp500-below-risk-free-percent').textContent = sp500BelowRiskFreePercent;;


    }

    yearsSelect.addEventListener('change', updateCharts);
    multiplierSelect.addEventListener('change', updateCharts);

    terminalWealthTab.addEventListener('click', () => {
        terminalWealthTab.classList.add('active');
        cagrTab.classList.remove('active');
        volatilityTab.classList.remove('active');
        updateCharts();
    });

    cagrTab.addEventListener('click', () => {
        cagrTab.classList.add('active');
        terminalWealthTab.classList.remove('active');
        volatilityTab.classList.remove('active');
        updateCharts();
    });

    volatilityTab.addEventListener('click', () => {
        volatilityTab.classList.add('active');
        terminalWealthTab.classList.remove('active');
        cagrTab.classList.remove('active');
        updateCharts();
    });

    // Initial chart render
    updateCharts();
    
}

initializeDashboard();
