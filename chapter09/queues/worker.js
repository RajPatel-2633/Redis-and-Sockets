import {Worker} from "bullmq";

import {QueueMap, notificationQueue} from "./queue.js"
import {redisConnection} from "../connection.js"


const wait = (s)=> new Promise ((res)=> setTimeout(res,s*1000))

export const videoProcessingWorker = new Worker(QueueMap["VIDEO_PROCESSING_QUEUE"],
    // This is a processing function which will be async function
    async(job)=>{
        console.log(`Processing Job`,job.id);
        console.log(`Transcoding Job`,{url:job.data});

        await wait(10);
        console.log(`Transcoding Job Done..`,{url:job.data});

        await notificationQueue.add(`notification-${job.data.videoURL}`,{
            notification: `Video has been processed for ${job.data.videoURL} `
        })

        return true;

    },
    // TO stop automatic run which happens by default
    {
        autorun:false,
        connection:redisConnection
    }
);


export const notificationWorker = new Worker(QueueMap["NOTIFICATION_QUEUE"],
    async job =>{
        console.log(`Sending notification to : ${job.data.notification}`)
    },{
        connection:redisConnection,
        autorun:false,
        concurrency:1,
        limiter:{
            max:1,
            duration:10*1000,
        },
    }
)