// --- GLOBAL STATE ---
const API_URL = 'https://renderbackend-t1iv.onrender.com';
// const API_URL = 'http://127.0.0.1:8000';
// Add this at the very top of your main.js file
const API_BASE_URL = 'https://renderbackend-t1iv.onrender.com';
// const API_BASE_URL = 'http://127.0.0.1:8000';
let quoteCart = JSON.parse(localStorage.getItem('quoteCart')) || [];
let allProductsCache = []; 

// --- UI HELPERS & NAVBAR ---
function toggleMenu() {
    document.getElementById('nav-links').classList.toggle('active');
}

function updateCartBadge() {
    const count = quoteCart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// --- BOOT UP ---
async function initializeCatalog() {
    try {
        const response = await fetch(`${API_URL}/products`);
        allProductsCache = await response.json();
    } catch (error) {
        console.error("Could not load catalog on boot:", error);
    }
}

// --- ROUTING CORE LOGIC ---
function handleRouting() {
    if (allProductsCache.length === 0) return; 

    const hash = window.location.hash;

    if (!hash || hash === '' || hash === '#home' || hash === '#search') {
        navigateTo('home');
    } else if (hash === '#all-products') {
        navigateTo('all-products');
    } else if (hash === '#cart') {
        navigateTo('cart');
    } else if (hash === '#about') {
        navigateTo('about');
    } else if (hash === '#testimonials') {   // <-- ADDED THIS
        navigateTo('testimonials');          // <-- ADDED THIS
    } else if (hash.startsWith('#category-')) {
        const catId = parseInt(hash.replace('#category-', ''));
        filterCategory(catId);
    } else if (hash.startsWith('#product-')) {
        const prodId = parseInt(hash.replace('#product-', ''));
        viewProduct(prodId);
    }
}

// Listen for the user clicking the Back/Forward browser buttons
window.addEventListener('hashchange', handleRouting);


// --- PAGE VIEWS ---
function navigateTo(view) {
    const contentArea = document.getElementById('app-content');
    document.getElementById('nav-links').classList.remove('active'); 

    if (view === 'home') {
        renderHomePage();                    // <-- CLEANED THIS UP
    } 
    else if (view === 'all-products') {
        contentArea.innerHTML = `
            <h2 style="margin-bottom: 20px;">All Products</h2>
            <div id="product-list" class="product-grid"></div>
        `;
        renderProductCards(allProductsCache);
    }
    else if (view === 'cart') {
        renderCartPage(); 
    }
    else if (view === 'about') {
        renderAboutPage();
    }
    else if (view === 'testimonials') {      // <-- ADDED THIS
        renderTestimonialsPage();            // <-- ADDED THIS
    }
}

// --- CATALOG & FILTERING LOGIC ---
function renderProductCards(products) {
    const container = document.getElementById('product-list');
    container.innerHTML = ''; 

    if (products.length === 0) {
        container.innerHTML = "<p>No products found in this category.</p>";
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        
        // FIX: Now changes the URL hash to load the product page
        card.onclick = () => window.location.hash = `#product-${product.id}`;
        
        card.innerHTML = `
            <h3 style="margin-bottom: 10px; color: var(--primary-blue);">${product.name}</h3>
            <!-- <p style="color: var(--text-main); font-weight: 600; margin-bottom: 15px;">₹${product.price ? product.price.toFixed(2) : "0.00"}</p> -->
            
            <div onclick="event.stopPropagation();" style="display: flex; gap: 10px; margin-bottom: 10px; justify-content: center; align-items: center;">
                <input type="number" id="qty-${product.id}" value="1" min="1" style="width: 60px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-family: 'Inter', sans-serif; font-weight: bold;">
                <button class="btn-add-quote" style="margin-top: 0; padding: 8px 15px; width: auto;" onclick="addToQuote(${product.id}, '${product.name}')">Add to Quote</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterCategory(categoryId) {
    document.getElementById('nav-links').classList.remove('active'); 
    const contentArea = document.getElementById('app-content');
    
    const catNames = {1: "Cellular Assays", 2: "Microscopy", 3: "Mycoplasma"};
    
    contentArea.innerHTML = `
        <h2 style="margin-bottom: 20px;">${catNames[categoryId]}</h2>
        <div id="product-list" class="product-grid"></div>
    `;
    
    const filteredProducts = allProductsCache.filter(p => p.category_id === categoryId);
    renderProductCards(filteredProducts);
}

// --- SINGLE PRODUCT VIEW (FULLY DYNAMIC MATRIX) ---
function viewProduct(productId) {
    document.getElementById('nav-links').classList.remove('active'); 
    const contentArea = document.getElementById('app-content');
    
    const product = allProductsCache.find(p => p.id === productId);
    if (!product) {
        contentArea.innerHTML = `<h2 style="color: red; text-align: center; padding: 40px;">Product not found</h2>`;
        return;
    }

    // NEW: Split the comma-separated string from the database into an array
    // If no images exist, fallback to a placeholder
    window.currentProductImages = product.images ? product.images.split(',') : ['images/placeholder.jpg'];
    window.currentImageCaptions = product.image_captions ? product.image_captions.split(',') : ['Product Image'];
    window.currentImageIndex = 0; // Reset carousel for new product

    const catNo = product.catalog_number || `OS-PROD-${product.id}`;
    const subTitle = product.subtitle || "Premium Laboratory Reagent";
    const downloadPath = product.download_link || "#";

    contentArea.innerHTML = `
        <div class="product-details-container" style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Left Side: Carousel -->
            <div style="position: relative; border-radius: 8px; overflow: hidden; min-height: 400px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1px solid #e2e8f0;" id="carousel-display-area">
                
                <!-- NEW: Actual Image Tag replacing the text span -->
                <img id="carousel-main-img" src="${window.currentProductImages[0]}" style="width: 100%; height: 100%; object-fit: contain; background: white;" alt="${product.name}">

                <!-- Left Arrow -->
                <button onclick="prevImage()" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.9); border: 1px solid #e2e8f0; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2rem; color: var(--dark-slate); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                    &#10094;
                </button>
                
                <!-- Right Arrow -->
                <button onclick="nextImage()" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.9); border: 1px solid #e2e8f0; border-radius: 50%; width: 45px; height: 45px; cursor: pointer; font-size: 1.2rem; color: var(--dark-slate); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                    &#10095;
                </button>
                <div id="carousel-caption" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.8); color: white; padding: 15px 40px; text-align: center; font-size: 0.95rem; font-weight: 500; backdrop-filter: blur(4px);">
                    ${window.currentImageCaptions[0] || ""}
                </div>
            </div>
            
            <!-- Right Side: Details (Remains completely unchanged) -->
            <div class="product-details-container" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <span style="color: var(--text-light); font-size: 0.9rem; font-weight: 700; letter-spacing: 0.5px;">CAT NO. ${catNo}</span>
                    <h1 style="font-size: 2.5rem; margin: 5px 0 10px 0; color: var(--primary-blue); font-family: 'Montserrat';">${product.name}</h1>
                    <p style="font-style: italic; color: var(--accent-blue); margin-bottom: 15px; font-weight: 500; font-size: 1.1rem;">${subTitle}</p>
                    
                    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
                        <span style="background: #eff6ff; color: var(--accent-blue); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">Store at -20°C</span>
                        <span style="background: #f0fdf4; color: #16a34a; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">Research Use Only</span>
                    </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: var(--dark-slate);">QUANTITY</label>
                            <input type="number" id="qty-${product.id}" value="1" min="1" style="width: 70px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-weight: bold;">
                        </div>
                        <button style="margin-top: 18px; padding: 12px; flex: 1; background: white; border: 1px solid var(--primary-blue); color: var(--primary-blue); font-weight: 600; border-radius: 4px; cursor: pointer;" onclick="addToQuote(${product.id}, '${product.name}')">Add to Quote Cart</button>
                    </div>
                </div>

                <a href="${downloadPath}" onclick="showToast('Downloading document...', 'success')" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: white; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px; border-radius: 4px; font-weight: 500; text-align: center; text-decoration: none;">
                    📄 Download Full Protocol Datasheet (PDF)
                </a>
            </div>
        </div>

        <!-- 3 Tabs Layout -->
        <div style="max-width: 1200px; margin: 30px auto 0 auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
            <div style="display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <button id="tab-btn-overview" onclick="switchTab('overview', ${product.id})" style="padding: 15px 25px; border: none; background: white; font-weight: 600; color: var(--primary-blue); border-top: 2px solid var(--primary-blue); border-right: 1px solid #e2e8f0; cursor: pointer;">Product Overview</button>
                <button id="tab-btn-support" onclick="switchTab('support', ${product.id})" style="padding: 15px 25px; border: none; background: transparent; font-weight: 600; color: var(--text-light); border-right: 1px solid #e2e8f0; cursor: pointer; border-top: 2px solid transparent;">Technical Support</button>
                <button id="tab-btn-reviews" onclick="switchTab('reviews', ${product.id})" style="padding: 15px 25px; border: none; background: transparent; font-weight: 600; color: var(--text-light); cursor: pointer; border-top: 2px solid transparent;">Validation & Reviews</button>
            </div>
            <div id="tab-content-box" style="padding: 30px; line-height: 1.6; color: var(--text-main);">
                ${product.specs_html || "<p>Data pending.</p>"}
            </div>
        </div>
    `;
}
// Carousel State Management
window.currentImageIndex = 0;

// Carousel State Management
window.currentImageIndex = 0;
window.currentImageCaptions = [];
window.currentProductImages = []; // Will hold the array of image paths for the active product

window.nextImage = function() {
    if (window.currentProductImages.length === 0) return;
    
    // Move to the next image index, loop back to 0 if at the end
    window.currentImageIndex = (window.currentImageIndex + 1) % window.currentProductImages.length;

    
    // Update the image source in the DOM
    document.getElementById('carousel-main-img').src = window.currentProductImages[window.currentImageIndex];
    document.getElementById('carousel-caption').innerText = window.currentImageCaptions[window.currentImageIndex] || "";
};

window.prevImage = function() {
    if (window.currentProductImages.length === 0) return;
    
    // Move to the previous image index, loop to the end if at the beginning
    window.currentImageIndex = (window.currentImageIndex - 1 + window.currentProductImages.length) % window.currentProductImages.length;
    
    // Update the image source in the DOM
    document.getElementById('carousel-main-img').src = window.currentProductImages[window.currentImageIndex];
    document.getElementById('carousel-caption').innerText = window.currentImageCaptions[window.currentImageIndex] || "";
};

// Temporary placeholder data for your carousel. 
// Later, you can add an 'images' array to your SQLite database for each product.
// window.carouselData = [
//     { text: "🔬 Main Product View", caption: "Amber tubes ensure protection for light-sensitive fluorogenic dyes.", bg: "#f8fafc" },
//     { text: "📊 Viability Timeline", caption: "Assay results demonstrating cell viability over a 48-hour period.", bg: "#f1f5f9" },
//     { text: "📊 HEK293 Response", caption: "Fluorescence intensity in HEK293 cells treated with varying concentrations.", bg: "#e2e8f0" },
//     { text: "🖼️ Counterstain Overlay", caption: "Epifluorescence microscopy overlaid with Hoechst nuclear stain.", bg: "#cbd5e1" }
// ];

// window.updateCarousel = function() {
//     const displayArea = document.getElementById('carousel-display-area');
//     const mainText = document.getElementById('carousel-main-text');
//     const caption = document.getElementById('carousel-caption');
    
//     const current = window.carouselData[window.currentImageIndex];
    
//     // Update the UI
//     displayArea.style.background = current.bg;
//     mainText.innerText = current.text;
//     caption.innerText = current.caption;
// };

// window.nextImage = function() {
//     window.currentImageIndex = (window.currentImageIndex + 1) % window.carouselData.length;
//     window.updateCarousel();
// };

// window.prevImage = function() {
//     window.currentImageIndex = (window.currentImageIndex - 1 + window.carouselData.length) % window.carouselData.length;
//     window.updateCarousel();
// };

window.switchTab = function(tabName, productId) {
    const box = document.getElementById('tab-content-box');
    const product = allProductsCache.find(p => p.id === productId);
    
    const btns = {
        overview: document.getElementById('tab-btn-overview'),
        support: document.getElementById('tab-btn-support'),
        reviews: document.getElementById('tab-btn-reviews')
    };

    // Reset all tabs to inactive styles
    for (let key in btns) {
        if(btns[key]) {
            btns[key].style.background = 'transparent'; 
            btns[key].style.color = 'var(--text-light)';
            btns[key].style.borderTop = '2px solid transparent';
        }
    }

    // Activate selected tab
    if(btns[tabName]) { 
        btns[tabName].style.background = 'white'; 
        btns[tabName].style.color = 'var(--primary-blue)'; 
        btns[tabName].style.borderTop = '2px solid var(--primary-blue)';
    }

    // Load appropriate content
    if (tabName === 'overview') {
        box.innerHTML = product.specs_html || "<p>Data pending.</p>";
    } else if (tabName === 'support') {
        box.innerHTML = product.support_html || "<p>Support details pending.</p>";
    } else if (tabName === 'reviews') {
        // Hardcoded reviews HTML
        box.innerHTML = `
            <h4 style="margin-bottom: 15px; color: var(--dark-slate);">Researcher Feedback</h4>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid var(--primary-blue);">
                <p style="font-style: italic; margin-bottom: 5px;">"Excellent reagent. Cleared our MCF7 line in 5 days without affecting growth rate. Highly recommended as an indigenous alternative."</p>
                <p style="font-size: 0.9rem; font-weight: 600; color: #475569;">— Postdoctoral Researcher, IISER Pune</p>
            </div>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-blue);">
                <p style="font-style: italic; margin-bottom: 5px;">"Reliable quality and fast shipping. The technical support team was highly responsive and helpful with our specific protocol needs."</p>
                <p style="font-size: 0.9rem; font-weight: 600; color: #475569;">— PhD Candidate, NCBS Bangalore</p>
            </div>
        `;
    }
}

// --- CART LOGIC ---
function addToQuote(productId, productName) {
    const qtyInput = document.getElementById(`qty-${productId}`);
    const quantityToAdd = qtyInput ? parseInt(qtyInput.value) : 1;

    const existingItem = quoteCart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantityToAdd;
    } else {
        quoteCart.push({ id: productId, name: productName, quantity: quantityToAdd });
    }
    
    localStorage.setItem('quoteCart', JSON.stringify(quoteCart));
    updateCartBadge();
    
    if (qtyInput) qtyInput.value = 1;
    showToast(`Added ${quantityToAdd}x ${productName} to your quote request.`, 'success');
}

function changeQuantity(productId, change) {
    const item = quoteCart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            quoteCart = quoteCart.filter(i => i.id !== productId);
        }
        localStorage.setItem('quoteCart', JSON.stringify(quoteCart));
        updateCartBadge();
        renderCartPage(); 
    }
}

// --- CART UI & SUBMISSION ---
function renderCartPage() {
    const contentArea = document.getElementById('app-content');
    
    contentArea.innerHTML = `
        <div class="dashboard-layout" style="margin-top: 0;">
            <section class="catalog-section">
                <h2 style="margin-bottom: 20px;">Review Your Request</h2>
                <div id="cart-items-container" style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
                </div>
            </section>
            
            <aside class="cart-sidebar">
    <div class="cart-container" style="background: white; padding: 25px; border-radius: 8px; border: 1px solid #e0e0e0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h3 style="margin-bottom: 20px; color: var(--primary-blue);">Lead Details</h3>
        
        <!-- ADD THIS FORM TAG -->
        <form id="quote-form" onsubmit="submitQuote(event);">
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Full Name / PI Name *</label>
                <input type="text" id="buyer-name" placeholder="Dr. Jane Doe" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
            </div>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Official Email *</label>
                <input type="email" id="buyer-email" placeholder="lab@institution.edu" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
            </div>
            
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Institution / Company</label>
                <input type="text" id="buyer-company" placeholder="e.g. IISER Pune" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
            </div>
            
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">City *</label>
                    <input type="text" id="buyer-city" placeholder="City" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem;">Pincode *</label>
                    <input type="text" id="buyer-pincode" placeholder="Pincode" required style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: inherit;">
                </div>
            </div>

            <!-- Removed onclick, type remains submit -->
            <button id="submit-btn" type="submit" style="width: 100%; background: var(--primary-blue); color: white; padding: 14px; border: none; border-radius: 4px; font-weight: 600; font-size: 1rem; cursor: pointer;">
                Submit Request
            </button>
        </form>
        <!-- END FORM TAG -->
        
    </div>
