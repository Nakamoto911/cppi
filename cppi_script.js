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
    
    const riskFreeRate = 0.028; // 2.8% per year
    const quarterlyRate = riskFreeRate / 4;
    const riskFreeData = filteredData.map((row, index) => {
        const currentQuarter = Math.floor(index / 3) + 1; // Calculate current quarter
        return initialWealth * (1 + quarterlyRate) ** currentQuarter;
    });

    return {
        labels: filteredData.map(row => row.Date),
        datasets: [
            {
                label: 'CPPI',
                data: filteredData.map(row => row['End Portfolio']),
                borderColor: 'rgba(75, 192, 192, 1)',
                //backgroundColor: 'rgba(75, 192, 192, 0.2)',
                pointRadius: 3,
                borderWidth: 2,
            },
            {
                label: 'S&P 500',
                data: filteredData.map(row => row['S&P 500 Value']),
                borderColor: 'rgba(255, 99, 132, 1)',
                //backgroundColor: 'rgba(255, 99, 132, 0.2)',
                pointRadius: 3,
                borderWidth: 2,
            },
            {
                label: 'Initial Wealth',
                data: filteredData.map(() => initialWealth), 
                borderColor: 'rgba(255, 255, 255, 0.5)', // Light color
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [1, 2], // Dotted line
            },
            {
                label: 'Floor',
                data: filteredData.map(row => row.Floor), 
                borderColor: 'rgba(75, 192, 192, 1)',
                pointRadius: 0,
                borderWidth: 1,
                borderDash: [6, 2], // Dotted line
            },
            {
                label: 'Risk-Free Rate',
                data: riskFreeData,
                borderColor: 'rgba(255, 165, 0, 0.5)', // Orange color
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 1.2,
                borderDash: [1, 2], // Dotted line
            },
            {
                label: 'Risky Exposure',
                data: shiftedRiskyExposureData, // Use the shifted data
                borderColor: 'grey', 
                backgroundColor: 'rgba(128, 128, 128, 0.2)', // Light grey with transparency
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
                        // Display only the year in YYYY format
                        callback: function(value, index, values) {
                            const date = new Date(this.getLabelForValue(value));
                            return date.getFullYear(); 
                        },
                        // Reduce the number of ticks
                        autoSkip: true, 
                        maxTicksLimit: Math.max(1, selectedDuration - 1)
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
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const date = new Date(context[0].label);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); 
                        }
                    }
                },
            }
        }
    });
    // Update the table after generating the chart 
    updateTable(cppiData, selectedStartDate, selectedDuration); 
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

async function calculateStats(cppiData, selectedStartDate, selectedDuration) {
    const startDate = new Date(selectedStartDate);

    // Filter data by Start Date and Duration
    const filteredData = cppiData.filter(row => {
        return row['Start Date'].getTime() === startDate.getTime() && 
               row['Duration (years)'] == selectedDuration; 
    });

    if (filteredData.length === 0) {
        return null; // Or handle the case where no data is found
    }

    const initialWealth = filteredData[0]['Start Portfolio'];
    const finalWealthCPPI = filteredData[filteredData.length - 1]['End Portfolio'];
    const finalWealthSP500 = filteredData[filteredData.length - 1]['S&P 500 Value'];
    const years = selectedDuration;

    // Calculate CAGR (Compound Annual Growth Rate)
    const cagrCPPI = (Math.pow(finalWealthCPPI / initialWealth, 1 / years) - 1) * 100;
    const cagrSP500 = (Math.pow(finalWealthSP500 / initialWealth, 1 / years) - 1) * 100;
    const cagrRiskFree = 2.8;

    return {
        cppiFinalWealth: finalWealthCPPI.toLocaleString('en-US', { maximumFractionDigits: 1 }), 
        cppiCAGR: `${cagrCPPI.toFixed(1)}%`,
        sp500FinalWealth: finalWealthSP500.toLocaleString('en-US', { maximumFractionDigits: 1 }),
        sp500CAGR: `${cagrSP500.toFixed(1)}%`, 
        riskFreeFinalWealth: (initialWealth * (1 + 0.028) ** years).toLocaleString('en-US', { maximumFractionDigits: 1 }),
        riskFreeCAGR: `${cagrRiskFree.toFixed(1)}%` 
    };
}

async function updateStats() {
    const cppiData = await fetchData();
    const selectedStartDate = document.getElementById('startDate').value;
    const selectedDuration = parseInt(document.getElementById('duration').value, 10);
  
    const stats = await calculateStats(cppiData, selectedStartDate, selectedDuration);
  
    if (stats) {
      document.getElementById('cppi-final-wealth').textContent = stats.cppiFinalWealth;
      document.getElementById('cppi-cagr').textContent = stats.cppiCAGR;
      document.getElementById('sp500-final-wealth').textContent = stats.sp500FinalWealth;
      document.getElementById('sp500-cagr').textContent = stats.sp500CAGR;
      document.getElementById('risk-free-final-wealth').textContent = stats.riskFreeFinalWealth;
      document.getElementById('risk-free-cagr').textContent = stats.riskFreeCAGR;
  
      // Update CAGR badges with color based on value
      const cagrElements = ['cppi-cagr', 'sp500-cagr', 'risk-free-cagr'];
      cagrElements.forEach(elementId => {
        const cagrValue = parseFloat(document.getElementById(elementId).textContent);
        const badgeElement = document.getElementById(elementId).parentElement;
        if (cagrValue < 0) {
          badgeElement.classList.remove('bg-green-transparent', 'text-green-500');
          badgeElement.classList.add('bg-red-transparent', 'text-red-500');
        } else {
          badgeElement.classList.remove('bg-red-transparent', 'text-red-500');
          badgeElement.classList.add('bg-green-transparent', 'text-green-500');
        }
      });
    }
  }
  
  

async function updateTable(cppiData, selectedStartDate, selectedDuration) {
    const startDate = new Date(selectedStartDate);
  
    // Filter data by Start Date and Duration
    const filteredData = cppiData.filter(row => {
      return row['Start Date'].getTime() === startDate.getTime() &&
        row['Duration (years)'] == selectedDuration;
    });
  
    const tableBody = document.getElementById('cppiTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; // Clear existing table rows
  
    filteredData.forEach(row => {
      const newRow = tableBody.insertRow();
  
      // Create cells and populate with data (using toFixed(1) for numeric values)
      newRow.insertCell().textContent = row.Date.toLocaleDateString();
      newRow.insertCell().textContent = row['Start Portfolio']; 
      newRow.insertCell().textContent = row.Floor;
      newRow.insertCell().textContent = row.Cushion;
      newRow.insertCell().textContent = row['Start Risky Exp.'];
      newRow.insertCell().textContent = row['Start Safe Exp.'];
      newRow.insertCell().textContent = row['Risky Return (€)'];
      newRow.insertCell().textContent = row['Safe Return (€)']; 
    });
  }
  
  // Add event listeners to both dropdowns
  document.getElementById('startDate').addEventListener('change', () => {
    generateChart();
    updateStats(); // Update stats when start date changes
  });
  document.getElementById('duration').addEventListener('change', () => {
    generateChart();
    updateStats(); // Update stats when duration changes
  });
  
  // Call the function to populate the starting dates
  populateStartingDates();
  
  // Initial chart generation and stats update
  generateChart();
  updateStats();