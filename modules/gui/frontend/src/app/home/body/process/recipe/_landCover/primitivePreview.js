import {Button} from 'widget/button'
import {RecipeState} from 'app/home/body/process/recipe/classification/classificationRecipe'
import {Subject} from 'rxjs'
import {compose} from 'compose'
import {connect} from 'store'
import {msg} from 'translate'
import {withMapContext} from 'app/home/map/mapContext'
import EarthEngineLayer from 'app/home/map/earthEngineLayer'
import MapStatus from 'widget/mapStatus'
import PropTypes from 'prop-types'
import React from 'react'
import _ from 'lodash'
import api from 'api'
import styles from 'app/home/body/process/classification/classificationPreview.module.css'
import withSubscriptions from 'subscription'

const mapStateToProps = (state, ownProps) => {
    const recipeState = RecipeState(ownProps.recipeId)
    return {
        recipe: recipeState()
    }
}

class PrimitivePreview extends React.Component {
    state = {}

    constructor(props) {
        super(props)
        this.progress$ = new Subject()
        const {addSubscription} = props
        addSubscription(
            this.progress$.subscribe(
                tiles => this.setState({tiles, initializing: false})
            )
        )
    }

    componentDidMount() {
        this.updateLayer(this.toPreviewRequest(this.props.recipe))
    }

    componentDidUpdate(prevProps) {
        const {recipe, mapContext: {sepalMap}} = this.props
        const previewRequest = this.toPreviewRequest(recipe)
        const layerChanged = !_.isEqual(previewRequest, this.toPreviewRequest(prevProps.recipe))
        if (layerChanged) {
            this.updateLayer(previewRequest)
        }
        sepalMap.hideLayer('preview', this.isHidden(recipe))
    }

    render() {
        const {initializing, tiles, error} = this.state
        if (this.isHidden())
            return null
        else if (error) {
            return (
                <MapStatus loading={false} error={error}/>
            )
        } else if (initializing)
            return (
                <MapStatus message={msg('process.classification.preview.initializing')}/>
            )
        else if (tiles && (!tiles.complete || tiles.failed))
            return (
                <MapStatus
                    loading={!tiles.complete}
                    message={msg('process.classification.preview.loading', {loaded: tiles.loaded, count: tiles.count})}
                    error={tiles.failed ? msg('process.classification.preview.tilesFailed', {failed: tiles.failed}) : error}/>
            )
        else
            return null
    }

    updateLayer(previewRequest) {
        const {mapContext, componentWillUnmount$} = this.props
        const {initializing, error} = this.state
        const layer = new EarthEngineLayer({
            mapContext,
            layerIndex: 1,
            mapId$: api.gee.preview$(previewRequest),
            props: previewRequest,
            progress$: this.progress$
        })
        const changed = mapContext.sepalMap.setLayer({
            id: 'preview',
            layer,
            destroy$: componentWillUnmount$,
            onError: e => this.onError(e)
        })
        if (changed && initializing !== !!layer)
            this.setState({initializing: !!layer, error: null})
        else if (changed && error)
            this.setState({error: null})
    }

    reload() {
        const {recipe, mapContext: {sepalMap}} = this.props
        sepalMap.removeLayer('preview')
        this.updateLayer(this.toPreviewRequest(recipe))
    }

    isHidden() {
        const {recipe} = this.props
        return !!recipe.ui.selectedPanel
    }

    onError(e) {
        const message = e.response && e.response.messageKey
            ? msg(e.response.messageKey, e.response.messageArgs, e.response.defaultMessage)
            : msg('process.classification.preview.error')
        this.setState({
            error:
                <div>
                    {message}
                    <div className={styles.retry}>
                        <Button
                            chromeless
                            look='transparent'
                            shape='pill'
                            icon='sync'
                            label={msg('button.retry')}
                            onClick={() => this.reload()}
                        />
                    </div>
                </div>
        })
    }

    toPreviewRequest(recipe) {
        const year = recipe.ui.preview.year
        const primitiveType = recipe.ui.preview.value
        const name = recipe.title || recipe.placeholder
        const vizParams = {min: 0, max: 100, palette: ['red', 'yellow', 'green']}
        return {
            recipe: {
                type: 'ASSET',
                path: `${name}/primitives/${year}-${primitiveType}`,
                vizParams
            }
        }
    }
}

PrimitivePreview.propTypes = {
    recipeId: PropTypes.string.isRequired
}

export default compose(
    PrimitivePreview,
    connect(mapStateToProps),
    withMapContext(),
    withSubscriptions()
)
