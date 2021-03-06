import {Panel} from 'widget/panel/panel'
import React from 'react'
import styles from './menu.module.css'

const {MenuItem} = require('./menuItem')
const MenuContext = require('./menuContext')

export const Menu = ({position, close, className, children}) =>
    <Panel
        type={position}
        className={className}>
        <MenuContext.Provider value={{close}}>
            <ul className={styles.menu}>
                {children}
            </ul>
        </MenuContext.Provider>
    </Panel>

const Separator = () =>
    <div className={styles.separator}/>

Menu.Separator = Separator

Menu.Item = MenuItem

const Toggle = ({label, description, onChange, selected = false, right}) => {
    return (
        <Menu.Item
            label={label}
            description={description}
            selected={selected}
            right={right}
            onClick={() => onChange(!selected)}/>)
}

Menu.Toggle = Toggle

const SelectContext = React.createContext()

const Select = ({label, selected, children, onSelect}) => {
    return (
        <SelectContext.Provider value={{
            selected,
            select: selected => onSelect(selected)
        }}>
            <div className={styles.group}>
                <li className={styles.groupLabel}>{label}</li>
                <ul>
                    {children}
                </ul>
            </div>
        </SelectContext.Provider>
    )
}

Menu.Select = Select

const Option = ({id, label, description, right}) =>
    <SelectContext.Consumer>
        {({selected, select}) =>
            <Menu.Item
                label={label}
                description={description}
                selected={id === selected}
                right={right}
                onClick={() => select(id)}/>
        }
    </SelectContext.Consumer>

Menu.Option = Option
