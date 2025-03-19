import http from 'http'

const server = http.createServer((req,res)=>{
    console.log(req)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end('service1, HELLO');
})

server.listen(5001,()=>{console.log(`server start on port 5001`)})