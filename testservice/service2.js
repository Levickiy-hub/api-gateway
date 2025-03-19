import http from 'http'

const server = http.createServer((req,res)=>{
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('service2, HELLO');
})

server.listen(5002,()=>{console.log(`server start on port 5002`)})