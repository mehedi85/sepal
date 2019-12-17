const job = require('@sepal/worker/job')
const log = require('@sepal/log')('ee')

const worker$ = () => {
    const {EMPTY} = require('rxjs')
    const {switchMapTo} = require('rxjs/operators')
    const ee = require('@google/earthengine')
    const {ee$} = require('@sepal/ee/utils')
    require('./extensions')

    return ee$((resolve, reject) => {
        log.debug('Initializing library')
        ee.initialize(
            null,
            null,
            () => resolve(),
            error => reject(error)
        )
    }).pipe(
        switchMapTo(EMPTY)
    )
}

module.exports = job({
    jobName: 'EE Initialization',
    before: [require('./authenticate')],
    worker$
})
