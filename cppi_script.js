async function fetchData() {
    const response = await fetch('cppi_simu.csv');
    const data = await response.text();
    const parsedData = Papa.parse(data, { header: true, skipEmptyLines: true }).data;

    // Parse dates to ensure consistent format
    const formattedData = parsedData.map(row => ({
        ...row,
        Date: new Date(row.Date), // Parse date strings to Date objects
        'Start Date': new Date(row['Start Date'])
    }));

    return formattedData;
}

function prepareChartData(cppiData, selectedStartDate, selectedDuration) {
    const startDate = new Date(selectedStartDate);

    // Filter by Start Date AND Duration
    const filteredData = cppiData.filter(row => {
        return row['Start Date'].getTime() === startDate.getTime() && 
               row['Duration (years)'] == selectedDuration; 
    });

    // Calculate the initial wealth and floor based on the first row of filtered data
    const initialWealth = filteredData.length > 0 ? filteredData[0]['Start Portfolio'] : 100;
    const floor = filteredData.length > 0 ? filteredData[0]['Floor'] : 87; 

    // Shift 'Risky Exposure' data by one month
    const shiftedRiskyExposureData = filteredData.map((row, index) => {
        if (index > 0) {
            const prevDate = new Date(filteredData[index - 1].Date);
            prevDate.setMonth(prevDate.getMonth() - 1); // Subtract 1 month
            return { x: prevDate, y: row['Start Risky Exp.'] }; // Use x/y for offsetting
        } else {
            return null; // Skip the first data point
        }
    }).filter(item => item !== null); // Remove the null (first) item
    
    return {
        labels: filteredData.map(row => row.Date),
        datasets: [
            {
                label: 'CPPI',
                data: filteredData.map(row => row['End Portfolio']),
                borderColor: 'rgba(75, 192, 192, 1)',
                //backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: 'S&P 500',
                data: filteredData.map(row => row['S&P 500 Value']),
                borderColor: 'rgba(255, 99, 132, 1)',
                //backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2,
            },
            {
                label: 'Initial Wealth',
                data: filteredData.map(() => initialWealth), 
                borderColor: 'rgba(255, 255, 255, 0.5)', // Light color
                tension: 0,
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [1, 2], // Dotted line
            },
            {
                label: 'Floor',
                data: filteredData.map(row => row.Floor), 
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0,
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [1, 2], // Dotted line
            },
            {
                label: 'Risky Exposure',
                data: shiftedRiskyExposureData, // Use the shifted data
                borderColor: 'grey', 
                backgroundColor: 'rgba(128, 128, 128, 0.2)', // Light grey with transparency
                tension: 0.4, 
                pointRadius: 0,
                borderWidth: 0, 
                fill: true, 
                borderDash: [2, 2], // Dotted line
            }
        ]
    };
}

let cppiChart; // Declare a variable to store the chart instance

async function generateChart() {
    const cppiData = await fetchData();
    const selectedStartDate = document.getElementById('startDate').value;
    const selectedDuration = parseInt(document.getElementById('duration').value, 10);

    const chartData = prepareChartData(cppiData, selectedStartDate, selectedDuration);

    const ctx = document.getElementById('cppiChart').getContext('2d');

    // Destroy the previous chart instance before creating a new one
    if (cppiChart) {
        cppiChart.destroy();
    }

    cppiChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff',
                        // Include only year and month in the labels
                        callback: function(value, index, values) {
                            const date = new Date(this.getLabelForValue(value)); 
                            return date.toLocaleString('default', { year: 'numeric', month: 'short' });
                        }
                    },
                    grid: {
                        color: '#2a2a2a'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: '#2a2a2a'
                    }
                }
            },
            elements: {
                point: {
                    radius: 0 // Set the radius of the data points to 0 to hide them
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

async function populateStartingDates() {
    const cppiData = await fetchData();
    const startDateSelect = document.getElementById('startDate');

    // Extract unique starting dates (using a Set to avoid duplicates)
    const uniqueStartDates = [...new Set(cppiData.map(row => row['Start Date'].toISOString().split('T')[0]))];

    uniqueStartDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.text = date;
        startDateSelect.add(option);
    });
}

// Add event listeners to both dropdowns
document.getElementById('startDate').addEventListener('change', generateChart);
document.getElementById('duration').addEventListener('change', generateChart);

// Call the function to populate the starting dates
populateStartingDates();

// Initial chart generation
generateChart();