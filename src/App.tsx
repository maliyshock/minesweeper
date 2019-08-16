import React from 'react';
import Map from './components/map'
import './App.css';
import _ from 'lodash';
import update from 'immutability-helper';

import { CHUNK_SIZE_X, CHUNK_SIZE_Y } from './constants';
import { decimalAdjust } from './helper';

export interface gameState {
    socket: WebSocket,
    map: string[] | undefined,
    rows: number | undefined,
    cols: number | undefined,
    cells: number | undefined,

    xChunksAmount: number,
    yChunksAmount: number,
    xChunkNumber: number,
    yChunkNumber: number,
    currentXStartPoint: number,
    currentYStartPoint: number,

    currentChunkIs: string[],
    chunks: {
        [key: string]: {
            suspiciousnessLevel: {
                [key: string]: { x: number, y: number, value: number, counter: number }
            }
        }
    }
    chunkEndIsReached: boolean,

    notShureChunks: {
        [key: string]: {
            [key: string]: { x: number, y: number }
        }
    }

    mines: { [key: string]: { x: number, y: number } },
    safe: { [key: string]: { x: number, y: number } },

    operationStatus: string | undefined,
    hintsAreHidden: boolean,
    title: string,
    playing: boolean,

    level: number,
    lose: number,
    win: number,
    winRate: number | undefined
}

export interface neighbor {
    x: number,
    y: number,
    value: string
};

let initialState = {
    socket: new WebSocket('wss://hometask.eg1236.com/game1/'),
    map: undefined,
    rows: undefined,
    cols: undefined,
    cells: undefined,

    xChunksAmount: 0,
    yChunksAmount: 0,
    xChunkNumber: 0,
    yChunkNumber: 0,
    currentXStartPoint: 0,
    currentYStartPoint: 0,
    chunkEndIsReached: false,

    currentChunkIs: [],
    chunks: {},
    mines: {},
    safe: {},
    notShureChunks: {},

    operationStatus: undefined,
    hintsAreHidden: true,
    title: 'Lets Rock',
    playing: true,

    level: 2,
    lose: 0,
    win: 0,
    winRate: undefined
};

class App extends React.Component<{}, gameState> {
    constructor(props: any) {
        super(props);

        this.state = initialState;

        // help      - returns valid commands
        // new L     - starts new session, L=1|2|3|4
        // map       - returns the current map
        // open X Y  - opens cell at X,Y coordinates

        // on connection send comand to begin game
    }

    parseData(e: MessageEvent) {
        let data: string = e.data;
        let splitedData: string[] = _.split(data, '\n');
        let operationStatus: string = splitedData[0];
        let map: string[] = [];
        let rows: number = 0;
        let cols: number = 0;

        if (splitedData.length > 1) {
            map = _.slice(splitedData, 1, splitedData.length - 1);
            rows = map.length;
            cols = map[0].length;
        }

        return {map, operationStatus, rows, cols};
    }

    hasNumber(myString: string) {
        return /^(?=.*\d)(?=.*[1-9]).{1,10}$/.test(myString);
    }

    convertToAbsolute(value: number, chunkMultiplier: number, size: number) {
        return value + ( chunkMultiplier * size );
    }

    removeProp(name: string, objectArg: { [key: string]: { x: number, y: number } } ) {
        const { [name]: val, ...remaning } = objectArg;
        return remaning;
    }

    startButtonHandler(socket: WebSocket) {
        socket.send(`new ${this.state.level}`);
    }

    helpButtonHandler(socket: WebSocket) {
        socket.send('help');
    }

    // loop through the list of neighbor coordinates and do callback function
    loopThroughNeighbors(data: {
        neighborsArray: neighbor[],
        value: number,
        emptyCellsCounter: number,
        minesAround: number
    }, callback: (coordinate: string, x: number, y: number, value: number, emptyCellsCounter: number, minesAround: number) => boolean) {
        let result = true;
        for (let i = 0; i < data.neighborsArray.length; i++) {
            // get the coords from the iterated object
            let x: number = data.neighborsArray[i]['x'];
            let y: number = data.neighborsArray[i]['y'];

            let itemCoordinates: string = `x${x}y${y}`;

            if ( !callback( itemCoordinates, x, y, data.value, data.emptyCellsCounter, data.minesAround ) ) {
                result = false;
                break;
            }
        }

        return result;
    }

