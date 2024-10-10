
import { Tabulator } from 'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator_esm.min.mjs';
import { ArcElement, Chart, Colors, Legend, PieController, Title } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/+esm'

// constants
const MAX_TIME_AND_PID = 255;
const MAX_NAME_LENGTH = 64;
const MAX_NUM_CPUS = 16;
const MAX_PROCESSES = 255;

// queue size element
const queueSizeP = document.querySelector('#queue-size');

// error feedback elements
const simErrorDiv = document.querySelector('div#simError');
const simErrorP = document.querySelector('div#simError > p');

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
const mainTable = new Tabulator('#table', {
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

// setup live process table
const liveTable = new Tabulator('#live-table', {
    //height: 200,
    data: [],
    layout: 'fitColumns',
    columns: [
        { title: 'Process ID', field: 'pid' },
        { title: 'Remaining Time (s)', field: 'remaining_time' }
    ]
});

function displayFrames() {

    // input elements
    const numCpusInput = document.querySelector('input#numCpus');
    const algTypeInput = document.querySelector('input[name=algType]:checked');
    const rrQuantumInput = document.querySelector('input#rrQuantum');

    // validate process manager data
    const numCpus = +numCpusInput?.valueAsNumber;
    const algType = +algTypeInput?.value;
    const rrQuantum = +rrQuantumInput?.valueAsNumber;
    console.log(numCpus);
    console.log(algTypeInput?.value);
    console.log(rrQuantum);
    if (!Number.isInteger(numCpus) || numCpus < 1 || numCpus > MAX_NUM_CPUS ||
        !Number.isInteger(algType) || algType < 0 || algType > 4 ||
        !Number.isInteger(rrQuantum) || rrQuantum < 1 || rrQuantum > MAX_TIME_AND_PID) {

        const errStr = `Process manager settings validation failed - number of CPUs must be 1-16, algorithm type must be 0-4, and round robin quantum must be 1-${MAX_TIME_AND_PID}`;
        console.error(errStr);
        simErrorP.textContent = errStr;
        simErrorDiv.display = 'block';
        return;
    }

    // validate number of processes
    else if (tableData.length > MAX_PROCESSES) {

        const errStr = `Process list validation failed - there may not be more than ${MAX_PROCESSES} processes`;
        console.error(errStr);
        simErrorP.textContent = errStr;
        simErrorDiv.display = 'block';
        return;
    }

    // generate param string to hand to wasm
    let paramStr = `${numCpus},${algType},${rrQuantum},`;
    for (const obj of tableData) {

        // validate processes
        if (obj.pid < 0 || obj.pid > MAX_TIME_AND_PID
         || obj.start_time < 0 || obj.start_time > MAX_TIME_AND_PID
         || obj.duration < 0 || obj.duration > MAX_TIME_AND_PID) {

            const errStr = `Process list validation failed - times and process IDs must be less than or equal to ${MAX_TIME_AND_PID}`;
            console.error(errStr);
            simErrorP.textContent = errStr;
            simErrorDiv.style.display = 'block';
            return;
        }

        // good to go, write to param string
        paramStr += `${obj.pid},${obj.start_time},${obj.duration},`;
    }

    // run c
    const cParamStr = stringToNewUTF8(paramStr);
    const cRetStr = UTF8ToString(_getFrames(cParamStr));
    _free(cParamStr);

    // check error
    if (cRetStr.startsWith('E')) {

        const errStr = cRetStr.substring(1);
        console.error(errStr);
        simErrorP.textContent = errStr;
        simErrorDiv.style.display = 'block';
        return;
    }

    // successful; remove error feedback if present
    simErrorP.textContent = '';
    simErrorDiv.style.display = 'none';

    // get frames
    const frames = cRetStr.split('\n');
    console.log(frames);

    for (let i = 0; i < frames.length - 1; i++) {
        setTimeout(() => {

            // parse frame (first element = queue size, rest are processes)
            const unparsedProcesses = frames[i].split(';');

            // set text to queue size
            queueSizeP.textContent = unparsedProcesses[0];

            // iterate through processes and set table
            let processes = [];
            for (let j = 1; j < unparsedProcesses.length - 1; j++) {
                const processFields = unparsedProcesses[j].split(',');
                processes.push({ pid: processFields[0], remaining_time: processFields[1] });
                console.log({ pid: processFields[0], remaining_time: processFields[1] })
            }
            liveTable.setData(processes)

        }, 1000 * i);
        
    }
}

document.querySelector('button#start-btn').addEventListener('click', displayFrames);