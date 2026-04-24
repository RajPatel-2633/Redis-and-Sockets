import express from "express";
import axios from "axios";
import Redis from "ioredis";

const app = express();
const PORT = process.env.PORT ?? 8080;
const redis = new Redis();


app.get('/',(req,res)=>{
    return res.json({status:'success'});
});

app.get('/books',async(req,res)=>{
   const response =  await axios.get('https://api.freeapi.app/api/v1/public/books');
   console.log(response);
   return res.json(response.data);
});

app.get('/books/total',async(req,res)=>{
   //Check the Cache

   const cachedValue = await redis.get("totalPageValue");
   if(cachedValue){
        console.log("Cache Hit");
        return res.json({totalPageCount:Number(cachedValue)});
    
   }

   console.log("Cache Miss");

   const response =  await axios.get('https://api.freeapi.app/api/v1/public/books');

   const totalPageCount = response?.data?.data?.data?.reduce((acc:number,curr:{volumeInfo?:{pageCount?:number}})=>!curr.volumeInfo?.pageCount?0: curr.volumeInfo.pageCount + acc,0);
   
   await redis.set("totalPageValue",totalPageCount)
   
   return res.json({totalPageCount});
});

 

app.listen(PORT,()=> console.log(`Server is running on PORT ${PORT}`));