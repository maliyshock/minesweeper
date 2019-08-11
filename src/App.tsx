import React, {Component} from 'react';
import Map from './components/map'
import './App.css';
import _ from 'lodash';

export interface gameState {
    socket: WebSocket,
    level: number,
    map: string[] | undefined,
    rows: number | null,
    cols: number | null,
    operationStatus: string | undefined,
    suspiciousnessLevel: { [key: string]: {value:number, counter:number} },
    hintsAreHidden: boolean,
    title: string
}

function openCorners(socket:any, cols:number, rows:number) {
    socket.send('open 0 0');
    // debugger;
    socket.send(`open 0 ${rows}`);
    // debugger;
    socket.send(`open ${cols} 0`);
    // debugger;
    socket.send(`open ${cols} ${rows}`);
    // debugger;
}

class App extends React.Component<{}, gameState> {
    constructor(props:any) {
        super(props);

        this.state = {
            socket: new WebSocket('wss://hometask.eg1236.com/game1/'),
            level: 1,
            map: undefined,
            rows: null,
            cols: null,
            operationStatus: undefined,
            suspiciousnessLevel: {},
            hintsAreHidden: false,
            title: 'Lets Rock'
        };

        // help      - returns valid commands
        // new L     - starts new session, L=1|2|3|4
        // map       - returns the current map
        // open X Y  - opens cell at X,Y coordinates

        // on connection send comand to begin game
    }

    parseData(e:MessageEvent) {
        let data:string = e.data;
        let splitedData:string[] = _.split(data, '\n');
        let operationStatus:string = splitedData[0];
        let map:string[] = [];
        let rows:number = 0;
        let cols:number = 0;

        if(splitedData.length > 1) {
            map = _.slice(splitedData, 1, splitedData.length-1);
            rows = map.length;
            cols = map[0].length;
            // console.log(map);
        }

        return {map, operationStatus, rows, cols};
    }

    startButtonHandler(socket: WebSocket) {
        socket.send('new 1');
    }

    helpButtonHandler(socket: WebSocket) {
        socket.send('help');
    }

    areThereNeighbor(row:number, col:number) {
        if(this.state.map !== undefined) {
            if(this.state.map[row] !== undefined) {
                return {x:col, y: row, value: this.state.map[row][col]};
            }
            return undefined
        }
    }

    makePrediction( row:number, col:number, value:number) {
        let cellsCounter:number = 0;
        let neighborsArray = [];
        let result:number | string;

        // list of poteintial cells around
        let coordinatesToCheck = [
            {x:col - 1,y:row - 1},
            {x:col,y:row - 1},
            {x:col + 1,y:row - 1},
            {x:col - 1,y:row},
            {x:col + 1,y:row},
            {x:col - 1,y:row + 1},
            {x:col,y:row + 1},
            {x:col + 1,y:row + 1},
        ];
        type neighbor = {x:number, y:number, value:string};

        if(this.state.map !== undefined) {
            for(let i = 0; i < coordinatesToCheck.length; i ++) {
                // go through list and check if cell exist on the map
                let neighbor:neighbor | undefined = this.areThereNeighbor(coordinatesToCheck[i]['y'], coordinatesToCheck[i]['x']);

                // if this neighbor exist on the map
                if( (neighbor !== undefined) && (neighbor.value === '□')) {
                    // count and save empty cells around current number
                    neighborsArray.push(neighbor);
                    cellsCounter++;
                }
            }

            // if cellsCounter === value - set mine
            // how should we think if there is a mine?
            // check avaliable options
            // try to detect 100% mines and save them to the list
            // exlude mines from avaliable options
            // check 100% prediction when it is 100% not a mine
            // chose option with smallest prediction level and smallest counter


            // save prediction level for accessible neighbors
            for(let i = 0; i < neighborsArray.length; i ++) {
                let x = neighborsArray[i]['x'];
                let y = neighborsArray[i]['y'];

                let coordinates = `x${x}y${y}`;

                // make prediction to all near empty cells
                let prediction:number = Math.floor( (Math.floor(value) / cellsCounter) * 100);

                // save prediction of current cell
                this.setState(prevState => {
                    let newValue:number ;
                    let counter:number ;

                    // if this coordinates are exist
                    if(prevState.suspiciousnessLevel[coordinates] !== undefined) {
                        newValue = (Math.floor(prevState.suspiciousnessLevel[coordinates]['value']) + prediction)/2;
                        counter = Math.floor(prevState.suspiciousnessLevel[coordinates]['counter'] + 1);
                    } else {
                        newValue = prediction;
                        counter = 1;
                    }

                    // console.log(coordinates);
                    // console.log(prevState.suspiciousnessLevel[coordinates]);

                    let newState = {
                        ...prevState, suspiciousnessLevel: {
                            ...prevState.suspiciousnessLevel, [coordinates]: {value:newValue,counter}
                        }
                    }

                    return newState;
                })
            }
        }
    }

    componentDidMount() {
        this.state.socket.onopen = () => {};

        document.addEventListener('keydown', (e) => {
            // tab key
            if(e.keyCode === 9) {
                e.preventDefault();
                this.setState(prevState => ({
                    hintsAreHidden: !prevState.hintsAreHidden
                }));
            }
        });

        this.state.socket.onmessage = (e:MessageEvent)  => {
            // each time as we got message we save the data
            let {map, operationStatus, cols, rows} = this.parseData(e);

            console.log(e);

            // debugger;
            this.setState({
                map: map,
                operationStatus: operationStatus,
                cols: cols,
                rows: rows,
                suspiciousnessLevel: {}
            });


            if(this.state.map !== undefined) {
                for(let r = 0; r < this.state.map.length; r++) {
                    for(let c = 0; c < this.state.map[r].length; c++) {
                        let item = this.state.map[r][c];
                        // if this is a number with value > 0
                        if(item !== '□' && ( parseInt(item, 10 ) > 0 ) ) {
                            this.makePrediction(r, c, parseInt(item, 10 ) );
                        }
                    }
                }
            }

            switch (operationStatus) {
                case 'new: OK':
                    // debugger;
                    this.setState({title:'Lets Rock'});
                    this.state.socket.send('map');
                    break;

                case 'map:':
                    break;

                case 'help:':
                    break;

                case 'open: You lose':
                    this.setState({title:'You lose'});
                    break;

                case 'open: You win':
                    this.setState({title:'You Win'});
                    break;

                case 'open: Out of bounds':
                    break;

                case 'open: OK':
                    this.state.socket.send('map');
                    // debugger;
                    // this.state.socket.send('map');
                    // socket.send('map');
                    break;

                default:
                    console.log(operationStatus);
                    break;
            }
        };
    }


    render() {

        let hintsVisibility = (this.state.hintsAreHidden) ? 'map--hints-are-visible': '';

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
                        { (this.state.map !== undefined) ?
                            <Map suspiciousnessLevel={this.state.suspiciousnessLevel}
                                 map={this.state.map}
                                 socket={this.state.socket}
                            /> : ''}
                    </ul>
                </div>
            </div>
        );
    }
}

export default App;
