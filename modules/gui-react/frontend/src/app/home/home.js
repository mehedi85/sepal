import actionBuilder from 'action-builder'
import backend from 'backend'
import PropTypes from 'prop-types'
import React from 'react'
import {EMPTY, interval, merge} from 'rxjs'
import {delay, exhaustMap, map, switchMap} from 'rxjs/operators'
import {connect} from 'store'
import {currentUser, loadCurrentUser$} from 'user'
import Body from './body/body'
import Footer from './footer/footer'
import styles from './home.module.css'
import Map from './map/map'
import Menu from './menu/menu'
import {isFloating} from './menu/menuMode'

const mapStateToProps = () => ({
    floatingMenu: isFloating(),
    floatingFooter: false,
    user: currentUser()
})

const refreshUserAccessTokens$ = (user) => {
    const oneMinute = 60 * 1000
    const minRefreshTime = oneMinute
    const maxRefreshTime = 20 * oneMinute
    const calculateDelayMillis = (expiryDate) =>
        Math.min(maxRefreshTime, Math.max(minRefreshTime, expiryDate - 5 * oneMinute - Date.now()))
    return interval(0).pipe(
        delay(calculateDelayMillis(user.googleTokens.accessTokenExpiryDate)),
        exhaustMap(() => loadCurrentUser$().pipe(
            map((currentUserAction) => {
                console.log({currentUserAction})
                currentUserAction.dispatch()
                return currentUserAction.user.googleTokens.accessTokenExpiryDate
            }),
            map(calculateDelayMillis),
            switchMap((delayMillis) => EMPTY.pipe(delay(delayMillis))
            )
        ))
    )
}

const updateTasks$ = () => {
    const loadAll$ = backend.tasks.loadAll$()
    return merge(
        loadAll$,
        interval(5 * 1000).pipe(
            exhaustMap(() => loadAll$),
        )
    ).pipe(map(tasks =>
            actionBuilder('UPDATE_TASKS')
                .set('tasks', tasks)
                .dispatch()
        )
    )
}


class Home extends React.Component {
    componentWillMount() {
        this.props.asyncActionBuilder('SCHEDULE_UPDATE_TASKS',
            updateTasks$())
            .dispatch()
        if (this.props.user.googleTokens)
            this.props.asyncActionBuilder('SCHEDULE_USER_INFO_REFRESH',
                refreshUserAccessTokens$(this.props.user))
                .dispatch()
    }

    render() {
        const {user, floatingMenu, floatingFooter} = this.props
        return (
            <div className={[
                styles.container,
                floatingMenu && styles.floatingMenu,
                floatingFooter && styles.floatingFooter
            ].join(' ')}>
                <Map className={styles.map}/>
                <Menu className={styles.menu} user={user}/>
                <Footer className={styles.footer} user={user}/>
                <Body className={styles.body}/>
            </div>
        )
    }
}

Home.propTypes = {
    user: PropTypes.object.isRequired,
    floatingMenu: PropTypes.bool.isRequired,
    floatingFooter: PropTypes.bool.isRequired,
}

export default connect(mapStateToProps)(Home)
