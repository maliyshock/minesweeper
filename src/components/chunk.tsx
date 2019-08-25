import React from 'react';
import Cell from './cell'
import { convertToAbsolute } from './../helper';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y } from './../constants';

export interface chunkProps {
    chunkMap: string[],
    socket: WebSocket,
    rowMultiplier: number,
    colMultiplier: number,
    mines: { [key: string]: { x: number, y: number } },
    safe: { [key: string]: { x: number, y: number } },
    suspiciousnessLevel: {
        [coordinates: string]: { x: number, y: number, value: number, counter: number }
    },
    isActive: boolean
}

export interface chunkState {

}

class Chunk extends React.Component<chunkProps, chunkState>{
    constructor(props: any) {
        super(props);
        this.state = {

        }
    }

    render() {
        let isActive = (this.props.isActive) ? ' active' : '';

        let renderChunk = this.props.chunkMap.map((row:string, rowKey) => {
            let items = row.split('').map((item: string, itemKey) => {
                let a_x = convertToAbsolute(itemKey, this.props.colMultiplier, CHUNK_SIZE_X);
                let a_y = convertToAbsolute(rowKey, this.props.rowMultiplier, CHUNK_SIZE_Y);
                let isMine: boolean;
                let isSafe: boolean;
                let itemAbsCoords = `x${a_x}y${a_y}`;
                let itemCoords = `x${itemKey}y${rowKey}`;

                isMine = (itemAbsCoords in this.props.mines);
                isSafe = (itemAbsCoords in this.props.safe);

                let suspiciousnessLevel = (this.props.suspiciousnessLevel !== undefined) ? this.props.suspiciousnessLevel[itemCoords] : undefined

                return <Cell
                    suspiciousnessLevel={suspiciousnessLevel}
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

            return <ul className='chunk__row' key={rowKey}>{items}</ul>;
        });

        return (
            <ul className={`map__chunk ${isActive}`}>
                <li className='map chunk'>
                    { renderChunk }
                </li>
            </ul>
        )
    }
}

export default Chunk;