</aside>
        
        </div>
    `;

    const cartContainer = document.getElementById('cart-items-container');
    
    if (quoteCart.length === 0) {
        cartContainer.innerHTML = '<p style="color: var(--text-light);">Your quote cart is empty.</p>';
        document.getElementById('submit-btn').disabled = true;
        document.getElementById('submit-btn').style.background = '#cbd5e1';
        return;
    }

    // Un-disable the button if items exist
    document.getElementById('submit-btn').disabled = false;
    document.getElementById('submit-btn').style.background = 'var(--primary-blue)';

    quoteCart.forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '15px 0';
        row.style.borderBottom = '1px solid #eee';
        
        row.innerHTML = `
            <span style="font-weight: 500; font-size: 1.1rem;">${item.name}</span>
            <div style="display: flex; align-items: center; gap: 12px;">
                <button type="button" class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span style="width: 25px; text-align: center; font-weight: bold;">${item.quantity}</span>
                <button type="button" class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                
                <!-- NEW: Delete Button -->
                <button type="button" onclick="removeItem(${item.id})" style="color: #ef4444; border: none; background: none; cursor: pointer; font-size: 1.2rem;" title="Remove Item">
                    🗑️
                </button>
            </div>
        `;
        cartContainer.appendChild(row);
    });
}
//commented because render +gmail not working adn we will us below emailjs
// async function submitQuote(event) {
//     // 1. Stop the page from blinking/reloading
//     if (event) {
//         event.preventDefault();
//     }

//     const name = document.getElementById('buyer-name').value;
//     const email = document.getElementById('buyer-email').value;
//     const city = document.getElementById('buyer-city').value;
//     const pincode = document.getElementById('buyer-pincode').value;
//     const company = document.getElementById('buyer-company').value;

//     if (!name || !email || !city || !pincode) {
//         showToast("Please fill in all contact details.", "error");
//         return;
//     }

//     if (quoteCart.length === 0) {
//         showToast("Your quote cart is empty.", "error");
//         return;
//     }

//     // --- NEW: Disable button and show loading state ---
//     const submitBtn = document.getElementById('submit-btn');
//     submitBtn.disabled = true;
//     submitBtn.innerText = "Sending...";
//     submitBtn.style.background = '#cbd5e1'; // Gray out the button
//     // --------------------------------------------------

//     const payload = {
//         name: name,
//         email: email,
//         company: company,
//         city: city,
//         pincode: pincode,
//         // Map 'qty' from your cart to 'quantity' for FastAPI
//         items: quoteCart.map(item => ({
//             id: item.id,            
//             quantity: item.quantity
//         }))
//     };

//     try {
//         const response = await fetch(`${API_BASE_URL}/api/quotes`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         if (response.ok) {
//             showToast("Quote requested successfully!", "success");
            
//             // 2. Reset the HTML form fields
//             document.getElementById('quote-form').reset();
            
//             // 3. Clear cart and update UI
//             quoteCart = []; 
//             localStorage.setItem('quoteCart', JSON.stringify(quoteCart));
//             updateCartBadge();
            
//             // 4. Re-render the page (this automatically resets the button state)
//             renderCartPage(); 
//         } else {
//             showToast("Failed to submit quote.", "error");
//             // --- NEW: Re-enable button on failure ---
//             submitBtn.disabled = false;
//             submitBtn.innerText = "Submit Request";
//             submitBtn.style.background = 'var(--primary-blue)';
//         }
//     } catch (error) {
//         console.error("Error submitting quote:", error);
//         showToast("Network error. Please try again.", "error");
//         // --- NEW: Re-enable button on failure ---
//         submitBtn.disabled = false;
//         submitBtn.innerText = "Submit Request";
//         submitBtn.style.background = 'var(--primary-blue)';
//     }
// }
// --- NEW submitQuote FUNCTION (WITH EMAILJS) ---
async function submitQuote(event) {
    if (event) {
        event.preventDefault();
    }

    const name = document.getElementById('buyer-name').value;
    const email = document.getElementById('buyer-email').value;
    const city = document.getElementById('buyer-city').value;
    const pincode = document.getElementById('buyer-pincode').value;
    const company = document.getElementById('buyer-company').value || "Independent Researcher";

    if (!name || !email || !city || !pincode) {
        showToast("Please fill in all contact details.", "error");
        return;
    }

    if (quoteCart.length === 0) {
        showToast("Your quote cart is empty.", "error");
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending...";
    submitBtn.style.background = '#cbd5e1'; 

    // 1. Prepare data for Render Database
    const payload = {
        name: name,
        email: email,
        company: company,
        city: city,
        pincode: pincode,
        items: quoteCart.map(item => ({
            id: item.id,            
            quantity: item.quantity
        }))
    };

    // 2. Format cart items into a clean text list for the EmailJS template
    let emailItemsText = "";
    quoteCart.forEach(item => {
        emailItemsText += `${item.quantity}x ${item.name}\n`;
    });

    try {
        // --- ACTION 1: SAVE TO RENDER DATABASE ---
        const response = await fetch(`${API_BASE_URL}/api/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Failed to save to database");
        }

        // --- ACTION 2: SEND EMAIL VIA EMAILJS ---
        // Ensure the keys here map exactly to your {{variables}} in the EmailJS template
        await emailjs.send(
            "service_x00vgxa",   // <-- Replace this from your EmailJS Dashboard
            "template_w58swuh",  // <-- Replace this from your EmailJS Dashboard
            {
                user_name: name,
                user_email: email,
                product_name: emailItemsText,
                message: `Institution: ${company} | Location: ${city}, ${pincode}` 
            }
        );

        // --- ACTION 3: UI SUCCESS RESET ---
        showToast("Quote requested successfully! Check your inbox.", "success");
        
        document.getElementById('quote-form').reset();
        quoteCart = []; 
        localStorage.setItem('quoteCart', JSON.stringify(quoteCart));
        updateCartBadge();
        renderCartPage(); 
        
    } catch (error) {
        console.error("Error submitting quote:", error);
        showToast("Network error. Please try again.", "error");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Request";
        submitBtn.style.background = 'var(--primary-blue)';
    }
}

