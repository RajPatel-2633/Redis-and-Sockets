import {notificationWorker} from "./queues/worker.js"

async function init (){
    await notificationWorker.run();
}

// This file is responsible for running all the other workers

init();