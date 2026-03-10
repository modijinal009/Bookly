let myBooks = JSON.parse(localStorage.getItem('myBooks')) || [];
let points = parseInt(localStorage.getItem('points')) || 0;
let startTime;
let timerInterval;

// 1. START THE CAMERA
function startScanner() {
    const reader = document.getElementById('reader');
    reader.style.display = 'block';

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            fetchBookData(decodedText);
            html5QrCode.stop();
            reader.style.display = 'none';
        }
    ).catch(err => alert("Camera Error: Check permissions!"));
}

// 2. SEARCH GOOGLE BOOKS
async function fetchBookData(isbn) {
    const cleanIsbn = isbn.trim();
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            const newBook = {
                title: info.title,
                image: info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/128x192'
            };
            addBook(newBook);
        } else {
            alert("Book not found! Try a different one.");
        }
    } catch (e) {
        alert("Search failed. Check your internet!");
    }
}

// 3. ADD & SORT LIBRARY
function addBook(book) {
    myBooks.push(book);
    // Sort A to Z
    myBooks.sort((a, b) => a.title.localeCompare(b.title));
    points += 10; // 10 points for adding a book
    saveAndRender();
}

// 4. READING TIMER LOGIC
function startReading(bookTitle) {
    document.getElementById('reading-title').innerText = "Reading: " + bookTitle;
    document.getElementById('timer-modal').style.display = 'flex';
    startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('clock').innerText = `${mins}:${secs}`;
    }, 1000);
}

function stopReading() {
    clearInterval(timerInterval);
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const earnedPoints = Math.max(1, Math.floor(elapsedSeconds / 60) * 5); // 5 points per minute

    points += earnedPoints;
    alert(`Great job! You earned ${earnedPoints} Star Points!`);
    
    document.getElementById('timer-modal').style.display = 'none';
    saveAndRender();
}

// 5. UPDATE THE SCREEN
function saveAndRender() {
    localStorage.setItem('myBooks', JSON.stringify(myBooks));
    localStorage.setItem('points', points);
    
    document.getElementById('points').innerText = points;
    const list = document.getElementById('book-list');
    list.innerHTML = '';

    myBooks.forEach(book => {
        // We clean the title string to make sure the button works
        const safeTitle = book.title.replace(/'/g, "\\'");
        list.innerHTML += `
            <div class="book-card">
                <img src="${book.image}" width="100" height="150">
                <p><strong>${book.title}</strong></p>
                <button class="read-btn" onclick="startReading('${safeTitle}')">Read Me! 📖</button>
            </div>
        `;
    });
}

// Show library on load
saveAndRender();
