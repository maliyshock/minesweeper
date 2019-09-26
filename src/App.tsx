import React from 'react';
import Map from './components/map'
import './App.css';
import _ from 'lodash';
import update from 'immutability-helper';

import { CHUNK_SIZE_X, CHUNK_SIZE_Y } from './constants';
import { round, convertToAbsolute, generateChunks, hasNumber, parseData, removeProp, extractNumberFromString, getTheAbsoluteStuff } from './helper';
import { gameState, chunk, neighbor } from './interfaces/interfaces';

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
    endOfMapIsReached: false,

    currentChunkIs: [],
    chunks: {},
    mines: {},
    safe: {},

    playing: true,

    decisionMade: false,

    notShureChunks: {},

    operationStatus: undefined,
    hintsAreHidden: true,
    title: 'Lets Rock',

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

    startButtonHandler(socket: WebSocket) {
        socket.send(`new ${this.state.level}`);
    }

    helpButtonHandler(socket: WebSocket) {
        socket.send('help');
    }

    reduceDifficulty() {
        this.setState( state => {
            return (this.state.level > 1) ? { ...state, level: state.level - 1} : state;
        })
    }

    riseUpDifficulty() {
        this.setState( state => {
            return (this.state.level < 4) ? {...state, level: state.level + 1} : state;
        })
    }

    // loop through the list of neighbor coordinates and do callback function
    loopThroughNeighbors( data: {
        neighborsArray: neighbor[],
        value: number,
        emptyCellsCounter: number,
        minesAround: number
    }, callback: ( x: number, y: number, chunk: chunk, value: number, emptyCellsCounter: number, minesAround: number ) => boolean ) {
        let result:boolean[] = [];
        for (let i = 0; i < data.neighborsArray.length; i++) {
            // get the coords from the iterated object
            let x: number = data.neighborsArray[i]['x'];
            let y: number = data.neighborsArray[i]['y'];
            let chunk = data.neighborsArray[i].chunk;

            // in case callback returns false break the cycle
            // not the break cycle if we do not have any new information
            // or we making analysis
            // new information will be mine or safe point not in the array of mines or safe points
            result.push( callback( x, y, chunk, data.value, data.emptyCellsCounter, data.minesAround ) );
        }

        // can we continue the loop above or not
        return !result.some( item => item === false);
    }

    // checks if current chunk in state has numbers inside
    // if yes returns position
    isChunkHasNumbers() {
        // start from the first tow
        let length = this.state.currentChunkIs.length;

        for (let i = 0; i < length; i++) {
            if ( hasNumber( this.state.currentChunkIs[i] ) ) {
                return i;
            }
        }
        return false
    }

    errasePredictions(currentChunkRow: string, currentChunkCol: string) {
        this.setState(prevState => {
            return update(prevState, {
                chunks: {
                    [currentChunkRow]: {
                        [currentChunkCol]: {
                            suspiciousnessLevel: { $set: {} }
                        }
                    }
                }
            })
        });
    }

    /* TODO:
     * how to avoid unnecessary parameters?
     */
    setMine( x: number, y: number, chunk: chunk,  value?: number, emptyCellsCounter?: number, minesAround?: number) {
        let row = chunk.rowName;
        let col = chunk.colName;

        let { a_x, a_y, absCoordinates } = getTheAbsoluteStuff(x, y, extractNumberFromString(col), extractNumberFromString(row) );

        if( !(absCoordinates in this.state.mines) ) {
            let newState = update (
                this.state, {
                    mines: {
                        [absCoordinates]: { $set: { x: a_x, y: a_y } }
                    },
                    endOfMapIsReached: { $set: false}
                });

            this.setState(newState);

            return false;
        } else {
            return true;
        }
    }

    setSafe( x: number, y: number, chunk: chunk,  value?: number, emptyCellsCounter?: number, minesAround?: number) {
        let row = chunk.rowName;
        let col = chunk.colName;

        let { a_x, a_y, absCoordinates } = getTheAbsoluteStuff(x, y, extractNumberFromString(col), extractNumberFromString(row) );

        if ( this.state.mines !== undefined && !( absCoordinates in this.state.mines ) ) {
            // update safe cells
            let newState = update (
                this.state, {
                    safe: {
                        [absCoordinates]: { $set: { x: a_x, y: a_y } }
                    },
                    endOfMapIsReached: { $set: false}
                });

            this.setState(newState);

            return false;
        } else {
            return true
        }
    }

    setSuspiciousness(row: string, col: string, coordinates: string, newValue: number, counter: number, x: number, y: number ) {
        this.setState(prevState => {
            return update(prevState, {
                chunks: {
                    [row]: {
                        [col]: {
                            suspiciousnessLevel: {
                                [coordinates]: {
                                    $set: { value: newValue, counter, x: x, y: y }
                                }
                            }
                        }
                    }
                }
            })
        });
    }

    analyzeOfNeighbors( x: number, y: number, chunk: chunk, value: number, emptyCellsCounter: number, minesAround: number ) {
        let row = chunk.rowName;
        let col = chunk.colName;

        // make prediction for all near empty cells
        let prediction: number = value / (emptyCellsCounter - minesAround) ;
        let newValue: number;
        let counter: number; // amount of intersections
        let coordinates = `x${x}y${y}`;

        // in case of having the different chunk, we can recalculate current yChunkNumber and xChunkNumber
        let { absCoordinates } = getTheAbsoluteStuff(x, y, extractNumberFromString(col), extractNumberFromString(row) );

        let suspiciousnessOfItem = ( this.state.chunks[row][col] !== undefined ) ? this.state.chunks[row][col].suspiciousnessLevel[coordinates] : undefined;

        if( !(absCoordinates in this.state.mines) ) {
                // if prediction level of coordinates exist
            if (suspiciousnessOfItem !== undefined) {
                newValue =  round((suspiciousnessOfItem['value'] + prediction)/2, -2) ;
                // newValue =  round( 1 - (1 - suspiciousnessOfItem['value']) * (1 - prediction ), -2 );
                counter = suspiciousnessOfItem['counter'] + 1 ;
            } else {
                newValue = round( prediction, -2);
                counter = 1;
            }

            this.setSuspiciousness(row, col, coordinates, newValue, counter, x, y)
        }
        return true;
    }

    areThereNeighbor(x: number, y: number) {
        let rowIdentifier = this.state.yChunkNumber;
        let colIdentifier = this.state.xChunkNumber;
        let colName = 'col_';
        let rowName = 'row_';
        let newY = y;
        let newX = x;

        // check if this coordinates of current chunk
        if ( this.state.currentChunkIs[y] !== undefined && this.state.currentChunkIs[y][x] !== undefined ) {
            rowName += `${this.state.yChunkNumber}`;
            colName += `${this.state.xChunkNumber}`;

            return {
                x: x,
                y: y,
                value: this.state.currentChunkIs[y][x],
                chunk: {
                    rowName: rowName,
                    colName: colName
                }
            };
        } else {
            // if not, check what chunk belong those coordinates
            // convert coordinates and set new col and row names according to new chunk

            if( y >= CHUNK_SIZE_Y) {
                rowIdentifier = rowIdentifier + 1;
                newY = y - CHUNK_SIZE_Y;
            } else if (y < 0) {
                rowIdentifier = rowIdentifier - 1;
                newY = y + CHUNK_SIZE_Y;
            }

            rowName += `${rowIdentifier}`;

            if( !(rowName in this.state.chunks) ) {
                return undefined;
            }

            if( x >= CHUNK_SIZE_X) {
                colIdentifier = colIdentifier + 1;
                newX = x - CHUNK_SIZE_X;
            } else if (x < 0) {
                colIdentifier = colIdentifier - 1;
                newX = x + CHUNK_SIZE_X;
            }
            colName += `${colIdentifier}`;


            if( !(colName in this.state.chunks[rowName]) ) {
                return undefined;
            }

            let theChunk = this.state.chunks[rowName][colName].map;
            return {
                x: newX,
                y: newY,
                value: theChunk[newY][newX],
                chunk: {
                    rowName: rowName,
                    colName: colName
                }
            };
        }
    }

    // relative coordinates to current chunk is
    whatDoWeHaveHere(x: number, y: number) {
        let emptyCellsCounter: number = 0;
        let neighborsArray = [];
        let minesAround = 0;

        // list of poteintial cells around
        let coordinatesToCheck = [
            { x: x - 1, y: y - 1 },
            { x: x,     y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x - 1, y: y + 1 },
            { x: x,     y: y + 1 },
            { x: x + 1, y: y + 1 },
        ];

        for (let i = 0; i < coordinatesToCheck.length; i++) {
            // go through list and check if cell exist on the map
            // if it is, save it coords and value to the variable
            let neighbor: neighbor | undefined = this.areThereNeighbor(coordinatesToCheck[i]['x'], coordinatesToCheck[i]['y']);
            // if this neighbor exist on the map
            if ( neighbor !== undefined && neighbor.value === '□' ) {
                // @ts-ignore
                let { absCoordinates } = getTheAbsoluteStuff(neighbor.x, neighbor.y, extractNumberFromString(neighbor.chunk.colName), extractNumberFromString(neighbor.chunk.rowName) )

                // do we have mines around this area
                if (absCoordinates in this.state.mines) {
                    minesAround++;
                }
                emptyCellsCounter++;
                neighborsArray.push(neighbor);
            }
        }

        return { minesAround, emptyCellsCounter, neighborsArray }
    }

    makePrediction(y: number, x: number, value: number): boolean {
        let result = true;
        if (this.state.map !== undefined) {
            let { minesAround, emptyCellsCounter, neighborsArray } = this.whatDoWeHaveHere(x, y);

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
            let updatedSafe = removeProp(firstKey, this.state.safe);
            this.setState({safe: updatedSafe});

            // open coords
            this.state.socket.send(`open ${x} ${y}`);
        }
        else {
            return false
        }
    }

    goToTheNextChunk() {
        // go to the next chunk if it is possible
        if( this.state.xChunkNumber < this.state.xChunksAmount ) {
            this.setState( {
                xChunkNumber: this.state.xChunkNumber + 1,
                currentChunkIs: this.state.chunks[`row_${this.state.yChunkNumber}`][`col_${this.state.xChunkNumber + 1}`].map
            })
        }
        else if ( this.state.yChunkNumber < this.state.yChunksAmount ) {
            this.setState( {
                yChunkNumber: this.state.yChunkNumber + 1,
                xChunkNumber: 0,
                currentChunkIs: this.state.chunks[`row_${this.state.yChunkNumber + 1}`][`col_0`].map
            })
        }
    }

    // picked smallest avaliable prediction to send
    makeDecision(currentChunkRow: string, currentChunkCol: string):boolean {
        let smallestPredictionCoords: { value: number, counter: number, x: number, y: number } | undefined;
        // if there are some suspiciousness cells
        if (!_.isEmpty( this.state.chunks[currentChunkRow][currentChunkCol].suspiciousnessLevel) ) {
            _.forOwn(this.state.chunks[currentChunkRow][currentChunkCol].suspiciousnessLevel, (value, key) => {
                // if there is no saved smallestPredictionCoords
                if (smallestPredictionCoords === undefined ||
                    ( ( value.value <= smallestPredictionCoords.value ) && !(`x${value.x}y${value.y}` in this.state.mines )) ) {
                    // if we found smaller prediction than previous one
                    smallestPredictionCoords = value;
                }
            });

            // pick up samllest decision
            if ( smallestPredictionCoords !== undefined &&
                // smallestPredictionCoords.value < 100 &&
                    !( `x${smallestPredictionCoords.x}y${smallestPredictionCoords.y}` in this.state.mines )
                ) {

                let a_x = convertToAbsolute(smallestPredictionCoords.x, this.state.xChunkNumber, CHUNK_SIZE_X);
                let a_y = convertToAbsolute(smallestPredictionCoords.y, this.state.yChunkNumber, CHUNK_SIZE_Y);

                // errase previous predictions for this chunk
                this.errasePredictions(currentChunkRow, currentChunkCol);

                this.state.socket.send(`open ${a_x} ${a_y}`);
                return true;
            }
            // there is no predictions save coordinates of this one item, and go to the next chunk
            else {
                return false;
            }
        } else {
            return false;
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
            let {map, operationStatus, cols, rows} = parseData(e);

            // update the state with new data
            this.setState({
                map: map,
                operationStatus: operationStatus,
                cols: cols,
                rows: rows,
                cells: cols * rows,

                decisionMade: false,

                xChunksAmount: ( cols / CHUNK_SIZE_X ) - 1,
                yChunksAmount: ( rows / CHUNK_SIZE_Y ) - 1
            });

            // if map exist and we are ready to play
            if (map !== undefined && map.length > 0 && operationStatus !== 'open: You lose' && operationStatus !== 'open: You win' && this.state.playing) {
                let newChunks = generateChunks( map );
                let currentChunkRow = `row_${this.state.yChunkNumber}`;
                let currentChunkCol = `col_${this.state.xChunkNumber}`;

                this.setState({
                    chunks: newChunks ,
                    currentChunkIs: newChunks[currentChunkRow][currentChunkCol].map
                });

                let predictionResult = true;
                let emptyRows = 0;
                let emptyCells = 0;

                // returns row number of current chunk if the row has numbers inside
                let rowPosition = this.isChunkHasNumbers();


                // if we have any 100% safety cells - open oen
                if (!_.isEmpty(this.state.safe)) {
                    this.openSafeCell();
                } else {
                    // if we have row with number
                    if (rowPosition !== false) {
                        // loop through piece(chunk) copied and saved to the state from the global map
                        loop1:
                            for (let y: number = rowPosition; y < this.state.currentChunkIs.length; y++) {
                                // row position is start point, but we could have empty rows after
                                if ( hasNumber( this.state.currentChunkIs[y] ) ) {
                                    for (let x = 0; x < this.state.currentChunkIs[y].length; x++) {
                                        // does it have any numbers inside

                                        let a_x = convertToAbsolute(x, this.state.xChunkNumber, CHUNK_SIZE_X);
                                        let a_y = convertToAbsolute(y, this.state.yChunkNumber, CHUNK_SIZE_Y);

                                        let item = map[a_y][a_x];
                                        // if this is a number with value > 0
                                        if (item !== '□' && ( _.parseInt(item) > 0 ) ) {
                                            //returns false, when set mine or safe cells
                                            predictionResult = this.makePrediction(y, x, _.parseInt(item));

                                            // if we found mine or safe cells we will get false,
                                            if( predictionResult === false ) {

                                                // errase previous predictions for this chunk
                                                this.errasePredictions(currentChunkRow, currentChunkCol);
                                                //  break the current cycle
                                                break loop1;
                                            }
                                        } else if( item === '□' ) {
                                            if( !(`x${a_x}y${a_y}` in this.state.mines) ) {
                                                emptyCells++
                                            }
                                        }
                                    }
                                } else {
                                    emptyRows++;
                                }
                            }
                    }

                    if( predictionResult ) {
                        // if we reached the end of the map and we do not have any choice except to make decisions
                        if( this.state.xChunksAmount === this.state.xChunkNumber && this.state.yChunksAmount === this.state.yChunkNumber && !this.state.endOfMapIsReached) {
                            this.setState( {  xChunkNumber: 0, yChunkNumber: 0, endOfMapIsReached: true } );
                        }
                        // if there are some empty avaliable to choose cells - try to make decision
                        else if( (emptyCells > 0 || emptyRows > 0) && this.state.endOfMapIsReached) {
                            // if there no any avaliable predictions < 100 we can not make decision

                            this.makeDecision(currentChunkRow, currentChunkCol);
                            this.setState( { endOfMapIsReached: false, decisionMade: true } );
                        } else {
                            this.goToTheNextChunk();
                        }
                    }

                    if( !this.state.decisionMade ) {
                        this.state.socket.send('map');
                    }
                }


            } else if(map !== undefined && map.length > 0) {
                let newChunks = generateChunks( map );
                let currentChunkRow = `row_${this.state.yChunkNumber}`;
                let currentChunkCol = `col_${this.state.xChunkNumber}`;

                this.setState({
                    chunks: newChunks ,
                    currentChunkIs: newChunks[currentChunkRow][currentChunkCol].map
                });
            }

            switch (operationStatus) {
                case 'new: OK':
                    this.setState(initialState);

                    // get data
                    this.state.socket.send('open 0 0');
                    break;

                case 'map:':
                    break;

                case 'help:':
                    break;

                case 'open: You lose':
                    this.setState({
                        title: 'You lose',
                        lose: this.state.lose + 1,
                        winRate: ( this.state.win / (this.state.lose + 1) ) * 100,
                        chunks: {},
                        playing: false

                    });
                    // this.state.socket.send('map');
                    this.state.socket.send(`new ${this.state.level}`);
                    break;

                case 'open: You win':
                    this.setState({
                        title: 'You Win',
                        win: this.state.win + 1,
                        winRate: ( (this.state.win + 1) / this.state.lose ) * 100,
                        playing: false
                    });

                    break;

                case 'open: Out of bounds':
                    break;

                case 'open: OK':
                    this.state.socket.send('map');
                    break;

                default:
                    break;
            }
        };
    }


    render() {
        let hintsVisibility = (this.state.hintsAreHidden) ? 'map--hints-are-visible' : '';

        let levelRiseUpDisabled = (this.state.level === 4);
        let levelReduceDisabled = this.state.level === 1;

        return (
            <div className='app'>
                <div className="app__box">
                    <div className="difficulty">
                        <span className="h2 difficulty__title">Choose difficulty:</span>

                        <span className="difficulty__inner">
                            <button className="button arrow arrow--shape-up" disabled={levelReduceDisabled} onClick={() => this.reduceDifficulty()}>–</button>
                            <span className="h2">{this.state.level}</span>
                            <button className="button arrow arrow--shape-up" disabled={levelRiseUpDisabled} onClick={() => this.riseUpDifficulty()}>+</button>
                        </span>
                    </div>
                </div>

                <div className='app__buttons'>
                    <button className='button' onClick={() => this.startButtonHandler(this.state.socket)}>Start New Game</button>
                </div>

                <div className="app__box">
                    <h2>{this.state.title}: {}</h2>
                    { (this.state.map !== undefined) ?
                        <Map chunks={this.state.chunks}
                             map={this.state.map}
                             mines={this.state.mines}
                             safe={this.state.safe}
                             socket={this.state.socket}
                             xChunkNumber={this.state.xChunkNumber}
                             yChunkNumber={this.state.yChunkNumber}
                        /> : ''}
                </div>

                <div className={`app__map map ${hintsVisibility}`}></div>
            </div>
        );
    }
}

export default App;