// --- SEARCH FUNCTIONALITY ---
function handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const contentArea = document.getElementById('app-content');
    
    // If they clear the search bar, just go back to the home view
    if (query === "") {
        window.location.hash = '#home';
        navigateTo('home');
        return;
    }

    // NEW: Update the URL to #search without triggering the router
    if (window.location.hash !== '#search') {
        window.history.pushState(null, null, '#search');
    }

    // Filter products by name or description
    const searchResults = allProductsCache.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
    );

    // Setup the screen for search results
    document.getElementById('nav-links').classList.remove('active');
    
    contentArea.innerHTML = `
        <h2 style="margin-bottom: 20px;">Search Results for "${query}"</h2>
        <div id="product-list" class="product-grid"></div>
    `;
    
    // Draw the matching products using your existing function!
    renderProductCards(searchResults);
}
function renderAboutPage() {
    const contentArea = document.getElementById('app-content');
    
    contentArea.innerHTML = `
        <style>
            /* Smooth Entrance Animations */
            @keyframes fadeSlideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-up {
                animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                opacity: 0;
            }
            .delay-1 { animation-delay: 0.1s; }
            .delay-2 { animation-delay: 0.2s; }
            .delay-3 { animation-delay: 0.3s; }
            .delay-4 { animation-delay: 0.4s; }

            /* Interactive Card Hover Effects */
            .impact-card {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 25px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                height: 100%;
                box-sizing: border-box;
            }
            .impact-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 15px 30px rgba(0,0,0,0.08);
                border-color: #93c5fd;
            }
            
            /* Gradient Text for emphasis */
            .text-gradient {
                background: linear-gradient(135deg, #1e40af, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
        </style>

        <div style="max-width: 1100px; margin: 0 auto; padding: 20px 20px 60px 20px; font-family: system-ui, -apple-system, sans-serif;">
            
            <!-- Hero Section -->
            <div class="animate-up" style="text-align: center; margin-bottom: 60px; padding: 60px 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; left: -50px; width: 200px; height: 200px; background: #dbeafe; border-radius: 50%; filter: blur(50px); opacity: 0.6;"></div>
                <div style="position: absolute; bottom: -50px; right: -50px; width: 200px; height: 200px; background: #e0f2fe; border-radius: 50%; filter: blur(50px); opacity: 0.6;"></div>
                
                <h1 style="color: #0f172a; font-size: 2.8rem; margin-bottom: 20px; position: relative; z-index: 1; letter-spacing: -0.5px;">
                    Accelerating India's Biotech <br><span class="text-gradient">Self-Reliance</span>
                </h1>
                <p style="color: #475569; font-size: 1.2rem; max-width: 700px; margin: 0 auto; line-height: 1.6; position: relative; z-index: 1;">
                    Olirum Scientific is developing high-quality, indigenous reagents and kits to streamline research workflows—ensuring rapid access to critical tools without the bottleneck of costly imports.
                </p>
            </div>

            <!-- Vision & Mission Grid -->
            <div class="animate-up delay-1" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; margin-bottom: 60px;">
                <div style="background: white; padding: 35px; border-radius: 12px; border-top: 4px solid #3b82f6; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    <h3 style="color: #1e40af; font-size: 1.5rem; margin-bottom: 15px; margin-top: 0;">Our Vision</h3>
                    <p style="color: #334155; line-height: 1.7; font-size: 1.05rem; margin: 0;">
                        To transform India into a self-reliant hub for advanced life science research by replacing imported reagents with world-class, locally manufactured alternatives, ultimately contributing to breakthroughs in healthcare and biotechnology.
                    </p>
                </div>
                <div style="background: white; padding: 35px; border-radius: 12px; border-top: 4px solid #10b981; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    <h3 style="color: #047857; font-size: 1.5rem; margin-bottom: 15px; margin-top: 0;">Our Mission</h3>
                    <ul style="color: #334155; line-height: 1.7; font-size: 1.05rem; padding-left: 20px; margin: 0;">
                        <li style="margin-bottom: 8px;">Deliver high-performance, cost-effective reagents.</li>
                        <li style="margin-bottom: 8px;">Eradicate dependency on imported scientific products.</li>
                        <li style="margin-bottom: 8px;">Build strong collaborations with leading institutions.</li>
                        <li>Innovate toward next-generation biomedical technologies.</li>
                    </ul>
                </div>
            </div>

            <!-- The Market Impact Section -->
            <div class="animate-up delay-2" style="text-align: center; margin-bottom: 50px;">
                <h2 style="color: #0f172a; font-size: 2.2rem; margin-bottom: 10px;">Bridging the ₹3.67 Crore Gap</h2>
                <p style="color: #64748b; font-size: 1.1rem; max-width: 600px; margin: 0 auto 40px auto;">
                    Our current product portfolio directly replaces major imported dependencies in the Indian research ecosystem, strengthening the "Make in India" initiative.
                </p>

                <!-- Product Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; text-align: left;">
                    
                    <div class="impact-card">
                        <div style="color: #ef4444; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">₹1.86 Cr Import Value</div>
                        <h4 style="color: #0f172a; font-size: 1.25rem; margin: 0 0 10px 0;">Mycoplasma qPCR Kit</h4>
                        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin: 0;">Gold-standard detection system with high sensitivity, enabling early prevention of contamination.</p>
                    </div>

                    <div class="impact-card">
                        <div style="color: #f59e0b; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">₹80 Lakh Import Value</div>
                        <h4 style="color: #0f172a; font-size: 1.25rem; margin: 0 0 10px 0;">Mycoplasma Removal</h4>
                        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin: 0;">Designed to safely eliminate contamination, addressing a critical issue in research reproducibility.</p>
                    </div>

                    <div class="impact-card">
                        <div style="color: #8b5cf6; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">₹70 Lakh Import Value</div>
                        <h4 style="color: #0f172a; font-size: 1.25rem; margin: 0 0 10px 0;">Confocal Mounting Media</h4>
                        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin: 0;">High-quality formulation enhancing fluorescence stability and structural clarity for advanced imaging.</p>
                    </div>

                    <div class="impact-card">
                        <div style="color: #3b82f6; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">₹17 Lakh Import Value</div>
                        <h4 style="color: #0f172a; font-size: 1.25rem; margin: 0 0 10px 0;">DCFDA ROS Detection</h4>
                        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin: 0;">Accurate measurement of intracellular reactive oxygen species for oxidative stress and drug response.</p>
                    </div>

                    <div class="impact-card">
                        <div style="color: #10b981; font-weight: bold; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 5px;">₹14 Lakh Import Value</div>
                        <h4 style="color: #0f172a; font-size: 1.25rem; margin: 0 0 10px 0;">Calcein AM Viability</h4>
                        <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin: 0;">Reliable and efficient live-cell viability detection, optimized for high-throughput toxicity studies.</p>
                    </div>

                </div>
            </div>

            <!-- Future Direction Section (Dark Theme) -->
            <div class="animate-up delay-3" style="background: #0f172a; color: white; padding: 50px 40px; border-radius: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; align-items: center; margin-top: 70px;">
                <div>
                    <div style="color: #38bdf8; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">Future Direction</div>
                    <h2 style="font-size: 2rem; margin: 0 0 20px 0; line-height: 1.2;">Advanced Precision Therapeutics</h2>
                    <p style="color: #94a3b8; line-height: 1.7; font-size: 1.05rem;">
                        Our long-term vision extends beyond reagents. We are actively developing a next-generation drug delivery platform for cancer treatment, engineered to transport both small molecule drugs and biological therapeutics (mRNA, DNA).
                    </p>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <h4 style="font-size: 1.2rem; margin: 0 0 15px 0; color: #f8fafc;">Platform Objectives:</h4>
                    <ul style="color: #cbd5e1; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Enhance targeted cellular delivery</li>
                        <li>Improve overall treatment efficacy</li>
                        <li>Dramatically reduce off-target side effects</li>
                        <li>Contribute directly to the future of precision oncology</li>
                    </ul>
                </div>
            </div>

        </div>
    `;
}
function renderHomePage() {
    const contentArea = document.getElementById('app-content');
    
    contentArea.innerHTML = `
        <style>
            /* Crossfade Animation for Hero Background */
            @keyframes bannerFade {
                0%, 30% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
                33%, 63% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
                66%, 97% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
                100% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
            }
            
            /* FULL BLEED Hero Banner */
            .hero-banner {
                height: 500px; 
                background-size: cover; 
                background-position: center;
                animation: bannerFade 15s infinite; 
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                text-align: center; 
                color: white;
                padding: 20px; 
                margin-bottom: 20px;
                /* Edge-to-edge trick */
                width: 100vw;
                position: relative;
                left: 50%;
                right: 50%;
                margin-left: -50vw;
                margin-right: -50vw;
            }
            
            /* Text Fade Animations */
            @keyframes fadeSlideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Short Text Ticker */
            .ticker-wrap {
                width: 100vw; 
                position: relative;
                left: 50%;
                right: 50%;
                margin-left: -50vw;
                margin-right: -50vw;
                overflow: hidden; 
                background-color: #eff6ff; 
                padding: 15px 0; 
                border-top: 1px solid #bfdbfe; 
                border-bottom: 1px solid #bfdbfe; 
                margin-bottom: 50px;
            }
            .ticker {
                display: inline-block; white-space: nowrap; animation: ticker 30s linear infinite;
            }
            @keyframes ticker {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
            }
            .ticker-item {
                display: inline-block; padding: 0 40px; font-size: 1.05rem; color: #1e3a8a; font-weight: 500;
            }
            
            /* 3-Card Category Grid */
            .category-grid {
             display: grid;
             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
             gap: 30px;
             margin-bottom: 50px;
             max-width: 1200px;
             margin-left: auto;
             margin-right: auto;
             padding: 0 20px;
            }

            .cat-card-detailed {
                min-width: 300px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;
                text-decoration: none; color: inherit; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; text-align: center;
            }
            .cat-card-detailed:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #3b82f6; }
            
            /* Large Card Testimonial Marquee */
            .marquee-container {
                overflow: hidden; white-space: nowrap; position: relative; 
                width: 100vw;
                left: 50%;
                right: 50%;
                margin-left: -50vw;
                margin-right: -50vw;
                padding: 40px 0; background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;
            }
            .marquee-content {
                display: inline-block; animation: scroll-left-cards 35s linear infinite;
            }
            .marquee-container:hover .marquee-content { animation-play-state: paused; }
            @keyframes scroll-left-cards {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .testimonial-card {
                display: inline-block; width: 400px; margin-right: 30px; padding: 25px;
                background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                white-space: normal; vertical-align: top; border: 1px solid #e2e8f0;
            }
        </style>

        <!-- 1. Animated Hero Banner -->
        <div class="hero-banner">
            <h1 style="font-size: 3.5rem; margin-bottom: 15px; animation: fadeSlideUp 1s ease-out;color: #aaff79;">Indigenous Precision for Modern Science</h1>
            <p style="font-size: 1.2rem; max-width: 700px; margin-bottom: 30px; color: #e2e8f0; animation: fadeSlideUp 1s ease-out 0.2s backwards;">Explore our high-purity cellular assays, custom microscopy media, and contamination control kits manufactured right here in India.</p>
            <button onclick="window.location.hash = '#all-products'" style="background: #3b82f6; color: white; padding: 15px 40px; border: none; border-radius: 30px; font-weight: bold; font-size: 1.1rem; cursor: pointer; transition: background 0.3s; animation: fadeSlideUp 1s ease-out 0.4s backwards;" onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                Explore Catalog &rarr;
            </button>
        </div>

        <!-- 2. Fast Text Ticker -->
       <!-- <div class="ticker-wrap">
            <div class="ticker">
                <div class="ticker-item">⭐⭐⭐⭐⭐ "The qPCR kit eliminated our false positives." - Dr. Sharma, IISc</div>
                <div class="ticker-item">⭐⭐⭐⭐⭐ "Saved us weeks of waiting on customs." - Lab Director, NIPER</div>
                <div class="ticker-item">⭐⭐⭐⭐⭐ "Calcein AM viability was perfectly reproducible." - Biotech Startup, Pune</div>
                <!-- Duplicates for seamless loop -->
                <div class="ticker-item">⭐⭐⭐⭐⭐ "The qPCR kit eliminated our false positives." - Dr. Sharma, IISc</div>
                <div class="ticker-item">⭐⭐⭐⭐⭐ "Saved us weeks of waiting on customs." - Lab Director, NIPER</div>
                <div class="ticker-item">⭐⭐⭐⭐⭐ "Calcein AM viability was perfectly reproducible." - Biotech Startup, Pune</div>
            </div>
        </div>-->

        <!-- 3. Auto-Spaced Categories -->
        <h2 style="text-align: center; margin-top: 40px; margin-bottom: 30px; color: #0f172a;">Shop by Application</h2>
        <div class="category-grid">
            <a href="#category-1" class="cat-card-detailed">
                <div style="height: 120px; width: 120px; background: #d1fae5; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🧫</div>
                <h3 style="margin-bottom: 10px; color: #1e40af;">Cellular Assays</h3>
                <p style="font-size: 0.95rem; color: #64748b;">Viability and toxicity profiling.</p>
            </a>
            
            <a href="#category-2" class="cat-card-detailed">
                <div style="height: 120px; width: 120px; background: #ede9fe; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🔬</div>
                <h3 style="margin-bottom: 10px; color: #1e40af;">Microscopy</h3>
                <p style="font-size: 0.95rem; color: #64748b;">Advanced mounting media.</p>
            </a>
            
            <a href="#category-3" class="cat-card-detailed">
                <div style="height: 120px; width: 120px; background: #e0f2fe; border-radius: 50%; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🧪</div>
                <h3 style="margin-bottom: 10px; color: #1e40af;">Mycoplasma Control</h3>
                <p style="font-size: 0.95rem; color: #64748b;">Rapid qPCR detection kits.</p>
            </a>
        </div>

        <!-- 4. Case Studies Card Marquee -->
        <div style="text-align: center; margin-bottom: 20px; margin-top: 40px;">
            <h2 style="margin-bottom: 10px;">Trusted by India's Top Institutes</h2>
        </div>
        
        <div class="marquee-container">
            <div class="marquee-content">
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"The Mycoplasma qPCR kit rivaled our imported standards, but arrived in 2 days instead of 3 weeks."</p>
                    <strong style="color: #0f172a;">— PI, Cell Biology, IISER Pune</strong>
                </div>
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"Switched to their Calcein AM for our high-throughput screens. The signal-to-noise ratio is fantastic."</p>
                    <strong style="color: #0f172a;">— Senior Scientist, NIPER</strong>
                </div>
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"The transparent batch validation and immediate technical support saved us a massive headache."</p>
                    <strong style="color: #0f172a;">— Postdoctoral Fellow, NCBS</strong>
                </div>
                <!-- Duplicates -->
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"The Mycoplasma qPCR kit rivaled our imported standards, but arrived in 2 days instead of 3 weeks."</p>
                    <strong style="color: #0f172a;">— PI, Cell Biology, IISER Pune</strong>
                </div>
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"Switched to their Calcein AM for our high-throughput screens. The signal-to-noise ratio is fantastic."</p>
                    <strong style="color: #0f172a;">— Senior Scientist, NIPER</strong>
                </div>
                <div class="testimonial-card">
                    <div style="color: #f59e0b; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"The transparent batch validation and immediate technical support saved us a massive headache."</p>
                    <strong style="color: #0f172a;">— Postdoctoral Fellow, NCBS</strong>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-bottom: 40px;">
            <a href="#testimonials" style="color: #3b82f6; font-weight: bold; text-decoration: none; font-size: 1.1rem;">Read All Case Studies &rarr;</a>
        </div>
    `;
}function renderTestimonialsPage() {
    const contentArea = document.getElementById('app-content');
    
    contentArea.innerHTML = `
        <style>
            @keyframes fadeSlideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .fade-up {
                animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                opacity: 0;
            }
            .review-box {
                background: white; border: 1px solid #e2e8f0; border-radius: 12px;
                padding: 35px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                border-left: 5px solid #3b82f6; transition: transform 0.3s;
            }
            .review-box:hover {
                transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05);
            }
        </style>

        <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, -apple-system, sans-serif;">
            
            <div class="fade-up" style="text-align: center; margin-bottom: 50px;">
                <h1 style="color: #0f172a; font-size: 2.5rem; margin-bottom: 15px;">Trusted by India's Top Labs</h1>
                <p style="color: #64748b; font-size: 1.1rem; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                    Hear directly from the principal investigators, postdoctoral researchers, and lab technicians who rely on Olirum Scientific reagents for their daily breakthroughs.
                </p>
            </div>

            <!-- Cellular Assays Section -->
            <div class="fade-up" style="animation-delay: 0.1s;">
                <h3 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Cellular Assays & Viability</h3>
                
                <div class="review-box">
                    <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-size: 1.1rem; color: #334155; line-height: 1.7; font-style: italic; margin-bottom: 25px;">
                        "We transitioned entirely to Olirum's Calcein AM kit for our toxicology screening pipeline. The signal strength is identical to the US brand we previously used, but we save about 40% on costs and don't have to worry about dry ice sublimating in customs."
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 45px; height: 45px; border-radius: 50%; background: #bbf7d0; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #166534; font-size: 1.1rem;">PK</div>
                            <div>
                                <div style="font-weight: bold; color: #0f172a;">Priya Kapoor</div>
                                <div style="font-size: 0.85rem; color: #64748b;">Senior Scientist, Biopharma Pvt Ltd</div>
                            </div>
                        </div>
                        <span style="font-size: 0.85rem; background: #f1f5f9; padding: 6px 12px; border-radius: 12px; color: #64748b; font-weight: 500;">Product: Calcein AM Viability</span>
                    </div>
                </div>
            </div>

            <!-- Contamination Control Section -->
            <div class="fade-up" style="animation-delay: 0.2s; margin-top: 40px;">
                <h3 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Contamination Control</h3>
                
                <div class="review-box" style="border-left-color: #f59e0b;">
                    <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-size: 1.1rem; color: #334155; line-height: 1.7; font-style: italic; margin-bottom: 25px;">
                        "The Mycoplasma Removal Reagent from Olirum is a game-changer. We previously relied on imported alternatives that took 4 weeks to arrive. This worked identically and arrived in 48 hours."
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 45px; height: 45px; border-radius: 50%; background: #bfdbfe; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e40af; font-size: 1.1rem;">AS</div>
                            <div>
                                <div style="font-weight: bold; color: #0f172a;">Dr. Amit Singh</div>
                                <div style="font-size: 0.85rem; color: #64748b;">Principal Investigator, IISER Pune</div>
                            </div>
                        </div>
                        <span style="font-size: 0.85rem; background: #f1f5f9; padding: 6px 12px; border-radius: 12px; color: #64748b; font-weight: 500;">Product: Mycoplasma Removal</span>
                    </div>
                </div>
            </div>

            <!-- Microscopy Section -->
            <div class="fade-up" style="animation-delay: 0.3s; margin-top: 40px;">
                <h3 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Microscopy & Support</h3>
                
                <div class="review-box" style="border-left-color: #10b981;">
                    <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
                    <p style="font-size: 1.1rem; color: #334155; line-height: 1.7; font-style: italic; margin-bottom: 25px;">
                        "Their confocal mounting media preserves our fluorescence signals for weeks. The fact that we can talk directly to the R&D team in Pune when we have technical questions is an incredible advantage."
                    </p>
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 45px; height: 45px; border-radius: 50%; background: #fbcfe8; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #9d174d; font-size: 1.1rem;">NM</div>
                            <div>
                                <div style="font-weight: bold; color: #0f172a;">Dr. Neha Menon</div>
                                <div style="font-size: 0.85rem; color: #64748b;">Postdoctoral Fellow, NIPER</div>
                            </div>
                        </div>
                        <span style="font-size: 0.85rem; background: #f1f5f9; padding: 6px 12px; border-radius: 12px; color: #64748b; font-weight: 500;">Product: Confocal Mounting Media</span>
                    </div>
                </div>
            </div>

        </div>
    `;
}
function toggleSearch(event) {
    event.stopPropagation(); 
    const searchWrapper = document.getElementById('dynamic-search-wrapper');
    const searchInput = document.getElementById('dynamic-search-input');
    
    // Toggle the width of the wrapper container
    if (searchWrapper.style.width === '0px' || searchWrapper.style.width === '') {
        searchWrapper.style.width = '280px';
        searchWrapper.style.opacity = '1';
        searchWrapper.style.visibility = 'visible';
        searchInput.focus();
    } else {
        searchWrapper.style.width = '0';
        searchWrapper.style.opacity = '0';
        searchWrapper.style.visibility = 'hidden';
    }
}

