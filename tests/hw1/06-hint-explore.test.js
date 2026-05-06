import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/domain/Game.js';
import { createSudoku } from '../../src/domain/Sudoku.js';

describe('Homework 2: Hint and Explore Features', () => {
    it('should correctly calculate candidates for a cell', () => {
        const grid = [
            [1, 2, 3, 4, 5, 6, 7, 8, 0],
            [4, 5, 6, 7, 8, 9, 1, 2, 3],
            [7, 8, 9, 1, 2, 3, 4, 5, 6],
            [2, 1, 4, 3, 6, 5, 8, 9, 7],
            [3, 6, 5, 8, 9, 7, 2, 1, 4],
            [8, 9, 7, 2, 1, 4, 3, 6, 5],
            [5, 3, 1, 6, 4, 2, 9, 7, 8],
            [6, 4, 2, 9, 7, 8, 5, 3, 1],
            [9, 7, 8, 5, 3, 1, 6, 4, 2]
        ];
        const sudoku = createSudoku(grid);
        const game = createGame({ sudoku });

        // The only missing number in the first row is 9.
        const cands = game.getCandidates(0, 8);
        expect(cands).toEqual([9]);
    });

    it('should provide the next deterministic hint if available', () => {
        // Create an almost solved board
        const grid = [
            [1, 2, 3, 4, 5, 6, 7, 8, 0], // missing 9
            [4, 5, 6, 7, 8, 9, 1, 2, 3],
            [7, 8, 9, 1, 2, 3, 4, 5, 6],
            [2, 1, 4, 3, 6, 5, 8, 9, 7],
            [3, 6, 5, 8, 9, 7, 2, 1, 4],
            [8, 9, 7, 2, 1, 4, 3, 6, 5],
            [5, 3, 1, 6, 4, 2, 9, 7, 8],
            [6, 4, 2, 9, 7, 8, 5, 3, 1],
            [9, 7, 8, 5, 3, 1, 6, 4, 2]
        ];
        const sudoku = createSudoku(grid);
        const game = createGame({ sudoku });

        const hint = game.getHint();
        expect(hint).not.toBeNull();
        expect(hint.row).toBe(0);
        expect(hint.col).toBe(8);
        expect(hint.value).toBe(9);
    });

    it('should isolate undo/redo history during explore mode', () => {
        const grid = Array(9).fill(0).map(() => Array(9).fill(0));
        const sudoku = createSudoku(grid);
        const game = createGame({ sudoku });

        // Main branch guess
        game.guess({ row: 0, col: 0, value: 5 });
        expect(game.getSudoku().getCell(0, 0)).toBe(5);

        // Start explore
        game.startExplore();
        expect(game.isExploring()).toBe(true);

        // Explore branch guess
        game.guess({ row: 0, col: 1, value: 6 });
        expect(game.getSudoku().getCell(0, 1)).toBe(6);

        // Undo explore guess
        expect(game.canUndo()).toBe(true);
        game.undo();
        expect(game.getSudoku().getCell(0, 1)).toBe(0);

        // Now, we are at the root of the explore branch. 
        // Undo should be blocked! (Independent history)
        expect(game.canUndo()).toBe(false);
        // The main branch move is still intact
        expect(game.getSudoku().getCell(0, 0)).toBe(5);

        // Redo explore guess
        expect(game.canRedo()).toBe(true);
        game.redo();
        expect(game.getSudoku().getCell(0, 1)).toBe(6);

        // Rollback explore
        game.rollbackExplore();
        expect(game.isExploring()).toBe(false);
        expect(game.getSudoku().getCell(0, 1)).toBe(0);

        // Being back to main branch, we can undo the main branch move
        expect(game.canUndo()).toBe(true);
        game.undo();
        expect(game.getSudoku().getCell(0, 0)).toBe(0);
    });

    it('should remember failed explore state and prevent rollback tracking', () => {
        const grid = Array(9).fill(0).map(() => Array(9).fill(0));
        const sudoku = createSudoku(grid);
        const game = createGame({ sudoku });

        game.startExplore();
        game.guess({ row: 1, col: 1, value: 9 });
        expect(game.isFailedExplorePath()).toBe(false);
        
        game.rollbackExplore(); // Records failed state

        // Replicate the failed state
        game.guess({ row: 1, col: 1, value: 9 });
        // The game should recognize this state as a previously failed explore path
        expect(game.isFailedExplorePath()).toBe(true);
    });

    it('should merge explore history to main branch when commitExplore is called', () => {
        const grid = Array(9).fill(0).map(() => Array(9).fill(0));
        const sudoku = createSudoku(grid);
        const game = createGame({ sudoku });

        game.guess({ row: 0, col: 0, value: 1 });
        game.startExplore();
        game.guess({ row: 0, col: 1, value: 2 });
        game.commitExplore();

        // 2 guesses merged into single history list
        expect(game.isExploring()).toBe(false);
        expect(game.getSudoku().getCell(0, 1)).toBe(2);

        // Can undo both moves seamlessly
        game.undo();
        expect(game.getSudoku().getCell(0, 1)).toBe(0);
        game.undo();
        expect(game.getSudoku().getCell(0, 0)).toBe(0);
    });
});
