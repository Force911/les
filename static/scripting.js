// Initialize variables for chart, data, and grouped data
let rawData = [];
let groupedData = [];

// Function to simulate data retrieval over WiFi
function fetchDataOverWiFi() {
    // Replace this with your WiFi data retrieval logic
    // For demo, let's assume data is fetched as JSON
    fetch("path_to_your_data_endpoint")
        .then(response => response.json())
        .then(data => {
            rawData = data;
            processData(rawData);
            overview();
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to upload a .txt file
function uploadData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            rawData = parseTxtData(e.target.result);
            processData(rawData);
            overview();
        };
        reader.readAsText(file);
    };
    input.click();
}

// Parse .txt data format and return an array of objects
function parseTxtData(data) {
    const lines = data.trim().split('\n');
    return lines.map(line => {
        const [time, hr, spo2, temp] = line.split(',');
        return { time, hr: parseFloat(hr), spo2: parseFloat(spo2), temp: parseFloat(temp) };
    });
}

// Determine sleep stage based on hr, spo2, and temp
function determineSleepStage(hr, spo2, temp) {
    const HR_AWAKE = 70, HR_LIGHT = 50, HR_DEEP = 40, HR_REM = 60;
    const SPO2_NORMAL = 95, TEMP_AWAKE = 36.6, TEMP_SLEEP = 36.0;

    if (hr >= HR_AWAKE) return "Awake";
    if (HR_LIGHT < hr < HR_AWAKE) return "Light Sleep";
    if (hr <= HR_DEEP) return "Deep Sleep";
    if (HR_REM <= hr < HR_AWAKE) return "REM Sleep";
    return "Unknown";
    alert("its it");
}

// Process raw data, determine sleep stages, and group them
function processData(data) {
    let currentStage = null;
    let groupedStage = { stage: null, start: null, end: null, duration: 0 };
    groupedData = [];

    data.forEach((entry, index) => {
        const stage = determineSleepStage(entry.hr, entry.spo2, entry.temp);
        if (stage !== currentStage) {
            if (currentStage) groupedData.push({ ...groupedStage });
            currentStage = stage;
            groupedStage = { stage, start: entry.time, end: entry.time, duration: 0 };
        }
        groupedStage.end = entry.time;
        groupedStage.duration += 1.5; // Assuming each entry represents 1.5 minutes
    });
    if (groupedStage.stage) groupedData.push(groupedStage);
}

// Display overview with grouped sleep stages
function overview() {
    const chartElement = document.getElementById("myChart").getContext("2d");
    const labels = groupedData.map(entry => entry.start);
    const data = groupedData.map(entry => entry.duration);
    const stages = groupedData.map(entry => entry.stage);

    new Chart(chartElement, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Sleep Stage Duration (min)',
                data,
                backgroundColor: stages.map(stage => {
                    switch (stage) {
                        case 'Awake': return 'rgba(255, 99, 132, 0.6)';
                        case 'Light Sleep': return 'rgba(54, 162, 235, 0.6)';
                        case 'Deep Sleep': return 'rgba(75, 192, 192, 0.6)';
                        case 'REM Sleep': return 'rgba(153, 102, 255, 0.6)';
                        default: return 'rgba(201, 203, 207, 0.6)';
                    }
                })
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Duration (min)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Display individual charts for Temp, SpO2, and HR
function showChart(type) {
    const chartElement = document.getElementById("myChart").getContext("2d");
    const labels = rawData.map(entry => entry.time);
    let data = [];
    let label = '';

    switch (type) {
        case 'temp':
            data = rawData.map(entry => entry.temp);
            label = 'Temperature (°C)';
            break;
        case 'spo2':
            data = rawData.map(entry => entry.spo2);
            label = 'SpO2 (%)';
            break;
        case 'hr':
            data = rawData.map(entry => entry.hr);
            label = 'Heart Rate (bpm)';
            break;
    }

    new Chart(chartElement, {
        type: 'line',
        data: { labels, datasets: [{ label, data, borderColor: 'rgba(75, 192, 192, 1)', tension: 0.1 }] },
        options: {
            scales: {
                y: { beginAtZero: true, title: { display: true, text: label } },
                x: { title: { display: true, text: 'Time' } }
            }
        }
    });
}

// Initialize WiFi fetch on page load
document.addEventListener("DOMContentLoaded", fetchDataOverWiFi);
