require('sepal/log').configureServer(require('./log.json'))
const log = require('sepal/log').getLogger('main')

const _ = require('lodash')

const {connect$} = require('./messageQueue')
const {scheduleFullScan} = require('./scan')
const {onScanComplete, logStats} = require('./jobQueue')
const {messageHandler} = require('./messageHandler')

const main = async () => {
    const initialize = async ({topicSubscriber, topicPublisher}) => {
        const publisher = await topicPublisher()
    
        onScanComplete(
            ({username, size}) => publisher.publish('userStorage.size', {username, size})
        )
    
        await topicSubscriber({
            queue: 'userStorage.workerSession',
            topic: 'workerSession.#',
            handler: messageHandler
        })
        
        await topicSubscriber({
            queue: 'userStorage.files',
            topic: 'files.#',
            handler: messageHandler
        })
        
        await scheduleFullScan()
        await logStats()
        log.info('Initialized')
    }
    
    await connect$().subscribe(
        connection => initialize(connection)
    )
}

main().catch(log.error)