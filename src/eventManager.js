import { Block } from './block.js'
/**
 * optimizes a row!
 * @param {number[]} rawRow 
 * @returns {boolean[]}
 */
function optimizeRow(rawRow) {
    const rowWidth = rawRow.length;
    const outRow = [];
    // console.log(rawRow);
    for (let colCountOptimized = 1; colCountOptimized <= rowWidth; colCountOptimized++) {
        // console.log(`Trying row size of ${colCountOptimized}`)
        if ((rowWidth % colCountOptimized) !== 0)
            continue;
        const stride = rowWidth / colCountOptimized;
        let fails = 0;
        outRow.splice(0);
        // i is the horizontal order within the optimized row
        for (let i = 0; i < colCountOptimized; i++) {
            const group = rawRow.slice(i * stride, i * stride + stride);
            const groupColor = (group.filter(x => x).length / group.length) > 0.5 ? true : false;
            group.forEach(pixColor => {
                if ((!!pixColor) !== groupColor) fails++;
            });
            outRow.push(groupColor);
        }
        if (fails <= MAX_FLIPS) {
            break;
        }
    }
    return outRow;
}

/**
 * @param {boolean[]} a 
 * @param {boolean[]} b 
 * @returns {boolean}
 */
function rowsEqual(a, b){
    return a.length === b.length && a.every((a_i, i) => b[i] === a_i)
}

const MAX_FLIPS = 0;

/**
 * @param {boolean[][]} matrix 
 * @returns {Block[]}
 * NOTE: `Block.column` is set to `0` for all blocks and start/end times are just integers starting at `0`
 */
export function buildCalendarColumn(matrix, day) {

    const output = [];

    let vBlockData = [];
    let vBlockStart = 0;
    let vBlockEnd = 0;
    matrix.forEach(row => {
        const newRow = optimizeRow(row);
        // Ignore if equal
        if (!rowsEqual(vBlockData, newRow)) {
            // console.log(`Adding new row ${newRow}`)
            // Push old block
            vBlockData.forEach((color, order) => {
                output.push(new Block(vBlockStart, vBlockEnd, order, color, day));
            })
            // Initialize a new block
            vBlockStart = vBlockEnd;
            vBlockData = newRow.map(x => x);
        }
        vBlockEnd++;
    })
    // Push the final block
    vBlockData.forEach((color, order) => {
        output.push(new Block(vBlockStart, vBlockEnd, order, color, day));
    })
    return output;
}
