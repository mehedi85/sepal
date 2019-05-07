import {Button} from 'widget/button'
import {EMPTY, Subject, animationFrameScheduler, interval} from 'rxjs'
import {Scrollable, ScrollableContainer} from 'widget/scrollable'
import {debounceTime, distinctUntilChanged, filter, map, scan, switchMap} from 'rxjs/operators'
import Keybinding from 'widget/keybinding'
import PropTypes from 'prop-types'
import React from 'react'
import ReactResizeDetector from 'react-resize-detector'
import _ from 'lodash'
import styles from './list.module.css'

const ANIMATION_SPEED = .2
const AUTO_CENTER_DELAY = 1000

const getContainer = element =>
    element && element.parentNode && element.parentNode.parentNode

const targetScrollOffset = element => {
    const container = getContainer(element)
    return container
        ? Math.round(element.offsetTop - (getContainer(element).clientHeight - element.clientHeight) / 2)
        : null
}

const currentScrollOffset = element => {
    const container = getContainer(element)
    return container
        ? container.scrollTop
        : null
}

const setScrollOffset = (element, value) => {
    const container = getContainer(element)
    if (container) {
        container.scrollTop = value
    }
}

const lerp = rate =>
    (value, targetValue) => value + (targetValue - value) * rate

export default class List extends React.Component {
    subscriptions = []
    list = React.createRef()
    highlighted = React.createRef()
    scrollHighlighted$ = new Subject()
    state = {
        highlightedOption: null,
        overrideHover: false
    }

    render() {
        const {onCancel, className, keyboard} = this.props
        const keymap = {
            Escape: onCancel ? onCancel : null,
            Enter: () => this.selectHighlighted(),
            ArrowLeft: () => this.highlightPrevious(),
            ArrowRight: () => this.highlightNext(),
            ArrowUp: () => this.highlightPrevious(),
            ArrowDown: () => this.highlightNext(),
            Home: () => this.highlightFirst(),
            End: () => this.highlightLast()
        }
        return (
            <Keybinding keymap={keymap} disabled={!keyboard}>
                <ReactResizeDetector
                    handleHeight
                    onResize={() => this.scrollHighlighted$.next()}>
                    <ScrollableContainer className={className}>
                        <Scrollable className={styles.options}>
                            {scrollableContainerHeight => this.renderList(scrollableContainerHeight)}
                        </Scrollable>
                    </ScrollableContainer>
                </ReactResizeDetector>
            </Keybinding>
        )
    }

    renderList(scrollableContainerHeight = 0) {
        const {options, overScroll} = this.props
        return (
            <ul style={{
                '--scrollable-container-height': overScroll ? scrollableContainerHeight : 0
            }}>
                {this.renderOptions(options)}
            </ul>
        )
    }

    updateState(state, callback) {
        const updatedState = (prevState, state) =>
            _.isEqual(_.pick(prevState, _.keys(state)), state) ? null : state
        this.setState(
            prevState =>
                updatedState(prevState, _.isFunction(state) ? state(prevState) : state),
            callback
        )
    }

    renderOptions(options) {
        return options.length
            ? options.map((option, index) => this.renderOption(option, index))
            : this.renderOption({label: 'No results'}) // [TODO] msg
    }

    renderOption(option, index) {
        return option.value !== undefined
            ? this.renderSelectableOption(option)
            : option.group
                ? this.renderGroup(option, index)
                : this.renderNonSelectableOption(option, index)
    }

    renderGroup(option, index) {
        return (
            <li
                key={index}
                className={styles.group}>
                {option.label}
            </li>
        )
    }

    renderNonSelectableOption(option, index) {
        return (
            <li key={option.value || index}>
                <Button
                    chromeless
                    look='transparent'
                    label={option.label}
                    width='fill'
                    alignment='left'
                    disabled
                />
            </li>
        )
    }

    renderSelectableOption(option) {
        const {selectedOption} = this.props
        const {overrideHover} = this.state
        const selected = this.isSelected(option)
        const highlighted = this.isHighlighted(option)
        const ref = highlighted
            ? this.highlighted
            : null
        return (
            <li
                key={option.value}
                ref={ref}>
                <Button
                    chromeless={!selected}
                    look={selected ? 'highlight' : 'transparent'}
                    label={option.label}
                    hover={overrideHover ? highlighted : null}
                    width='fill'
                    alignment='left'
                    disableTransitions
                    onMouseOver={() => this.highlightOption(option)}
                    onMouseOut={() => this.highlightOption(selectedOption)}
                    onClick={() => this.selectOption(option)}
                />
            </li>
        )
    }

