const admin = require('firebase-admin');
const fs = require('fs');

// 1. Firebase Admin Initialization
// Ensure you have a service account key file or use environment variables in a CI/CD environment
// For local testing, download your service account key from Firebase Console -> Project Settings -> Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const BASE_URL = 'https://financecalculator.cloud';

// Helper: Generate Slug (Matches your main.js logic)
function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           
        .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\-]+/g, '') 
        .replace(/\-\-+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '');            
}

async function generateSitemap() {
    console.log('Generating sitemap...');

    const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/about', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
        { url: '/privacy', priority: '0.5', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    staticPages.forEach(page => {
        xml += `  <url>
`;
        xml += `    <loc>${BASE_URL}${page.url}</loc>
`;
        xml += `    <changefreq>${page.changefreq}</changefreq>
`;
        xml += `    <priority>${page.priority}</priority>
`;
        xml += `  </url>
`;
    });

    // Add dynamic posts from Firestore
    try {
        const snapshot = await db.collection('posts').get();
        snapshot.forEach(doc => {
            const post = doc.data();
            const slug = generateSlug(post.title);
            const lastMod = post.updatedAt ? post.updatedAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

            xml += `  <url>
`;
            xml += `    <loc>${BASE_URL}/post/${encodeURIComponent(slug)}</loc>
`;
            xml += `    <lastmod>${lastMod}</lastmod>
`;
            xml += `    <changefreq>weekly</changefreq>
`;
            xml += `    <priority>0.9</priority>
`;
            xml += `  </url>
`;
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
    }

    xml += `</urlset>`;

    fs.writeFileSync('sitemap.xml', xml);
    console.log('sitemap.xml has been generated successfully!');
}

generateSitemap().then(() => process.exit());