// Close the search bar if clicking anywhere else on the page
document.addEventListener('click', function(event) {
    const searchWrapper = document.getElementById('dynamic-search-wrapper');
    const searchIcon = document.getElementById('search-icon-btn');
    const searchInput = document.getElementById('dynamic-search-input');
    
    // Only close if the click is outside the wrapper, input, and icon
    if (!searchWrapper.contains(event.target) && event.target !== searchIcon) {
        searchWrapper.style.width = '0';
        searchWrapper.style.opacity = '0';
        searchWrapper.style.visibility = 'hidden';
    }
});
function removeItem(productId) {
    // Keep only the items that DO NOT match the deleted product's ID
    quoteCart = quoteCart.filter(item => item.id !== productId);
    
    // FIX: Changed from updateCartCount() to updateCartBadge()
    updateCartBadge();
    
    renderCartPage(); 
}
// --- BOOT SEQUENCE ---
initializeCatalog().then(() => {
    updateCartBadge();
    // FIX: This now triggers the router instead of forcing the home page!
    handleRouting(); 
});
// function renderHomePage() {
//     const contentArea = document.getElementById('app-content');
    
//     contentArea.innerHTML = `
//         <style>
//             /* Crossfade Animation for Hero Background */
//             @keyframes bannerFade {
//                 0%, 30% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
//                 33%, 63% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1576086213369-97a306d36557?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
//                 66%, 97% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
//                 100% { background-image: linear-gradient(rgba(15,23,42,0.7), rgba(15,23,42,0.8)), url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80'); }
//             }
            
