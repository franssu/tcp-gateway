import net from 'net'
import { program } from 'commander'

function myParseInt(value: string, preivous: number): number {
    // meh, si ca foire ?
    return parseInt(value);
}

program
    .requiredOption('--target-addr <target-addr>', 'addresse cible')
    .requiredOption('--target-port <target-port>', 'port cible', myParseInt)
    .requiredOption('--local-port <local-port>', 'port local', myParseInt)
    .name('tcp-gateway')
    .on('--help', () => {
        console.log('')
        console.log('Description: ')
        console.log('  Ouvre un serveur local sur le port <local-port>, et redirige les paquet vers <target-addr>:<target-port>')
    })

program.parse(process.argv)

const hostname = '0.0.0.0'

const connectionListener = (clientSocket: net.Socket) => {
    clientSocket.setKeepAlive(true, 500)
    console.log('new client connected')

    let isClientSocketClosed = false
    clientSocket.on('close', () => { 
        console.log('connection to client closed')
        isClientSocketClosed = true
    })
    clientSocket.on('error', () => console.log('client socket error'))

    const connectToTarget = () => {
        let targetSocket = new net.Socket()

        const cleanTargetSocket = () => {
            targetSocket.removeAllListeners()
            clientSocket.unpipe(targetSocket)
            targetSocket.unpipe(clientSocket)
        }

        targetSocket.on('connect', () => {
            console.log('connected to target')
            clientSocket.pipe(targetSocket)
            targetSocket.pipe(clientSocket)
        })
        targetSocket.on('error', (e) => console.log(`target socket error: \n${e}`))
        targetSocket.on('close', () => {
            console.log('connection to target closed')
            cleanTargetSocket()
            if (!isClientSocketClosed)
                reconnect()
        })

        targetSocket.connect(program.targetPort, program.targetAddr)
    }

    let isReconnecting = false
    const reconnect = () => {
        if (!isReconnecting) {
            isReconnecting = true
            process.stdout.write('Retrying connection with target...')
        }
        setTimeout(() => {
            process.stdout.write('.')
            connectToTarget()
        }, 3000);
    }

    connectToTarget()
}

const server = net.createServer(connectionListener)

server.listen(program.localPort, hostname, () => {
  console.log(`Server running at ${hostname}:${program.localPort}/`);
});

server.on('error', (err) => {
    console.log(`local server error: ${err}`)
})

server.on('close', () => {
    console.log('local sever closed')
})
