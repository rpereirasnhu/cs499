
// we can assume all data is entered correctly due to HTML constraints (e.g. 'required' field)
// data validation errors are handled on the server

// shows response
function showRes(str, color) {

    const procModResDiv = document.querySelector('div#procModRes');
    const procModResP = document.querySelector('div#procModRes > p');
    procModResP.textContent = str;
    procModResP.style.backgroundColor = '#ff6666';
    procModResDiv.style.display = 'block';
}

// get form data
function getFormData() {
    const data = {};
    new FormData(document.querySelector('form')).forEach((v, k) => data[k] = v);
    console.log(data);
    return data;
}

// add process
function addProcess() {

    fetch('/api/spm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getFormData())
    })
        .then(res => res.json())
        .then(body => showRes(JSON.stringify(body), '#ffffff'))
        .catch(err => {
            console.error(err);
            showRes('An unexpected error occured', '#ff6666');
        });
    return false;
}

// edit process
function editProcess() {

    fetch('/api/spm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getFormData())
    })
        .then(res => res.json())
        .then(body => showRes(JSON.stringify(body), '#ffffff'))
        .catch(err => {
            console.error(err);
            showRes('An unexpected error occured', '#ff6666');
        });
    return false;
}

// delete process
function deleteProcess() {

    fetch('/api/spm', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getFormData())
    })
        .then(res => res.json())
        .then(body => showRes(JSON.stringify(body), '#ffffff'))
        .catch(err => {
            console.error(err);
            showRes('An unexpected error occured', '#ff6666');
        });
    return false;
}