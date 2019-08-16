import React from 'react';
import Cell from './cell'

export interface mapState {
    hintsAreHidden: boolean
}

export interface mapProps {
    map: string[] | undefined,
    socket: WebSocket,
    chunks: {
        [key: string]: {
            suspiciousnessLevel: {
                [key: string]: { x: number, y: number, value: number, counter: number }
            }
        }
    }
    mines: { [key: string]: { x: number, y: number } },
    safe: { [key: string]: { x: number, y: number } }
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

    generateChunkName(r: number, c: number) {
     return `chunk_r${r}_c${c}`
    }

    render() {
        let renderMap = {};
        let r = 0;
        let c = 0;
        let rowCounter = 0;
        let chunkName = this.generateChunkName(r, c);
        let itemCoords: string;
        let isMine: boolean;
        let isSafe: boolean;

        if(this.props.map !== undefined) {
            renderMap = this.props.map.map((row:string, rowKey) => {
                let colCounter = 0;


                if(rowCounter < 10) {
                    rowCounter++
                } else {
                    rowCounter = 0;
                    r++;
                    chunkName = this.generateChunkName(r, c);
                }

                let items = row.split('').map((item:string, itemKey) => {
                    if(colCounter < 10) {
                        colCounter++
                    } else {
                        colCounter = 0;
                        c++;
                        chunkName = this.generateChunkName(r, c);
                    }

                    itemCoords = `x${itemKey}y${rowKey}`;

                    isMine = (itemCoords in this.props.mines);
                    isSafe = (itemCoords in this.props.safe);

                    let suspiciousness = (this.props.chunks[chunkName] !== undefined) ? this.props.chunks[chunkName].suspiciousnessLevel[itemCoords] : undefined

                    return <Cell
                                suspiciousnessLevel={suspiciousness}
                                 socket={this.props.socket}
                                 item={item}
                                 itemKey={itemKey}
                                 key={itemKey}
                                 row={row}
                                 rowKey={rowKey}
                                isMine={isMine}
                                isSafe={isSafe}
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