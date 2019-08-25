import _ from 'lodash';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y } from './constants';

import { chunks } from './interfaces/interfaces';

export function round( value: number|string, exp: number) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        // @ts-ignore
        return Math.round(value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    // @ts-ignore
    value = value.toString().split('e');
    // @ts-ignore
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    // @ts-ignore
    value = value.toString().split('e');
    // @ts-ignore
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}


export function convertToAbsolute(value: number, chunkMultiplier: number, size: number) {
    return value + ( chunkMultiplier * size );
}

export function getTheAbsoluteStuff(x: number, y: number, xChunkNumber: number, yChunkNumber: number) {
    let a_x = convertToAbsolute( x, xChunkNumber, CHUNK_SIZE_X );
    let a_y = convertToAbsolute( y, yChunkNumber, CHUNK_SIZE_Y );
    let absCoordinates = `x${a_x}y${a_y}`;

    return { a_x, a_y, absCoordinates }
}


export function generateChunkName(r: number, c: number) {
    return `chunk_r${r}_c${c}`
}

export function generateChunks(map: string[]):chunks {
    let mapRows = _.chunk(map, CHUNK_SIZE_Y); // 2
    // this.setState({amountOfChunkRows: mapRows.length});
    let saveChunks: chunks = {};

    for (let mr = 0; mr < mapRows.length;  mr++) {
        for (let r = 0; r < mapRows[mr].length;  r++) {
            let row =  mapRows[mr][r];
            let incrementator = 0;


            for (let col = 0; col < row.length; col = col + CHUNK_SIZE_X) {
                // let chunkName = generateChunkName(mr, col);
                let newPart = row.slice( col, col + CHUNK_SIZE_X );
                // console.log(_.isEmpty(saveChunks[`c_${incrementator}`]));
                // saveChunks[`c_${incrementator}`] = _.isEmpty( saveChunks[`c_${incrementator}`] ) ? saveChunks[`c_${incrementator}`].push(newPart) : saveChunks[`c_${incrementator}`].concat( newPart );

                if( _.isEmpty( saveChunks[`row_${mr}`] ) ) {
                    saveChunks[`row_${mr}`] = {};
                }

                if( _.isEmpty( saveChunks[`row_${mr}`][`col_${incrementator}`] ) ) {
                    saveChunks[`row_${mr}`][`col_${incrementator}`] = { map: [],suspiciousnessLevel: {} };
                }

                saveChunks[`row_${mr}`][`col_${incrementator}`].map.push(newPart);
                incrementator++;
            }
        }
    }

    return saveChunks;
}

export function hasNumber(myString: string) {
    return /^(?=.*\d)(?=.*[1-9]).{1,10}$/.test(myString);
}


export function parseData(e: MessageEvent) {
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

export function removeProp(name: string, objectArg: { [key: string]: { x: number, y: number } } ) {
    const { [name]: val, ...remaning } = objectArg;
    return remaning;
}

export function extractNumberFromString(keyToFind: string): number {
    // @ts-ignore
    return keyToFind.match(/\d+/g).map(Number)[0];
}