    // checks if current chunk in state has numbers inside
    // if yes returns position
    isChunkHasNumbers() {
        // start from the first tow
        let length = this.state.currentChunkIs.length;

        for (let i = 0; i < length; i++) {
            if ( this.hasNumber( this.state.currentChunkIs[i] ) ) {
                return i;
            }
        }
        return false
    }

    makeNewChunk() {
        // where to start
        if (this.state.map !== undefined) {
            // convert from human readability to computer orders
            let initialRow = this.convertToAbsolute(this.state.currentYStartPoint, this.state.yChunkNumber, CHUNK_SIZE_Y);
            let column = this.convertToAbsolute(this.state.currentXStartPoint, this.state.xChunkNumber, CHUNK_SIZE_X);
            let newChunk: string[] = [];
            let iteratableRow: number = initialRow;

            // from current position to maximum chunk size of rows
            for (initialRow; iteratableRow < (initialRow + CHUNK_SIZE_Y); iteratableRow++) {
                newChunk.push(this.state.map[iteratableRow].slice(column, (column + CHUNK_SIZE_Y)));
            }

            this.setState({ currentChunkIs: newChunk });
        }
        return false
    }

    areThereNeighbor(row: number, col: number) {
        if (this.state.map !== undefined) {
            if (this.state.map[row] !== undefined) {
                return {x: col, y: row, value: this.state.map[row][col]};
            }
            return undefined
        }
    }

    whatDoWeHaveHere(col: number, row: number) {
        let emptyCellsCounter: number = 0;
        let neighborsArray = [];
        let minesAround = 0;

        // list of poteintial cells around
        let coordinatesToCheck = [
            {x: col - 1, y: row - 1},
            {x: col, y: row - 1},
            {x: col + 1, y: row - 1},
            {x: col - 1, y: row},
            {x: col + 1, y: row},
            {x: col - 1, y: row + 1},
            {x: col, y: row + 1},
            {x: col + 1, y: row + 1},
        ];

        for (let i = 0; i < coordinatesToCheck.length; i++) {
            // go through list and check if cell exist on the map
            // if it is, save it coords and value to the variable
            let neighbor: neighbor | undefined = this.areThereNeighbor(coordinatesToCheck[i]['y'], coordinatesToCheck[i]['x']);

            // if this neighbor exist on the map
            if ( neighbor !== undefined && neighbor.value === '□' ) {
                // do we have mines around this area
                if (`x${neighbor.x}y${neighbor.y}` in this.state.mines) {
                    minesAround++;
                }
                emptyCellsCounter++;
                neighborsArray.push(neighbor);
            }
        }

        return {minesAround, emptyCellsCounter, neighborsArray}
    }

    compareCoordinatesWithCurrentChunk(x: number, y: number ) {
        let r = this.state.xChunkNumber;
        let c = this.state.yChunkNumber;

        if( x > (this.state.xChunkNumber * CHUNK_SIZE_X + CHUNK_SIZE_X) ) {
            c = c + 1;
        } else if (x < this.state.xChunkNumber * CHUNK_SIZE_X ) {
            c = c - 1;
        }

        if( y > (this.state.yChunkNumber * CHUNK_SIZE_Y + CHUNK_SIZE_Y) ) {
            r = r + 1;
        } else if (x < this.state.yChunkNumber * CHUNK_SIZE_Y ) {
            r = r - 1;
        }

        return `chunk_r${r}_c${c}`;
    }

    setMine( coordinates: string, x: number, y: number,  value?: number, emptyCellsCounter?: number, minesAround?: number) {
        // does this item belongs to this chunk or another
        let checkedChunkName = this.compareCoordinatesWithCurrentChunk( x, y );
        let suspiciousnessLevelObject = ( this.state.chunks[checkedChunkName] !== undefined ) ? this.state.chunks[checkedChunkName].suspiciousnessLevel : undefined;

        if (suspiciousnessLevelObject !== undefined && coordinates in suspiciousnessLevelObject) {
            let updatedSuspiciousness = this.removeProp(coordinates, suspiciousnessLevelObject);

            // remove prediction, because it is mine
            let newState = update (
                this.state, {
                    chunks: {
                        [checkedChunkName]: {
                            suspiciousnessLevel: { $set: updatedSuspiciousness }
                        }
                    }
                });

            this.setState(newState);
        }

        if( !(coordinates in this.state.mines) ) {
            let newState = update (
                this.state, {
                    mines: {
                        [coordinates]: { $set: { x: x, y: y } }
                    }
                });

            this.setState(newState);

            return false;

        } else {
            return true
        }
    }

