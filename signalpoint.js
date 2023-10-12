document.addEventListener("DOMContentLoaded", function () {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:4000/offers")
        .configureLogging(signalR.LogLevel.Information)
        .build();

    const toggleButton = document.getElementById("toggleConnectButton");
    const tableBody = document.getElementById("statsBody");
    let isConnected = false;
    let reconnectIndex = 0;

    function updateButtonState() {
        if (isConnected) {
            toggleButton.textContent = "Disconnect";
            toggleButton.classList.remove('btn-success', 'btn-warning');
            toggleButton.classList.add('btn-danger');
        } else {
            toggleButton.textContent = "Connect";
            toggleButton.classList.remove('btn-danger', 'btn-warning');
            toggleButton.classList.add('btn-success');
        }
    }

    function logToTable(message, dateNow = null) {
        const row = tableBody.insertRow(0); // Insert at the top of the table
        const dateCell = row.insertCell(0);
        const messageCell = row.insertCell(1);

        if (dateNow) {
            dateCell.innerText = moment(dateNow).format("MM-DD HH:mm:ss");
        } else {
            dateCell.innerText = moment().format("MM-DD HH:mm:ss");
        }
        messageCell.innerText = message;
    }

    function startConnection() {
        console.log("Attempting to start the connection...");
        isConnected = true;
        updateButtonState();
        
        connection.start()
            .then(() => {
                logToTable("Connected");
                console.log("Connection started. New state: ", connection.state);
                isConnected = true;
                updateButtonState();
                reconnectIndex = 0;
                shouldReconnect = true;  // Allow reconnections once connected
            })
            .catch(err => {
                console.error('Error while starting connection: ', err);
                isConnected = false;
                updateButtonState();
                if (shouldReconnect) {  // Only reconnect if shouldReconnect is true
                    reconnect();
                }
            });
    }
    
    function reconnect() {
        console.log("Entering reconnect function. Attempt: ", reconnectIndex + 1);
        
        if (reconnectIndex < reconnectDelays.length) {
            console.log("Trying to reconnect...");
            
            // Explicitly update UI
            toggleButton.textContent = "Reconnecting...";
            console.log("Changed text in reconnecting...");
            toggleButton.classList.remove('btn-danger', 'btn-success');
            console.log("Removed class in reconnecting...");
            toggleButton.classList.add('btn-warning');
            console.log("Add warning class in reconnecting...");
            
            setTimeout(() => {
                startConnection();
                reconnectIndex++;
            }, reconnectDelays[reconnectIndex]);
        } else {
            console.log("Failed to reconnect after several attempts.");
            
            // Explicitly update UI
            logToTable("Unable to reconnect.");
            toggleButton.textContent = "Failed to Reconnect";
            toggleButton.classList.remove('btn-success', 'btn-warning');
            toggleButton.classList.add('btn-danger');
            shouldReconnect = false;  // Stop further reconnection attempts
        }
    }

    function updateButtonState() {
        console.log("Updating button state. isConnected:", isConnected);
        
        if (isConnected) {
            toggleButton.textContent = "Disconnect";
            toggleButton.classList.remove('btn-success', 'btn-warning');
            toggleButton.classList.add('btn-danger');
        } else {
            toggleButton.textContent = "Connect";
            toggleButton.classList.remove('btn-danger', 'btn-warning');
            toggleButton.classList.add('btn-success');
        }
    }
    

    const reconnectDelays = [0, 2000, 3000, 5000, 8000, 10000];

    connection.on("SendStatistics", function (stats) {
        logToTable(stats.message, stats.dateNow);
    });

    toggleButton.addEventListener("click", function () {
        console.log("Button clicked. Current connection state: ", connection.state);
    
        if (!isConnected) {
            startConnection();
        } else {
            shouldReconnect = false;  // Prevent reconnections upon manual disconnect
            connection.stop()
                .then(() => {
                    logToTable("Manually disconnected");
                    console.log("Disconnected. New state: ", connection.state);
                    isConnected = false;
                    updateButtonState();
                })
                .catch(err => {
                    console.error('Error while stopping connection: ', err);
                });
        }
    });

    connection.onclose(() => {
        console.log("Connection closed.");
        
        isConnected = false;
        updateButtonState();
        
        if (shouldReconnect) {
            console.log("shouldReconnect is true. Trying to reconnect...");
            reconnect();
        }
    });
});
