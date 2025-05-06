document.addEventListener("DOMContentLoaded", () => {
  // Global state variables
  let board = [];
  let solutionBoard = [];
  let selectedCell = null;
  let notesMode = false;
  let startTime = null;
  let timerInterval = null;

  // Get DOM elements
  const boardElement = document.getElementById("sudoku-board");
  const newGameBtn = document.getElementById("newGameBtn");
  const checkBtn = document.getElementById("checkBtn");
  const hintBtn = document.getElementById("hintBtn");
  const notesToggleBtn = document.getElementById("notesToggleBtn");
  const difficultySlider = document.getElementById("difficultySlider");
  const difficultyValue = document.getElementById("difficultyValue");
  const timerDisplay = document.getElementById("timer");

  // Update difficulty display with slider value
  difficultySlider.addEventListener("input", () => {
    difficultyValue.textContent = difficultySlider.value;
  });

  // Timer functions
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

  // Sudoku board generation using backtracking
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

  // Fisher-Yates shuffle helper
  function shuffleArray(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Create a puzzle by removing numbers from the solved board
  function createPuzzle(solvedBoard, empties = 40) {
    let puzzle = solvedBoard.map(row => row.slice());
    let count = 0;
    while (count < empties) {
      let row = Math.floor(Math.random() * 9);
      let col = Math.floor(Math.random() * 9);
      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0;
        count++;
      }
    }
    return puzzle;
  }

  // Render the whole board
  function renderBoard(puzzle, solution) {
    boardElement.innerHTML = "";
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = row;
        cell.dataset.col = col;
        // Initialize pencil notes storage
        cell.notes = [];

        // Create a div for the final value
        const valueDiv = document.createElement("div");
        valueDiv.classList.add("value");
        cell.appendChild(valueDiv);

        // Create a div for pencil notes
        const notesDiv = document.createElement("div");
        notesDiv.classList.add("notes");
        cell.appendChild(notesDiv);

        // Apply thicker borders to delineate 3x3 subgrids
        if ((row + 1) % 3 === 0 && row !== 8) {
          cell.style.borderBottom = "2px solid black";
        }
        if ((col + 1) % 3 === 0 && col !== 8) {
          cell.style.borderRight = "2px solid black";
        }

        // If the puzzle has a given number, mark as prefilled
        if (puzzle[row][col] !== 0) {
          valueDiv.textContent = puzzle[row][col];
          cell.classList.add("prefilled");
        } else {
          // Otherwise, allow cell selection for editing
          cell.addEventListener("click", function() {
            if (selectedCell) selectedCell.classList.remove("selected");
            selectedCell = cell;
            cell.classList.add("selected");
          });
        }
        boardElement.appendChild(cell);
      }
    }
  }

  // Update the display of a cell (final answer and/or pencil notes)
  function updateCellDisplay(cell, digit) {
    const valueDiv = cell.querySelector(".value");
    const notesDiv = cell.querySelector(".notes");
    // When a final answer is set (nonempty digit)
    if (digit !== undefined && digit !== null && digit !== "") {
      valueDiv.textContent = digit;
      // Clear any pencil notes if a final answer is provided
      cell.notes = [];
      notesDiv.textContent = "";
    } else {
      // Otherwise, clear the final answer and render pencil notes (if any)
      valueDiv.textContent = "";
      notesDiv.textContent = cell.notes.sort().join(" ");
    }
  }

  // Global keyboard handler for input into a selected cell
  document.addEventListener("keydown", function(e) {
    if (!selectedCell) return;
    if (selectedCell.classList.contains("prefilled") || selectedCell.classList.contains("hint"))
      return;
    let key = e.key;
    // If a digit key is pressed
    if (/^[1-9]$/.test(key)) {
      if (notesMode) {
        // In notes mode, toggle the digit in the cell’s pencil marks
        if (!selectedCell.notes) selectedCell.notes = [];
        const index = selectedCell.notes.indexOf(key);
        if (index > -1) {
          selectedCell.notes.splice(index, 1);
        } else {
          selectedCell.notes.push(key);
        }
        updateCellDisplay(selectedCell);
      } else {
        // In normal mode, enter a final digit
        updateCellDisplay(selectedCell, key);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      // Clear out the cell completely
      updateCellDisplay(selectedCell, "");
      selectedCell.notes = [];
    }
  });

  // Check the board against the solution
  function checkSolution() {
    let allCorrect = true;
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
      if (cell.classList.contains("prefilled") || cell.classList.contains("hint"))
        return;
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const finalVal = cell.querySelector(".value").textContent;
      if (finalVal === "" || parseInt(finalVal) !== solutionBoard[row][col]) {
        cell.classList.add("incorrect");
        allCorrect = false;
      } else {
        cell.classList.remove("incorrect");
        cell.classList.add("correct");
      }
    });
    if (allCorrect) {
      stopTimer();
      setTimeout(() => {
        alert(
          "Congratulations! You've solved the puzzle in " +
            timerDisplay.textContent.replace("Time: ", "") +
            "!"
        );
      }, 100);
    } else {
      alert("Some cells are incorrect or incomplete. Keep trying!");
    }
  }

  // Provide a hint by filling one correct cell
  function provideHint() {
    const cells = document.querySelectorAll(".cell");
    let candidates = [];
    cells.forEach(cell => {
      if (cell.classList.contains("prefilled") || cell.classList.contains("hint"))
        return;
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const finalVal = cell.querySelector(".value").textContent;
      if (finalVal === "" || parseInt(finalVal) !== solutionBoard[row][col]) {
        candidates.push(cell);
      }
    });
    if (candidates.length === 0) {
      alert("All cells are correct already!");
      return;
    }
    const randomCell = candidates[Math.floor(Math.random() * candidates.length)];
    const row = parseInt(randomCell.dataset.row);
    const col = parseInt(randomCell.dataset.col);
    updateCellDisplay(randomCell, solutionBoard[row][col]);
    randomCell.classList.add("hint");
  }

  // Toggle between normal input and notes (pencil marks) mode
  function toggleNotesMode() {
    notesMode = !notesMode;
    notesToggleBtn.textContent = notesMode ? "Notes Mode: ON" : "Notes Mode: OFF";
  }

  // Reset and start a new game, applying the selected difficulty
  function newGame() {
    stopTimer();
    startTimer();
    if (selectedCell) {
      selectedCell.classList.remove("selected");
      selectedCell = null;
    }
    const empties = parseInt(difficultySlider.value);
    const solved = generateSolvedBoard();
    solutionBoard = solved;
    board = createPuzzle(solved, empties);
    renderBoard(board, solutionBoard);
  }

  // Attach event listeners to buttons
  newGameBtn.addEventListener("click", newGame);
  checkBtn.addEventListener("click", checkSolution);
  hintBtn.addEventListener("click", provideHint);
  notesToggleBtn.addEventListener("click", toggleNotesMode);

  // Start the game when the page loads
  newGame();
});