    isSelected(option) {
        const {selectedOption} = this.props
        return option === selectedOption
    }

    isSelectable(option) {
        return !option.group && option.value
    }

    isHighlighted(option) {
        const {highlightedOption} = this.state
        return highlightedOption && option && highlightedOption.value === option.value
    }

    selectHighlighted() {
        const {highlightedOption} = this.state
        if (highlightedOption) {
            this.selectOption(highlightedOption)
        }
    }

    cancel() {
        const {onCancel} = this.props
        onCancel && onCancel()
    }

    getSelectedOption() {
        const {options, selectedOption} = this.props
        return _.find(options, option => option === selectedOption)
    }

    getPreviousSelectableOption(option) {
        const {options} = this.props
        const previousIndex = Math.max(_.indexOf(options, option) - 1, 0)
        return _.findLast(options, option => this.isSelectable(option), previousIndex) || option
    }

    getNextSelectableOption(option) {
        const {options} = this.props
        const nextIndex = Math.min(_.indexOf(options, option) + 1, options.length - 1)
        return _.find(options, option => this.isSelectable(option), nextIndex) || option
    }

    getFirstSelectableOption() {
        const {options} = this.props
        return _.find(options, option => this.isSelectable(option))
    }

    getLastSelectableOption() {
        const {options} = this.props
        return _.findLast(options, option => this.isSelectable(option))
    }

    highlightOption(highlightedOption) {
        this.setState({
            highlightedOption,
            overrideHover: false
        })
    }

    highlightPrevious() {
        this.setState(prevState => ({
            highlightedOption: this.getPreviousSelectableOption(prevState.highlightedOption),
            overrideHover: true
        }), this.scroll)
    }

    highlightNext() {
        this.setState(prevState => ({
            highlightedOption: this.getNextSelectableOption(prevState.highlightedOption),
            overrideHover: true
        }), this.scroll)
    }

    highlightFirst() {
        this.setState({
            highlightedOption: this.getFirstSelectableOption(),
            overrideHover: true
        }, this.scroll)
    }

    highlightLast() {
        this.setState({
            highlightedOption: this.getLastSelectableOption(),
            overrideHover: true
        }, this.scroll)
    }

    scroll() {
        this.highlighted.current && this.highlighted.current.scrollIntoView({
            behavior: 'auto',
            block: 'nearest'
        })
    }

    selectOption(option) {
        this.scrollHighlighted$.next(option)
    }

    autoCenterWhenIdle(scroll$) {
        return scroll$.pipe(
            debounceTime(AUTO_CENTER_DELAY)
        ).subscribe(() => {
            this.centerSelected()
        })
    }

    update() {
        const highlightedOption = this.getSelectedOption() || this.getFirstSelectableOption()
        this.setState({highlightedOption}, () => this.scrollHighlighted$.next())
    }

    initializeAutoScroll() {
        const animationFrame$ = interval(0, animationFrameScheduler)
        const {onSelect} = this.props

        const scroll$ = this.scrollHighlighted$.pipe(
            map(() => this.highlighted.current),
            filter(element => element),
            switchMap(element => {
                const target = targetScrollOffset(element)
                return Math.round(currentScrollOffset(element)) === target
                    ? EMPTY
                    : animationFrame$.pipe(
                        map(() => target),
                        scan(lerp(ANIMATION_SPEED), currentScrollOffset(element)),
                        map(value => Math.round(value)),
                        distinctUntilChanged(),
                        map(value => ({element, value}))
                    )
            })
        )

        const select$ = this.scrollHighlighted$.pipe(
            filter(option => option)
        )

        this.subscriptions.push(
            scroll$.subscribe(
                ({element, value}) => setScrollOffset(element, value)
            ),
            select$.subscribe(
                option => {
                    onSelect(option)
                }
            )
        )
    }

    componentDidMount() {
        this.initializeAutoScroll()
        this.update()
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!_.isEqual(nextProps, this.props)) {
            return true
        }
        if (nextState.overrideHover !== this.state.overrideHover) {
            return true
        }
        if (nextState.overrideHover && nextState.highlightedOption !== this.state.highlightedOption) {
            return true
        }
        return false
    }

    componentDidUpdate(prevProps) {
        if (!_.isEqual(prevProps, this.props)) {
            this.update()
        }
    }

    componentWillUnmount() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe())
    }
}

List.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            value: PropTypes.any
        })
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    autoCenter: PropTypes.any,
    className: PropTypes.string,
    keyboard: PropTypes.any,
    overScroll: PropTypes.any,
    selectedOption: PropTypes.any,
    onCancel: PropTypes.func
}