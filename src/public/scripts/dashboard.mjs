
import { Tabulator } from 'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator_esm.min.mjs';
import { ArcElement, Chart, Colors, Legend, PieController, Title } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/+esm'

// setup table data (fetch from server)
const apiRes = await fetch('/api/spm');
if (!apiRes.ok) {
    console.error('API call failed - bad response');
    throw new Error('API call failed - bad response');
}
const tableData = await apiRes.json();
if (!Array.isArray(tableData)) {
    console.error('API call failed - invalid response');
    throw new Error('API call failed - invalid response')
}
tableData.forEach((v, i) => {
    delete tableData[i]._id;
});

// setup table
const table = new Tabulator('#table', {
    //height: 200,
    data: tableData,
    layout: 'fitColumns',
    columns: [
        { title: 'Process ID', field: 'pid' },
        { title: 'Process Name', field: 'name' },
        { title: 'Start Time (s)', field: 'start_time' },
        { title: 'Duration (s)', field: 'duration' }
    ]
});

// setup pie chart
Chart.register(PieController);
Chart.register(ArcElement);
Chart.register(Colors);
Chart.register(Legend);
Chart.register(Title);
const pieChart = new Chart(document.getElementById('results'), {
    type: 'pie',
    data: {
        labels: tableData.map(v => v.name),
        datasets: [{
            label: 'Duration Comparison',
            data: tableData.map(v => v.duration)
        }]
    },
    options: {
        responsive: false
    }
});