    setSafe( coordinates: string, x: number, y: number,  value?: number, emptyCellsCounter?: number, minesAround?: number) {
        if ( this.state.mines!== undefined && !( coordinates in this.state.mines ) ) {
            // update safe cells
            let newState = update (
                this.state, {
                    safe: {
                        [coordinates]: { $set: { x: x, y: y } }
                    }
                });

            this.setState(newState);

            return false;

        } else {
            return true
        }

    }

    analyzeOfNeighbors( coordinates: string, x: number, y: number, value: number, emptyCellsCounter: number, minesAround: number ) {
        let result = true;

        // does this item belongs to this chunk or another
        let checkedChunkName = this.compareCoordinatesWithCurrentChunk( x, y );

        // make prediction for all near empty cells
        let prediction: number = value / (emptyCellsCounter - minesAround) ;
        let newValue: number;
        let counter: number; // amount of intersections
        let suspiciousnessOfItem = ( this.state.chunks[checkedChunkName] !== undefined ) ? this.state.chunks[checkedChunkName].suspiciousnessLevel[coordinates] : undefined;

        // if prediction level of coordinates exist
        if (suspiciousnessOfItem !== undefined) {
            newValue =  decimalAdjust('round', 1 - (1 - suspiciousnessOfItem['value']) * (1 - prediction ), -2 );
            counter = suspiciousnessOfItem['counter'] + 1 ;
        } else {
            newValue = decimalAdjust('round', prediction, -2);
            counter = 1;
        }

        this.setState(prevState => {
            return update(prevState, {
                chunks: {
                    [checkedChunkName]: {
                        suspiciousnessLevel: {
                            [coordinates]: {
                                $set: { value: newValue, counter, x: x, y: y }
                            }
                        }
                    }
                }
            })
        });
        result = true;

        return result;
    }

    makePrediction(row: number, col: number, value: number): boolean {
        let result = true;
        if (this.state.map !== undefined) {
            let { minesAround, emptyCellsCounter, neighborsArray } = this.whatDoWeHaveHere(col, row);

            // if there are neighbors
            if (neighborsArray.length > 0 && neighborsArray.length > minesAround) {
                // in case there are only options equals to amount of mines
                // save those coordinates as 100% mines
                // count amount of 100% mines around
                if (value === emptyCellsCounter) {
                    // minesAround = value;
                    result = this.loopThroughNeighbors({ neighborsArray, value, emptyCellsCounter, minesAround}, this.setMine.bind(this) );
                } else if ((value === minesAround) && (emptyCellsCounter > minesAround)) {
                    // in case if we know how many mines around and the amount of empty cells more than mines around number
                    // safe cells = neighbors - mines
                    result = this.loopThroughNeighbors( { neighborsArray, value, emptyCellsCounter, minesAround}, this.setSafe.bind(this) );

                } else {
                    // in case we do not have information about mines around make some hypothesis and predictions
                    // save prediction level for accessible neighbors
                    result = this.loopThroughNeighbors( { neighborsArray, value, emptyCellsCounter, minesAround }, this.analyzeOfNeighbors.bind(this) );
                }
            }
        }
        return result;
    }

    openSafeCell() {
        let safeObj = this.state.safe;

        if (safeObj !== undefined && !( _.isEmpty(safeObj) )) {
            // pick up first object element
            let firstKey = Object.keys(safeObj)[0];
            let firstSaved = safeObj[firstKey];

            // save it coords
            let x = firstSaved.x;
            let y = firstSaved.y;

            // remove it from the state
            let updatedSafe = this.removeProp(firstKey, this.state.safe);
            this.setState({safe: updatedSafe, playing: false});

            // open coords
            this.state.socket.send(`open ${x} ${y}`);
        }
        else {
            return false
        }
    }

