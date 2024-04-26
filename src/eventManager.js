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
function rowsEqual(a, b) {
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

/**
 * Optimizes with L-blocks assuming that the header is half-and-half
 * @param {boolean[][]} matrix 
 * @param {number} day 
 * @param {number} headerIndex 
 * @returns {Block[] | null}
 */
export function halfLBlockOptimizer(matrix, day, headerIndex) {
    if(headerIndex > matrix.length - 3) return null;
    // Verify that the header is half-and-half
    const headerData = matrix[headerIndex];
    const width = headerData.length;
    const leftColor = headerData[0];
    const rightColor = headerData[width - 1];
    const isLeftUniform = headerData.slice(0, width / 2).every(tile => tile === leftColor);
    const isRightUniform = headerData.slice(width / 2, width).every(tile => tile === rightColor);
    if (!isLeftUniform || !isRightUniform || width % 2 === 1) return null;

    // Check that the header is 3 equal rows
    if (
        !rowsEqual(headerData, matrix[headerIndex + 1]) ||
        !rowsEqual(headerData, matrix[headerIndex + 2])
    ) return null;

    // Calculate max extent of consistent left side
    let extent = headerIndex;
    while (extent < matrix.length) {
        const leftSideData = matrix[extent].slice(0, width / 2);
        if (leftSideData.some(tile => tile !== leftColor)) break;
        extent++;
    }

    // Calculate the default efficiency
    const unOptimizedSize = buildCalendarColumn(matrix.slice(headerIndex, extent), 0).length;

    // Render the right-side sub-section
    const subBlock = matrix.slice(headerIndex + 3, extent).map(row => row.slice(width / 2));
    const childRender = buildCalendarColumn(subBlock, day);
    const childRenderWidth = Math.max(...childRender.map(block => block.order)) + 1;
    const childRenderShifted = childRender.map(block => new Block(
        block.start + headerIndex + 3,
        block.end + headerIndex + 3,
        block.order + childRenderWidth + 2,
        block.color,
        block.day,
    ));

    // Build the final output
    const output = [];
    for (let i = 0; i < childRenderWidth + 1; i++) {
        output.push(new Block(headerIndex, extent, i, leftColor, day));
    }
    output.push(new Block(headerIndex, extent, childRenderWidth + 1, rightColor, day));
    output.push(...childRenderShifted);

    if (output.length < unOptimizedSize) return output;
    else return null;
}

/**
 * @param {boolean[][]} matrix 
 * @returns {Block[]}
 * NOTE: `Block.column` is set to `0` for all blocks and start/end times are just integers starting at `0`
 */
export function buildCalendarColumnLOptimized(matrix, day) {
    const output = [];

    let vBlockData = [];
    let vBlockStart = 0;
    let vBlockEnd = 0;
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
        vBlockEnd = rowIndex;
        const row = matrix[rowIndex];
        let newRow = optimizeRow(row);
        // Ignore if equal
        if (!rowsEqual(vBlockData, newRow)) {
            // console.log(`Adding new row ${newRow}`)
            // Push old block
            vBlockData.forEach((color, order) => {
                output.push(new Block(vBlockStart, vBlockEnd, order, color, day));
            });
            // Check if next section can be used as a suboordinate block
            let optimizedSegment = halfLBlockOptimizer(matrix, day, rowIndex);
            if (optimizedSegment) {
                const lastIndex = Math.max(...optimizedSegment.map(block => block.end));
                output.push(...optimizedSegment);
                rowIndex = lastIndex - 1;
                // Reset the vBlock
                vBlockData = [];
            } else {
                // Initialize a new block
                vBlockStart = rowIndex;
                vBlockData = newRow.map(x => x);
            }
        }
    }
    vBlockEnd = matrix.length;
    // Push the final block
    vBlockData.forEach((color, order) => {
        output.push(new Block(vBlockStart, vBlockEnd, order, color, day));
    })
    return output;
}