//             .hero-banner {
//                 height: 500px;
//                 background-size: cover;
//                 background-position: center;
//                 animation: bannerFade 15s infinite;
//                 display: flex;
//                 flex-direction: column;
//                 justify-content: center;
//                 align-items: center;
//                 text-align: center;
//                 color: white;
//                 padding: 20px;
//             }

//             /* Horizontal Category Scroll */
//             .category-scroll {
//                 display: flex;
//                 overflow-x: auto;
//                 scroll-snap-type: x mandatory;
//                 gap: 20px;
//                 padding: 20px 0;
//                 /* Hide scrollbar for a cleaner look */
//                 -ms-overflow-style: none;  
//                 scrollbar-width: none;  
//             }
//             .category-scroll::-webkit-scrollbar { display: none; }
            
//             .cat-card {
//                 scroll-snap-align: start;
//                 min-width: 250px;
//                 height: 180px;
//                 background: #f8fafc;
//                 border-radius: 12px;
//                 display: flex;
//                 flex-direction: column;
//                 justify-content: center;
//                 align-items: center;
//                 text-align: center;
//                 cursor: pointer;
//                 transition: all 0.3s ease;
//                 border: 1px solid #e2e8f0;
//             }
//             .cat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); border-color: #3b82f6; }

//             /* Marquee Ticker for Reviews */
//             .ticker-wrap {
//                 width: 100%;
//                 overflow: hidden;
//                 background-color: #eff6ff;
//                 padding: 15px 0;
//                 border-top: 1px solid #bfdbfe;
//                 border-bottom: 1px solid #bfdbfe;
//             }
//             .ticker {
//                 display: inline-block;
//                 white-space: nowrap;
//                 animation: ticker 30s linear infinite;
//             }
//             @keyframes ticker {
//                 0% { transform: translate3d(0, 0, 0); }
//                 100% { transform: translate3d(-50%, 0, 0); }
//             }
//             .ticker-item {
//                 display: inline-block;
//                 padding: 0 40px;
//                 font-size: 1.05rem;
//                 color: #1e3a8a;
//             }
//         </style>

