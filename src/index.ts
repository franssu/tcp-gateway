import net from 'net'

const hostname = '0.0.0.0'
const port = 10691;

const connectionListener = (consoleSocket: net.Socket) => {
    let isOnError = false
    
    const aquilonSocket = new net.Socket()
    const connectToAquilon = () => aquilonSocket.connect(10691, "192.168.0.104")
    connectToAquilon()
    aquilonSocket.on('connect', () => {
        console.log('connected to aquilon')
        consoleSocket.pipe(aquilonSocket)
        aquilonSocket.pipe(consoleSocket)
    })
    aquilonSocket.on('error', (e) => {
        // consoleSocket.pause() // checker si ca sert vraiment
        if (!isOnError) {
            isOnError = true
            process.stdout.write('Retrying connection with aquilon...')
        }
        setTimeout(() => {
            process.stdout.write('.')
            connectToAquilon()
        }, 3000);
    });
    console.log('console connected')
}

const server = net.createServer(connectionListener)

server.listen(port, hostname, () => {
  console.log(`Server running at ${hostname}:${port}/`);
});
