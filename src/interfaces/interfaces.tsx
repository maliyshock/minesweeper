export interface chunks {
    [row: string]: {
        [col: string]: {
            map: string[],
            suspiciousnessLevel: {
                [coordinates: string]: { x: number, y: number, value: number, counter: number }
            }
        }
    }
}

export interface neighbor {
    x: number,
    y: number,
    value: string,
    chunk: chunk
}

export interface chunk {
    rowName: string,
    colName: string
}