import React, {MouseEvent} from 'react';

import { decimalAdjust } from './../helper';

export interface cellState {
    highlited: boolean
}

export interface cellProps {
    socket: WebSocket,
    item: string,
    itemKey: number,
    row: string,
    rowKey: number,
    suspiciousnessLevel: { x: number, y: number, value: number, counter: number } | undefined,
    isMine: boolean,
    isSafe: boolean,
}

class Cell extends React.Component<cellProps, cellState> {
    constructor(props:any) {
        super(props);
        this.state = {
            highlited: false
        }
    }

    cellHandler(socket:WebSocket, rowKey:number, itemKey:number){
        this.props.socket.send(`open ${itemKey} ${rowKey}`);
    }

    setMine(e:MouseEvent) {
        e.preventDefault();
        e.persist();

        this.setState({
            highlited: !this.state.highlited
        });
        return false;
    }

    getColor(string:string) {
        switch (string) {
            case '□':
                return 'gray';

            case '0':
                return 'gray';

            case '1':
                return 'blue';

            case '2':
                return 'green';

            case '3':
                return 'red';

            default:
                break;
        }
    }

    componentDidMount() {

    }

    render() {
        let suspiciousnessLevel: number ;
        let counter: number = 0;
        let item = this.props.item;
        let itemKey = this.props.itemKey;
        let rowKey = this.props.rowKey;
        let buttonModifier = (item !== '□') ? `button--bg-gray button--color-${this.getColor(item)}`: '';
        let title = (item === '□' || item === '0') ?  '' : item;
        let hint: string;

        if( this.props.suspiciousnessLevel !== undefined ) {
            counter = this.props.suspiciousnessLevel.counter;
            suspiciousnessLevel = this.props.suspiciousnessLevel.value;

            hint = (item === '□') ? `${ decimalAdjust('round', suspiciousnessLevel * 100, -2 )}% \n(${counter})` : '';

        } else {
            hint = ''
        }

        if( this.props.isMine) {
            buttonModifier += ' mine';
        }
        if( this.props.isSafe) {
            buttonModifier += ' safe';
        }

        if(this.state.highlited) {
            buttonModifier += ' pseudo-mine';
        }

        return <li className='map__cell'
                   onContextMenu={(e) => this.setMine(e)}
                   onClick={() => this.cellHandler(this.props.socket, rowKey, itemKey)}
                   key={itemKey}>
            <button title={title} className={`map__button button ${buttonModifier}`}>{ (item === '□') ? '' : item}</button>
            <div className={`map__cell-hint map__cell-hint--${counter}`}>{hint}</div>
        </li>
    }
}

export default Cell;