import {videoProcessingWorker} from "./queues/worker.js"

async function init (){
    await videoProcessingWorker.run();
}

// This file is responsible for running all the other workers

init();