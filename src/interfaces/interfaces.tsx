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
    endOfMapIsReached: boolean,

    currentChunkIs: string[],
    chunks: chunks,

    playing: boolean,

    decisionMade: boolean,

    mines: { [key: string]: { x: number, y: number } },
    safe: { [key: string]: { x: number, y: number } },

    operationStatus: string | undefined,
    hintsAreHidden: boolean,
    title: string,

    level: number,
    lose: number,
    win: number,
    winRate: number | undefined
};