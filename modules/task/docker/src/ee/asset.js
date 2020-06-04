const ee = require('ee')
const {EMPTY} = require('rx')
const {catchError, switchMap} = require('rx/operators')
const {progress} = require('root/rxjs/operators')

const assetRoots$ = () =>
    ee.$({
        operation: 'get asset roots',
        ee: (resolve, reject) =>
            ee.data.getAssetRoots(
                (assetRoots, error) => {
                    const rootPaths = assetRoots.map(({id}) => id)
                    return error
                        ? reject(error)
                        : resolve(rootPaths)
                }
            )
    })

const deleteAsset$ = assetId =>
    ee.getAsset$(assetId).pipe(
        catchError(() => EMPTY),
        switchMap(asset => asset ? delete$(assetId) : EMPTY)
    )

const delete$ = assetId =>
    ee.$({
        operation: 'delete asset',
        ee: (resolve, reject) =>
            ee.data.deleteAsset(assetId,
                (_, error) => error ? reject(error) : resolve()
            )
    }).pipe(
        progress({
            defaultMessage: `Deleted asset '${assetId}'`,
            messageKey: 'tasks.ee.export.asset.delete',
            messageArgs: {assetId}
        })
    )

module.exports = {assetRoots$, deleteAsset$}
