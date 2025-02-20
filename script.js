function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.body.setAttribute('data-theme', savedTheme);
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// Remove old reading time tracking
// Delete these functions and their calls:
// - updateReadingTime()
// - incrementReadingTime()
// - setTimeout for midnight reset

// Weather widget with IP-based location
async function getWeather() {
    const weatherInfo = document.getElementById('weatherInfo');
    weatherInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    try {
        const API_KEY = '6e5d3e33659f4d80a4053045252002';
        
        // First try IP-based weather
        try {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=auto:ip`
            );
            
            if (!response.ok) throw new Error('IP location failed');
            
            const data = await response.json();
            displayWeather(data, weatherInfo);
            return; // Exit if IP-based weather succeeds
        } catch (ipError) {
            console.log('IP-based weather failed, trying geolocation...');
        }

        // Fallback to stored geolocation if available
        let latitude = localStorage.getItem('weatherLat');
        let longitude = localStorage.getItem('weatherLong');
        
        if (latitude && longitude) {
            const response = await fetch(
                `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${latitude},${longitude}`
            );
            
            if (response.ok) {
                const data = await response.json();
                displayWeather(data, weatherInfo);
                return;
            }
        }

        // If all else fails, show generic message
        weatherInfo.innerHTML = '<i class="fas fa-cloud"></i> Weather unavailable';
        
    } catch (error) {
        console.error('Weather error:', error);
        weatherInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Weather error';
    }
}

// Update displayWeather function
function displayWeather(data, element) {
    const isMobile = window.innerWidth <= 768;
    const temp = Math.round(data.current.temp_c); // Round temperature
    if (isMobile) {
        // Show just temperature and icon for mobile
        element.innerHTML = `${temp}°`;
    } else {
        // Show full weather info for desktop
        element.innerHTML = `${temp}°C ${data.current.condition.text}`;
    }
}

// Add function to reset location data if needed
function resetWeatherLocation() {
    localStorage.removeItem('weatherLat');
    localStorage.removeItem('weatherLong');
    getWeather(); // Request location again
}

// Add resize listener to update display format
window.addEventListener('resize', () => {
    getWeather();
});

// Check which page we're on
const isAdmin = window.location.pathname.includes('admin.html');
const isPost = window.location.pathname.includes('post.html');

// Initialize blogs array from localStorage
let blogs = JSON.parse(localStorage.getItem('blogs')) || [];

// Initialize features
document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    getWeather();
});

// Remove all newsletter-related code and event listeners
if (isAdmin) {
    // Handle blog form submission
    document.getElementById('blogForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const category = document.getElementById('category').value;
        const id = Date.now().toString();
        
        blogs.push({ 
            id, 
            title, 
            content, 
            category,
            date: new Date().toLocaleDateString() 
        });
        localStorage.setItem('blogs', JSON.stringify(blogs));
        
        alert('Blog posted successfully!');
        document.getElementById('blogForm').reset();
    });
} else if (isPost) {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    const post = blogs.find(blog => blog.id === postId);
    if (post) {
        // Format the content with paragraphs
        const formattedContent = post.content
            .split('\n')
            .filter(para => para.trim() !== '') // Remove empty paragraphs
            .map(para => `<p>${para}</p>`)
            .join('');

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postContent').innerHTML = formattedContent;
        document.getElementById('postDate').textContent = post.date;
        document.getElementById('postCategory').textContent = getCategoryLabel(post.category);
        
        const readTime = calculateReadingTime(post.content);
        document.querySelector('.read-time').textContent = `${readTime} min read`;
    }

    // Initialize share button functionality
    const shareBtn = document.getElementById('shareBtn');
    const shareOptions = document.getElementById('shareOptions');
    
    // Simple share toggle
    if (shareBtn && shareOptions) {
        // Toggle share menu
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            shareOptions.classList.toggle('active');
        });
        
        // Close share menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.share-container')) {
                shareOptions.classList.remove('active');
            }
        });
        
        // Share handlers
        const shareHandlers = {
            whatsapp: (url, title) => `https://wa.me/?text=${encodeURIComponent(`📚 ${title}\n\n${url}`)}`,
            facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(`📚 ${title}`)}&url=${encodeURIComponent(url)}`,
            linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            copylink: (url, title) => {
                navigator.clipboard.writeText(`📚 ${title}\n${url}`);
                alert('Link copied to clipboard!');
                return null;
            }
        };

        // Share function
        window.share = function(platform) {
            const url = window.location.href;
            const title = document.getElementById('postTitle').textContent;
            
            const shareUrl = shareHandlers[platform]?.(url, title);
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
            
            shareOptions.classList.remove('active');
        };
    }
} else {
    // Main page functionality
    let currentCategory = 'all';

    function calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }

    function displayBlogs(blogsToShow) {
        const blogList = document.getElementById('blogList');
        blogList.innerHTML = '';
        
        blogsToShow.forEach(blog => {
            const readTime = calculateReadingTime(blog.content);
            const blogItem = document.createElement('div');
            blogItem.className = 'blog-item';
            blogItem.innerHTML = `
                <span class="category-label">${getCategoryLabel(blog.category)}</span>
                <h2>${blog.title}</h2>
                <div class="blog-meta">
                    <span>Published on ${blog.date}</span>
                    <span>・ ${readTime} min read</span>
                </div>
                <p>${blog.content.substring(0, 150)}...</p>
            `;
            blogItem.addEventListener('click', () => {
                window.location.href = `post.html?id=${blog.id}`;
            });
            blogList.appendChild(blogItem);
        });
    }

    function getCategoryLabel(category) {
        const labels = {
            'childhood': 'Childhood Memories',
            'travel': 'Travel Stories',
            'life-lessons': 'Life Lessons',
            'relationships': 'Relationships',
            'personal': 'Personal Growth',
            'daily': 'Daily Life'
        };
        return labels[category] || category;
    }

    // Replace category button functionality with select functionality
    document.getElementById('categoryFilter').addEventListener('change', function(e) {
        currentCategory = e.target.value;
        filterBlogs();
    });

    function filterBlogs() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        let filteredBlogs = blogs;
        
        if (currentCategory !== 'all') {
            filteredBlogs = filteredBlogs.filter(blog => blog.category === currentCategory);
        }
        
        filteredBlogs = filteredBlogs.filter(blog => 
            blog.title.toLowerCase().includes(searchTerm) ||
            blog.content.toLowerCase().includes(searchTerm)
        );
        
        displayBlogs(filteredBlogs);
    }

    // Update search functionality
    document.getElementById('searchInput').addEventListener('input', filterBlogs);

    // Initial display of blogs
    displayBlogs(blogs);
}

// Simple share functionality
function toggleShare(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const menu = document.getElementById('shareMenu');
    menu.classList.toggle('show');
    
    // Handle clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeShareMenu);
        }, 0);
    }
}

function closeShareMenu(e) {
    if (!e.target.closest('.share-wrap')) {
        const menu = document.getElementById('shareMenu');
        menu.classList.remove('show');
        document.removeEventListener('click', closeShareMenu);
    }
}

function sharePost(platform) {
    const url = window.location.href;
    const title = document.getElementById('postTitle').textContent;
    const text = `📖 Check out this amazing article: "${title}"`;
    
    const shareData = {
        whatsapp: {
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`,
            newWindow: true
        },
        facebook: {
            url: `https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
            newWindow: true
        },
        x: {
            url: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            newWindow: true
        },
        linkedin: {
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            newWindow: true
        },
        copy: {
            action: async () => {
                try {
                    await navigator.clipboard.writeText(`${text}\n\n${url}`);
                    alert('Link copied to clipboard! 📋');
                } catch (err) {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = `${text}\n\n${url}`;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('Link copied to clipboard! 📋');
                }
            }
        }
    };

    try {
        const share = shareData[platform];
        if (share.newWindow) {
            window.open(share.url, '_blank', 'width=600,height=500,scrollbars=yes');
        } else if (share.action) {
            share.action();
        }
    } catch (error) {
        console.error('Share failed:', error);
        alert('Unable to share. Please try copying the link instead.');
    }

    // Close share menu
    document.getElementById('shareMenu').classList.remove('show');
    return false;
}