    goToTheNextChunk() {
        // go to the next chunk if it is possible
        if( this.state.yChunkNumber < this.state.yChunksAmount ) {
            this.setState( {yChunkNumber: this.state.yChunkNumber + 1} )
        }
        else if ( this.state.xChunkNumber < this.state.xChunksAmount ) {
            this.setState( {xChunkNumber: this.state.xChunkNumber + 1, yChunkNumber: 0} )
        }
        else {
            console.log('here i should go an chek if there any notShureChunks left');
        }
    }

    // picked smallest avaliable prediction to send
    makeDecision(chunkName:string) {
        let smallestPredictionCoords: { value: number, counter: number, x: number, y: number } | undefined;
        // if there are some suspiciousness cells
        if (!_.isEmpty( this.state.chunks[chunkName].suspiciousnessLevel) ) {
            _.forOwn(this.state.chunks[chunkName].suspiciousnessLevel, (value, key) => {
                // if there is no saved smallestPredictionCoords
                if (smallestPredictionCoords === undefined ||
                    ( ( value.value <= smallestPredictionCoords.value ) && !(`x${value.x}y${value.y}` in this.state.mines )) ) {
                    // if we found smaller prediction than previous one
                    smallestPredictionCoords = value;
                }
            });

            // pick up samllest decision
            if ( smallestPredictionCoords !== undefined &&
                    !( `x${smallestPredictionCoords.x}y${smallestPredictionCoords.y}` in this.state.mines )
                ) {

                this.state.socket.send(`open ${smallestPredictionCoords.x} ${smallestPredictionCoords.y}`);
                this.setState({ playing: false });
            }
            // there is no predictions save coordinates of this one item, and go to the next chunk
            else {
                // should i double check my currentChunkIs ???
                for (let y = 0; y < this.state.currentChunkIs.length; y++) {
                    for (let x = 0; x < this.state.currentChunkIs[y].length; x++) {
                        let item = this.state.currentChunkIs[y][x];
                        if (item === '□') {
                            let a_x = this.convertToAbsolute(x, this.state.xChunkNumber, CHUNK_SIZE_X);
                            let a_y = this.convertToAbsolute(y, this.state.yChunkNumber, CHUNK_SIZE_Y);

                            if( !(`x${a_x}y${a_y}` in this.state.mines) ) {
                                this.setState(prevState => {
                                    return update(prevState, {
                                        notShureChunks: {
                                            [chunkName]: {
                                                $set: {
                                                    [`x${a_x}y${a_y}`]: { x: a_x, y: a_y }
                                                }
                                            }
                                        }
                                    });
                                })
                            }
                        }
                    }
                }

                this.goToTheNextChunk();
            }
        }
    }

