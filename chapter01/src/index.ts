import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT ?? 8080;

interface CacheStore{
    totalPageCount:number
}

const cacheStore:CacheStore = {
    totalPageCount:0
};

app.get('/',(req,res)=>{
    return res.json({status:'success'});
});

app.get('/books',async(req,res)=>{
   const response =  await axios.get('https://api.freeapi.app/api/v1/public/books');
   console.log(response);
   return res.json(response.data);
});

app.get('/books/total',async(req,res)=>{
   const response =  await axios.get('https://api.freeapi.app/api/v1/public/books');
   //Check the Cache
   if(cacheStore.totalPageCount){
        console.log("Cache Hit");
        return res.json({totalPageCount:Number(cacheStore.totalPageCount)});
    
   }

   const totalPageCount = response?.data?.data?.data?.reduce((acc:number,curr:{volumeInfo?:{pageCount?:number}})=>!curr.volumeInfo?.pageCount?0: curr.volumeInfo.pageCount + acc,0);
   
   cacheStore.totalPageCount = Number(totalPageCount);
   console.log("Cache Miss");

   return res.json({totalPageCount});
});

 

app.listen(PORT,()=> console.log(`Server is running on PORT ${PORT}`));