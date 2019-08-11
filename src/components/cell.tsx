import React, {Component, MouseEvent} from 'react';

export interface cellState {
    highlited: boolean
}

export interface cellProps {
    socket: WebSocket,
    item: string,
    itemKey: number,
    row: string,
    rowKey: number,
    suspiciousnessLevel: {
        [key: string]: {value:number, counter:number}
    },
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
                break;
            case '0':
                return 'gray';
                break;
            case '1':
                return 'blue';
                break;
            case '2':
                return 'green';
                break;
            case '3':
                return 'red';
                break;
            default:

                break;
        }
    }

    componentDidMount() {

    }

    render() {
        let suspiciousnessLevel:number|string;
        let counter = 0;
        let item = this.props.item;
        let row = this.props.row;
        let itemKey = this.props.itemKey;
        let rowKey = this.props.rowKey;
        let buttonModifier = (item !== '□') ? `button--bg-gray button--color-${this.getColor(item)}`: '';

        let title = (item === '□' || item === '0') ?  '' : item;

        if( this.props.suspiciousnessLevel[`x${itemKey}y${rowKey}`] === undefined ) {
            suspiciousnessLevel = '?';
        } else {
            counter = this.props.suspiciousnessLevel[`x${itemKey}y${rowKey}`]['counter'];
            suspiciousnessLevel = this.props.suspiciousnessLevel[`x${itemKey}y${rowKey}`]['value'];

            if(Math.floor(suspiciousnessLevel) > 85) {
                buttonModifier += ' mine';
            }
        }

        if(this.state.highlited) {
            buttonModifier += ' pseudo-mine';
        }

        return <li className='map__cell'
                   onContextMenu={(e) => this.setMine(e)}
                   onClick={() => this.cellHandler(this.props.socket, rowKey, itemKey)}
                   key={itemKey}>
            <button title={title} className={`map__button button ${buttonModifier}`}>{ (item === '□') ? '' : item}</button>
            <div className={`map__cell-hint map__cell-hint--${counter}`}>{ (item === '□') ? suspiciousnessLevel +'%'+'\n(' + counter + ')' : ''}</div>
        </li>
    }
}

export default Cell;