//         <!-- 1. Hero Banner -->
//         <div class="hero-banner">
//             <h1 style="font-size: 3.5rem; margin-bottom: 15px; animation: fadeSlideUp 1s ease-out;">Next-Gen Indian Reagents</h1>
//             <p style="font-size: 1.3rem; max-width: 600px; margin-bottom: 30px; animation: fadeSlideUp 1s ease-out 0.2s backwards;">Accelerating your biological research with high-purity, locally manufactured assays and kits.</p>
//             <button onclick="navigateTo('catalog')" style="padding: 15px 35px; font-size: 1.1rem; background: #3b82f6; color: white; border: none; border-radius: 30px; cursor: pointer; transition: background 0.3s; animation: fadeSlideUp 1s ease-out 0.4s backwards;" onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
//                 Explore Products &rarr;
//             </button>
//         </div>

//         <!-- 2. Horizontal Categories -->
//         <div style="max-width: 1200px; margin: 60px auto; padding: 0 20px;">
//             <h2 style="color: #0f172a; margin-bottom: 20px;">Browse by Application</h2>
//             <div class="category-scroll">
//                 <div class="cat-card" onclick="navigateTo('catalog')">
//                     <span style="font-size: 2.5rem; margin-bottom: 10px;">🔬</span>
//                     <h3 style="margin: 0; color: #1e40af;">Cell Viability</h3>
//                 </div>
//                 <div class="cat-card" onclick="navigateTo('catalog')">
//                     <span style="font-size: 2.5rem; margin-bottom: 10px;">🛡️</span>
//                     <h3 style="margin: 0; color: #1e40af;">Contamination Control</h3>
//                 </div>
//                 <div class="cat-card" onclick="navigateTo('catalog')">
//                     <span style="font-size: 2.5rem; margin-bottom: 10px;">⚡</span>
//                     <h3 style="margin: 0; color: #1e40af;">Oxidative Stress (ROS)</h3>
//                 </div>
//                 <div class="cat-card" onclick="navigateTo('catalog')">
//                     <span style="font-size: 2.5rem; margin-bottom: 10px;">📷</span>
//                     <h3 style="margin: 0; color: #1e40af;">Microscopy</h3>
//                 </div>
//             </div>
//         </div>

