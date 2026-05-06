const fs = require('fs');
let code = fs.readFileSync('src/components/Controls/ActionBar/Actions.svelte', 'utf8');

const svelteScript = `<script>
        import { candidates } from '@sudoku/stores/candidates';
        import { grid, userGrid, canUndo, canRedo, isExploring } from '@sudoku/stores/grid';
        import { undoMove, redoMove } from '@sudoku/game';
        import { cursor } from '@sudoku/stores/cursor';
        import { hints } from '@sudoku/stores/hints';
        import { notes } from '@sudoku/stores/notes';
        import { settings } from '@sudoku/stores/settings';
        import { keyboardDisabled } from '@sudoku/stores/keyboard';
        import { gamePaused } from '@sudoku/stores/game';

        $: hintsAvailable = $hints > 0;

        function handleHint() {
                if (hintsAvailable) {
                        const success = grid.getHint();
                        if (success === false) {
                                alert('单步推理无法继续，请开启探索模式 (Explore)。');
                        }
                }
        }

        function showCandidates() {
                const cands = grid.getCandidates($cursor);
                if (cands && cands.length > 0) {
                        candidates.clear($cursor);
                        for (let c of cands) {
                                candidates.add($cursor, c);
                        }
                }
        }

        function handleExploreStart() {
                grid.startExplore();
        }

        function handleExploreCommit() {
                grid.commitExplore();
        }

        function handleExploreRollback() {
                grid.rollbackExplore();
                alert('回滚成功，已将失败路径加入死胡同记忆库。');
        }
</script>

<div class="action-buttons space-x-3 mb-2">

        <button class="btn btn-round" disabled={$gamePaused || !$canUndo} on:click={undoMove} title="Undo">
                <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
        </button>

        <button class="btn btn-round" disabled={$gamePaused || !$canRedo} on:click={redoMove} title="Redo">
                <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
        </button>

        <button class="btn btn-round btn-badge" disabled={$keyboardDisabled || $userGrid[$cursor.y][$cursor.x] !== 0} on:click={showCandidates} title="Show Candidates">
                <!-- 灯泡1 -->
                <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
        </button>

        <button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable} on:click={handleHint} title="Next Step Hint">
                <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {#if $settings.hintsLimited}
                        <span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
                {/if}
        </button>

</div>

<div class="action-buttons space-x-3 mt-2">
        {#if $isExploring === false}
                <button class="btn font-bold px-4 py-2 rounded shadow bg-purple-600 text-white w-full" disabled={$gamePaused} on:click={handleExploreStart}>
                        进入探索模式 (Explore)
                </button>
        {:else}
                <button class="btn font-bold px-3 py-1 rounded shadow bg-green-600 text-white" on:click={handleExploreCommit}>
                        提交探索
                </button>
                <button class="btn font-bold px-3 py-1 rounded shadow bg-red-600 text-white" on:click={handleExploreRollback}>
                        放弃并回溯
                </button>
        {/if}
</div>

<style>`;

code = code.replace(/<script>[\s\S]*?<style>/, svelteScript);
fs.writeFileSync('src/components/Controls/ActionBar/Actions.svelte', code);
console.log('patched');
