// Initialize data from storage
let myBooks = JSON.parse(localStorage.getItem('myBooks')) || [];
let readingLog = JSON.parse(localStorage.getItem('readingLog')) || [];
let points = parseInt(localStorage.getItem('points')) || 0;

let startTime;
let timerInterval;
let currentBookTitle = "";

// 1. SCANNER SETUP
function startScanner() {
    const reader = document.getElementById('reader');
    reader.style.display = 'block';

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            fetchBookData(decodedText);
            html5QrCode.stop().then(() => {
                reader.style.display = 'none';
            });
        }
    ).catch(err => alert("Camera Error: Please allow camera access!"));
}

// 2. FETCH DATA
async function fetchBookData(isbn) {
    // 1. Clean the input (Remove everything except numbers and 'X')
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
    console.log("Searching for cleaned ISBN:", cleanIsbn);

    try {
        // Try searching by ISBN specifically
        let response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        let data = await response.json();

        // 2. If ISBN search fails, try a general search (it's more "forgiving")
        if (!data.items || data.items.length === 0) {
            response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${cleanIsbn}`);
            data = await response.json();
        }

        if (data.items && data.items.length > 0) {
            const info = data.items[0].volumeInfo;
            const newBook = {
                id: Date.now(),
                title: info.title,
                image: info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/128x192'
            };
            addBook(newBook);
        } else {
            // 3. Manual Fallback
            const manualTitle = prompt("I couldn't find that barcode in my big database. What is the name of this book?");
            if (manualTitle) {
                addBook({
                    id: Date.now(),
                    title: manualTitle,
                    image: 'https://via.placeholder.com/128x192'
                });
            }
        }
    } catch (e) {
        console.error("API Error:", e);
        alert("Oops! The library is having trouble connecting to the internet.");
    }
}

// 3. ADD TO LIBRARY (The Fix is here!)
function addBook(book) {
    myBooks.push(book); // This adds to the existing array
    myBooks.sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical sort
    points += 10;
    saveAndRender();
}

// 4. TIMER & LOGGING
function startReading(bookTitle) {
    currentBookTitle = bookTitle;
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
    const minutesRead = Math.floor(elapsedSeconds / 60);
    const earnedPoints = Math.max(5, minutesRead * 5);

    // Create a log entry
    const newLog = {
        title: currentBookTitle,
        duration: minutesRead,
        date: new Date().toLocaleDateString()
    };
    readingLog.push(newLog);

    points += earnedPoints;
    alert(`Finished! You read for ${minutesRead} minutes.`);
    
    document.getElementById('timer-modal').style.display = 'none';
    saveAndRender();
}

// 5. RENDER EVERYTHING
function saveAndRender() {
    // Save to browser memory
    localStorage.setItem('myBooks', JSON.stringify(myBooks));
    localStorage.setItem('readingLog', JSON.stringify(readingLog));
    localStorage.setItem('points', points);
    
    // Update Points
    document.getElementById('points').innerText = points;

    // Render Book List
    const list = document.getElementById('book-list');
    list.innerHTML = '';
    myBooks.forEach(book => {
        const safeTitle = book.title.replace(/'/g, "\\'");
        list.innerHTML += `
            <div class="book-card">
                <img src="${book.image}" width="100" height="150">
                <p><strong>${book.title}</strong></p>
                <button class="read-btn" onclick="startReading('${safeTitle}')">Read Me! 📖</button>
            </div>
        `;
    });

    // Render Reading Log (History)
    let logHTML = "<h3>📜 My Reading History</h3><ul style='list-style:none; padding:0;'>";
    readingLog.slice().reverse().forEach(entry => {
        logHTML += `<li style="background:#fff; margin:5px; padding:10px; border-radius:10px;">
            <b>${entry.title}</b> - ${entry.duration} mins on ${entry.date}
        </li>`;
    });
    logHTML += "</ul>";
    
    // Create a place for the log if it doesn't exist
    let logContainer = document.getElementById('reading-history');
    if (!logContainer) {
        logContainer = document.createElement('div');
        logContainer.id = 'reading-history';
        document.body.appendChild(logContainer);
    }
    logContainer.innerHTML = logHTML;
}

saveAndRender();