//         <!-- 3. Testimonials Ticker -->
//         <div class="ticker-wrap" style="margin-top: 40px;">
//             <div class="ticker">
//                 <!-- Duplicate content to make the infinite scroll seamless -->
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "The qPCR kit eliminated our false positives." - Dr. Sharma, IISc</div>
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "Saved us weeks of waiting on customs." - Lab Director, NIPER</div>
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "Calcein AM viability was perfectly reproducible." - Biotech Startup, Pune</div>
                
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "The qPCR kit eliminated our false positives." - Dr. Sharma, IISc</div>
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "Saved us weeks of waiting on customs." - Lab Director, NIPER</div>
//                 <div class="ticker-item">⭐⭐⭐⭐⭐ "Calcein AM viability was perfectly reproducible." - Biotech Startup, Pune</div>
//             </div>
//         </div>
//         <div style="text-align: center; margin-top: 15px;">
//             <a href="javascript:void(0)" onclick="navigateTo('testimonials')" style="color: #3b82f6; font-weight: bold; text-decoration: none;">Read all reviews &rarr;</a>
//         </div>
//     `;
// }
// function renderTestimonialsPage() {
//     const contentArea = document.getElementById('app-content');
    
//     contentArea.innerHTML = `
//         <div style="max-width: 1000px; margin: 0 auto; padding: 40px 20px;">
//             <div style="text-align: center; margin-bottom: 50px;">
//                 <h1 style="color: #0f172a; font-size: 2.5rem; margin-bottom: 15px;">Trusted by India's Top Labs</h1>
//                 <p style="color: #64748b; font-size: 1.1rem;">See how researchers are accelerating their workflows with Olirum Scientific.</p>
//             </div>

//             <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                
//                 <!-- Review 1 -->
//                 <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
//                     <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
//                     <p style="font-style: italic; color: #475569; line-height: 1.6; margin-bottom: 20px;">"The Mycoplasma Removal Reagent from Olirum is a game-changer. We previously relied on imported alternatives that took 4 weeks to arrive. This worked identically and arrived in 48 hours."</p>
//                     <div style="display: flex; align-items: center; gap: 15px;">
//                         <div style="width: 40px; height: 40px; border-radius: 50%; background: #bfdbfe; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1e40af;">AS</div>
//                         <div>
//                             <div style="font-weight: bold; color: #0f172a;">Dr. Amit Singh</div>
//                             <div style="font-size: 0.85rem; color: #64748b;">Principal Investigator, IISER Pune</div>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Review 2 -->
//                 <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
//                     <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
//                     <p style="font-style: italic; color: #475569; line-height: 1.6; margin-bottom: 20px;">"We switched to their DCFDA ROS kit for our high-throughput drug screening. The batch-to-batch consistency has been flawless, and the pricing allows us to scale our assays without budget concerns."</p>
//                     <div style="display: flex; align-items: center; gap: 15px;">
//                         <div style="width: 40px; height: 40px; border-radius: 50%; background: #bbf7d0; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #166534;">PK</div>
//                         <div>
//                             <div style="font-weight: bold; color: #0f172a;">Priya Kapoor</div>
//                             <div style="font-size: 0.85rem; color: #64748b;">Senior Scientist, Biopharma Pvt Ltd</div>
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Review 3 -->
//                 <div style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
//                     <div style="color: #f59e0b; font-size: 1.2rem; margin-bottom: 15px;">⭐⭐⭐⭐⭐</div>
//                     <p style="font-style: italic; color: #475569; line-height: 1.6; margin-bottom: 20px;">"Their confocal mounting media preserves our fluorescence signals for weeks. The fact that we can talk directly to the R&D team in Pune when we have technical questions is an incredible advantage."</p>
//                     <div style="display: flex; align-items: center; gap: 15px;">
//                         <div style="width: 40px; height: 40px; border-radius: 50%; background: #fbcfe8; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #9d174d;">NM</div>
//                         <div>
//                             <div style="font-weight: bold; color: #0f172a;">Dr. Neha Menon</div>
//                             <div style="font-size: 0.85rem; color: #64748b;">Postdoctoral Fellow, NIPER</div>
//                         </div>
//                     </div>
//                 </div>

//             </div>
//         </div>
//     `;
// }



//previous thing different design 
// function viewProduct(productId) {
//     document.getElementById('nav-links').classList.remove('active'); 
//     const contentArea = document.getElementById('app-content');
    
//     const product = allProductsCache.find(p => p.id === productId);
//     if (!product) {
//         contentArea.innerHTML = `<h2 style="color: red; text-align: center; padding: 40px;">Product not found</h2>`;
//         return;
//     }

//     // Default fallbacks for other catalog items, with full data loaded for MaRK (ID: 6)
//     let catNo = product.id === 6 ? "OS-MRK" : `OS-PROD-${product.id}`;
//     let storageTemp = product.id === 6 ? "-20°C" : "4°C";
//     let subTitle = product.id === 6 ? "Eliminating mycoplasma within 7 days" : "Premium Laboratory Reagent";
    
//     contentArea.innerHTML = `
//         <!-- Top Half: Presentation Block -->
//         <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
//             <!-- Left Column: Image Carousel Area -->
//             <div>
//                 <div style="background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; min-height: 350px; position: relative;">
//                     <span id="main-product-display-text" style="color: var(--text-light); font-size: 1.2rem; font-weight: 500;">🔬 Main Product View (Amber Tubes)</span>
//                 </div>
                
//                 <!-- Carousel Thumbnails -->
//                 <div style="display: flex; gap: 10px; margin-top: 15px;">
//                     <div onclick="document.getElementById('main-product-display-text').innerText='🔬 Main Product View (Amber Tubes)'" style="flex: 1; background: #e2e8f0; height: 60px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; text-align: center; font-weight: 600;">Pack</div>
//                     <div onclick="document.getElementById('main-product-display-text').innerText='📊 [Example Image] MCF10CA1a Cell Line Timeline (Days 1-5)'" style="flex: 1; background: #e2e8f0; height: 60px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; text-align: center; font-weight: 600;">MCF10CA1a</div>
//                     <div onclick="document.getElementById('main-product-display-text').innerText='📊 [Example Image] HEK293 Cell Line Timeline (Days 1-5)'" style="flex: 1; background: #e2e8f0; height: 60px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; text-align: center; font-weight: 600;">HEK293</div>
//                     <div onclick="document.getElementById('main-product-display-text').innerText='🖼️ [DAPI Stain] Before vs After Microscopic Clearance'" style="flex: 1; background: #e2e8f0; height: 60px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; text-align: center; font-weight: 600;">DAPI Stain</div>
//                 </div>
//             </div>
            
