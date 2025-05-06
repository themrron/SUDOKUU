document.addEventListener("DOMContentLoaded", () => {
  let board = [];
  let solutionBoard = [];
  let selectedCell = null;
  let startTime = null;
  let timerInterval = null;

  const boardElement = document.getElementById("sudoku-board");
  const newGameBtn = document.getElementById("newGameBtn");
  const checkBtn = document.getElementById("checkBtn");
  const difficultySlider = document.getElementById("difficultySlider");
  const timerDisplay = document.getElementById("timer");

  function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      let elapsed = Date.now() - startTime;
      let seconds = Math.floor(elapsed / 1000);
      let minutes = Math.floor(seconds / 60);
      seconds = seconds % 60;
      timerDisplay.textContent = `Time: ${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function generateSolvedBoard() {
    let board = Array.from({ length: 9 }, () => Array(9).fill(0));
    function isValid(board, row, col, num) {
      for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) return false;
      }
      let startRow = Math.floor(row / 3) * 3;
      let startCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[startRow + i][startCol + j] === num) return false;
        }
      }
      return true;
    }

    function solve(board) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (let num of numbers) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                if (solve(board)) return true;
                board[row][col] = 0;
              }
            }
            return false;
          }
        }
      }
      return true;
    }

    solve(board);
    return board;
  }

  function shuffleArray(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function hasUniqueSolution(puzzle) {
    let testPuzzle = puzzle.map(row => row.slice());
    return countSolutions(testPuzzle) === 1;
  }

  function countSolutions(board) {
    function solve(board, solutions = { count: 0 }) {
      if (solutions.count > 1) return;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            let numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (let num of numbers) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                solve(board, solutions);
                board[row][col] = 0;
              }
            }
            return;
          }
        }
      }
      solutions.count++;
    }
    let solutions = { count: 0 };
    solve(board, solutions);
    return solutions.count;
  }

  function createPuzzle(solvedBoard, empties = 40) {
    let puzzle = solvedBoard.map(row => row.slice());
    let count = 0;
    while (count < empties) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);
      let backup = puzzle[row][col];
      puzzle[row][col] = 0;

      if (!hasUniqueSolution(puzzle)) {
        puzzle[row][col] = backup;
      } else {
        count++;
      }
    }
    return puzzle;
  }

  function renderBoard(puzzle) {
    boardElement.innerHTML = "";
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.textContent = puzzle[row][col] !== 0 ? puzzle[row][col] : "";
        if (puzzle[row][col] !== 0) {
          cell.classList.add("prefilled");
        } else {
          cell.addEventListener("click", function() {
            highlightMatchingNumbers(cell.textContent);
          });
        }
        boardElement.appendChild(cell);
      }
    }
  }

  function highlightMatchingNumbers(number) {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
      if (cell.textContent === number && number !== "") {
        cell.classList.add("highlight");
      } else {
        cell.classList.remove("highlight");
      }
    });
  }

  function newGame() {
    stopTimer();
    startTimer();
    const empties = parseInt(difficultySlider.value);
    const solved = generateSolvedBoard();
    solutionBoard = solved;
    board = createPuzzle(solved, empties);
    renderBoard(board);
  }

  newGameBtn.addEventListener("click", newGame);
  checkBtn.addEventListener("click", checkSolution);
});
