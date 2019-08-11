import React, {Component} from 'react';
import Cell from './cell'

export interface mapState {
    hintsAreHidden: boolean
}

export interface mapProps {
    map: string[] | undefined,
    socket: WebSocket,
    suspiciousnessLevel: {
        [key: string]: {value:number, counter:number}
    },
}

class Map extends React.Component<mapProps, mapState> {

    constructor(props:any) {
        super(props);
        this.state = {
            hintsAreHidden: false
        }
    }

    componentDidMount() {

    }

    render() {
        let renderMap = {};

        if(this.props.map !== undefined) {
            renderMap = this.props.map.map((row:string, rowKey) => {
                let items = row.split('').map((item:string, itemKey) => {
                    return <Cell suspiciousnessLevel={this.props.suspiciousnessLevel}
                                 socket={this.props.socket}
                                 item={item}
                                 itemKey={itemKey}
                                 key={itemKey}
                                 row={row}
                                 rowKey={rowKey}
                    />
                });

                return(
                    <li className='map__row' key={rowKey}>
                        <ul className='map__inner-row'>{items}</ul>
                    </li>
                )
            });
        }

        return renderMap;
    }
}

export default Map;