    componentDidMount() {
        this.state.socket.onopen = () => {};

        document.addEventListener('keydown', (e) => {
            // tab key
            if (e.keyCode === 9) {
                e.preventDefault();
                this.setState(prevState => ({
                    hintsAreHidden: !prevState.hintsAreHidden
                }));
            }
        });

        this.state.socket.onmessage = (e: MessageEvent) => {
            // each time as we got message we save the new data
            let {map, operationStatus, cols, rows} = this.parseData(e);
            console.log(e.data);
            // update the state with new data
            this.setState({
                map: map,
                operationStatus: operationStatus,
                cols: cols,
                rows: rows,
                cells: cols * rows,

                xChunksAmount: ( cols / CHUNK_SIZE_X ) - 1,
                yChunksAmount: ( rows / CHUNK_SIZE_Y ) - 1,
            });

            // if map exist and we are ready to play
            if (this.state.map !== undefined && this.state.map.length > 0 && this.state.playing) {
                this.makeNewChunk();

                let r = this.state.xChunkNumber;
                let c = this.state.yChunkNumber;
                let chunkName = `chunk_r${r}_c${c}`;
                let predictionResult: boolean | undefined;

                // returns row number of current chunk if the row has numbers inside
                let rowPosition = this.isChunkHasNumbers();

                // if we have any 100% safety cells - open oen
                if (!_.isEmpty(this.state.safe)) {
                    this.openSafeCell();
                }
                // if we have row with number
                else if (rowPosition !== false) {

                    // errase previous predictions for this chunk
                    this.setState({
                        chunks: {
                            [chunkName]: { suspiciousnessLevel: {} }
                        },
                        chunkEndIsReached: false
                    });

                    // loop through piece(chunk) copied and saved to the state from the global map
                    loop1:
                    for (let y: number = rowPosition; y < this.state.currentChunkIs.length; y++) {
                        // row position is start point, but we could have empty rows after
                        if ( this.hasNumber( this.state.currentChunkIs[y] ) ) {
                            for (let x = 0; x < this.state.currentChunkIs[y].length; x++) {
                                // does it have any numbers inside

                                let a_x = this.convertToAbsolute(x, this.state.xChunkNumber, CHUNK_SIZE_X);
                                let a_y = this.convertToAbsolute(y, this.state.yChunkNumber, CHUNK_SIZE_Y);

                                let item = this.state.map[a_y][a_x];
                                // if this is a number with value > 0
                                if (item !== '□' && ( _.parseInt(item) > 0 )) {
                                    predictionResult = this.makePrediction(y, x, _.parseInt(item));

                                    if(predictionResult === false) {
                                        //  break the current cycle
                                        break loop1;
                                    }
                                }

                                if( (x === this.state.currentChunkIs[y].length - 1) && (y === this.state.currentChunkIs.length - 1 ) ) {
                                    this.setState({chunkEndIsReached: true});
                                }
                            }
                        }

                        if( (y === this.state.currentChunkIs.length - 1 ) ) {
                            this.setState({chunkEndIsReached: true});
                        }
                    }

                    if( predictionResult !== false && this.state.chunkEndIsReached ) {
                        this.makeDecision(chunkName);
                    } else {
                        this.state.socket.send('map')
                    }

                    // what if all chunks are empty?
                    // try to get some luck

                } else {
                    // if it is new chunk and we did not found any numbers
                    // but we have some predictions
                    if (this.state.chunks[chunkName] !== undefined) {
                        // check if it has predictions comed from other chunk or not, if smaller than 40% then send
                        _.forOwn(this.state.chunks[chunkName].suspiciousnessLevel, (value, key) => {
                            if (value.value < 40) {
                                this.state.socket.send(`open ${value.x} ${value.y}`);
                            } else {
                                this.goToTheNextChunk();

                                // what if all chunks are empty?
                                // try to get some luck
                            }
                        });
                    }
                    // in case of the beggining
                    else if ( this.state.xChunkNumber === 0 && this.state.yChunkNumber === 0 ) {
                        this.state.socket.send('open 0 0');
                    }
                }
            }

            switch (operationStatus) {
                case 'new: OK':
                    this.setState(initialState);

                    // get data
                    this.state.socket.send('map');
                    break;

                case 'map:':
                    break;

                case 'help:':
                    break;

                case 'open: You lose':
                    this.setState({
                        title: 'You lose',
                        playing: false,
                        lose: this.state.lose + 1,
                        winRate: ( this.state.win / (this.state.lose + 1) ) * 100,
                        chunks: {},

                    });
                    this.state.socket.send('map');
                    break;

                case 'open: You win':
                    this.setState({
                        title: 'You Win',
                        playing: false,
                        win: this.state.win + 1,
                        winRate: ( (this.state.win + 1) / this.state.lose ) * 100
                    });

                    console.log(e);
                    break;

                case 'open: Out of bounds':
                    break;

                case 'open: OK':
                    this.setState({playing: true});
                    this.state.socket.send('map',);
                    break;

                default:
                    break;
            }
        };
    }


    render() {
        let hintsVisibility = (this.state.hintsAreHidden) ? 'map--hints-are-visible' : '';

        return (
            <div className='app'>
                <div className='app__buttons'>
                    <button className='button' onClick={() => this.helpButtonHandler(this.state.socket)}>Help</button>
                </div>
                <div className='app__buttons'>
                    <button className='button' onClick={() => this.startButtonHandler(this.state.socket)}>Start New Game</button>
                </div>

                <div className={`app__map map ${hintsVisibility}`}>
                    <h2>{this.state.title}: {}</h2>
                    <ul className='map__list'>
                        {(this.state.map !== undefined) ?
                            <Map chunks={this.state.chunks}
                                 map={this.state.map}
                                 mines={this.state.mines}
                                 safe={this.state.safe}
                                 socket={this.state.socket}
                            /> : ''}
                    </ul>
                </div>
            </div>
        );
    }
}

export default App;
