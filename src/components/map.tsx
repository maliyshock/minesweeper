import React from 'react';
import Chunk from './chunk'
// import { CHUNK_SIZE_X, CHUNK_SIZE_Y } from './../constants';
import _ from 'lodash';

import { chunks } from './../interfaces/interfaces';


export interface mapState {
    hintsAreHidden: boolean,
    amountOfChunkRows: number
}

export interface mapProps {
    map: string[] | undefined,
    socket: WebSocket,
    chunks: chunks,
    mines: { [key: string]: { x: number, y: number } },
    safe: { [key: string]: { x: number, y: number } },
    xChunkNumber: number,
    yChunkNumber: number
}

class Map extends React.Component<mapProps, mapState> {
    constructor(props: any) {
        super(props);
        this.state = {
            hintsAreHidden: false,
            amountOfChunkRows: 0
        }
    }


    componentDidMount() {

    }

    render() {
        return(
            <ul className='map__list'>
                {
                    ( !_.isEmpty(this.props.chunks) ) ?
                    Object.keys(this.props.chunks).map( (rowName, rowIndex) => {
                        return (
                            <li className='map__row' key={rowName}>
                                {
                                    Object.keys( this.props.chunks[rowName] ).map( (chunkName, chunkIndex) => {
                                        let isActive = (chunkIndex === this.props.xChunkNumber && rowIndex === this.props.yChunkNumber);

                                        return <Chunk
                                            key={rowName+chunkName}
                                            socket={this.props.socket}
                                            chunkMap={this.props.chunks[rowName][chunkName]['map']}
                                            suspiciousnessLevel={this.props.chunks[rowName][chunkName]['suspiciousnessLevel']}
                                            rowMultiplier={rowIndex}
                                            colMultiplier={chunkIndex}
                                            mines={this.props.mines}
                                            safe={this.props.safe}
                                            isActive={isActive}
                                        />
                                    })
                                }
                            </li>
                        )

                    })
                        : ''
                }
            </ul>
        );
    }
}

export default Map;