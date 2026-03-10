// script.js
let myBooks = JSON.parse(localStorage.getItem('myBooks')) || [];
let points = localStorage.getItem('points') || 0;

function startScanner() {
    const reader = document.getElementById('reader');
    reader.style.display = 'block';

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
            fetchBookData(decodedText);
            html5QrCode.stop(); // Stop camera after successful scan
            reader.style.display = 'none';
        }
    );
}

async function fetchBookData(isbn) {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await response.json();

    if (data.items) {
        const info = data.items[0].volumeInfo;
        const newBook = {
            title: info.title,
            category: info.categories ? info.categories[0] : "General",
            image: info.imageLinks ? info.imageLinks.thumbnail : 'https://via.placeholder.com/128x192'
        };

        addBook(newBook);
    } else {
        alert("Book not found! Try another one.");
    }
}

function addBook(book) {
    myBooks.push(book);
    // 1. Sort Alphabetically
    myBooks.sort((a, b) => a.title.localeCompare(b.title));
    
    // 2. Reward Logic: 10 points for every new book!
    points = parseInt(points) + 10;
    
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('myBooks', JSON.stringify(myBooks));
    localStorage.setItem('points', points);
    
    document.getElementById('points').innerText = points;
    const list = document.getElementById('book-list');
    list.innerHTML = '';

    myBooks.forEach(book => {
        list.innerHTML += `
            <div class="book-card">
                <img src="${book.image}" width="100">
                <p><strong>${book.title}</strong></p>
                <p><small>${book.category}</small></p>
            </div>
        `;
    });
}

// Show books on startup
saveAndRender();
