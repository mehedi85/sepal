import {RecipeActions, RecipeState, statuses} from './landCoverRecipe'
import {connect, select} from 'store'
import React from 'react'

const mapStateToProps = (state, ownProps) => {
    const recipeState = RecipeState(ownProps.recipeId)
    const compositeTaskId = recipeState('model.compositeTaskId')
    const landCoverTaskId = recipeState('model.landCoverTaskId')
    return {
        status: recipeState('model.status'),
        compositeTask: select('tasks').find(task => task.id === compositeTaskId),
        landCoverTask: select('tasks').find(task => task.id === landCoverTaskId),
        trainingData: recipeState('model.trainingData')
    }
}

class CompositesMonitor extends React.Component {
    constructor(props) {
        super(props)
        this.recipeActions = RecipeActions(props.recipeId)
        this.update()
    }

    render() {
        return null
    }

    componentDidUpdate() {
        this.update()
    }

    // TODO: Monitor assets while state is not UNINITIALIZED or COMPOSITES_PENDING_CREATION
    // Update ui state with available assets

    // TODO: Monitor primitives and land cover map creation too

    update() {
        const {status, compositeTask, landCoverTask, trainingData} = this.props
        console.log({status, compositeTask, landCoverTask, trainingData})

        const setTaskStatus = (nextStatus) =>
            status !== nextStatus && this.recipeActions.setStatus(nextStatus).dispatch()
        if (!compositeTask) {
            if (status === statuses.CREATING_COMPOSITES)
                setTaskStatus(statuses.COMPOSITES_PENDING_CREATION)
        }
        if (compositeTask && [statuses.COMPOSITES_PENDING_CREATION, statuses.CREATING_COMPOSITES].includes(status)) {
            if (['ACTIVE', 'PENDING'].includes(compositeTask.status))
                setTaskStatus(statuses.CREATING_COMPOSITES)
            else if (compositeTask.status === 'COMPLETED')
                setTaskStatus(statuses.COMPOSITES_CREATED)
            else if (['CANCELED', 'FAILED'].includes(compositeTask.status))
                setTaskStatus(statuses.COMPOSITES_PENDING_CREATION)
        }

        if (!landCoverTask) {
            if (status === statuses.CREATING_LAND_COVER_MAP)
                setTaskStatus(statuses.LAND_COVER_MAP_PENDING_CREATION)
        }
        if (status === statuses.COMPOSITES_CREATED
            && trainingData.tableId && trainingData.yearColumn && trainingData.classColumn)
            setTaskStatus(statuses.LAND_COVER_MAP_PENDING_CREATION)
        if (landCoverTask && [statuses.LAND_COVER_MAP_PENDING_CREATION, statuses.CREATING_LAND_COVER_MAP].includes(status)) {
            if (['ACTIVE', 'PENDING'].includes(landCoverTask.status))
                setTaskStatus(statuses.CREATING_LAND_COVER_MAP)
            else if (landCoverTask.status === 'COMPLETED')
                setTaskStatus(statuses.LAND_COVER_MAP_CREATED)
            else if (['CANCELED', 'FAILED'].includes(landCoverTask.status))
                setTaskStatus(statuses.LAND_COVER_MAP_PENDING_CREATION)
        }
    }

}

export default connect(mapStateToProps)(CompositesMonitor)