//             <!-- Right Column: Quick Info Box -->
//             <div style="display: flex; flex-direction: column; justify-content: space-between;">
//                 <div>
//                     <span style="color: var(--text-light); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px;">CAT NO. ${catNo}</span>
//                     <h1 style="font-size: 2.2rem; margin: 5px 0 10px 0; color: var(--primary-blue); font-family: 'Montserrat';">${product.name}</h1>
//                     <p style="font-style: italic; color: var(--accent-blue); margin-bottom: 15px; font-weight: 500;">${subTitle}</p>
                    
//                     <div style="display: flex; gap: 10px; margin-bottom: 25px;">
//                         <span style="background: #eff6ff; color: var(--accent-blue); padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">Store at ${storageTemp}</span>
//                         <span style="background: #f0fdf4; color: #16a34a; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">Research Use Only</span>
//                     </div>

//                     <p style="font-size: 1.8rem; font-weight: 700; color: var(--dark-slate); margin-bottom: 20px;">Lorem Price: ₹${product.price.toFixed(2)}</p>
//                 </div>
                
//                 <!-- B2B Order Form Box -->
//                 <div style="background: var(--light-bg); padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
//                     <div style="display: flex; gap: 15px; align-items: center;">
//                         <div style="display: flex; flex-direction: column; gap: 5px;">
//                             <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-main);">QUANTITY</label>
//                             <input type="number" id="qty-${product.id}" value="1" min="1" style="width: 70px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-weight: bold;">
//                         </div>
//                         <button class="btn-add-quote" style="margin-top: 18px; padding: 12px;" onclick="addToQuote(${product.id}, '${product.name}')">Add to Quote Cart</button>
//                     </div>
//                 </div>

//                 <!-- PDF Link -->
//                 <a href="#" onclick="showToast('Protocol PDF download started...', 'success')" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff; border: 1px solid #cbd5e1; color: var(--text-main); padding: 12px; border-radius: 6px; font-weight: 500; text-align: center; cursor: pointer; transition: var(--transition);">
//                     📄 Download Full Protocol Datasheet (PDF)
//                 </a>
//             </div>
//         </div>

//         <!-- Bottom Half: Technical Specifications Tabs -->
//         <div style="max-width: 1200px; margin: 30px auto 0 auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
//             <!-- Tab Headers -->
//             <div style="display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
//                 <button id="tab-btn-overview" onclick="switchTab('overview')" style="padding: 15px 25px; border: none; background: white; font-weight: 600; color: var(--primary-blue); border-right: 1px solid #e2e8f0; cursor: pointer;">Product Overview</button>
//                 <button id="tab-btn-protocol" onclick="switchTab('protocol')" style="padding: 15px 25px; border: none; background: transparent; font-weight: 600; color: var(--text-light); border-right: 1px solid #e2e8f0; cursor: pointer;">Method & Protocol</button>
//                 <button id="tab-btn-support" onclick="switchTab('support')" style="padding: 15px 25px; border: none; background: transparent; font-weight: 600; color: var(--text-light); cursor: pointer;">Troubleshooting & Support</button>
//             </div>

//             <!-- Tab Dynamic Box Context -->
//             <div id="tab-content-box" style="padding: 30px; line-height: 1.6; color: var(--text-main);">
//                 <!-- Default Tab content loaded directly -->
//                 ${getOverviewHTML(product.id)}
//             </div>
//         </div>
//     `;
// }

// // Global scope helpers for dealing with technical tab navigation
// window.switchTab = function(tabName) {
//     const box = document.getElementById('tab-content-box');
//     const btns = {
//         overview: document.getElementById('tab-btn-overview'),
//         protocol: document.getElementById('tab-btn-protocol'),
//         support: document.getElementById('tab-btn-support')
//     };

//     // Reset styles
//     for (let key in btns) {
//         if(btns[key]) {
//             btns[key].style.background = 'transparent';
//             btns[key].style.color = 'var(--text-light)';
//         }
//     }

//     // Highlight selected tab active header
//     if(btns[tabName]) {
//         btns[tabName].style.background = '#fff';
//         btns[tabName].style.color = 'var(--primary-blue)';
//     }

//     // Insert structured content text based on datasheet mapping
//     if (tabName === 'overview') {
//         box.innerHTML = getOverviewHTML(6);
//     } else if (tabName === 'protocol') {
//         box.innerHTML = `
//             <h3 style="margin-bottom: 10px; color: var(--dark-slate);">Treatment Regimen Method</h3>
//             <p style="margin-bottom: 15px;">The working concentration for MaRK is fully optimized across multiple vulnerable lines, utilizing a recommended dosage baseline of <strong>0.5 - 1.0 μl/ml</strong> volume-per-volume ratio.</p>
//             <h4 style="margin-bottom: 5px; color: var(--dark-slate);">1. Prepare Cells</h4>
//             <ul style="margin-left: 20px; margin-bottom: 15px;">
//                 <li>Completely aspirate old medium from contaminated cell growth vessel.</li>
//                 <li>Rinse monolayer structures twice using clean Phosphate-Buffered Saline (PBS) to clear excess cell debris and active surface contaminants.</li>
//             </ul>
//             <h4 style="margin-bottom: 5px; color: var(--dark-slate);">2. Treatment Setup</h4>
//             <ul style="margin-left: 20px; margin-bottom: 15px;">
//                 <li>Passage or split your actively dividing culture into freshly prepared growth media containing exactly <strong>1.0 μl/ml</strong> concentration of MaRK.</li>
//                 <li>Ensure targets are established explicitly within their exponential growth phase by planning seed distributions effectively.</li>
//             </ul>
//             <h4 style="margin-bottom: 5px; color: var(--dark-slate);">3. Maintenance & Timeline</h4>
//             <p>Every 3-4 days, run clean passage evaluations and refresh structural fluid tables with fresh MaRK-infused solutions consistently over a total timeframe spanning 2 weeks.</p>
//         `;
//     } else if (tabName === 'support') {
//         box.innerHTML = `
//             <h3 style="margin-bottom: 10px; color: var(--dark-slate);">Troubleshooting & Asset Guidelines</h3>
//             <p style="margin-bottom: 15px;"><strong>Handling Infection Severity:</strong> For heavy localized target density, add 1.0 μl of MaRK per ml of background medium. For lower initial structural threat tracking, maintain a lower baseline of 0.6 μl/ml. Always validate initial line tolerances across minor volumes before scaling dosages.</p>
//             <p style="margin-bottom: 15px;"><strong>Cellular Recovery:</strong> Certain lines may experience brief growth slowdown phases while undergoing direct treatments. Normal replication configurations typically recover completely once target context clearance is validated and active media additions cease.</p>
//             <div style="background: #fff8e1; border-left: 4px solid #ffb300; padding: 15px; border-radius: 4px; margin-top: 20px;">
//                 <strong>Technical Support:</strong> For analytical support inquiries, connection validation issues, or testing questions, reach our technical lab team directly at <a href="mailto:admin@olirumscience.com" style="color: var(--accent-blue); font-weight: 600;">admin@olirumscience.com</a>.
//             </div>
//         `;
//     }
// }

// function getOverviewHTML(id) {
//     return `
//         <h3 style="margin-bottom: 10px; color: var(--dark-slate);">Product Information & Background</h3>
//         <p style="margin-bottom: 15px;">MaRK™ (Mycoplasma Removal Kit) functions as a highly specific dual-inhibitor complex formulated to rapidly eliminate standard laboratory mycoplasma variants within 7 days. Designed to circumvent structural workflow limitations common to slow commercial alternatives, this sterile-filtered, cell culture-tested matrix clears targets comprehensively within brief intervention windows.</p>
//         <h4 style="margin-bottom: 10px; color: var(--dark-slate);">Advanced Mechanism Composition:</h4>
//         <ol style="margin-left: 20px; margin-bottom: 20px;">
//             <li><strong>Protein Synthesis Inhibitor:</strong> Disrupts targeted translation and core protein production loops inside localized mycoplasma cells.</li>
//             <li><strong>DNA Gyrase Inhibitor:</strong> Systematically blocks replication cycles unique to specific mycoplasma DNA profiles.</li>
//         </ol>
//         <p>Because these internal micro-components possess zero corresponding biological targets inside standard eukaryotic cells, treatment remains highly safe and localized for mammalian cell lines.</p>
//     `;
// }