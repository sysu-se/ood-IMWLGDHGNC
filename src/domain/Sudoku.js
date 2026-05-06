import {
    BOARD_SIZE,
    BOX_SIZE,
    EMPTY,
    assert,
    deepCopyGrid,
    validateFixedMask,
    validateGrid,
    validateMove,
} from './common.js';

export class Sudoku {
    /**
     * @param {number[][]} grid 9x9 matrix where 0 means empty.
     * @param {{fixed?: boolean[][]}} [options] optional fixed-cell mask.
     */
    constructor(grid, options = {}) {
        validateGrid(grid, 'grid');

        const fixedMask = options.fixed ?? grid.map((row) => row.map((cell) => cell !== EMPTY));
        validateFixedMask(fixedMask, 'fixed');

        this.grid = deepCopyGrid(grid);
        this.fixed = fixedMask.map((row) => [...row]);

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                if (this.grid[row][col] !== EMPTY) {
                    const val = this.grid[row][col];
                    this.grid[row][col] = EMPTY;
                    const isValid = this.isValueAllowed(row, col, val);
                    this.grid[row][col] = val;
                    assert(isValid, `initial grid contains conflicts at (${row}, ${col})`);
                }
            }
        }
    }

    /** @returns {number[][]} deep-copied 9x9 board snapshot. */
    getGrid() {
        return deepCopyGrid(this.grid);
    }

    /**
     * Returns the value at a specific cell.
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    getCell(row, col) {
        assert(Number.isInteger(row), 'row must be an integer');
        assert(row >= 0 && row < BOARD_SIZE, 'row must be in [0, 8]');
        assert(Number.isInteger(col), 'col must be an integer');
        assert(col >= 0 && col < BOARD_SIZE, 'col must be in [0, 8]');
        return this.grid[row][col];
    }

    /**
     * Apply one move with Sudoku validation.
     * - value = 0 means clear a non-fixed cell.
     * - non-zero value must satisfy row/column/box constraints.
     * @param {{row: number, col: number, value: number}} move
     */
    guess(move) {
        validateMove(move);

        const { row, col, value } = move;
        assert(!this.fixed[row][col], `cell (${row}, ${col}) is fixed and cannot be modified`);

        const previousValue = this.grid[row][col];
        
        if (value !== EMPTY) {
            this.grid[row][col] = EMPTY;
            const isValid = this.isValueAllowed(row, col, value);
            this.grid[row][col] = previousValue;
            assert(isValid, `move violates Sudoku rule at (${row}, ${col})`);
        }

        this.grid[row][col] = value;
        return previousValue;
    }

    clone() {
        return new Sudoku(this.grid, { fixed: this.fixed });
    }

    /**
     * Serialize into plain data with deep copies.
     * Keeping fixed mask makes deserialization deterministic.
     */
    toJSON() {
        return {
            grid: deepCopyGrid(this.grid),
            fixed: this.fixed.map((row) => [...row]),
        };
    }

    toString() {
        return this.grid.map((row) => row.join(' ')).join('\n');
    }

    isWon() {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                if (this.grid[row][col] === EMPTY) {
                    return false;
                }
            }
        }
        return this.getInvalidCells().length === 0;
    }

    getInvalidCells() {
        const invalid = [];
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                const value = this.grid[row][col];
                if (value !== EMPTY) {
                    this.grid[row][col] = EMPTY;
                    if (!this.isValueAllowed(row, col, value)) {
                        invalid.push({ row, col });
                    }
                    this.grid[row][col] = value;
                }
            }
        }
        return invalid;
    }

    /**
     * 获取指定格子的所有合法候选数
     * @param {number} row
     * @param {number} col
     * @returns {number[]} 候选数数组，例如 [1, 3, 5]
     */
    getCandidates(row, col) {
        if (this.grid[row][col] !== EMPTY) {
            return []; // 已经填了数字的格子没有候选数
        }
        
        const candidates = [];
        for (let val = 1; val <= BOARD_SIZE; val += 1) {
            if (this.isValueAllowed(row, col, val)) {
                candidates.push(val);
            }
        }
        return candidates;
    }

    /**
     * 寻找能进行“下一步提示”的格子（即只有唯一候选数的空白格）
     * @returns {{row: number, col: number, value: number} | null} 返回可以确定的格子及其值，如果没有则返回 null
     */


    getHint() {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                if (this.grid[row][col] === EMPTY) {
                    const candidates = this.getCandidates(row, col);
                    if (candidates.length === 1) {
                        return { row, col, value: candidates[0] };
                    }
                }
            }
        }
        return null;
    }

    isValueAllowed(targetRow, targetCol, value) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (this.grid[targetRow][col] === value) {
                return false;
            }
        }

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            if (this.grid[row][targetCol] === value) {
                return false;
            }
        }

        const boxRowStart = Math.floor(targetRow / BOX_SIZE) * BOX_SIZE;
        const boxColStart = Math.floor(targetCol / BOX_SIZE) * BOX_SIZE;

        for (let row = boxRowStart; row < boxRowStart + BOX_SIZE; row += 1) {
            for (let col = boxColStart; col < boxColStart + BOX_SIZE; col += 1) {
                if (this.grid[row][col] === value) {
                    return false;
                }
            }
        }

        return true;
    }
}

export function createSudoku(input) {
    return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
    assert(json && typeof json === 'object', 'sudoku JSON must be an object');
    return new Sudoku(json.grid, { fixed: json.fixed });
}
