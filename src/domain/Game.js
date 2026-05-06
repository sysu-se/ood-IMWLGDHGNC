import { assert, validateMove, validateMoveList } from './common.js';
import { Sudoku, createSudokuFromJSON } from './Sudoku.js';

export class Game {
    /**
     * @param {Sudoku} sudoku
     */
    constructor(sudoku) {
        assert(sudoku instanceof Sudoku, 'sudoku must be a Sudoku instance');
        this.sudoku = sudoku.clone();
        this.history = [];
        this.redoList = [];
        this.exploreSnapshots = [];
        this.failedExplorePaths = new Set();
    }

    getSudoku() {
        return this.sudoku.clone();
    }

    /**
     * Apply one user move and push inverse information for undo.
     * @param {{row: number, col: number, value: number}} move
     */
    guess(move) {
        validateMove(move);

        const previousValue = this.sudoku.getCell(move.row, move.col);
        this.sudoku.guess(move);

        this.history.push({
            row: move.row,
            col: move.col,
            value: move.value,
            previousValue,
        });
        this.redoList = [];
    }

    undo() {
        if (!this.canUndo()) return;

        const lastMove = this.history.pop();
        this.sudoku.guess({
            row: lastMove.row,
            col: lastMove.col,
            value: lastMove.previousValue,
        });
        this.redoList.push(lastMove);
    }

    redo() {
        if (!this.canRedo()) return;

        const nextMove = this.redoList.pop();
        this.sudoku.guess({
            row: nextMove.row,
            col: nextMove.col,
            value: nextMove.value,
        });
        this.history.push(nextMove);
    }

    canUndo() {
        return this.history.length > 0;
    }

    canRedo() {
        return this.redoList.length > 0;
    }

    /**
     * 第一种提示：获取指定格子的所有候选数
     * @param {number} row
     * @param {number} col
     * @returns {number[]} 候选数数组
     */
    getCandidates(row, col) {
        return this.sudoku.getCandidates(row, col);
    }

    /**
     * 第二种提示：获取下一步能确定的格子（即有唯一合法解的推断格）
     * 返回的值可以直接通过 Game.guess() 执行
     * @returns {{row: number, col: number, value: number} | null}
     */
    getHint() {
        return this.sudoku.getHint();
    }

    /**
     * 进入探索模式，保存当前状态的快照，允许用户去尝试数字。
     */
    startExplore() {
        this.exploreSnapshots.push({
            sudoku: this.sudoku.clone(),
            historyLength: this.history.length,
            redoLength: this.redoList.length,
        });
    }

    /**
     * 提交探索结果：确认当前探索是正确的，将其接轨到主线状态，结束一层探索。
     */
    commitExplore() {
        assert(this.isExploring(), '当前并未处于探索模式');
        this.exploreSnapshots.pop();
    }

    /**
     * 放弃探索：当前分支发生冲突走不通了，回退到进入探索前的状态。
     * 同时会将导致回滚的当前错误状态记录到记忆中，防止再次走错。
     */
    rollbackExplore() {
        assert(this.isExploring(), '当前并未处于探索模式');
        
        // 记忆当前错误的棋盘终局形态
        const failedState = this.sudoku.toString();
        this.failedExplorePaths.add(failedState);

        const snapshot = this.exploreSnapshots.pop();
        
        // 恢复对象快照和局部历史栈
        this.sudoku = snapshot.sudoku;
        this.history = this.history.slice(0, snapshot.historyLength);
        this.redoList = this.redoList.slice(0, snapshot.redoLength);
    }

    /**
     * 判断当前是否处于探索模式（判断堆栈深度判断嵌套）
     */
    isExploring() {
        return this.exploreSnapshots.length > 0;
    }

    /**
     * 检查当前棋盘的状态是否是之前已经探索过且失败的路径
     */
    isFailedExplorePath() {
        return this.failedExplorePaths.has(this.sudoku.toString());
    }

    toJSON() {
        return {
            sudoku: this.sudoku.toJSON(),
            history: this.history.map((item) => ({ ...item })),
            redoList: this.redoList.map((item) => ({ ...item })),
            exploreSnapshots: this.exploreSnapshots.map((item) => ({
                sudoku: item.sudoku.toJSON(),
                historyLength: item.historyLength,
                redoLength: item.redoLength,
            })),
            failedExplorePaths: Array.from(this.failedExplorePaths),
        };
    }
}

export function createGame({ sudoku }) {
    return new Game(sudoku);
}

export function createGameFromJSON(json) {
    assert(json && typeof json === 'object', 'game JSON must be an object');
    assert(json.sudoku, 'game JSON must contain sudoku');
    validateMoveList(json.history, 'history');
    validateMoveList(json.redoList, 'redoList');

    const game = new Game(createSudokuFromJSON(json.sudoku));
    game.history = json.history.map((item) => ({ ...item }));
    game.redoList = json.redoList.map((item) => ({ ...item }));
    
    if (json.exploreSnapshots) {
        game.exploreSnapshots = json.exploreSnapshots.map((item) => ({
            sudoku: createSudokuFromJSON(item.sudoku),
            historyLength: item.historyLength,
            redoLength: item.redoLength,
        }));
    }
    if (json.failedExplorePaths) {
        game.failedExplorePaths = new Set(json.failedExplorePaths);
    }
    
    return game;
}
