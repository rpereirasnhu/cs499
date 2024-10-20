
import { Tabulator, EditModule } from 'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator_esm.min.mjs';
import { ArcElement, Chart, Colors, Legend, PieController, Title } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/+esm'

// constants
const MAX_TIME_AND_PID = 255;
const MAX_NAME_LENGTH = 64;
const MAX_NUM_CPUS = 16;
const MAX_PROCESSES = 255;

// queue size element
const queueSizeP = document.querySelector('#queue-size');

// error feedback elements
const simErrDiv = document.querySelector('div#simErr');
const simErrP = document.querySelector('div#simErr > p');



/**************************************************/
/* Interactive Dashboard Table                    */
/**************************************************/

async function getTableData() {

    // setup table data (fetch from server)
    return fetch('/api/spm')
        .then(dbRes => {

            // fail if bad response
            if (!dbRes.ok) {
                console.error('API call failed - bad response');
                throw new Error('API call failed - bad response');
            }

            return dbRes.json();
        })
        .then(tableData => {

            // delete table data
            tableData.forEach((v, i) => {
                delete tableData[i]._id;
            });

            return tableData;
        })
        .catch(console.error);
}

const tableData = await getTableData();
console.log(tableData);

// setup table
Tabulator.registerModule(EditModule);
const mainTable = new Tabulator('#table', {
    //height: 200,
    data: tableData,
    layout: 'fitColumns',
    columns: [
        { title: 'Process ID', field: 'pid', editor: 'number', editorParams: {
            selectContents: true,
            mask: 999,
            min: 0,
            max: 255,
            step: 1,
            elementAttributes: {
                maxlength: '3'
            }
        }},
        { title: 'Process Name', field: 'name', editor: 'input', editorParams: {
            selectContents: true,
            search: true,
            elementAttributes: {
                maxlength: '64'
            }
        }},
        { title: 'Process Owner', field: 'owner', editor: 'input', editorParams: {
            selectContents: true,
            search: true,
            elementAttributes: {
                maxlength: '64'
            }
        } },
        { title: 'Start Time (s)', field: 'start_time', editor: 'number', editorParams: {
            selectContents: true,
            mask: 999,
            min: 0,
            max: 255,
            step: 1,
            elementAttributes: {
                maxlength: '3'
            }
        }},
        { title: 'Duration (s)', field: 'duration', editor: 'number', editorParams: {
            selectContents: true,
            mask: 999,
            min: 0,
            max: 255,
            step: 1,
            elementAttributes: {
                maxlength: '3'
            }
        }}
    ]
});

mainTable.on('cellEdited', cell => {

    // make update request
    fetch('/api/spm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orig_pid: cell.getRow().getCell('pid').getOldValue(), [cell.getColumn().getField()]: cell.getValue() })
    })
    .then(res => {
        if (!res.ok) cell.restoreOldValue();
        console.log(res.json());
    })
    .catch(console.error)
    console.log({ pid: cell.getRow().getCell('pid').getValue(), [cell.getColumn().getField()]: cell.getValue() });
    console.log(`Updated to: ${cell.getValue()}`);
});

async function genRandData() {

    // get element indicating input count
    const randomCountElement = document.querySelector('input#gen-rand');

    // make request and update table
    return fetch('/api/spm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gen_rand: randomCountElement.value })
    })
        .then(res => res.json())
        .then(async data => {

            // update table
            mainTable.setData(await getTableData());
            console.log(data);
            return data;
        })
        .catch(console.error);
}

document.querySelector('button#gen-rand-btn').addEventListener('click', genRandData);



/**************************************************/
/* Pie Chart                                      */
/**************************************************/

// setup pie chart
Chart.register(PieController);
Chart.register(ArcElement);
Chart.register(Colors);
Chart.register(Legend);
Chart.register(Title);
const pieLabels = [...new Set(tableData.map(v => v.owner))];
let pieData = [];
pieLabels.forEach(v1 => pieData.push(tableData.filter(v2 => v1 == v2.owner).length));
const pieChart = new Chart(document.getElementById('results'), {
    type: 'pie',
    data: {
        labels: pieLabels,
        datasets: [{
            label: 'Process Frequency by User',
            data: pieData
        }]
    },
    options: {
        responsive: false
    }
});



/**************************************************/
/* Live Process Burst Table                       */
/**************************************************/

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

    // wrap all with try
    try {

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
            !Number.isInteger(rrQuantum) || rrQuantum < 1 || rrQuantum > MAX_TIME_AND_PID)
            throw new Error(`Process manager settings validation failed - number of CPUs must be 1-16, algorithm type must be 0-4, and round robin quantum must be 1-${MAX_TIME_AND_PID}`);

        // validate number of processes
        else if (tableData.length > MAX_PROCESSES)
            throw new Error(`Process list validation failed - there may not be more than ${MAX_PROCESSES} processes`);

        // generate param string to hand to wasm
        let paramStr = `${numCpus},${algType},${rrQuantum},`;
        for (const obj of tableData) {

            // validate processes
            if (obj.pid < 0 || obj.pid > MAX_TIME_AND_PID ||
                obj.start_time < 0 || obj.start_time > MAX_TIME_AND_PID ||
                obj.duration < 0 || obj.duration > MAX_TIME_AND_PID)
                throw new Error(`Process list validation failed - times and process IDs must be less than or equal to ${MAX_TIME_AND_PID}`);

            // good to go, write to param string
            paramStr += `${obj.pid},${obj.start_time},${obj.duration},`;
        }

        // run c (these strings must be freed)
        const cParamStr = stringToNewUTF8(paramStr);
        const cRetStr = UTF8ToString(_getFrames(cParamStr));
        _free(cParamStr);

        // check error
        if (cRetStr.startsWith('E')) {
            _free(cRetStr);
            throw new Error(cRetStr.substring(1));
        }

        // successful; remove error feedback if present
        simErrP.textContent = '';
        simErrDiv.style.display = 'none';

        // get frames
        const frames = cRetStr.split('\n');
        console.log(frames);

        for (let i = 0; i < frames.length - 1; i++) {
            setTimeout(() => {

                // parse frame (first element = queue size, rest are processes)
                const unparsedProcesses = frames[i].split(';');

                // set text to queue size
                queueSizeP.textContent = `Queue Size: ${unparsedProcesses[0]}`;

                // iterate through processes and set table
                let processes = [];
                for (let j = 1; j < unparsedProcesses.length - 1; j++) {
                    const processFields = unparsedProcesses[j].split(',');
                    processes.push({ pid: processFields[0], remaining_time: processFields[1] });
                    console.log({ pid: processFields[0], remaining_time: processFields[1] })
                }
                liveTable.setData(processes);

            }, 1000 * i);
        }

        // free returned string
        _free(cRetStr);

    // handle custom throws
    } catch (err) {

        console.error(err);
        simErrP.textContent = err?.message;
        simErrDiv.style.display = 'block';
        return;
    }
}

document.querySelector('button#start-btn').addEventListener('click', displayFrames);

